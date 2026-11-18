import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

import {
  NotoSerifBengali_400Regular,
  NotoSerifBengali_700Bold,
} from '@expo-google-fonts/noto-serif-bengali';

import {
  HindSiliguri_400Regular,
  HindSiliguri_500Medium,
  HindSiliguri_700Bold,
} from '@expo-google-fonts/hind-siliguri';

import { ThemeProvider, usePathshalaTheme } from '@/context/ThemeContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    NotoSerifBengali_400Regular,
    NotoSerifBengali_700Bold,
    HindSiliguri_400Regular,
    HindSiliguri_500Medium,
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
    </>
  );
}
