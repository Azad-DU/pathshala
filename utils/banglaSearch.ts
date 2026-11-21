const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

const BN_CONSONANTS: Record<string, string> = {
  '\u0995': 'k', // ক
  '\u0996': 'k', // খ
  '\u0997': 'g', // গ
  '\u0998': 'g', // ঘ
  '\u0999': 'n', // ঙ
  '\u099A': 'c', // চ
  '\u099B': 'c', // ছ
  '\u099C': 'j', // জ
  '\u099D': 'j', // ঝ
  '\u099E': 'n', // ঞ
  '\u099F': 't', // ট
  '\u09A0': 't', // ঠ
  '\u09A1': 'd', // ড
  '\u09A2': 'd', // ঢ
  '\u09A3': 'n', // ণ
  '\u09A4': 't', // ত
  '\u09A5': 't', // থ
  '\u09A6': 'd', // দ
  '\u09A7': 'd', // ধ
  '\u09A8': 'n', // ন
  '\u09AA': 'p', // প
  '\u09AB': 'p', // ফ
  '\u09AC': 'b', // ব
  '\u09AD': 'b', // ভ
  '\u09AE': 'm', // ম
  '\u09AF': 'j', // য
  '\u09B0': 'r', // র
  '\u09B2': 'l', // ল
  '\u09B6': 's', // শ
  '\u09B7': 's', // ষ
  '\u09B8': 's', // স
  '\u09B9': 'h', // হ
  '\u09CE': 't', // ৎ
};

const BN_INDEP_VOWELS: Record<string, string> = {
  '\u0985': 'o', // অ
  '\u0986': 'a', // আ
  '\u0987': 'i', // ই
  '\u0988': 'i', // ঈ
  '\u0989': 'u', // উ
  '\u098A': 'u', // ঊ
  '\u098B': 'ri', // ঋ
  '\u098F': 'e', // এ
  '\u0990': 'oi', // ঐ
  '\u0993': 'o', // ও
  '\u0994': 'ou', // ঔ
};

const BN_MATRAS: Record<string, string> = {
  '\u09BE': 'a', // া
  '\u09BF': 'i', // ি
  '\u09C0': 'i', // ী
  '\u09C1': 'u', // ু
  '\u09C2': 'u', // ূ
  '\u09C3': 'ri', // ৃ
  '\u09C7': 'e', // ে
  '\u09C8': 'oi', // ৈ
  '\u09CB': 'o', // ো
  '\u09CC': 'ou', // ৌ
};

/** Canonical form: fixes Unicode variants so visually identical Bangla text compares equal. */
export function normalizeBangla(input: string): string {
  return input
    .normalize('NFC')
    .replace(/\u09DC/g, '\u09A1\u09BC')
    .replace(/\u09DD/g, '\u09A2\u09BC')
    .replace(/\u09DF/g, '\u09AF\u09BC')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/\u09C7\u09BE/g, '\u09CB')
    .replace(/\u09C7\u09D7/g, '\u09CC')
    .replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
    .toLowerCase()
    .replace(/[-–—_.,;:!?'"“”‘’()[\]{}|।/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Forgiving form: folds look-alike, nasal/chandrabindu, and phonetically confusable Bangla letters. */
export function looseBangla(input: string): string {
  return normalizeBangla(input)
    .replace(/\u09AF\u09BC/g, '\u09DF')
    .replace(/\u09BC/g, '')
    .replace(/\u0981/g, '')
    .replace(/\u09CD/g, '')
    .replace(/\u09C0/g, '\u09BF')
    .replace(/\u09C2/g, '\u09C1')
    .replace(/\u09C8/g, '\u09C7')
    .replace(/\u09CC/g, '\u09CB')
    .replace(/\u0988/g, '\u0987')
    .replace(/\u098A/g, '\u0989')
    .replace(/\u0990/g, '\u098F')
    .replace(/\u0994/g, '\u0993')
    .replace(/[\u09B6\u09B7]/g, '\u09B8')
    .replace(/\u09A3/g, '\u09A8')
    .replace(/\u09CE/g, '\u09A4')
    .replace(/\u0999/g, '\u0982')
    .replace(/(^| )\u09AF/g, '$1\u099C');
}

export function compactText(input: string): string {
  return input.replace(/[\s|]+/g, '');
}

/** Canonicalizes Latin / Banglish text into a simplified phonetic form matching banglaToLatinPhonetic. */
export function normalizeLatinPhonetic(input: string): string {
  return input
    .toLowerCase()
    .replace(/ng/g, 'n')
    .replace(/chh|ch/g, 'c')
    .replace(/sh/g, 's')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/jh/g, 'j')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/ph|f/g, 'p')
    .replace(/bh|v/g, 'b')
    .replace(/q/g, 'k')
    .replace(/z/g, 'j')
    .replace(/w/g, 'o')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/(.)\1+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Converts Bangla + Latin text to a uniform phonetic Latin string for cross-script search. */
export function banglaToLatinPhonetic(input: string): string {
  const norm = normalizeBangla(input);
  if (!norm) return '';

  const words = norm.split(' ');
  const outWords: string[] = [];

  for (const w of words) {
    if (!w) continue;
    let out = '';
    for (let i = 0; i < w.length; i++) {
      const ch = w[i];

      // Latin / ASCII pass-through (canonicalized afterwards)
      if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) {
        out += ch;
        continue;
      }

      // Skip chandrabindu & bisarga
      if (ch === '\u0981' || ch === '\u0983') continue;
      if (ch === '\u0982') {
        out += 'n';
        continue;
      }

      // Special conjuncts: ক্ষ, জ্ঞ
      if (w.startsWith('\u0995\u09CD\u09B7', i)) {
        out += 'k';
        i += 2;
        const next = w[i + 1];
        if (next && !BN_MATRAS[next] && next !== '\u09CD' && BN_CONSONANTS[next]) {
          out += 'o';
        }
        continue;
      }
      if (w.startsWith('\u099C\u09CD\u099E', i)) {
        out += 'g';
        i += 2;
        const next = w[i + 1];
        if (next && !BN_MATRAS[next] && next !== '\u09CD' && BN_CONSONANTS[next]) {
          out += 'o';
        }
        continue;
      }

      // Nukta pairs: ড়, ঢ়, য়
      if (i + 1 < w.length && w[i + 1] === '\u09BC') {
        if (ch === '\u09A1' || ch === '\u09A2') {
          out += 'r';
          i += 1;
          continue;
        }
        if (ch === '\u09AF') {
          out += 'y';
          i += 1;
          continue;
        }
      }

      if (BN_INDEP_VOWELS[ch]) {
        out += BN_INDEP_VOWELS[ch];
        continue;
      }

      if (BN_MATRAS[ch]) {
        out += BN_MATRAS[ch];
        continue;
      }

      if (ch === '\u09CD') {
        // Handle ্য (ya-fala) smoothly
        if (w[i + 1] === '\u09AF') {
          const after = w[i + 2];
          if (!after || !BN_MATRAS[after]) {
            out += 'e';
          }
          i += 1;
        }
        continue;
      }

      const cons = BN_CONSONANTS[ch];
      if (cons) {
        out += cons;
        const next = w[i + 1];
        if (
          next &&
          next !== '\u09CD' &&
          !BN_MATRAS[next] &&
          (BN_CONSONANTS[next] || next === '\u0982')
        ) {
          out += 'o';
        }
      }
    }
    if (out) outWords.push(normalizeLatinPhonetic(out));
  }

  return outWords.filter(Boolean).join(' ');
}

export function toConsonantSkeleton(phonetic: string): string {
  if (!phonetic) return '';
  return phonetic
    .split(' ')
    .map((w) => w.replace(/[aeiouy]/g, '').replace(/(.)\1+/g, '$1'))
    .filter(Boolean)
    .join(' ');
}

export interface SearchDoc {
  strong: string;
  weak: string;
  strongLoose: string;
  weakLoose: string;
  strongCompact: string;
  strongWords: string[];
  strongPhonetic?: string;
  weakPhonetic?: string;
  strongSkeleton?: string;
  weakSkeleton?: string;
  strongPhoneticWords?: string[];
}

export interface ParsedBanglaQuery {
  rawNorm: string;
  compact: string;
  tokens: string[];
  loose: string[];
  hasLatin: boolean;
  phoneticTokens: string[];
  skeletonTokens: string[];
}

function ensurePhoneticFields(doc: SearchDoc): void {
  if (doc.strongPhonetic !== undefined) return;
  const sp = banglaToLatinPhonetic(doc.strong);
  const wp = banglaToLatinPhonetic(doc.weak);
  doc.strongPhonetic = sp;
  doc.weakPhonetic = wp;
  doc.strongSkeleton = toConsonantSkeleton(sp);
  doc.weakSkeleton = toConsonantSkeleton(wp);
  doc.strongPhoneticWords = sp ? sp.split(' ').filter(Boolean) : [];
}

export function buildDoc(
  strong: string[],
  weak: string[] = [],
  includePhonetic = true
): SearchDoc {
  const strongNorm = strong.map(normalizeBangla).filter(Boolean).join(' | ');
  const weakNorm = weak.map(normalizeBangla).filter(Boolean).join(' | ');
  const strongLoose = looseBangla(strongNorm);
  const weakLoose = looseBangla(weakNorm);
  const strongCompact = compactText(strongLoose);
  const strongWords = strongLoose
    .split(/[\s|]+/)
    .filter((w) => w.length >= 2);

  const doc: SearchDoc = {
    strong: strongNorm,
    weak: weakNorm,
    strongLoose,
    weakLoose,
    strongCompact,
    strongWords,
  };

  if (includePhonetic) {
    ensurePhoneticFields(doc);
  }
  return doc;
}

export function parseQuery(raw: string): ParsedBanglaQuery {
  const rawNorm = normalizeBangla(raw);
  if (!rawNorm) {
    return {
      rawNorm: '',
      compact: '',
      tokens: [],
      loose: [],
      hasLatin: false,
      phoneticTokens: [],
      skeletonTokens: [],
    };
  }
  const tokens = rawNorm.split(' ').filter(Boolean);
  const loose = tokens.map((t) => looseBangla(t));
  const compact = compactText(loose.join(''));
  const hasLatin = /[a-z]/.test(rawNorm);
  const phoneticTokens = hasLatin
    ? tokens.map((t) => normalizeLatinPhonetic(t))
    : [];
  const skeletonTokens = hasLatin
    ? phoneticTokens.map((p) => toConsonantSkeleton(p))
    : [];

  return {
    rawNorm,
    compact,
    tokens,
    loose,
    hasLatin,
    phoneticTokens,
    skeletonTokens,
  };
}

function editDistanceLe1(a: string, b: string): boolean {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  if (a === b) return true;
  let i = 0;
  let j = 0;
  let diffs = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else {
      diffs++;
      if (diffs > 1) return false;
      if (la > lb) {
        i++;
      } else if (lb > la) {
        j++;
      } else {
        i++;
        j++;
      }
    }
  }
  if (i < la || j < lb) diffs++;
  return diffs <= 1;
}

function hasWordPrefix(text: string, token: string): boolean {
  return (
    text.startsWith(token) ||
    text.includes(` ${token}`) ||
    text.includes(`| ${token}`)
  );
}

function scoreSingleTokenStrong(
  doc: SearchDoc,
  q: ParsedBanglaQuery,
  idx: number
): number {
  const t = q.tokens[idx];
  const l = q.loose[idx];
  const ltCompact = compactText(l);

  if (hasWordPrefix(doc.strong, t)) return 16;
  if (doc.strong.includes(t)) return 11;
  if (l && hasWordPrefix(doc.strongLoose, l)) return 12;
  if (l && doc.strongLoose.includes(l)) return 8;
  if (ltCompact.length >= 3 && doc.strongCompact.includes(ltCompact)) return 7;

  if (q.hasLatin) {
    ensurePhoneticFields(doc);
    const pt = q.phoneticTokens[idx];
    const sk = q.skeletonTokens[idx];
    if (pt && doc.strongPhonetic) {
      if (hasWordPrefix(doc.strongPhonetic, pt)) return 13;
      if (doc.strongPhonetic.includes(pt)) return 9;
    }
    if (sk && sk.length >= 3 && doc.strongSkeleton) {
      if (hasWordPrefix(doc.strongSkeleton, sk)) return 9;
      if (doc.strongSkeleton.includes(sk)) return 6;
    }
    if (pt && pt.length >= 4 && doc.strongPhoneticWords) {
      for (const word of doc.strongPhoneticWords) {
        if (editDistanceLe1(word, pt)) return 5;
      }
    }
  } else if (l && l.length >= 4) {
    for (const word of doc.strongWords) {
      if (editDistanceLe1(word, l)) return 5;
    }
  }

  return 0;
}

function scoreSingleTokenWeak(
  doc: SearchDoc,
  q: ParsedBanglaQuery,
  idx: number
): number {
  const t = q.tokens[idx];
  const l = q.loose[idx];

  if (hasWordPrefix(doc.weak, t)) return 6;
  if (doc.weak.includes(t)) return 4;
  if (l && doc.weakLoose.includes(l)) return 3;

  if (q.hasLatin) {
    ensurePhoneticFields(doc);
    const pt = q.phoneticTokens[idx];
    const sk = q.skeletonTokens[idx];
    if (pt && doc.weakPhonetic && doc.weakPhonetic.includes(pt)) return 5;
    if (
      sk &&
      sk.length >= 3 &&
      doc.weakSkeleton &&
      doc.weakSkeleton.includes(sk)
    ) {
      return 3;
    }
  }

  return 0;
}

/** Returns 0 when no match; higher is better. All tokens must match across strong or weak fields. */
export function scoreDoc(doc: SearchDoc, q: ParsedBanglaQuery): number {
  if (q.tokens.length === 0) return 1;
  let total = 0;

  for (let i = 0; i < q.tokens.length; i++) {
    const strongScore = scoreSingleTokenStrong(doc, q, i);
    const s = strongScore > 0 ? strongScore : scoreSingleTokenWeak(doc, q, i);
    if (s === 0) return 0;
    total += s;
  }

  // Exact/phrase match bonuses
  if (doc.strong === q.rawNorm) {
    total += 30;
  } else if (doc.strong.startsWith(`${q.rawNorm} `) || doc.strong.startsWith(`${q.rawNorm} |`)) {
    total += 20;
  } else if (doc.strong.includes(q.rawNorm)) {
    total += 12;
  } else if (q.compact.length >= 3 && doc.strongCompact.includes(q.compact)) {
    total += 10;
  }

  return total;
}

/** Scores only against strong fields (e.g., book title or chapter title). */
export function scoreStrongOnly(doc: SearchDoc, q: ParsedBanglaQuery): number {
  if (q.tokens.length === 0) return 1;
  let total = 0;
  for (let i = 0; i < q.tokens.length; i++) {
    const s = scoreSingleTokenStrong(doc, q, i);
    if (s === 0) return 0;
    total += s;
  }
  if (doc.strong === q.rawNorm) total += 25;
  else if (doc.strong.includes(q.rawNorm)) total += 10;
  return total;
}

/** True if at least one token in the query matches the doc's strong title fields. */
export function hasStrongTokenHit(doc: SearchDoc, q: ParsedBanglaQuery): boolean {
  for (let i = 0; i < q.tokens.length; i++) {
    if (scoreSingleTokenStrong(doc, q, i) > 0) return true;
  }
  return false;
}

const GENERIC_CHAPTER_RE =
  /^(?:\d+|[০-৯]+|(?:প্রথম|দ্বিতীয়|তৃতীয়|চতুর্থ|পঞ্চম|ষষ্ঠ|সপ্তম|অষ্টম|নবম|দশম|একাদশ|দ্বাদশ)\s+(?:পরিচ্ছেদ|অধ্যায়|পর্ব|খণ্ড|অংশ)|(?:পরিচ্ছেদ|অধ্যায়|পর্ব|খণ্ড|অংশ)\s*[-:—]*\s*(?:\d+|[০-৯]+))$/u;

export function isGenericChapterTitle(title: string): boolean {
  const norm = normalizeBangla(title);
  if (!norm) return true;
  return GENERIC_CHAPTER_RE.test(norm);
}
