import { ClothboundBookCard } from '@/components/ClothboundBookCard';
import { GlassHeader } from '@/components/ui/GlassHeader';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { getWriterAvatarSource } from '@/constants/covers';
import { RADIUS, SPACING, TOUCH_TARGET } from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { usePathshalaTheme } from '@/context/ThemeContext';
import {
  ALL_BOOKS_META,
  getBookMetaById,
  getWriterById,
} from '@/data/writers';
import { StorageService } from '@/services/storage';
import type { BookMeta, ChapterMeta, ReadingHistory } from '@/types/library';
import { hapticSelection } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatReadDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `≈ ${toBanglaNumber(totalMinutes)} মিনিট`;
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0
    ? `≈ ${toBanglaNumber(hrs)} ঘণ্টা ${toBanglaNumber(mins)} মি.`
    : `≈ ${toBanglaNumber(hrs)} ঘণ্টা`;
}

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = usePathshalaTheme();
  const blurTargetRef = useRef<ComponentRef<typeof BlurTargetView>>(null);

  const bookMeta: BookMeta = getBookMetaById(id || '') || ALL_BOOKS_META[0];
  const writer = getWriterById(bookMeta.writerId);
  const writerAvatar = writer ? getWriterAvatarSource(writer.id) : null;

  const [readingEntry, setReadingEntry] = useState<ReadingHistory | null>(null);
  const [tocFilter, setTocFilter] = useState('');

  useFocusEffect(
    useCallback(() => {
      StorageService.getReadingEntry(bookMeta.id).then(setReadingEntry);
    }, [bookMeta.id])
  );

  const lastPosition = readingEntry?.chapterSequence ?? null;
  const savedParagraph = readingEntry?.paragraphIndex ?? 0;
  const chaptersMeta = useMemo(() => bookMeta.chaptersMeta || [], [bookMeta]);
  const unitLabel = bookMeta.literaryType === 'golpo' ? 'গল্প' : 'পরিচ্ছেদ';

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

  const handleStartReading = (sequence: number, paragraphIdx = 0) => {
    hapticSelection();
    router.push({
      pathname: '/reader/[id]',
      params: {
        id: bookMeta.id,
        initialChapter: String(sequence),
        initialParagraph: String(paragraphIdx),
      },
    });
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.bookSpotlight}>
        <ClothboundBookCard
          book={bookMeta}
          size="featured"
          readingChapter={lastPosition ?? undefined}
        />
      </View>

      {/* Writer Pill */}
      <Pressable
        onPress={() => {
          hapticSelection();
          router.push(`/author/${bookMeta.writerId}` as any);
        }}
        style={({ pressed }) => [
          styles.authorPill,
          {
            backgroundColor: theme.surface,
            borderColor: theme.borderSubtle,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        <View style={[styles.authorAvatarSmall, { backgroundColor: theme.card, overflow: 'hidden' }]}>
          {writerAvatar ? (
            <Image source={writerAvatar} resizeMode="cover" style={styles.authorAvatarImg} />
          ) : (
            <Text style={[styles.authorMonogram, { color: theme.accentTerracotta }]}>
              {writer?.monogram || 'লে'}
            </Text>
          )}
        </View>
        <View style={styles.authorInfo}>
          <Text style={[styles.authorLabel, { color: theme.textMuted }]}>রচয়িতা</Text>
          <Text style={[styles.authorNameText, { color: theme.textPrimary }]}>
            {bookMeta.author}
            {writer?.birthDeath ? ` (${writer.birthDeath})` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.accentTerracotta} />
      </Pressable>

      {/* Stat Cards */}
      <View style={styles.metaRow}>
        <View
          style={[
            styles.metaItem,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}>
          <Text style={[styles.metaLabel, { color: theme.textMuted }]}>শাখা</Text>
          <Text style={[styles.metaValue, { color: theme.textPrimary }]}>
            {bookMeta.genre}
          </Text>
        </View>

        <View
          style={[
            styles.metaItem,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}>
          <Text style={[styles.metaLabel, { color: theme.textMuted }]}>মোট {unitLabel}</Text>
          <Text style={[styles.metaValue, { color: theme.textPrimary }]}>
            {toBanglaNumber(chaptersMeta.length)} টি
          </Text>
        </View>

        <View
          style={[
            styles.metaItem,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}>
          <Text style={[styles.metaLabel, { color: theme.textMuted }]}>পাঠের সময়</Text>
          <Text style={[styles.metaValue, { color: theme.accentSage }]}>
            {formatReadDuration(bookMeta.totalReadMinutes || 0)}
          </Text>
        </View>
      </View>

      {/* TOC Heading & Filter */}
      <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
        সূচিপত্র ({toBanglaNumber(chaptersMeta.length)} টি {unitLabel})
      </Text>

      {chaptersMeta.length > 8 && (
        <View
          style={[
            styles.tocSearchBox,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}>
          <Ionicons name="search" size={15} color={theme.textMuted} />
          <TextInput
            value={tocFilter}
            onChangeText={setTocFilter}
            placeholder={`${unitLabel} খুঁজুন...`}
            placeholderTextColor={theme.textMuted}
            accessibilityLabel={`${unitLabel} অনুসন্ধান`}
            style={[styles.tocSearchInput, { color: theme.textPrimary }]}
          />
          {tocFilter.length > 0 && (
            <Pressable onPress={() => setTocFilter('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.textMuted} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  const renderChapter = ({ item }: { item: ChapterMeta }) => {
    const isCurrent = lastPosition === item.number;
    const isDone = lastPosition !== null && item.number < lastPosition;
    return (
      <Pressable
        onPress={() =>
          handleStartReading(item.number, isCurrent ? savedParagraph : 0)
        }
        style={({ pressed }) => [
          styles.chapterRow,
          {
            backgroundColor: theme.card,
            borderColor: isCurrent ? theme.accentTerracotta : theme.borderSubtle,
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
          <Text style={[styles.chapterTitle, { color: theme.textPrimary }]}>
            {item.displayTitle}
          </Text>
          <Text style={[styles.chapterMeta, { color: theme.textMuted }]}>
            {renderWithNotoNumbers(
              `প্রায় ${toBanglaNumber(item.readMinutes)} মিনিট পাঠ${isCurrent ? ' • পড়ছেন' : ''}`
            )}
          </Text>
        </View>

        {isCurrent ? (
          <View style={[styles.currentBadge, { backgroundColor: theme.accentSoftSage }]}>
            <Text style={[styles.currentBadgeText, { color: theme.accentSage }]}>
              চলমান
            </Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <BlurTargetView ref={blurTargetRef} style={styles.safeArea}>
        <FlatList
          data={filteredChapters}
          keyExtractor={(item) => `ch-${item.number}`}
          ListHeaderComponent={renderHeader}
          renderItem={renderChapter}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingTop: insets.top + 82,
              paddingBottom: Math.max(insets.bottom, 16) + 96,
            },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </BlurTargetView>

      <GlassHeader
        backButton
        title={bookMeta.title}
        floating
        radius={24}
        blurTarget={blurTargetRef}
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
          intensity={75}
          elevation="e2"
          blurTarget={blurTargetRef}
          contentStyle={styles.stickyFooterGlass}>
          <Pressable
            onPress={() =>
              handleStartReading(
                lastPosition || 1,
                lastPosition ? savedParagraph : 0
              )
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
                ? renderWithNotoNumbers(`পড়া চালিয়ে যান • পর্ব ${toBanglaNumber(lastPosition)}`, true)
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
  listContent: {
    paddingHorizontal: SPACING.base,
  },
  listHeader: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  bookSpotlight: {
    alignItems: 'center',
    marginBottom: 4,
  },
  authorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 12,
  },
  authorAvatarSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  authorMonogram: {
    fontSize: 16,
    fontFamily: FONTS.serifBold,
  },
  authorInfo: {
    flex: 1,
  },
  authorLabel: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  authorNameText: {
    fontSize: 14,
    fontFamily: FONTS.sansBold,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaItem: {
    flex: 1,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: FONTS.sansMedium,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontFamily: FONTS.serifBold,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 17,
    fontFamily: FONTS.serifBold,
    marginTop: 4,
  },
  tocSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: TOUCH_TARGET.min,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  tocSearchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.sansMedium,
    paddingVertical: 6,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 12,
  },
  chapterSeqBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterSeqText: {
    fontSize: 13,
    fontFamily: FONTS.serifBold,
  },
  chapterTitleWrap: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 14,
    fontFamily: FONTS.serifBold,
    marginBottom: 2,
  },
  chapterMeta: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  currentBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.sansBold,
  },
  stickyFooterWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
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
    fontFamily: FONTS.sansBold,
  },
});
