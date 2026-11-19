import type { LiteraryType } from '@/types/library';
import { toBanglaNumber } from '@/constants/Typography';

export const CATEGORY_ORDER: LiteraryType[] = [
  'uponnash',
  'golpo',
  'kobita',
  'gaan',
  'natok',
  'probondho',
  'kishorepattho',
  'vromonkahini',
  'onyanno',
];

const UNIT_LABEL_MAP: Record<LiteraryType, string> = {
  uponnash: 'পরিচ্ছেদ',
  golpo: 'গল্প',
  kishorepattho: 'পরিচ্ছেদ',
  kobita: 'কবিতা',
  gaan: 'গান',
  natok: 'অংশ',
  probondho: 'প্রবন্ধ',
  vromonkahini: 'পরিচ্ছেদ',
  onyanno: 'অংশ',
};

export function getUnitLabel(literaryType: LiteraryType): string {
  return UNIT_LABEL_MAP[literaryType] ?? 'পরিচ্ছেদ';
}

export function formatReadDuration(totalMinutes: number): string {
  const safeMins = Math.max(1, Math.round(totalMinutes));
  if (safeMins < 60) return `≈ ${toBanglaNumber(safeMins)} মিনিট`;
  const hrs = Math.floor(safeMins / 60);
  const mins = safeMins % 60;
  return mins > 0
    ? `≈ ${toBanglaNumber(hrs)} ঘণ্টা ${toBanglaNumber(mins)} মি.`
    : `≈ ${toBanglaNumber(hrs)} ঘণ্টা`;
}

export function formatRelativeTimeBangla(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 2) return 'এইমাত্র';
  if (mins < 60) return `${toBanglaNumber(mins)} মিনিট আগে`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${toBanglaNumber(hrs)} ঘণ্টা আগে`;
  const days = Math.floor(hrs / 24);
  return `${toBanglaNumber(days)} দিন আগে`;
}

export function computeReadingProgressPct(
  chapterSequence: number,
  totalChapters: number
): number {
  if (totalChapters <= 0 || chapterSequence <= 0) return 0;
  return Math.min(100, Math.round((chapterSequence / totalChapters) * 100));
}
