const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

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
    .replace(/[-_.,;:!?'"“”‘’()[\]{}।]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Forgiving form: folds look-alike / phonetically-confusable Bangla letters. */
export function looseBangla(input: string): string {
  return normalizeBangla(input)
    .replace(/\u09BC/g, '')
    .replace(/\u09C0/g, '\u09BF')
    .replace(/\u09C2/g, '\u09C1')
    .replace(/[\u09B6\u09B7]/g, '\u09B8')
    .replace(/\u09A3/g, '\u09A8')
    .replace(/\u09CE/g, '\u09A4')
    .replace(/[\u0982\u0981]/g, '\u0982')
    .replace(/\u09CD/g, '');
}

export interface SearchDoc {
  strong: string;
  weak: string;
  strongLoose: string;
  weakLoose: string;
}

export interface ParsedBanglaQuery {
  tokens: string[];
  loose: string[];
}

export function buildDoc(strong: string[], weak: string[] = []): SearchDoc {
  const strongNorm = strong.map(normalizeBangla).filter(Boolean).join(' | ');
  const weakNorm = weak.map(normalizeBangla).filter(Boolean).join(' | ');
  return {
    strong: strongNorm,
    weak: weakNorm,
    strongLoose: looseBangla(strongNorm),
    weakLoose: looseBangla(weakNorm),
  };
}

export function parseQuery(raw: string): ParsedBanglaQuery {
  const norm = normalizeBangla(raw);
  if (!norm) return { tokens: [], loose: [] };
  const tokens = norm.split(' ').filter(Boolean);
  return { tokens, loose: tokens.map((t) => looseBangla(t)) };
}

/** Returns 0 when no match; higher is better. All tokens must match. */
export function scoreDoc(doc: SearchDoc, q: ParsedBanglaQuery): number {
  if (q.tokens.length === 0) return 1;
  let total = 0;
  for (let i = 0; i < q.tokens.length; i++) {
    const t = q.tokens[i];
    const l = q.loose[i];
    let s = 0;
    if (
      doc.strong.startsWith(t) ||
      doc.strong.includes(` ${t}`) ||
      doc.strong.includes(`| ${t}`)
    ) {
      s = 10;
    } else if (doc.strong.includes(t)) {
      s = 7;
    } else if (doc.weak.includes(t)) {
      s = 4;
    } else if (l && doc.strongLoose.includes(l)) {
      s = 5;
    } else if (l && doc.weakLoose.includes(l)) {
      s = 2;
    }
    if (s === 0) return 0;
    total += s;
  }
  return total;
}
