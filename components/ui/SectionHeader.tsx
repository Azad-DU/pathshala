import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOUCH_TARGET, TYPOGRAPHY } from '@/constants/design';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { hapticSelection } from '@/utils/haptics';
import { renderWithNotoNumbers } from './NotoNumbers';

export interface SectionHeaderProps {
  title: string;
  countText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({
  title,
  countText,
  icon,
  actionLabel,
  onActionPress,
  style,
}: SectionHeaderProps) {
  const { theme } = usePathshalaTheme();

  return (
    <View style={[styles.row, style]}>
      <View style={styles.left}>
        {icon ? (
          <Ionicons name={icon} size={17} color={theme.accentTerracotta} />
        ) : null}
        <Text
          numberOfLines={1}
          accessibilityRole="header"
          style={[styles.title, { color: theme.textPrimary }]}>
          {renderWithNotoNumbers(title, true)}
        </Text>
        {countText ? (
          <Text style={[styles.count, { color: theme.textMuted }]}>
            {renderWithNotoNumbers(countText)}
          </Text>
        ) : null}
      </View>

      {actionLabel && onActionPress ? (
        <Pressable
          onPress={() => {
            hapticSelection();
            onActionPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${title} — ${actionLabel}`}
          style={({ pressed }) => [
            styles.actionBtn,
            pressed && { opacity: 0.7 },
          ]}>
          <Text style={[styles.actionText, { color: theme.accentTerracotta }]}>
            {actionLabel}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={theme.accentTerracotta}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  title: {
    ...TYPOGRAPHY.h2,
    flexShrink: 1,
  },
  count: {
    ...TYPOGRAPHY.caption,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: TOUCH_TARGET.min,
    paddingLeft: 8,
  },
  actionText: {
    ...TYPOGRAPHY.label,
    fontSize: 12.5,
  },
});
