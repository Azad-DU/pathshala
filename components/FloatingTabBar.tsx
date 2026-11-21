import { AppText as Text } from '@/components/ui/AppText';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { RADIUS, TOUCH_TARGET } from '@/constants/design';
import { FONTS } from '@/constants/Typography';
import { useTabBlurTarget } from '@/context/TabBlurContext';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { hapticSelection } from '@/utils/haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface FloatingTabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  descriptors: Record<
    string,
    {
      options: {
        title?: string;
      };
    }
  >;
  navigation?: {
    emit?: (event: {
      type: string;
      target: string;
      canPreventDefault: boolean;
    }) => { defaultPrevented: boolean };
    navigate?: (name: string) => void;
  };
  navigateToTab?: (routeKey: string) => void;
}

const SPRING_CONFIG = {
  damping: 24,
  stiffness: 300,
  mass: 0.7,
};

function getTabMeta(
  routeName: string,
  isFocused: boolean
): {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
} {
  if (routeName === 'browse') {
    return {
      icon: isFocused ? 'search' : 'search-outline',
      label: 'খুঁজুন',
    };
  }
  if (routeName === 'library') {
    return {
      icon: isFocused ? 'bookmark' : 'bookmark-outline',
      label: 'আমার বই',
    };
  }
  return {
    icon: isFocused ? 'book' : 'book-outline',
    label: 'পাঠাগার',
  };
}

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  navigateToTab,
}: FloatingTabBarProps) {
  const { theme, isDark } = usePathshalaTheme();
  const { activeBlurTarget } = useTabBlurTarget();
  const insets = useSafeAreaInsets();
  const [rowWidth, setRowWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const routeCount = Math.max(1, state.routes.length);
  const tabWidth = rowWidth > 0 ? rowWidth / routeCount : 0;

  const indicatorX = useSharedValue(0);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(Boolean(enabled));
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => setReduceMotion(Boolean(enabled))
    );
    return () => {
      active = false;
      sub?.remove();
    };
  }, []);

  useEffect(() => {
    if (tabWidth <= 0) return;
    const nextX = state.index * tabWidth;
    if (reduceMotion) {
      indicatorX.set(nextX);
    } else {
      indicatorX.set(withSpring(nextX, SPRING_CONFIG));
    }
  }, [state.index, tabWidth, reduceMotion, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const handleRowLayout = (e: LayoutChangeEvent) => {
    const nextWidth = Math.round(e.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== rowWidth) {
      setRowWidth(nextWidth);
    }
  };

  const activePillBg = isDark
    ? 'rgba(228, 118, 77, 0.22)'
    : 'rgba(185, 77, 37, 0.13)';

  return (
    <View
      style={[
        styles.floatingContainer,
        { bottom: Math.max(insets.bottom, 10) + 8 },
      ]}
      pointerEvents="box-none">
      <GlassSurface
        radius={RADIUS.pill}
        intensity={78}
        elevation="e2"
        blurTarget={activeBlurTarget}
        style={styles.dockOuter}
        contentStyle={styles.dockPadding}>
        <View style={styles.tabsRow} onLayout={handleRowLayout}>
          {tabWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.slidingIndicator,
                {
                  width: tabWidth,
                  backgroundColor: activePillBg,
                  borderColor: theme.glassRimTop,
                },
                indicatorStyle,
              ]}
            />
          ) : null}

          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const meta = getTabMeta(route.name, isFocused);
            const displayLabel = options.title ?? meta.label;

            const onPress = () => {
              hapticSelection();
              if (navigation?.emit) {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event?.defaultPrevented) {
                  if (navigation?.navigate) {
                    navigation.navigate(route.name);
                  } else if (navigateToTab) {
                    navigateToTab(route.key);
                  }
                }
              } else if (!isFocused) {
                if (navigateToTab) {
                  navigateToTab(route.key);
                } else if (navigation?.navigate) {
                  navigation.navigate(route.name);
                }
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={displayLabel}
                style={({ pressed }) => [
                  styles.tabButton,
                  pressed && { opacity: 0.78 },
                ]}>
                <Ionicons
                  name={meta.icon}
                  size={19}
                  color={isFocused ? theme.accentTerracotta : theme.textMuted}
                />
                <Text
                  numberOfLines={1}
                  textBreakStrategy="simple"
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? theme.accentTerracotta : theme.textSecondary,
                      fontFamily: isFocused ? FONTS.serifBold : FONTS.serifMedium,
                    },
                  ]}>
                  {displayLabel.replace(/ /g, '\u00A0')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockOuter: {
    width: 276,
    maxWidth: '100%',
  },
  dockPadding: {
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  slidingIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    minHeight: TOUCH_TARGET.min,
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 1,
  },
  tabLabel: {
    width: '100%',
    textAlign: 'center',
    fontSize: 11.5,
    lineHeight: 19,
  },
});
