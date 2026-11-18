import type { ImageSourcePropType } from 'react-native';
import type { BookMeta } from '@/types/library';
import { RABINDRANATH_BOOKS_META } from '@/data/writers/rabindranath/catalog';

export interface BookCoverVisual {
  source: ImageSourcePropType;
  scale: number;
  translateX: number;
  translateY: number;
  tintColor: string;
  accentColor: string;
}

const WRITER_AVATARS: Record<string, ImageSourcePropType> = {
  bibhutibhushan: require('@/assets/images/writers/bibhutibhushan.jpg'),
  rabindranath: require('@/assets/images/writers/rabindranath.jpg'),
};

const COVER_VILLAGE: ImageSourcePropType = require('@/assets/images/covers/cover-village.jpg');
const COVER_VILLAGE_DUSK: ImageSourcePropType = require('@/assets/images/covers/cover-village-dusk.jpg');
const COVER_FOREST: ImageSourcePropType = require('@/assets/images/covers/cover-forest.jpg');
const COVER_FOREST_DAY: ImageSourcePropType = require('@/assets/images/covers/cover-forest-day.jpg');
const COVER_MOUNTAIN: ImageSourcePropType = require('@/assets/images/covers/cover-mountain.jpg');
const COVER_MOUNTAIN_STORM: ImageSourcePropType = require('@/assets/images/covers/cover-mountain-storm.jpg');
const COVER_RIVER: ImageSourcePropType = require('@/assets/images/covers/cover-river.jpg');
const COVER_RIVER_MIST: ImageSourcePropType = require('@/assets/images/covers/cover-river-mist.jpg');
const COVER_NIGHT: ImageSourcePropType = require('@/assets/images/covers/cover-night.jpg');
const COVER_LAMP_STUDY: ImageSourcePropType = require('@/assets/images/covers/cover-lamp-study.jpg');
const COVER_COURTYARD: ImageSourcePropType = require('@/assets/images/covers/cover-courtyard.jpg');
const COVER_COURTYARD_RAIN: ImageSourcePropType = require('@/assets/images/covers/cover-courtyard-rain.jpg');

const ALL_COVER_SOURCES: ImageSourcePropType[] = [
  COVER_VILLAGE,
  COVER_VILLAGE_DUSK,
  COVER_FOREST,
  COVER_FOREST_DAY,
  COVER_MOUNTAIN,
  COVER_MOUNTAIN_STORM,
  COVER_RIVER,
  COVER_RIVER_MIST,
  COVER_NIGHT,
  COVER_LAMP_STUDY,
  COVER_COURTYARD,
  COVER_COURTYARD_RAIN,
];

// Dedicated Rabindranath Tagore book cover illustrations (separate from Bibhutibhushan's covers)
const RT_JORASANKO: ImageSourcePropType = require('@/assets/images/covers/rabindranath/rt-jorasanko.jpg');
const RT_PADMA_BOAT: ImageSourcePropType = require('@/assets/images/covers/rabindranath/rt-padma-boat.jpg');
const RT_SANTINIKETAN: ImageSourcePropType = require('@/assets/images/covers/rabindranath/rt-santiniketan.jpg');
const RT_MUSIC_ROOM: ImageSourcePropType = require('@/assets/images/covers/rabindranath/rt-music-room.jpg');
const RT_AUTUMN_KASHFUL: ImageSourcePropType = require('@/assets/images/covers/rabindranath/rt-autumn-kashful.jpg');
const RT_MONSOON_BALCONY: ImageSourcePropType = require('@/assets/images/covers/rabindranath/rt-monsoon-balcony.jpg');
const RT_RED_OLEANDER: ImageSourcePropType = require('@/assets/images/covers/rabindranath/rt-red-oleander.jpg');
const RT_MUSTARD_BANYAN: ImageSourcePropType = require('@/assets/images/covers/rabindranath/rt-mustard-banyan.jpg');
const RT_CALCUTTA_NIGHT: ImageSourcePropType = require('@/assets/images/covers/rabindranath/rt-calcutta-night.jpg');

const RABINDRANATH_COVER_SOURCES: ImageSourcePropType[] = [
  RT_JORASANKO,
  RT_PADMA_BOAT,
  RT_SANTINIKETAN,
  RT_MUSIC_ROOM,
  RT_AUTUMN_KASHFUL,
  RT_MONSOON_BALCONY,
  RT_RED_OLEANDER,
  RT_MUSTARD_BANYAN,
  RT_CALCUTTA_NIGHT,
];

const RT_TINT_PRESETS = [
  'rgba(185, 77, 37, 0.08)',
  'rgba(58, 92, 62, 0.09)',
  'rgba(164, 114, 48, 0.08)',
  'rgba(28, 52, 68, 0.09)',
  'rgba(116, 46, 32, 0.08)',
  'rgba(32, 68, 56, 0.09)',
];

const RT_FOCAL_PRESETS: { scale: number; translateX: number; translateY: number }[] = [
  { scale: 1.0, translateX: 0, translateY: 0 },
  { scale: 1.04, translateX: -3, translateY: -2 },
  { scale: 1.04, translateX: 3, translateY: -2 },
  { scale: 1.05, translateX: -2, translateY: 3 },
  { scale: 1.03, translateX: 2, translateY: 2 },
  { scale: 1.05, translateX: 0, translateY: -3 },
];

const TINT_PRESETS = [
  'rgba(185, 77, 37, 0.16)',   // terracotta warmth
  'rgba(58, 92, 62, 0.18)',    // botanical sage
  'rgba(164, 114, 48, 0.16)',  // antique amber
  'rgba(28, 52, 68, 0.18)',    // twilight slate
  'rgba(116, 46, 32, 0.17)',   // baked clay
  'rgba(32, 68, 56, 0.17)',    // deep forest moss
];

const ACCENT_PRESETS: Record<string, string> = {
  terracotta: '#F6D6A8',
  sage: '#DCE8DA',
  charcoal: '#E8B88A',
};

const FOCAL_PRESETS: { scale: number; translateX: number; translateY: number }[] = [
  { scale: 1.0, translateX: 0, translateY: 0 },
  { scale: 1.12, translateX: -6, translateY: -4 },
  { scale: 1.1, translateX: 6, translateY: -6 },
  { scale: 1.14, translateX: -5, translateY: 5 },
  { scale: 1.08, translateX: 5, translateY: 4 },
  { scale: 1.16, translateX: 0, translateY: -6 },
  { scale: 1.12, translateX: 7, translateY: 0 },
  { scale: 1.1, translateX: -7, translateY: 2 },
];

/**
 * Curated per-book cover artwork mapping so adjacent books on any shelf
 * and across the browse grid remain visually distinct and thematically aligned.
 */
const BOOK_COVER_SOURCE_MAP: Record<string, ImageSourcePropType> = {
  // Uponnash (14)
  'pather-panchali': COVER_VILLAGE,
  aparajita: COVER_RIVER_MIST,
  aranyak: COVER_FOREST_DAY,
  debjan: COVER_NIGHT,
  'adarsha-hindu-hotel': COVER_COURTYARD,
  ichamati: COVER_RIVER,
  'bipiner-sangsar': COVER_VILLAGE_DUSK,
  dristiprodip: COVER_LAMP_STUDY,
  'dui-bari': COVER_COURTYARD_RAIN,
  anubartan: COVER_FOREST,
  'kedar-raja': COVER_MOUNTAIN,
  'athai-jal': COVER_RIVER_MIST,
  dampati: COVER_VILLAGE,
  'ashani-sanket': COVER_FOREST_DAY,

  // Golpo (19)
  meghmallar: COVER_COURTYARD_RAIN,
  mouriful: COVER_VILLAGE_DUSK,
  jatrabadal: COVER_RIVER_MIST,
  'jonmo-o-mrittu': COVER_LAMP_STUDY,
  'kinnar-dal': COVER_MOUNTAIN,
  'benigir-fulbari': COVER_COURTYARD,
  nobagoto: COVER_VILLAGE,
  talnabami: COVER_VILLAGE_DUSK,
  upolkhondo: COVER_RIVER,
  'nilgonger-falmon-shaheb': COVER_FOREST,
  khonovongur: COVER_NIGHT,
  asadharan: COVER_MOUNTAIN_STORM,
  'mukhosh-o-mukhosri': COVER_LAMP_STUDY,
  jotiringon: COVER_NIGHT,
  'kushol-pahari': COVER_MOUNTAIN,
  'rup-holud': COVER_VILLAGE_DUSK,
  anusandhan: COVER_FOREST_DAY,
  'bidhu-master': COVER_COURTYARD,
  chayachobi: COVER_COURTYARD_RAIN,

  // Kishorepattho (5)
  'chander-pahar': COVER_MOUNTAIN,
  'moroner-donka-baje': COVER_MOUNTAIN_STORM,
  'mismider-kabach': COVER_FOREST,
  'hira-manik-jwole': COVER_RIVER,
  sundorbonesatbochor: COVER_RIVER_MIST,
};

const RT_PREFERRED_COVER_INDEX: Record<string, number> = {
  'rt-gora': 0,
  'rt-ghre-baire': 6,
  'rt-chturngg': 5,
  'rt-char-adhjay': 8,
  'rt-chokher-bali': 3,
  'rt-dui-bon': 2,
  'rt-nouka-dubi': 1,
  'rt-prjaptir-nirbndh': 7,
  'rt-bu-thakuranir-hat': 4,
  'rt-shesher-kbita': 8,
  'rt-glpguchchh': 1,
  'rt-tinsnggi': 3,
  'rt-lipika': 4,
  'rt-gitanyjli': 3,
  'rt-sonar-tri': 1,
  'rt-blaka': 4,
  'rt-aakashprdip': 8,
  'rt-rktkrbi': 6,
  'rt-dakghr': 7,
  'rt-achlaytn': 2,
  'rt-jibnsmriti': 0,
  'rt-chhelebela': 0,
  'rt-aashrmer-rup-o-bikash': 2,
  'rt-puja': 3,
  'rt-prkriti': 7,
  'rt-prem': 5,
  'rt-sbdesh-gaan': 4,
};

const RT_GENRE_OFFSET: Record<string, number> = {
  uponnash: 0,
  golpo: 7,
  kobita: 2,
  gaan: 5,
  natok: 6,
  probondho: 3,
  onyanno: 1,
};

const RT_BOOK_COVER_INDEX: Record<string, number> = (() => {
  const poolSize = RABINDRANATH_COVER_SOURCES.length;
  const result: Record<string, number> = {};
  const genreQueues: Record<string, number[]> = {};
  const genreCursors: Record<string, number> = {};
  const globalRecent: number[] = [];

  for (const book of RABINDRANATH_BOOKS_META) {
    const genreKey = book.literaryType;
    const queue = (genreQueues[genreKey] ||= []);
    const cursor = genreCursors[genreKey] ?? RT_GENRE_OFFSET[genreKey] ?? 0;

    let chosen = -1;
    const preferred = RT_PREFERRED_COVER_INDEX[book.id];
    if (
      preferred !== undefined &&
      !queue.includes(preferred) &&
      !globalRecent.includes(preferred)
    ) {
      chosen = preferred;
    }

    if (chosen === -1) {
      for (let i = 0; i < poolSize; i++) {
        const candidate = (cursor + i) % poolSize;
        if (!queue.includes(candidate) && !globalRecent.includes(candidate)) {
          chosen = candidate;
          break;
        }
      }
    }

    if (chosen === -1) {
      for (let i = 0; i < poolSize; i++) {
        const candidate = (cursor + i) % poolSize;
        if (!queue.slice(-7).includes(candidate) && !globalRecent.includes(candidate)) {
          chosen = candidate;
          break;
        }
      }
    }

    if (chosen === -1) {
      chosen = cursor % poolSize;
    }

    result[book.id] = chosen;
    queue.push(chosen);
    if (queue.length > poolSize - 1) queue.shift();
    globalRecent.push(chosen);
    if (globalRecent.length > 2) globalRecent.shift();
    genreCursors[genreKey] = (chosen + 1) % poolSize;
  }

  return result;
})();

function hashBookId(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getWriterAvatarSource(
  writerId: string
): ImageSourcePropType | null {
  return WRITER_AVATARS[writerId] ?? null;
}

export function getBookCoverVisual(book: BookMeta): BookCoverVisual {
  const hash = hashBookId(book.id);
  const accentColor =
    ACCENT_PRESETS[book.coverStyle] || ACCENT_PRESETS.terracotta;

  if (book.writerId === 'rabindranath') {
    const rtIndex =
      RT_BOOK_COVER_INDEX[book.id] ??
      hash % RABINDRANATH_COVER_SOURCES.length;
    const focal = RT_FOCAL_PRESETS[hash % RT_FOCAL_PRESETS.length];
    const tintColor = RT_TINT_PRESETS[(hash >>> 3) % RT_TINT_PRESETS.length];
    return {
      source: RABINDRANATH_COVER_SOURCES[rtIndex],
      scale: focal.scale,
      translateX: focal.translateX,
      translateY: focal.translateY,
      tintColor,
      accentColor,
    };
  }

  const source =
    BOOK_COVER_SOURCE_MAP[book.id] ||
    ALL_COVER_SOURCES[hash % ALL_COVER_SOURCES.length];
  const focal = FOCAL_PRESETS[hash % FOCAL_PRESETS.length];
  const tintColor = TINT_PRESETS[(hash >>> 3) % TINT_PRESETS.length];

  return {
    source,
    scale: focal.scale,
    translateX: focal.translateX,
    translateY: focal.translateY,
    tintColor,
    accentColor,
  };
}

export function getBookCoverSource(book: BookMeta): ImageSourcePropType {
  return getBookCoverVisual(book).source;
}
