import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getBookMetaById, getWriterById } from '@/data/writers';
import type { ChapterMeta, ReadingHistory } from '@/types/library';
import { getWriterAvatarSource } from '@/constants/covers';
import {
  ELEVATION,
  RADIUS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { BookCoverArt } from '@/components/ui/BookCoverArt';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassHeader } from '@/components/ui/GlassHeader';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { StorageService } from '@/services/storage';
import {
  computeReadingProgressPct,
  formatReadDuration,
  getUnitLabel,
} from '@/utils/bookHelpers';
import { hapticSelection } from '@/utils/haptics';

function ChapterSeparator() {
  return <View style={{ height: SPACING.sm }} />;
}

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = usePathshalaTheme();
  const layout = useResponsiveLayout();
  const blurTargetRef = useRef<ComponentRef<typeof BlurTargetView>>(null);

  const bookMeta = id ? getBookMetaById(id) : undefined;
  const writer = bookMeta ? getWriterById(bookMeta.writerId) : undefined;
  const writerAvatar = writer ? getWriterAvatarSource(writer.id) : null;

  const [readingEntry, setReadingEntry] = useState<ReadingHistory | null>(null);
  const [tocFilter, setTocFilter] = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!bookMeta) return;
      StorageService.getReadingEntry(bookMeta.id).then(setReadingEntry);
    }, [bookMeta])
  );

  const lastPosition = readingEntry?.chapterSequence ?? null;
  const savedParagraph = readingEntry?.paragraphIndex ?? 0;
  const chaptersMeta = useMemo(
    () => bookMeta?.chaptersMeta || [],
    [bookMeta]
  );
  const unitLabel = bookMeta ? getUnitLabel(bookMeta.literaryType) : 'পরিচ্ছেদ';

  const filteredChapters = useMemo(() => {
    const q = tocFilter.trim().toLowerCase();
    if (!q) return chaptersMeta;
    return chaptersMeta.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.displayTitle.toLowerCase().includes(q) ||
        toBanglaNumber(c.number).includes(q) ||
        String(c.number).includes(q)
    );
  }, [chaptersMeta, tocFilter]);

  const handleStartReading = useCallback(
    (sequence: number, paragraphIdx = 0) => {
      if (!bookMeta) return;
      hapticSelection();
      router.push({
        pathname: '/reader/[id]',
        params: {
          id: bookMeta.id,
          initialChapter: String(sequence),
          initialParagraph: String(paragraphIdx),
        },
      });
    },
    [bookMeta, router]
  );

  const progressPct =
    bookMeta && lastPosition
      ? computeReadingProgressPct(lastPosition, bookMeta.totalChapters)
      : 0;

  const listHeader = useMemo(() => {
    if (!bookMeta) return undefined;
    const heroCoverWidth = layout.isTablet ? 168 : 154;

    return (
      <View style={styles.listHeader}>
        {/* Editorial Non-Interactive Jacket Hero */}
        <View
          style={[
            styles.heroCard,
            layout.isTablet && styles.heroCardRow,
            {
              backgroundColor: theme.card,
              borderColor: theme.borderSubtle,
            },
          ]}>
          <BookCoverArt
            book={bookMeta}
            width={heroCoverWidth}
            radius={RADIUS.md}
            progressPct={progressPct}
            showBookmarkDot={Boolean(lastPosition)}
            elevation="e3"
          />

          <View
            style={[
              styles.heroInfo,
              layout.isTablet && styles.heroInfoAlignedLeft,
            ]}>
            <View
              style={[
                styles.genreBadge,
                { backgroundColor: theme.accentSoftSage },
              ]}>
              <Text style={[styles.genreBadgeText, { color: theme.accentSage }]}>
                {bookMeta.genre}
              </Text>
            </View>

            <Text
              accessibilityRole="header"
              style={[
                styles.heroTitle,
                layout.isTablet && styles.textLeft,
                { color: theme.textPrimary },
              ]}>
              {renderWithNotoNumbers(bookMeta.title, true)}
            </Text>

            {bookMeta.summary ? (
              <Text
                style={[
                  styles.heroSummary,
                  layout.isTablet && styles.textLeft,
                  { color: theme.textSecondary },
                ]}>
                {bookMeta.summary}
              </Text>
            ) : null}

            {/* Author Link Pill */}
            <Pressable
              onPress={() => {
                hapticSelection();
                router.push(`/author/${bookMeta.writerId}` as any);
              }}
              accessibilityRole="button"
              accessibilityLabel={`রচয়িতা: ${bookMeta.author}`}
              style={({ pressed }) => [
                styles.authorPill,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderSubtle,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <View
                style={[
                  styles.authorAvatarSmall,
                  { backgroundColor: theme.card, overflow: 'hidden' },
                ]}>
                {writerAvatar ? (
                  <Image
                    source={writerAvatar}
                    resizeMode="cover"
                    style={styles.authorAvatarImg}
                  />
                ) : (
                  <Text
                    style={[
                      styles.authorMonogram,
                      { color: theme.accentTerracotta },
                    ]}>
                    {writer?.monogram || 'লে'}
                  </Text>
                )}
              </View>
              <View style={styles.authorInfo}>
                <Text style={[styles.authorLabel, { color: theme.textMuted }]}>
                  রচয়িতা
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.authorNameText, { color: theme.textPrimary }]}>
                  {renderWithNotoNumbers(
                    `${bookMeta.author}${writer?.birthDeath ? ` (${writer.birthDeath})` : ''}`,
                    true
                  )}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.accentTerracotta}
              />
            </Pressable>
          </View>
        </View>

        {/* Metadata Strip */}
        <View style={styles.metaRow}>
          <View
            style={[
              styles.metaItem,
              { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            ]}>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>
              মোট {unitLabel}
            </Text>
            <Text style={[styles.metaValue, { color: theme.textPrimary }]}>
              {toBanglaNumber(chaptersMeta.length)} টি
            </Text>
          </View>

          <View
            style={[
              styles.metaItem,
              { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            ]}>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>
              পাঠের সময়
            </Text>
            <Text style={[styles.metaValue, { color: theme.accentSage }]}>
              {formatReadDuration(bookMeta.totalReadMinutes || 0)}
            </Text>
          </View>

          <View
            style={[
              styles.metaItem,
              { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            ]}>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>
              অগ্রগতি
            </Text>
            <Text
              style={[
                styles.metaValue,
                {
                  color:
                    progressPct > 0
                      ? theme.accentTerracotta
                      : theme.textSecondary,
                },
              ]}>
              {progressPct > 0 ? `${toBanglaNumber(progressPct)}%` : 'নতুন'}
            </Text>
          </View>
        </View>

        {/* TOC Heading & Filter */}
        <View style={styles.tocHeaderRow}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionHeading, { color: theme.textPrimary }]}>
            {renderWithNotoNumbers(
              `সূচিপত্র (${toBanglaNumber(chaptersMeta.length)} টি ${unitLabel})`,
              true
            )}
          </Text>
        </View>

        {chaptersMeta.length > 8 ? (
          <View
            style={[
              styles.tocSearchBox,
              { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            ]}>
            <Ionicons name="search" size={16} color={theme.textMuted} />
            <TextInput
              value={tocFilter}
              onChangeText={setTocFilter}
              placeholder={`${unitLabel} খুঁজুন...`}
              placeholderTextColor={theme.textMuted}
              accessibilityLabel={`${unitLabel} অনুসন্ধান`}
              style={[styles.tocSearchInput, { color: theme.textPrimary }]}
            />
            {tocFilter.length > 0 ? (
              <Pressable
                onPress={() => setTocFilter('')}
                accessibilityRole="button"
                accessibilityLabel="অনুসন্ধান মুছুন"
                style={styles.clearTocBtn}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.textMuted}
                />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }, [
    bookMeta,
    layout.isTablet,
    theme,
    progressPct,
    lastPosition,
    router,
    writerAvatar,
    writer,
    unitLabel,
    chaptersMeta.length,
    tocFilter,
  ]);

  const renderChapter = useCallback(
    ({ item }: { item: ChapterMeta }) => {
      const isCurrent = lastPosition === item.number;
      const isDone = lastPosition !== null && item.number < lastPosition;
      return (
        <Pressable
          onPress={() =>
            handleStartReading(item.number, isCurrent ? savedParagraph : 0)
          }
          accessibilityRole="button"
          accessibilityLabel={`${item.displayTitle}, পর্ব ${toBanglaNumber(item.number)}`}
          style={({ pressed }) => [
            styles.chapterRow,
            {
              backgroundColor: theme.card,
              borderColor: isCurrent
                ? theme.accentTerracotta
                : theme.borderSubtle,
              opacity: pressed ? 0.86 : 1,
            },
          ]}>
          <View
            style={[
              styles.chapterSeqBadge,
              {
                backgroundColor: isCurrent
                  ? theme.accentTerracotta
                  : isDone
                    ? theme.accentSoftSage
                    : theme.surface,
              },
            ]}>
            {isDone ? (
              <Ionicons name="checkmark" size={15} color={theme.accentSage} />
            ) : (
              <Text
                style={[
                  styles.chapterSeqText,
                  { color: isCurrent ? '#FFFFFF' : theme.accentTerracotta },
                ]}>
                {toBanglaNumber(item.number)}
              </Text>
            )}
          </View>

          <View style={styles.chapterTitleWrap}>
            <Text
              numberOfLines={2}
              style={[styles.chapterTitle, { color: theme.textPrimary }]}>
              {renderWithNotoNumbers(item.displayTitle, true)}
            </Text>
            <Text style={[styles.chapterMeta, { color: theme.textMuted }]}>
              {renderWithNotoNumbers(
                `প্রায় ${toBanglaNumber(item.readMinutes)} মিনিট পাঠ${isCurrent ? ' • পড়ছেন' : ''}`
              )}
            </Text>
          </View>

          {isCurrent ? (
            <View
              style={[
                styles.currentBadge,
                { backgroundColor: theme.accentSoftSage },
              ]}>
              <Text style={[styles.currentBadgeText, { color: theme.accentSage }]}>
                চলমান
              </Text>
            </View>
          ) : (
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.textMuted}
            />
          )}
        </Pressable>
      );
    },
    [lastPosition, savedParagraph, handleStartReading, theme]
  );

  if (!bookMeta) {
    return (
      <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
        <GlassHeader backButton title="বই বিবরণ" />
        <View
          style={[
            styles.notFoundWrap,
            { paddingTop: insets.top + 96, paddingHorizontal: layout.horizontalPadding },
          ]}>
          <EmptyState
            icon="book-outline"
            title="বইটি খুঁজে পাওয়া যায়নি"
            description="অনুরোধকৃত বইটি পাঠাগারে পাওয়া যায়নি। পাঠাগারে ফিরে গিয়ে অন্য বই নির্বাচন করুন।"
            actionLabel="পাঠাগারে ফিরুন"
            onAction={() => router.replace('/')}
          />
        </View>
      </View>
    );
  }

  const topPad = headerHeight > 0 ? headerHeight + 16 : insets.top + 78;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <BlurTargetView ref={blurTargetRef} style={styles.safeArea}>
        <FlatList
          data={filteredChapters}
          keyExtractor={(item) => `ch-${item.number}`}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              compact
              icon="search-outline"
              title={`কোনো ${unitLabel} পাওয়া যায়নি`}
              description={`“${tocFilter.trim()}” এর সাথে মিল আছে এমন কোনো ${unitLabel} নেই।`}
              actionLabel="অনুসন্ধান মুছুন"
              onAction={() => setTocFilter('')}
            />
          }
          renderItem={renderChapter}
          ItemSeparatorComponent={ChapterSeparator}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.listContent,
            {
              maxWidth: layout.detailMaxWidth,
              paddingHorizontal: layout.horizontalPadding,
              paddingTop: topPad,
              paddingBottom: Math.max(insets.bottom, 16) + 98,
            },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </BlurTargetView>

      <GlassHeader
        backButton
        title={bookMeta.title}
        maxWidth={layout.detailMaxWidth}
        blurTarget={blurTargetRef}
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h > 0 && h !== headerHeight) setHeaderHeight(h);
        }}
      />

      {/* Sticky Bottom Liquid-Glass Primary CTA */}
      <View
        pointerEvents="box-none"
        style={[
          styles.stickyFooterWrap,
          { bottom: Math.max(insets.bottom, 12) + 8 },
        ]}>
        <GlassSurface
          radius={RADIUS.pill}
          intensity={76}
          elevation="e2"
          blurTarget={blurTargetRef}
          style={styles.stickyFooterContainer}
          contentStyle={styles.stickyFooterGlass}>
          <Pressable
            onPress={() =>
              handleStartReading(
                lastPosition || 1,
                lastPosition ? savedParagraph : 0
              )
            }
            accessibilityRole="button"
            accessibilityLabel={
              lastPosition
                ? `পড়া চালিয়ে যান, পর্ব ${toBanglaNumber(lastPosition)}`
                : 'পড়া শুরু করুন'
            }
            style={({ pressed }) => [
              styles.readActionButton,
              {
                backgroundColor: theme.accentTerracotta,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
            ]}>
            <Ionicons name="book-outline" size={19} color="#FFFFFF" />
            <Text style={styles.readActionButtonText}>
              {lastPosition
                ? renderWithNotoNumbers(
                    `পড়া চালিয়ে যান • পর্ব ${toBanglaNumber(lastPosition)}`,
                    true
                  )
                : 'পড়া শুরু করুন'}
            </Text>
          </Pressable>
        </GlassSurface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  notFoundWrap: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  listContent: {
    width: '100%',
    alignSelf: 'center',
  },
  listHeader: {
    gap: SPACING.base,
    marginBottom: SPACING.md,
  },
  heroCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.base,
    ...ELEVATION.e1,
  },
  heroCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
  },
  heroInfo: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
    flexShrink: 1,
  },
  heroInfoAlignedLeft: {
    alignItems: 'flex-start',
    flex: 1,
  },
  genreBadge: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  genreBadgeText: {
    ...TYPOGRAPHY.overline,
    fontSize: 11,
  },
  heroTitle: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
  },
  heroSummary: {
    ...TYPOGRAPHY.bodySerif,
    fontSize: 13.5,
    lineHeight: 22,
    textAlign: 'center',
  },
  textLeft: {
    textAlign: 'left',
  },
  authorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 12,
    marginTop: 4,
  },
  authorAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  authorMonogram: {
    fontSize: 15,
    fontFamily: FONTS.serifBold,
  },
  authorInfo: {
    flex: 1,
  },
  authorLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FONTS.sansMedium,
  },
  authorNameText: {
    ...TYPOGRAPHY.label,
    fontSize: 13.5,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaItem: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FONTS.sansMedium,
  },
  metaValue: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.serifBold,
    textAlign: 'center',
  },
  tocHeaderRow: {
    marginTop: 4,
  },
  sectionHeading: {
    ...TYPOGRAPHY.h2,
    fontSize: 17,
  },
  tocSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: TOUCH_TARGET.min,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  tocSearchInput: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: FONTS.sansMedium,
    paddingVertical: 8,
  },
  clearTocBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 12,
    minHeight: 60,
  },
  chapterSeqBadge: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterSeqText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONTS.serifBold,
  },
  chapterTitleWrap: {
    flex: 1,
    gap: 2,
  },
  chapterTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 14.5,
    lineHeight: 21,
  },
  chapterMeta: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: FONTS.sansMedium,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  currentBadgeText: {
    fontSize: 10.5,
    lineHeight: 15,
    fontFamily: FONTS.sansBold,
  },
  stickyFooterWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  stickyFooterContainer: {
    width: '100%',
    maxWidth: 460,
  },
  stickyFooterGlass: {
    padding: 6,
  },
  readActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: RADIUS.pill,
    gap: 8,
  },
  readActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FONTS.sansBold,
  },
});
