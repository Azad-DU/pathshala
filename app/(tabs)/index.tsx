import React, {
  ComponentRef,
  startTransition,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ALL_QUOTES,
  LITERARY_TYPE_INFO,
  WRITERS,
  getBookMetaById,
  getBooksByWriter,
} from '@/data/writers';
import type {
  AppThemeMode,
  BookMeta,
  LiteraryType,
  ReadingHistory,
} from '@/types/library';
import { getWriterAvatarSource } from '@/constants/covers';
import {
  ELEVATION,
  LAYOUT,
  RADIUS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { ClothboundBookCard } from '@/components/ClothboundBookCard';
import { AppText as Text } from '@/components/ui/AppText';
import { BookCoverArt } from '@/components/ui/BookCoverArt';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useSetTabBlurTarget } from '@/context/TabBlurContext';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { StorageService } from '@/services/storage';
import {
  CATEGORY_ORDER,
  computeReadingProgressPct,
} from '@/utils/bookHelpers';
import { hapticSelection } from '@/utils/haptics';

const APPEARANCE_OPTIONS: {
  mode: AppThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { mode: 'system', label: 'সিস্টেম', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'লাইট', icon: 'sunny-outline' },
  { mode: 'dark', label: 'ডার্ক', icon: 'moon-outline' },
];

const TODAY_INDEX = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

function VerticalShelfSeparator() {
  return <View style={{ height: SPACING.xl }} />;
}

export default function HomeScreen() {
  const { theme, isDark, appThemeMode, setAppThemeMode } = usePathshalaTheme();
  const setActiveBlurTarget = useSetTabBlurTarget();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const blurTargetRef = useRef<ComponentRef<typeof BlurTargetView>>(null);

  const defaultWriterId = WRITERS[0]?.id || 'bibhutibhushan';
  const [selectedWriterId, setSelectedWriterId] =
    useState<string>(defaultWriterId);
  const [activeWriterId, setActiveWriterId] =
    useState<string>(defaultWriterId);
  const [readingHistory, setReadingHistory] = useState<
    Record<string, ReadingHistory>
  >({});
  const [showAppearancePopover, setShowAppearancePopover] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const syncTimer = setTimeout(() => {
        if (!active) return;
        setActiveBlurTarget(blurTargetRef);
        StorageService.getAllReadingHistory().then((next) => {
          if (active) {
            setReadingHistory((prev) => (prev === next ? prev : next));
          }
        });
      }, 260);

      return () => {
        active = false;
        clearTimeout(syncTimer);
        setShowAppearancePopover(false);
      };
    }, [setActiveBlurTarget])
  );

  const handleSelectWriter = useCallback((writerId: string) => {
    hapticSelection();
    setSelectedWriterId(writerId);
    startTransition(() => {
      setActiveWriterId(writerId);
    });
  }, []);

  const activeWriter = useMemo(
    () => WRITERS.find((w) => w.id === activeWriterId) || WRITERS[0],
    [activeWriterId]
  );

  const writerBooks = useMemo(
    () => (activeWriter ? getBooksByWriter(activeWriter.id) : []),
    [activeWriter]
  );

  const continueItem = useMemo(() => {
    const entries = Object.values(readingHistory);
    if (entries.length === 0) return null;
    entries.sort(
      (a, b) =>
        new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
    );
    const latest = entries[0];
    const book = getBookMetaById(latest.bookId);
    if (!book) return null;
    const chMeta = book.chaptersMeta.find(
      (c) => c.number === latest.chapterSequence
    );
    const remainingMinutes = book.chaptersMeta
      .filter((c) => c.number >= latest.chapterSequence)
      .reduce((acc, c) => acc + c.readMinutes, 0);
    const pct = computeReadingProgressPct(
      latest.chapterSequence,
      book.totalChapters
    );
    return {
      book,
      chapterSequence: latest.chapterSequence,
      paragraphIndex: latest.paragraphIndex ?? 0,
      chapterLabel:
        chMeta?.displayTitle ||
        `পর্ব ${toBanglaNumber(latest.chapterSequence)}`,
      remainingMinutes,
      progressPct: pct,
    };
  }, [readingHistory]);

  const dailyQuote = useMemo(() => {
    const writerQuotes = activeWriter
      ? ALL_QUOTES.filter((q) => q.author === activeWriter.name)
      : [];
    const pool = writerQuotes.length > 0 ? writerQuotes : ALL_QUOTES;
    if (pool.length === 0) return null;
    return pool[TODAY_INDEX % pool.length];
  }, [activeWriter]);

  const shelves = useMemo(() => {
    const out: { type: LiteraryType; books: BookMeta[] }[] = [];
    for (const litType of CATEGORY_ORDER) {
      const books = writerBooks.filter((b) => b.literaryType === litType);
      if (books.length > 0) {
        out.push({ type: litType, books });
      }
    }
    return out;
  }, [writerBooks]);

  const renderShelfSeparator = useCallback(
    () => <View style={{ width: layout.shelfGap }} />,
    [layout.shelfGap]
  );

  const actionCircleBg = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(30, 25, 20, 0.05)';

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeaderBlock}>
        {/* 1. Writer Selector Strip */}
        <View style={styles.writerSelectorSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.writerPillsScroll,
              { paddingHorizontal: layout.horizontalPadding },
            ]}>
            {WRITERS.map((w) => {
              const isSelected = w.id === selectedWriterId;
              const wAvatar = getWriterAvatarSource(w.id);
              const totalWorks = getBooksByWriter(w.id).length;
              return (
                <Pressable
                  key={w.id}
                  onPress={() => handleSelectWriter(w.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={w.name}
                  style={({ pressed }) => [
                    styles.writerChip,
                    isSelected
                      ? {
                          backgroundColor: theme.accentTerracotta,
                          borderColor: theme.accentTerracotta,
                        }
                      : {
                          backgroundColor: theme.card,
                          borderColor: theme.borderSubtle,
                        },
                    pressed && { opacity: 0.85 },
                  ]}>
                  <View
                    style={[
                      styles.writerChipAvatar,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(255,255,255,0.22)'
                          : w.avatarColor,
                      },
                    ]}>
                    {wAvatar ? (
                      <Image
                        source={wAvatar}
                        resizeMode="cover"
                        fadeDuration={0}
                        style={styles.avatarImg}
                      />
                    ) : (
                      <Text style={styles.writerChipMonogram}>
                        {w.monogram}
                      </Text>
                    )}
                  </View>
                  <View style={styles.writerChipLabels}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.writerChipText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.textPrimary,
                          fontFamily: isSelected
                            ? FONTS.sansBold
                            : FONTS.sansMedium,
                        },
                      ]}>
                      {w.name}
                    </Text>
                    <Text
                      style={[
                        styles.writerChipCount,
                        {
                          color: isSelected
                            ? 'rgba(255,255,255,0.86)'
                            : theme.textMuted,
                        },
                      ]}>
                      {renderWithNotoNumbers(`${toBanglaNumber(totalWorks)}টি গ্রন্থ`)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. Continue Reading Hero (Primary return-to-reading action) */}
        {continueItem ? (
          <View style={{ paddingHorizontal: layout.horizontalPadding }}>
            <Pressable
              onPress={() => {
                hapticSelection();
                router.push({
                  pathname: '/reader/[id]',
                  params: {
                    id: continueItem.book.id,
                    initialChapter: String(continueItem.chapterSequence),
                    initialParagraph: String(continueItem.paragraphIndex),
                  },
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={`পড়া চালিয়ে যান: ${continueItem.book.title}`}
              style={({ pressed }) => [
                styles.continueHero,
                ELEVATION.e1,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.borderSubtle,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}>
              <BookCoverArt
                book={continueItem.book}
                width={56}
                height={82}
                radius={7}
                elevation="e1"
              />

              <View style={styles.continueBody}>
                <View style={styles.continueTopRow}>
                  <Text
                    style={[
                      styles.continueTag,
                      { color: theme.accentTerracotta },
                    ]}>
                    {'পড়া\u00A0চালিয়ে\u00A0যান'}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.remainingText, { color: theme.textMuted }]}>
                    {renderWithNotoNumbers(
                      `≈ ${toBanglaNumber(continueItem.remainingMinutes)} মিনিট বাকি`
                    )}
                  </Text>
                </View>

                <Text
                  numberOfLines={1}
                  style={[styles.continueTitle, { color: theme.textPrimary }]}>
                  {renderWithNotoNumbers(continueItem.book.title, true)}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[styles.continueSub, { color: theme.textSecondary }]}>
                  {renderWithNotoNumbers(
                    `${continueItem.chapterLabel} • পর্ব ${toBanglaNumber(continueItem.chapterSequence)}/${toBanglaNumber(continueItem.book.totalChapters)}`
                  )}
                </Text>

                <View style={styles.progressRow}>
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: theme.surface },
                    ]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${continueItem.progressPct}%`,
                          backgroundColor: theme.accentTerracotta,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressPctText,
                      { color: theme.accentTerracotta },
                    ]}>
                    {toBanglaNumber(continueItem.progressPct)}%
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.continueIconCircle,
                  { backgroundColor: theme.accentTerracotta },
                ]}>
                <Ionicons name="play" size={16} color="#FFFFFF" />
              </View>
            </Pressable>
          </View>
        ) : null}

        {/* 3. Quote of the Day Editorial Card */}
        {dailyQuote ? (
          <View style={{ paddingHorizontal: layout.horizontalPadding }}>
            <Pressable
              onPress={() => {
                if (dailyQuote.bookId) {
                  hapticSelection();
                  router.push(`/book/${dailyQuote.bookId}` as any);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`আজকের পঙ্‌ক্তি: ${dailyQuote.source}`}
              style={({ pressed }) => [
                styles.quoteCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.borderSubtle,
                  borderLeftColor: theme.accentTerracotta,
                  opacity: pressed && dailyQuote.bookId ? 0.92 : 1,
                },
              ]}>
              <View style={styles.quoteTopRow}>
                <Text
                  style={[styles.quoteLabel, { color: theme.accentTerracotta }]}>
                  {'আজকের\u00A0পঙ্‌ক্তি'}
                </Text>
                <View
                  style={[
                    styles.quoteSourceBadge,
                    { backgroundColor: theme.accentSoftSage },
                  ]}>
                  <Text
                    numberOfLines={1}
                    style={[styles.quoteSource, { color: theme.accentSage }]}>
                    {renderWithNotoNumbers(dailyQuote.source, true)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.quoteText, { color: theme.textPrimary }]}>
                “{dailyQuote.quote}”
              </Text>

              <View style={styles.quoteFooter}>
                <Text
                  numberOfLines={1}
                  style={[styles.quoteAuthor, { color: theme.textMuted }]}>
                  — {dailyQuote.author}
                </Text>
                {dailyQuote.bookId ? (
                  <View style={styles.quoteReadLink}>
                    <Text
                      style={[
                        styles.quoteReadLinkText,
                        { color: theme.accentTerracotta },
                      ]}>
                      {'বইটি\u00A0দেখুন'}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={13}
                      color={theme.accentTerracotta}
                    />
                  </View>
                ) : null}
              </View>
            </Pressable>
          </View>
        ) : null}
      </View>
    ),
    [
      selectedWriterId,
      handleSelectWriter,
      continueItem,
      dailyQuote,
      theme,
      router,
      layout.horizontalPadding,
    ]
  );

  const renderShelf = useCallback(
    ({ item }: { item: { type: LiteraryType; books: BookMeta[] } }) => {
      const { type, books } = item;
      const info = LITERARY_TYPE_INFO[type];
      return (
        <View style={styles.shelfSection}>
          <SectionHeader
            title={info.label}
            countText={`${toBanglaNumber(books.length)}টি বই`}
            actionLabel="সব দেখুন"
            onActionPress={() =>
              router.push({
                pathname: '/browse',
                params: { type, writer: activeWriter?.id },
              } as any)
            }
            style={{ paddingHorizontal: layout.horizontalPadding }}
          />

          <FlatList
            data={books}
            horizontal
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={3}
            removeClippedSubviews={Platform.OS === 'android'}
            getItemLayout={(_, index) => ({
              length: layout.shelfCardStep,
              offset: layout.shelfCardStep * index,
              index,
            })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(b) => `${type}-${b.id}`}
            contentContainerStyle={{
              paddingHorizontal: layout.horizontalPadding,
            }}
            ItemSeparatorComponent={renderShelfSeparator}
            renderItem={({ item: bookItem }) => (
              <ClothboundBookCard
                book={bookItem}
                size="compact"
                cardWidth={layout.shelfCardWidth}
                readingChapter={readingHistory[bookItem.id]?.chapterSequence}
              />
            )}
          />
        </View>
      );
    },
    [
      router,
      activeWriter?.id,
      readingHistory,
      layout.horizontalPadding,
      layout.shelfCardWidth,
      layout.shelfCardStep,
      renderShelfSeparator,
    ]
  );

  const effectiveTopPad =
    headerHeight > 0 ? headerHeight + 16 : insets.top + 78;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <BlurTargetView ref={blurTargetRef} style={styles.safeArea}>
        <FlatList
          data={shelves}
          keyExtractor={(item) => `${activeWriter?.id || 'w'}-${item.type}`}
          renderItem={renderShelf}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={VerticalShelfSeparator}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={4}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={[
            styles.listContent,
            {
              maxWidth: layout.contentMaxWidth,
              paddingTop: effectiveTopPad,
              paddingBottom:
                Math.max(insets.bottom, 12) + LAYOUT.bottomDockReserve,
            },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </BlurTargetView>

      {/* Docked Translucent Brand Header */}
      <View
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h > 0 && h !== headerHeight) setHeaderHeight(h);
        }}
        style={styles.dockedHeaderWrap}
        pointerEvents="box-none">
        <GlassSurface
          variant="docked"
          intensity={76}
          blurTarget={blurTargetRef}>
          <View
            style={[
              styles.headerInner,
              {
                maxWidth: layout.contentMaxWidth,
                paddingHorizontal: layout.horizontalPadding,
                paddingTop: insets.top + 10,
                paddingBottom: 10,
              },
            ]}>
            <View style={styles.headerLeft}>
              <BrandLogo size={40} borderRadius={12} />
              <View style={styles.brandTextWrap}>
                <Text
                  accessibilityRole="header"
                  style={[styles.logoTitle, { color: theme.textPrimary }]}>
                  পাঠশালা
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.logoSubtitle, { color: theme.textMuted }]}>
                  নির্মল বাংলা সাহিত্যের আসর
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <Pressable
                onPress={() => {
                  hapticSelection();
                  setShowAppearancePopover(false);
                  router.push('/modal');
                }}
                accessibilityRole="button"
                accessibilityLabel="পাঠ নির্দেশিকা"
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  {
                    backgroundColor: actionCircleBg,
                    borderColor: theme.borderSubtle,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={theme.textPrimary}
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  hapticSelection();
                  setShowAppearancePopover((prev) => !prev);
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded: showAppearancePopover }}
                accessibilityLabel="অ্যাপের রূপ পরিবর্তন করুন"
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  {
                    backgroundColor: showAppearancePopover
                      ? theme.accentTerracotta
                      : actionCircleBg,
                    borderColor: showAppearancePopover
                      ? theme.accentTerracotta
                      : theme.borderSubtle,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Ionicons
                  name={
                    isDark
                      ? 'moon'
                      : appThemeMode === 'system'
                        ? 'contrast-outline'
                        : 'sunny-outline'
                  }
                  size={19}
                  color={showAppearancePopover ? '#FFFFFF' : theme.textPrimary}
                />
              </Pressable>
            </View>
          </View>
        </GlassSurface>
      </View>

      {/* Header Appearance Popover */}
      {showAppearancePopover ? (
        <>
          <Pressable
            onPress={() => setShowAppearancePopover(false)}
            accessibilityRole="button"
            accessibilityLabel="পপওভার বন্ধ করুন"
            style={styles.popoverBackdrop}
          />
          <View
            style={[
              styles.popoverPosition,
              {
                top: (headerHeight > 0 ? headerHeight : insets.top + 64) + 8,
                right: layout.horizontalPadding,
              },
            ]}>
            <GlassSurface
              radius={18}
              intensity={82}
              elevation="e2"
              blurTarget={blurTargetRef}
              contentStyle={styles.popoverCard}>
              <Text style={[styles.popoverTitle, { color: theme.textPrimary }]}>
                অ্যাপের রূপ
              </Text>
              <View
                style={[
                  styles.segmentedWrap,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(30, 25, 20, 0.05)',
                    borderColor: theme.borderSubtle,
                  },
                ]}>
                {APPEARANCE_OPTIONS.map((opt) => {
                  const isActive = appThemeMode === opt.mode;
                  return (
                    <Pressable
                      key={opt.mode}
                      onPress={() => {
                        hapticSelection();
                        setAppThemeMode(opt.mode);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={opt.label}
                      style={[
                        styles.segmentOption,
                        isActive && {
                          backgroundColor: theme.accentTerracotta,
                        },
                      ]}>
                      <Ionicons
                        name={opt.icon}
                        size={15}
                        color={isActive ? '#FFFFFF' : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.segmentOptionText,
                          {
                            color: isActive ? '#FFFFFF' : theme.textPrimary,
                            fontFamily: isActive
                              ? FONTS.sansBold
                              : FONTS.sansMedium,
                          },
                        ]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </GlassSurface>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  dockedHeaderWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  headerInner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  logoTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 19,
    lineHeight: 24,
  },
  logoSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FONTS.sansMedium,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    borderRadius: TOUCH_TARGET.min / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popoverBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
  },
  popoverPosition: {
    position: 'absolute',
    zIndex: 65,
    width: 276,
  },
  popoverCard: {
    padding: 12,
    gap: 10,
  },
  popoverTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 12.5,
  },
  segmentedWrap: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  segmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: TOUCH_TARGET.min,
    borderRadius: 11,
    paddingHorizontal: 4,
  },
  segmentOptionText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  listContent: {
    width: '100%',
    alignSelf: 'center',
  },
  listHeaderBlock: {
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  writerSelectorSection: {
    gap: SPACING.sm,
  },
  writerPillsScroll: {
    gap: SPACING.sm,
  },
  writerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: 6,
    paddingLeft: 7,
    paddingRight: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  writerChipAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  writerChipMonogram: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.serifBold,
  },
  writerChipLabels: {
    justifyContent: 'center',
  },
  writerChipText: {
    fontSize: 13,
    lineHeight: 20,
  },
  writerChipCount: {
    fontSize: 10.5,
    lineHeight: 14,
    fontFamily: FONTS.sansMedium,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  continueHero: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  continueBody: {
    flex: 1,
    gap: 3,
  },
  continueTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  continueTag: {
    ...TYPOGRAPHY.overline,
    flexShrink: 0,
  },
  remainingText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: FONTS.sansMedium,
    flexShrink: 1,
    minWidth: 0,
  },
  continueTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  continueSub: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.sansMedium,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressTrack: {
    flex: 1,
    height: 4.5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPctText: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: FONTS.serifBold,
  },
  continueIconCircle: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    borderRadius: TOUCH_TARGET.min / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderLeftWidth: 3.5,
    padding: SPACING.base,
    gap: 10,
  },
  quoteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  quoteLabel: {
    ...TYPOGRAPHY.overline,
    flexShrink: 0,
  },
  quoteSourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    flexShrink: 1,
    maxWidth: '58%',
  },
  quoteSource: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: FONTS.sansBold,
  },
  quoteText: {
    ...TYPOGRAPHY.bodySerif,
    fontSize: 15,
    lineHeight: 26,
  },
  quoteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 2,
  },
  quoteAuthor: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  quoteReadLink: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingRight: 2,
  },
  quoteReadLinkText: {
    fontFamily: FONTS.serifBold,
    fontSize: 12.5,
    lineHeight: 21,
    flexShrink: 0,
  },
  shelfSection: {
    gap: SPACING.md,
  },
});
