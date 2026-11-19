import React, { ComponentRef, RefObject } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import type { ThemeColors } from '@/constants/Themes';
import { ELEVATION } from '@/constants/design';
import { usePathshalaTheme } from '@/context/ThemeContext';

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  intensity?: number;
  elevation?: 'none' | 'e1' | 'e2';
  variant?: 'floating' | 'docked';
  tintColor?: string;
  themeOverride?: ThemeColors;
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
}

export function GlassSurface({
  children,
  style,
  contentStyle,
  radius = 22,
  intensity = 68,
  elevation = 'e1',
  variant = 'floating',
  tintColor,
  themeOverride,
  blurTarget,
}: GlassSurfaceProps) {
  const { theme: appTheme } = usePathshalaTheme();
  const activeTheme = themeOverride ?? appTheme;
  const isDark = Boolean(activeTheme.isDark);
  const isDocked = variant === 'docked';
  const effectiveRadius = isDocked ? 0 : radius;
  const shadowStyle =
    !isDocked && elevation !== 'none' ? ELEVATION[elevation] : undefined;

  const canAndroidHardwareBlur = Platform.OS === 'android' && Boolean(blurTarget);
  const effectiveTint =
    tintColor ??
    (Platform.OS === 'android' && !canAndroidHardwareBlur
      ? activeTheme.pillBg
      : activeTheme.glassTint);

  return (
    <View style={[{ borderRadius: effectiveRadius }, shadowStyle, style]}>
      <View
        style={[
          styles.innerShell,
          isDocked
            ? {
                borderRadius: 0,
                borderWidth: 0,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: activeTheme.borderSubtle,
              }
            : {
                borderRadius: effectiveRadius,
                borderWidth: 1,
                borderColor: activeTheme.glassRimBottom,
                borderTopColor: activeTheme.glassRimTop,
              },
          contentStyle,
        ]}>
        <BlurView
          blurTarget={canAndroidHardwareBlur ? blurTarget : undefined}
          intensity={
            Platform.OS === 'ios'
              ? intensity
              : Math.min(100, Math.max(45, intensity))
          }
          blurReductionFactor={Platform.OS === 'android' ? 5 : undefined}
          tint={isDark ? 'dark' : 'light'}
          blurMethod={
            Platform.OS === 'android'
              ? canAndroidHardwareBlur
                ? 'dimezisBlurViewSdk31Plus'
                : 'none'
              : undefined
          }
          pointerEvents="none"
          style={[styles.absFill, { borderRadius: effectiveRadius }]}
        />

        <View
          pointerEvents="none"
          style={[styles.absFill, { backgroundColor: effectiveTint }]}
        />

        {!isDocked && (
          <View
            pointerEvents="none"
            style={[
              styles.topHairlineRim,
              { backgroundColor: activeTheme.glassRimTop },
            ]}
          />
        )}

        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  innerShell: {
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
  topHairlineRim: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: StyleSheet.hairlineWidth,
    opacity: 0.7,
  },
});
