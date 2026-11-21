import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';
import { Tabs } from 'expo-router';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { TabBlurProvider } from '@/context/TabBlurContext';
import { usePathshalaTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { theme } = usePathshalaTheme();
  const [reduceMotion, setReduceMotion] = useState(false);

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

  const screenOptions = useMemo(() => {
    const base = {
      headerShown: false,
      lazy: false,
      sceneStyle: { backgroundColor: theme.canvas },
    };

    if (reduceMotion) {
      return {
        ...base,
        animation: 'none' as const,
      };
    }

    return {
      ...base,
      animation: 'shift' as const,
      transitionSpec: {
        animation: 'timing' as const,
        config: {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        },
      },
      sceneStyleInterpolator: ({ current }: { current: { progress: any } }) => ({
        sceneStyle: {
          opacity: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          }),
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-56, 0, 56],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
      }),
    };
  }, [theme.canvas, reduceMotion]);

  return (
    <TabBlurProvider>
      <Tabs
        tabBar={(props: any) => <FloatingTabBar {...props} />}
        screenOptions={screenOptions}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'পাঠাগার',
          }}
        />
        <Tabs.Screen
          name="browse"
          options={{
            title: 'খুঁজুন',
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'আমার বই',
          }}
        />
      </Tabs>
    </TabBlurProvider>
  );
}
