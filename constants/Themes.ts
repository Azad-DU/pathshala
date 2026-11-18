export type ThemeId = 'paper-beige' | 'antique-book' | 'terracotta' | 'deep-forest';
export type AppScheme = 'light' | 'dark';

export interface ThemeColors {
  id: ThemeId | AppScheme;
  nameBangla: string;
  canvas: string;
  surface: string;
  card: string;
  borderSubtle: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentTerracotta: string;
  accentSage: string;
  accentSoftSage: string;
  pillBg: string;
  glassBorder: string;
  glassTint: string;
  glassSheen: string;
  glassRimTop: string;
  glassRimBottom: string;
  bookShadow: string;
  dotColor: string; // Used for circular swatch in reader
  hasPaperTexture?: boolean;
  isDark?: boolean;
}

export const APP_THEMES: Record<AppScheme, ThemeColors> = {
  light: {
    id: 'light',
    nameBangla: 'লাইট',
    canvas: '#FAF8F3',
    surface: '#F0ECE2',
    card: '#FFFFFF',
    borderSubtle: '#E5DEC9',
    borderStrong: '#D2C7B0',
    textPrimary: '#1E1914',
    textSecondary: '#544A40',
    textMuted: '#7D7266',
    accentTerracotta: '#B94D25',
    accentSage: '#4E6850',
    accentSoftSage: '#DFE7DE',
    pillBg: 'rgba(255, 253, 248, 0.52)',
    glassBorder: 'rgba(255, 255, 255, 0.85)',
    glassTint: 'rgba(255, 253, 249, 0.44)',
    glassSheen: 'rgba(255, 255, 255, 0.36)',
    glassRimTop: 'rgba(255, 255, 255, 0.92)',
    glassRimBottom: 'rgba(210, 199, 176, 0.45)',
    bookShadow: 'rgba(45, 32, 20, 0.14)',
    dotColor: '#FAF8F3',
    hasPaperTexture: false,
    isDark: false,
  },
  dark: {
    id: 'dark',
    nameBangla: 'ডার্ক',
    canvas: '#0E1310',
    surface: '#171F1A',
    card: '#1C2620',
    borderSubtle: '#28362E',
    borderStrong: '#384B40',
    textPrimary: '#EEF4F0',
    textSecondary: '#A9BDB1',
    textMuted: '#768D80',
    accentTerracotta: '#E4764D',
    accentSage: '#7FA685',
    accentSoftSage: '#24342B',
    pillBg: 'rgba(22, 30, 25, 0.56)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    glassTint: 'rgba(20, 27, 23, 0.50)',
    glassSheen: 'rgba(255, 255, 255, 0.08)',
    glassRimTop: 'rgba(255, 255, 255, 0.22)',
    glassRimBottom: 'rgba(255, 255, 255, 0.06)',
    bookShadow: 'rgba(0, 0, 0, 0.6)',
    dotColor: '#0E1310',
    hasPaperTexture: false,
    isDark: true,
  },
};

export const THEMES: Record<ThemeId, ThemeColors> = {
  'paper-beige': {
    id: 'paper-beige',
    nameBangla: 'কাগজী বেইজ',
    canvas: '#F9F6F0',
    surface: '#EFE9DE',
    card: '#FCFAF6',
    borderSubtle: '#E2D9C8',
    borderStrong: '#CFC2AC',
    textPrimary: '#241D17',
    textSecondary: '#594E44',
    textMuted: '#7E7266',
    accentTerracotta: '#B94D25',
    accentSage: '#526B54',
    accentSoftSage: '#DDE5DC',
    pillBg: 'rgba(249, 246, 240, 0.76)',
    glassBorder: 'rgba(255, 255, 255, 0.78)',
    glassTint: 'rgba(252, 249, 244, 0.48)',
    glassSheen: 'rgba(255, 255, 255, 0.34)',
    glassRimTop: 'rgba(255, 255, 255, 0.90)',
    glassRimBottom: 'rgba(207, 194, 172, 0.5)',
    bookShadow: 'rgba(60, 45, 30, 0.14)',
    dotColor: '#F9F6F0',
    hasPaperTexture: false,
    isDark: false,
  },
  'antique-book': {
    id: 'antique-book',
    nameBangla: 'প্রাচীন গ্রন্থ পাতা',
    canvas: '#F4E8D1',
    surface: '#EBDCBE',
    card: '#FAF2E2',
    borderSubtle: '#DDC8A2',
    borderStrong: '#C5A87B',
    textPrimary: '#22160D',
    textSecondary: '#543D2A',
    textMuted: '#846950',
    accentTerracotta: '#A33C16',
    accentSage: '#586A4C',
    accentSoftSage: '#E6D3B3',
    pillBg: 'rgba(244, 232, 209, 0.84)',
    glassBorder: 'rgba(255, 248, 235, 0.78)',
    glassTint: 'rgba(250, 242, 226, 0.52)',
    glassSheen: 'rgba(255, 252, 244, 0.32)',
    glassRimTop: 'rgba(255, 250, 240, 0.88)',
    glassRimBottom: 'rgba(197, 168, 123, 0.5)',
    bookShadow: 'rgba(38, 24, 12, 0.22)',
    dotColor: '#E6D3B3',
    hasPaperTexture: true,
    isDark: false,
  },
  terracotta: {
    id: 'terracotta',
    nameBangla: 'টেরাকোটা মৃত্তিকা',
    canvas: '#F4EBE5',
    surface: '#E8D9D0',
    card: '#FAF4EF',
    borderSubtle: '#DCBEB0',
    borderStrong: '#C8A492',
    textPrimary: '#341F16',
    textSecondary: '#6B493B',
    textMuted: '#9A7261',
    accentTerracotta: '#9B3E19',
    accentSage: '#475E4B',
    accentSoftSage: '#E2C9BE',
    pillBg: 'rgba(244, 235, 229, 0.76)',
    glassBorder: 'rgba(255, 255, 255, 0.75)',
    glassTint: 'rgba(250, 244, 239, 0.50)',
    glassSheen: 'rgba(255, 255, 255, 0.30)',
    glassRimTop: 'rgba(255, 255, 255, 0.86)',
    glassRimBottom: 'rgba(200, 164, 146, 0.5)',
    bookShadow: 'rgba(52, 31, 22, 0.16)',
    dotColor: '#F4EBE5',
    hasPaperTexture: false,
    isDark: false,
  },
  'deep-forest': {
    id: 'deep-forest',
    nameBangla: 'ডিপ ফরেস্ট চারকোল',
    canvas: '#121714',
    surface: '#1B231E',
    card: '#202923',
    borderSubtle: '#2C3A32',
    borderStrong: '#3D5045',
    textPrimary: '#EBF2EE',
    textSecondary: '#A8BCB1',
    textMuted: '#789083',
    accentTerracotta: '#E27249',
    accentSage: '#7BA180',
    accentSoftSage: '#27372D',
    pillBg: 'rgba(24, 32, 27, 0.78)',
    glassBorder: 'rgba(255, 255, 255, 0.22)',
    glassTint: 'rgba(24, 33, 27, 0.52)',
    glassSheen: 'rgba(255, 255, 255, 0.08)',
    glassRimTop: 'rgba(255, 255, 255, 0.24)',
    glassRimBottom: 'rgba(255, 255, 255, 0.06)',
    bookShadow: 'rgba(0, 0, 0, 0.55)',
    dotColor: '#121714',
    hasPaperTexture: false,
    isDark: true,
  },
};

export const READER_THEMES = THEMES;
