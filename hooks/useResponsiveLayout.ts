import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS, LAYOUT, SPACING } from '@/constants/design';

export interface ResponsiveLayout {
  width: number;
  height: number;
  isTablet: boolean;
  isDesktop: boolean;
  horizontalPadding: number;
  contentMaxWidth: number;
  detailMaxWidth: number;
  gridColumns: number;
  gridGap: number;
  gridCardWidth: number;
  shelfCardWidth: number;
  shelfGap: number;
  shelfCardStep: number;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isDesktop = width >= BREAKPOINTS.desktop;
    const isTablet = width >= BREAKPOINTS.tablet;

    const horizontalPadding = isDesktop
      ? SPACING.xxl
      : isTablet
        ? SPACING.xl
        : SPACING.base;

    const gridColumns =
      width >= 1040 ? 5 : width >= 820 ? 4 : width >= 580 ? 3 : 2;
    const gridGap = isTablet ? 18 : 14;

    const effectiveContentWidth = Math.min(width, LAYOUT.maxContentWidth);
    const innerWidth = Math.max(240, effectiveContentWidth - horizontalPadding * 2);
    const gridCardWidth = Math.floor(
      (innerWidth - gridGap * (gridColumns - 1)) / gridColumns
    );

    const shelfCardWidth = isDesktop ? 164 : isTablet ? 156 : 144;
    const shelfGap = isTablet ? 16 : 12;

    return {
      width,
      height,
      isTablet,
      isDesktop,
      horizontalPadding,
      contentMaxWidth: LAYOUT.maxContentWidth,
      detailMaxWidth: LAYOUT.maxDetailWidth,
      gridColumns,
      gridGap,
      gridCardWidth,
      shelfCardWidth,
      shelfGap,
      shelfCardStep: shelfCardWidth + shelfGap,
    };
  }, [width, height]);
}
