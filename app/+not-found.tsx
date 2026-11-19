import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePathshalaTheme } from '@/context/ThemeContext';

export default function NotFoundScreen() {
  const { theme } = usePathshalaTheme();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'পাতাটি পাওয়া যায়নি' }} />
      <View style={[styles.container, { backgroundColor: theme.canvas }]}>
        <View style={styles.inner}>
          <EmptyState
            icon="compass-outline"
            title="এই পাতাটি খুঁজে পাওয়া যায়নি"
            description="আপনি যে ঠিকানাটি খোলার চেষ্টা করছেন তা পাঠাগারে নেই।"
            actionLabel="পাঠাগারে ফিরে যান"
            onAction={() => router.replace('/')}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  inner: {
    width: '100%',
    maxWidth: 440,
  },
});
