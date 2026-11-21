import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

import { NotoSerifBengali_400Regular } from '@expo-google-fonts/noto-serif-bengali/400Regular';
import { NotoSerifBengali_500Medium } from '@expo-google-fonts/noto-serif-bengali/500Medium';
import { NotoSerifBengali_700Bold } from '@expo-google-fonts/noto-serif-bengali/700Bold';
import { HindSiliguri_400Regular } from '@expo-google-fonts/hind-siliguri/400Regular';
import { HindSiliguri_700Bold } from '@expo-google-fonts/hind-siliguri/700Bold';

import { ThemeProvider, usePathshalaTheme } from '@/context/ThemeContext';
import { AppLaunchSplash } from '@/components/ui/AppLaunchSplash';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  const [loaded, error] = useFonts({
    NotoSerifBengali_400Regular,
    NotoSerifBengali_500Medium,
    NotoSerifBengali_700Bold,
    HindSiliguri_400Regular,
    HindSiliguri_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAppIsReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppIsReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <AppNav />
    </ThemeProvider>
  );
}

function AppNav() {
  const { theme, isDark } = usePathshalaTheme();
  const [showLaunchSplash, setShowLaunchSplash] = useState(true);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: theme.canvas },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="reader/[id]"
          options={{
            headerShown: false,
            animation: 'fade_from_bottom',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen name="author/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      {showLaunchSplash ? (
        <AppLaunchSplash onFinish={() => setShowLaunchSplash(false)} />
      ) : null}
    </>
  );
}
