/**
 * Financial Policy Language (FPL) — Lexical Utilities
 *
 * Character classification, naming convention validators, literal validators,
 * and console table formatters.
 */
import type { Token } from './lexer.interface';
/**
 * Checks if a character is an ASCII letter or underscore.
 */
export declare function isAlpha(ch: string): boolean;
/**
 * Checks if a character is an ASCII digit (0-9).
 */
export declare function isDigit(ch: string): boolean;
/**
 * Checks if a character is valid inside an identifier (letter, digit, or underscore).
 */
export declare function isAlphaNumeric(ch: string): boolean;
/**
 * Checks if a character is whitespace (space, tab, carriage return, newline).
 */
export declare function isWhitespace(ch: string): boolean;
/**
 * Checks if a character is a currency symbol.
 */
export declare function isCurrencySymbol(ch: string): boolean;
/**
 * Checks if an identifier is an ISO currency prefix (e.g., INR, USD) when followed by digits.
 */
export declare function isCurrencyCodePrefix(ident: string): boolean;
/**
 * Validates whether a string is a valid calendar date in YYYY-MM-DD format.
 */
export declare function isValidIsoDate(dateStr: string): boolean;
/**
 * Validates identifier naming conventions per FPL specification (§18):
 * - Maximum length 128 characters
 * - Must start with letter or underscore
 */
export declare function validateIdentifierConventions(lexeme: string): {
    valid: boolean;
    reason?: string;
    suggestion?: string;
};
/**
 * Formats a token stream into a clean, aligned ASCII table suitable for
 * the Compiler Console and CLI inspection.
 */
export declare function formatTokenTable(tokens: Token[]): string;
//# sourceMappingURL=lexer-utils.d.ts.map