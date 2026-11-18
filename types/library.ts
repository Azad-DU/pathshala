import type { ThemeId } from '@/constants/Themes';

export type AppThemeMode = 'system' | 'light' | 'dark';
export type ThemeMode = 'auto' | ThemeId;

export type CoverStyle = 'terracotta' | 'sage' | 'charcoal';

export type LiteraryType =
  | 'uponnash'
  | 'golpo'
  | 'kishorepattho'
  | 'kobita'
  | 'gaan'
  | 'natok'
  | 'probondho'
  | 'vromonkahini'
  | 'onyanno';

export interface ChapterMeta {
  number: number;
  title: string;
  displayTitle: string;
  wordCount: number;
  readMinutes: number;
}

export interface Chapter {
  number: number;
  title: string;
  displayTitle?: string;
  wordCount?: number;
  readMinutes?: number;
  paragraphs: string[];
}

export interface BookMeta {
  id: string;
  writerId: string;
  title: string;
  author: string;
  literaryType: LiteraryType;
  genre: string;
  coverStyle: CoverStyle;
  totalChapters: number;
  totalReadMinutes: number;
  chapterTitles?: string[];
  chaptersMeta: ChapterMeta[];
  summary?: string;
}

export interface Book extends BookMeta {
  chapters: Chapter[];
}

export interface WriterProfile {
  id: string;
  name: string;
  era: string;
  birthDeath: string;
  bio: string;
  monogram: string;
  avatarColor: string;
  quoteSnippet: string;
  featuredBookIds: string[];
}

export interface ClassicQuote {
  quote: string;
  author: string;
  source: string;
  bookId?: string;
}

export interface ReaderSettings {
  themeId: ThemeId;
  fontSize: number;
  lineHeightMultiplier: number;
  fontFamily: 'serif' | 'sans-serif';
  textAlign: 'left' | 'justify';
  paragraphSpacing: 'compact' | 'normal' | 'relaxed';
  marginSize: 'narrow' | 'normal' | 'wide';
  firstLineIndent: boolean;
}

export interface Bookmark {
  id: string;
  bookId: string;
  bookTitle: string;
  chapterSequence: number;
  chapterTitle: string;
  paragraphIndex: number;
  quoteSnippet: string;
  createdAt: string;
}

export interface ReadingHistory {
  bookId: string;
  chapterSequence: number;
  paragraphIndex?: number;
  scrollProgress?: number;
  lastReadAt: string;
}
