import React from 'react';
import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

export interface AppTextProps extends TextProps {
  /**
   * Disable trailing non-breaking space buffer (used on full-width prose blocks).
   */
  noBuffer?: boolean;
}

/**
 * Drop-in replacement for React Native `Text` that prevents Android Fabric /
 * OEM font engines (e.g., Xiaomi HyperOS) from clipping trailing Bengali glyphs
 * or dropping the final word inside auto-sized text containers.
 */
export function AppText({
  children,
  noBuffer = false,
  style,
  textBreakStrategy,
  android_hyphenationFrequency,
  ...rest
}: AppTextProps) {
  if (Platform.OS !== 'android') {
    return (
      <Text style={style} {...rest}>
        {children}
      </Text>
    );
  }

  let content: React.ReactNode = children;
  if (!noBuffer && children != null && children !== false && children !== '') {
    const flatStyle = style ? StyleSheet.flatten(style) : undefined;
    if (flatStyle?.textAlign === 'center') {
      content = (
        <>
          {'\u00A0'}
          {children}
          {'\u00A0'}
        </>
      );
    } else {
      content = (
        <>
          {children}
          {'\u00A0\u00A0'}
        </>
      );
    }
  }

  return (
    <Text
      textBreakStrategy={textBreakStrategy ?? 'simple'}
      android_hyphenationFrequency={android_hyphenationFrequency ?? 'none'}
      style={style}
      {...rest}>
      {content}
    </Text>
  );
}
