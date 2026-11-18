import React from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BookMeta } from '@/types/library';
import { getBookCoverVisual } from '@/constants/covers';
import { ELEVATION } from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { hapticSelection } from '@/utils/haptics';

export interface ClothboundBookCardProps {
  book: BookMeta;
  size?: 'normal' | 'compact' | 'featured';
  readingChapter?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const coverPalette: Record<string, { bg: string; accent: string }> = {
  terracotta: { bg: '#6E2B14', accent: '#F6D6A8' },
  sage: { bg: '#2B3E2E', accent: '#DCE8DA' },
  charcoal: { bg: '#16201A', accent: '#E8B88A' },
};

function ClothboundBookCardBase({
  book,
  size = 'normal',
  readingChapter,
}: ClothboundBookCardProps) {
  const router = useRouter();
  const { theme, isDark } = usePathshalaTheme();

  if (!book || !book.id) return null;

  const isCompact = size === 'compact';
  const isFeatured = size === 'featured';

  const cardWidth = isFeatured
    ? Math.min(SCREEN_WIDTH - 36, 320)
    : isCompact
    ? 152
    : Math.floor((SCREEN_WIDTH - 44) / 2);
  const coverHeight = isFeatured ? 228 : isCompact ? 184 : 210;

  const styleConfig = coverPalette[book.coverStyle] || coverPalette.terracotta;
  const coverVisual = getBookCoverVisual(book);
  const chaptersCount = book.totalChapters || 0;
  const unitLabel = book.literaryType === 'golpo' ? 'গল্প' : 'পরিচ্ছেদ';

  const readChapterNum =
    typeof readingChapter === 'number' && readingChapter > 0
      ? readingChapter
      : null;
  const progressPct =
    readChapterNum && chaptersCount > 0
      ? Math.min(100, Math.round((readChapterNum / chaptersCount) * 100))
      : 0;

  const pageBlockColor = isDark ? '#323E36' : '#E7DEC9';
  const pageBlockBottomColor = isDark ? '#252F29' : '#D8CEB4';

  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        router.push(`/book/${book.id}` as any);
      }}
      accessibilityLabel={`${book.title}, ${book.author}`}
      style={({ pressed }) => [
        { width: cardWidth },
        pressed && styles.pressedCard,
      ]}>
      <View
        style={[
          styles.container,
          ELEVATION.e2,
          {
            backgroundColor: theme.card,
            borderColor: theme.borderSubtle,
          },
        ]}>
        {/* Physical Hardcover Book Frame with Right/Bottom Page-Edge Block */}
        <View
          style={[
            styles.coverBox,
            {
              height: coverHeight,
              backgroundColor: styleConfig.bg,
              borderRightColor: pageBlockColor,
              borderBottomColor: pageBlockBottomColor,
            },
          ]}>
          {/* 1. Full Illustrated Cover Artwork with Per-Book Focal Crop */}
          <Image
            source={coverVisual.source}
            resizeMode="cover"
            fadeDuration={0}
            style={[
              styles.coverImage,
              {
                transform: [
                  { scale: coverVisual.scale },
                  { translateX: coverVisual.translateX },
                  { translateY: coverVisual.translateY },
                ],
              },
            ]}
          />

          {/* 2. Subtle Per-Book Atmospheric Mood Tint */}
          <View
            pointerEvents="none"
            style={[
              styles.absFill,
              { backgroundColor: coverVisual.tintColor },
            ]}
          />

          {/* 3. Diagonal Specular Lamination Gloss Highlight */}
          <View pointerEvents="none" style={styles.diagonalGloss} />

          {/* 4. Realistic 3D Book Spine Hinge */}
          <View pointerEvents="none" style={styles.spineHinge}>
            <View style={styles.spineGrooveDark} />
            <View style={styles.spineHighlightLine} />
            <View style={styles.spineGrooveLight} />
          </View>

          {/* 5. Top Floating Glass Genre Badge + Bottom Liquid Glass Title Plate */}
          <View style={styles.coverInner}>
            <View style={styles.coverTopRow}>
              <View style={styles.topStatusSlot}>
                {readChapterNum ? (
                  <View style={styles.bookmarkDotBadge}>
                    <Ionicons
                      name="bookmark"
                      size={11}
                      color={coverVisual.accentColor}
                    />
                  </View>
                ) : null}
              </View>

              <View style={styles.genreGlassPill}>
                <Text style={styles.genreGlassText}>{book.genre}</Text>
              </View>
            </View>

            {/* Bottom Frosted Liquid-Glass Title Plate */}
            <View style={styles.titlePlate}>
              <View pointerEvents="none" style={styles.titlePlateSheen} />
              <Text
                numberOfLines={2}
                style={[
                  styles.bookTitle,
                  {
                    fontSize: isFeatured ? 20 : isCompact ? 14 : 15.5,
                    lineHeight: isFeatured ? 27 : isCompact ? 19 : 21,
                  },
                ]}>
                {book.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.authorName,
                  { fontSize: isCompact ? 10 : 11 },
                ]}>
                {book.author}
              </Text>

              {progressPct > 0 && (
                <View style={styles.coverProgressTrack}>
                  <View
                    style={[
                      styles.coverProgressFill,
                      {
                        width: `${progressPct}%`,
                        backgroundColor: coverVisual.accentColor,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Bottom Metadata Bar Outside Cover */}
        <View style={styles.bottomMetaRow}>
          <View style={styles.chapterCountWrap}>
            <Ionicons
              name="layers-outline"
              size={13}
              color={theme.accentTerracotta}
            />
            <Text style={[styles.chapterCountText, { color: theme.textSecondary }]}>
              {renderWithNotoNumbers(`${toBanglaNumber(chaptersCount)} ${unitLabel}`)}
            </Text>
          </View>

          {readChapterNum ? (
            <Text style={[styles.readActionText, { color: theme.accentSage }]}>
              {renderWithNotoNumbers(`পর্ব ${toBanglaNumber(readChapterNum)}`, true)}
            </Text>
          ) : (
            <Text
              style={[styles.readActionText, { color: theme.accentTerracotta }]}>
              পড়ুন →
            </Text>
          )}
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
    prev.readingChapter === next.readingChapter
);

export default ClothboundBookCard;

const styles = StyleSheet.create({
  pressedCard: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 8,
  },
  coverBox: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
  },
  absFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  diagonalGloss: {
    position: 'absolute',
    top: -36,
    left: -34,
    width: '135%',
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    transform: [{ rotate: '-26deg' }],
    zIndex: 1,
  },
  spineHinge: {
    width: 11,
    height: '100%',
    backgroundColor: 'rgba(12, 10, 8, 0.34)',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 2,
    gap: 1.5,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.24)',
    zIndex: 2,
  },
  spineGrooveDark: {
    width: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  spineHighlightLine: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  spineGrooveLight: {
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  coverInner: {
    flex: 1,
    padding: 7,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  coverTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topStatusSlot: {
    minWidth: 20,
    alignItems: 'flex-start',
  },
  bookmarkDotBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(18, 15, 12, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genreGlassPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(18, 16, 14, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderTopColor: 'rgba(255, 255, 255, 0.34)',
  },
  genreGlassText: {
    color: '#FFFDF8',
    fontSize: 9.5,
    fontFamily: FONTS.sansBold,
  },
  titlePlate: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: 'rgba(16, 14, 12, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderTopColor: 'rgba(255, 255, 255, 0.32)',
    overflow: 'hidden',
  },
  titlePlateSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bookTitle: {
    color: '#FFFDF9',
    fontFamily: FONTS.serifBold,
    marginBottom: 2,
  },
  authorName: {
    color: 'rgba(255, 245, 235, 0.85)',
    fontFamily: FONTS.sansMedium,
  },
  coverProgressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    overflow: 'hidden',
    marginTop: 6,
  },
  coverProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  bottomMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 3,
  },
  chapterCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chapterCountText: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
  },
  readActionText: {
    fontSize: 11,
    fontFamily: FONTS.sansBold,
  },
});
