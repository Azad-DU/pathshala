import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/constants/Themes';
import { RADIUS, TOUCH_TARGET, TYPOGRAPHY } from '@/constants/design';
import { usePathshalaTheme } from '@/context/ThemeContext';
import { hapticSelection } from '@/utils/haptics';
import { renderWithNotoNumbers } from './NotoNumbers';

export interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  headerRight?: React.ReactNode;
  maxHeight?: DimensionValue;
  animationType?: 'slide' | 'fade';
  themeOverride?: ThemeColors;
  children: React.ReactNode;
}

/**
 * Android-scroll-safe Bottom Sheet modal:
 * Uses a sibling backdrop Pressable behind the sheet View (never wrapping
 * scrollable children inside a Pressable responder).
 */
export function BottomSheetModal({
  visible,
  onClose,
  title,
  headerRight,
  maxHeight = '84%',
  animationType = 'slide',
  themeOverride,
  children,
}: BottomSheetModalProps) {
  const { theme: appTheme } = usePathshalaTheme();
  const theme = themeOverride ?? appTheme;

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={styles.dismissLayer}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="বন্ধ করুন"
        />

        <View
          style={[
            styles.sheet,
            {
              maxHeight,
              backgroundColor: theme.canvas,
              borderColor: theme.borderStrong,
            },
          ]}>
          <View style={styles.handleWrap}>
            <View
              style={[styles.handle, { backgroundColor: theme.borderStrong }]}
            />
          </View>

          {title !== undefined ? (
            <View
              style={[
                styles.header,
                { borderBottomColor: theme.borderSubtle },
              ]}>
              <Text
                numberOfLines={1}
                accessibilityRole="header"
                style={[styles.title, { color: theme.textPrimary }]}>
                {renderWithNotoNumbers(title, true)}
              </Text>

              <View style={styles.headerActions}>
                {headerRight}
                <Pressable
                  onPress={() => {
                    hapticSelection();
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="বন্ধ করুন"
                  style={({ pressed }) => [
                    styles.closeBtn,
                    {
                      backgroundColor: theme.surface,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  <Ionicons name="close" size={20} color={theme.textPrimary} />
                </Pressable>
              </View>
            </View>
          ) : null}

          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 10, 0.48)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  dismissLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    width: '100%',
    maxWidth: 620,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    opacity: 0.55,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 14,
    paddingBottom: 12,
    paddingTop: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontSize: 16.5,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    borderRadius: TOUCH_TARGET.min / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
