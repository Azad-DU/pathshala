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
    case 'sc-devdas':
      return require('./books/sc-devdas.txt') as number;
    case 'sc-srikanta-1':
      return require('./books/sc-srikanta-1.txt') as number;
    case 'sc-srikanta-2':
      return require('./books/sc-srikanta-2.txt') as number;
    case 'sc-srikanta-3':
      return require('./books/sc-srikanta-3.txt') as number;
    case 'sc-srikanta-4':
      return require('./books/sc-srikanta-4.txt') as number;
    case 'sc-pather-dabi':
      return require('./books/sc-pather-dabi.txt') as number;
    case 'sc-charitraheen':
      return require('./books/sc-charitraheen.txt') as number;
    case 'sc-grihadaha':
      return require('./books/sc-grihadaha.txt') as number;
    case 'sc-parineeta':
      return require('./books/sc-parineeta.txt') as number;
    case 'sc-datta':
      return require('./books/sc-datta.txt') as number;
    case 'sc-pallisamaj':
      return require('./books/sc-pallisamaj.txt') as number;
    case 'sc-denapaona':
      return require('./books/sc-denapaona.txt') as number;
    case 'sc-borodidi':
      return require('./books/sc-borodidi.txt') as number;
    case 'sc-birajbou':
      return require('./books/sc-birajbou.txt') as number;
    case 'sc-chandranath':
      return require('./books/sc-chandranath.txt') as number;
    case 'sc-baikunther-will':
      return require('./books/sc-baikunther-will.txt') as number;
    case 'sc-nishkriti':
      return require('./books/sc-nishkriti.txt') as number;
    case 'sc-panditmashai':
      return require('./books/sc-panditmashai.txt') as number;
    case 'sc-arakshaniya':
      return require('./books/sc-arakshaniya.txt') as number;
    case 'sc-bamuner-meye':
      return require('./books/sc-bamuner-meye.txt') as number;
    case 'sc-bipradas':
      return require('./books/sc-bipradas.txt') as number;
    case 'sc-nababidhan':
      return require('./books/sc-nababidhan.txt') as number;
    case 'sc-sesh-proshno':
      return require('./books/sc-sesh-proshno.txt') as number;
    case 'sc-shesher-porichoy':
      return require('./books/sc-shesher-porichoy.txt') as number;
    case 'sc-shuvoda-1':
      return require('./books/sc-shuvoda-1.txt') as number;
    case 'sc-shuvoda-2':
      return require('./books/sc-shuvoda-2.txt') as number;
    case 'sc-golposamagra':
      return require('./books/sc-golposamagra.txt') as number;
    case 'sc-bijoya':
      return require('./books/sc-bijoya.txt') as number;
    case 'sc-roma':
      return require('./books/sc-roma.txt') as number;
    case 'sc-shoroshi':
      return require('./books/sc-shoroshi.txt') as number;
    case 'sc-probondho':
      return require('./books/sc-probondho.txt') as number;
    case 'sc-aprokashito':
      return require('./books/sc-aprokashito.txt') as number;
    case 'sc-oggetto':
      return require('./books/sc-oggetto.txt') as number;
    default:
      return null;
  }
}

export async function loadSaratchandraBookChaptersAsync(
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
