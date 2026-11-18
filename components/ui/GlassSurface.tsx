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
  tintColor?: string;
  themeOverride?: ThemeColors;
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
}

export function GlassSurface({
  children,
  style,
  contentStyle,
  radius = 24,
  intensity = 65,
  elevation = 'e1',
  tintColor,
  themeOverride,
  blurTarget,
}: GlassSurfaceProps) {
  const { theme: appTheme } = usePathshalaTheme();
  const activeTheme = themeOverride ?? appTheme;
  const isDark = Boolean(activeTheme.isDark);
  const shadowStyle = elevation !== 'none' ? ELEVATION[elevation] : undefined;

  const canAndroidHardwareBlur = Platform.OS === 'android' && Boolean(blurTarget);
  const effectiveTint =
    tintColor ??
    (Platform.OS === 'android' && !canAndroidHardwareBlur
      ? activeTheme.pillBg
      : activeTheme.glassTint);

  return (
    <View style={[{ borderRadius: radius }, shadowStyle, style]}>
      <View
        style={[
          styles.innerShell,
          {
            borderRadius: radius,
            borderColor: activeTheme.glassRimBottom,
            borderTopColor: activeTheme.glassRimTop,
            borderLeftColor: activeTheme.glassRimTop,
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
          style={[styles.absFill, { borderRadius: radius }]}
        />

        <View
          pointerEvents="none"
          style={[styles.absFill, { backgroundColor: effectiveTint }]}
        />

        <View
          pointerEvents="none"
          style={[
            styles.sheenBand,
            {
              backgroundColor: activeTheme.glassSheen,
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
            },
          ]}
        />

        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  innerShell: {
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  absFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheenBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '44%',
  },
});
