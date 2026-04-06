/**
 * LuminaClean v5.0 - 23 Bash Security Validators
 * Enterprise-grade shell command validation (reconstructed from bashSecurity.ts pattern)
 * Philosophy: "When in doubt, ask the human" — fail-fast, block first
 */

export interface PermissionResult {
  behavior: 'allow' | 'ask' | 'block';
  message?: string;
  checkId?: number;
}

const ZSH_DANGEROUS_COMMANDS = new Set([
  'zmodload', 'emulate', 'sysopen', 'sysread', 'syswrite',
  'sysseek', 'zpty', 'ztcp', 'zsocket', 'mapfile',
  'zf_rm', 'zf_mv', 'zf_ln', 'zf_chmod', 'zf_chown',
  'zf_mkdir', 'zf_rmdir', 'zf_chgrp',
]);

// === THE 23 VALIDATORS (Fail-First Chain) ===

function validateIncompleteCommands(cmd: string): PermissionResult {
  if (/^\s*\t/.test(cmd)) return { behavior: 'ask', message: 'Command appears incomplete (tab-prefixed)', checkId: 1 };
  if (/^-/.test(cmd)) return { behavior: 'ask', message: 'Command starts with flags only', checkId: 2 };
  if (/^\s*(&&|\|\||;|>>?|<)/.test(cmd)) return { behavior: 'ask', message: 'Continuation line detected', checkId: 3 };
  return { behavior: 'allow' };
}

function validateJqSystem(cmd: string): PermissionResult {
  if (/\bsystem\s*\(/.test(cmd)) return { behavior: 'ask', message: 'jq system() executes arbitrary commands', checkId: 4 };
  return { behavior: 'allow' };
}

function validateJqFileArgs(cmd: string): PermissionResult {
  if (/(?:^|\s)(?:-f|--from-file|--rawfile)/.test(cmd)) return { behavior: 'ask', message: 'jq reads arbitrary files', checkId: 5 };
  return { behavior: 'allow' };
}

function validateObfuscatedFlags(cmd: string): PermissionResult {
  if (cmd.startsWith('-')) return { behavior: 'ask', message: 'Obfuscated flags detected', checkId: 6 };
  return { behavior: 'allow' };
}

function validateShellMetacharacters(cmd: string): PermissionResult {
  if (/["'][^"']*[;&|][^"']*["']/.test(cmd)) return { behavior: 'ask', message: 'Shell metacharacters in quoted args', checkId: 7 };
  return { behavior: 'allow' };
}

function validateDangerousVariables(cmd: string): PermissionResult {
  if (/[<>|]\s*\$[A-Za-z_]/.test(cmd)) return { behavior: 'ask', message: 'Variables in dangerous context', checkId: 8 };
  return { behavior: 'allow' };
}

function validateNewlines(cmd: string): PermissionResult {
  if (/(?<![\s\\])[\n\r]\s*\S/.test(cmd)) return { behavior: 'ask', message: 'Multiple commands on separate lines', checkId: 9 };
  return { behavior: 'allow' };
}

function validateCommandSubstitution(cmd: string): PermissionResult {
  if (/\$\(|`|\$\{/.test(cmd)) return { behavior: 'ask', message: 'Command substitution detected', checkId: 10 };
  return { behavior: 'allow' };
}

function validateInputRedirection(cmd: string): PermissionResult {
  if (/</.test(cmd) && !/^\s*#/.test(cmd)) return { behavior: 'ask', message: 'Input redirection could read sensitive files', checkId: 11 };
  return { behavior: 'allow' };
}

function validateOutputRedirection(cmd: string): PermissionResult {
  if (/>/.test(cmd) && !/^\s*#/.test(cmd)) return { behavior: 'ask', message: 'Output redirection could write to arbitrary files', checkId: 12 };
  return { behavior: 'allow' };
}

function validateIfsInjection(cmd: string): PermissionResult {
  if (/\bIFS=/.test(cmd)) return { behavior: 'ask', message: 'IFS modification detected', checkId: 13 };
  return { behavior: 'allow' };
}

function validateGitCommitSubstitution(cmd: string): PermissionResult {
  if (/git\s+commit.*-m.*\$\(/.test(cmd)) return { behavior: 'ask', message: 'Command substitution in git commit', checkId: 14 };
  return { behavior: 'allow' };
}

function validateProcEnvironAccess(cmd: string): PermissionResult {
  if (/\/proc\/\d+\/environ/.test(cmd)) return { behavior: 'ask', message: 'Reads process environment', checkId: 15 };
  return { behavior: 'allow' };
}

function validateMalformedTokens(cmd: string): PermissionResult {
  try {
    const tokens = cmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    if (tokens.length === 0 && cmd.trim().length > 0) return { behavior: 'ask', message: 'Malformed tokens detected', checkId: 16 };
    return { behavior: 'allow' };
  } catch { return { behavior: 'ask', message: 'Token parsing failed', checkId: 16 }; }
}

function validateBackslashWhitespace(cmd: string): PermissionResult {
  if (/\\[ \t]/.test(cmd)) return { behavior: 'ask', message: 'Escaped whitespace detected', checkId: 17 };
  return { behavior: 'allow' };
}

function validateBraceExpansion(cmd: string): PermissionResult {
  if (/\{[^}]*,[^}]*\}/.test(cmd)) return { behavior: 'ask', message: 'Brace expansion detected', checkId: 18 };
  return { behavior: 'allow' };
}

function validateControlCharacters(cmd: string): PermissionResult {
  if (/[\x00-\x1F]/.test(cmd)) return { behavior: 'ask', message: 'Control characters detected', checkId: 19 };
  return { behavior: 'allow' };
}

function validateUnicodeWhitespace(cmd: string): PermissionResult {
  if (/[\u00A0\u200B-\u200D\uFEFF]/.test(cmd)) return { behavior: 'ask', message: 'Unicode whitespace detected', checkId: 20 };
  return { behavior: 'allow' };
}

function validateMidWordHash(cmd: string): PermissionResult {
  if (/[a-zA-Z0-9]#[a-zA-Z]/.test(cmd)) return { behavior: 'ask', message: 'Mid-word hash comment detected', checkId: 21 };
  return { behavior: 'allow' };
}

function validateZshDangerousCommands(cmd: string): PermissionResult {
  const baseCommand = cmd.split(/\s+/)[0];
  if (ZSH_DANGEROUS_COMMANDS.has(baseCommand)) return { behavior: 'ask', message: `Zsh dangerous builtin: ${baseCommand}`, checkId: 22 };
  return { behavior: 'allow' };
}

function validateEscapedOperators(cmd: string): PermissionResult {
  if (/\\[|;&]/.test(cmd)) return { behavior: 'ask', message: 'Escaped shell operators', checkId: 23 };
  return { behavior: 'allow' };
}

function validateQuoteDesync(cmd: string): PermissionResult {
  const singleQuotes = (cmd.match(/'/g) || []).length;
  const doubleQuotes = (cmd.match(/"/g) || []).length;
  if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) return { behavior: 'ask', message: 'Quote desync detected', checkId: 24 };
  return { behavior: 'allow' };
}

function validateQuotedNewline(cmd: string): PermissionResult {
  if (/["'][^"']*[\n\r][^"']*["']/.test(cmd)) return { behavior: 'ask', message: 'Quoted newline detected', checkId: 25 };
  return { behavior: 'allow' };
}

// === MAIN VALIDATION CHAIN ===

const validators = [
  validateIncompleteCommands,
  validateJqSystem,
  validateJqFileArgs,
  validateObfuscatedFlags,
  validateShellMetacharacters,
  validateDangerousVariables,
  validateNewlines,
  validateCommandSubstitution,
  validateInputRedirection,
  validateOutputRedirection,
  validateIfsInjection,
  validateGitCommitSubstitution,
  validateProcEnvironAccess,
  validateMalformedTokens,
  validateBackslashWhitespace,
  validateBraceExpansion,
  validateControlCharacters,
  validateUnicodeWhitespace,
  validateMidWordHash,
  validateZshDangerousCommands,
  validateEscapedOperators,
  validateQuoteDesync,
  validateQuotedNewline,
];

export function validateBashCommand(cmd: string): PermissionResult {
  for (const validator of validators) {
    const result = validator(cmd);
    if (result.behavior !== 'allow') return result;
  }
  return { behavior: 'allow' };
}

// Batch validator
export function validateBatchCommands(commands: string[]): { valid: boolean; violations: PermissionResult[] } {
  const violations: PermissionResult[] = [];
  for (const cmd of commands) {
    const result = validateBashCommand(cmd);
    if (result.behavior !== 'allow') violations.push(result);
  }
  return { valid: violations.length === 0, violations };
}

export default { validateBashCommand, validateBatchCommands };
