import React, { useState, useMemo, useCallback, useRef, type ComponentRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
} from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getBookMetaById } from '@/data/writers';
import type { Bookmark, ReadingHistory } from '@/types/library';
import { RADIUS, SPACING, TOUCH_TARGET } from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { GlassHeader } from '@/components/ui/GlassHeader';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { StorageService } from '@/services/storage';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { useTabBlurTarget } from '@/context/TabBlurContext';
import { hapticSelection } from '@/utils/haptics';

function formatRelativeTimeBangla(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 2) return 'এইমাত্র';
  if (mins < 60) return `${toBanglaNumber(mins)} মিনিট আগে`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${toBanglaNumber(hrs)} ঘণ্টা আগে`;
  const days = Math.floor(hrs / 24);
  return `${toBanglaNumber(days)} দিন আগে`;
}

export default function LibraryScreen() {
  const { theme, isDark } = usePathshalaTheme();
  const { setActiveBlurTarget } = useTabBlurTarget();
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
  const [deletedItem, setDeletedItem] = useState<Bookmark | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      setActiveBlurTarget(blurTargetRef);
      StorageService.getAllReadingHistory().then(setHistoryMap);
      StorageService.getBookmarks().then(setBookmarks);
    }, [setActiveBlurTarget])
  );

  const inProgressList = useMemo(() => {
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
        const pct =
          book.totalChapters > 0
            ? Math.min(
                100,
                Math.round((entry.chapterSequence / book.totalChapters) * 100)
              )
            : 0;
        return {
          entry,
          book,
          chapterLabel:
            chMeta?.displayTitle ||
            `পর্ব ${toBanglaNumber(entry.chapterSequence)}`,
          progressPct: pct,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [historyMap]);

  const handleDeleteBookmark = async (bm: Bookmark) => {
    hapticSelection();
    const updated = await StorageService.removeBookmark(bm.id);
    setBookmarks(updated);
    setDeletedItem(bm);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setDeletedItem(null), 4000);
  };

  const handleUndoDelete = async () => {
    if (!deletedItem) return;
    hapticSelection();
    const updated = await StorageService.restoreBookmark(deletedItem);
    setBookmarks(updated);
    setDeletedItem(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const handleShare = async (
    text: string,
    bookTitle: string,
    chapterTitle: string
  ) => {
    try {
      await Share.share({
        message: `“${text}”\n— ${bookTitle} (${chapterTitle})`,
      });
    } catch {
      // ignore
    }
  };

  const segmentTrackBg = isDark
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(30, 25, 20, 0.05)';
  const segmentActiveBg = isDark
    ? 'rgba(228, 118, 77, 0.24)'
    : 'rgba(255, 255, 255, 0.9)';

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <BlurTargetView ref={blurTargetRef} style={styles.safeArea}>
        <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop:
              insets.top + 6 + (headerHeight > 0 ? headerHeight + 14 : 132),
            paddingBottom: Math.max(insets.bottom, 12) + 96,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {activeTab === 'reading' ? (
          inProgressList.length > 0 ? (
            <View style={styles.listWrap}>
              {inProgressList.map(({ entry, book, chapterLabel, progressPct }) => (
                <Pressable
                  key={book.id}
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
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.borderSubtle,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}>
                  <View style={styles.progressHeader}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.bookTitle, { color: theme.textPrimary }]}>
                        {book.title}
                      </Text>
                      <Text
                        style={[
                          styles.subText,
                          { color: theme.textSecondary },
                        ]}>
                        {renderWithNotoNumbers(
                          `${chapterLabel} • পর্ব ${toBanglaNumber(entry.chapterSequence)}/${toBanglaNumber(book.totalChapters)}`
                        )}
                      </Text>
                    </View>
                    <Text
                      style={[styles.timeText, { color: theme.textMuted }]}>
                      {renderWithNotoNumbers(formatRelativeTimeBangla(entry.lastReadAt))}
                    </Text>
                  </View>

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
                      style={[
                        styles.pctText,
                        { color: theme.accentTerracotta },
                      ]}>
                      {toBanglaNumber(progressPct)}%
                    </Text>
                  </View>

                  <View style={styles.resumeRow}>
                    <Text
                      style={[styles.authorMuted, { color: theme.textMuted }]}>
                      {book.author}
                    </Text>
                    <Text
                      style={[styles.resumeText, { color: theme.accentSage }]}>
                      চালিয়ে যান →
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderSubtle,
                },
              ]}>
              <Ionicons name="book-outline" size={32} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                এখনো কোনো বই পড়া শুরু হয়নি
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                পাঠাগার থেকে পছন্দের একটি বই খুলে পড়া শুরু করলে আপনার অগ্রগতি
                এখানে দেখাবে।
              </Text>
              <Pressable
                onPress={() => {
                  hapticSelection();
                  router.push('/browse');
                }}
                style={[
                  styles.browseBtn,
                  { backgroundColor: theme.accentTerracotta },
                ]}>
                <Text style={styles.browseBtnText}>বই খুঁজুন</Text>
              </Pressable>
            </View>
          )
        ) : bookmarks.length > 0 ? (
          <View style={styles.listWrap}>
            {bookmarks.map((bm) => (
              <Pressable
                key={bm.id}
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
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.borderSubtle,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}>
                <View style={styles.bmHeader}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.bmBookTitle,
                        { color: theme.accentTerracotta },
                      ]}>
                      {bm.bookTitle}
                    </Text>
                    <Text
                      style={[
                        styles.bmChapterTitle,
                        { color: theme.textMuted },
                      ]}>
                      {renderWithNotoNumbers(bm.chapterTitle)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteBookmark(bm)}
                    hitSlop={10}
                    accessibilityLabel="বুকমার্ক মুছুন"
                    style={styles.iconBtn}>
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={theme.textMuted}
                    />
                  </Pressable>
                </View>

                <Text style={[styles.bmQuote, { color: theme.textPrimary }]}>
                  “{bm.quoteSnippet}...”
                </Text>

                <View style={styles.bmFooter}>
                  <Text
                    style={[styles.resumeText, { color: theme.accentSage }]}>
                    পাঠ্যে ফিরুন →
                  </Text>
                  <Pressable
                    onPress={() =>
                      handleShare(bm.quoteSnippet, bm.bookTitle, bm.chapterTitle)
                    }
                    hitSlop={10}
                    accessibilityLabel="শেয়ার করুন">
                    <Ionicons
                      name="share-outline"
                      size={18}
                      color={theme.textMuted}
                    />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.emptyBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderSubtle,
              },
            ]}>
            <Ionicons
              name="bookmark-outline"
              size={32}
              color={theme.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              কোনো বুকমার্ক সংরক্ষিত নেই
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              বই পড়ার সময় যেকোনো অনুচ্ছেদে কিছুক্ষণ চেপে ধরে বুকমার্ক করতে
              পারবেন।
            </Text>
          </View>
        )}
      </ScrollView>
      </BlurTargetView>

      <GlassHeader
        title="আমার বই"
        subtitle="চলমান পাঠ ও সংরক্ষিত বুকমার্ক"
        floating
        radius={24}
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
              style={[
                styles.segmentBtn,
                activeTab === 'reading' && {
                  backgroundColor: segmentActiveBg,
                  borderColor: theme.glassRimTop,
                  borderWidth: 1,
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
              style={[
                styles.segmentBtn,
                activeTab === 'bookmarks' && {
                  backgroundColor: segmentActiveBg,
                  borderColor: theme.glassRimTop,
                  borderWidth: 1,
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

      {/* Undo Bookmark Deletion Toast */}
      {deletedItem && (
        <View
          style={[
            styles.undoToast,
            {
              bottom: Math.max(insets.bottom, 12) + 84,
              backgroundColor: theme.textPrimary,
            },
          ]}>
          <Text style={[styles.undoText, { color: theme.canvas }]}>
            বুকমার্ক মুছে ফেলা হয়েছে
          </Text>
          <Pressable onPress={handleUndoDelete} hitSlop={8}>
            <Text style={[styles.undoAction, { color: theme.accentTerracotta }]}>
              ফিরিয়ে আনুন
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  segmentWrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: RADIUS.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
  },
  listWrap: {
    gap: SPACING.md,
  },
  card: {
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  bookTitle: {
    fontSize: 16,
    fontFamily: FONTS.serifBold,
  },
  subText: {
    fontSize: 12,
    fontFamily: FONTS.sansMedium,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  pctText: {
    fontSize: 11,
    fontFamily: FONTS.serifBold,
  },
  resumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorMuted: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  resumeText: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
  },
  bmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  bmBookTitle: {
    fontSize: 14,
    fontFamily: FONTS.serifBold,
  },
  bmChapterTitle: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  iconBtn: {
    minWidth: TOUCH_TARGET.min / 2,
    minHeight: TOUCH_TARGET.min / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmQuote: {
    fontSize: 14,
    fontFamily: FONTS.serifRegular,
    lineHeight: 24,
  },
  bmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyBox: {
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.serifBold,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: FONTS.sansMedium,
    lineHeight: 20,
    textAlign: 'center',
  },
  browseBtn: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.sansBold,
  },
  undoToast: {
    position: 'absolute',
    left: SPACING.base,
    right: SPACING.base,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  undoText: {
    fontSize: 13,
    fontFamily: FONTS.sansMedium,
  },
  undoAction: {
    fontSize: 13,
    fontFamily: FONTS.sansBold,
  },
});
