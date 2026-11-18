import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS } from '@/constants/Typography';
import { usePathshalaTheme } from '@/context/ThemeContext';

export default function NotFoundScreen() {
  const { theme } = usePathshalaTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'পাতাটি পাওয়া যায়নি' }} />
      <View style={[styles.container, { backgroundColor: theme.canvas }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          এই পাতাটি খুঁজে পাওয়া যায়নি।
        </Text>

        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: theme.accentTerracotta }]}>
            পাঠাগারে ফিরে যান
          </Text>
        </Link>
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
  title: {
    fontSize: 18,
    fontFamily: FONTS.serifBold,
  },
  link: {
    marginTop: 15,
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    fontFamily: FONTS.sansBold,
  },
});
