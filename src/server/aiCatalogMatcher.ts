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

// Helper: Normalize string for comparison (removes punctuation, extra whitespace, lowercase)
function normalizeStr(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance for fuzzy similarity
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function stringSimilarity(s1: string, s2: string): number {
  const n1 = normalizeStr(s1);
  const n2 = normalizeStr(s2);
  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1;
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(n1, n2);
  return Math.max(0, 1 - dist / maxLen);
}

// Heuristic rule-based fallback matcher
export function fallbackHeuristicMatch(
  itemType: 'coffee' | 'equipment' | 'cafe',
  candidateItem: any,
  catalogItems: any[]
): CatalogMatchResult {
  const candName = normalizeStr(candidateItem.name || '');
  const candSecondary = normalizeStr(
    candidateItem.roaster || candidateItem.brand || candidateItem.city || candidateItem.secondary || ''
  );

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
    const catName = normalizeStr(catItem.name || '');
    const catSecondary = normalizeStr(
      catItem.roaster || catItem.brand || catItem.city || catItem.secondary || ''
    );

    let score = 0;
    let reason = '';

    // 1. Exact match
    if (candName === catName && (!candSecondary || !catSecondary || candSecondary === catSecondary)) {
      score = 98;
      reason = `Exact name and brand match with registered catalog item "${catItem.name}".`;
    }
    // 2. Brand included in candidate name (e.g., candidate="Fellow Ode Gen 2", catalog="Ode Gen 2", brand="Fellow")
    else if (
      (catSecondary && candName.includes(catSecondary) && candName.includes(catName)) ||
      (candSecondary && candName.includes(candSecondary) && candName.includes(catName))
    ) {
      score = 92;
      reason = `Brand "${catItem.brand || catItem.roaster || candSecondary}" was detected inside your item name, matching catalog item "${catItem.name}".`;
    }
    // 3. Substring match where one title contains the other
    else if (
      (candName.length > 4 && catName.includes(candName)) ||
      (catName.length > 4 && candName.includes(catName))
    ) {
      const secondaryMatch = !candSecondary || !catSecondary || candSecondary === catSecondary || candSecondary.includes(catSecondary) || catSecondary.includes(candSecondary);
      if (secondaryMatch) {
        score = 88;
        reason = `High overlap with existing catalog entry "${catItem.name}"${catItem.roaster || catItem.brand || catItem.city ? ` by ${catItem.roaster || catItem.brand || catItem.city}` : ''}.`;
      }
    }
    // 4. Fuzzy Levenshtein match on name and secondary
    else {
      const nameSim = stringSimilarity(candName, catName);
      const secSim = candSecondary && catSecondary ? stringSimilarity(candSecondary, catSecondary) : 0.8;

      if (nameSim >= 0.82 && secSim >= 0.7) {
        score = Math.round(nameSim * 90);
        reason = `Close name similarity (${Math.round(nameSim * 100)}%) with catalog item "${catItem.name}".`;
      }
    }

    if (score >= 75) {
      matches.push({
        id: catItem.id,
        name: catItem.name,
        secondary: catItem.roaster || catItem.brand || catItem.city || catItem.secondary,
        matchScore: score,
        matchReason: reason,
        catalogItem: catItem,
      });
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);
  const topMatches = matches.slice(0, 4);

  if (topMatches.length > 0) {
    const top = topMatches[0];
    const explanation = `We found an existing community item "${top.name}"${top.secondary ? ` (${top.secondary})` : ''} that closely matches your submission.`;
    return {
      hasCloseMatch: true,
      confidence: top.matchScore >= 90 ? 'high' : 'medium',
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
 * AI-powered catalog matching using Gemini API with intelligent heuristic fallback.
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

  // If no Gemini API key, use heuristic matcher
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

    // Provide clean simplified catalog summary to keep prompt compact and fast
    const candidateSummary = {
      name: candidateItem.name || '',
      secondary: candidateItem.roaster || candidateItem.brand || candidateItem.city || candidateItem.secondary || '',
      originOrCategory: candidateItem.origin?.country || candidateItem.category || candidateItem.address || '',
      description: candidateItem.description || candidateItem.generalNotes || candidateItem.notes || '',
    };

    const catalogSummary = catalogItems.slice(0, 40).map((item) => ({
      id: item.id,
      name: item.name || '',
      secondary: item.roaster || item.brand || item.city || item.secondary || '',
      originOrCategory: item.origin?.country || item.category || item.address || '',
    }));

    const prompt = `You are a specialty coffee catalog curator for "Goodbeans".
A user is attempting to publish a new ${itemType} to the community catalog:
Candidate New Item:
${JSON.stringify(candidateSummary, null, 2)}

Current Registered Community Catalog (${itemType}s):
${JSON.stringify(catalogSummary, null, 2)}

Determine if the candidate item closely matches or is likely the same underlying item as any registered entry in the catalog.
Common matching scenarios include:
1. Brand or roaster is included in the item name (e.g. user entered "Fellow Ode Gen 2" when the catalog has "Ode Gen 2" by Fellow, or "Baratza Encore ESP" vs "Encore ESP" by Baratza).
2. Slight spelling/punctuation variations or alternate roastery names (e.g. "Onyx Tropical Weather" vs "Tropical Weather" by "Onyx Coffee Lab", or "Sey Chelbesa" vs "Chelbesa Washed" by "Sey Coffee").
3. Cafe title with city/street suffix (e.g. "Sey Coffee Brooklyn" vs "Sey Coffee" in Brooklyn, NY).

Respond ONLY with valid JSON in this format:
{
  "hasCloseMatch": boolean,
  "confidence": "high" | "medium" | "low",
  "explanation": "concise 1-2 sentence explanation of why this matches or differs",
  "matches": [
    {
      "id": "catalog item id",
      "name": "catalog item name",
      "secondary": "roaster, brand, or city",
      "matchScore": number between 70 and 100,
      "matchReason": "specific reason why this matches"
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
    console.warn('Gemini catalog matching failed, using heuristic fallback:', error);
    return fallbackHeuristicMatch(itemType, candidateItem, catalogItems);
  }
}
