import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ELEVATION,
  RADIUS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from '@/constants/design';
import { FONTS } from '@/constants/Typography';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { hapticSelection } from '@/utils/haptics';

const BRAND_LOGO = require('@/assets/images/brand/logo.jpg');

const GUIDE_TIPS: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'terracotta' | 'sage';
  title: string;
  desc: string;
}[] = [
  {
    icon: 'people-outline',
    tone: 'terracotta',
    title: 'লেখক ও ২৯৭টি অফলাইন গ্রন্থ',
    desc: 'বিভূতিভূষণ বন্দ্যোপাধ্যায় ও রবীন্দ্রনাথ ঠাকুরের উপন্যাস, গল্পগ্রন্থ, কবিতা, গান, নাটক ও প্রবন্ধ সম্পূর্ণ অফলাইনে পড়ুন।',
  },
  {
    icon: 'text-outline',
    tone: 'sage',
    title: 'বাংলা হরফ ও পাঠ বিন্যাস',
    desc: 'নোটো সেরিফ ও হিন্দ শিলিগুড়ি হরফ, লেখার আকার, লাইনের দূরত্ব, মার্জিন এবং ইন্ডেন্ট নিজের মতো সাজিয়ে নিতে পারবেন।',
  },
  {
    icon: 'color-palette-outline',
    tone: 'terracotta',
    title: 'চোখের আরামদায়ক ৪টি পাঠ-থিম',
    desc: 'কাগজী বেইজ, প্রাচীন গ্রন্থ পাতা, টেরাকোটা মৃত্তিকা ও ডিপ ফরেস্ট (নাইট মোড) — দিন বা রাত যেকোনো সময় চোখের চাপ ছাড়াই পড়ুন।',
  },
  {
    icon: 'bookmark-outline',
    tone: 'sage',
    title: 'অনুচ্ছেদ বুকমার্ক ও পড়া চালিয়ে যাওয়া',
    desc: 'পড়ার সময় যেকোনো অনুচ্ছেদে কিছুক্ষণ চেপে ধরে বুকমার্ক বা শেয়ার করতে পারবেন এবং সর্বশেষ পঠিত অধ্যায় স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে।',
  },
];

export default function AboutModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = usePathshalaTheme();
  const layout = useResponsiveLayout();

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12) + 8,
            paddingHorizontal: layout.horizontalPadding,
            backgroundColor: theme.canvas,
            borderBottomColor: theme.borderSubtle,
          },
        ]}>
        <View style={styles.headerInner}>
          <Text
            accessibilityRole="header"
            style={[styles.headerTitle, { color: theme.textPrimary }]}>
            পাঠশালা — পাঠ নির্দেশিকা
          </Text>
          <Pressable
            onPress={() => {
              hapticSelection();
              router.back();
            }}
            accessibilityRole="button"
            accessibilityLabel="বন্ধ করুন"
            style={({ pressed }) => [
              styles.closeBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderSubtle,
                opacity: pressed ? 0.72 : 1,
              },
            ]}>
            <Ionicons name="close" size={20} color={theme.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.brandHero}>
          <View
            style={[
              styles.logoFrame,
              ELEVATION.e2,
              { borderColor: theme.borderSubtle },
            ]}>
            <Image
              source={BRAND_LOGO}
              resizeMode="cover"
              style={styles.logoImage}
            />
          </View>
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
            পাঠশালা
          </Text>
          <Text style={[styles.brandSub, { color: theme.textSecondary }]}>
            চিরায়ত বাংলা সাহিত্যের নির্মল অফলাইন পাঠাগার
          </Text>
        </View>

        <View
          style={[
            styles.card,
            ELEVATION.e1,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            পাঠ নির্দেশিকা
          </Text>

          {GUIDE_TIPS.map((tip) => {
            const accent =
              tip.tone === 'terracotta'
                ? theme.accentTerracotta
                : theme.accentSage;
            return (
              <View key={tip.title} style={styles.tipItem}>
                <View
                  style={[
                    styles.tipIconWrap,
                    { backgroundColor: theme.surface },
                  ]}>
                  <Ionicons name={tip.icon} size={18} color={accent} />
                </View>
                <View style={styles.tipTextWrap}>
                  <Text style={[styles.tipHead, { color: theme.textPrimary }]}>
                    {renderWithNotoNumbers(tip.title, true)}
                  </Text>
                  <Text
                    style={[styles.tipDesc, { color: theme.textSecondary }]}>
                    {renderWithNotoNumbers(tip.desc)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInner: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 17,
  },
  closeBtn: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    borderRadius: TOUCH_TARGET.min / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingTop: SPACING.lg,
    gap: SPACING.lg,
  },
  brandHero: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: 6,
  },
  logoFrame: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    ...TYPOGRAPHY.display,
  },
  brandSub: {
    ...TYPOGRAPHY.body,
    fontSize: 13.5,
    textAlign: 'center',
  },
  card: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 18,
  },
  cardTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 16.5,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  tipIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipTextWrap: {
    flex: 1,
    gap: 3,
  },
  tipHead: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
  },
  tipDesc: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 21,
    fontFamily: FONTS.sansMedium,
  },
});
