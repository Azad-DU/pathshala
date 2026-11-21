export const FONTS = {
  serifRegular: 'NotoSerifBengali_400Regular',
  serifMedium: 'NotoSerifBengali_500Medium',
  serifBold: 'NotoSerifBengali_700Bold',
  // Use Noto Serif Bengali across UI/navigation controls as well, since Hind Siliguri's
  // Android metrics clip trailing Bengali glyphs/words on auto-sized navigation labels.
  sansRegular: 'NotoSerifBengali_400Regular',
  sansMedium: 'NotoSerifBengali_500Medium',
  sansBold: 'NotoSerifBengali_700Bold',
  readerSansRegular: 'HindSiliguri_400Regular',
  readerSansBold: 'HindSiliguri_700Bold',
} as const;

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaNumber(num: number | string): string {
  return String(num)
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0) - 48;
      return code >= 0 && code <= 9 ? BANGLA_DIGITS[code] : ch;
    })
    .join('');
}
