import type { Chapter } from '@/types/library';

interface BookContentFile {
  id: string;
  chapters: Chapter[];
}

const MAX_CACHE = 3;
const bookCache = new Map<string, Chapter[]>();

function loadRawChapters(bookId: string): Chapter[] {
  switch (bookId) {
    case 'pather-panchali':
      return (require('./books/pather-panchali.json') as BookContentFile).chapters;
    case 'aparajita':
      return (require('./books/aparajita.json') as BookContentFile).chapters;
    case 'aranyak':
      return (require('./books/aranyak.json') as BookContentFile).chapters;
    case 'debjan':
      return (require('./books/debjan.json') as BookContentFile).chapters;
    case 'adarsha-hindu-hotel':
      return (require('./books/adarsha-hindu-hotel.json') as BookContentFile).chapters;
    case 'ichamati':
      return (require('./books/ichamati.json') as BookContentFile).chapters;
    case 'bipiner-sangsar':
      return (require('./books/bipiner-sangsar.json') as BookContentFile).chapters;
    case 'dristiprodip':
      return (require('./books/dristiprodip.json') as BookContentFile).chapters;
    case 'dui-bari':
      return (require('./books/dui-bari.json') as BookContentFile).chapters;
    case 'anubartan':
      return (require('./books/anubartan.json') as BookContentFile).chapters;
    case 'kedar-raja':
      return (require('./books/kedar-raja.json') as BookContentFile).chapters;
    case 'athai-jal':
      return (require('./books/athai-jal.json') as BookContentFile).chapters;
    case 'dampati':
      return (require('./books/dampati.json') as BookContentFile).chapters;
    case 'ashani-sanket':
      return (require('./books/ashani-sanket.json') as BookContentFile).chapters;
    case 'meghmallar':
      return (require('./books/meghmallar.json') as BookContentFile).chapters;
    case 'mouriful':
      return (require('./books/mouriful.json') as BookContentFile).chapters;
    case 'jatrabadal':
      return (require('./books/jatrabadal.json') as BookContentFile).chapters;
    case 'jonmo-o-mrittu':
      return (require('./books/jonmo-o-mrittu.json') as BookContentFile).chapters;
    case 'kinnar-dal':
      return (require('./books/kinnar-dal.json') as BookContentFile).chapters;
    case 'benigir-fulbari':
      return (require('./books/benigir-fulbari.json') as BookContentFile).chapters;
    case 'nobagoto':
      return (require('./books/nobagoto.json') as BookContentFile).chapters;
    case 'talnabami':
      return (require('./books/talnabami.json') as BookContentFile).chapters;
    case 'upolkhondo':
      return (require('./books/upolkhondo.json') as BookContentFile).chapters;
    case 'nilgonger-falmon-shaheb':
      return (require('./books/nilgonger-falmon-shaheb.json') as BookContentFile).chapters;
    case 'khonovongur':
      return (require('./books/khonovongur.json') as BookContentFile).chapters;
    case 'asadharan':
      return (require('./books/asadharan.json') as BookContentFile).chapters;
    case 'mukhosh-o-mukhosri':
      return (require('./books/mukhosh-o-mukhosri.json') as BookContentFile).chapters;
    case 'jotiringon':
      return (require('./books/jotiringon.json') as BookContentFile).chapters;
    case 'kushol-pahari':
      return (require('./books/kushol-pahari.json') as BookContentFile).chapters;
    case 'rup-holud':
      return (require('./books/rup-holud.json') as BookContentFile).chapters;
    case 'anusandhan':
      return (require('./books/anusandhan.json') as BookContentFile).chapters;
    case 'bidhu-master':
      return (require('./books/bidhu-master.json') as BookContentFile).chapters;
    case 'chayachobi':
      return (require('./books/chayachobi.json') as BookContentFile).chapters;
    case 'chander-pahar':
      return (require('./books/chander-pahar.json') as BookContentFile).chapters;
    case 'moroner-donka-baje':
      return (require('./books/moroner-donka-baje.json') as BookContentFile).chapters;
    case 'mismider-kabach':
      return (require('./books/mismider-kabach.json') as BookContentFile).chapters;
    case 'hira-manik-jwole':
      return (require('./books/hira-manik-jwole.json') as BookContentFile).chapters;
    case 'sundorbonesatbochor':
      return (require('./books/sundorbonesatbochor.json') as BookContentFile).chapters;
    default:
      return [];
  }
}

export function loadBibhutiBookChapters(bookId: string): Chapter[] {
  const cached = bookCache.get(bookId);
  if (cached) {
    bookCache.delete(bookId);
    bookCache.set(bookId, cached);
    return cached;
  }
  const chapters = loadRawChapters(bookId);
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
