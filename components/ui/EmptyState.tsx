import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/constants/Themes';
import { RADIUS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '@/constants/design';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { hapticSelection } from '@/utils/haptics';

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  themeOverride?: ThemeColors;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  themeOverride,
  compact = false,
}: EmptyStateProps) {
  const { theme: appTheme } = usePathshalaTheme();
  const theme = themeOverride ?? appTheme;

  return (
    <View
      style={[
        styles.container,
        compact && styles.compactContainer,
        {
          backgroundColor: theme.card,
          borderColor: theme.borderSubtle,
        },
      ]}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
        ]}>
        <Ionicons name={icon} size={compact ? 22 : 26} color={theme.accentTerracotta} />
      </View>

      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {description}
      </Text>

      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actionsRow}>
          {actionLabel && onAction ? (
            <Pressable
              onPress={() => {
                hapticSelection();
                onAction();
              }}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: theme.accentTerracotta,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}>
              <Text style={styles.primaryBtnText}>{actionLabel}</Text>
            </Pressable>
          ) : null}

          {secondaryActionLabel && onSecondaryAction ? (
            <Pressable
              onPress={() => {
                hapticSelection();
                onSecondaryAction();
              }}
              accessibilityRole="button"
              accessibilityLabel={secondaryActionLabel}
              style={({ pressed }) => [
                styles.secondaryBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderStrong,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}>
              <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>
                {secondaryActionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  compactContainer: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    ...TYPOGRAPHY.h3,
    textAlign: 'center',
  },
  description: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  primaryBtn: {
    minHeight: TOUCH_TARGET.min,
    paddingHorizontal: 20,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    ...TYPOGRAPHY.label,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    minHeight: TOUCH_TARGET.min,
    paddingHorizontal: 18,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...TYPOGRAPHY.label,
  },
});
