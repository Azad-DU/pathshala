import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '@/constants/Typography';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { usePathshalaTheme } from '@/context/ThemeContext';

export default function AboutModalScreen() {
  const router = useRouter();
  const { theme } = usePathshalaTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.borderSubtle },
        ]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          পাঠশালা — পাঠ নির্দেশিকা
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="close" size={20} color={theme.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandHero}>
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>পাঠশালা</Text>
          <Text style={[styles.brandSub, { color: theme.accentTerracotta }]}>
            বিশুদ্ধ বাংলা সাহিত্য পাঠের নিরিবিলি ডিজিটাল পাঠাগার
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            সহজ পাঠের সুবিধাসমূহ
          </Text>

          <View style={styles.tipItem}>
            <Ionicons name="text-outline" size={18} color={theme.accentTerracotta} />
            <View style={styles.tipTextWrap}>
              <Text style={[styles.tipHead, { color: theme.textPrimary }]}>
                বাংলা হরফ ও লাইনের ব্যবধান
              </Text>
              <Text style={[styles.tipDesc, { color: theme.textSecondary }]}>
                নোটো সেরিফ ও হিন্দ শিলিগুড়ি হরফ, লেখার আকার, পঙ্‌ক্তির দূরত্ব এবং অনুচ্ছেদের ব্যবধান নিজের মতো সাজিয়ে নিতে পারবেন।
              </Text>
            </View>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="color-palette-outline" size={18} color={theme.accentSage} />
            <View style={styles.tipTextWrap}>
              <Text style={[styles.tipHead, { color: theme.textPrimary }]}>
                {renderWithNotoNumbers('চোখের আরামদায়ক ৪টি থিম', true)}
              </Text>
              <Text style={[styles.tipDesc, { color: theme.textSecondary }]}>
                কাগজী বেইজ, প্রাচীন গ্রন্থ পাতা, টেরাকোটা ও ডিপ ফরেস্ট (নাইট মোড) — দিন বা রাত যেকোনো সময় চোখের চাপ ছাড়াই পড়ুন।
              </Text>
            </View>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="bookmark-outline" size={18} color={theme.accentTerracotta} />
            <View style={styles.tipTextWrap}>
              <Text style={[styles.tipHead, { color: theme.textPrimary }]}>
                অনুচ্ছেদ বুকমার্ক ও পড়া চালিয়ে যাওয়া
              </Text>
              <Text style={[styles.tipDesc, { color: theme.textSecondary }]}>
                পড়ার সময় যেকোনো অনুচ্ছেদে কিছুক্ষণ চেপে ধরলে সেটি বুকমার্ক হয়ে যাবে এবং সর্বশেষ পঠিত অধ্যায় স্বয়ংক্রিয়ভাবে মনে রাখা হবে।
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.serifBold,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 18,
    gap: 18,
  },
  brandHero: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontFamily: FONTS.serifBold,
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 13,
    fontFamily: FONTS.sansMedium,
    textAlign: 'center',
  },
  card: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONTS.serifBold,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipTextWrap: {
    flex: 1,
    gap: 2,
  },
  tipHead: {
    fontSize: 14,
    fontFamily: FONTS.sansBold,
  },
  tipDesc: {
    fontSize: 13,
    fontFamily: FONTS.sansMedium,
    lineHeight: 20,
  },
});
