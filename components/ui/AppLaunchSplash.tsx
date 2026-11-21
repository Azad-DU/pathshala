import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/ui/AppText';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ELEVATION, RADIUS } from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { usePathshalaTheme } from '@/context/ThemeContext';

export interface AppLaunchSplashProps {
  onFinish: () => void;
}

export function AppLaunchSplash({ onFinish }: AppLaunchSplashProps) {
  const { theme, isDark } = usePathshalaTheme();
  const insets = useSafeAreaInsets();
  const finishedRef = useRef(false);

  const appVersion = Constants.expoConfig?.version ?? '1.1.0';
  const banglaVersion = toBanglaNumber(appVersion);

  const overlayOpacity = useSharedValue(1);
  const contentExitY = useSharedValue(0);
  const contentExitOpacity = useSharedValue(1);

  const outerHaloScale = useSharedValue(0.65);
  const outerHaloOpacity = useSharedValue(0);
  const innerHaloScale = useSharedValue(0.68);
  const innerHaloOpacity = useSharedValue(0);

  const emblemOpacity = useSharedValue(0);
  const emblemScale = useSharedValue(0.74);
  const emblemTranslateY = useSharedValue(16);
  const sheenTranslateX = useSharedValue(-120);

  const dividerOpacity = useSharedValue(0);
  const dividerScaleX = useSharedValue(0);

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(14);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(10);
  const footerOpacity = useSharedValue(0);
  const footerTranslateY = useSharedValue(8);

  useEffect(() => {
    let active = true;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;

    const handleComplete = () => {
      if (!active || finishedRef.current) return;
      finishedRef.current = true;
      onFinish();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (!active) return;
        if (reduced) {
          outerHaloScale.set(1);
          outerHaloOpacity.set(0.75);
          innerHaloScale.set(1);
          innerHaloOpacity.set(0.75);
          emblemOpacity.set(1);
          emblemScale.set(1);
          emblemTranslateY.set(0);
          dividerOpacity.set(1);
          dividerScaleX.set(1);
          titleOpacity.set(1);
          titleTranslateY.set(0);
          subtitleOpacity.set(1);
          subtitleTranslateY.set(0);
          footerOpacity.set(1);
          footerTranslateY.set(0);

          exitTimer = setTimeout(() => {
            overlayOpacity.set(
              withTiming(0, { duration: 180 }, (finished) => {
                if (finished) {
                  runOnJS(handleComplete)();
                }
              })
            );
          }, 350);
          return;
        }

        const easeOut = Easing.out(Easing.cubic);

        // Warm concentric halo breathing ring
        outerHaloScale.set(
          withSequence(
            withTiming(1.06, { duration: 480, easing: easeOut }),
            withTiming(1.0, { duration: 420, easing: easeOut })
          )
        );
        outerHaloOpacity.set(
          withSequence(
            withTiming(1, { duration: 380, easing: easeOut }),
            withTiming(0.75, { duration: 480, easing: easeOut })
          )
        );
        innerHaloScale.set(
          withDelay(
            70,
            withSequence(
              withTiming(1.05, { duration: 440, easing: easeOut }),
              withTiming(1.0, { duration: 400, easing: easeOut })
            )
          )
        );
        innerHaloOpacity.set(
          withDelay(
            70,
            withSequence(
              withTiming(1, { duration: 360, easing: easeOut }),
              withTiming(0.75, { duration: 460, easing: easeOut })
            )
          )
        );

        // Spring emblem entrance + diagonal sheen sweep
        emblemOpacity.set(withTiming(1, { duration: 280, easing: easeOut }));
        emblemScale.set(
          withSpring(1, { damping: 16, stiffness: 160, mass: 0.85 })
        );
        emblemTranslateY.set(
          withSpring(0, { damping: 16, stiffness: 160, mass: 0.85 })
        );
        sheenTranslateX.set(
          withDelay(
            360,
            withTiming(120, { duration: 520, easing: Easing.inOut(Easing.ease) })
          )
        );

        // Ornamental terracotta diamond divider
        dividerOpacity.set(
          withDelay(180, withTiming(1, { duration: 280, easing: easeOut }))
        );
        dividerScaleX.set(
          withDelay(180, withTiming(1, { duration: 380, easing: easeOut }))
        );

        // Staggered editorial typography
        titleOpacity.set(
          withDelay(220, withTiming(1, { duration: 360, easing: easeOut }))
        );
        titleTranslateY.set(
          withDelay(220, withTiming(0, { duration: 360, easing: easeOut }))
        );

        subtitleOpacity.set(
          withDelay(320, withTiming(1, { duration: 360, easing: easeOut }))
        );
        subtitleTranslateY.set(
          withDelay(320, withTiming(0, { duration: 360, easing: easeOut }))
        );

        footerOpacity.set(
          withDelay(420, withTiming(1, { duration: 360, easing: easeOut }))
        );
        footerTranslateY.set(
          withDelay(420, withTiming(0, { duration: 360, easing: easeOut }))
        );

        // Silky dissolve exit
        exitTimer = setTimeout(() => {
          contentExitY.set(
            withTiming(-14, { duration: 260, easing: Easing.out(Easing.quad) })
          );
          contentExitOpacity.set(
            withTiming(0, { duration: 260, easing: Easing.out(Easing.quad) })
          );
          overlayOpacity.set(
            withTiming(
              0,
              { duration: 340, easing: Easing.out(Easing.quad) },
              (finished) => {
                if (finished) {
                  runOnJS(handleComplete)();
                }
              }
            )
          );
        }, 1350);
      })
      .catch(() => {
        handleComplete();
      });

    return () => {
      active = false;
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, [
    contentExitOpacity,
    contentExitY,
    dividerOpacity,
    dividerScaleX,
    emblemOpacity,
    emblemScale,
    emblemTranslateY,
    footerOpacity,
    footerTranslateY,
    innerHaloOpacity,
    innerHaloScale,
    onFinish,
    outerHaloOpacity,
    outerHaloScale,
    overlayOpacity,
    sheenTranslateX,
    subtitleOpacity,
    subtitleTranslateY,
    titleOpacity,
    titleTranslateY,
  ]);

  const overlayAnimStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const exitTransformStyle = useAnimatedStyle(() => ({
    opacity: contentExitOpacity.value,
    transform: [{ translateY: contentExitY.value }],
  }));

  const outerHaloStyle = useAnimatedStyle(() => ({
    opacity: outerHaloOpacity.value,
    transform: [{ scale: outerHaloScale.value }],
  }));

  const innerHaloStyle = useAnimatedStyle(() => ({
    opacity: innerHaloOpacity.value,
    transform: [{ scale: innerHaloScale.value }],
  }));

  const emblemAnimStyle = useAnimatedStyle(() => ({
    opacity: emblemOpacity.value,
    transform: [
      { translateY: emblemTranslateY.value },
      { scale: emblemScale.value },
    ],
  }));

  const sheenAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sheenTranslateX.value },
      { rotate: '-24deg' },
    ],
  }));

  const dividerAnimStyle = useAnimatedStyle(() => ({
    opacity: dividerOpacity.value,
    transform: [{ scaleX: dividerScaleX.value }],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const footerAnimStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value * contentExitOpacity.value,
    transform: [{ translateY: footerTranslateY.value + contentExitY.value }],
  }));

  const outerRingBg = isDark
    ? 'rgba(228, 118, 77, 0.07)'
    : 'rgba(185, 77, 37, 0.06)';
  const outerRingBorder = isDark
    ? 'rgba(228, 118, 77, 0.16)'
    : 'rgba(185, 77, 37, 0.13)';
  const innerRingBg = isDark
    ? 'rgba(228, 118, 77, 0.11)'
    : 'rgba(185, 77, 37, 0.09)';
  const innerRingBorder = isDark
    ? 'rgba(228, 118, 77, 0.24)'
    : 'rgba(185, 77, 37, 0.19)';
  const sheenColor = isDark
    ? 'rgba(255, 255, 255, 0.16)'
    : 'rgba(255, 255, 255, 0.48)';

  return (
    <Animated.View
      pointerEvents="auto"
      style={[
        styles.overlay,
        { backgroundColor: theme.canvas },
        overlayAnimStyle,
      ]}>
      <Animated.View style={[styles.centerBlock, exitTransformStyle]}>
        <View style={styles.emblemStage}>
          <Animated.View
            style={[
              styles.outerHalo,
              { backgroundColor: outerRingBg, borderColor: outerRingBorder },
              outerHaloStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.innerHalo,
              { backgroundColor: innerRingBg, borderColor: innerRingBorder },
              innerHaloStyle,
            ]}
          />

          <Animated.View
            style={[styles.emblemClip, ELEVATION.e2, emblemAnimStyle]}>
            <BrandLogo
              size={96}
              borderRadius={26}
              borderColor={theme.borderStrong}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.sheenStrip,
                { backgroundColor: sheenColor },
                sheenAnimStyle,
              ]}
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.dividerRow, dividerAnimStyle]}>
          <View
            style={[
              styles.dividerLine,
              { backgroundColor: theme.accentTerracotta },
            ]}
          />
          <View
            style={[
              styles.dividerDiamond,
              { backgroundColor: theme.accentTerracotta },
            ]}
          />
          <View
            style={[
              styles.dividerLine,
              { backgroundColor: theme.accentTerracotta },
            ]}
          />
        </Animated.View>

        <View style={styles.titleBlock}>
          <Animated.View style={titleAnimStyle}>
            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
              পাঠশালা
            </Text>
          </Animated.View>
          <Animated.View style={subtitleAnimStyle}>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>
              চিরায়ত বাংলা সাহিত্যের আসর
            </Text>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.footer,
          { bottom: Math.max(insets.bottom, 20) + 18 },
          footerAnimStyle,
        ]}>
        <View
          style={[
            styles.versionPill,
            {
              backgroundColor: theme.surface,
              borderColor: theme.borderSubtle,
            },
          ]}>
          <Text style={[styles.versionText, { color: theme.accentTerracotta }]}>
            সংস্করণ {banglaVersion}
          </Text>
        </View>
        <Text style={[styles.offlineCaption, { color: theme.textMuted }]}>
          সম্পূর্ণ অফলাইন পাঠাগার
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emblemStage: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerHalo: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: StyleSheet.hairlineWidth,
  },
  innerHalo: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emblemClip: {
    width: 96,
    height: 96,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
  },
  sheenStrip: {
    position: 'absolute',
    top: -32,
    bottom: -32,
    width: 28,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 14,
  },
  dividerLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
  },
  dividerDiamond: {
    width: 6,
    height: 6,
    borderRadius: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  titleBlock: {
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontFamily: FONTS.serifBold,
    fontSize: 31,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: FONTS.serifMedium,
    fontSize: 13.5,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 6,
  },
  versionPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  versionText: {
    fontFamily: FONTS.serifBold,
    fontSize: 12,
    textAlign: 'center',
  },
  offlineCaption: {
    fontFamily: FONTS.serifMedium,
    fontSize: 11.5,
    textAlign: 'center',
  },
});
