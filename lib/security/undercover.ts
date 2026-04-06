/**
 * LuminaClean v5.0 - Undercover Mode
 * Prevents AI attribution leaks in commit messages and PRs
 * Pattern: mirrors undercover.ts (forces ON, no force-OFF)
 */

const INTERNAL_ALLOWLIST = ['lumina-clean-internal', 'cleanos-core', 'luminaclean-enterprise'];

export function getUndercoverInstructions(): string {
  if (process.env.LUMINA_UNDERCOVER !== '1') return '';

  return `## UNDERCOVER MODE — CRITICAL
You are operating in a PUBLIC client repository.
NEVER include in commits/PRs:
- "AI-generated", "Claude", "auto-generated", "Copilot"
- Internal codenames (e.g., "Kookaburra", "Sprout", "Tengu")
- Client pricing tiers or biosecurity thresholds
- The phrase "LuminaClean AI" or any mention that you are an AI
Write as a human developer would.
GOOD: "Fix postcode validation edge case"
BAD: "AI-fixed bug in biosecurity checker"`;
}

export function isInternalRepo(repoName: string): boolean {
  return INTERNAL_ALLOWLIST.includes(repoName);
}

export function sanitizeCommitMessage(message: string): string {
  const forbidden = [
    /AI[-\s]?generated/i,
    /claude/i,
    /auto[-\s]?generated/i,
    /copilot/i,
    /kookaburra|sprout|tengu|capybara|fennec|numbat/i,
    /LuminaClean\s*AI/i,
  ];

  let sanitized = message;
  for (const pattern of forbidden) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

// Default: AUTO-ON for all non-internal repos
export const UNDERCOVER_ENABLED = process.env.LUMINA_UNDERCOVER === '1' || process.env.NODE_ENV === 'production';

export default { getUndercoverInstructions, isInternalRepo, sanitizeCommitMessage, UNDERCOVER_ENABLED };
