import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import type { Chapter } from '@/types/library';

interface BookContentFile {
  id: string;
  chapters: Chapter[];
}

const MAX_CACHE = 4;
const bookCache = new Map<string, Chapter[]>();

function getBookAssetModule(bookId: string): number | null {
  switch (bookId) {
    case 'kn-kobitasamagra':
      return require('./books/kn-kobitasamagra.txt') as number;
    case 'kn-geeti-swara':
      return require('./books/kn-geeti-swara.txt') as number;
    case 'kn-geeti-ka-nya':
      return require('./books/kn-geeti-ka-nya.txt') as number;
    case 'kn-geeti-ta-na':
      return require('./books/kn-geeti-ta-na.txt') as number;
    case 'kn-geeti-pa-ma':
      return require('./books/kn-geeti-pa-ma.txt') as number;
    case 'kn-geeti-ja-ha':
      return require('./books/kn-geeti-ja-ha.txt') as number;
    default:
      return null;
  }
}

export async function loadNazrulBookChaptersAsync(
  bookId: string
): Promise<Chapter[]> {
  const cached = bookCache.get(bookId);
  if (cached) {
    bookCache.delete(bookId);
    bookCache.set(bookId, cached);
    return cached;
  }

  const assetModule = getBookAssetModule(bookId);
  if (assetModule === null) return [];

  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (!uri) return [];

  let parsed: BookContentFile;
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    parsed = (await res.json()) as BookContentFile;
  } else {
    parsed = (await new File(uri).json()) as BookContentFile;
  }

  const chapters = parsed?.chapters ?? [];
  if (chapters.length > 0) {
    if (bookCache.size >= MAX_CACHE) {
      const oldestKey = bookCache.keys().next().value;
      if (oldestKey !== undefined) {
        bookCache.delete(oldestKey);
      }
    }
    bookCache.set(bookId, chapters);
  }
  return chapters;
}
