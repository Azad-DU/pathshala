import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BookMeta } from '@/types/library';
import { getBookCoverVisual } from '@/constants/covers';
import { ELEVATION } from '@/constants/design';

const COVER_BG: Record<string, string> = {
  terracotta: '#5E2714',
  sage: '#283A2B',
  charcoal: '#17201B',
};

export interface BookCoverArtProps {
  book: BookMeta;
  width: number;
  height?: number;
  radius?: number;
  progressPct?: number;
  showBookmarkDot?: boolean;
  elevation?: 'none' | 'e1' | 'e2' | 'e3';
  style?: StyleProp<ViewStyle>;
}

/**
 * Pure, non-interactive 2:3 editorial book jacket artwork.
 * Keeps custom Bengali cover illustrations clean and unobstructed.
 */
export const BookCoverArt = React.memo(function BookCoverArt({
  book,
  width,
  height,
  radius = 10,
  progressPct = 0,
  showBookmarkDot = false,
  elevation = 'e2',
  style,
}: BookCoverArtProps) {
  const computedHeight = height ?? Math.round(width * 1.46);
  const coverVisual = getBookCoverVisual(book);
  const fallbackBg = COVER_BG[book.coverStyle] ?? COVER_BG.terracotta;
  const shadowStyle = elevation !== 'none' ? ELEVATION[elevation] : undefined;

  return (
    <View
      style={[
        styles.shadowWrap,
        shadowStyle,
        { width, height: computedHeight, borderRadius: radius },
        style,
      ]}>
      <View
        style={[
          styles.frame,
          {
            width,
            height: computedHeight,
            borderRadius: radius,
            backgroundColor: fallbackBg,
          },
        ]}>
        <Image
          source={coverVisual.source}
          resizeMode="cover"
          fadeDuration={0}
          style={[
            styles.image,
            {
              transform: [
                { scale: coverVisual.scale },
                { translateX: coverVisual.translateX },
                { translateY: coverVisual.translateY },
              ],
            },
          ]}
        />

        {/* Subtle ambient palette wash */}
        <View
          pointerEvents="none"
          style={[styles.absFill, { backgroundColor: coverVisual.tintColor }]}
        />

        {/* Tasteful 4px subtle left spine crease */}
        <View pointerEvents="none" style={styles.spineCrease}>
          <View style={styles.spineShadow} />
          <View style={styles.spineHighlight} />
        </View>

        {/* Crisp inner hairline border */}
        <View
          pointerEvents="none"
          style={[styles.innerBorder, { borderRadius: radius }]}
        />

        {/* Optional reading-in-progress bookmark dot */}
        {showBookmarkDot ? (
          <View style={styles.bookmarkPill}>
            <Ionicons name="bookmark" size={11} color={coverVisual.accentColor} />
          </View>
        ) : null}

        {/* Optional subtle bottom progress bar */}
        {progressPct > 0 ? (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, Math.max(4, progressPct))}%`,
                  backgroundColor: coverVisual.accentColor,
                },
              ]}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  shadowWrap: {
    backgroundColor: 'transparent',
  },
  frame: {
    overflow: 'hidden',
    position: 'relative',
  },
  absFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  spineCrease: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 6,
    flexDirection: 'row',
  },
  spineShadow: {
    width: 4,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
  },
  spineHighlight: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  bookmarkPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(18, 15, 12, 0.62)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3.5,
    backgroundColor: 'rgba(12, 10, 8, 0.45)',
  },
  progressFill: {
    height: '100%',
  },
});
