import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type ComponentRef,
} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  Modal,
  Share,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import {
  ALL_BOOKS_META,
  getBookMetaById,
  loadBookById,
  loadBookByIdAsync,
} from '@/data/writers';
import type { Book, Chapter, ReaderSettings, ThemeMode } from '@/types/library';
import { RADIUS, SPACING, TOUCH_TARGET } from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { THEMES, ThemeId } from '@/constants/Themes';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { useReaderTheme } from '@/context/ThemeContext';
import { StorageService } from '@/services/storage';
import { hapticImpact, hapticSelection } from '@/utils/haptics';

const PARAGRAPH_GAP_MAP: Record<ReaderSettings['paragraphSpacing'], number> = {
  compact: 12,
  normal: 18,
  relaxed: 26,
};

const MARGIN_MAP: Record<ReaderSettings['marginSize'], number> = {
  narrow: 14,
  normal: 22,
  wide: 32,
};

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 15,
};

interface ParagraphRowProps {
  text: string;
  index: number;
  isBookmarked: boolean;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  textAlign: 'left' | 'justify';
  textColor: string;
  accentColor: string;
  paragraphGap: number;
  firstLineIndent: boolean;
  onToggleChrome: () => void;
  onLongPress: (index: number, text: string) => void;
}

const ParagraphRow = React.memo(function ParagraphRow({
  text,
  index,
  isBookmarked,
  fontSize,
  lineHeight,
  fontFamily,
  textAlign,
  textColor,
  accentColor,
  paragraphGap,
  firstLineIndent,
  onToggleChrome,
  onLongPress,
}: ParagraphRowProps) {
  const displayText = firstLineIndent ? `    ${text}` : text;
  return (
    <Pressable
      onPress={onToggleChrome}
      onLongPress={() => onLongPress(index, text)}
      delayLongPress={320}
      style={[
        styles.paragraphBlock,
        { marginBottom: paragraphGap },
        isBookmarked && {
          borderLeftWidth: 3,
          borderLeftColor: accentColor,
          paddingLeft: 12,
          backgroundColor: 'rgba(185, 77, 37, 0.06)',
          borderRadius: 6,
          paddingVertical: 4,
        },
      ]}>
      <Text
        style={{
          fontSize,
          lineHeight,
          color: textColor,
          fontFamily,
          textAlign,
        }}>
        {fontFamily === FONTS.serifRegular ? displayText : renderWithNotoNumbers(displayText)}
      </Text>
    </Pressable>
  );
});

export default function ReaderScreen() {
  useKeepAwake();

  const { id, initialChapter, initialParagraph } = useLocalSearchParams<{
    id: string;
    initialChapter?: string;
    initialParagraph?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, themeId, themeMode, setThemeMode } = useReaderTheme();

  const targetBookId = id || ALL_BOOKS_META[0]?.id;
  const targetBookMeta = useMemo(
    () => (targetBookId ? getBookMetaById(targetBookId) : undefined),
    [targetBookId]
  );
  const syncBook = useMemo(
    () => (targetBookId ? loadBookById(targetBookId) : undefined),
    [targetBookId]
  );
  const [asyncBook, setAsyncBook] = useState<Book | undefined>(undefined);

  useEffect(() => {
    if (syncBook || !targetBookId) return;
    let active = true;
    loadBookByIdAsync(targetBookId).then((loaded) => {
      if (active) setAsyncBook(loaded);
    });
    return () => {
      active = false;
    };
  }, [syncBook, targetBookId]);

  const currentBook = syncBook ?? (asyncBook?.id === targetBookId ? asyncBook : undefined);

  const initialSeq = initialChapter ? parseInt(initialChapter, 10) : 1;
  const initialParaNum = initialParagraph ? parseInt(initialParagraph, 10) : 0;

  const [currentChapterIndex, setCurrentChapterIndex] = useState(
    Math.max(0, (Number.isNaN(initialSeq) ? 1 : initialSeq) - 1)
  );
  const [fontSize, setFontSize] = useState(19);
  const [lineHeightMultiplier, setLineHeightMultiplier] = useState(2.0);
  const [isSerif, setIsSerif] = useState(true);
  const [textAlign, setTextAlign] = useState<'left' | 'justify'>('left');
  const [paragraphSpacing, setParagraphSpacing] =
    useState<ReaderSettings['paragraphSpacing']>('normal');
  const [marginSize, setMarginSize] =
    useState<ReaderSettings['marginSize']>('normal');
  const [firstLineIndent, setFirstLineIndent] = useState(false);

  const [showTocModal, setShowTocModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [actionParagraph, setActionParagraph] = useState<{
    index: number;
    text: string;
  } | null>(null);
  const [bookmarkedParagraphs, setBookmarkedParagraphs] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isChromeVisible, setIsChromeVisible] = useState(true);

  const chromeValue = useSharedValue(1);
  const progressShared = useSharedValue(0);
  const readerBlurTargetRef = useRef<ComponentRef<typeof BlurTargetView>>(null);
  const isChromeVisibleRef = useRef(true);
  const bookIdRef = useRef<string | null>(null);
  const chapterNumRef = useRef(1);
  const lastScrollY = useRef(0);
  const progressRef = useRef(0);
  const topParagraphRef = useRef(Number.isNaN(initialParaNum) ? 0 : initialParaNum);
  const lastSavedAtRef = useRef(0);
  const flatListRef = useRef<FlatList<string>>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredForKeyRef = useRef<string | null>(null);

  const bookChapters: Chapter[] = useMemo(() => {
    if (currentBook && currentBook.chapters.length > 0) {
      return currentBook.chapters;
    }
    return [
      {
        number: 1,
        title: 'পাঠ্য লোড হচ্ছে',
        displayTitle: 'পাঠ্য লোড হচ্ছে',
        readMinutes: 1,
        paragraphs: ['পাঠ্য প্রস্তুত করা হচ্ছে...'],
      },
    ];
  }, [currentBook]);

  const currentChapter: Chapter =
    bookChapters[currentChapterIndex] || bookChapters[0];
  const nextChapter =
    currentChapterIndex < bookChapters.length - 1
      ? bookChapters[currentChapterIndex + 1]
      : null;

  const estimatedMinutes = useMemo(() => {
    if (currentChapter.readMinutes) return currentChapter.readMinutes;
    const words = currentChapter.paragraphs.reduce(
      (sum, p) => sum + p.split(/\s+/).length,
      0
    );
    return Math.max(1, Math.round(words / 160));
  }, [currentChapter]);

  useEffect(() => {
    isChromeVisibleRef.current = isChromeVisible;
    chromeValue.value = withTiming(isChromeVisible ? 1 : 0, { duration: 190 });
  }, [isChromeVisible, chromeValue]);

  useEffect(() => {
    bookIdRef.current = currentBook?.id ?? null;
    chapterNumRef.current = currentChapter.number;
  }, [currentBook?.id, currentChapter.number]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressShared.value}%`,
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - chromeValue.value) * -110 }],
    opacity: chromeValue.value,
  }));

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - chromeValue.value) * 120 }],
    opacity: chromeValue.value,
  }));

  useEffect(() => {
    StorageService.getReaderSettings().then((settings) => {
      setFontSize(settings.fontSize);
      setLineHeightMultiplier(settings.lineHeightMultiplier);
      setIsSerif(settings.fontFamily === 'serif');
      setTextAlign(settings.textAlign || 'left');
      setParagraphSpacing(settings.paragraphSpacing || 'normal');
      setMarginSize(settings.marginSize || 'normal');
      setFirstLineIndent(Boolean(settings.firstLineIndent));
    });
  }, []);

  useEffect(() => {
    if (!currentBook) return;
    StorageService.saveReadingPosition(
      currentBook.id,
      currentChapter.number,
      topParagraphRef.current,
      progressRef.current
    );
    StorageService.getBookmarks().then((list) => {
      const chapterBms = list
        .filter(
          (b) =>
            b.bookId === currentBook.id &&
            b.chapterSequence === currentChapter.number
        )
        .map((b) => b.paragraphIndex);
      setBookmarkedParagraphs(chapterBms);
    });

    const restoreKey = `${currentBook.id}:${currentChapter.number}`;
    if (
      restoredForKeyRef.current !== restoreKey &&
      initialParaNum > 0 &&
      initialChapter &&
      parseInt(initialChapter, 10) === currentChapter.number &&
      initialParaNum < currentChapter.paragraphs.length
    ) {
      restoredForKeyRef.current = restoreKey;
      const t = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialParaNum,
          animated: false,
        });
      }, 120);
      return () => clearTimeout(t);
    }
    restoredForKeyRef.current = restoreKey;
  }, [currentBook, currentChapter.number, currentChapter.paragraphs.length, initialChapter, initialParaNum]);

  useEffect(() => {
    return () => {
      if (currentBook) {
        StorageService.saveReadingPosition(
          currentBook.id,
          currentChapter.number,
          topParagraphRef.current,
          progressRef.current
        );
      }
    };
  }, [currentBook, currentChapter.number]);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2000);
  }, []);

  const handleToggleChrome = useCallback(() => {
    hapticSelection();
    setIsChromeVisible((v) => !v);
  }, []);

  const handleChapterChange = useCallback(
    (index: number) => {
      if (index < 0 || index >= bookChapters.length) return;
      hapticSelection();
      setCurrentChapterIndex(index);
      setShowTocModal(false);
      progressRef.current = 0;
      progressShared.set(0);
      topParagraphRef.current = 0;
      setReadingProgress(0);
      lastScrollY.current = 0;
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      if (currentBook) {
        StorageService.saveReadingPosition(
          currentBook.id,
          bookChapters[index].number,
          0,
          0
        );
      }
      setIsChromeVisible(true);
    },
    [bookChapters, currentBook, progressShared]
  );

  const handleFontSizeChange = (delta: number) => {
    hapticSelection();
    const nextSize = Math.max(15, Math.min(30, fontSize + delta));
    setFontSize(nextSize);
    StorageService.saveReaderSettings({ fontSize: nextSize });
    showToast(`হরফের আকার: ${toBanglaNumber(nextSize)}`);
  };

  const handleFontSizeSliderChange = (val: number) => {
    setFontSize(val);
  };

  const handleFontSizeSlidingComplete = (val: number) => {
    setFontSize(val);
    StorageService.saveReaderSettings({ fontSize: val });
  };

  const handleLineHeightSliderChange = (val: number) => {
    const rounded = Math.round(val * 10) / 10;
    setLineHeightMultiplier(rounded);
  };

  const handleLineHeightSlidingComplete = (val: number) => {
    const rounded = Math.round(val * 10) / 10;
    setLineHeightMultiplier(rounded);
    StorageService.saveReaderSettings({ lineHeightMultiplier: rounded });
  };

  const handleSetFontFamily = (serif: boolean) => {
    hapticSelection();
    setIsSerif(serif);
    StorageService.saveReaderSettings({
      fontFamily: serif ? 'serif' : 'sans-serif',
    });
  };

  const handleSetTextAlign = (align: 'left' | 'justify') => {
    hapticSelection();
    setTextAlign(align);
    StorageService.saveReaderSettings({ textAlign: align });
  };

  const handleSetParagraphSpacing = (
    spacing: ReaderSettings['paragraphSpacing']
  ) => {
    hapticSelection();
    setParagraphSpacing(spacing);
    StorageService.saveReaderSettings({ paragraphSpacing: spacing });
  };

  const handleSetMarginSize = (margin: ReaderSettings['marginSize']) => {
    hapticSelection();
    setMarginSize(margin);
    StorageService.saveReaderSettings({ marginSize: margin });
  };

  const handleToggleIndent = () => {
    hapticSelection();
    const next = !firstLineIndent;
    setFirstLineIndent(next);
    StorageService.saveReaderSettings({ firstLineIndent: next });
  };

  const handleLongPressParagraph = useCallback((index: number, text: string) => {
    hapticImpact();
    setActionParagraph({ index, text });
  }, []);

  const handleToggleBookmarkForAction = async () => {
    if (!currentBook || !actionParagraph) return;
    const { index, text } = actionParagraph;
    setActionParagraph(null);
    const isAlready = bookmarkedParagraphs.includes(index);
    if (isAlready) {
      const list = await StorageService.getBookmarks();
      const target = list.find(
        (b) =>
          b.bookId === currentBook.id &&
          b.chapterSequence === currentChapter.number &&
          b.paragraphIndex === index
      );
      if (target) {
        await StorageService.removeBookmark(target.id);
        setBookmarkedParagraphs((prev) => prev.filter((i) => i !== index));
        showToast('বুকমার্ক সরানো হয়েছে');
      }
    } else {
      await StorageService.addBookmark({
        bookId: currentBook.id,
        bookTitle: currentBook.title,
        chapterSequence: currentChapter.number,
        chapterTitle: currentChapter.displayTitle || currentChapter.title,
        paragraphIndex: index,
        quoteSnippet: text.slice(0, 140),
      });
      setBookmarkedParagraphs((prev) => [...prev, index]);
      showToast('অনুচ্ছেদটি বুকমার্কে সংরক্ষিত হয়েছে');
    }
  };

  const handleShareParagraph = async () => {
    if (!currentBook || !actionParagraph) return;
    const { text } = actionParagraph;
    setActionParagraph(null);
    try {
      await Share.share({
        message: `“${text}”\n— ${currentBook.author} (${currentBook.title})`,
      });
    } catch {
      // ignore
    }
  };

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { index?: number | null }[] }) => {
      if (viewableItems.length > 0 && typeof viewableItems[0].index === 'number') {
        topParagraphRef.current = viewableItems[0].index;
      }
    },
    []
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const total = contentSize.height - layoutMeasurement.height;
      if (total > 0) {
        const pct = Math.min(100, Math.max(0, Math.round((contentOffset.y / total) * 100)));
        if (pct !== progressRef.current) {
          progressRef.current = pct;
          progressShared.set(pct);
        }
      }

      const currentY = contentOffset.y;
      if (currentY > lastScrollY.current + 50 && currentY > 100 && isChromeVisibleRef.current) {
        isChromeVisibleRef.current = false;
        setIsChromeVisible(false);
      } else if (currentY < lastScrollY.current - 60 && !isChromeVisibleRef.current) {
        isChromeVisibleRef.current = true;
        setIsChromeVisible(true);
      }
      lastScrollY.current = currentY;
    },
    [progressShared]
  );

  const commitScrollProgress = useCallback(() => {
    setReadingProgress(progressRef.current);
    const bId = bookIdRef.current;
    if (bId) {
      lastSavedAtRef.current = Date.now();
      StorageService.saveReadingPosition(
        bId,
        chapterNumRef.current,
        topParagraphRef.current,
        progressRef.current
      );
    }
  }, []);

  const calculatedLineHeight = Math.round(fontSize * lineHeightMultiplier);
  const proseFontFamily = isSerif ? FONTS.serifRegular : FONTS.sansRegular;
  const headingFontFamily = isSerif ? FONTS.serifBold : FONTS.sansBold;
  const paragraphGap = PARAGRAPH_GAP_MAP[paragraphSpacing];
  const horizontalPad = MARGIN_MAP[marginSize];

  const bookTitle = currentBook?.title || targetBookMeta?.title || 'পাঠ্য';
  const bookAuthor = currentBook?.author || targetBookMeta?.author || '';
  const chapterDisplayTitle = currentChapter.displayTitle || currentChapter.title;

  const chapterHeader = useMemo(
    () => (
      <Pressable onPress={handleToggleChrome} style={styles.chapterHeader}>
        <View
          style={[
            styles.chapterMetaPill,
            { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
          ]}>
          <Text style={[styles.chapterMetaText, { color: theme.textSecondary }]}>
            {renderWithNotoNumbers(
              `পর্ব ${toBanglaNumber(currentChapter.number)} / ${toBanglaNumber(bookChapters.length)} • প্রায় ${toBanglaNumber(estimatedMinutes)} মিনিট`
            )}
          </Text>
        </View>

        <Text
          style={[
            styles.chapterTitleMain,
            { color: theme.textPrimary, fontFamily: headingFontFamily },
          ]}>
          {chapterDisplayTitle}
        </Text>

        {bookAuthor ? (
          <Text style={[styles.chapterAuthorLine, { color: theme.textMuted }]}>
            {bookAuthor}
          </Text>
        ) : null}

        <View style={[styles.chapterDivider, { backgroundColor: theme.accentTerracotta }]} />
      </Pressable>
    ),
    [
      handleToggleChrome,
      theme,
      currentChapter.number,
      bookChapters.length,
      estimatedMinutes,
      headingFontFamily,
      chapterDisplayTitle,
      bookAuthor,
    ]
  );

  const chapterFooter = useMemo(
    () => (
      <View>
        <View style={styles.bookEndMarkWrap}>
          <Text style={[styles.bookEndMark, { color: theme.borderStrong }]}>
            — ❖ —
          </Text>
          <Text style={[styles.bookmarkTipText, { color: theme.textMuted }]}>
            বুকমার্ক বা শেয়ার করতে যেকোনো অনুচ্ছেদে কিছুক্ষণ চেপে ধরুন
          </Text>
        </View>

        {nextChapter && (
          <Pressable
            onPress={() => handleChapterChange(currentChapterIndex + 1)}
            style={[
              styles.nextChapterCard,
              { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
            ]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nextLabel, { color: theme.accentTerracotta }]}>
                পরবর্তী পর্ব
              </Text>
              <Text numberOfLines={1} style={[styles.nextTitle, { color: theme.textPrimary }]}>
                {nextChapter.displayTitle || nextChapter.title}
              </Text>
              {nextChapter.readMinutes ? (
                <Text style={[styles.nextMeta, { color: theme.textMuted }]}>
                  {renderWithNotoNumbers(`প্রায় ${toBanglaNumber(nextChapter.readMinutes)} মিনিট পাঠ`)}
                </Text>
              ) : null}
            </View>
            <Ionicons name="arrow-forward" size={18} color={theme.accentTerracotta} />
          </Pressable>
        )}

        <View style={[styles.chapterEndNav, { borderTopColor: theme.borderSubtle }]}>
          {currentChapterIndex > 0 ? (
            <Pressable
              onPress={() => handleChapterChange(currentChapterIndex - 1)}
              style={[
                styles.chapterNavBtn,
                { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
              ]}>
              <Ionicons name="chevron-back" size={16} color={theme.accentTerracotta} />
              <Text style={[styles.chapterNavBtnText, { color: theme.textPrimary }]}>
                পূর্ববর্তী পর্ব
              </Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {nextChapter && (
            <Pressable
              onPress={() => handleChapterChange(currentChapterIndex + 1)}
              style={[
                styles.chapterNavBtn,
                { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
              ]}>
              <Text style={[styles.chapterNavBtnText, { color: theme.textPrimary }]}>
                পরবর্তী পর্ব
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.accentTerracotta} />
            </Pressable>
          )}
        </View>
      </View>
    ),
    [theme, nextChapter, currentChapterIndex, handleChapterChange]
  );

  const renderParagraph = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <ParagraphRow
        text={item}
        index={index}
        isBookmarked={bookmarkedParagraphs.includes(index)}
        fontSize={fontSize}
        lineHeight={calculatedLineHeight}
        fontFamily={proseFontFamily}
        textAlign={textAlign}
        textColor={theme.textPrimary}
        accentColor={theme.accentTerracotta}
        paragraphGap={paragraphGap}
        firstLineIndent={firstLineIndent}
        onToggleChrome={handleToggleChrome}
        onLongPress={handleLongPressParagraph}
      />
    ),
    [
      bookmarkedParagraphs,
      fontSize,
      calculatedLineHeight,
      proseFontFamily,
      textAlign,
      theme.textPrimary,
      theme.accentTerracotta,
      paragraphGap,
      firstLineIndent,
      handleToggleChrome,
      handleLongPressParagraph,
    ]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <StatusBar style={themeId === 'deep-forest' ? 'light' : 'dark'} />

      <BlurTargetView ref={readerBlurTargetRef} style={styles.container}>
        {theme.hasPaperTexture && (
          <Image
            source={require('@/assets/images/book-paper-texture.png')}
            resizeMode="repeat"
            style={styles.paperTextureBg}
            pointerEvents="none"
          />
        )}

        {/* Virtualized Paragraph FlatList */}
        <FlatList
          ref={flatListRef}
          data={currentChapter.paragraphs}
          keyExtractor={(_, idx) => `${currentChapter.number}-${idx}`}
          renderItem={renderParagraph}
          extraData={`${proseFontFamily}-${fontSize}-${calculatedLineHeight}-${textAlign}-${paragraphGap}-${firstLineIndent}-${themeId}-${bookmarkedParagraphs.length}`}
          ListHeaderComponent={chapterHeader}
          ListFooterComponent={chapterFooter}
          onScroll={handleScroll}
          onScrollEndDrag={commitScrollProgress}
          onMomentumScrollEnd={commitScrollProgress}
          scrollEventThrottle={16}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={VIEWABILITY_CONFIG}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={40}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          onScrollToIndexFailed={() => {
            // Safe no-op fallback if layout not measured yet
          }}
          contentContainerStyle={[
            styles.readingScrollContent,
            {
              paddingHorizontal: horizontalPad,
              paddingTop: insets.top + 86,
              paddingBottom: insets.bottom + 120,
            },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </BlurTargetView>

      {/* Top Reading Progress Bar */}
      <View
        style={[
          styles.progressTrack,
          { top: insets.top, backgroundColor: theme.borderSubtle },
        ]}>
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: theme.accentTerracotta },
            progressBarStyle,
          ]}
        />
      </View>

      {/* Top Floating Liquid-Glass Header Island */}
      <Animated.View
        style={[
          styles.animatedHeader,
          { top: insets.top + 8 },
          headerAnimatedStyle,
        ]}
        pointerEvents={isChromeVisible ? 'auto' : 'none'}>
        <GlassSurface
          radius={24}
          intensity={72}
          elevation="e2"
          themeOverride={theme}
          blurTarget={readerBlurTargetRef}
          contentStyle={styles.glassHeader}>
          <View style={styles.headerInnerRow}>
            <Pressable
              onPress={() => {
                hapticSelection();
                router.back();
              }}
              hitSlop={4}
              accessibilityLabel="ফিরে যান"
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(30,25,20,0.055)',
                  borderColor: theme.glassRimTop,
                },
              ]}>
              <Ionicons name="arrow-back" size={19} color={theme.textPrimary} />
            </Pressable>

            <Pressable
              onPress={() => {
                hapticSelection();
                setShowTocModal(true);
              }}
              accessibilityLabel="সূচিপত্র খুলুন"
              style={styles.titleCenter}>
              <Text numberOfLines={1} style={[styles.bookHeaderTitle, { color: theme.textPrimary }]}>
                {bookTitle}
              </Text>
              <Text numberOfLines={1} style={[styles.chapterHeaderSubtitle, { color: theme.textMuted }]}>
                {renderWithNotoNumbers(`${chapterDisplayTitle} • ${toBanglaNumber(readingProgress)}%`)}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                hapticSelection();
                setShowTocModal(true);
              }}
              hitSlop={4}
              accessibilityLabel="সূচিপত্র"
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(30,25,20,0.055)',
                  borderColor: theme.glassRimTop,
                },
              ]}>
              <Ionicons name="list" size={18} color={theme.accentTerracotta} />
            </Pressable>
          </View>
        </GlassSurface>
      </Animated.View>

      {/* Bottom Floating Liquid-Glass Control Pill */}
      <Animated.View
        style={[
          styles.animatedBottomPill,
          { bottom: Math.max(insets.bottom, 12) + 8 },
          pillAnimatedStyle,
        ]}
        pointerEvents={isChromeVisible ? 'auto' : 'none'}>
        <GlassSurface
          radius={RADIUS.pill}
          intensity={74}
          elevation="e2"
          themeOverride={theme}
          blurTarget={readerBlurTargetRef}
          contentStyle={styles.floatingControlPill}>
          {/* Prev Chapter */}
          <Pressable
            onPress={() => handleChapterChange(currentChapterIndex - 1)}
            disabled={currentChapterIndex === 0}
            accessibilityLabel="পূর্ববর্তী পর্ব"
            style={[
              styles.pillChapterBtn,
              { opacity: currentChapterIndex === 0 ? 0.35 : 1 },
            ]}>
            <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
          </Pressable>

          <View style={[styles.controlDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Theme Dots */}
          <View style={styles.themeDotsGroup}>
            {(Object.keys(THEMES) as ThemeId[]).map((tId) => {
              const tItem = THEMES[tId];
              const isActive = themeMode === tId;
              return (
                <Pressable
                  key={tId}
                  onPress={() => {
                    hapticSelection();
                    setThemeMode(tId);
                  }}
                  accessibilityLabel={`থিম: ${tItem.nameBangla}`}
                  hitSlop={6}
                  style={[
                    styles.themeCircleDot,
                    {
                      backgroundColor: tItem.canvas,
                      borderColor: isActive ? theme.accentTerracotta : tItem.borderStrong,
                      borderWidth: isActive ? 2.5 : 1,
                    },
                  ]}
                />
              );
            })}
          </View>

          <View style={[styles.controlDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Font Size Quick Controls */}
          <View style={styles.fontScalerGroup}>
            <Pressable
              onPress={() => handleFontSizeChange(-1)}
              accessibilityLabel="হরফ ছোট করুন"
              style={styles.scaleBtn}>
              <Text style={[styles.scaleBtnText, { color: theme.textPrimary }]}>অ-</Text>
            </Pressable>
            <Text style={[styles.fontSizeLabel, { color: theme.accentTerracotta }]}>
              {toBanglaNumber(fontSize)}
            </Text>
            <Pressable
              onPress={() => handleFontSizeChange(1)}
              accessibilityLabel="হরফ বড় করুন"
              style={styles.scaleBtn}>
              <Text style={[styles.scaleBtnText, { color: theme.textPrimary }]}>অ+</Text>
            </Pressable>
          </View>

          <View style={[styles.controlDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Typography Sheet Trigger */}
          <Pressable
            onPress={() => {
              hapticSelection();
              setShowSettingsModal(true);
            }}
            accessibilityLabel="পাঠ ও অক্ষর বিন্যাস"
            style={[styles.settingsTriggerBtn, { backgroundColor: theme.surface }]}>
            <Ionicons name="options-outline" size={17} color={theme.accentTerracotta} />
          </Pressable>

          {/* Next Chapter */}
          <Pressable
            onPress={() => handleChapterChange(currentChapterIndex + 1)}
            disabled={!nextChapter}
            accessibilityLabel="পরবর্তী পর্ব"
            style={[styles.pillChapterBtn, { opacity: !nextChapter ? 0.35 : 1 }]}>
            <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
          </Pressable>
        </GlassSurface>
      </Animated.View>

      {/* Toast */}
      {toastMessage && (
        <View
          style={[
            styles.toastPill,
            {
              bottom: Math.max(insets.bottom, 12) + 74,
              backgroundColor: theme.textPrimary,
            },
          ]}>
          <Text style={[styles.toastText, { color: theme.canvas }]}>
            {renderWithNotoNumbers(toastMessage)}
          </Text>
        </View>
      )}

      {/* Long-press Paragraph Action Modal */}
      <Modal
        visible={Boolean(actionParagraph)}
        animationType="fade"
        transparent
        onRequestClose={() => setActionParagraph(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.backdropDismissArea}
            onPress={() => setActionParagraph(null)}
            accessibilityLabel="বন্ধ করুন"
          />
          <View
            style={[
              styles.actionSheet,
              {
                backgroundColor: theme.canvas,
                borderColor: theme.borderStrong,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
              },
            ]}>
            <Text numberOfLines={2} style={[styles.actionSnippet, { color: theme.textSecondary }]}>
              “{actionParagraph?.text}”
            </Text>

            <Pressable
              onPress={handleToggleBookmarkForAction}
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}>
              <Ionicons
                name={
                  actionParagraph && bookmarkedParagraphs.includes(actionParagraph.index)
                    ? 'bookmark'
                    : 'bookmark-outline'
                }
                size={19}
                color={theme.accentTerracotta}
              />
              <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>
                {actionParagraph && bookmarkedParagraphs.includes(actionParagraph.index)
                  ? 'বুকমার্ক সরান'
                  : 'বুকমার্কে সংরক্ষণ করুন'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleShareParagraph}
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}>
              <Ionicons name="share-outline" size={19} color={theme.accentSage} />
              <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>
                অনুচ্ছেদ শেয়ার করুন
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* TOC Modal */}
      <Modal
        visible={showTocModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTocModal(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.backdropDismissArea}
            onPress={() => setShowTocModal(false)}
            accessibilityLabel="বন্ধ করুন"
          />
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.canvas, borderColor: theme.borderStrong },
            ]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                সূচিপত্র ({toBanglaNumber(bookChapters.length)} পর্ব)
              </Text>
              <Pressable
                onPress={() => setShowTocModal(false)}
                accessibilityLabel="বন্ধ করুন"
                style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </Pressable>
            </View>

            <FlatList
              data={bookChapters}
              keyExtractor={(ch) => `toc-${ch.number}`}
              contentContainerStyle={styles.tocModalList}
              renderItem={({ item, index }) => {
                const isActive = index === currentChapterIndex;
                return (
                  <Pressable
                    onPress={() => handleChapterChange(index)}
                    style={[
                      styles.tocItem,
                      {
                        backgroundColor: isActive ? theme.surface : 'transparent',
                        borderColor: isActive ? theme.accentTerracotta : theme.borderSubtle,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.tocNum,
                        { color: isActive ? theme.accentTerracotta : theme.textMuted },
                      ]}>
                      {toBanglaNumber(item.number)}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.tocItemTitle,
                          { color: isActive ? theme.accentTerracotta : theme.textPrimary },
                        ]}>
                        {item.displayTitle || item.title}
                      </Text>
                      {item.readMinutes ? (
                        <Text style={[styles.tocItemSub, { color: theme.textMuted }]}>
                          {renderWithNotoNumbers(`প্রায় ${toBanglaNumber(item.readMinutes)} মিনিট`)}
                        </Text>
                      ) : null}
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={18} color={theme.accentTerracotta} />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Typography Settings Sheet */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.backdropDismissArea}
            onPress={() => setShowSettingsModal(false)}
            accessibilityLabel="বন্ধ করুন"
          />
          <View
            style={[
              styles.settingsSheet,
              {
                backgroundColor: theme.canvas,
                borderColor: theme.borderStrong,
              },
            ]}>
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.borderStrong }]} />
            </View>
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                পাঠ ও অক্ষর বিন্যাস
              </Text>
              <Pressable
                onPress={() => setShowSettingsModal(false)}
                accessibilityLabel="বন্ধ করুন"
                style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.settingsScroll}
              contentContainerStyle={[
                styles.settingsBody,
                { paddingBottom: Math.max(insets.bottom, 16) + 18 },
              ]}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              overScrollMode="never"
              showsVerticalScrollIndicator>
              {/* Live Typography Preview */}
              <View
                style={[
                  styles.previewBox,
                  { backgroundColor: theme.card, borderColor: theme.borderSubtle },
                ]}>
                <Text
                  style={{
                    fontSize,
                    lineHeight: calculatedLineHeight,
                    color: theme.textPrimary,
                    fontFamily: proseFontFamily,
                  }}>
                  {renderWithNotoNumbers(
                    `${firstLineIndent ? '    ' : ''}পথের শেষ কোথায় কে জানে? কিন্তু পথিক চলার আনন্দেই সমৃদ্ধ হয়।`
                  )}
                </Text>
              </View>

              {/* Theme Mode Selector (including Auto) */}
              <View style={styles.settingGroup}>
                <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
                  পাঠের থিম
                </Text>
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.themePillsRow}>
                  {(
                    [
                      ['auto', 'অটো (সিস্টেম)'],
                      ['paper-beige', THEMES['paper-beige'].nameBangla],
                      ['antique-book', THEMES['antique-book'].nameBangla],
                      ['terracotta', THEMES.terracotta.nameBangla],
                      ['deep-forest', THEMES['deep-forest'].nameBangla],
                    ] as [ThemeMode, string][]
                  ).map(([mode, label]) => {
                    const active = themeMode === mode;
                    return (
                      <Pressable
                        key={mode}
                        onPress={() => {
                          hapticSelection();
                          setThemeMode(mode);
                        }}
                        style={[
                          styles.themePillBtn,
                          active
                            ? {
                                backgroundColor: theme.accentTerracotta,
                                borderColor: theme.accentTerracotta,
                              }
                            : { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                        ]}>
                        <Text
                          style={[
                            styles.optionBtnText,
                            { color: active ? '#FFFFFF' : theme.textPrimary },
                          ]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Font Family */}
              <View style={styles.settingGroup}>
                <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
                  বাংলা হরফের ধরন
                </Text>
                <View style={styles.optionRow}>
                  <Pressable
                    onPress={() => handleSetFontFamily(true)}
                    style={[
                      styles.optionBtn,
                      isSerif
                        ? {
                            backgroundColor: theme.accentTerracotta,
                            borderColor: theme.accentTerracotta,
                          }
                        : { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                    ]}>
                    <Text
                      style={[
                        styles.optionBtnText,
                        {
                          fontFamily: FONTS.serifBold,
                          color: isSerif ? '#FFFFFF' : theme.textPrimary,
                        },
                      ]}>
                      নোটো সেরিফ (বই)
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSetFontFamily(false)}
                    style={[
                      styles.optionBtn,
                      !isSerif
                        ? {
                            backgroundColor: theme.accentTerracotta,
                            borderColor: theme.accentTerracotta,
                          }
                        : { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                    ]}>
                    <Text
                      style={[
                        styles.optionBtnText,
                        {
                          fontFamily: FONTS.sansBold,
                          color: !isSerif ? '#FFFFFF' : theme.textPrimary,
                        },
                      ]}>
                      হিন্দ শিলিগুড়ি (আধুনিক)
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Font Size Slider */}
              <View style={styles.settingGroup}>
                <View style={styles.settingLabelRow}>
                  <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
                    হরফের আকার
                  </Text>
                  <Text style={[styles.settingValText, { color: theme.accentTerracotta }]}>
                    {toBanglaNumber(fontSize)}
                  </Text>
                </View>
                <Slider
                  minimumValue={15}
                  maximumValue={30}
                  step={1}
                  value={fontSize}
                  onValueChange={handleFontSizeSliderChange}
                  onSlidingComplete={handleFontSizeSlidingComplete}
                  minimumTrackTintColor={theme.accentTerracotta}
                  maximumTrackTintColor={theme.borderStrong}
                  thumbTintColor={theme.accentTerracotta}
                />
              </View>

              {/* Line Height Slider */}
              <View style={styles.settingGroup}>
                <View style={styles.settingLabelRow}>
                  <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
                    লাইনের দূরত্ব
                  </Text>
                  <Text style={[styles.settingValText, { color: theme.accentTerracotta }]}>
                    {toBanglaNumber(lineHeightMultiplier)}x
                  </Text>
                </View>
                <Slider
                  minimumValue={1.6}
                  maximumValue={2.5}
                  step={0.1}
                  value={lineHeightMultiplier}
                  onValueChange={handleLineHeightSliderChange}
                  onSlidingComplete={handleLineHeightSlidingComplete}
                  minimumTrackTintColor={theme.accentTerracotta}
                  maximumTrackTintColor={theme.borderStrong}
                  thumbTintColor={theme.accentTerracotta}
                />
              </View>

              {/* Paragraph Spacing */}
              <View style={styles.settingGroup}>
                <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
                  অনুচ্ছেদের ব্যবধান
                </Text>
                <View style={styles.optionRow}>
                  {(
                    [
                      ['compact', 'সংক্ষিপ্ত'],
                      ['normal', 'স্বাভাবিক'],
                      ['relaxed', 'প্রশস্ত'],
                    ] as const
                  ).map(([val, lbl]) => {
                    const active = paragraphSpacing === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => handleSetParagraphSpacing(val)}
                        style={[
                          styles.optionBtn,
                          active
                            ? {
                                backgroundColor: theme.accentTerracotta,
                                borderColor: theme.accentTerracotta,
                              }
                            : { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                        ]}>
                        <Text
                          style={[
                            styles.optionBtnText,
                            { color: active ? '#FFFFFF' : theme.textPrimary },
                          ]}>
                          {lbl}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Margin Size */}
              <View style={styles.settingGroup}>
                <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
                  পাশের মার্জিন
                </Text>
                <View style={styles.optionRow}>
                  {(
                    [
                      ['narrow', 'সংকীর্ণ'],
                      ['normal', 'স্বাভাবিক'],
                      ['wide', 'প্রশস্ত'],
                    ] as const
                  ).map(([val, lbl]) => {
                    const active = marginSize === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => handleSetMarginSize(val)}
                        style={[
                          styles.optionBtn,
                          active
                            ? {
                                backgroundColor: theme.accentTerracotta,
                                borderColor: theme.accentTerracotta,
                              }
                            : { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                        ]}>
                        <Text
                          style={[
                            styles.optionBtnText,
                            { color: active ? '#FFFFFF' : theme.textPrimary },
                          ]}>
                          {lbl}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Alignment & First-Line Indent */}
              <View style={styles.settingGroup}>
                <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
                  লেখার বিন্যাস
                </Text>
                <View style={styles.optionRow}>
                  <Pressable
                    onPress={() => handleSetTextAlign('left')}
                    style={[
                      styles.optionBtn,
                      textAlign === 'left'
                        ? {
                            backgroundColor: theme.accentTerracotta,
                            borderColor: theme.accentTerracotta,
                          }
                        : { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                    ]}>
                    <Text
                      style={[
                        styles.optionBtnText,
                        { color: textAlign === 'left' ? '#FFFFFF' : theme.textPrimary },
                      ]}>
                      বাম-বিন্যস্ত
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSetTextAlign('justify')}
                    style={[
                      styles.optionBtn,
                      textAlign === 'justify'
                        ? {
                            backgroundColor: theme.accentTerracotta,
                            borderColor: theme.accentTerracotta,
                          }
                        : { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                    ]}>
                    <Text
                      style={[
                        styles.optionBtnText,
                        { color: textAlign === 'justify' ? '#FFFFFF' : theme.textPrimary },
                      ]}>
                      উভয় প্রান্ত সমান
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={handleToggleIndent}
                style={[
                  styles.indentToggleRow,
                  { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                ]}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                  অনুচ্ছেদ প্রথম লাইন ইন্ডেন্ট
                </Text>
                <Ionicons
                  name={firstLineIndent ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={firstLineIndent ? theme.accentTerracotta : theme.textMuted}
                />
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  paperTextureBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    zIndex: 60,
  },
  progressBar: {
    height: '100%',
  },
  animatedHeader: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 50,
  },
  glassHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCenter: {
    flex: 1,
    alignItems: 'center',
  },
  bookHeaderTitle: {
    fontSize: 15,
    fontFamily: FONTS.serifBold,
  },
  chapterHeaderSubtitle: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  readingScrollContent: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  chapterHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  chapterMetaPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginBottom: 12,
  },
  chapterMetaText: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  chapterTitleMain: {
    fontSize: 22,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 4,
  },
  chapterAuthorLine: {
    fontSize: 12,
    fontFamily: FONTS.sansMedium,
    marginBottom: 12,
  },
  chapterDivider: {
    width: 48,
    height: 2.5,
    borderRadius: 2,
  },
  paragraphBlock: {
    width: '100%',
  },
  bookEndMarkWrap: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 18,
    gap: 6,
  },
  bookEndMark: {
    fontSize: 16,
  },
  bookmarkTipText: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
    textAlign: 'center',
  },
  nextChapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 14,
    gap: 10,
  },
  nextLabel: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
  nextTitle: {
    fontSize: 15,
    fontFamily: FONTS.serifBold,
  },
  nextMeta: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  chapterEndNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  chapterNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: TOUCH_TARGET.min,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  chapterNavBtnText: {
    fontSize: 13,
    fontFamily: FONTS.sansBold,
  },
  animatedBottomPill: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 50,
  },
  floatingControlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  pillChapterBtn: {
    width: 34,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeDotsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  themeCircleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  controlDivider: {
    width: 1,
    height: 18,
  },
  fontScalerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scaleBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  scaleBtnText: {
    fontSize: 13,
    fontFamily: FONTS.sansBold,
  },
  fontSizeLabel: {
    fontSize: 12,
    fontFamily: FONTS.serifBold,
    minWidth: 22,
    textAlign: 'center',
  },
  settingsTriggerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastPill: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    zIndex: 70,
  },
  toastText: {
    fontSize: 12,
    fontFamily: FONTS.sansMedium,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropDismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    opacity: 0.55,
  },
  actionSheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    padding: SPACING.lg,
    gap: 10,
  },
  actionSnippet: {
    fontSize: 13,
    fontFamily: FONTS.serifRegular,
    lineHeight: 22,
    marginBottom: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: TOUCH_TARGET.min,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: FONTS.sansBold,
  },
  modalSheet: {
    maxHeight: '78%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  settingsSheet: {
    maxHeight: '84%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  settingsScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.serifBold,
  },
  modalCloseBtn: {
    padding: 4,
  },
  tocModalList: {
    padding: 16,
    gap: 8,
  },
  tocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  tocNum: {
    fontSize: 13,
    fontFamily: FONTS.serifBold,
    minWidth: 28,
  },
  tocItemTitle: {
    fontSize: 14,
    fontFamily: FONTS.serifBold,
  },
  tocItemSub: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  settingsBody: {
    padding: 20,
    gap: 16,
  },
  previewBox: {
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  settingGroup: {
    gap: 8,
  },
  settingLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 13,
    fontFamily: FONTS.sansBold,
  },
  settingValText: {
    fontSize: 13,
    fontFamily: FONTS.serifBold,
  },
  themePillsRow: {
    gap: 8,
  },
  themePillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBtnText: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
    textAlign: 'center',
  },
  indentToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOUCH_TARGET.min,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
});
