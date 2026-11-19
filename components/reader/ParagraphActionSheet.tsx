import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/constants/Themes';
import { RADIUS, SPACING, TOUCH_TARGET } from '@/constants/design';
import { FONTS } from '@/constants/Typography';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';

export interface ParagraphActionSheetProps {
  visible: boolean;
  onClose: () => void;
  snippetText: string;
  isBookmarked: boolean;
  theme: ThemeColors;
  onToggleBookmark: () => void;
  onShare: () => void;
}

export function ParagraphActionSheet({
  visible,
  onClose,
  snippetText,
  isBookmarked,
  theme,
  onToggleBookmark,
  onShare,
}: ParagraphActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      animationType="fade"
      maxHeight="50%"
      themeOverride={theme}>
      <View
        style={[
          styles.body,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}>
        <Text
          numberOfLines={3}
          style={[
            styles.snippet,
            {
              color: theme.textSecondary,
              borderLeftColor: theme.accentTerracotta,
            },
          ]}>
          “{snippetText}”
        </Text>

        <Pressable
          onPress={onToggleBookmark}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: theme.surface,
              opacity: pressed ? 0.8 : 1,
            },
          ]}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={theme.accentTerracotta}
          />
          <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>
            {isBookmarked ? 'বুকমার্ক সরান' : 'বুকমার্কে সংরক্ষণ করুন'}
          </Text>
        </Pressable>

        <Pressable
          onPress={onShare}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: theme.surface,
              opacity: pressed ? 0.8 : 1,
            },
          ]}>
          <Ionicons name="share-outline" size={20} color={theme.accentSage} />
          <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>
            অনুচ্ছেদ শেয়ার করুন
          </Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: 10,
  },
  snippet: {
    fontSize: 13.5,
    fontFamily: FONTS.serifRegular,
    lineHeight: 23,
    paddingLeft: 12,
    borderLeftWidth: 3,
    marginBottom: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: TOUCH_TARGET.min + 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  actionBtnText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.sansBold,
  },
});
