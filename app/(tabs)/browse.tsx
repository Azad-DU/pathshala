import React, {
  ComponentRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  ALL_BOOKS_META,
  LITERARY_TYPE_INFO,
  WRITERS,
} from '@/data/writers';
import type { BookMeta, LiteraryType, ReadingHistory } from '@/types/library';
import { RADIUS, SPACING, TOUCH_TARGET } from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { ClothboundBookCard } from '@/components/ClothboundBookCard';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { useTabBlurTarget } from '@/context/TabBlurContext';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { StorageService } from '@/services/storage';
import {
  buildDoc,
  parseQuery,
  scoreDoc,
  type SearchDoc,
} from '@/utils/banglaSearch';
import { hapticSelection } from '@/utils/haptics';

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

const QUICK_SEARCH_TAGS = [
  'গীতাঞ্জলি',
  'শেষের কবিতা',
  'পথের পাঁচালী',
  'গোরা',
  'চাঁদের পাহাড়',
  'গল্পগুচ্ছ',
];

interface IndexedBook {
  book: BookMeta;
  doc: SearchDoc;
}

interface IndexedChapter {
  bookId: string;
  bookTitle: string;
  literaryType: LiteraryType;
  writerId: string;
  chapterNumber: number;
  chapterTitle: string;
  readMinutes: number;
  doc: SearchDoc;
}

const INDEXED_BOOKS: IndexedBook[] = ALL_BOOKS_META.map((book) => ({
  book,
  doc: buildDoc(
    [book.title],
    [book.author, book.genre, book.summary || '']
  ),
}));

let cachedIndexedChapters: IndexedChapter[] | null = null;
function getIndexedChapters(): IndexedChapter[] {
  if (cachedIndexedChapters) return cachedIndexedChapters;
  cachedIndexedChapters = ALL_BOOKS_META.flatMap((book) =>
    book.chaptersMeta.map((ch) => ({
      bookId: book.id,
      bookTitle: book.title,
      literaryType: book.literaryType,
      writerId: book.writerId,
      chapterNumber: ch.number,
      chapterTitle: ch.displayTitle,
      readMinutes: ch.readMinutes,
      doc: buildDoc(
        [ch.displayTitle, ch.title],
        [book.title, book.author, toBanglaNumber(ch.number)]
      ),
    }))
  );
  return cachedIndexedChapters;
}

export default function BrowseScreen() {
  const { theme, isDark } = usePathshalaTheme();
  const { setActiveBlurTarget } = useTabBlurTarget();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const blurTargetRef = useRef<ComponentRef<typeof BlurTargetView>>(null);
  const params = useLocalSearchParams<{ type?: string; writer?: string }>();

  const [prevParamKey, setPrevParamKey] = useState(
    `${params.type || ''}:${params.writer || ''}`
  );
  const [selectedType, setSelectedType] = useState<'all' | LiteraryType>(() =>
    params.type && CATEGORY_ORDER.includes(params.type as LiteraryType)
      ? (params.type as LiteraryType)
      : 'all'
  );
  const [selectedWriter, setSelectedWriter] = useState<string>(
    () => params.writer || 'all'
  );

  const currentParamKey = `${params.type || ''}:${params.writer || ''}`;
  if (currentParamKey !== prevParamKey) {
    setPrevParamKey(currentParamKey);
    setSelectedType(
      params.type && CATEGORY_ORDER.includes(params.type as LiteraryType)
        ? (params.type as LiteraryType)
        : 'all'
    );
    setSelectedWriter(params.writer || 'all');
  }

  const [searchInput, setSearchInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [readingHistory, setReadingHistory] = useState<
    Record<string, ReadingHistory>
  >({});
  const [expandedHeaderHeight, setExpandedHeaderHeight] = useState(0);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const islandWidthStyle = useAnimatedStyle(() => ({
    marginHorizontal: interpolate(
      scrollY.value,
      [0, 56],
      [0, 24],
      Extrapolation.CLAMP
    ),
  }));

  const islandPaddingStyle = useAnimatedStyle(() => ({
    paddingVertical: interpolate(
      scrollY.value,
      [0, 56],
      [11, 5],
      Extrapolation.CLAMP
    ),
    paddingHorizontal: interpolate(
      scrollY.value,
      [0, 56],
      [14, 8],
      Extrapolation.CLAMP
    ),
  }));

  const searchBoxAnimatedStyle = useAnimatedStyle(() => ({
    minHeight: interpolate(
      scrollY.value,
      [0, 56],
      [TOUCH_TARGET.min, 38],
      Extrapolation.CLAMP
    ),
    borderRadius: interpolate(
      scrollY.value,
      [0, 56],
      [RADIUS.md, 18],
      Extrapolation.CLAMP
    ),
  }));

  const titleCollapseStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(
      scrollY.value,
      [0, 44],
      [48, 0],
      Extrapolation.CLAMP
    ),
    marginBottom: interpolate(
      scrollY.value,
      [0, 44],
      [10, 0],
      Extrapolation.CLAMP
    ),
    opacity: interpolate(
      scrollY.value,
      [0, 26],
      [1, 0],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 44],
          [0, -8],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const chipsCollapseStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(
      scrollY.value,
      [0, 44],
      [48, 0],
      Extrapolation.CLAMP
    ),
    marginTop: interpolate(
      scrollY.value,
      [0, 44],
      [10, 0],
      Extrapolation.CLAMP
    ),
    opacity: interpolate(
      scrollY.value,
      [0, 26],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(searchInput), 140);
    return () => clearTimeout(t);
  }, [searchInput]);

  useFocusEffect(
    useCallback(() => {
      setActiveBlurTarget(blurTargetRef);
      StorageService.getAllReadingHistory().then(setReadingHistory);
    }, [setActiveBlurTarget])
  );

  const parsedQuery = useMemo(
    () => parseQuery(debouncedInput),
    [debouncedInput]
  );
  const hasQuery = parsedQuery.tokens.length > 0;

  const filterChips = useMemo(() => {
    const chips: {
      id: string;
      kind: 'reset' | 'writer' | 'type';
      value: string;
      label: string;
    }[] = [{ id: 'reset', kind: 'reset', value: 'all', label: 'সকল রচনা' }];

    if (WRITERS.length > 1) {
      for (const w of WRITERS) {
        const shortName = w.name.split(' ')[0];
        chips.push({
          id: `writer:${w.id}`,
          kind: 'writer',
          value: w.id,
          label: shortName,
        });
      }
    }

    for (const t of CATEGORY_ORDER) {
      const count = ALL_BOOKS_META.filter(
        (b) =>
          b.literaryType === t &&
          (selectedWriter === 'all' || b.writerId === selectedWriter)
      ).length;
      if (count > 0) {
        chips.push({
          id: `type:${t}`,
          kind: 'type',
          value: t,
          label: `${LITERARY_TYPE_INFO[t].label} (${toBanglaNumber(count)})`,
        });
      }
    }
    return chips;
  }, [selectedWriter]);

  const matchingChapters = useMemo(() => {
    if (!hasQuery) return [];
    const chapters = getIndexedChapters();
    const scored: { item: IndexedChapter; score: number }[] = [];
    for (const item of chapters) {
      if (selectedType !== 'all' && item.literaryType !== selectedType) {
        continue;
      }
      if (selectedWriter !== 'all' && item.writerId !== selectedWriter) {
        continue;
      }
      const score = scoreDoc(item.doc, parsedQuery);
      if (score > 0) {
        scored.push({ item, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 20).map((s) => s.item);
  }, [hasQuery, parsedQuery, selectedType, selectedWriter]);

  const filteredBooks = useMemo(() => {
    const chapterBookHits = new Set<string>();
    if (hasQuery) {
      for (const ch of matchingChapters) {
        chapterBookHits.add(ch.bookId);
      }
    }

    const scored: { book: BookMeta; score: number }[] = [];
    for (const item of INDEXED_BOOKS) {
      const { book, doc } = item;
      if (selectedType !== 'all' && book.literaryType !== selectedType) {
        continue;
      }
      if (selectedWriter !== 'all' && book.writerId !== selectedWriter) {
        continue;
      }

      let score = hasQuery ? scoreDoc(doc, parsedQuery) : 1;
      if (hasQuery && score === 0 && chapterBookHits.has(book.id)) {
        score = 3;
      }
      if (score > 0) {
        scored.push({ book, score });
      }
    }

    if (hasQuery) {
      scored.sort((a, b) => b.score - a.score);
    }
    return scored.map((s) => s.book);
  }, [hasQuery, parsedQuery, selectedType, selectedWriter, matchingChapters]);

  const activeHeading = useMemo(() => {
    if (hasQuery) return `অনুসন্ধান: "${debouncedInput.trim()}"`;
    const writerName =
      selectedWriter !== 'all'
        ? WRITERS.find((w) => w.id === selectedWriter)?.name.split(' ')[0]
        : null;
    const typeLabel =
      selectedType !== 'all' ? LITERARY_TYPE_INFO[selectedType]?.label : null;
    if (writerName && typeLabel) return `${writerName} • ${typeLabel}`;
    if (writerName) return `${writerName}-এর সকল রচনা`;
    if (typeLabel) return typeLabel;
    return 'সকল রচনা';
  }, [hasQuery, debouncedInput, selectedWriter, selectedType]);

  const searchFieldBg = isDark
    ? 'rgba(255, 255, 255, 0.07)'
    : 'rgba(30, 25, 20, 0.045)';
  const totalResultsCount = filteredBooks.length + matchingChapters.length;

  const listHeaderElement = useMemo(
    () => (
      <View style={styles.listHeaderWrap}>
        {/* Popular Quick Search Tags when Input is Empty */}
        {!hasQuery && (
          <View style={styles.quickTagsSection}>
            <Text style={[styles.quickTagsLabel, { color: theme.textMuted }]}>
              জনপ্রিয় অনুসন্ধান
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.quickTagsScroll}>
              {QUICK_SEARCH_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => {
                    hapticSelection();
                    setSearchInput(tag);
                    setDebouncedInput(tag);
                  }}
                  style={[
                    styles.quickTagChip,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.borderSubtle,
                    },
                  ]}>
                  <Ionicons
                    name="sparkles-outline"
                    size={13}
                    color={theme.accentTerracotta}
                  />
                  <Text
                    style={[styles.quickTagText, { color: theme.textPrimary }]}>
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Matching Chapters/Stories when Searching */}
        {matchingChapters.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                গল্প, কবিতা ও পরিচ্ছেদ
              </Text>
              <Text style={[styles.countText, { color: theme.textMuted }]}>
                {renderWithNotoNumbers(`${toBanglaNumber(matchingChapters.length)}টি মিল`)}
              </Text>
            </View>
            <View style={styles.chapterMatchesList}>
              {matchingChapters.map((item) => (
                <Pressable
                  key={`${item.bookId}-${item.chapterNumber}`}
                  onPress={() => {
                    hapticSelection();
                    router.push({
                      pathname: '/reader/[id]',
                      params: {
                        id: item.bookId,
                        initialChapter: String(item.chapterNumber),
                      },
                    });
                  }}
                  style={({ pressed }) => [
                    styles.chapterMatchRow,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.borderSubtle,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}>
                  <View
                    style={[
                      styles.chapterBadge,
                      { backgroundColor: theme.accentSoftSage },
                    ]}>
                    <Text
                      style={[
                        styles.chapterBadgeText,
                        { color: theme.accentSage },
                      ]}>
                      {toBanglaNumber(item.chapterNumber)}
                    </Text>
                  </View>
                  <View style={styles.chapterMatchInfo}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.chapterMatchTitle,
                        { color: theme.textPrimary },
                      ]}>
                      {item.chapterTitle}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.chapterMatchSub,
                        { color: theme.textMuted },
                      ]}>
                      {renderWithNotoNumbers(
                        `${item.bookTitle} • প্রায় ${toBanglaNumber(item.readMinutes)} মিনিট`
                      )}
                    </Text>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={theme.accentTerracotta}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Books Section Title */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {activeHeading}
          </Text>
          <Text style={[styles.countText, { color: theme.textMuted }]}>
            {renderWithNotoNumbers(`${toBanglaNumber(filteredBooks.length)}টি বই`)}
          </Text>
        </View>
      </View>
    ),
    [
      hasQuery,
      matchingChapters,
      activeHeading,
      filteredBooks.length,
      theme,
      router,
    ]
  );

  const renderBookItem = useCallback(
    ({ item }: { item: BookMeta }) => (
      <ClothboundBookCard
        book={item}
        readingChapter={readingHistory[item.id]?.chapterSequence}
      />
    ),
    [readingHistory]
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <BlurTargetView ref={blurTargetRef} style={styles.safeArea}>
        <Animated.FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={renderBookItem}
          ListHeaderComponent={listHeaderElement}
          ListEmptyComponent={
            matchingChapters.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.borderSubtle,
                  },
                ]}>
                <Ionicons
                  name="search-outline"
                  size={32}
                  color={theme.textMuted}
                />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                  কোনো বই বা গল্প পাওয়া যায়নি
                </Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  অন্য কোনো শব্দ বা সহজ বানানে খুঁজে দেখুন অথবা সব রচনা দেখুন।
                </Text>
                <Pressable
                  onPress={() => {
                    hapticSelection();
                    setSearchInput('');
                    setDebouncedInput('');
                    setSelectedType('all');
                    setSelectedWriter('all');
                  }}
                  style={[
                    styles.resetBtn,
                    { backgroundColor: theme.accentTerracotta },
                  ]}>
                  <Text style={styles.resetBtnText}>সব রচনা দেখুন</Text>
                </Pressable>
              </View>
            ) : undefined
          }
          columnWrapperStyle={styles.booksGridRow}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop:
                insets.top +
                6 +
                (expandedHeaderHeight > 0 ? expandedHeaderHeight + 14 : 178),
              paddingBottom: Math.max(insets.bottom, 12) + 96,
            },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </BlurTargetView>

      {/* Sticky Floating Liquid-Glass Search Header */}
      <Animated.View
        onLayout={(e) => {
          if (expandedHeaderHeight === 0) {
            const h = Math.round(e.nativeEvent.layout.height);
            if (h > 0) setExpandedHeaderHeight(h);
          }
        }}
        style={[
          styles.stickyHeaderWrap,
          { top: insets.top + 6 },
          islandWidthStyle,
        ]}
        pointerEvents="box-none">
        <GlassSurface
          radius={24}
          intensity={76}
          elevation="e2"
          blurTarget={blurTargetRef}>
          <Animated.View style={islandPaddingStyle}>
            <Animated.View
              collapsable={false}
              style={[styles.collapsibleWrap, titleCollapseStyle]}>
              <View style={styles.headerTitleRow}>
                <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
                  খুঁজুন
                </Text>
                <View
                  style={[
                    styles.resultCountPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(185, 77, 37, 0.1)',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.resultCountText,
                      { color: theme.accentTerracotta },
                    ]}>
                    {renderWithNotoNumbers(
                      hasQuery
                        ? `${toBanglaNumber(totalResultsCount)}টি ফলাফল`
                        : `${toBanglaNumber(filteredBooks.length)}টি বই`,
                      true
                    )}
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.searchBox,
                searchBoxAnimatedStyle,
                {
                  backgroundColor: searchFieldBg,
                  borderColor: isSearchFocused
                    ? theme.accentTerracotta
                    : theme.borderSubtle,
                },
              ]}>
              <Ionicons
                name="search"
                size={18}
                color={
                  isSearchFocused ? theme.accentTerracotta : theme.textMuted
                }
              />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="বই, গল্প, কবিতা, গান বা লেখক খুঁজুন..."
                placeholderTextColor={theme.textMuted}
                returnKeyType="search"
                autoCorrect={false}
                accessibilityLabel="বই বা গল্প অনুসন্ধান"
                style={[styles.searchInput, { color: theme.textPrimary }]}
              />
              {searchInput.length > 0 && (
                <Pressable
                  onPress={() => {
                    hapticSelection();
                    setSearchInput('');
                    setDebouncedInput('');
                  }}
                  hitSlop={8}
                  accessibilityLabel="অনুসন্ধান মুছুন">
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.textMuted}
                  />
                </Pressable>
              )}
            </Animated.View>

            <Animated.View
              collapsable={false}
              style={[styles.collapsibleWrap, chipsCollapseStyle]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.chipsScroll}>
                {filterChips.map((chip) => {
                  const isActive =
                    chip.kind === 'reset'
                      ? selectedType === 'all' && selectedWriter === 'all'
                      : chip.kind === 'writer'
                      ? selectedWriter === chip.value
                      : selectedType === chip.value;

                  return (
                    <Pressable
                      key={chip.id}
                      onPress={() => {
                        hapticSelection();
                        if (chip.kind === 'reset') {
                          setSelectedWriter('all');
                          setSelectedType('all');
                        } else if (chip.kind === 'writer') {
                          setSelectedWriter((prev) =>
                            prev === chip.value ? 'all' : chip.value
                          );
                        } else {
                          setSelectedType((prev) =>
                            prev === chip.value
                              ? 'all'
                              : (chip.value as LiteraryType)
                          );
                        }
                      }}
                      style={[
                        styles.chipBtn,
                        isActive
                          ? {
                              backgroundColor: theme.accentTerracotta,
                              borderColor: theme.accentTerracotta,
                            }
                          : {
                              backgroundColor: searchFieldBg,
                              borderColor: theme.borderSubtle,
                            },
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isActive ? '#FFFFFF' : theme.textSecondary,
                            fontFamily: isActive
                              ? FONTS.sansBold
                              : FONTS.sansMedium,
                          },
                        ]}>
                        {renderWithNotoNumbers(chip.label, isActive)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </GlassSurface>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  stickyHeaderWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 50,
  },
  collapsibleWrap: {
    overflow: 'hidden',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 20,
    fontFamily: FONTS.serifBold,
  },
  resultCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  resultCountText: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: TOUCH_TARGET.min,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1.25,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.sansMedium,
    paddingVertical: 8,
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 1,
  },
  chipBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
  },
  listHeaderWrap: {
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  quickTagsSection: {
    gap: 8,
  },
  quickTagsLabel: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
  },
  quickTagsScroll: {
    gap: 8,
  },
  quickTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  quickTagText: {
    fontSize: 12,
    fontFamily: FONTS.sansMedium,
  },
  sectionBlock: {
    gap: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FONTS.serifBold,
  },
  countText: {
    fontSize: 12,
    fontFamily: FONTS.sansMedium,
  },
  chapterMatchesList: {
    gap: 8,
  },
  chapterMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 12,
  },
  chapterBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.serifBold,
  },
  chapterMatchInfo: {
    flex: 1,
    gap: 2,
  },
  chapterMatchTitle: {
    fontSize: 14,
    fontFamily: FONTS.serifBold,
  },
  chapterMatchSub: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  booksGridRow: {
    justifyContent: 'space-between',
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.serifBold,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: FONTS.sansMedium,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.sansBold,
  },
});
