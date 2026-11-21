import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { usePathshalaTheme } from '@/context/ThemeContext';

const LOGO_LIGHT = require('@/assets/images/brand/logo-light.png');
const LOGO_DARK = require('@/assets/images/brand/logo-dark.png');

export interface BrandLogoProps {
  size?: number;
  borderRadius?: number;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function BrandLogo({
  size = 40,
  borderRadius = 12,
  borderColor,
  style,
}: BrandLogoProps) {
  const { theme, isDark } = usePathshalaTheme();

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius,
          borderColor: borderColor ?? theme.borderSubtle,
          backgroundColor: isDark ? '#0F1411' : '#FAF8F3',
        },
        style,
      ]}>
      <Image
        source={isDark ? LOGO_DARK : LOGO_LIGHT}
        resizeMode="cover"
        fadeDuration={0}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
