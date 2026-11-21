import { ClothboundBookCard } from '@/components/ClothboundBookCard';
import { AppText as Text } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getWriterAvatarSource } from '@/constants/covers';
import {
  LAYOUT,
  RADIUS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { useSetTabBlurTarget } from '@/context/TabBlurContext';
import { usePathshalaTheme } from '@/context/ThemeContext';
import {
  ALL_BOOKS_META,
  LITERARY_TYPE_INFO,
  WRITERS,
  getBooksByWriter,
} from '@/data/writers';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { StorageService } from '@/services/storage';
import type {
  BookMeta,
  LiteraryType,
  ReadingHistory,
  WriterProfile,
} from '@/types/library';
import {
  SearchDoc,
  buildDoc,
  hasStrongTokenHit,
  parseQuery,
  scoreDoc,
  scoreStrongOnly,
} from '@/utils/banglaSearch';
import { CATEGORY_ORDER } from '@/utils/bookHelpers';
import { hapticSelection } from '@/utils/haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurTargetView } from 'expo-blur';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ComponentRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const QUICK_SEARCH_TAGS = [
  'পথের পাঁচালী',
  'গীতাঞ্জলি',
  'দেবদাস',
  'আনন্দমঠ',
  'বিদ্রোহী',
  'শ্রীকান্ত',
  'চাঁদের পাহাড়',
  'নজরুলগীতি',
];

const WRITER_SEARCH_ALIASES: Record<string, string> = {
  bibhutibhushan:
    'bibhutibhushan bandyopadhyay bandopadhyay banerjee bibhuti',
  rabindranath:
    'rabindranath robindronath tagore thakur robi rabi gurudev',
  saratchandra:
    'saratchandra sharatchandra sarat sharat chattopadhyay chatterjee',
  bankimchandra:
    'bankimchandra bonkim bankim bonkim chattopadhyay chatterjee',
  nazrul:
    'kazi nazrul nojrul islam nazrulgeeti nazrulgiti bidrohi kaji',
};

const INITIAL_CHAPTER_CAP = 6;
const MAX_CHAPTER_CAP = 30;

interface IndexedWriter {
  writer: WriterProfile;
  bookCount: number;
  doc: SearchDoc;
}

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

const INDEXED_WRITERS: IndexedWriter[] = WRITERS.map((writer) => ({
  writer,
  bookCount: getBooksByWriter(writer.id).length,
  doc: buildDoc(
    [writer.name, WRITER_SEARCH_ALIASES[writer.id] || writer.id],
    [writer.era]
  ),
}));

const INDEXED_BOOKS: IndexedBook[] = ALL_BOOKS_META.map((book) => ({
  book,
  doc: buildDoc(
    [
      book.title,
      book.id.replace(/^(rt|sc|bc|kn)-/, '').replace(/-/g, ' '),
    ],
    [
      book.author,
      book.writerId,
      WRITER_SEARCH_ALIASES[book.writerId] || '',
      book.genre,
      LITERARY_TYPE_INFO[book.literaryType].label,
      book.summary || '',
    ]
  ),
}));

let cachedIndexedChapters: IndexedChapter[] | null = null;
function getIndexedChapters(): IndexedChapter[] {
  if (cachedIndexedChapters) return cachedIndexedChapters;
  cachedIndexedChapters = ALL_BOOKS_META.flatMap((book) => {
    const writerAliases = WRITER_SEARCH_ALIASES[book.writerId] || '';
    return book.chaptersMeta.map((ch) => ({
      bookId: book.id,
      bookTitle: book.title,
      literaryType: book.literaryType,
      writerId: book.writerId,
      chapterNumber: ch.number,
      chapterTitle: ch.displayTitle,
      readMinutes: ch.readMinutes,
      doc: buildDoc(
        [ch.displayTitle, ch.title],
        [book.title, book.author, writerAliases],
        false
      ),
    }));
  });
  return cachedIndexedChapters;
}

function getWriterChipLabel(writer: WriterProfile): string {
  if (writer.id === 'nazrul') return 'নজরুল';
  return writer.name.split(' ')[0];
}

function GridRowSeparator() {
  return <View style={{ height: 18 }} />;
}

export default function BrowseScreen() {
  const { theme, isDark } = usePathshalaTheme();
  const setActiveBlurTarget = useSetTabBlurTarget();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const blurTargetRef = useRef<ComponentRef<typeof BlurTargetView>>(null);
  const flatListRef = useRef<FlatList<BookMeta>>(null);
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
  const [expandedQueryKey, setExpandedQueryKey] = useState<string | null>(null);
  const [readingHistory, setReadingHistory] = useState<
    Record<string, ReadingHistory>
  >({});
  const [headerHeight, setHeaderHeight] = useState(0);

  const activeQueryKey = `${debouncedInput}:${selectedType}:${selectedWriter}`;
  const showAllChapters = expandedQueryKey === activeQueryKey;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(searchInput), 140);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [debouncedInput, selectedType, selectedWriter]);

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
      };
    }, [setActiveBlurTarget])
  );

  const parsedQuery = useMemo(
    () => parseQuery(debouncedInput),
    [debouncedInput]
  );
  const hasQuery = parsedQuery.tokens.length > 0;
  const hasActiveFilters =
    hasQuery || selectedType !== 'all' || selectedWriter !== 'all';

  const handleResetAll = useCallback(() => {
    hapticSelection();
    setSearchInput('');
    setDebouncedInput('');
    setSelectedType('all');
    setSelectedWriter('all');
  }, []);

  const handleClearScopeFiltersOnly = useCallback(() => {
    hapticSelection();
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
        chips.push({
          id: `writer:${w.id}`,
          kind: 'writer',
          value: w.id,
          label: getWriterChipLabel(w),
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

  const matchingWriters = useMemo(() => {
    if (!hasQuery) return [];
    const hits: { item: IndexedWriter; score: number }[] = [];
    for (const w of INDEXED_WRITERS) {
      if (selectedWriter !== 'all' && w.writer.id !== selectedWriter) continue;
      const score = scoreDoc(w.doc, parsedQuery);
      if (score > 0) hits.push({ item: w, score });
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.map((h) => h.item);
  }, [hasQuery, parsedQuery, selectedWriter]);

  const chapterSearchResult = useMemo(() => {
    if (!hasQuery) {
      return {
        filtered: [] as IndexedChapter[],
        bestBookScores: new Map<string, number>(),
        globalCount: 0,
      };
    }

    const chapters = getIndexedChapters();
    const scoredFiltered: { item: IndexedChapter; score: number }[] = [];
    const bestBookScores = new Map<string, number>();
    let globalCount = 0;

    for (const item of chapters) {
      if (!hasStrongTokenHit(item.doc, parsedQuery)) continue;
      const score = scoreDoc(item.doc, parsedQuery);
      if (score <= 0) continue;

      globalCount++;
      const matchesScope =
        (selectedType === 'all' || item.literaryType === selectedType) &&
        (selectedWriter === 'all' || item.writerId === selectedWriter);

      if (matchesScope) {
        scoredFiltered.push({ item, score });
        const prev = bestBookScores.get(item.bookId) ?? 0;
        if (score > prev) bestBookScores.set(item.bookId, score);
      }
    }

    scoredFiltered.sort((a, b) => b.score - a.score);
    return {
      filtered: scoredFiltered.slice(0, MAX_CHAPTER_CAP).map((s) => s.item),
      bestBookScores,
      globalCount,
    };
  }, [hasQuery, parsedQuery, selectedType, selectedWriter]);

  const matchingChapters = chapterSearchResult.filtered;

  const bookSearchResult = useMemo(() => {
    const scored: {
      book: BookMeta;
      score: number;
      hasDirectTitleHit: boolean;
    }[] = [];
    let anyDirectTitleHit = false;
    let globalBookCount = 0;

    for (const item of INDEXED_BOOKS) {
      const { book, doc } = item;
      const directScore = hasQuery ? scoreDoc(doc, parsedQuery) : 1;
      const titleHitScore = hasQuery ? scoreStrongOnly(doc, parsedQuery) : 0;
      const chapterScore = hasQuery
        ? (chapterSearchResult.bestBookScores.get(book.id) ?? 0)
        : 0;

      const anyMatch = directScore > 0 || chapterScore > 0;
      if (hasQuery && directScore > 0) {
        globalBookCount++;
      }

      if (!anyMatch) continue;
      if (selectedType !== 'all' && book.literaryType !== selectedType) {
        continue;
      }
      if (selectedWriter !== 'all' && book.writerId !== selectedWriter) {
        continue;
      }

      const finalScore = Math.max(
        directScore,
        chapterScore > 0 ? Math.min(10, chapterScore) : 0
      );
      if (titleHitScore > 0) anyDirectTitleHit = true;

      scored.push({
        book,
        score: finalScore,
        hasDirectTitleHit: titleHitScore > 0,
      });
    }

    if (hasQuery) {
      scored.sort((a, b) => {
        if (a.hasDirectTitleHit !== b.hasDirectTitleHit) {
          return a.hasDirectTitleHit ? -1 : 1;
        }
        return b.score - a.score;
      });
    }

    return {
      books: scored.map((s) => s.book),
      anyDirectTitleHit,
      globalBookCount,
    };
  }, [
    hasQuery,
    parsedQuery,
    selectedType,
    selectedWriter,
    chapterSearchResult.bestBookScores,
  ]);

  const filteredBooks = bookSearchResult.books;
  const visibleChapters = showAllChapters
    ? matchingChapters
    : matchingChapters.slice(0, INITIAL_CHAPTER_CAP);
  const placeChaptersAboveBooks =
    hasQuery && !bookSearchResult.anyDirectTitleHit && matchingChapters.length > 0;

  const isScopeFiltered = selectedType !== 'all' || selectedWriter !== 'all';
  const totalResultsCount =
    filteredBooks.length + matchingChapters.length + matchingWriters.length;
  const globalMatchEstimate =
    bookSearchResult.globalBookCount + chapterSearchResult.globalCount;
  const hiddenResultsExist =
    hasQuery &&
    isScopeFiltered &&
    (filteredBooks.length === 0 ||
      globalMatchEstimate > filteredBooks.length + matchingChapters.length);

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

  const renderChapterMatchesSection = useCallback(() => {
    if (visibleChapters.length === 0) return null;
    const remainingCount = matchingChapters.length - visibleChapters.length;

    return (
      <View style={styles.sectionBlock}>
        <SectionHeader
          title="গল্প, কবিতা, গান ও অধ্যায়"
          countText={`${toBanglaNumber(matchingChapters.length)}টি মিল`}
        />
        <View style={styles.chapterMatchesList}>
          {visibleChapters.map((item) => (
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

        {remainingCount > 0 ? (
          <Pressable
            onPress={() => {
              hapticSelection();
              setExpandedQueryKey(activeQueryKey);
            }}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.expandChaptersBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderSubtle,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Text
              style={[
                styles.expandChaptersText,
                { color: theme.accentTerracotta },
              ]}>
              {renderWithNotoNumbers(
                `আরও ${toBanglaNumber(remainingCount)}টি মিল দেখুন`
              )}
            </Text>
            <Ionicons
              name="chevron-down"
              size={15}
              color={theme.accentTerracotta}
            />
          </Pressable>
        ) : null}
      </View>
    );
  }, [visibleChapters, matchingChapters.length, activeQueryKey, theme, router]);

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
                    setSelectedType('all');
                    setSelectedWriter('all');
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

        {hiddenResultsExist ? (
          <Pressable
            onPress={handleClearScopeFiltersOnly}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.scopeHintBanner,
              {
                backgroundColor: theme.accentSoftSage,
                borderColor: theme.borderSubtle,
                opacity: pressed ? 0.84 : 1,
              },
            ]}>
            <Ionicons
              name="funnel-outline"
              size={15}
              color={theme.accentSage}
            />
            <Text style={[styles.scopeHintText, { color: theme.textPrimary }]}>
              সকল লেখক ও বিভাগে আরও ফলাফল রয়েছে — ফিল্টার সরিয়ে সব দেখুন
            </Text>
          </Pressable>
        ) : null}

        {matchingWriters.length > 0 ? (
          <View style={styles.sectionBlock}>
            <SectionHeader
              title="সাহিত্যিক"
              countText={`${toBanglaNumber(matchingWriters.length)}জন`}
            />
            <View style={styles.writersResultList}>
              {matchingWriters.map(({ writer, bookCount }) => {
                const avatar = getWriterAvatarSource(writer.id);
                return (
                  <Pressable
                    key={writer.id}
                    onPress={() => {
                      hapticSelection();
                      router.push(`/author/${writer.id}` as any);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={writer.name}
                    style={({ pressed }) => [
                      styles.writerResultCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.borderSubtle,
                        opacity: pressed ? 0.86 : 1,
                      },
                    ]}>
                    <View
                      style={[
                        styles.writerAvatar,
                        { backgroundColor: writer.avatarColor },
                      ]}>
                      {avatar ? (
                        <Image
                          source={avatar}
                          resizeMode="cover"
                          style={styles.writerAvatarImg}
                        />
                      ) : (
                        <Text style={styles.writerMonogram}>
                          {writer.monogram}
                        </Text>
                      )}
                    </View>
                    <View style={styles.writerInfo}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.writerName,
                          { color: theme.textPrimary },
                        ]}>
                        {writer.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.writerMeta, { color: theme.textMuted }]}>
                        {renderWithNotoNumbers(
                          `${writer.birthDeath} • ${toBanglaNumber(bookCount)}টি গ্রন্থ`
                        )}
                      </Text>
                    </View>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={theme.accentTerracotta}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {placeChaptersAboveBooks ? renderChapterMatchesSection() : null}

        {filteredBooks.length > 0 || (!hasQuery && !placeChaptersAboveBooks) ? (
          <SectionHeader
            title={activeHeading}
            countText={`${toBanglaNumber(filteredBooks.length)}টি বই`}
          />
        ) : null}
      </View>
    ),
    [
      hasQuery,
      hiddenResultsExist,
      handleClearScopeFiltersOnly,
      matchingWriters,
      placeChaptersAboveBooks,
      renderChapterMatchesSection,
      filteredBooks.length,
      activeHeading,
      theme,
      router,
    ]
  );

  const listFooterElement = useMemo(() => {
    if (placeChaptersAboveBooks || matchingChapters.length === 0) {
      return undefined;
    }
    return <View style={styles.listFooterWrap}>{renderChapterMatchesSection()}</View>;
  }, [placeChaptersAboveBooks, matchingChapters.length, renderChapterMatchesSection]);

  const renderBookItem = useCallback(
    ({ item }: { item: BookMeta }) => (
      <ClothboundBookCard
        book={item}
        cardWidth={layout.gridCardWidth}
        readingChapter={readingHistory[item.id]?.chapterSequence}
        showGenre={selectedType === 'all'}
      />
    ),
    [layout.gridCardWidth, readingHistory, selectedType]
  );

  const topPadding =
    headerHeight > 0 ? headerHeight + 16 : insets.top + 172;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <BlurTargetView ref={blurTargetRef} style={styles.safeArea}>
        <FlatList
          ref={flatListRef}
          key={`browse-grid-${layout.gridColumns}`}
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          numColumns={layout.gridColumns}
          renderItem={renderBookItem}
          ListHeaderComponent={listHeaderElement}
          ListFooterComponent={listFooterElement}
          ListEmptyComponent={
            matchingChapters.length === 0 && matchingWriters.length === 0 ? (
              <EmptyState
                icon="search-outline"
                title="কোনো বই বা গল্প পাওয়া যায়নি"
                description="বাংলা বা ইংরেজি (Banglish) যেকোনো বানানে খুঁজে দেখুন অথবা সব ফিল্টার সরিয়ে নিন।"
                actionLabel="সব রচনা দেখুন"
                onAction={handleResetAll}
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
                    onPress={handleResetAll}
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
                onSubmitEditing={() => {
                  setDebouncedInput(searchInput);
                  Keyboard.dismiss();
                }}
                autoCorrect={false}
                autoCapitalize="none"
                placeholder="বাংলা বা ইংরেজিতে বই, গল্প, কবিতা, গান বা লেখক খুঁজুন..."
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
  listFooterWrap: {
    marginTop: SPACING.xl,
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
  scopeHintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  scopeHintText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: FONTS.sansMedium,
  },
  writersResultList: {
    gap: 8,
  },
  writerResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 12,
  },
  writerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  writerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  writerMonogram: {
    color: '#FFFFFF',
    fontFamily: FONTS.serifBold,
    fontSize: 15,
  },
  writerInfo: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  writerName: {
    ...TYPOGRAPHY.h3,
    fontSize: 14.5,
    lineHeight: 20,
  },
  writerMeta: {
    fontSize: 11.5,
    lineHeight: 16,
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
  expandChaptersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  expandChaptersText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: FONTS.sansBold,
  },
  booksGridRow: {
    justifyContent: 'flex-start',
  },
});
