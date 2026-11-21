import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BookMeta } from '@/types/library';
import { RADIUS } from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { AppText as Text } from '@/components/ui/AppText';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { BookCoverArt } from '@/components/ui/BookCoverArt';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { computeReadingProgressPct, getUnitLabel } from '@/utils/bookHelpers';
import { hapticSelection } from '@/utils/haptics';

export interface ClothboundBookCardProps {
  book: BookMeta;
  size?: 'normal' | 'compact' | 'featured';
  cardWidth?: number;
  readingChapter?: number;
  showGenre?: boolean;
}

function ClothboundBookCardBase({
  book,
  size = 'normal',
  cardWidth: explicitWidth,
  readingChapter,
  showGenre = false,
}: ClothboundBookCardProps) {
  const router = useRouter();
  const { theme } = usePathshalaTheme();
  const layout = useResponsiveLayout();

  if (!book || !book.id) return null;

  const isCompact = size === 'compact';
  const isFeatured = size === 'featured';

  const resolvedWidth =
    explicitWidth ??
    (isFeatured
      ? Math.min(layout.width - 48, 220)
      : isCompact
        ? layout.shelfCardWidth
        : layout.gridCardWidth);

  const chaptersCount = book.totalChapters || 0;
  const unitLabel = getUnitLabel(book.literaryType);

  const readChapterNum =
    typeof readingChapter === 'number' && readingChapter > 0
      ? readingChapter
      : null;
  const progressPct = readChapterNum
    ? computeReadingProgressPct(readChapterNum, chaptersCount)
    : 0;

  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        router.push(`/book/${book.id}` as any);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, ${book.author}`}
      style={({ pressed }) => [
        styles.wrapper,
        { width: resolvedWidth },
        pressed && styles.pressed,
      ]}>
      <BookCoverArt
        book={book}
        width={resolvedWidth}
        radius={isCompact ? RADIUS.md - 2 : RADIUS.md}
        progressPct={progressPct}
        showBookmarkDot={Boolean(readChapterNum)}
        elevation="e2"
      />

      <View style={styles.metaBlock}>
        <View style={styles.metaBottomRow}>
          <Text
            numberOfLines={1}
            style={[styles.countText, { color: theme.textMuted }]}>
            {renderWithNotoNumbers(
              `${toBanglaNumber(chaptersCount)} ${unitLabel}${showGenre ? ` • ${book.genre}` : ''}`
            )}
          </Text>

          {readChapterNum ? (
            <View
              style={[
                styles.readingBadge,
                { backgroundColor: theme.accentSoftSage },
              ]}>
              <Text style={[styles.readingBadgeText, { color: theme.accentSage }]}>
                {renderWithNotoNumbers(`পর্ব ${toBanglaNumber(readChapterNum)}`, true)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const ClothboundBookCard = React.memo(
  ClothboundBookCardBase,
  (prev, next) =>
    prev.book.id === next.book.id &&
    prev.size === next.size &&
    prev.cardWidth === next.cardWidth &&
    prev.readingChapter === next.readingChapter &&
    prev.showGenre === next.showGenre
);

export default ClothboundBookCard;

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  pressed: {
    transform: [{ scale: 0.975 }],
    opacity: 0.9,
  },
  metaBlock: {
    gap: 2,
    paddingHorizontal: 2,
  },
  metaBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 2,
  },
  countText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: FONTS.sansMedium,
    flexShrink: 1,
  },
  readingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.xs,
  },
  readingBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: FONTS.sansBold,
  },
});
