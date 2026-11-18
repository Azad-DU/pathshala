import React from 'react';
import { Text } from 'react-native';
import { FONTS } from '@/constants/Typography';

const HAS_DIGIT_RE = /[০-৯0-9]/;
const DIGIT_SPLIT_RE = /([০-৯0-9]+)/g;

const NOTO_REGULAR_STYLE = { fontFamily: FONTS.serifRegular };
const NOTO_BOLD_STYLE = { fontFamily: FONTS.serifBold };

/**
 * Splits text so every numeric run renders with Noto Serif Bengali,
 * avoiding Hind Siliguri's tall numeric glyph clipping on Android.
 */
export function renderWithNotoNumbers(
  text: string,
  bold = false
): React.ReactNode {
  if (!HAS_DIGIT_RE.test(text)) {
    return text;
  }
  const numStyle = bold ? NOTO_BOLD_STYLE : NOTO_REGULAR_STYLE;
  const parts = text.split(DIGIT_SPLIT_RE);
  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <Text key={idx} style={numStyle}>
        {part}
      </Text>
    ) : (
      part
    )
  );
}
