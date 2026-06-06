/**
 * Search logic — ported from bihung-static/index.html.
 * Supports Devanagari and Latin queries with Levenshtein fuzzy matching.
 */
import Sanscript from './sanscript.js';

export function isDevanagari(s) { return /[\u0900-\u097F]/.test(s); }

// Expand under-specified nasal-geminate input: "onga" → "ongga"
// Doubles a consonant that follows n/m and precedes a vowel.
// Idempotent: "ongga" has no single consonant after n before a vowel → no change.
export function expandNasalGeminate(s) {
  return s.replace(/(?<=[nm])([gkdbptjcszfvrlh])(?=[aeiouwy])/gi, '$1$1');
}

export function toDevanagari(s) {
  try { return Sanscript?.t ? Sanscript.t(s, 'iast', 'devanagari', { syncope: false }) : s; }
  catch (e) { return s; }
}

// Common Bodo inflectional suffixes (longest first to avoid partial stripping)
const BODO_SUFFIXES = [
  'नाय', 'फोर', 'गोन', 'आव', 'नो', 'मुं', 'नि', 'मा', 'सो', 'आ',
];

function stripBodoSuffix(s) {
  if (Array.from(s).length <= 2) return null;
  for (const sfx of BODO_SUFFIXES) {
    if (s.endsWith(sfx)) {
      const root = s.slice(0, s.length - sfx.length);
      if (Array.from(root).length >= 2) return root;
    }
  }
  return null;
}

export function runSearch(query, allWords) {
  const raw = query.trim();
  const q   = raw.toLowerCase();
  const lqx = expandNasalGeminate(q);  // expanded variant; equals q when pattern absent
  const isDeva    = isDevanagari(raw);
  const devaQuery = isDeva ? raw : toDevanagari(raw);
  const results   = [];

  for (const w of allWords) {
    const wl = w.w.toLowerCase();
    let score = 0;
    if (isDeva) {
      const root = stripBodoSuffix(raw);
      if (w.w === raw)                         score = 100;
      else if (root && w.w === root)           score = 90;
      else if (w.w.startsWith(raw))            score = 60;
      else if (root && w.w.startsWith(root))   score = 55;
      else if (w.w.includes(raw))              score = 25;
      else {
        const bForms = (w.b ?? []).map(b => b.trim()).filter(Boolean);
        if      (bForms.some(b => b === raw))              score = 55;
        else if (root && bForms.some(b => b === root))     score = 50;
        else if (bForms.some(b => b.startsWith(raw)))      score = 30;
        else if (root && bForms.some(b => b.startsWith(root))) score = 25;
        else if (bForms.join(' ').includes(raw))           score = 10;
      }
    } else {
      const hasExp = lqx !== q;
      if (wl === q || (hasExp && wl === lqx))                                              score = 100;
      else if (wl.startsWith(q) || (hasExp && wl.startsWith(lqx)))                         score = 60;
      else if (wl.includes(q)  || (hasExp && wl.includes(lqx)))                            score = 25;
      else if ((w.e ?? []).join(' ').toLowerCase().includes(q))                             score = 15;
      else if ((w.b ?? []).join(' ').toLowerCase().includes(q))                             score = 8;
      if (!score && devaQuery !== raw && w.w.startsWith(devaQuery)) score = 55;
    }
    if (score) results.push({ w, score });
  }
  results.sort((a, b) => b.score - a.score || a.w.w.localeCompare(b.w.w, 'hi'));
  return results.slice(0, 60).map(r => r.w);
}

// ── Levenshtein (Unicode-aware) ────────────────────────────────────────────

const _FIRST_CHAR_MAP = [
  ['kh','K'],['k','K'], ['gh','G'],['g','G'], ['bh','B'],['b','B'],
  ['ph','P'],['p','P'], ['dh','D'],['d','D'], ['th','T'],['t','T'],
  ['jh','J'],['j','J'],
  ['a','A'],['o','A'],
  ['y','I'],['i','I'],['e','I'],
  ['w','W'],['v','W'],
];

function normalizeFirstChar(s) {
  for (const [prefix, canonical] of _FIRST_CHAR_MAP) {
    if (s.startsWith(prefix)) return canonical + s.slice(prefix.length);
  }
  return s;
}

function levenshtein(a, b, softFirst = false) {
  if (softFirst) { a = normalizeFirstChar(a); b = normalizeFirstChar(b); }
  const ac = Array.from(a), bc = Array.from(b);
  const m = ac.length, n = bc.length;
  if (Math.abs(m - n) > 4) return 99;

  // First-character operations cost half — words that share the same
  // opening sound are naturally ranked closer together.
  const FIRST = 0.5;

  // dp[i][j] = weighted edit distance between a[0..i-1] and b[0..j-1]
  const dp = Array.from({ length: m + 1 }, () => new Float32Array(n + 1));
  for (let i = 1; i <= m; i++) dp[i][0] = FIRST + (i - 1); // 0.5, 1.5, 2.5 …
  for (let j = 1; j <= n; j++) dp[0][j] = FIRST + (j - 1);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const subCost = ac[i-1] === bc[j-1] ? 0 : (i === 1 && j === 1 ? FIRST : 1);
      dp[i][j] = Math.min(
        dp[i-1][j-1] + subCost,
        dp[i-1][j]   + (i === 1 ? FIRST : 1),  // delete a[i-1]
        dp[i][j-1]   + (j === 1 ? FIRST : 1),  // insert b[j-1]
      );
    }
  }
  return dp[m][n];
}

export function translitSearch(suggestions, dictWords, wordByBodo, currentSearchIds) {
  if (!suggestions.length || !dictWords.length) return [];
  const seen   = new Set();
  const scored = [];

  const DEVA = /[\u0900-\u097F]/;

  // Returns all Bodo surface forms for a word entry:
  // — Devanagari words: the word itself + single-word b[] synonyms
  // — English words (glossaries): single-word b[] entries only
  function getBodoForms(w) {
    const forms = [];
    if (DEVA.test(w.w)) forms.push(w.w);
    for (const b of (w.b ?? [])) {
      const bt = b.trim();
      if (bt && DEVA.test(bt) && !bt.includes(' ') && bt !== w.w) forms.push(bt);
    }
    return forms;
  }

  // Expand a suggestion to itself + its suffix-stripped root (if any)
  function sugVariants(sug) {
    const root = stripBodoSuffix(sug);
    return root ? [sug, root] : [sug];
  }

  suggestions.forEach((sug, si) => {
    const beamW   = 1 - si * 0.15;
    const variants = sugVariants(sug);

    // Exact lookup — try raw form then suffix-stripped root
    let exactHit = false;
    for (const v of variants) {
      const exact = wordByBodo.get(v.normalize('NFC'));
      if (exact && !seen.has(exact.id)) {
        seen.add(exact.id);
        scored.push({ w: exact, score: beamW * 4, dist: 0 });
        exactHit = true;
        break;
      }
    }
    if (exactHit) return;

    // Fuzzy path — run for each variant (raw + stripped root)
    for (const v of variants) {
      const vNorm = normalizeFirstChar(v);
      const vLen  = Array.from(vNorm).length;
      const candidates = dictWords.filter(w => {
        const forms = getBodoForms(w);
        return forms.some(f => Math.abs(Array.from(normalizeFirstChar(f)).length - vLen) <= 2);
      });
      for (const w of candidates) {
        const forms = getBodoForms(w);
        const dist  = Math.min(...forms.map(f => levenshtein(v, f, true)));
        if (dist > 3) continue;
        if (seen.has(w.id)) {
          const ex = scored.find(r => r.w.id === w.id);
          if (ex) ex.score += beamW * (4 - dist) * 0.5;
          continue;
        }
        seen.add(w.id);
        scored.push({ w, score: beamW * (4 - dist), dist });
      }
    }
  });

  scored.sort((a, b) => a.dist - b.dist || b.score - a.score);
  return scored.filter(r => !currentSearchIds.has(r.w.id)).slice(0, 12).map(r => r.w);
}
