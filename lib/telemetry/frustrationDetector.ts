/**
 * LuminaClean v5.0 - Frustration Detection (Lightweight Regex)
 * Replaces expensive LLM sentiment analysis with exact pattern matching
 * Pattern: reconstructed from userPromptKeywords.ts (23-word frustration lexicon)
 */

const FRUSTRATION_REGEX = /\b(wtf|wth|ffs|omfg|shit(ty|tiest)?|dumbass|horrible|awful|piss(ed|ing)? off|piece of (shit|crap|junk)|what the (fuck|hell)|fucking? (broken|useless|terrible|awful|horrible)|fuck you|screw (this|you)|so frustrating|this sucks|damn it)\b/i;

export interface FrustrationResult {
  detected: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  matchedWords: string[];
}

export function detectFrustration(userMessage: string): FrustrationResult {
  if (!FRUSTRATION_REGEX.test(userMessage)) {
    return { detected: false, severity: 'none', matchedWords: [] };
  }

  const matches = userMessage.match(FRUSTRATION_REGEX) || [];
  const severity = matches.length >= 3 ? 'severe' : matches.length >= 2 ? 'moderate' : 'mild';

  return { detected: true, severity, matchedWords: matches };
}

// Auto-escalation helper
export function shouldEscalateToHuman(result: FrustrationResult): boolean {
  return result.severity === 'severe' || result.matchedWords.length >= 3;
}

// Empathy tone suggestion
export function getEmpathyTone(severity: 'mild' | 'moderate' | 'severe'): string {
  switch (severity) {
    case 'mild': return 'acknowledge';
    case 'moderate': return 'empathize';
    case 'severe': return 'apologize_and_escalate';
  }
}

export default { detectFrustration, shouldEscalateToHuman, getEmpathyTone };
