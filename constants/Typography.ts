export const FONTS = {
  serifRegular: 'NotoSerifBengali_400Regular',
  serifBold: 'NotoSerifBengali_700Bold',
  sansRegular: 'HindSiliguri_400Regular',
  sansMedium: 'HindSiliguri_500Medium',
  sansBold: 'HindSiliguri_700Bold',
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
