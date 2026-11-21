import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ALL_BOOKS_META,
  LITERARY_TYPE_INFO,
  getWriterById,
} from '@/data/writers';
import type { BookMeta, LiteraryType, ReadingHistory } from '@/types/library';
import { getWriterAvatarSource } from '@/constants/covers';
import { ELEVATION, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { ClothboundBookCard } from '@/components/ClothboundBookCard';
import { AppText as Text } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassHeader } from '@/components/ui/GlassHeader';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { StorageService } from '@/services/storage';
import { CATEGORY_ORDER } from '@/utils/bookHelpers';

interface LiteraryGroup {
  type: LiteraryType;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  books: BookMeta[];
}

function GroupSeparator() {
  return <View style={{ height: SPACING.xl }} />;
}

export default function AuthorDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = usePathshalaTheme();
  const layout = useResponsiveLayout();
  const blurTargetRef = useRef<ComponentRef<typeof BlurTargetView>>(null);

  const author = id ? getWriterById(id) : undefined;
  const [readingHistory, setReadingHistory] = useState<
    Record<string, ReadingHistory>
  >({});
  const [headerHeight, setHeaderHeight] = useState(0);

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

  const totalChaptersCount = useMemo(
    () => authorBooks.reduce((sum, b) => sum + (b.totalChapters || 0), 0),
    [authorBooks]
  );

  const literaryGroups: LiteraryGroup[] = useMemo(() => {
    const groups: LiteraryGroup[] = [];
    for (const type of CATEGORY_ORDER) {
      const books = authorBooks.filter((b) => b.literaryType === type);
      if (books.length > 0) {
        groups.push({
          type,
          title: LITERARY_TYPE_INFO[type].label,
          icon: LITERARY_TYPE_INFO[type].icon as keyof typeof Ionicons.glyphMap,
          books,
        });
      }
    }
    return groups;
  }, [authorBooks]);

  const renderCardSeparator = useCallback(
    () => <View style={{ width: layout.shelfGap }} />,
    [layout.shelfGap]
  );

  const avatarSource = author ? getWriterAvatarSource(author.id) : null;

  const listHeader = useMemo(() => {
    if (!author) return undefined;
    return (
      <View
        style={[
          styles.heroWrap,
          { paddingHorizontal: layout.horizontalPadding },
        ]}>
        <View
          style={[
            styles.authorHero,
            ELEVATION.e1,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}>
          <View
            style={[
              styles.avatarLarge,
              {
                backgroundColor: author.avatarColor,
                borderColor: theme.borderStrong,
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

          <Text
            accessibilityRole="header"
            style={[styles.authorName, { color: theme.textPrimary }]}>
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

          {/* Writer Stats Row */}
          <View
            style={[
              styles.statsRow,
              { borderTopColor: theme.borderSubtle, borderBottomColor: theme.borderSubtle },
            ]}>
            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
                {toBanglaNumber(authorBooks.length)}
              </Text>
              <Text style={[styles.statCaption, { color: theme.textMuted }]}>
                গ্রন্থ
              </Text>
            </View>
            <View
              style={[
                styles.statDivider,
                { backgroundColor: theme.borderSubtle },
              ]}
            />
            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
                {toBanglaNumber(totalChaptersCount)}
              </Text>
              <Text style={[styles.statCaption, { color: theme.textMuted }]}>
                রচনা / পর্ব
              </Text>
            </View>
            <View
              style={[
                styles.statDivider,
                { backgroundColor: theme.borderSubtle },
              ]}
            />
            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
                {toBanglaNumber(literaryGroups.length)}
              </Text>
              <Text style={[styles.statCaption, { color: theme.textMuted }]}>
                শাখা
              </Text>
            </View>
          </View>

          {author.quoteSnippet ? (
            <View
              style={[
                styles.quoteCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderSubtle,
                  borderLeftColor: theme.accentTerracotta,
                },
              ]}>
              <Text style={[styles.quoteText, { color: theme.textPrimary }]}>
                “{author.quoteSnippet}”
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }, [
    author,
    layout.horizontalPadding,
    theme,
    avatarSource,
    authorBooks.length,
    totalChaptersCount,
    literaryGroups.length,
  ]);

  const renderGroup = useCallback(
    ({ item: group }: { item: LiteraryGroup }) => (
      <View style={styles.groupBlock}>
        <SectionHeader
          icon={group.icon}
          title={group.title}
          countText={`(${toBanglaNumber(group.books.length)})`}
          actionLabel="সব দেখুন"
          onActionPress={() =>
            router.push({
              pathname: '/browse',
              params: { type: group.type, writer: author?.id },
            } as any)
          }
          style={{ paddingHorizontal: layout.horizontalPadding }}
        />

        <FlatList
          data={group.books}
          horizontal
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={Platform.OS === 'android'}
          getItemLayout={(_, index) => ({
            length: layout.shelfCardStep,
            offset: layout.shelfCardStep * index,
            index,
          })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `${group.type}-${item.id}`}
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
          }}
          ItemSeparatorComponent={renderCardSeparator}
          renderItem={({ item }) => (
            <ClothboundBookCard
              book={item}
              size="compact"
              cardWidth={layout.shelfCardWidth}
              readingChapter={readingHistory[item.id]?.chapterSequence}
            />
          )}
        />
      </View>
    ),
    [
      router,
      author?.id,
      layout.horizontalPadding,
      layout.shelfCardStep,
      layout.shelfCardWidth,
      renderCardSeparator,
      readingHistory,
    ]
  );

  if (!author) {
    return (
      <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
        <GlassHeader backButton title="লেখক বৃত্তান্ত" />
        <View
          style={[
            styles.notFoundWrap,
            { paddingTop: insets.top + 96, paddingHorizontal: layout.horizontalPadding },
          ]}>
          <EmptyState
            icon="person-outline"
            title="লেখকের তথ্য পাওয়া যায়নি"
            description="অনুরোধকৃত লেখককে পাঠাগারে খুঁজে পাওয়া যায়নি।"
            actionLabel="পাঠাগারে ফিরুন"
            onAction={() => router.replace('/')}
          />
        </View>
      </View>
    );
  }

  const topPad = headerHeight > 0 ? headerHeight + 16 : insets.top + 78;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <BlurTargetView ref={blurTargetRef} style={styles.safeArea}>
        <FlatList
          data={literaryGroups}
          keyExtractor={(g) => g.type}
          ListHeaderComponent={listHeader}
          renderItem={renderGroup}
          ItemSeparatorComponent={GroupSeparator}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={4}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={[
            styles.scrollContent,
            {
              maxWidth: layout.contentMaxWidth,
              paddingTop: topPad,
              paddingBottom: Math.max(insets.bottom, 16) + 36,
            },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </BlurTargetView>

      <GlassHeader
        backButton
        title="লেখক বৃত্তান্ত"
        maxWidth={layout.contentMaxWidth}
        blurTarget={blurTargetRef}
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h > 0 && h !== headerHeight) setHeaderHeight(h);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  notFoundWrap: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  scrollContent: {
    width: '100%',
    alignSelf: 'center',
  },
  heroWrap: {
    marginBottom: SPACING.xl,
  },
  authorHero: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 10,
  },
  avatarLarge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarMonogram: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: FONTS.serifBold,
  },
  authorName: {
    ...TYPOGRAPHY.h1,
    width: '100%',
    textAlign: 'center',
  },
  eraBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  eraBadgeText: {
    fontSize: 12,
    lineHeight: 19,
    fontFamily: FONTS.serifBold,
  },
  bioText: {
    ...TYPOGRAPHY.bodySerif,
    width: '100%',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 620,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
    paddingVertical: 12,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    width: '100%',
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
    fontFamily: FONTS.serifBold,
  },
  statCaption: {
    width: '100%',
    textAlign: 'center',
    fontSize: 11.5,
    lineHeight: 18,
    fontFamily: FONTS.serifMedium,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  quoteCard: {
    width: '100%',
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginTop: 4,
  },
  quoteText: {
    ...TYPOGRAPHY.bodySerif,
    width: '100%',
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'center',
  },
  groupBlock: {
    gap: SPACING.md,
  },
});
