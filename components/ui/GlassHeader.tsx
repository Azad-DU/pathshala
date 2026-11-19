import React from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LAYOUT, TOUCH_TARGET, TYPOGRAPHY } from '@/constants/design';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { hapticSelection } from '@/utils/haptics';
import { renderWithNotoNumbers } from './NotoNumbers';
import { GlassSurface, type GlassSurfaceProps } from './GlassSurface';

export interface GlassHeaderProps {
  title?: string;
  subtitle?: string;
  backButton?: boolean;
  onBackPress?: () => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  floating?: boolean;
  maxWidth?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  onLayout?: (e: LayoutChangeEvent) => void;
  blurTarget?: GlassSurfaceProps['blurTarget'];
}

export function GlassHeader({
  title,
  subtitle,
  backButton = false,
  onBackPress,
  leading,
  trailing,
  bottomSlot,
  floating = false,
  maxWidth = LAYOUT.maxContentWidth,
  radius = 22,
  style,
  onLayout,
  blurTarget,
}: GlassHeaderProps) {
  const { theme, isDark } = usePathshalaTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const layout = useResponsiveLayout();

  const handleBack = () => {
    hapticSelection();
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const actionCircleBg = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(30, 25, 20, 0.05)';

  const outerStyle: ViewStyle = floating
    ? {
        position: 'absolute',
        top: insets.top + 6,
        left: 12,
        right: 12,
        zIndex: 50,
      }
    : {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      };

  const innerContent = (
    <View
      style={[
        styles.innerContainer,
        {
          maxWidth,
          paddingHorizontal: floating ? 14 : layout.horizontalPadding,
          paddingTop: floating ? 10 : insets.top + 10,
          paddingBottom: bottomSlot ? 12 : 10,
        },
      ]}>
      <View style={styles.topRow}>
        {backButton ? (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="ফিরে যান"
            style={({ pressed }) => [
              styles.circleBtn,
              {
                backgroundColor: actionCircleBg,
                borderColor: theme.borderSubtle,
                opacity: pressed ? 0.72 : 1,
              },
            ]}>
            <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
          </Pressable>
        ) : leading ? (
          leading
        ) : null}

        {title !== undefined ? (
          <View
            style={[
              styles.titleBox,
              backButton && styles.titleCentered,
            ]}>
            <Text
              numberOfLines={1}
              accessibilityRole="header"
              style={[
                backButton ? styles.titleTextCompact : styles.titleText,
                { color: theme.textPrimary },
              ]}>
              {renderWithNotoNumbers(title, true)}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                style={[styles.subtitleText, { color: theme.textMuted }]}>
                {renderWithNotoNumbers(subtitle)}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {trailing ? (
          <View style={styles.trailingWrap}>{trailing}</View>
        ) : backButton ? (
          <View style={styles.trailingPlaceholder} />
        ) : null}
      </View>

      {bottomSlot ? <View style={styles.bottomSlotWrap}>{bottomSlot}</View> : null}
    </View>
  );

  return (
    <View
      onLayout={onLayout}
      style={[outerStyle, style]}
      pointerEvents="box-none">
      <GlassSurface
        variant={floating ? 'floating' : 'docked'}
        radius={radius}
        intensity={floating ? 72 : 76}
        elevation={floating ? 'e2' : 'none'}
        blurTarget={blurTarget}>
        {innerContent}
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  innerContainer: {
    width: '100%',
    alignSelf: 'center',
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: TOUCH_TARGET.min,
  },
  circleBtn: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    borderRadius: TOUCH_TARGET.min / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBox: {
    flex: 1,
    justifyContent: 'center',
  },
  titleCentered: {
    alignItems: 'center',
  },
  titleText: {
    ...TYPOGRAPHY.h1,
    fontSize: 21,
    lineHeight: 28,
  },
  titleTextCompact: {
    ...TYPOGRAPHY.h3,
    fontSize: 16.5,
    lineHeight: 23,
  },
  subtitleText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 1,
  },
  trailingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trailingPlaceholder: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
  },
  bottomSlotWrap: {
    gap: 8,
  },
});
