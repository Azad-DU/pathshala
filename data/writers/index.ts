import type {
  Book,
  BookMeta,
  Chapter,
  ClassicQuote,
  LiteraryType,
  WriterProfile,
} from '@/types/library';
import {
  BIBHUTIBHUSHAN_BOOKS_META,
  BIBHUTIBHUSHAN_QUOTES,
  BIBHUTIBHUSHAN_WRITER,
} from './bibhutibhushan/catalog';
import { loadBibhutiBookChapters } from './bibhutibhushan/loader';
import {
  RABINDRANATH_BOOKS_META,
  RABINDRANATH_QUOTES,
  RABINDRANATH_WRITER,
} from './rabindranath/catalog';
import { loadRabindranathBookChaptersAsync } from './rabindranath/loader';

export interface WriterModule {
  writer: WriterProfile;
  books: BookMeta[];
  quotes: ClassicQuote[];
  loadChapters?: (bookId: string) => Chapter[];
  loadChaptersAsync?: (bookId: string) => Promise<Chapter[]>;
}

/**
 * To add another writer in the future:
 * 1. Create `data/writers/<writer-slug>/catalog.ts`, `loader.ts`, and `books/*`.
 * 2. Register the module in `WRITER_MODULES` below.
 * All tabs, filters, author pages, search, and the reader update automatically.
 */
const WRITER_MODULES: WriterModule[] = [
  {
    writer: BIBHUTIBHUSHAN_WRITER,
    books: BIBHUTIBHUSHAN_BOOKS_META,
    quotes: BIBHUTIBHUSHAN_QUOTES,
    loadChapters: loadBibhutiBookChapters,
  },
  {
    writer: RABINDRANATH_WRITER,
    books: RABINDRANATH_BOOKS_META,
    quotes: RABINDRANATH_QUOTES,
    loadChaptersAsync: loadRabindranathBookChaptersAsync,
  },
];

export const WRITERS: WriterProfile[] = WRITER_MODULES.map((m) => m.writer);

export const ALL_BOOKS_META: BookMeta[] = WRITER_MODULES.flatMap((m) => m.books);

export const ALL_QUOTES: ClassicQuote[] = WRITER_MODULES.flatMap((m) => m.quotes);

export const LITERARY_TYPE_INFO: Record<
  LiteraryType,
  { label: string; subtitle: string; icon: string }
> = {
  uponnash: {
    label: 'উপন্যাস',
    subtitle: 'কালজয়ী আখ্যান ও গ্রামীণ-নাগরিক জীবনচিত্র',
    icon: 'book-outline',
  },
  golpo: {
    label: 'গল্পগ্রন্থ',
    subtitle: 'সংকলিত ছোটগল্প ও জীবনবোধের আখ্যান',
    icon: 'document-text-outline',
  },
  kishorepattho: {
    label: 'কিশোর পাঠ্য',
    subtitle: 'অভিযান, রোমাঞ্চ ও প্রকৃতির বিস্ময়কথা',
    icon: 'compass-outline',
  },
  kobita: {
    label: 'কবিতা',
    subtitle: 'ছন্দ, সুর ও কাব্যসংকলন',
    icon: 'sparkles-outline',
  },
  gaan: {
    label: 'গান ও গীতবিতান',
    subtitle: 'সংগীত, স্বরলিপি ও গীতিকাব্য',
    icon: 'musical-notes-outline',
  },
  natok: {
    label: 'নাটক',
    subtitle: 'মঞ্চ, গীতিনাট্য ও নৃত্যনাট্য',
    icon: 'film-outline',
  },
  probondho: {
    label: 'প্রবন্ধ',
    subtitle: 'চিন্তা, দর্শন, ভ্রমণ ও গদ্য রচনা',
    icon: 'newspaper-outline',
  },
  vromonkahini: {
    label: 'ভ্রমণ কাহিনী',
    subtitle: 'দেশ-বিদেশ ও অরণ্য-পর্বতের দিনলিপি',
    icon: 'map-outline',
  },
  onyanno: {
    label: 'অন্যান্য রচনা',
    subtitle: 'পাঠ্যবই, শিক্ষা ও বিবিধ সংগ্রহ',
    icon: 'library-outline',
  },
};

export function getWriterById(writerId: string): WriterProfile | undefined {
  return WRITERS.find((w) => w.id === writerId);
}

export function getBookMetaById(bookId: string): BookMeta | undefined {
  return ALL_BOOKS_META.find((b) => b.id === bookId);
}

export function getBooksByWriter(writerId: string): BookMeta[] {
  return ALL_BOOKS_META.filter((b) => b.writerId === writerId);
}

export function loadBookById(bookId: string): Book | undefined {
  const meta = getBookMetaById(bookId);
  if (!meta) return undefined;
  const mod = WRITER_MODULES.find((m) => m.writer.id === meta.writerId);
  if (!mod?.loadChapters) return undefined;
  return {
    ...meta,
    chapters: mod.loadChapters(bookId),
  };
}

export async function loadBookByIdAsync(bookId: string): Promise<Book | undefined> {
  const meta = getBookMetaById(bookId);
  if (!meta) return undefined;
  const mod = WRITER_MODULES.find((m) => m.writer.id === meta.writerId);
  if (!mod) return undefined;
  if (mod.loadChapters) {
    return {
      ...meta,
      chapters: mod.loadChapters(bookId),
    };
  }
  if (mod.loadChaptersAsync) {
    const chapters = await mod.loadChaptersAsync(bookId);
    return {
      ...meta,
      chapters,
    };
  }
  return undefined;
}
