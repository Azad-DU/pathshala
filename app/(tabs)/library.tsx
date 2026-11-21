import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getBookMetaById } from '@/data/writers';
import type { BookMeta, Bookmark, ReadingHistory } from '@/types/library';
import {
  ELEVATION,
  LAYOUT,
  RADIUS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { AppText as Text } from '@/components/ui/AppText';
import { BookCoverArt } from '@/components/ui/BookCoverArt';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassHeader } from '@/components/ui/GlassHeader';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { useSetTabBlurTarget } from '@/context/TabBlurContext';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { StorageService } from '@/services/storage';
import {
  computeReadingProgressPct,
  formatRelativeTimeBangla,
} from '@/utils/bookHelpers';
import { hapticSelection } from '@/utils/haptics';

interface InProgressEntry {
  entry: ReadingHistory;
  book: BookMeta;
  chapterLabel: string;
  progressPct: number;
}

type UndoState =
  | { kind: 'bookmark'; item: Bookmark }
  | { kind: 'history'; item: ReadingHistory; bookTitle: string };

function CardSeparator() {
  return <View style={{ height: SPACING.md }} />;
}

export default function LibraryScreen() {
  const { theme, isDark } = usePathshalaTheme();
  const setActiveBlurTarget = useSetTabBlurTarget();
  const layout = useResponsiveLayout();
  const blurTargetRef = useRef<ComponentRef<typeof BlurTargetView>>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'reading' | 'bookmarks'>(
    'reading'
  );
  const [historyMap, setHistoryMap] = useState<Record<string, ReadingHistory>>(
    {}
  );
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const syncTimer = setTimeout(() => {
        if (!active) return;
        setActiveBlurTarget(blurTargetRef);
        StorageService.getAllReadingHistory().then((next) => {
          if (active) {
            setHistoryMap((prev) => (prev === next ? prev : next));
          }
        });
        StorageService.getBookmarks().then((next) => {
          if (active) {
            setBookmarks((prev) => (prev === next ? prev : next));
          }
        });
      }, 260);

      return () => {
        active = false;
        clearTimeout(syncTimer);
      };
    }, [setActiveBlurTarget])
  );

  const inProgressList: InProgressEntry[] = useMemo(() => {
    return Object.values(historyMap)
      .sort(
        (a, b) =>
          new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
      )
      .map((entry) => {
        const book = getBookMetaById(entry.bookId);
        if (!book) return null;
        const chMeta = book.chaptersMeta.find(
          (c) => c.number === entry.chapterSequence
        );
        const pct = computeReadingProgressPct(
          entry.chapterSequence,
          book.totalChapters
        );
        return {
          entry,
          book,
          chapterLabel:
            chMeta?.displayTitle ||
            `পর্ব ${toBanglaNumber(entry.chapterSequence)}`,
          progressPct: pct,
        };
      })
      .filter((x): x is InProgressEntry => Boolean(x));
  }, [historyMap]);

  const scheduleUndoClear = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoState(null), 4200);
  }, []);

  const handleRemoveHistory = useCallback(
    async (entry: ReadingHistory, bookTitle: string) => {
      hapticSelection();
      const updated = await StorageService.removeReadingHistory(entry.bookId);
      setHistoryMap(updated);
      setUndoState({ kind: 'history', item: entry, bookTitle });
      scheduleUndoClear();
    },
    [scheduleUndoClear]
  );

  const handleDeleteBookmark = useCallback(
    async (bm: Bookmark) => {
      hapticSelection();
      const updated = await StorageService.removeBookmark(bm.id);
      setBookmarks(updated);
      setUndoState({ kind: 'bookmark', item: bm });
      scheduleUndoClear();
    },
    [scheduleUndoClear]
  );

  const handleUndo = useCallback(async () => {
    if (!undoState) return;
    hapticSelection();
    if (undoState.kind === 'bookmark') {
      const updated = await StorageService.restoreBookmark(undoState.item);
      setBookmarks(updated);
    } else {
      const updated = await StorageService.restoreReadingHistory(undoState.item);
      setHistoryMap(updated);
    }
    setUndoState(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, [undoState]);

  const handleShare = useCallback(
    async (text: string, bookTitle: string, chapterTitle: string) => {
      try {
        await Share.share({
          message: `“${text}”\n— ${bookTitle} (${chapterTitle})`,
        });
      } catch {
        // ignore
      }
    },
    []
  );

  const renderReadingItem = useCallback(
    ({ item }: { item: InProgressEntry }) => {
      const { entry, book, chapterLabel, progressPct } = item;
      return (
        <Pressable
          onPress={() => {
            hapticSelection();
            router.push({
              pathname: '/reader/[id]',
              params: {
                id: book.id,
                initialChapter: String(entry.chapterSequence),
                initialParagraph: String(entry.paragraphIndex ?? 0),
              },
            });
          }}
          accessibilityRole="button"
          accessibilityLabel={`${book.title}, ${chapterLabel}`}
          style={({ pressed }) => [
            styles.card,
            ELEVATION.e1,
            {
              backgroundColor: theme.card,
              borderColor: theme.borderSubtle,
              opacity: pressed ? 0.92 : 1,
            },
          ]}>
          <View style={styles.readingCardRow}>
            <BookCoverArt
              book={book}
              width={54}
              height={78}
              radius={7}
              elevation="e1"
            />

            <View style={styles.readingCardBody}>
              <View style={styles.progressHeader}>
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={[styles.bookTitle, { color: theme.textPrimary }]}>
                    {renderWithNotoNumbers(book.title, true)}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.authorMuted, { color: theme.textMuted }]}>
                    {book.author}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleRemoveHistory(entry, book.title)}
                  accessibilityRole="button"
                  accessibilityLabel={`${book.title} তালিকা থেকে সরান`}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    pressed && { opacity: 0.65 },
                  ]}>
                  <Ionicons
                    name="close-outline"
                    size={20}
                    color={theme.textMuted}
                  />
                </Pressable>
              </View>

              <Text
                numberOfLines={1}
                style={[styles.subText, { color: theme.textSecondary }]}>
                {renderWithNotoNumbers(
                  `${chapterLabel} • পর্ব ${toBanglaNumber(entry.chapterSequence)}/${toBanglaNumber(book.totalChapters)}`
                )}
              </Text>

              <View style={styles.progressBarRow}>
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: theme.surface },
                  ]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progressPct}%`,
                        backgroundColor: theme.accentTerracotta,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.pctText, { color: theme.accentTerracotta }]}>
                  {toBanglaNumber(progressPct)}%
                </Text>
              </View>

              <View style={styles.resumeRow}>
                <Text
                  numberOfLines={1}
                  style={[styles.timeText, { color: theme.textMuted }]}>
                  {renderWithNotoNumbers(
                    formatRelativeTimeBangla(entry.lastReadAt)
                  )}
                </Text>
                <Text style={[styles.resumeText, { color: theme.accentSage }]}>
                  {'চালিয়ে\u00A0যান →'}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [theme, router, handleRemoveHistory]
  );

  const renderBookmarkItem = useCallback(
    ({ item: bm }: { item: Bookmark }) => (
      <Pressable
        onPress={() => {
          hapticSelection();
          router.push({
            pathname: '/reader/[id]',
            params: {
              id: bm.bookId,
              initialChapter: String(bm.chapterSequence),
              initialParagraph: String(bm.paragraphIndex),
            },
          });
        }}
        accessibilityRole="button"
        accessibilityLabel={`${bm.bookTitle}, ${bm.chapterTitle}`}
        style={({ pressed }) => [
          styles.card,
          styles.bookmarkCard,
          ELEVATION.e1,
          {
            backgroundColor: theme.card,
            borderColor: theme.borderSubtle,
            borderLeftColor: theme.accentTerracotta,
            opacity: pressed ? 0.92 : 1,
          },
        ]}>
        <View style={styles.bmHeader}>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={[styles.bmBookTitle, { color: theme.accentTerracotta }]}>
              {renderWithNotoNumbers(bm.bookTitle, true)}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.bmChapterTitle, { color: theme.textMuted }]}>
              {renderWithNotoNumbers(bm.chapterTitle)}
              {bm.createdAt
                ? ` • ${formatRelativeTimeBangla(bm.createdAt)}`
                : ''}
            </Text>
          </View>
          <Pressable
            onPress={() => handleDeleteBookmark(bm)}
            accessibilityRole="button"
            accessibilityLabel="বুকমার্ক মুছুন"
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { opacity: 0.65 },
            ]}>
            <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.bmQuote, { color: theme.textPrimary }]}>
          “{bm.quoteSnippet}...”
        </Text>

        <View style={styles.bmFooter}>
          <Text style={[styles.resumeText, { color: theme.accentSage }]}>
            {'পাঠ্যে\u00A0ফিরুন →'}
          </Text>
          <Pressable
            onPress={() =>
              handleShare(bm.quoteSnippet, bm.bookTitle, bm.chapterTitle)
            }
            accessibilityRole="button"
            accessibilityLabel="শেয়ার করুন"
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { opacity: 0.65 },
            ]}>
            <Ionicons name="share-outline" size={18} color={theme.textMuted} />
          </Pressable>
        </View>
      </Pressable>
    ),
    [theme, router, handleDeleteBookmark, handleShare]
  );

  const segmentTrackBg = isDark
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(30, 25, 20, 0.05)';
  const segmentActiveBg = isDark
    ? 'rgba(228, 118, 77, 0.22)'
    : 'rgba(255, 255, 255, 0.94)';

  const topPad = headerHeight > 0 ? headerHeight + 16 : insets.top + 136;
  const bottomPad = Math.max(insets.bottom, 12) + LAYOUT.bottomDockReserve;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <BlurTargetView ref={blurTargetRef} style={styles.safeArea}>
        {activeTab === 'reading' ? (
          <FlatList
            key="library-reading"
            data={inProgressList}
            keyExtractor={(item) => item.book.id}
            renderItem={renderReadingItem}
            ItemSeparatorComponent={CardSeparator}
            ListEmptyComponent={
              <EmptyState
                icon="book-outline"
                title="এখনো কোনো বই পড়া শুরু হয়নি"
                description="পাঠাগার থেকে পছন্দের একটি বই খুলে পড়া শুরু করলে আপনার অগ্রগতি এখানে দেখাবে।"
                actionLabel="বই খুঁজুন"
                onAction={() => router.push('/browse')}
              />
            }
            contentContainerStyle={[
              styles.scrollContent,
              {
                maxWidth: layout.detailMaxWidth,
                paddingHorizontal: layout.horizontalPadding,
                paddingTop: topPad,
                paddingBottom: bottomPad,
              },
            ]}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            key="library-bookmarks"
            data={bookmarks}
            keyExtractor={(bm) => bm.id}
            renderItem={renderBookmarkItem}
            ItemSeparatorComponent={CardSeparator}
            ListEmptyComponent={
              <EmptyState
                icon="bookmark-outline"
                title="কোনো বুকমার্ক সংরক্ষিত নেই"
                description="বই পড়ার সময় যেকোনো অনুচ্ছেদে কিছুক্ষণ চেপে ধরলে সেটি বুকমার্ক হয়ে যাবে।"
                actionLabel="পাঠাগারে যান"
                onAction={() => router.push('/')}
              />
            }
            contentContainerStyle={[
              styles.scrollContent,
              {
                maxWidth: layout.detailMaxWidth,
                paddingHorizontal: layout.horizontalPadding,
                paddingTop: topPad,
                paddingBottom: bottomPad,
              },
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </BlurTargetView>

      <GlassHeader
        title="আমার বই"
        subtitle="চলমান পাঠ ও সংরক্ষিত বুকমার্ক"
        maxWidth={layout.detailMaxWidth}
        blurTarget={blurTargetRef}
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h > 0 && h !== headerHeight) setHeaderHeight(h);
        }}
        bottomSlot={
          <View
            style={[
              styles.segmentWrap,
              {
                backgroundColor: segmentTrackBg,
                borderColor: theme.borderSubtle,
              },
            ]}>
            <Pressable
              onPress={() => {
                hapticSelection();
                setActiveTab('reading');
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'reading' }}
              style={[
                styles.segmentBtn,
                activeTab === 'reading' && {
                  backgroundColor: segmentActiveBg,
                  borderColor: theme.borderSubtle,
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}>
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      activeTab === 'reading'
                        ? theme.accentTerracotta
                        : theme.textSecondary,
                    fontFamily:
                      activeTab === 'reading'
                        ? FONTS.sansBold
                        : FONTS.sansMedium,
                  },
                ]}>
                {renderWithNotoNumbers(
                  `পড়ছি (${toBanglaNumber(inProgressList.length)})`,
                  activeTab === 'reading'
                )}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                hapticSelection();
                setActiveTab('bookmarks');
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'bookmarks' }}
              style={[
                styles.segmentBtn,
                activeTab === 'bookmarks' && {
                  backgroundColor: segmentActiveBg,
                  borderColor: theme.borderSubtle,
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}>
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      activeTab === 'bookmarks'
                        ? theme.accentTerracotta
                        : theme.textSecondary,
                    fontFamily:
                      activeTab === 'bookmarks'
                        ? FONTS.sansBold
                        : FONTS.sansMedium,
                  },
                ]}>
                {renderWithNotoNumbers(
                  `বুকমার্ক (${toBanglaNumber(bookmarks.length)})`,
                  activeTab === 'bookmarks'
                )}
              </Text>
            </Pressable>
          </View>
        }
      />

      {undoState ? (
        <View
          style={[
            styles.undoToast,
            ELEVATION.e2,
            {
              bottom: Math.max(insets.bottom, 12) + 84,
              backgroundColor: theme.textPrimary,
            },
          ]}>
          <Text
            numberOfLines={2}
            style={[styles.undoText, { color: theme.canvas }]}>
            {undoState.kind === 'bookmark'
              ? 'বুকমার্ক মুছে ফেলা হয়েছে'
              : `“${undoState.bookTitle}” সরানো হয়েছে`}
          </Text>
          <Pressable
            onPress={handleUndo}
            accessibilityRole="button"
            accessibilityLabel="ফিরিয়ে আনুন"
            hitSlop={10}
            style={styles.undoActionBtn}>
            <Text style={[styles.undoAction, { color: theme.accentTerracotta }]}>
              {'ফিরিয়ে\u00A0আনুন'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  segmentWrap: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET.min - 4,
    borderRadius: RADIUS.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  scrollContent: {
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md + 2,
    gap: 10,
  },
  bookmarkCard: {
    borderLeftWidth: 3.5,
  },
  readingCardRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  readingCardBody: {
    flex: 1,
    gap: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  bookTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15.5,
  },
  authorMuted: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: FONTS.sansMedium,
  },
  subText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.sansMedium,
  },
  timeText: {
    fontSize: 11,
    lineHeight: 17,
    fontFamily: FONTS.sansMedium,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
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
  pctText: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: FONTS.serifBold,
  },
  resumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  resumeText: {
    fontFamily: FONTS.serifBold,
    fontSize: 12.5,
    lineHeight: 21,
    flexShrink: 0,
  },
  bmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  bmBookTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 14.5,
  },
  bmChapterTitle: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: FONTS.sansMedium,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
    marginRight: -6,
  },
  bmQuote: {
    ...TYPOGRAPHY.bodySerif,
    fontSize: 14,
    lineHeight: 24,
  },
  bmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  undoToast: {
    position: 'absolute',
    alignSelf: 'center',
    left: SPACING.base,
    right: SPACING.base,
    maxWidth: 460,
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  undoText: {
    fontSize: 13,
    lineHeight: 22,
    fontFamily: FONTS.serifMedium,
    flex: 1,
    minWidth: 0,
  },
  undoActionBtn: {
    flexShrink: 0,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  undoAction: {
    fontSize: 13,
    lineHeight: 22,
    fontFamily: FONTS.serifBold,
    flexShrink: 0,
  },
});
