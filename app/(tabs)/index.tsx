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
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
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
import { ELEVATION, RADIUS, SPACING } from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { ClothboundBookCard } from '@/components/ClothboundBookCard';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { useTabBlurTarget } from '@/context/TabBlurContext';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { StorageService } from '@/services/storage';
import { hapticSelection } from '@/utils/haptics';

const BRAND_LOGO = require('@/assets/images/brand/logo.jpg');

const CATEGORY_ORDER: LiteraryType[] = [
  'uponnash',
  'golpo',
  'kobita',
  'gaan',
  'natok',
  'probondho',
  'kishorepattho',
  'vromonkahini',
  'onyanno',
];

const SPINE_COLORS: Record<string, string> = {
  terracotta: '#A6411D',
  sage: '#445C46',
  charcoal: '#1F2A24',
};

const APPEARANCE_OPTIONS: {
  mode: AppThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { mode: 'system', label: 'সিস্টেম', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'লাইট', icon: 'sunny-outline' },
  { mode: 'dark', label: 'ডার্ক', icon: 'moon-outline' },
];

const COMPACT_CARD_STEP = 164; // 152px card width + 12px separator
const TODAY_INDEX = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

function ShelfSeparator() {
  return <View style={{ width: SPACING.md }} />;
}

export default function HomeScreen() {
  const { theme, isDark, appThemeMode, setAppThemeMode } = usePathshalaTheme();
  const { setActiveBlurTarget } = useTabBlurTarget();
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

  const scrollY = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      setActiveBlurTarget(blurTargetRef);
      StorageService.getAllReadingHistory().then(setReadingHistory);
      return () => {
        setShowAppearancePopover(false);
      };
    }, [setActiveBlurTarget])
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerIslandAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, 36],
      [1, 0.985],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 36],
      [0, -2],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, 28],
      [1, 0.72],
      Extrapolation.CLAMP
    ),
  }));

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
    const pct =
      book.totalChapters > 0
        ? Math.min(
            100,
            Math.round((latest.chapterSequence / book.totalChapters) * 100)
          )
        : 0;
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

  const actionCircleBg = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(30, 25, 20, 0.055)';

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeaderBlock}>
        {/* 1. Writer Selector Strip (Instant UI chip update + deferred shelves transition) */}
        <View style={styles.writerSelectorSection}>
          <View style={styles.writerSelectorHeader}>
            <Text
              style={[styles.sectionOverline, { color: theme.textSecondary }]}>
              লেখক নির্বাচন করুন
            </Text>
            {WRITERS.length === 1 && (
              <Text style={[styles.moreWritersHint, { color: theme.textMuted }]}>
                আরও লেখক শীঘ্রই যুক্ত হবে
              </Text>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.writerPillsScroll}>
            {WRITERS.map((w) => {
              const isSelected = w.id === selectedWriterId;
              const wAvatar = getWriterAvatarSource(w.id);
              return (
                <Pressable
                  key={w.id}
                  onPress={() => handleSelectWriter(w.id)}
                  style={[
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
                  ]}>
                  <View
                    style={[
                      styles.writerChipAvatar,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(255,255,255,0.2)'
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
                  <Text
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
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. Quote of the Day Card */}
        {dailyQuote && (
          <Pressable
            onPress={() => {
              if (dailyQuote.bookId) {
                hapticSelection();
                router.push(`/book/${dailyQuote.bookId}` as any);
              }
            }}
            style={({ pressed }) => [
              styles.quoteCard,
              ELEVATION.e1,
              {
                backgroundColor: theme.card,
                borderColor: theme.borderStrong,
                opacity: pressed && dailyQuote.bookId ? 0.94 : 1,
              },
            ]}>
            <View style={styles.quoteTopRow}>
              <View style={styles.quoteLabelWrap}>
                <Ionicons
                  name="sparkles-outline"
                  size={13}
                  color={theme.accentTerracotta}
                />
                <Text
                  style={[
                    styles.quoteLabel,
                    { color: theme.accentTerracotta },
                  ]}>
                  আজকের পঙ্‌ক্তি
                </Text>
              </View>
              <View
                style={[
                  styles.quoteSourceBadge,
                  { backgroundColor: theme.accentSoftSage },
                ]}>
                <Text style={[styles.quoteSource, { color: theme.accentSage }]}>
                  {renderWithNotoNumbers(dailyQuote.source, true)}
                </Text>
              </View>
            </View>

            <Text style={[styles.quoteText, { color: theme.textPrimary }]}>
              “{dailyQuote.quote}”
            </Text>

            <View style={styles.quoteFooter}>
              <Text style={[styles.quoteAuthor, { color: theme.textMuted }]}>
                — {dailyQuote.author}
              </Text>
              {dailyQuote.bookId ? (
                <View style={styles.quoteReadLink}>
                  <Text
                    style={[
                      styles.quoteReadLinkText,
                      { color: theme.accentTerracotta },
                    ]}>
                    বইটি দেখুন
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
        )}

        {/* 3. Continue Reading Card */}
        {continueItem && (
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
            style={({ pressed }) => [
              styles.continueHero,
              ELEVATION.e1,
              {
                backgroundColor: theme.card,
                borderColor: theme.borderStrong,
                opacity: pressed ? 0.94 : 1,
              },
            ]}>
            <View
              style={[
                styles.heroSpineAccent,
                {
                  backgroundColor:
                    SPINE_COLORS[continueItem.book.coverStyle] ||
                    theme.accentTerracotta,
                },
              ]}
            />
            <View style={styles.continueBody}>
              <View style={styles.continueTopRow}>
                <View style={styles.continueTagRow}>
                  <Ionicons
                    name="book-outline"
                    size={13}
                    color={theme.accentTerracotta}
                  />
                  <Text
                    style={[
                      styles.continueTag,
                      { color: theme.accentTerracotta },
                    ]}>
                    পড়া চালিয়ে যান
                  </Text>
                </View>
                <Text style={[styles.remainingText, { color: theme.textMuted }]}>
                  {renderWithNotoNumbers(`≈ ${toBanglaNumber(continueItem.remainingMinutes)} মিনিট বাকি`)}
                </Text>
              </View>

              <Text
                numberOfLines={1}
                style={[styles.continueTitle, { color: theme.textPrimary }]}>
                {continueItem.book.title}
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
                  style={[styles.progressPctText, { color: theme.textMuted }]}>
                  {toBanglaNumber(continueItem.progressPct)}%
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.continueBtn,
                { backgroundColor: theme.accentTerracotta },
              ]}>
              <Text style={styles.continueBtnText}>পড়ুন</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </View>
          </Pressable>
        )}
      </View>
    ),
    [selectedWriterId, handleSelectWriter, dailyQuote, continueItem, theme, router]
  );

  const renderShelf = useCallback(
    ({ item }: { item: { type: LiteraryType; books: BookMeta[] } }) => {
      const { type, books } = item;
      const info = LITERARY_TYPE_INFO[type];
      return (
        <View style={styles.shelfSection}>
          <View style={styles.shelfHeader}>
            <View style={styles.shelfTitleWrap}>
              <Text style={[styles.shelfTitle, { color: theme.textPrimary }]}>
                {info.label}
              </Text>
              <Text style={[styles.shelfCount, { color: theme.textMuted }]}>
                {renderWithNotoNumbers(`${toBanglaNumber(books.length)}টি বই`)}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                hapticSelection();
                router.push({
                  pathname: '/browse',
                  params: { type, writer: activeWriter?.id },
                } as any);
              }}
              hitSlop={8}
              style={styles.seeAllBtn}>
              <Text
                style={[styles.seeAllText, { color: theme.accentTerracotta }]}>
                সব দেখুন
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={theme.accentTerracotta}
              />
            </Pressable>
          </View>

          <FlatList
            data={books}
            horizontal
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={3}
            removeClippedSubviews={Platform.OS === 'android'}
            getItemLayout={(_, index) => ({
              length: COMPACT_CARD_STEP,
              offset: COMPACT_CARD_STEP * index,
              index,
            })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(b) => `${type}-${b.id}`}
            contentContainerStyle={styles.shelfListContent}
            ItemSeparatorComponent={ShelfSeparator}
            renderItem={({ item: bookItem }) => (
              <ClothboundBookCard
                book={bookItem}
                size="compact"
                readingChapter={readingHistory[bookItem.id]?.chapterSequence}
              />
            )}
          />
        </View>
      );
    },
    [theme, router, activeWriter?.id, readingHistory]
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <BlurTargetView ref={blurTargetRef} style={styles.safeArea}>
        <Animated.FlatList
          data={shelves}
          keyExtractor={(item) => `${activeWriter?.id || 'w'}-${item.type}`}
          renderItem={renderShelf}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.lg }} />}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={4}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 82,
              paddingBottom: Math.max(insets.bottom, 12) + 96,
            },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </BlurTargetView>

      {/* Floating Liquid-Glass Top Header Island */}
      <Animated.View
        style={[
          styles.floatingHeaderWrap,
          { top: insets.top + 6 },
          headerIslandAnimatedStyle,
        ]}
        pointerEvents="box-none">
        <GlassSurface
          radius={28}
          intensity={74}
          elevation="e2"
          blurTarget={blurTargetRef}
          contentStyle={styles.headerIslandInner}>
          <Pressable
            onPress={() => {
              hapticSelection();
              setShowAppearancePopover(false);
              router.push('/modal');
            }}
            accessibilityLabel="পাঠশালা নির্দেশিকা খুলুন"
            style={styles.headerLeft}>
            <View
              style={[
                styles.logoBadge,
                { borderColor: theme.glassRimTop },
              ]}>
              <Image
                source={BRAND_LOGO}
                resizeMode="cover"
                style={styles.logoImage}
              />
            </View>
            <View style={styles.brandTextWrap}>
              <Text style={[styles.logoTitle, { color: theme.textPrimary }]}>
                পাঠশালা
              </Text>
              <Animated.Text
                numberOfLines={1}
                style={[
                  styles.logoSubtitle,
                  { color: theme.textMuted },
                  subtitleAnimatedStyle,
                ]}>
                নির্মল বাংলা সাহিত্যের আসর
              </Animated.Text>
            </View>
          </Pressable>

          <View style={styles.headerRight}>
            <Pressable
              onPress={() => {
                hapticSelection();
                setShowAppearancePopover(false);
                router.push('/browse');
              }}
              hitSlop={4}
              accessibilityLabel="বই ও গল্প খুঁজুন"
              style={({ pressed }) => [
                styles.headerIconBtn,
                {
                  backgroundColor: actionCircleBg,
                  borderColor: theme.glassRimTop,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons name="search" size={18} color={theme.textPrimary} />
            </Pressable>

            <Pressable
              onPress={() => {
                hapticSelection();
                setShowAppearancePopover((prev) => !prev);
              }}
              hitSlop={4}
              accessibilityLabel="অ্যাপের রূপ পরিবর্তন করুন"
              style={({ pressed }) => [
                styles.headerIconBtn,
                {
                  backgroundColor: showAppearancePopover
                    ? theme.accentTerracotta
                    : actionCircleBg,
                  borderColor: showAppearancePopover
                    ? theme.accentTerracotta
                    : theme.glassRimTop,
                  opacity: pressed ? 0.78 : 1,
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
                size={18}
                color={showAppearancePopover ? '#FFFFFF' : theme.textPrimary}
              />
            </Pressable>
          </View>
        </GlassSurface>
      </Animated.View>

      {/* Header Appearance Glass Popover */}
      {showAppearancePopover && (
        <>
          <Pressable
            onPress={() => setShowAppearancePopover(false)}
            accessibilityLabel="পপওভার বন্ধ করুন"
            style={styles.popoverBackdrop}
          />
          <View style={[styles.popoverPosition, { top: insets.top + 74 }]}>
            <GlassSurface
              radius={20}
              intensity={80}
              elevation="e2"
              blurTarget={blurTargetRef}
              contentStyle={styles.popoverCard}>
              <Text style={[styles.popoverTitle, { color: theme.textPrimary }]}>
                অ্যাপের রূপ (Appearance)
              </Text>
              <View
                style={[
                  styles.segmentedWrap,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(30, 25, 20, 0.06)',
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  floatingHeaderWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 50,
  },
  headerIslandInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minHeight: 44,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontFamily: FONTS.serifBold,
  },
  logoSubtitle: {
    fontSize: 10.5,
    fontFamily: FONTS.sansMedium,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    right: 14,
    zIndex: 65,
    width: 266,
  },
  popoverCard: {
    padding: 12,
    gap: 10,
  },
  popoverTitle: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
    paddingHorizontal: 2,
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
    minHeight: 38,
    borderRadius: 11,
    paddingHorizontal: 4,
  },
  segmentOptionText: {
    fontSize: 11,
  },
  scrollContent: {},
  listHeaderBlock: {
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  writerSelectorSection: {
    gap: SPACING.sm,
  },
  writerSelectorHeader: {
    paddingHorizontal: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionOverline: {
    fontSize: 13,
    fontFamily: FONTS.sansBold,
  },
  moreWritersHint: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  writerPillsScroll: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  writerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  writerChipAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  writerChipMonogram: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.serifBold,
  },
  writerChipText: {
    fontSize: 13,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  continueHero: {
    marginHorizontal: SPACING.base,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: SPACING.base,
    gap: SPACING.md,
  },
  heroSpineAccent: {
    width: 8,
    alignSelf: 'stretch',
  },
  continueBody: {
    flex: 1,
    paddingVertical: SPACING.md + 2,
    gap: 4,
  },
  continueTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  continueTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  continueTag: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
  remainingText: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  continueTitle: {
    fontSize: 17,
    fontFamily: FONTS.serifBold,
  },
  continueSub: {
    fontSize: 12,
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
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressPctText: {
    fontSize: 11,
    fontFamily: FONTS.serifBold,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.sansBold,
  },
  quoteCard: {
    marginHorizontal: SPACING.base,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: 10,
  },
  quoteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  quoteLabel: {
    fontSize: 11.5,
    fontFamily: FONTS.sansBold,
  },
  quoteSourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  quoteSource: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
  quoteText: {
    fontSize: 15,
    fontFamily: FONTS.serifRegular,
    lineHeight: 25,
  },
  quoteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  quoteAuthor: {
    fontSize: 12,
    fontFamily: FONTS.sansMedium,
  },
  quoteReadLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quoteReadLinkText: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
  },
  shelfSection: {
    gap: SPACING.md,
  },
  shelfHeader: {
    paddingHorizontal: SPACING.base,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  shelfTitleWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  shelfTitle: {
    fontSize: 18,
    fontFamily: FONTS.serifBold,
  },
  shelfCount: {
    fontSize: 12,
    fontFamily: FONTS.sansMedium,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
  },
  shelfListContent: {
    paddingHorizontal: SPACING.base,
  },
});
