import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Chapter, LiteraryType } from '@/types/library';
import type { ThemeColors } from '@/constants/Themes';
import { RADIUS, TOUCH_TARGET, TYPOGRAPHY } from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { AppText as Text } from '@/components/ui/AppText';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { getUnitLabel } from '@/utils/bookHelpers';
import { hapticSelection } from '@/utils/haptics';

interface IndexedTocRow {
  chapter: Chapter;
  originalIndex: number;
}

export interface ReaderTocSheetProps {
  visible: boolean;
  onClose: () => void;
  chapters: Chapter[];
  currentChapterIndex: number;
  literaryType?: LiteraryType;
  theme: ThemeColors;
  onSelectChapter: (index: number) => void;
}

function TocSeparator() {
  return <View style={{ height: 8 }} />;
}

export function ReaderTocSheet({
  visible,
  onClose,
  chapters,
  currentChapterIndex,
  literaryType = 'uponnash',
  theme,
  onSelectChapter,
}: ReaderTocSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const listRef = useRef<FlatList<IndexedTocRow>>(null);
  const unitLabel = getUnitLabel(literaryType);

  const filteredRows: IndexedTocRow[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mapped = chapters.map((chapter, originalIndex) => ({
      chapter,
      originalIndex,
    }));
    if (!q) return mapped;
    return mapped.filter(
      ({ chapter }) =>
        chapter.title.toLowerCase().includes(q) ||
        (chapter.displayTitle || '').toLowerCase().includes(q) ||
        toBanglaNumber(chapter.number).includes(q) ||
        String(chapter.number).includes(q)
    );
  }, [chapters, query]);

  useEffect(() => {
    if (!visible) return;
    if (query.trim().length > 0) return;
    if (currentChapterIndex <= 0 || currentChapterIndex >= chapters.length) {
      return;
    }
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: currentChapterIndex,
        animated: false,
        viewPosition: 0.3,
      });
    }, 120);
    return () => clearTimeout(timer);
  }, [visible, currentChapterIndex, chapters.length, query]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      title={`সূচিপত্র (${toBanglaNumber(chapters.length)} ${unitLabel})`}
      maxHeight="80%"
      themeOverride={theme}>
      {chapters.length > 8 ? (
        <View
          style={[
            styles.searchWrap,
            { borderBottomColor: theme.borderSubtle },
          ]}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderSubtle,
              },
            ]}>
            <Ionicons name="search" size={16} color={theme.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={`${unitLabel} খুঁজুন...`}
              placeholderTextColor={theme.textMuted}
              accessibilityLabel={`${unitLabel} খুঁজুন`}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery('')}
                accessibilityRole="button"
                accessibilityLabel="অনুসন্ধান মুছুন"
                style={styles.clearBtn}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.textMuted}
                />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={filteredRows}
        keyExtractor={(row) => `toc-${row.chapter.number}-${row.originalIndex}`}
        ItemSeparatorComponent={TocSeparator}
        keyboardShouldPersistTaps="handled"
        onScrollToIndexFailed={() => {
          // Safe fallback when chapter row is outside initial batch
        }}
        ListEmptyComponent={
          <EmptyState
            compact
            icon="search-outline"
            title={`কোনো ${unitLabel} পাওয়া যায়নি`}
            description="অন্য শব্দ দিয়ে খুঁজে দেখুন।"
            actionLabel="অনুসন্ধান মুছুন"
            onAction={() => setQuery('')}
            themeOverride={theme}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}
        renderItem={({ item }) => {
          const { chapter, originalIndex } = item;
          const isActive = originalIndex === currentChapterIndex;
          return (
            <Pressable
              onPress={() => {
                hapticSelection();
                setQuery('');
                onSelectChapter(originalIndex);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${chapter.displayTitle || chapter.title}`}
              style={({ pressed }) => [
                styles.tocItem,
                {
                  backgroundColor: isActive ? theme.surface : 'transparent',
                  borderColor: isActive
                    ? theme.accentTerracotta
                    : theme.borderSubtle,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.tocNum,
                  {
                    color: isActive ? theme.accentTerracotta : theme.textMuted,
                  },
                ]}>
                {toBanglaNumber(chapter.number)}
              </Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.tocItemTitle,
                    {
                      color: isActive
                        ? theme.accentTerracotta
                        : theme.textPrimary,
                    },
                  ]}>
                  {renderWithNotoNumbers(
                    chapter.displayTitle || chapter.title,
                    true
                  )}
                </Text>
                {chapter.readMinutes ? (
                  <Text style={[styles.tocItemSub, { color: theme.textMuted }]}>
                    {renderWithNotoNumbers(
                      `প্রায় ${toBanglaNumber(chapter.readMinutes)} মিনিট`
                    )}
                  </Text>
                ) : null}
              </View>
              {isActive ? (
                <Ionicons
                  name="checkmark-circle"
                  size={19}
                  color={theme.accentTerracotta}
                />
              ) : null}
            </Pressable>
          );
        }}
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: TOUCH_TARGET.min,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: FONTS.sansMedium,
    paddingVertical: 6,
  },
  clearBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  tocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  tocNum: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONTS.serifBold,
    minWidth: 30,
  },
  tocItemTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    lineHeight: 20,
  },
  tocItemSub: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: FONTS.sansMedium,
  },
});
