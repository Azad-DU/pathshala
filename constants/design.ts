import { Platform } from 'react-native';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const TOUCH_TARGET = {
  min: 44,
} as const;

export const ELEVATION = {
  e0: {},
  e1: Platform.select({
    ios: {
      shadowColor: '#1E160F',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 2px 8px rgba(30, 22, 15, 0.06)' },
    default: {},
  }),
  e2: Platform.select({
    ios: {
      shadowColor: '#1E160F',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
    },
    android: { elevation: 5 },
    web: { boxShadow: '0 8px 22px rgba(30, 22, 15, 0.12)' },
    default: {},
  }),
  e3: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
    android: { elevation: 10 },
    web: { boxShadow: '0 14px 36px rgba(0, 0, 0, 0.2)' },
    default: {},
  }),
} as const;
