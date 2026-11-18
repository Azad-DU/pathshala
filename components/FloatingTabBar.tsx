import { GlassSurface } from '@/components/ui/GlassSurface';
import { RADIUS } from '@/constants/design';
import { FONTS } from '@/constants/Typography';
import { useTabBlurTarget } from '@/context/TabBlurContext';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { hapticSelection } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
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

interface TabLayoutInfo {
  x: number;
  width: number;
}

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 290,
  mass: 0.72,
};

const STRETCH_SPRING = {
  damping: 16,
  stiffness: 320,
  mass: 0.58,
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
      icon: isFocused ? 'compass' : 'compass-outline',
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

function TabButton({
  route,
  isFocused,
  title,
  onPress,
  onLayout,
  isReady,
}: {
  route: { key: string; name: string };
  isFocused: boolean;
  title?: string;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  isReady: boolean;
}) {
  const { theme, isDark } = usePathshalaTheme();

  const meta = getTabMeta(route.name, isFocused);
  const displayLabel = title !== undefined ? title : meta.label;
  const activeBubbleBg = isDark
    ? 'rgba(228, 118, 77, 0.24)'
    : 'rgba(185, 77, 37, 0.14)';

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={displayLabel}
      style={({ pressed }) => [
        styles.tabPressable,
        pressed && { opacity: 0.78 },
      ]}>
      <View
        style={[
          styles.tabItemInner,
          isFocused ? styles.tabItemActivePadding : styles.tabItemInactivePadding,
          !isReady &&
            isFocused && [
              styles.tabItemFallbackActive,
              {
                backgroundColor: activeBubbleBg,
                borderTopColor: theme.glassRimTop,
                borderLeftColor: theme.glassRimTop,
                borderRightColor: theme.glassRimBottom,
                borderBottomColor: theme.glassRimBottom,
              },
            ],
        ]}>
        <Ionicons
          name={meta.icon}
          size={isFocused ? 18 : 20}
          color={isFocused ? theme.accentTerracotta : theme.textMuted}
        />
        {isFocused && (
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: theme.accentTerracotta,
                fontFamily: FONTS.sansBold,
              },
            ]}>
            {displayLabel}
          </Text>
        )}
      </View>
    </Pressable>
  );
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
  const [layouts, setLayouts] = useState<Record<number, TabLayoutInfo>>({});
  const [reduceMotion, setReduceMotion] = useState(false);

  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const indicatorScaleX = useSharedValue(1);
  const indicatorScaleY = useSharedValue(1);
  const prevIndexRef = useRef<number>(state.index);
  const hasCurrentLayout = Boolean(layouts[state.index]);

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

  const handleTabLayout = (index: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setLayouts((prev) => {
      if (prev[index] && prev[index].x === x && prev[index].width === width) {
        return prev;
      }
      return { ...prev, [index]: { x, width } };
    });
  };

  useEffect(() => {
    const target = layouts[state.index];
    if (!target) return;

    const indexChanged = prevIndexRef.current !== state.index;
    prevIndexRef.current = state.index;

    if (reduceMotion) {
      indicatorX.set(target.x);
      indicatorWidth.set(target.width);
      indicatorScaleX.set(1);
      indicatorScaleY.set(1);
      return;
    }

    indicatorX.set(withSpring(target.x, SPRING_CONFIG));
    indicatorWidth.set(withSpring(target.width, SPRING_CONFIG));

    if (indexChanged) {
      indicatorScaleX.set(
        withSequence(
          withSpring(1.08, STRETCH_SPRING),
          withSpring(1, SPRING_CONFIG)
        )
      );
      indicatorScaleY.set(
        withSequence(
          withSpring(0.94, STRETCH_SPRING),
          withSpring(1, SPRING_CONFIG)
        )
      );
    }
  }, [
    state.index,
    layouts,
    reduceMotion,
    indicatorX,
    indicatorWidth,
    indicatorScaleX,
    indicatorScaleY,
  ]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: indicatorX.value },
      { scaleX: indicatorScaleX.value },
      { scaleY: indicatorScaleY.value },
    ],
    width: indicatorWidth.value,
  }));

  const activeBubbleBg = isDark
    ? 'rgba(228, 118, 77, 0.24)'
    : 'rgba(185, 77, 37, 0.14)';

  return (
    <View
      style={[
        styles.floatingContainer,
        { bottom: Math.max(insets.bottom, 12) + 8 },
      ]}
      pointerEvents="box-none">
      <GlassSurface
        radius={RADIUS.pill}
        intensity={75}
        elevation="e2"
        blurTarget={activeBlurTarget}
        style={styles.dockOuter}
        contentStyle={styles.dockPadding}>
        <View style={styles.tabsRow}>
          {hasCurrentLayout && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.slidingIndicator,
                {
                  backgroundColor: activeBubbleBg,
                  borderTopColor: theme.glassRimTop,
                  borderLeftColor: theme.glassRimTop,
                  borderRightColor: theme.glassRimBottom,
                  borderBottomColor: theme.glassRimBottom,
                },
                indicatorStyle,
              ]}>
              <View
                style={[
                  styles.bubbleTopGlow,
                  { backgroundColor: theme.glassSheen },
                ]}
              />
            </Animated.View>
          )}

          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

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
              <TabButton
                key={route.key}
                route={route}
                isFocused={isFocused}
                title={options.title}
                onPress={onPress}
                onLayout={(e) => handleTabLayout(index, e)}
                isReady={hasCurrentLayout}
              />
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
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockOuter: {
    maxWidth: 360,
  },
  dockPadding: {
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    gap: 4,
  },
  slidingIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bubbleTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  tabPressable: {
    zIndex: 1,
  },
  tabItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderRadius: RADIUS.pill,
  },
  tabItemActivePadding: {
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  tabItemInactivePadding: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    minWidth: 50,
  },
  tabItemFallbackActive: {
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 13,
    marginLeft: 7,
  },
});
