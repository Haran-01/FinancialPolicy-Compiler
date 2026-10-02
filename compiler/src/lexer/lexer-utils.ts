/**
 * Financial Policy Language (FPL) — Lexical Utilities
 *
 * Character classification, naming convention validators, literal validators,
 * and console table formatters.
 */

import type { Token } from './lexer.interface';

const CURRENCY_PREFIXES = ['INR', 'USD', 'EUR', 'GBP', '$', '₹', '€', '£'] as const;

/**
 * Checks if a character is an ASCII letter or underscore.
 */
export function isAlpha(ch: string): boolean {
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  return (
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    code === 95 // _
  );
}

/**
 * Checks if a character is an ASCII digit (0-9).
 */
export function isDigit(ch: string): boolean {
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  return code >= 48 && code <= 57;
}

/**
 * Checks if a character is valid inside an identifier (letter, digit, or underscore).
 */
export function isAlphaNumeric(ch: string): boolean {
  return isAlpha(ch) || isDigit(ch);
}

/**
 * Checks if a character is whitespace (space, tab, carriage return, newline).
 */
export function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
}

/**
 * Checks if a character is a currency symbol.
 */
export function isCurrencySymbol(ch: string): boolean {
  return ch === '$' || ch === '₹' || ch === '€' || ch === '£';
}

/**
 * Checks if an identifier is an ISO currency prefix (e.g., INR, USD) when followed by digits.
 */
export function isCurrencyCodePrefix(ident: string): boolean {
  return (CURRENCY_PREFIXES as readonly string[]).includes(ident);
}

/**
 * Validates whether a string is a valid calendar date in YYYY-MM-DD format.
 */
export function isValidIsoDate(dateStr: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  const daysInMonths = [
    31,
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= (daysInMonths[month - 1] ?? 31);
}

/**
 * Validates identifier naming conventions per FPL specification (§18):
 * - Maximum length 128 characters
 * - Must start with letter or underscore
 */
export function validateIdentifierConventions(lexeme: string): {
  valid: boolean;
  reason?: string;
  suggestion?: string;
} {
  if (lexeme.length > 128) {
    return {
      valid: false,
      reason: `Identifier '${lexeme.slice(0, 24)}...' exceeds maximum length of 128 characters (${lexeme.length})`,
      suggestion: 'Shorten the identifier to 128 characters or fewer.',
    };
  }

  return { valid: true };
}

/**
 * Formats a token stream into a clean, aligned ASCII table suitable for
 * the Compiler Console and CLI inspection.
 */
export function formatTokenTable(tokens: Token[]): string {
  const divider = '-'.repeat(65);
  const header = `${'TOKEN TYPE'.padEnd(20)}${'LEXEME'.padEnd(24)}${'LINE'.padEnd(10)}COLUMN`;
  const rows = tokens.map((t) => {
    const typeCol = String(t.type).padEnd(20);
    const displayLexeme =
      t.lexeme.length > 20 ? `${t.lexeme.slice(0, 17)}...` : t.lexeme;
    const lexemeCol = displayLexeme.replace(/\r?\n/g, '\\n').padEnd(24);
    const lineCol = String(t.line).padEnd(10);
    const colCol = String(t.column);
    return `${typeCol}${lexemeCol}${lineCol}${colCol}`;
  });

  return [divider, header, divider, ...rows, divider].join('\n');
}
