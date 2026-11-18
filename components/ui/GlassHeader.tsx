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
import { FONTS } from '@/constants/Typography';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { hapticSelection } from '@/utils/haptics';
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
  floating = true,
  radius = 26,
  style,
  onLayout,
  blurTarget,
}: GlassHeaderProps) {
  const { theme, isDark } = usePathshalaTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    hapticSelection();
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const containerPositionStyle: ViewStyle = floating
    ? {
        position: 'absolute',
        top: insets.top + 6,
        left: 12,
        right: 12,
        zIndex: 50,
      }
    : {
        marginTop: insets.top + 6,
        marginHorizontal: 12,
        zIndex: 50,
      };

  const actionCircleBg = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(30, 25, 20, 0.055)';

  return (
    <View
      onLayout={onLayout}
      style={[containerPositionStyle, style]}
      pointerEvents="box-none">
      <GlassSurface
        radius={radius}
        intensity={72}
        elevation="e2"
        blurTarget={blurTarget}
        contentStyle={styles.islandPadding}>
        <View style={styles.topRow}>
          {backButton ? (
            <Pressable
              onPress={handleBack}
              hitSlop={6}
              accessibilityLabel="ফিরে যান"
              style={({ pressed }) => [
                styles.circleBtn,
                {
                  backgroundColor: actionCircleBg,
                  borderColor: theme.glassRimTop,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}>
              <Ionicons name="arrow-back" size={19} color={theme.textPrimary} />
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
                style={[
                  styles.titleText,
                  backButton && styles.titleTextCompact,
                  { color: theme.textPrimary },
                ]}>
                {title}
              </Text>
              {subtitle ? (
                <Text
                  numberOfLines={1}
                  style={[styles.subtitleText, { color: theme.textMuted }]}>
                  {subtitle}
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
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  islandPadding: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 42,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
    fontFamily: FONTS.serifBold,
  },
  titleTextCompact: {
    fontSize: 16,
  },
  subtitleText: {
    fontSize: 11,
    fontFamily: FONTS.sansMedium,
    marginTop: 1,
  },
  trailingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trailingPlaceholder: {
    width: 40,
    height: 40,
  },
  bottomSlotWrap: {
    gap: 8,
  },
});
