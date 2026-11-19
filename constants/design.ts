import { Platform } from 'react-native';
import { FONTS } from './Typography';

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
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const TOUCH_TARGET = {
  min: 44,
} as const;

export const BREAKPOINTS = {
  tablet: 720,
  desktop: 1080,
} as const;

export const LAYOUT = {
  maxContentWidth: 1080,
  maxDetailWidth: 820,
  maxReaderWidth: 680,
  bottomDockReserve: 96,
} as const;

export const TYPOGRAPHY = {
  display: {
    fontSize: 26,
    lineHeight: 36,
    fontFamily: FONTS.serifBold,
  },
  h1: {
    fontSize: 22,
    lineHeight: 31,
    fontFamily: FONTS.serifBold,
  },
  h2: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: FONTS.serifBold,
  },
  h3: {
    fontSize: 15.5,
    lineHeight: 23,
    fontFamily: FONTS.serifBold,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONTS.sansRegular,
  },
  bodySerif: {
    fontSize: 14.5,
    lineHeight: 24,
    fontFamily: FONTS.serifRegular,
  },
  label: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.sansBold,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.sansMedium,
  },
  overline: {
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: FONTS.sansBold,
  },
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
      shadowOpacity: 0.1,
      shadowRadius: 14,
    },
    android: { elevation: 4 },
    web: { boxShadow: '0 8px 22px rgba(30, 22, 15, 0.1)' },
    default: {},
  }),
  e3: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
    },
    android: { elevation: 9 },
    web: { boxShadow: '0 14px 36px rgba(0, 0, 0, 0.18)' },
    default: {},
  }),
} as const;
