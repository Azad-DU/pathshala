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
    case 'bc-anandamath':
      return require('./books/bc-anandamath.txt') as number;
    case 'bc-kapalkundala':
      return require('./books/bc-kapalkundala.txt') as number;
    case 'bc-durgeshnandini-1':
      return require('./books/bc-durgeshnandini-1.txt') as number;
    case 'bc-durgeshnandini-2':
      return require('./books/bc-durgeshnandini-2.txt') as number;
    case 'bc-bishabriksha':
      return require('./books/bc-bishabriksha.txt') as number;
    case 'bc-krishnakanter-will':
      return require('./books/bc-krishnakanter-will.txt') as number;
    case 'bc-devi-chaudhurani':
      return require('./books/bc-devi-chaudhurani.txt') as number;
    case 'bc-chandrashekhar':
      return require('./books/bc-chandrashekhar.txt') as number;
    case 'bc-mrinalini':
      return require('./books/bc-mrinalini.txt') as number;
    case 'bc-rajsingha':
      return require('./books/bc-rajsingha.txt') as number;
    case 'bc-sitaram':
      return require('./books/bc-sitaram.txt') as number;
    case 'bc-rajani':
      return require('./books/bc-rajani.txt') as number;
    case 'bc-indira':
      return require('./books/bc-indira.txt') as number;
    case 'bc-yugalanguriya':
      return require('./books/bc-yugalanguriya.txt') as number;
    case 'bc-radharani':
      return require('./books/bc-radharani.txt') as number;
    case 'bc-jiboni':
      return require('./books/bc-jiboni.txt') as number;
    default:
      return null;
  }
}

export async function loadBankimchandraBookChaptersAsync(
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
