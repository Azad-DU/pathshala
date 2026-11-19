import React, {
  ComponentRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import {
  ALL_BOOKS_META,
  LITERARY_TYPE_INFO,
  WRITERS,
} from '@/data/writers';
import type { BookMeta, LiteraryType, ReadingHistory } from '@/types/library';
import {
  LAYOUT,
  RADIUS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { ClothboundBookCard } from '@/components/ClothboundBookCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useTabBlurTarget } from '@/context/TabBlurContext';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { StorageService } from '@/services/storage';
import {
  SearchDoc,
  buildDoc,
  parseQuery,
  scoreDoc,
} from '@/utils/banglaSearch';
import { CATEGORY_ORDER } from '@/utils/bookHelpers';
import { hapticSelection } from '@/utils/haptics';

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

function GridRowSeparator() {
  return <View style={{ height: 18 }} />;
}

export default function BrowseScreen() {
  const { theme, isDark } = usePathshalaTheme();
  const { setActiveBlurTarget } = useTabBlurTarget();
  const layout = useResponsiveLayout();
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
  const [headerHeight, setHeaderHeight] = useState(0);

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
  const hasActiveFilters =
    hasQuery || selectedType !== 'all' || selectedWriter !== 'all';

  const handleResetFilters = useCallback(() => {
    hapticSelection();
    setSearchInput('');
    setDebouncedInput('');
    setSelectedType('all');
    setSelectedWriter('all');
  }, []);

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
        {!hasQuery ? (
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
                  accessibilityRole="button"
                  accessibilityLabel={`খুঁজুন: ${tag}`}
                  style={({ pressed }) => [
                    styles.quickTagChip,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.borderSubtle,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}>
                  <Ionicons
                    name="search-outline"
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
        ) : null}

        {matchingChapters.length > 0 ? (
          <View style={styles.sectionBlock}>
            <SectionHeader
              title="গল্প, কবিতা ও পরিচ্ছেদ"
              countText={`${toBanglaNumber(matchingChapters.length)}টি মিল`}
            />
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
                  accessibilityRole="button"
                  accessibilityLabel={`${item.chapterTitle}, ${item.bookTitle}`}
                  style={({ pressed }) => [
                    styles.chapterMatchRow,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.borderSubtle,
                      opacity: pressed ? 0.86 : 1,
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
                      {renderWithNotoNumbers(item.chapterTitle, true)}
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
        ) : null}

        <SectionHeader
          title={activeHeading}
          countText={`${toBanglaNumber(filteredBooks.length)}টি বই`}
        />
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
        cardWidth={layout.gridCardWidth}
        readingChapter={readingHistory[item.id]?.chapterSequence}
        showAuthor={selectedWriter === 'all'}
        showGenre={selectedType === 'all'}
      />
    ),
    [layout.gridCardWidth, readingHistory, selectedWriter, selectedType]
  );

  const topPadding =
    headerHeight > 0 ? headerHeight + 16 : insets.top + 172;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <BlurTargetView ref={blurTargetRef} style={styles.safeArea}>
        <FlatList
          key={`browse-grid-${layout.gridColumns}`}
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          numColumns={layout.gridColumns}
          renderItem={renderBookItem}
          ListHeaderComponent={listHeaderElement}
          ListEmptyComponent={
            matchingChapters.length === 0 ? (
              <EmptyState
                icon="search-outline"
                title="কোনো বই বা গল্প পাওয়া যায়নি"
                description="অন্য কোনো শব্দ বা সহজ বানানে খুঁজে দেখুন অথবা সব রচনা দেখুন।"
                actionLabel="সব রচনা দেখুন"
                onAction={handleResetFilters}
              />
            ) : undefined
          }
          columnWrapperStyle={
            layout.gridColumns > 1
              ? [styles.booksGridRow, { gap: layout.gridGap }]
              : undefined
          }
          ItemSeparatorComponent={GridRowSeparator}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={[
            styles.scrollContent,
            {
              maxWidth: layout.contentMaxWidth,
              paddingHorizontal: layout.horizontalPadding,
              paddingTop: topPadding,
              paddingBottom:
                Math.max(insets.bottom, 12) + LAYOUT.bottomDockReserve,
            },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </BlurTargetView>

      {/* Docked Translucent Search & Persistent Filter Header */}
      <View
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h > 0 && h !== headerHeight) setHeaderHeight(h);
        }}
        style={styles.stickyHeaderWrap}
        pointerEvents="box-none">
        <GlassSurface
          variant="docked"
          intensity={78}
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
            <View style={styles.headerTitleRow}>
              <Text
                accessibilityRole="header"
                style={[styles.screenTitle, { color: theme.textPrimary }]}>
                খুঁজুন
              </Text>

              <View style={styles.headerMetaActions}>
                {hasActiveFilters ? (
                  <Pressable
                    onPress={handleResetFilters}
                    accessibilityRole="button"
                    accessibilityLabel="ফিল্টার মুছুন"
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.clearFiltersBtn,
                      pressed && { opacity: 0.7 },
                    ]}>
                    <Text
                      style={[
                        styles.clearFiltersText,
                        { color: theme.textSecondary },
                      ]}>
                      রিসেট
                    </Text>
                  </Pressable>
                ) : null}
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
            </View>

            <View
              style={[
                styles.searchBox,
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
                accessibilityLabel="বই, গল্প, কবিতা, গান বা লেখক অনুসন্ধান"
                style={[styles.searchInput, { color: theme.textPrimary }]}
              />
              {searchInput.length > 0 ? (
                <Pressable
                  onPress={() => {
                    hapticSelection();
                    setSearchInput('');
                    setDebouncedInput('');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="অনুসন্ধান মুছুন"
                  style={styles.clearInputBtn}>
                  <Ionicons
                    name="close-circle"
                    size={19}
                    color={theme.textMuted}
                  />
                </Pressable>
              ) : null}
            </View>

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
                        setSelectedType('all');
                        setSelectedWriter('all');
                      } else if (chip.kind === 'writer') {
                        setSelectedWriter((prev) =>
                          prev === chip.value ? 'all' : chip.value
                        );
                      } else {
                        const t = chip.value as LiteraryType;
                        setSelectedType((prev) => (prev === t ? 'all' : t));
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={chip.label}
                    style={({ pressed }) => [
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
                      pressed && { opacity: 0.8 },
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
          </View>
        </GlassSurface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  stickyHeaderWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  headerInner: {
    width: '100%',
    alignSelf: 'center',
    gap: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  screenTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 21,
    lineHeight: 28,
  },
  headerMetaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearFiltersBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFiltersText: {
    ...TYPOGRAPHY.caption,
    fontFamily: FONTS.sansBold,
  },
  resultCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  resultCountText: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: FONTS.sansBold,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: TOUCH_TARGET.min,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.sansMedium,
    paddingVertical: 8,
  },
  clearInputBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  chipBtn: {
    minHeight: 34,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    lineHeight: 17,
  },
  scrollContent: {
    width: '100%',
    alignSelf: 'center',
  },
  listHeaderWrap: {
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  quickTagsSection: {
    gap: 8,
  },
  quickTagsLabel: {
    ...TYPOGRAPHY.overline,
  },
  quickTagsScroll: {
    gap: 8,
  },
  quickTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  quickTagText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: FONTS.sansMedium,
  },
  sectionBlock: {
    gap: SPACING.sm,
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
    minWidth: 34,
    height: 34,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterBadgeText: {
    fontSize: 12.5,
    lineHeight: 17,
    fontFamily: FONTS.serifBold,
  },
  chapterMatchInfo: {
    flex: 1,
    gap: 2,
  },
  chapterMatchTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 14.5,
    lineHeight: 21,
  },
  chapterMatchSub: {
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: FONTS.sansMedium,
  },
  booksGridRow: {
    justifyContent: 'flex-start',
  },
});
