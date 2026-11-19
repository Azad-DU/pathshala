import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import type { ReaderSettings, ThemeMode } from '@/types/library';
import { THEMES, type ThemeColors } from '@/constants/Themes';
import { RADIUS, TOUCH_TARGET } from '@/constants/design';
import { FONTS, toBanglaNumber } from '@/constants/Typography';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { renderWithNotoNumbers } from '@/components/ui/NotoNumbers';
import { hapticSelection } from '@/utils/haptics';

export interface ReaderSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  theme: ThemeColors;
  themeMode: ThemeMode;
  onSelectThemeMode: (mode: ThemeMode) => void;
  fontSize: number;
  lineHeightMultiplier: number;
  calculatedLineHeight: number;
  proseFontFamily: string;
  isSerif: boolean;
  textAlign: 'left' | 'justify';
  paragraphSpacing: ReaderSettings['paragraphSpacing'];
  marginSize: ReaderSettings['marginSize'];
  firstLineIndent: boolean;
  onFontSizeChange: (val: number) => void;
  onFontSizeComplete: (val: number) => void;
  onLineHeightChange: (val: number) => void;
  onLineHeightComplete: (val: number) => void;
  onSetFontFamily: (serif: boolean) => void;
  onSetTextAlign: (align: 'left' | 'justify') => void;
  onSetParagraphSpacing: (spacing: ReaderSettings['paragraphSpacing']) => void;
  onSetMarginSize: (margin: ReaderSettings['marginSize']) => void;
  onToggleIndent: () => void;
  onResetDefaults: () => void;
}

const THEME_MODES: [ThemeMode, string][] = [
  ['auto', 'অটো (সিস্টেম)'],
  ['paper-beige', THEMES['paper-beige'].nameBangla],
  ['antique-book', THEMES['antique-book'].nameBangla],
  ['terracotta', THEMES.terracotta.nameBangla],
  ['deep-forest', THEMES['deep-forest'].nameBangla],
];

const SPACING_OPTIONS: [ReaderSettings['paragraphSpacing'], string][] = [
  ['compact', 'সংক্ষিপ্ত'],
  ['normal', 'স্বাভাবিক'],
  ['relaxed', 'প্রশস্ত'],
];

const MARGIN_OPTIONS: [ReaderSettings['marginSize'], string][] = [
  ['narrow', 'সংকীর্ণ'],
  ['normal', 'স্বাভাবিক'],
  ['wide', 'প্রশস্ত'],
];

export function ReaderSettingsSheet({
  visible,
  onClose,
  theme,
  themeMode,
  onSelectThemeMode,
  fontSize,
  lineHeightMultiplier,
  calculatedLineHeight,
  proseFontFamily,
  isSerif,
  textAlign,
  paragraphSpacing,
  marginSize,
  firstLineIndent,
  onFontSizeChange,
  onFontSizeComplete,
  onLineHeightChange,
  onLineHeightComplete,
  onSetFontFamily,
  onSetTextAlign,
  onSetParagraphSpacing,
  onSetMarginSize,
  onToggleIndent,
  onResetDefaults,
}: ReaderSettingsSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="পাঠ ও অক্ষর বিন্যাস"
      maxHeight="85%"
      themeOverride={theme}
      headerRight={
        <Pressable
          onPress={() => {
            hapticSelection();
            onResetDefaults();
          }}
          accessibilityRole="button"
          accessibilityLabel="ডিফল্ট বিন্যাস ফিরিয়ে আনুন"
          style={({ pressed }) => [
            styles.resetBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.borderSubtle,
              opacity: pressed ? 0.72 : 1,
            },
          ]}>
          <Text style={[styles.resetBtnText, { color: theme.accentTerracotta }]}>
            ডিফল্ট
          </Text>
        </Pressable>
      }>
      <ScrollView
        style={styles.settingsScroll}
        contentContainerStyle={[
          styles.settingsBody,
          { paddingBottom: Math.max(insets.bottom, 16) + 20 },
        ]}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        showsVerticalScrollIndicator>
        {/* Live Typography Preview */}
        <View
          style={[
            styles.previewBox,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}>
          <Text
            style={{
              fontSize,
              lineHeight: calculatedLineHeight,
              color: theme.textPrimary,
              fontFamily: proseFontFamily,
              textAlign,
            }}>
            {renderWithNotoNumbers(
              `${firstLineIndent ? '    ' : ''}পথের শেষ কোথায় কে জানে? কিন্তু পথিক চলার আনন্দেই সমৃদ্ধ হয়।`
            )}
          </Text>
        </View>

        {/* Theme Mode Selector */}
        <View style={styles.settingGroup}>
          <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
            পাঠের থিম
          </Text>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themePillsRow}>
            {THEME_MODES.map(([mode, label]) => {
              const active = themeMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => {
                    hapticSelection();
                    onSelectThemeMode(mode);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.themePillBtn,
                    active
                      ? {
                          backgroundColor: theme.accentTerracotta,
                          borderColor: theme.accentTerracotta,
                        }
                      : {
                          backgroundColor: theme.surface,
                          borderColor: theme.borderSubtle,
                        },
                  ]}>
                  <Text
                    style={[
                      styles.optionBtnText,
                      { color: active ? '#FFFFFF' : theme.textPrimary },
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Font Family */}
        <View style={styles.settingGroup}>
          <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
            বাংলা হরফের ধরন
          </Text>
          <View style={styles.optionRow}>
            <Pressable
              onPress={() => onSetFontFamily(true)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSerif }}
              style={[
                styles.optionBtn,
                isSerif
                  ? {
                      backgroundColor: theme.accentTerracotta,
                      borderColor: theme.accentTerracotta,
                    }
                  : {
                      backgroundColor: theme.surface,
                      borderColor: theme.borderSubtle,
                    },
              ]}>
              <Text
                style={[
                  styles.optionBtnText,
                  {
                    fontFamily: FONTS.serifBold,
                    color: isSerif ? '#FFFFFF' : theme.textPrimary,
                  },
                ]}>
                নোটো সেরিফ (বই)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSetFontFamily(false)}
              accessibilityRole="button"
              accessibilityState={{ selected: !isSerif }}
              style={[
                styles.optionBtn,
                !isSerif
                  ? {
                      backgroundColor: theme.accentTerracotta,
                      borderColor: theme.accentTerracotta,
                    }
                  : {
                      backgroundColor: theme.surface,
                      borderColor: theme.borderSubtle,
                    },
              ]}>
              <Text
                style={[
                  styles.optionBtnText,
                  {
                    fontFamily: FONTS.sansBold,
                    color: !isSerif ? '#FFFFFF' : theme.textPrimary,
                  },
                ]}>
                হিন্দ শিলিগুড়ি (আধুনিক)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Font Size Slider */}
        <View style={styles.settingGroup}>
          <View style={styles.settingLabelRow}>
            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
              হরফের আকার
            </Text>
            <Text style={[styles.settingValText, { color: theme.accentTerracotta }]}>
              {toBanglaNumber(fontSize)}
            </Text>
          </View>
          <Slider
            minimumValue={15}
            maximumValue={30}
            step={1}
            value={fontSize}
            onValueChange={onFontSizeChange}
            onSlidingComplete={onFontSizeComplete}
            minimumTrackTintColor={theme.accentTerracotta}
            maximumTrackTintColor={theme.borderStrong}
            thumbTintColor={theme.accentTerracotta}
          />
        </View>

        {/* Line Height Slider */}
        <View style={styles.settingGroup}>
          <View style={styles.settingLabelRow}>
            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
              লাইনের দূরত্ব
            </Text>
            <Text style={[styles.settingValText, { color: theme.accentTerracotta }]}>
              {toBanglaNumber(lineHeightMultiplier)}x
            </Text>
          </View>
          <Slider
            minimumValue={1.6}
            maximumValue={2.5}
            step={0.1}
            value={lineHeightMultiplier}
            onValueChange={onLineHeightChange}
            onSlidingComplete={onLineHeightComplete}
            minimumTrackTintColor={theme.accentTerracotta}
            maximumTrackTintColor={theme.borderStrong}
            thumbTintColor={theme.accentTerracotta}
          />
        </View>

        {/* Paragraph Spacing */}
        <View style={styles.settingGroup}>
          <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
            অনুচ্ছেদের ব্যবধান
          </Text>
          <View style={styles.optionRow}>
            {SPACING_OPTIONS.map(([val, lbl]) => {
              const active = paragraphSpacing === val;
              return (
                <Pressable
                  key={val}
                  onPress={() => onSetParagraphSpacing(val)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.optionBtn,
                    active
                      ? {
                          backgroundColor: theme.accentTerracotta,
                          borderColor: theme.accentTerracotta,
                        }
                      : {
                          backgroundColor: theme.surface,
                          borderColor: theme.borderSubtle,
                        },
                  ]}>
                  <Text
                    style={[
                      styles.optionBtnText,
                      { color: active ? '#FFFFFF' : theme.textPrimary },
                    ]}>
                    {lbl}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Margin Size */}
        <View style={styles.settingGroup}>
          <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
            পাশের মার্জিন
          </Text>
          <View style={styles.optionRow}>
            {MARGIN_OPTIONS.map(([val, lbl]) => {
              const active = marginSize === val;
              return (
                <Pressable
                  key={val}
                  onPress={() => onSetMarginSize(val)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.optionBtn,
                    active
                      ? {
                          backgroundColor: theme.accentTerracotta,
                          borderColor: theme.accentTerracotta,
                        }
                      : {
                          backgroundColor: theme.surface,
                          borderColor: theme.borderSubtle,
                        },
                  ]}>
                  <Text
                    style={[
                      styles.optionBtnText,
                      { color: active ? '#FFFFFF' : theme.textPrimary },
                    ]}>
                    {lbl}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Alignment */}
        <View style={styles.settingGroup}>
          <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
            লেখার বিন্যাস
          </Text>
          <View style={styles.optionRow}>
            <Pressable
              onPress={() => onSetTextAlign('left')}
              accessibilityRole="button"
              accessibilityState={{ selected: textAlign === 'left' }}
              style={[
                styles.optionBtn,
                textAlign === 'left'
                  ? {
                      backgroundColor: theme.accentTerracotta,
                      borderColor: theme.accentTerracotta,
                    }
                  : {
                      backgroundColor: theme.surface,
                      borderColor: theme.borderSubtle,
                    },
              ]}>
              <Text
                style={[
                  styles.optionBtnText,
                  { color: textAlign === 'left' ? '#FFFFFF' : theme.textPrimary },
                ]}>
                বাম-বিন্যস্ত
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSetTextAlign('justify')}
              accessibilityRole="button"
              accessibilityState={{ selected: textAlign === 'justify' }}
              style={[
                styles.optionBtn,
                textAlign === 'justify'
                  ? {
                      backgroundColor: theme.accentTerracotta,
                      borderColor: theme.accentTerracotta,
                    }
                  : {
                      backgroundColor: theme.surface,
                      borderColor: theme.borderSubtle,
                    },
              ]}>
              <Text
                style={[
                  styles.optionBtnText,
                  {
                    color:
                      textAlign === 'justify' ? '#FFFFFF' : theme.textPrimary,
                  },
                ]}>
                উভয় প্রান্ত সমান
              </Text>
            </Pressable>
          </View>
        </View>

        {/* First-line Indent */}
        <Pressable
          onPress={onToggleIndent}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: firstLineIndent }}
          style={[
            styles.indentToggleRow,
            { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
          ]}>
          <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
            অনুচ্ছেদ প্রথম লাইন ইন্ডেন্ট
          </Text>
          <Ionicons
            name={firstLineIndent ? 'checkbox' : 'square-outline'}
            size={22}
            color={firstLineIndent ? theme.accentTerracotta : theme.textMuted}
          />
        </Pressable>
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  resetBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FONTS.sansBold,
  },
  settingsScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  settingsBody: {
    padding: 20,
    gap: 16,
  },
  previewBox: {
    padding: 14,
    minHeight: 88,
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  settingGroup: {
    gap: 8,
  },
  settingLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONTS.sansBold,
  },
  settingValText: {
    fontSize: 13.5,
    lineHeight: 19,
    fontFamily: FONTS.serifBold,
  },
  themePillsRow: {
    gap: 8,
  },
  themePillBtn: {
    minHeight: 40,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET.min,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBtnText: {
    fontSize: 12.5,
    lineHeight: 17,
    fontFamily: FONTS.sansBold,
    textAlign: 'center',
  },
  indentToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOUCH_TARGET.min + 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
});
