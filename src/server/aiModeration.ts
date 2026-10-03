import { GoogleGenAI } from '@google/genai';

export interface ModerationResult {
  approved: boolean;
  reason?: string;
}

// Built-in PG and family-friendly content words/patterns for heuristic fallback
const EXPLICIT_PATTERNS = [
  /\b(fuck|shit|bitch|asshole|bastard|cunt|dick|cock|pussy|whore|slut|nigger|faggot|retard)\b/i,
  /\b(porn|nsfw|xxx|sex|nude|naked|blowjob|handjob|hentai|erotic)\b/i,
  /\b(kill\s+yourself|die\s+in\s+a\s+fire|terrorist|bomb|nazi|hitler)\b/i,
  /\b(viagra|cialis|casino|crypto\s+pump|betting|slot\s+machine)\b/i,
];

function fallbackHeuristicReview(textToReview: string): ModerationResult {
  const lower = textToReview.toLowerCase();

  for (const pattern of EXPLICIT_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        approved: false,
        reason: 'Contains explicit, offensive, or inappropriate language. Submissions must be strictly PG-rated.',
      };
    }
  }

  // Check for meaningless junk / spam
  const cleanTokens = lower.replace(/[^a-z0-9]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (cleanTokens.length === 0) {
    return {
      approved: false,
      reason: 'Entry contains empty or invalid content.',
    };
  }

  return {
    approved: true,
  };
}

export async function reviewCommunitySubmission(
  type: 'coffee' | 'equipment' | 'cafe',
  item: any
): Promise<ModerationResult> {
  if (!item || typeof item !== 'object') {
    return { approved: false, reason: 'Invalid entry data provided.' };
  }

  // Compile all text from the item into a clear review payload
  const details: Record<string, any> = {
    type,
    name: item.name || '',
  };

  if (type === 'coffee') {
    details.roaster = item.roaster || item.secondary || '';
    details.origin = item.origin || {};
    details.variety = item.variety || '';
    details.process = item.process || '';
    details.roastLevel = item.roastLevel || '';
    details.tastingNotesSummary = item.tastingNotesSummary || item.generalTastingNotes || [];
    details.description = item.description || '';
    details.bagBadgeText = item.bagBadgeText || '';
    if (Array.isArray(item.tastingLogs)) {
      details.tastingLogsNotes = item.tastingLogs.map((l: any) => ({
        notes: l.notes,
        flavorTags: l.flavorTags,
      }));
    }
  } else if (type === 'equipment') {
    details.brand = item.brand || item.secondary || '';
    details.category = item.category || '';
    details.settingsNotes = item.settingsNotes || '';
    details.maintenanceNotes = item.maintenanceNotes || '';
    details.generalNotes = item.generalNotes || '';
  } else if (type === 'cafe') {
    details.city = item.city || item.secondary || '';
    details.country = item.country || '';
    details.address = item.address || '';
    details.favoriteDrink = item.favoriteDrink || '';
    details.vibes = item.vibes || [];
    details.notes = item.notes || '';
    details.roasterOrBeansServed = item.roasterOrBeansServed || '';
  }

  const payloadString = JSON.stringify(details, null, 2);

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are an automated content moderation reviewer for "Goodbeans", a family-friendly, PG-rated specialty coffee tracking and cataloging platform.
Your role is to review user-submitted community catalog entries for Coffee, Equipment, or Cafes before they are registered into the shared catalog.

Evaluation Criteria:
1. PG-Rated Standard: All submissions must be strictly PG-rated and family-friendly. Reject any explicit content, profanity, vulgarity, sexual references, slurs, hate speech, violence, drug references (other than standard coffee/caffeine), harassment, or foul language.
2. Coffee-Oriented Content: All submissions must be genuinely coffee-oriented (e.g. coffee roasts, beans, origins, tasting notes, coffee equipment, grinders, espresso machines, brewers, specialty cafes/coffee shops, and brew recipes). Reject submissions that are off-topic spam, advertisements for unrelated goods/services, or malicious/troll content.
3. Constructive Feedback: If rejected, you MUST provide a clear, polite explanation describing the specific policy issue to alert the user why their entry cannot be submitted (e.g., "Contains inappropriate or foul language", "Content is not coffee-oriented", "Contains vulgarity in the tasting notes").

Return ONLY a JSON object:
{
  "approved": boolean,
  "reason": string (If approved, return "Approved". If not approved, provide the concise reason for the user alert)
}`;

    const userPrompt = `Review this community catalog submission for "${type}":\n\n${payloadString}\n\nReturn JSON only.`;

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.0,
          },
        });

        let rawText = response.text || '';
        const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (fenceMatch) {
          rawText = fenceMatch[1];
        } else {
          const start = rawText.indexOf('{');
          const end = rawText.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            rawText = rawText.substring(start, end + 1);
          }
        }

        const parsed = JSON.parse(rawText.trim());
        if (parsed && typeof parsed.approved === 'boolean') {
          return {
            approved: parsed.approved,
            reason: parsed.reason || (parsed.approved ? undefined : 'Content did not meet community PG guidelines.'),
          };
        }
      } catch (err: any) {
        console.warn(`Moderation model ${model} attempt failed:`, err?.message?.slice(0, 100));
      }
    }
  }

  // Fallback heuristic review if Gemini API is unavailable
  return fallbackHeuristicReview(payloadString);
}
