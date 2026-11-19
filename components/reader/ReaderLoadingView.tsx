import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '@/constants/Themes';
import { LAYOUT, RADIUS, SPACING } from '@/constants/design';
import { FONTS } from '@/constants/Typography';

export interface ReaderLoadingViewProps {
  bookTitle: string;
  bookAuthor?: string;
  theme: ThemeColors;
  topPadding: number;
}

const SKELETON_LINES = ['92%', '100%', '84%', '96%', '72%', '100%', '88%', '64%'] as const;

export function ReaderLoadingView({
  bookTitle,
  bookAuthor,
  theme,
  topPadding,
}: ReaderLoadingViewProps) {
  return (
    <View style={[styles.wrap, { paddingTop: topPadding }]}>
      <View style={styles.headerBlock}>
        <ActivityIndicator size="small" color={theme.accentTerracotta} />
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {bookTitle}
        </Text>
        {bookAuthor ? (
          <Text style={[styles.author, { color: theme.textMuted }]}>
            {bookAuthor}
          </Text>
        ) : null}
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          পাঠ্য প্রস্তুত করা হচ্ছে...
        </Text>
      </View>

      <View style={styles.linesBlock}>
        {SKELETON_LINES.map((width, idx) => (
          <View
            key={idx}
            style={[
              styles.line,
              {
                width,
                backgroundColor: theme.surface,
                marginBottom: idx === 4 ? 18 : 10,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    maxWidth: LAYOUT.maxReaderWidth,
    alignSelf: 'center',
    paddingHorizontal: SPACING.xl,
    gap: 28,
  },
  headerBlock: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: FONTS.serifBold,
    textAlign: 'center',
  },
  author: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: FONTS.sansMedium,
  },
  hint: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: FONTS.sansMedium,
    marginTop: 2,
  },
  linesBlock: {
    gap: 2,
  },
  line: {
    height: 14,
    borderRadius: RADIUS.xs,
  },
});
