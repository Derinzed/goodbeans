import { GoogleGenAI } from '@google/genai';

export interface CatalogMatchResult {
  hasCloseMatch: boolean;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  matches: Array<{
    id: string;
    name: string;
    secondary?: string;
    matchScore: number; // 0 - 100
    matchReason: string;
    catalogItem?: any;
  }>;
}

// Normalize string (strip accents/diacritics, lowercase, remove punctuation)
export function cleanForMatching(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics: é -> e, ö -> o, etc.
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tokenize into words, discarding small generic stop words unless string is short
export function getTokens(str: string): string[] {
  const stopWords = new Set(['the', 'and', 'a', 'an', 'of', 'in', 'at', 'by', 'for', 'with', 'co', 'lab', 'roasters', 'roastery']);
  const raw = cleanForMatching(str).split(/\s+/).filter(Boolean);
  const filtered = raw.filter((t) => t.length > 1 && !stopWords.has(t));
  return filtered.length > 0 ? filtered : raw;
}

// Damerau-Levenshtein distance (handles insertions, deletions, substitutions, and transpositions)
export function damerauLevenshtein(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  const d: number[][] = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) d[i][0] = i;
  for (let j = 0; j <= len2; j++) d[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
      if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // transposition
      }
    }
  }

  return d[len1][len2];
}

export function wordSimilarity(w1: string, w2: string): number {
  if (w1 === w2) return 1.0;
  const maxLen = Math.max(w1.length, w2.length);
  if (maxLen === 0) return 1.0;
  const dist = damerauLevenshtein(w1, w2);

  // 1 letter typo (e.g. chelbasa vs chelbesa, commandante vs comandante)
  if (dist === 1 && maxLen >= 3) return 0.92;
  // 2 letter typo in longer words (e.g. wendlboe vs wendelboe)
  if (dist <= 2 && maxLen >= 6) return 0.85;

  // Substring prefix/suffix
  if (w1.length >= 3 && w2.length >= 3 && (w1.includes(w2) || w2.includes(w1))) {
    return 0.88;
  }

  return Math.max(0, 1 - dist / maxLen);
}

// Compare candidate tokens against catalog tokens with asymmetric matching
export function compareTokenSets(candTokens: string[], catTokens: string[]): {
  candCoverage: number;
  catCoverage: number;
  overallScore: number;
  typoNotes: string[];
  matchedWords: Array<{ candWord: string; catWord: string; sim: number }>;
} {
  if (candTokens.length === 0 || catTokens.length === 0) {
    return { candCoverage: 0, catCoverage: 0, overallScore: 0, typoNotes: [], matchedWords: [] };
  }

  let candMatchedSimTotal = 0;
  const typoNotes: string[] = [];
  const matchedWords: Array<{ candWord: string; catWord: string; sim: number }> = [];

  for (const c1 of candTokens) {
    let bestSim = 0;
    let bestCatWord = '';

    for (const c2 of catTokens) {
      const sim = wordSimilarity(c1, c2);
      if (sim > bestSim) {
        bestSim = sim;
        bestCatWord = c2;
      }
    }

    if (bestSim >= 0.75) {
      candMatchedSimTotal += bestSim;
      matchedWords.push({ candWord: c1, catWord: bestCatWord, sim: bestSim });
      if (bestSim < 1.0 && bestCatWord && c1 !== bestCatWord) {
        typoNotes.push(`'${c1}' ≈ '${bestCatWord}'`);
      }
    }
  }

  const candCoverage = candMatchedSimTotal / candTokens.length;
  const catCoverage = candMatchedSimTotal / catTokens.length;
  // Weight candidate coverage higher (e.g. user typed "Chelbesa" which is 100% of their input, matching "Chelbesa Washed")
  const overallScore = 0.65 * candCoverage + 0.35 * catCoverage;

  return { candCoverage, catCoverage, overallScore, typoNotes, matchedWords };
}

/**
 * Advanced multi-signal heuristic matcher that handles:
 * - Case differences
 * - Spelling mistakes / typos (1-3 letters off)
 * - Origin formatting differences (e.g. country/region reversed or embedded in title)
 * - Brand in title vs separated fields
 */
export function fallbackHeuristicMatch(
  itemType: 'coffee' | 'equipment' | 'cafe',
  candidateItem: any,
  catalogItems: any[]
): CatalogMatchResult {
  const candNameRaw = candidateItem.name || '';
  const candSecRaw = candidateItem.roaster || candidateItem.brand || candidateItem.city || candidateItem.secondary || '';
  const candOriginRaw = [
    candidateItem.origin?.country,
    candidateItem.origin?.region,
    candidateItem.origin?.farmOrStation,
    candidateItem.category,
    candidateItem.address,
    candidateItem.city,
  ].filter(Boolean).join(' ');

  const candName = cleanForMatching(candNameRaw);
  const candSec = cleanForMatching(candSecRaw);
  const candTokens = getTokens(candNameRaw);
  const candSecTokens = getTokens(candSecRaw);
  const candOriginTokens = getTokens(candOriginRaw);

  if (!candName) {
    return { hasCloseMatch: false, confidence: 'low', explanation: '', matches: [] };
  }

  const matches: Array<{
    id: string;
    name: string;
    secondary?: string;
    matchScore: number;
    matchReason: string;
    catalogItem?: any;
  }> = [];

  for (const catItem of catalogItems) {
    const catNameRaw = catItem.name || '';
    const catSecRaw = catItem.roaster || catItem.brand || catItem.city || catItem.secondary || '';
    const catOriginRaw = [
      catItem.origin?.country,
      catItem.origin?.region,
      catItem.origin?.farmOrStation,
      catItem.category,
      catItem.address,
      catItem.city,
    ].filter(Boolean).join(' ');

    const catName = cleanForMatching(catNameRaw);
    const catSec = cleanForMatching(catSecRaw);
    const catTokens = getTokens(catNameRaw);
    const catSecTokens = getTokens(catSecRaw);
    const catOriginTokens = getTokens(catOriginRaw);

    let score = 0;
    const reasons: string[] = [];

    // Signal 1: Name comparison
    const nameComp = compareTokenSets(candTokens, catTokens);
    const overallNameDist = damerauLevenshtein(candName, catName);
    const maxNameLen = Math.max(candName.length, catName.length);
    const stringSim = maxNameLen > 0 ? Math.max(0, 1 - overallNameDist / maxNameLen) : 0;

    // Signal 2: Secondary field (Roaster / Brand / City) comparison
    const secComp = compareTokenSets(candSecTokens, catSecTokens);
    const isSecFuzzyMatch = (candSec && catSec) ? (secComp.candCoverage >= 0.7 || wordSimilarity(candSec, catSec) >= 0.8) : true;

    // Signal 3: Brand detected in candidate title (e.g., "Fellow Ode" vs brand "Fellow", "commandante c40" vs brand "Comandante")
    let brandInTitleScore = 0;
    for (const bToken of catSecTokens) {
      if (bToken.length >= 3) {
        for (const cToken of candTokens) {
          const sim = wordSimilarity(cToken, bToken);
          if (sim >= 0.85) {
            brandInTitleScore = Math.max(brandInTitleScore, sim);
            if (sim < 1.0) reasons.push(`Brand variation in title: '${cToken}' ≈ '${bToken}'`);
          }
        }
      }
    }
    const brandInTitle = brandInTitleScore >= 0.85 || (catSec && catSec.length > 2 && candName.includes(catSec));

    // Signal 4: Origin overlap comparison (e.g. "Ethiopia, Yirgacheffe" vs "Ethiopia" or origin words inside title)
    const originComp = compareTokenSets(candOriginTokens, catOriginTokens);
    const originInTitle = candOriginTokens.some((t) => t.length > 3 && catName.includes(t)) ||
                          catOriginTokens.some((t) => t.length > 3 && candName.includes(t));

    // --- Scoring Rules ---

    // 1. Exact or Case-only Match
    if (candName === catName && (!candSec || !catSec || isSecFuzzyMatch)) {
      score = 98;
      reasons.push(candNameRaw !== catNameRaw ? 'Matching entry with case difference' : 'Exact match with catalog item');
    }
    // 2. High Candidate Coverage (e.g. candidate="Chelbesa", catalog="Chelbesa Washed" by Sey Coffee)
    else if (nameComp.candCoverage >= 0.85 && (isSecFuzzyMatch || brandInTitle)) {
      score = Math.round(90 + 8 * nameComp.overallScore);
      if (nameComp.typoNotes.length > 0) {
        reasons.push(`Spelling variation: ${nameComp.typoNotes.join(', ')}`);
      } else {
        reasons.push(`Core name match with catalog item "${catItem.name}"`);
      }
    }
    // 3. Brand in Title + Product Match (e.g. candidate="Fellow Ode", catalog="Ode Gen 2", or "commandante c40" vs "C40 MK4")
    else if (brandInTitle && (nameComp.candCoverage >= 0.5 || candName.includes(catName) || catName.includes(candName) || stringSim >= 0.6)) {
      score = 92;
      reasons.push(`Brand "${catItem.brand || catItem.roaster || catSecRaw}" detected in title matching "${catItem.name}"`);
    }
    // 4. Spelling typo with high edit similarity (e.g. "Chelbasa" vs "Chelbesa", "Cabalero" vs "Caballero")
    else if ((nameComp.typoNotes.length > 0 || stringSim >= 0.78) && nameComp.overallScore >= 0.55 && (isSecFuzzyMatch || !candSec)) {
      score = Math.round(Math.max(nameComp.candCoverage, stringSim) * 90);
      reasons.push(`Spelling variation: ${nameComp.typoNotes.length > 0 ? nameComp.typoNotes.join(', ') : `approx. ${Math.round(stringSim * 100)}% spelling similarity`}`);
    }
    // 5. Origin formatted differently + partial title match (e.g. "Washed Ethiopian Yirgacheffe" vs "Chelbesa Washed" with origin Ethiopia/Yirgacheffe)
    else if ((originInTitle || originComp.candCoverage >= 0.5) && (nameComp.candCoverage >= 0.4 || isSecFuzzyMatch)) {
      score = Math.round(75 + 15 * Math.max(originComp.candCoverage, nameComp.candCoverage));
      reasons.push(`Origin & roaster match with "${catItem.name}"`);
    }
    // 6. Token overlap & general similarity
    else if (nameComp.overallScore >= 0.5 && isSecFuzzyMatch) {
      score = Math.round(nameComp.overallScore * 85);
      reasons.push(`Similar catalog item (${Math.round(nameComp.overallScore * 100)}% match)`);
    }

    if (score >= 60) {
      matches.push({
        id: catItem.id,
        name: catItem.name,
        secondary: catItem.roaster || catItem.brand || catItem.city || catItem.secondary,
        matchScore: Math.min(100, score),
        matchReason: reasons.join('. ') || 'Similar catalog item found',
        catalogItem: catItem,
      });
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);
  const topMatches = matches.slice(0, 4);

  if (topMatches.length > 0) {
    const top = topMatches[0];
    const explanation = `We found a matching community item "${top.name}"${top.secondary ? ` (${top.secondary})` : ''} with ${top.matchScore}% similarity. ${top.matchReason}`;
    return {
      hasCloseMatch: true,
      confidence: top.matchScore >= 85 ? 'high' : 'medium',
      explanation,
      matches: topMatches,
    };
  }

  return {
    hasCloseMatch: false,
    confidence: 'low',
    explanation: 'No close community catalog match detected.',
    matches: [],
  };
}

/**
 * AI-powered catalog matching using Gemini API with intelligent typo, casing, and origin-tolerance.
 */
export async function matchItemAgainstCatalog(
  itemType: 'coffee' | 'equipment' | 'cafe',
  candidateItem: any,
  catalogItems: any[]
): Promise<CatalogMatchResult> {
  if (!catalogItems || catalogItems.length === 0 || !candidateItem?.name) {
    return {
      hasCloseMatch: false,
      confidence: 'low',
      explanation: '',
      matches: [],
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // If no Gemini API key, use advanced heuristic matcher
  if (!apiKey) {
    return fallbackHeuristicMatch(itemType, candidateItem, catalogItems);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const candidateSummary = {
      name: candidateItem.name || '',
      secondary: candidateItem.roaster || candidateItem.brand || candidateItem.city || candidateItem.secondary || '',
      origin: candidateItem.origin || candidateItem.category || candidateItem.address || '',
      description: candidateItem.description || candidateItem.generalNotes || candidateItem.notes || '',
    };

    const catalogSummary = catalogItems.slice(0, 40).map((item) => ({
      id: item.id,
      name: item.name || '',
      secondary: item.roaster || item.brand || item.city || item.secondary || '',
      origin: item.origin || item.category || item.address || '',
    }));

    const prompt = `You are an expert specialty coffee catalog deduplication assistant for "Goodbeans".
A user is attempting to register a new ${itemType} to the community catalog.
Your job is to AGGRESSIVELY flag and propose matching existing catalog items even if there are:
1. Spelling mistakes or typos (e.g. 1-3 letters off, like "Commandante" vs "Comandante", "Chelebesa" or "Chelbasa" vs "Chelbesa", "Cabalero" vs "Caballero", "AeroPres" vs "AeroPress").
2. Case differences and capitalization variations (e.g. "CHELBESA" vs "Chelbesa", "square mile" vs "Square Mile", "FELLOW ODE" vs "Fellow Ode").
3. Origin formatting differences (e.g. "Ethiopia, Yirgacheffe" vs "Yirgacheffe, Ethiopia", "Huila, Colombia" vs "Colombia - Huila", or origin country embedded in the coffee title).
4. Brand or roaster in title (e.g. "Fellow Ode Gen 2" vs "Ode Gen 2" by Fellow).
5. Punctuation, spacing, or abbreviations (e.g. "Sweet-Shop" vs "Sweetshop", "V60 02" vs "V60", "NY" vs "New York").

Candidate New Item:
${JSON.stringify(candidateSummary, null, 2)}

Current Registered Community Catalog (${itemType}s):
${JSON.stringify(catalogSummary, null, 2)}

Determine if the candidate item closely matches or represents the same real-world item as any registered entry in the catalog.
If a similar item is found (even with typos, different casing, or formatted differently), return hasCloseMatch: true.

Respond ONLY with valid raw JSON in this format:
{
  "hasCloseMatch": boolean,
  "confidence": "high" | "medium" | "low",
  "explanation": "concise 1-2 sentence explanation pointing out any spelling typo, case difference, or origin match",
  "matches": [
    {
      "id": "catalog item id",
      "name": "catalog item name",
      "secondary": "roaster, brand, or city",
      "matchScore": number between 60 and 100,
      "matchReason": "specific explanation of the match or typo (e.g. 'Spelling variation: Chelbasa ≈ Chelbesa', 'Case and brand match')"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return fallbackHeuristicMatch(itemType, candidateItem, catalogItems);
    }

    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.hasCloseMatch === 'boolean') {
      const enrichedMatches = Array.isArray(parsed.matches)
        ? parsed.matches
            .map((m: any) => {
              const fullItem = catalogItems.find((ci) => ci.id === m.id);
              return {
                id: m.id || fullItem?.id || '',
                name: m.name || fullItem?.name || '',
                secondary: m.secondary || fullItem?.roaster || fullItem?.brand || fullItem?.city || '',
                matchScore: typeof m.matchScore === 'number' ? m.matchScore : 85,
                matchReason: m.matchReason || 'Close community catalog match',
                catalogItem: fullItem || m,
              };
            })
            .filter((m: any) => m.id)
        : [];

      if (parsed.hasCloseMatch && enrichedMatches.length > 0) {
        return {
          hasCloseMatch: true,
          confidence: parsed.confidence || 'high',
          explanation: parsed.explanation || 'An existing registered catalog item closely matches your entry.',
          matches: enrichedMatches,
        };
      }
    }

    return fallbackHeuristicMatch(itemType, candidateItem, catalogItems);
  } catch (error) {
    console.warn('Gemini catalog matching failed, using enhanced heuristic fallback:', error);
    return fallbackHeuristicMatch(itemType, candidateItem, catalogItems);
  }
}
