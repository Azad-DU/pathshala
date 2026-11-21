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
    case 'pather-panchali':
      return require('./books/pather-panchali.txt') as number;
    case 'aparajita':
      return require('./books/aparajita.txt') as number;
    case 'aranyak':
      return require('./books/aranyak.txt') as number;
    case 'debjan':
      return require('./books/debjan.txt') as number;
    case 'adarsha-hindu-hotel':
      return require('./books/adarsha-hindu-hotel.txt') as number;
    case 'ichamati':
      return require('./books/ichamati.txt') as number;
    case 'bipiner-sangsar':
      return require('./books/bipiner-sangsar.txt') as number;
    case 'dristiprodip':
      return require('./books/dristiprodip.txt') as number;
    case 'dui-bari':
      return require('./books/dui-bari.txt') as number;
    case 'anubartan':
      return require('./books/anubartan.txt') as number;
    case 'kedar-raja':
      return require('./books/kedar-raja.txt') as number;
    case 'athai-jal':
      return require('./books/athai-jal.txt') as number;
    case 'dampati':
      return require('./books/dampati.txt') as number;
    case 'ashani-sanket':
      return require('./books/ashani-sanket.txt') as number;
    case 'meghmallar':
      return require('./books/meghmallar.txt') as number;
    case 'mouriful':
      return require('./books/mouriful.txt') as number;
    case 'jatrabadal':
      return require('./books/jatrabadal.txt') as number;
    case 'jonmo-o-mrittu':
      return require('./books/jonmo-o-mrittu.txt') as number;
    case 'kinnar-dal':
      return require('./books/kinnar-dal.txt') as number;
    case 'benigir-fulbari':
      return require('./books/benigir-fulbari.txt') as number;
    case 'nobagoto':
      return require('./books/nobagoto.txt') as number;
    case 'talnabami':
      return require('./books/talnabami.txt') as number;
    case 'upolkhondo':
      return require('./books/upolkhondo.txt') as number;
    case 'nilgonger-falmon-shaheb':
      return require('./books/nilgonger-falmon-shaheb.txt') as number;
    case 'khonovongur':
      return require('./books/khonovongur.txt') as number;
    case 'asadharan':
      return require('./books/asadharan.txt') as number;
    case 'mukhosh-o-mukhosri':
      return require('./books/mukhosh-o-mukhosri.txt') as number;
    case 'jotiringon':
      return require('./books/jotiringon.txt') as number;
    case 'kushol-pahari':
      return require('./books/kushol-pahari.txt') as number;
    case 'rup-holud':
      return require('./books/rup-holud.txt') as number;
    case 'anusandhan':
      return require('./books/anusandhan.txt') as number;
    case 'bidhu-master':
      return require('./books/bidhu-master.txt') as number;
    case 'chayachobi':
      return require('./books/chayachobi.txt') as number;
    case 'chander-pahar':
      return require('./books/chander-pahar.txt') as number;
    case 'moroner-donka-baje':
      return require('./books/moroner-donka-baje.txt') as number;
    case 'mismider-kabach':
      return require('./books/mismider-kabach.txt') as number;
    case 'hira-manik-jwole':
      return require('./books/hira-manik-jwole.txt') as number;
    case 'sundorbonesatbochor':
      return require('./books/sundorbonesatbochor.txt') as number;
    default:
      return null;
  }
}

export async function loadBibhutiBookChaptersAsync(
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
