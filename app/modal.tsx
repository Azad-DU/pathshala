import React, { useMemo } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ALL_BOOKS_META,
  WRITERS,
  getBooksByWriter,
} from '@/data/writers';
import { getWriterAvatarSource } from '@/constants/covers';
import {
  ELEVATION,
  RADIUS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { AppText as Text } from '@/components/ui/AppText';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { hapticSelection } from '@/utils/haptics';

const GITHUB_URL = 'https://github.com/Azad-DU/pathshala';
const GITHUB_RELEASES_URL = 'https://github.com/Azad-DU/pathshala/releases';
const FACEBOOK_URL = 'https://www.facebook.com/akazadDU103';

export default function AboutModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = usePathshalaTheme();
  const layout = useResponsiveLayout();

  const appVersion = Constants.expoConfig?.version ?? '1.1.0';
  const banglaVersion = toBanglaNumber(appVersion);

  const writerCount = WRITERS.length;
  const bookCount = ALL_BOOKS_META.length;
  const totalPieces = useMemo(
    () => ALL_BOOKS_META.reduce((acc, b) => acc + (b.totalChapters || 0), 0),
    []
  );

  const writerNamesList = useMemo(() => {
    const names = WRITERS.map((w) => w.name);
    if (names.length <= 1) return names[0] || '';
    return `${names.slice(0, -1).join(', ')} ও ${names[names.length - 1]}`;
  }, []);

  const guideTips: {
    icon: keyof typeof Ionicons.glyphMap;
    tone: 'terracotta' | 'sage';
    title: string;
    desc: string;
  }[] = useMemo(
    () => [
      {
        icon: 'people-outline',
        tone: 'terracotta',
        title: `${toBanglaNumber(writerCount)} জন সাহিত্যিক ও ${toBanglaNumber(bookCount)}টি অফলাইন গ্রন্থ`,
        desc: `${writerNamesList}-এর উপন্যাস, গল্পগ্রন্থ, কবিতা, গান, নাটক ও প্রবন্ধ সম্পূর্ণ অফলাইনে পড়ুন।`,
      },
      {
        icon: 'search-outline',
        tone: 'sage',
        title: 'স্মার্ট বাংলা অনুসন্ধান (খুঁজুন)',
        desc: 'বই, গল্প, কবিতা, গান কিংবা লেখকের নাম — সহজ বাংলা বানানেই মুহূর্তে খুঁজে পাবেন পুরো পাঠাগার থেকে।',
      },
      {
        icon: 'text-outline',
        tone: 'terracotta',
        title: 'বাংলা হরফ ও পাঠ বিন্যাস',
        desc: 'নোটো সেরিফ ও হিন্দ শিলিগুড়ি হরফ, লেখার আকার, লাইনের দূরত্ব, মার্জিন এবং ইন্ডেন্ট নিজের মতো সাজিয়ে নিতে পারবেন।',
      },
      {
        icon: 'color-palette-outline',
        tone: 'sage',
        title: 'চোখের আরামদায়ক ৪টি পাঠ-থিম',
        desc: 'কাগজী বেইজ, প্রাচীন গ্রন্থ পাতা, টেরাকোটা মৃত্তিকা ও ডিপ ফরেস্ট (নাইট মোড) — দিন বা রাত যেকোনো সময় চোখের চাপ ছাড়াই পড়ুন।',
      },
      {
        icon: 'bookmark-outline',
        tone: 'terracotta',
        title: 'অনুচ্ছেদ বুকমার্ক ও পড়া চালিয়ে যাওয়া',
        desc: 'পড়ার সময় যেকোনো অনুচ্ছেদে কিছুক্ষণ চেপে ধরে বুকমার্ক বা শেয়ার করতে পারবেন এবং সর্বশেষ পঠিত অধ্যায় স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে।',
      },
    ],
    [writerCount, bookCount, writerNamesList]
  );

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
            পাঠশালা — অ্যাপ পরিচিতি ও নির্দেশিকা
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
            paddingBottom: Math.max(insets.bottom, 20) + 28,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Brand Hero */}
        <View style={styles.brandHero}>
          <BrandLogo size={72} borderRadius={20} style={[ELEVATION.e2, { marginBottom: 4 }]} />
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
            পাঠশালা
          </Text>
          <Text style={[styles.brandSub, { color: theme.textSecondary }]}>
            চিরায়ত বাংলা সাহিত্যের নির্মল অফলাইন পাঠাগার
          </Text>
          <View
            style={[
              styles.versionPill,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderSubtle,
              },
            ]}>
            <Text style={[styles.versionPillText, { color: theme.accentTerracotta }]}>
              সংস্করণ {banglaVersion} • সম্পূর্ণ অফলাইন
            </Text>
          </View>
        </View>

        {/* Live Library Summary Strip */}
        <View
          style={[
            styles.statsCard,
            ELEVATION.e1,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}>
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.accentTerracotta }]}>
              {toBanglaNumber(writerCount)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              সাহিত্যিক
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.borderSubtle }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.textPrimary }]}>
              {toBanglaNumber(bookCount)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              অফলাইন গ্রন্থ
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.borderSubtle }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.accentSage }]}>
              {toBanglaNumber(totalPieces)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              অধ্যায়, কবিতা ও গান
            </Text>
          </View>
        </View>

        {/* Writers Directory Card */}
        <View
          style={[
            styles.card,
            ELEVATION.e1,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            সংগ্রহভুক্ত সাহিত্যিকগণ
          </Text>

          <View style={styles.writersList}>
            {WRITERS.map((w, idx) => {
              const avatar = getWriterAvatarSource(w.id);
              const count = getBooksByWriter(w.id).length;
              return (
                <Pressable
                  key={w.id}
                  onPress={() => {
                    hapticSelection();
                    router.replace(`/author/${w.id}` as any);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={w.name}
                  style={({ pressed }) => [
                    styles.writerRow,
                    idx > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: theme.borderSubtle,
                      paddingTop: 12,
                    },
                    pressed && { opacity: 0.78 },
                  ]}>
                  <View
                    style={[
                      styles.writerAvatar,
                      {
                        backgroundColor: w.avatarColor,
                        borderColor: theme.borderStrong,
                      },
                    ]}>
                    {avatar ? (
                      <Image
                        source={avatar}
                        resizeMode="cover"
                        style={styles.writerAvatarImg}
                      />
                    ) : (
                      <Text style={styles.writerMonogram}>{w.monogram}</Text>
                    )}
                  </View>

                  <View style={styles.writerMeta}>
                    <Text
                      numberOfLines={1}
                      style={[styles.writerName, { color: theme.textPrimary }]}>
                      {w.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.writerSub, { color: theme.textMuted }]}>
                      {renderWithNotoNumbers(
                        `${w.birthDeath} • ${toBanglaNumber(count)}টি গ্রন্থ`
                      )}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Reading Guide & Features Card */}
        <View
          style={[
            styles.card,
            ELEVATION.e1,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            পাঠ নির্দেশিকা ও বৈশিষ্ট্য
          </Text>

          {guideTips.map((tip) => {
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

        {/* App Details, Privacy & Source Card */}
        <View
          style={[
            styles.card,
            ELEVATION.e1,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            অ্যাপ সম্পর্কিত তথ্য
          </Text>

          <View style={styles.infoRows}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoKey, { color: theme.textMuted }]}>
                সংস্করণ
              </Text>
              <Text style={[styles.infoVal, { color: theme.textPrimary }]}>
                {renderWithNotoNumbers(`সংস্করণ ${banglaVersion} (${appVersion})`)}
              </Text>
            </View>

            <View
              style={[
                styles.infoRow,
                { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.borderSubtle, paddingTop: 10 },
              ]}>
              <Text style={[styles.infoKey, { color: theme.textMuted }]}>
                পাঠ মাধ্যম
              </Text>
              <Text style={[styles.infoVal, { color: theme.textPrimary }]}>
                ১০০% অফলাইন (কোনো ইন্টারনেট বা লগইন প্রয়োজন নেই)
              </Text>
            </View>

            <View
              style={[
                styles.infoRow,
                { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.borderSubtle, paddingTop: 10 },
              ]}>
              <Text style={[styles.infoKey, { color: theme.textMuted }]}>
                গোপনীয়তা
              </Text>
              <Text style={[styles.infoVal, { color: theme.textSecondary }]}>
                আপনার পঠন অগ্রগতি, বুকমার্ক ও পাঠ-বিন্যাস কেবল আপনার ডিভাইসেই সংরক্ষিত থাকে; কোনো ব্যক্তিগত তথ্য সংগ্রহ করা হয় না।
              </Text>
            </View>

            <View
              style={[
                styles.infoRow,
                { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.borderSubtle, paddingTop: 10 },
              ]}>
              <Text style={[styles.infoKey, { color: theme.textMuted }]}>
                সাহিত্য স্বত্ব
              </Text>
              <Text style={[styles.infoVal, { color: theme.textSecondary }]}>
                সংগৃহীত সকল রচনা চিরায়ত বাংলা সাহিত্যের সর্বসাধারণের ব্যবহারযোগ্য (Public Domain) কর্ম।
              </Text>
            </View>
            <View
              style={[
                styles.developerRow,
                {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: theme.borderSubtle,
                  paddingTop: 12,
                },
              ]}>
              <Ionicons
                name="heart"
                size={16}
                color={theme.accentTerracotta}
              />
              <Text style={[styles.developerText, { color: theme.textPrimary }]}>
                Developed with love by Ak Azad
              </Text>
            </View>
          </View>

          <View style={styles.linksGroup}>
            <Pressable
              onPress={() => {
                hapticSelection();
                Linking.openURL(GITHUB_RELEASES_URL).catch(() => {});
              }}
              accessibilityRole="link"
              accessibilityLabel="অ্যাপ আপডেট (নতুন রিলিজ ডাউনলোড)"
              style={({ pressed }) => [
                styles.sourceBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.accentTerracotta,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <View style={styles.sourceLeft}>
                <Ionicons
                  name="cloud-download-outline"
                  size={19}
                  color={theme.accentTerracotta}
                />
                <View style={styles.sourceTextWrap}>
                  <Text style={[styles.sourceTitle, { color: theme.textPrimary }]}>
                    অ্যাপ আপডেট (নতুন রিলিজ ডাউনলোড)
                  </Text>
                  <Text style={[styles.sourceUrl, { color: theme.accentTerracotta }]}>
                    github.com/Azad-DU/pathshala/releases
                  </Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={17} color={theme.accentTerracotta} />
            </Pressable>

            <Pressable
              onPress={() => {
                hapticSelection();
                Linking.openURL(FACEBOOK_URL).catch(() => {});
              }}
              accessibilityRole="link"
              accessibilityLabel="Facebook: www.facebook.com/akazadDU103"
              style={({ pressed }) => [
                styles.sourceBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderSubtle,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <View style={styles.sourceLeft}>
                <Ionicons name="logo-facebook" size={19} color="#1877F2" />
                <View style={styles.sourceTextWrap}>
                  <Text style={[styles.sourceTitle, { color: theme.textPrimary }]}>
                    ডেভেলপার ফেসবুক প্রোফাইল
                  </Text>
                  <Text style={[styles.sourceUrl, { color: theme.accentTerracotta }]}>
                    www.facebook.com/akazadDU103
                  </Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={17} color={theme.accentTerracotta} />
            </Pressable>

            <Pressable
              onPress={() => {
                hapticSelection();
                Linking.openURL(GITHUB_URL).catch(() => {});
              }}
              accessibilityRole="link"
              accessibilityLabel="ওপেন সোর্স ও হালনাগাদ"
              style={({ pressed }) => [
                styles.sourceBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderSubtle,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <View style={styles.sourceLeft}>
                <Ionicons name="logo-github" size={19} color={theme.textPrimary} />
                <View style={styles.sourceTextWrap}>
                  <Text style={[styles.sourceTitle, { color: theme.textPrimary }]}>
                    ওপেন সোর্স ও হালনাগাদ
                  </Text>
                  <Text style={[styles.sourceUrl, { color: theme.accentTerracotta }]}>
                    github.com/Azad-DU/pathshala
                  </Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={17} color={theme.accentTerracotta} />
            </Pressable>
          </View>
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
    fontSize: 16.5,
    flex: 1,
    minWidth: 0,
  },
  closeBtn: {
    flexShrink: 0,
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
  brandTitle: {
    ...TYPOGRAPHY.display,
    width: '100%',
    textAlign: 'center',
  },
  brandSub: {
    ...TYPOGRAPHY.body,
    width: '100%',
    fontSize: 13.5,
    textAlign: 'center',
  },
  versionPill: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  versionPillText: {
    fontFamily: FONTS.serifBold,
    fontSize: 12,
    textAlign: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNum: {
    fontFamily: FONTS.serifBold,
    fontSize: 20,
    width: '100%',
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: FONTS.sansMedium,
    fontSize: 11.5,
    width: '100%',
    textAlign: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
  },
  card: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 16,
  },
  cardTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 16.5,
  },
  writersList: {
    gap: 12,
  },
  writerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  writerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  writerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  writerMonogram: {
    color: '#FFFFFF',
    fontFamily: FONTS.serifBold,
    fontSize: 16,
  },
  writerMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  writerName: {
    ...TYPOGRAPHY.h3,
    fontSize: 14.5,
  },
  writerSub: {
    ...TYPOGRAPHY.caption,
    fontSize: 11.5,
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
    minWidth: 0,
    gap: 3,
  },
  tipHead: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
  },
  tipDesc: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 22,
    fontFamily: FONTS.sansMedium,
  },
  infoRows: {
    gap: 10,
  },
  infoRow: {
    gap: 3,
  },
  infoKey: {
    ...TYPOGRAPHY.overline,
    fontSize: 11.5,
  },
  infoVal: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 21,
    fontFamily: FONTS.sansMedium,
  },
  developerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  developerText: {
    fontFamily: FONTS.sansBold,
    fontSize: 13.5,
    lineHeight: 20,
  },
  linksGroup: {
    gap: 10,
  },
  sourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 2,
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  sourceTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  sourceTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 13.5,
  },
  sourceUrl: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
  },
});
