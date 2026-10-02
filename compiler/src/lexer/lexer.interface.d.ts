/**
 * FPL Lexer Interface & Token Contracts
 *
 * Defines the complete data structures for Tokens, Literal Values, Positions,
 * Diagnostics, and the public ILexer contract.
 */
import { TokenType, TokenCategory } from './token-types';
import type { LexerDiagnosticSeverity } from './diagnostic-reporter';
export { TokenType, TokenCategory };
/** Source position of a token (line & column are 1-indexed, offset is 0-indexed). */
export interface TokenPosition {
    /** 1-indexed line number */
    line: number;
    /** 1-indexed column number */
    column: number;
    /** 0-indexed character offset from the start of the source */
    offset: number;
}
/** Structured Currency literal value */
export interface CurrencyLiteralValue {
    kind: 'Currency';
    currency: string;
    amount: number;
}
/** Structured Percentage literal value */
export interface PercentageLiteralValue {
    kind: 'Percentage';
    rate: number;
}
/** Structured Date literal value */
export interface DateLiteralValue {
    kind: 'Date';
    iso: string;
}
/** Union of all runtime literal values attached to tokens */
export type TokenLiteralValue = number | string | boolean | CurrencyLiteralValue | PercentageLiteralValue | DateLiteralValue | null;
/**
 * Every token produced by the FinPolicy Compiler Lexer.
 */
export interface Token {
    /** Token classification */
    type: TokenType;
    /** High-level token category for UI syntax highlighting */
    category: TokenCategory;
    /** Raw text of the token in the source code */
    lexeme: string;
    /** Alias for lexeme (backward compatibility) */
    value: string;
    /** Parsed literal value if applicable, otherwise null */
    literal: TokenLiteralValue;
    /** Starting source position */
    startPosition: TokenPosition;
    /** Ending source position */
    endPosition: TokenPosition;
    /** Alias for startPosition (backward compatibility) */
    position: TokenPosition;
    /** 1-indexed starting line number */
    line: number;
    /** 1-indexed starting column number */
    column: number;
    /** Logical or physical source file name */
    fileName: string;
    /** Character length of the lexeme */
    length: number;
}
/**
 * Detailed lexical diagnostic with source highlighting and suggested fix.
 */
export interface LexerDiagnostic {
    /** FPL lexical error code (e.g., FPL-L001) */
    code: string;
    /** Detailed diagnostic explanation */
    message: string;
    /** Severity level */
    severity: LexerDiagnosticSeverity;
    /** Source file name */
    file: string;
    /** 1-indexed starting line */
    line: number;
    /** 1-indexed starting column */
    column: number;
    /** 1-indexed ending line */
    endLine: number;
    /** 1-indexed ending column */
    endColumn: number;
    /** Starting TokenPosition */
    position: TokenPosition;
    /** Length of the offending lexeme */
    length: number;
    /** Offending source snippet */
    offendingLexeme: string;
    /** Full line of source code where the error occurred */
    sourceLine: string;
    /** Caret underline string (e.g. `    ^~~~`) */
    underline: string;
    /** Actionable recommendation to fix the error */
    suggestedFix: string;
}
/** Alias for backward compatibility */
export type LexerError = LexerDiagnostic;
/**
 * Complete output returned by `tokenize()` and `compileSource()`.
 */
export interface LexerResult {
    /** Stream of recognized tokens (including terminal EOF) */
    tokens: Token[];
    /** List of lexical diagnostics */
    diagnostics: LexerDiagnostic[];
    /** Alias for diagnostics */
    errors: LexerDiagnostic[];
    /** True if any ERROR-severity diagnostic was recorded */
    hasErrors: boolean;
    /** Formatted ASCII table of the token stream */
    formattedTable: string;
    /** Formatted diagnostic report */
    formattedDiagnostics: string;
}
/**
 * Public Lexer Contract
 */
export interface ILexer {
    /**
     * Scans the entire source string and returns the token stream and diagnostics.
     */
    tokenize(source?: string): LexerResult;
    /**
     * Returns and consumes the next token in the stream.
     */
    nextToken(): Token;
    /**
     * Alias for `nextToken()`.
     */
    next(): Token;
    /**
     * Peeks ahead in the token stream without advancing the token cursor.
     * @param lookahead - Number of tokens ahead (0 = current next token)
     */
    peek(lookahead?: number): Token;
    /**
     * Resets the lexer state to the beginning of the source buffer.
     */
    reset(): void;
    /**
     * Returns all recorded lexical diagnostics.
     */
    getDiagnostics(): LexerDiagnostic[];
    /**
     * Returns `true` when the EOF token has been reached.
     */
    isAtEnd(): boolean;
}
export interface IASTNode {
}
//# sourceMappingURL=lexer.interface.d.ts.map