import React from 'react';
import { Tabs } from 'expo-router';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { TabBlurProvider } from '@/context/TabBlurContext';
import { usePathshalaTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { theme } = usePathshalaTheme();

  return (
    <TabBlurProvider>
      <Tabs
        tabBar={(props: any) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'none',
          lazy: false,
          sceneStyle: { backgroundColor: theme.canvas },
        }}>
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
