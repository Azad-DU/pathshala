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
  Image,
  StyleSheet,
  FlatList,
  Pressable,
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
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  getBookMetaById,
  loadBookById,
  loadBookByIdAsync,
} from '@/data/writers';
import type { Book, Chapter, ReaderSettings } from '@/types/library';
import {
  LAYOUT,
  RADIUS,
  TOUCH_TARGET,
} from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { THEMES, ThemeId } from '@/constants/Themes';
import { AppText as Text } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassHeader } from '@/components/ui/GlassHeader';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { ParagraphActionSheet } from '@/components/reader/ParagraphActionSheet';
import { ReaderLoadingView } from '@/components/reader/ReaderLoadingView';
import { ReaderSettingsSheet } from '@/components/reader/ReaderSettingsSheet';
import { ReaderTocSheet } from '@/components/reader/ReaderTocSheet';
import { useReaderTheme } from '@/context/ThemeContext';
import {
  DEFAULT_READER_SETTINGS,
  READER_FONT_SIZE_MAX,
  READER_FONT_SIZE_MIN,
  READER_LINE_HEIGHT_MAX,
  READER_LINE_HEIGHT_MIN,
  StorageService,
} from '@/services/storage';
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
        noBuffer
        style={{
          fontSize,
          lineHeight,
          color: textColor,
          fontFamily,
          textAlign,
        }}>
        {fontFamily === FONTS.serifRegular
          ? displayText
          : renderWithNotoNumbers(displayText)}
      </Text>
    </Pressable>
  );
});

interface AsyncLoadState {
  bookId: string;
  status: 'loaded' | 'error';
  book?: Book;
}

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

  const targetBookId = id || '';
  const targetBookMeta = useMemo(
    () => (targetBookId ? getBookMetaById(targetBookId) : undefined),
    [targetBookId]
  );
  const syncBook = useMemo(
    () => (targetBookId ? loadBookById(targetBookId) : undefined),
    [targetBookId]
  );

  const [asyncState, setAsyncState] = useState<AsyncLoadState | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (syncBook || !targetBookId || !targetBookMeta) return;
    let active = true;
    loadBookByIdAsync(targetBookId)
      .then((loaded) => {
        if (!active) return;
        if (loaded && loaded.chapters.length > 0) {
          setAsyncState({ bookId: targetBookId, status: 'loaded', book: loaded });
        } else {
          setAsyncState({ bookId: targetBookId, status: 'error' });
        }
      })
      .catch(() => {
        if (active) {
          setAsyncState({ bookId: targetBookId, status: 'error' });
        }
      });
    return () => {
      active = false;
    };
  }, [syncBook, targetBookId, targetBookMeta, retryNonce]);

  const currentBook =
    syncBook ??
    (asyncState?.bookId === targetBookId && asyncState.status === 'loaded'
      ? asyncState.book
      : undefined);

  const isLoading =
    Boolean(targetBookMeta) &&
    !syncBook &&
    asyncState?.bookId !== targetBookId;

  const isLoadError =
    Boolean(targetBookMeta) &&
    !syncBook &&
    asyncState?.bookId === targetBookId &&
    asyncState.status === 'error';

  const initialSeq = initialChapter ? parseInt(initialChapter, 10) : 1;
  const initialParaNum = initialParagraph ? parseInt(initialParagraph, 10) : 0;

  const [currentChapterIndex, setCurrentChapterIndex] = useState(
    Math.max(0, (Number.isNaN(initialSeq) ? 1 : initialSeq) - 1)
  );
  const [fontSize, setFontSize] = useState(DEFAULT_READER_SETTINGS.fontSize);
  const [lineHeightMultiplier, setLineHeightMultiplier] = useState(
    DEFAULT_READER_SETTINGS.lineHeightMultiplier
  );
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

  const bookChapters: Chapter[] = useMemo(
    () => (currentBook?.chapters && currentBook.chapters.length > 0 ? currentBook.chapters : []),
    [currentBook]
  );

  const safeChapterIndex =
    bookChapters.length > 0
      ? Math.min(currentChapterIndex, bookChapters.length - 1)
      : 0;
  const currentChapter: Chapter | undefined = bookChapters[safeChapterIndex];
  const nextChapter =
    safeChapterIndex < bookChapters.length - 1
      ? bookChapters[safeChapterIndex + 1]
      : null;

  const estimatedMinutes = useMemo(() => {
    if (!currentChapter) return 1;
    if (currentChapter.readMinutes) return currentChapter.readMinutes;
    const words = currentChapter.paragraphs.reduce(
      (sum, p) => sum + p.split(/\s+/).length,
      0
    );
    return Math.max(1, Math.round(words / 160));
  }, [currentChapter]);

  useEffect(() => {
    isChromeVisibleRef.current = isChromeVisible;
    chromeValue.set(withTiming(isChromeVisible ? 1 : 0, { duration: 190 }));
  }, [isChromeVisible, chromeValue]);

  useEffect(() => {
    bookIdRef.current = currentBook?.id ?? null;
    chapterNumRef.current = currentChapter?.number ?? 1;
  }, [currentBook?.id, currentChapter?.number]);

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
    if (!currentBook || !currentChapter) return;
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
  }, [currentBook, currentChapter, initialChapter, initialParaNum]);

  useEffect(() => {
    return () => {
      if (bookIdRef.current) {
        StorageService.saveReadingPosition(
          bookIdRef.current,
          chapterNumRef.current,
          topParagraphRef.current,
          progressRef.current
        );
      }
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2100);
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

  const clampFontSize = (val: number) =>
    Math.max(READER_FONT_SIZE_MIN, Math.min(READER_FONT_SIZE_MAX, Math.round(val)));

  const clampLineHeight = (val: number) => {
    const rounded = Math.round(val * 10) / 10;
    return Math.max(
      READER_LINE_HEIGHT_MIN,
      Math.min(READER_LINE_HEIGHT_MAX, rounded)
    );
  };

  const handleFontSizeChange = (delta: number) => {
    hapticSelection();
    const nextSize = clampFontSize(fontSize + delta);
    setFontSize(nextSize);
    StorageService.saveReaderSettings({ fontSize: nextSize });
    showToast(`হরফের আকার: ${toBanglaNumber(nextSize)}`);
  };

  const handleFontSizeSliderChange = (val: number) => setFontSize(clampFontSize(val));
  const handleFontSizeSlidingComplete = (val: number) => {
    const clamped = clampFontSize(val);
    setFontSize(clamped);
    StorageService.saveReaderSettings({ fontSize: clamped });
  };

  const handleLineHeightSliderChange = (val: number) => {
    setLineHeightMultiplier(clampLineHeight(val));
  };
  const handleLineHeightSlidingComplete = (val: number) => {
    const clamped = clampLineHeight(val);
    setLineHeightMultiplier(clamped);
    StorageService.saveReaderSettings({ lineHeightMultiplier: clamped });
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

  const handleResetSettings = async () => {
    const defaults = await StorageService.resetReaderSettings();
    setFontSize(defaults.fontSize);
    setLineHeightMultiplier(defaults.lineHeightMultiplier);
    setIsSerif(defaults.fontFamily === 'serif');
    setTextAlign(defaults.textAlign);
    setParagraphSpacing(defaults.paragraphSpacing);
    setMarginSize(defaults.marginSize);
    setFirstLineIndent(defaults.firstLineIndent);
    setThemeMode('auto');
    showToast('ডিফল্ট পাঠ বিন্যাস ফিরিয়ে আনা হয়েছে');
  };

  const toggleParagraphBookmark = useCallback(
    async (index: number, text: string) => {
      if (!currentBook || !currentChapter) return;
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
    },
    [currentBook, currentChapter, bookmarkedParagraphs, showToast]
  );

  const handleQuickBookmark = useCallback(() => {
    if (!currentChapter || currentChapter.paragraphs.length === 0) return;
    hapticSelection();
    const idx = Math.min(
      Math.max(0, topParagraphRef.current),
      currentChapter.paragraphs.length - 1
    );
    const paraText = currentChapter.paragraphs[idx] || '';
    toggleParagraphBookmark(idx, paraText);
  }, [currentChapter, toggleParagraphBookmark]);

  const handleLongPressParagraph = useCallback((index: number, text: string) => {
    hapticImpact();
    setActionParagraph({ index, text });
  }, []);

  const handleToggleBookmarkForAction = async () => {
    if (!actionParagraph) return;
    const { index, text } = actionParagraph;
    setActionParagraph(null);
    await toggleParagraphBookmark(index, text);
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
        const pct = Math.min(
          100,
          Math.max(0, Math.round((contentOffset.y / total) * 100))
        );
        if (pct !== progressRef.current) {
          progressRef.current = pct;
          progressShared.set(pct);
        }
      }

      const currentY = contentOffset.y;
      if (
        currentY > lastScrollY.current + 50 &&
        currentY > 100 &&
        isChromeVisibleRef.current
      ) {
        isChromeVisibleRef.current = false;
        setIsChromeVisible(false);
      } else if (
        currentY < lastScrollY.current - 60 &&
        !isChromeVisibleRef.current
      ) {
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

  const calculatedLineHeight = Math.max(
    1,
    Math.round(fontSize * lineHeightMultiplier)
  );
  const proseFontFamily = isSerif ? FONTS.serifRegular : FONTS.readerSansRegular;
  const headingFontFamily = isSerif ? FONTS.serifBold : FONTS.readerSansBold;
  const paragraphGap = PARAGRAPH_GAP_MAP[paragraphSpacing];
  const horizontalPad = MARGIN_MAP[marginSize];

  const bookTitle = currentBook?.title || targetBookMeta?.title || 'পাঠ্য';
  const bookAuthor = currentBook?.author || targetBookMeta?.author || '';
  const chapterDisplayTitle =
    currentChapter?.displayTitle || currentChapter?.title || '';
  const chapterNumber = currentChapter?.number ?? 1;

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
              `পর্ব ${toBanglaNumber(chapterNumber)} / ${toBanglaNumber(bookChapters.length)} • প্রায় ${toBanglaNumber(estimatedMinutes)} মিনিট`
            )}
          </Text>
        </View>

        <Text
          style={[
            styles.chapterTitleMain,
            { color: theme.textPrimary, fontFamily: headingFontFamily },
          ]}>
          {renderWithNotoNumbers(chapterDisplayTitle, true)}
        </Text>

        {bookAuthor ? (
          <Text style={[styles.chapterAuthorLine, { color: theme.textMuted }]}>
            {bookAuthor}
          </Text>
        ) : null}

        <View
          style={[
            styles.chapterDivider,
            { backgroundColor: theme.accentTerracotta },
          ]}
        />
      </Pressable>
    ),
    [
      handleToggleChrome,
      theme,
      chapterNumber,
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

        {nextChapter ? (
          <Pressable
            onPress={() => handleChapterChange(safeChapterIndex + 1)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.nextChapterCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderSubtle,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={[styles.nextLabel, { color: theme.accentTerracotta }]}>
                পরবর্তী পর্ব
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.nextTitle, { color: theme.textPrimary }]}>
                {renderWithNotoNumbers(
                  nextChapter.displayTitle || nextChapter.title,
                  true
                )}
              </Text>
              {nextChapter.readMinutes ? (
                <Text style={[styles.nextMeta, { color: theme.textMuted }]}>
                  {renderWithNotoNumbers(
                    `প্রায় ${toBanglaNumber(nextChapter.readMinutes)} মিনিট পাঠ`
                  )}
                </Text>
              ) : null}
            </View>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={theme.accentTerracotta}
            />
          </Pressable>
        ) : null}

        <View
          style={[
            styles.chapterEndNav,
            { borderTopColor: theme.borderSubtle },
          ]}>
          {safeChapterIndex > 0 ? (
            <Pressable
              onPress={() => handleChapterChange(safeChapterIndex - 1)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.chapterNavBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderSubtle,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Ionicons
                name="chevron-back"
                size={16}
                color={theme.accentTerracotta}
              />
              <Text
                style={[
                  styles.chapterNavBtnText,
                  { color: theme.textPrimary },
                ]}>
                পূর্ববর্তী পর্ব
              </Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {nextChapter ? (
            <Pressable
              onPress={() => handleChapterChange(safeChapterIndex + 1)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.chapterNavBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderSubtle,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.chapterNavBtnText,
                  { color: theme.textPrimary },
                ]}>
                পরবর্তী পর্ব
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.accentTerracotta}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    ),
    [theme, nextChapter, safeChapterIndex, handleChapterChange]
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

  // Not-found book state
  if (!targetBookMeta) {
    return (
      <View style={[styles.container, { backgroundColor: theme.canvas }]}>
        <StatusBar style={themeId === 'deep-forest' ? 'light' : 'dark'} />
        <GlassHeader backButton title="পাঠক" />
        <View style={styles.stateCenterWrap}>
          <EmptyState
            icon="book-outline"
            title="বইটি খুঁজে পাওয়া যায়নি"
            description="অনুরোধকৃত বইটি পাঠাগারে পাওয়া যায়নি।"
            actionLabel="পাঠাগারে ফিরুন"
            onAction={() => router.replace('/')}
            themeOverride={theme}
          />
        </View>
      </View>
    );
  }

  // Error state with Retry + Back
  if (isLoadError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.canvas }]}>
        <StatusBar style={themeId === 'deep-forest' ? 'light' : 'dark'} />
        <GlassHeader backButton title={bookTitle} />
        <View style={styles.stateCenterWrap}>
          <EmptyState
            icon="alert-circle-outline"
            title="পাঠ্য লোড করতে সমস্যা হয়েছে"
            description="বইটির পাঠ্য প্রস্তুত করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"
            actionLabel="আবার চেষ্টা করুন"
            onAction={() => {
              setAsyncState(null);
              setRetryNonce((n) => n + 1);
            }}
            secondaryActionLabel="ফিরে যান"
            onSecondaryAction={() => router.back()}
            themeOverride={theme}
          />
        </View>
      </View>
    );
  }

  const hasChapterBookmark = bookmarkedParagraphs.length > 0;
  const iconBtnBg = theme.isDark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(30,25,20,0.05)';

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <StatusBar style={themeId === 'deep-forest' ? 'light' : 'dark'} />

      <BlurTargetView ref={readerBlurTargetRef} style={styles.container}>
        {theme.hasPaperTexture ? (
          <Image
            source={require('@/assets/images/book-paper-texture.png')}
            resizeMode="repeat"
            style={styles.paperTextureBg}
            pointerEvents="none"
          />
        ) : null}

        {isLoading || !currentChapter ? (
          <ReaderLoadingView
            bookTitle={bookTitle}
            bookAuthor={bookAuthor}
            theme={theme}
            topPadding={insets.top + 88}
          />
        ) : (
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
              // Safe fallback when paragraph layout isn't measured yet
            }}
            contentContainerStyle={[
              styles.readingScrollContent,
              {
                paddingHorizontal: horizontalPad,
                paddingTop: insets.top + 88,
                paddingBottom: insets.bottom + 124,
              },
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
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
          radius={22}
          intensity={74}
          elevation="e2"
          themeOverride={theme}
          blurTarget={readerBlurTargetRef}
          style={styles.hudMaxWidth}
          contentStyle={styles.glassHeader}>
          <View style={styles.headerInnerRow}>
            <Pressable
              onPress={() => {
                hapticSelection();
                router.back();
              }}
              accessibilityRole="button"
              accessibilityLabel="ফিরে যান"
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: iconBtnBg,
                  borderColor: theme.borderSubtle,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}>
              <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
            </Pressable>

            <Pressable
              onPress={() => {
                hapticSelection();
                setShowTocModal(true);
              }}
              disabled={bookChapters.length === 0}
              accessibilityRole="button"
              accessibilityLabel="সূচিপত্র খুলুন"
              style={styles.titleCenter}>
              <Text
                numberOfLines={1}
                style={[styles.bookHeaderTitle, { color: theme.textPrimary }]}>
                {renderWithNotoNumbers(bookTitle, true)}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.chapterHeaderSubtitle,
                  { color: theme.textMuted },
                ]}>
                {chapterDisplayTitle
                  ? renderWithNotoNumbers(
                      `${chapterDisplayTitle} • ${toBanglaNumber(readingProgress)}%`
                    )
                  : 'প্রস্তুত হচ্ছে...'}
              </Text>
            </Pressable>

            <View style={styles.headerActionsRight}>
              <Pressable
                onPress={handleQuickBookmark}
                disabled={!currentChapter}
                accessibilityRole="button"
                accessibilityLabel="বর্তমান অনুচ্ছেদ বুকমার্ক করুন"
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: iconBtnBg,
                    borderColor: theme.borderSubtle,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}>
                <Ionicons
                  name={hasChapterBookmark ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={
                    hasChapterBookmark
                      ? theme.accentTerracotta
                      : theme.textPrimary
                  }
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  hapticSelection();
                  setShowTocModal(true);
                }}
                disabled={bookChapters.length === 0}
                accessibilityRole="button"
                accessibilityLabel="সূচিপত্র"
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: iconBtnBg,
                    borderColor: theme.borderSubtle,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}>
                <Ionicons
                  name="list"
                  size={19}
                  color={theme.accentTerracotta}
                />
              </Pressable>
            </View>
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
          intensity={76}
          elevation="e2"
          themeOverride={theme}
          blurTarget={readerBlurTargetRef}
          contentStyle={styles.floatingControlPill}>
          {/* Prev Chapter */}
          <Pressable
            onPress={() => handleChapterChange(safeChapterIndex - 1)}
            disabled={safeChapterIndex === 0}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="পূর্ববর্তী পর্ব"
            style={[
              styles.pillChapterBtn,
              { opacity: safeChapterIndex === 0 ? 0.32 : 1 },
            ]}>
            <Ionicons
              name="chevron-back"
              size={19}
              color={theme.textPrimary}
            />
          </Pressable>

          <View
            style={[
              styles.controlDivider,
              { backgroundColor: theme.borderSubtle },
            ]}
          />

          {/* Theme Dots — highlights resolved themeId even in auto mode */}
          <View style={styles.themeDotsGroup}>
            {(Object.keys(THEMES) as ThemeId[]).map((tId) => {
              const tItem = THEMES[tId];
              const isActive = themeId === tId;
              return (
                <Pressable
                  key={tId}
                  onPress={() => {
                    hapticSelection();
                    setThemeMode(tId);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`থিম: ${tItem.nameBangla}`}
                  hitSlop={11}
                  style={[
                    styles.themeCircleDot,
                    {
                      backgroundColor: tItem.canvas,
                      borderColor: isActive
                        ? theme.accentTerracotta
                        : tItem.borderStrong,
                      borderWidth: isActive ? 2.5 : 1,
                    },
                  ]}
                />
              );
            })}
          </View>

          <View
            style={[
              styles.controlDivider,
              { backgroundColor: theme.borderSubtle },
            ]}
          />

          {/* Font Size Quick Controls */}
          <View style={styles.fontScalerGroup}>
            <Pressable
              onPress={() => handleFontSizeChange(-1)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="হরফ ছোট করুন"
              style={styles.scaleBtn}>
              <Text style={[styles.scaleBtnText, { color: theme.textPrimary }]}>
                অ-
              </Text>
            </Pressable>
            <Text
              style={[
                styles.fontSizeLabel,
                { color: theme.accentTerracotta },
              ]}>
              {toBanglaNumber(fontSize)}
            </Text>
            <Pressable
              onPress={() => handleFontSizeChange(1)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="হরফ বড় করুন"
              style={styles.scaleBtn}>
              <Text style={[styles.scaleBtnText, { color: theme.textPrimary }]}>
                অ+
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.controlDivider,
              { backgroundColor: theme.borderSubtle },
            ]}
          />

          {/* Typography Sheet Trigger */}
          <Pressable
            onPress={() => {
              hapticSelection();
              setShowSettingsModal(true);
            }}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="পাঠ ও অক্ষর বিন্যাস"
            style={[
              styles.settingsTriggerBtn,
              { backgroundColor: theme.surface },
            ]}>
            <Ionicons
              name="options-outline"
              size={18}
              color={theme.accentTerracotta}
            />
          </Pressable>

          {/* Next Chapter */}
          <Pressable
            onPress={() => handleChapterChange(safeChapterIndex + 1)}
            disabled={!nextChapter}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="পরবর্তী পর্ব"
            style={[
              styles.pillChapterBtn,
              { opacity: !nextChapter ? 0.32 : 1 },
            ]}>
            <Ionicons
              name="chevron-forward"
              size={19}
              color={theme.textPrimary}
            />
          </Pressable>
        </GlassSurface>
      </Animated.View>

      {/* Toast */}
      {toastMessage ? (
        <View
          style={[
            styles.toastPill,
            {
              bottom: Math.max(insets.bottom, 12) + 78,
              backgroundColor: theme.textPrimary,
            },
          ]}>
          <Text style={[styles.toastText, { color: theme.canvas }]}>
            {renderWithNotoNumbers(toastMessage)}
          </Text>
        </View>
      ) : null}

      {/* Modular Sheets */}
      <ParagraphActionSheet
        visible={Boolean(actionParagraph)}
        onClose={() => setActionParagraph(null)}
        snippetText={actionParagraph?.text || ''}
        isBookmarked={Boolean(
          actionParagraph &&
            bookmarkedParagraphs.includes(actionParagraph.index)
        )}
        theme={theme}
        onToggleBookmark={handleToggleBookmarkForAction}
        onShare={handleShareParagraph}
      />

      <ReaderTocSheet
        visible={showTocModal}
        onClose={() => setShowTocModal(false)}
        chapters={bookChapters}
        currentChapterIndex={safeChapterIndex}
        literaryType={targetBookMeta.literaryType}
        theme={theme}
        onSelectChapter={handleChapterChange}
      />

      <ReaderSettingsSheet
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        theme={theme}
        themeMode={themeMode}
        onSelectThemeMode={setThemeMode}
        fontSize={fontSize}
        lineHeightMultiplier={lineHeightMultiplier}
        calculatedLineHeight={calculatedLineHeight}
        proseFontFamily={proseFontFamily}
        isSerif={isSerif}
        textAlign={textAlign}
        paragraphSpacing={paragraphSpacing}
        marginSize={marginSize}
        firstLineIndent={firstLineIndent}
        onFontSizeChange={handleFontSizeSliderChange}
        onFontSizeComplete={handleFontSizeSlidingComplete}
        onLineHeightChange={handleLineHeightSliderChange}
        onLineHeightComplete={handleLineHeightSlidingComplete}
        onSetFontFamily={handleSetFontFamily}
        onSetTextAlign={handleSetTextAlign}
        onSetParagraphSpacing={handleSetParagraphSpacing}
        onSetMarginSize={handleSetMarginSize}
        onToggleIndent={handleToggleIndent}
        onResetDefaults={handleResetSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stateCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
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
    alignItems: 'center',
    zIndex: 50,
  },
  hudMaxWidth: {
    width: '100%',
    maxWidth: LAYOUT.maxReaderWidth + 32,
  },
  glassHeader: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    borderRadius: TOUCH_TARGET.min / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bookHeaderTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FONTS.serifBold,
  },
  chapterHeaderSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: FONTS.sansMedium,
  },
  readingScrollContent: {
    width: '100%',
    maxWidth: LAYOUT.maxReaderWidth,
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
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: FONTS.sansMedium,
  },
  chapterTitleMain: {
    fontSize: 22,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 4,
  },
  chapterAuthorLine: {
    fontSize: 12.5,
    lineHeight: 18,
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
    width: '100%',
    fontSize: 12,
    lineHeight: 21,
    fontFamily: FONTS.serifMedium,
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
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: FONTS.sansBold,
  },
  nextTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FONTS.serifBold,
  },
  nextMeta: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: FONTS.sansMedium,
  },
  chapterEndNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    lineHeight: 18,
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
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 6,
  },
  pillChapterBtn: {
    width: 38,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeDotsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  themeCircleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  controlDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
  },
  fontScalerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  scaleBtn: {
    minWidth: 32,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleBtnText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONTS.sansBold,
  },
  fontSizeLabel: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: FONTS.serifBold,
    minWidth: 22,
    textAlign: 'center',
  },
  settingsTriggerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastPill: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '90%',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    zIndex: 70,
  },
  toastText: {
    fontSize: 13,
    lineHeight: 22,
    fontFamily: FONTS.serifMedium,
    textAlign: 'center',
  },
});
