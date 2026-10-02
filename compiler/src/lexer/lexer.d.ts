/**
 * Financial Policy Language (FPL) — Lexical Analyzer
 *
 * Production-grade modular scanner for the FinPolicy Compiler.
 * Coordinates SourceBuffer, CharacterReader, TokenGenerator, and DiagnosticReporter.
 *
 * Features:
 * - Recognizes all 55+ FPL reserved keywords & 14 built-in data types
 * - Recognizes Identifiers (variables, policies, functions, constants, namespaces)
 * - Recognizes Literals: Integer, Decimal, Currency (`CURRENCY(...)`, `$100`, `INR 500`),
 *   Percentage (`12.5%`), Boolean (`TRUE`/`FALSE`), String (`"..."`), Date (`DATE("YYYY-MM-DD")`, `@2026-01-01`), Null
 * - Recognizes Arithmetic, Comparison, Assignment, Logical, Range (`..`), and Null-coalescing (`??`) operators
 * - Skips single-line (`//`) and multi-line (`/* ... * /`, including nested) comments while preserving line numbers
 * - Accumulates detailed diagnostics (`FPL-L001` through `FPL-L008`) without halting tokenization
 */
import type { ILexer, Token, LexerResult, LexerDiagnostic } from './lexer.interface';
export declare class Lexer implements ILexer {
    private buffer;
    private reader;
    private generator;
    private reporter;
    private cachedTokens;
    private tokenCursor;
    /**
     * Creates a new FPL Lexer instance.
     *
     * @param source   - Initial FPL source code string
     * @param fileName - Logical or physical file name (default: `"workspace.fpl"`)
     */
    constructor(source?: string, fileName?: string);
    /**
     * Tokenizes the FPL source code and returns a complete {@link LexerResult}
     * containing the token stream, diagnostics, and formatted console output.
     *
     * @param source   - Optional new source string to scan
     * @param fileName - Optional file name override
     */
    tokenize(source?: string, fileName?: string): LexerResult;
    /**
     * Returns and consumes the next token from the token stream.
     */
    nextToken(): Token;
    /**
     * Alias for {@link nextToken}.
     */
    next(): Token;
    /**
     * Peeks ahead in the token stream without advancing the token cursor.
     *
     * @param lookahead - Offset from the current token cursor (default: 0)
     */
    peek(lookahead?: number): Token;
    /**
     * Returns `true` when the token cursor has reached or passed the `EOF` token.
     */
    isAtEnd(): boolean;
    /**
     * Resets the lexer cursor and clears diagnostics so the source can be re-scanned.
     */
    reset(): void;
    /**
     * Returns all lexical diagnostics recorded during scanning.
     */
    getDiagnostics(): LexerDiagnostic[];
    /**
     * Skips all whitespace (`' '`, `'\t'`, `'\r'`, `'\n'`) and comments (`//` and `/* ... * /`).
     */
    private skipWhitespaceAndComments;
    /**
     * Scans a multi-line comment (`/* ... * /`), supporting nested block comments
     * and reporting an error if unterminated at EOF.
     */
    private scanMultiLineComment;
    /**
     * Dispatches to the appropriate token scanner based on the current character.
     */
    private scanNextToken;
    /**
     * Scans a string literal (`"..."` or `'...'`), handling escape sequences and
     * reporting unterminated strings (`FPL-L002`) or invalid escapes (`FPL-L005`).
     */
    private scanStringLiteral;
    /**
     * Scans currency literals prefixed with a currency symbol (`$`, `₹`, `€`, `£`).
     * Validates that a well-formed number follows (`FPL-L007`).
     */
    private scanSymbolCurrencyLiteral;
    /**
     * Scans `@YYYY-MM-DD` date literal syntax.
     */
    private scanAtDateLiteral;
    /**
     * Scans integers, decimals, percentages (`12.5%`), ISO dates (`2026-01-01`),
     * and detects malformed numbers (`12.34.56`, `12abc`, `150%` out-of-range, `12.%`).
     */
    private scanNumericLiteral;
    /**
     * Scans identifiers, reserved keywords, built-in type keywords, and structured
     * constructor literals (`CURRENCY(...)`, `DATE(...)`, `IS NOT`, `NOT IN`).
     */
    private scanIdentifierOrKeyword;
    /**
     * Scans `DATE("YYYY-MM-DD")` constructor literal.
     */
    private scanDateConstructorLiteral;
    /**
     * Scans `CURRENCY(150000.00)` constructor literal.
     */
    private scanCurrencyConstructorLiteral;
    /**
     * Attempts to scan an ISO currency code literal like `INR 5000.00` or `USD 250.50`
     * when an ISO code is immediately followed by whitespace and a number.
     */
    private tryScanCodePrefixedCurrency;
}
/**
 * High-level convenience API to scan FPL source code and return the token stream,
 * diagnostics, and pretty-printed console table.
 *
 * @param source   - Raw FPL source code
 * @param fileName - Optional source file name
 */
export declare function compileSource(source: string, fileName?: string): LexerResult;
/**
 * Convenience helper to tokenize an FPL source string directly.
 *
 * @param source   - Raw FPL source code
 * @param fileName - Optional source file name
 */
export declare function tokenize(source: string, fileName?: string): LexerResult;
//# sourceMappingURL=lexer.d.ts.map