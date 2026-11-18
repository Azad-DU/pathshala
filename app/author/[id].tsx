import React, { useState, useMemo, useCallback, useRef, type ComponentRef } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ALL_BOOKS_META,
  LITERARY_TYPE_INFO,
  WRITERS,
  getWriterById,
} from '@/data/writers';
import type { BookMeta, LiteraryType, ReadingHistory } from '@/types/library';
import { getWriterAvatarSource } from '@/constants/covers';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { ClothboundBookCard } from '@/components/ClothboundBookCard';
import { GlassHeader } from '@/components/ui/GlassHeader';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { StorageService } from '@/services/storage';
import { hapticSelection } from '@/utils/haptics';

const CATEGORY_ORDER: LiteraryType[] = [
  'uponnash',
  'golpo',
  'kobita',
  'gaan',
  'natok',
  'probondho',
  'kishorepattho',
  'vromonkahini',
  'onyanno',
];

export default function AuthorDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = usePathshalaTheme();
  const blurTargetRef = useRef<ComponentRef<typeof BlurTargetView>>(null);

  const author = getWriterById(id || '') || WRITERS[0];
  const [readingHistory, setReadingHistory] = useState<
    Record<string, ReadingHistory>
  >({});

  useFocusEffect(
    useCallback(() => {
      StorageService.getAllReadingHistory().then(setReadingHistory);
    }, [])
  );

  const authorBooks = useMemo(
    () =>
      author ? ALL_BOOKS_META.filter((b) => b.writerId === author.id) : [],
    [author]
  );

  const literaryGroups = useMemo(() => {
    const groups: {
      type: LiteraryType;
      title: string;
      icon: string;
      books: BookMeta[];
    }[] = [];
    for (const type of CATEGORY_ORDER) {
      const books = authorBooks.filter((b) => b.literaryType === type);
      if (books.length > 0) {
        groups.push({
          type,
          title: LITERARY_TYPE_INFO[type].label,
          icon: LITERARY_TYPE_INFO[type].icon,
          books,
        });
      }
    }
    return groups;
  }, [authorBooks]);

  if (!author) return null;
  const avatarSource = getWriterAvatarSource(author.id);

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <BlurTargetView ref={blurTargetRef} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 82,
            paddingBottom: Math.max(insets.bottom, 16) + 34,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.authorHero,
            { backgroundColor: theme.card, borderColor: theme.borderStrong },
          ]}>
          <View
            style={[
              styles.avatarLarge,
              {
                backgroundColor: author.avatarColor,
                borderColor: theme.borderStrong,
                borderWidth: 2,
                overflow: 'hidden',
              },
            ]}>
            {avatarSource ? (
              <Image
                source={avatarSource}
                resizeMode="cover"
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarMonogram}>{author.monogram}</Text>
            )}
          </View>

          <Text style={[styles.authorName, { color: theme.textPrimary }]}>
            {author.name}
          </Text>

          <View
            style={[
              styles.eraBadge,
              { backgroundColor: theme.accentSoftSage },
            ]}>
            <Text style={[styles.eraBadgeText, { color: theme.accentSage }]}>
              {renderWithNotoNumbers(`${author.birthDeath} • ${author.era}`, true)}
            </Text>
          </View>

          <Text style={[styles.bioText, { color: theme.textSecondary }]}>
            {author.bio}
          </Text>

          {author.quoteSnippet ? (
            <View
              style={[
                styles.quoteCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderSubtle,
                },
              ]}>
              <Text style={[styles.quoteText, { color: theme.textPrimary }]}>
                “{author.quoteSnippet}”
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.groupsContainer}>
          {literaryGroups.map((group) => (
            <View key={group.type} style={styles.groupBlock}>
              <View style={styles.groupHeader}>
                <View style={styles.groupTitleRow}>
                  <Ionicons
                    name={group.icon as keyof typeof Ionicons.glyphMap}
                    size={17}
                    color={theme.accentTerracotta}
                  />
                  <Text
                    style={[styles.groupTitle, { color: theme.textPrimary }]}>
                    {group.title}
                  </Text>
                  <Text style={[styles.groupCount, { color: theme.textMuted }]}>
                    ({toBanglaNumber(group.books.length)})
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    hapticSelection();
                    router.push({
                      pathname: '/browse',
                      params: { type: group.type, writer: author.id },
                    } as any);
                  }}
                  hitSlop={8}
                  style={styles.seeAllBtn}>
                  <Text
                    style={[
                      styles.seeAllText,
                      { color: theme.accentTerracotta },
                    ]}>
                    সব দেখুন
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={theme.accentTerracotta}
                  />
                </Pressable>
              </View>

              <FlatList
                data={group.books}
                horizontal
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={5}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => `${group.type}-${item.id}`}
                contentContainerStyle={styles.shelfListContent}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                renderItem={({ item }) => (
                  <ClothboundBookCard
                    book={item}
                    size="compact"
                    readingChapter={readingHistory[item.id]?.chapterSequence}
                  />
                )}
              />
            </View>
          ))}
        </View>
      </ScrollView>
      </BlurTargetView>

      <GlassHeader
        backButton
        title="লেখক বৃত্তান্ত"
        floating
        radius={24}
        blurTarget={blurTargetRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    paddingBottom: 50,
  },
  authorHero: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 22,
  },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarMonogram: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: FONTS.serifBold,
  },
  authorName: {
    fontSize: 22,
    fontFamily: FONTS.serifBold,
    textAlign: 'center',
    marginBottom: 6,
  },
  eraBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 12,
  },
  eraBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
  },
  bioText: {
    fontSize: 14,
    fontFamily: FONTS.serifRegular,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 14,
  },
  quoteCard: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  quoteText: {
    fontSize: 14,
    fontFamily: FONTS.serifRegular,
    lineHeight: 23,
    textAlign: 'center',
  },
  groupsContainer: {
    gap: 24,
  },
  groupBlock: {
    gap: 12,
  },
  groupHeader: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupTitle: {
    fontSize: 17,
    fontFamily: FONTS.serifBold,
  },
  groupCount: {
    fontSize: 12,
    fontFamily: FONTS.serifBold,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: FONTS.sansBold,
  },
  shelfListContent: {
    paddingHorizontal: 16,
  },
});
