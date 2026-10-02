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

import { SourceBuffer } from './source-buffer';
import { CharacterReader } from './character-reader';
import { TokenGenerator } from './token-generator';
import { DiagnosticReporter } from './diagnostic-reporter';
import {
  TokenType,
  RESERVED_KEYWORDS,
  TYPE_KEYWORDS,
  MULTI_CHAR_OPERATORS,
  SINGLE_CHAR_OPERATORS,
  DELIMITERS,
} from './token-types';
import {
  isAlpha,
  isDigit,
  isAlphaNumeric,
  isWhitespace,
  isCurrencySymbol,
  isCurrencyCodePrefix,
  isValidIsoDate,
  validateIdentifierConventions,
  formatTokenTable,
} from './lexer-utils';
import type {
  ILexer,
  Token,
  TokenPosition,
  LexerResult,
  LexerDiagnostic,
} from './lexer.interface';

export class Lexer implements ILexer {
  private buffer: SourceBuffer;
  private reader: CharacterReader;
  private generator: TokenGenerator;
  private reporter: DiagnosticReporter;

  private cachedTokens: Token[] | null = null;
  private tokenCursor = 0;

  /**
   * Creates a new FPL Lexer instance.
   *
   * @param source   - Initial FPL source code string
   * @param fileName - Logical or physical file name (default: `"workspace.fpl"`)
   */
  constructor(source = '', fileName = 'workspace.fpl') {
    this.buffer = new SourceBuffer(source, fileName);
    this.reader = new CharacterReader(this.buffer);
    this.generator = new TokenGenerator(fileName);
    this.reporter = new DiagnosticReporter(this.buffer);
  }

  /**
   * Tokenizes the FPL source code and returns a complete {@link LexerResult}
   * containing the token stream, diagnostics, and formatted console output.
   *
   * @param source   - Optional new source string to scan
   * @param fileName - Optional file name override
   */
  public tokenize(source?: string, fileName?: string): LexerResult {
    if (source !== undefined) {
      const targetFile = fileName ?? this.buffer.getFileName();
      this.buffer = new SourceBuffer(source, targetFile);
      this.reader = new CharacterReader(this.buffer);
      this.generator = new TokenGenerator(targetFile);
      this.reporter = new DiagnosticReporter(this.buffer);
    } else {
      this.reset();
    }

    const tokens: Token[] = [];

    while (!this.reader.isAtEnd()) {
      this.skipWhitespaceAndComments();
      if (this.reader.isAtEnd()) break;

      const token = this.scanNextToken();
      if (token) {
        tokens.push(token);
      }
    }

    const eofToken = this.generator.createEOF(this.reader.getPosition());
    tokens.push(eofToken);

    this.cachedTokens = tokens;
    this.tokenCursor = 0;

    const diagnostics = this.reporter.getDiagnostics();

    return {
      tokens,
      diagnostics,
      errors: diagnostics,
      hasErrors: this.reporter.hasErrors(),
      formattedTable: formatTokenTable(tokens),
      formattedDiagnostics: this.reporter.formatDiagnostics(),
    };
  }

  /**
   * Returns and consumes the next token from the token stream.
   */
  public nextToken(): Token {
    if (!this.cachedTokens) {
      this.tokenize();
    }
    const tokens = this.cachedTokens!;
    if (this.tokenCursor >= tokens.length) {
      return tokens[tokens.length - 1]!;
    }
    const token = tokens[this.tokenCursor]!;
    this.tokenCursor += 1;
    return token;
  }

  /**
   * Alias for {@link nextToken}.
   */
  public next(): Token {
    return this.nextToken();
  }

  /**
   * Peeks ahead in the token stream without advancing the token cursor.
   *
   * @param lookahead - Offset from the current token cursor (default: 0)
   */
  public peek(lookahead = 0): Token {
    if (!this.cachedTokens) {
      this.tokenize();
    }
    const tokens = this.cachedTokens!;
    const targetIndex = Math.min(this.tokenCursor + lookahead, tokens.length - 1);
    return tokens[targetIndex]!;
  }

  /**
   * Returns `true` when the token cursor has reached or passed the `EOF` token.
   */
  public isAtEnd(): boolean {
    if (!this.cachedTokens) {
      return this.reader.isAtEnd();
    }
    const current = this.cachedTokens[this.tokenCursor];
    return !current || current.type === TokenType.EOF;
  }

  /**
   * Resets the lexer cursor and clears diagnostics so the source can be re-scanned.
   */
  public reset(): void {
    this.reader.reset();
    this.reporter.clear();
    this.cachedTokens = null;
    this.tokenCursor = 0;
  }

  /**
   * Returns all lexical diagnostics recorded during scanning.
   */
  public getDiagnostics(): LexerDiagnostic[] {
    return this.reporter.getDiagnostics();
  }

  // ─── Internal Scanning Pipeline ─────────────────────────────────────────────

  /**
   * Skips all whitespace (`' '`, `'\t'`, `'\r'`, `'\n'`) and comments (`//` and `/* ... * /`).
   */
  private skipWhitespaceAndComments(): void {
    while (!this.reader.isAtEnd()) {
      const ch = this.reader.peek();

      if (isWhitespace(ch)) {
        this.reader.advance();
        continue;
      }

      // Single-line comment: //
      if (ch === '/' && this.reader.peek(1) === '/') {
        while (!this.reader.isAtEnd() && this.reader.peek() !== '\n') {
          this.reader.advance();
        }
        continue;
      }

      // Multi-line comment: /* ... */ (supports nested /* ... */)
      if (ch === '/' && this.reader.peek(1) === '*') {
        this.scanMultiLineComment();
        continue;
      }

      break;
    }
  }

  /**
   * Scans a multi-line comment (`/* ... * /`), supporting nested block comments
   * and reporting an error if unterminated at EOF.
   */
  private scanMultiLineComment(): void {
    const startPos = this.reader.getPosition();
    this.reader.advance(); // consume '/'
    this.reader.advance(); // consume '*'

    let depth = 1;

    while (!this.reader.isAtEnd() && depth > 0) {
      if (this.reader.peek() === '/' && this.reader.peek(1) === '*') {
        this.reader.advance();
        this.reader.advance();
        depth += 1;
      } else if (this.reader.peek() === '*' && this.reader.peek(1) === '/') {
        this.reader.advance();
        this.reader.advance();
        depth -= 1;
      } else {
        this.reader.advance();
      }
    }

    if (depth > 0) {
      const endPos = this.reader.getPosition();
      const offending = this.buffer.slice(
        startPos.offset,
        Math.min(startPos.offset + 20, endPos.offset),
      );
      this.reporter.report({
        code: 'FPL-L006',
        message: 'Unterminated multi-line comment',
        startPosition: startPos,
        endPosition: endPos,
        offendingLexeme: offending,
        suggestedFix: 'Close the multi-line comment with `*/`.',
      });
    }
  }

  /**
   * Dispatches to the appropriate token scanner based on the current character.
   */
  private scanNextToken(): Token {
    const startPos = this.reader.getPosition();
    const ch = this.reader.peek();

    // 1. String literal
    if (ch === '"' || ch === "'") {
      return this.scanStringLiteral(startPos);
    }

    // 2. Symbolic Currency literal (e.g. $1500.00, ₹25000)
    if (isCurrencySymbol(ch)) {
      return this.scanSymbolCurrencyLiteral(startPos);
    }

    // 3. Date literal shorthand (@YYYY-MM-DD)
    if (ch === '@' && isDigit(this.reader.peek(1))) {
      return this.scanAtDateLiteral(startPos);
    }

    // 4. Numeric literal (Integer, Decimal, Percentage, or Invalid Number/Identifier)
    if (isDigit(ch)) {
      return this.scanNumericLiteral(startPos);
    }

    // 5. Identifier, Keyword, Type Keyword, Constructor Literal (DATE/CURRENCY)
    if (isAlpha(ch)) {
      return this.scanIdentifierOrKeyword(startPos);
    }

    // 6. Multi-character operators (==, !=, >=, <=, +=, -=, *=, /=, .., ??)
    const twoChar = ch + this.reader.peek(1);
    const multiOpType = MULTI_CHAR_OPERATORS[twoChar];
    if (multiOpType !== undefined) {
      this.reader.advance();
      this.reader.advance();
      const endPos = this.reader.getPosition();
      return this.generator.create(multiOpType, twoChar, null, startPos, endPos);
    }

    // 7. Single-character operators (+, -, *, /, %, ^, >, <, =)
    const singleOpType = SINGLE_CHAR_OPERATORS[ch];
    if (singleOpType !== undefined) {
      this.reader.advance();
      const endPos = this.reader.getPosition();
      return this.generator.create(singleOpType, ch, null, startPos, endPos);
    }

    // 8. Delimiters ((, ), {, }, [, ], ,, :, ;, .)
    const delimiterType = DELIMITERS[ch];
    if (delimiterType !== undefined) {
      this.reader.advance();
      const endPos = this.reader.getPosition();
      return this.generator.create(delimiterType, ch, null, startPos, endPos);
    }

    // 9. Unknown / Unexpected symbol
    this.reader.advance();
    const endPos = this.reader.getPosition();
    this.reporter.report({
      code: 'FPL-L001',
      message: `Unexpected character '${ch}'`,
      startPosition: startPos,
      endPosition: endPos,
      offendingLexeme: ch,
      suggestedFix: `Remove '${ch}' or replace it with a valid FPL operator or identifier.`,
    });

    return this.generator.create(TokenType.UNKNOWN, ch, null, startPos, endPos);
  }

  /**
   * Scans a string literal (`"..."` or `'...'`), handling escape sequences and
   * reporting unterminated strings (`FPL-L002`) or invalid escapes (`FPL-L005`).
   */
  private scanStringLiteral(startPos: TokenPosition): Token {
    const quote = this.reader.advance(); // consume opening quote
    let parsedValue = '';
    let hasEscapeError = false;

    while (!this.reader.isAtEnd()) {
      const ch = this.reader.peek();

      // Newline inside string without closing quote -> unterminated string
      if (ch === '\n' || ch === '\r') {
        const endPos = this.reader.getPosition();
        const lexeme = this.buffer.slice(startPos.offset, endPos.offset);
        this.reporter.report({
          code: 'FPL-L002',
          message: 'Unterminated string literal before end of line',
          startPosition: startPos,
          endPosition: endPos,
          offendingLexeme: lexeme,
          suggestedFix: `Add a closing ${quote} quote before the end of the line.`,
        });
        return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
      }

      if (ch === '\\') {
        const escStart = this.reader.getPosition();
        this.reader.advance(); // consume '\'
        if (this.reader.isAtEnd()) break;

        const nextChar = this.reader.advance();
        switch (nextChar) {
          case '"':
            parsedValue += '"';
            break;
          case "'":
            parsedValue += "'";
            break;
          case '\\':
            parsedValue += '\\';
            break;
          case 'n':
            parsedValue += '\n';
            break;
          case 't':
            parsedValue += '\t';
            break;
          case 'r':
            parsedValue += '\r';
            break;
          default: {
            hasEscapeError = true;
            const escEnd = this.reader.getPosition();
            this.reporter.report({
              code: 'FPL-L005',
              message: `Invalid escape sequence '\\${nextChar}' in string literal`,
              startPosition: escStart,
              endPosition: escEnd,
              offendingLexeme: `\\${nextChar}`,
              suggestedFix: 'Use valid escape sequences: \\", \\\\, \\n, \\t, or \\r.',
            });
            parsedValue += nextChar;
          }
        }
        continue;
      }

      if (ch === quote) {
        this.reader.advance(); // consume closing quote
        const endPos = this.reader.getPosition();
        const lexeme = this.buffer.slice(startPos.offset, endPos.offset);

        // Auto-detect ISO date strings if formatted as YYYY-MM-DD when appropriate
        return this.generator.create(
          hasEscapeError ? TokenType.UNKNOWN : TokenType.STRING,
          lexeme,
          hasEscapeError ? null : parsedValue,
          startPos,
          endPos,
        );
      }

      parsedValue += this.reader.advance();
    }

    // Reached EOF without closing quote
    const endPos = this.reader.getPosition();
    const lexeme = this.buffer.slice(startPos.offset, endPos.offset);
    this.reporter.report({
      code: 'FPL-L002',
      message: 'Unterminated string literal at end of file',
      startPosition: startPos,
      endPosition: endPos,
      offendingLexeme: lexeme,
      suggestedFix: `Add a closing ${quote} quote to terminate the string literal.`,
    });

    return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
  }

  /**
   * Scans currency literals prefixed with a currency symbol (`$`, `₹`, `€`, `£`).
   * Validates that a well-formed number follows (`FPL-L007`).
   */
  private scanSymbolCurrencyLiteral(startPos: TokenPosition): Token {
    const symbol = this.reader.advance(); // consume currency symbol

    // Allow optional spaces between symbol and digits? No, symbol currency like $1000.00 is contiguous
    if (!isDigit(this.reader.peek())) {
      const endPos = this.reader.getPosition();
      const lexeme = this.buffer.slice(startPos.offset, endPos.offset);
      this.reporter.report({
        code: 'FPL-L007',
        message: `Invalid currency format '${lexeme}': currency symbol '${symbol}' must be followed by a numeric amount`,
        startPosition: startPos,
        endPosition: endPos,
        offendingLexeme: lexeme,
        suggestedFix: `Provide a valid numeric amount after '${symbol}', e.g. '${symbol}1000.00' or 'CURRENCY(1000.00)'.`,
      });
      return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
    }

    while (isDigit(this.reader.peek())) {
      this.reader.advance();
    }

    let hasInvalidDecimal = false;
    if (this.reader.peek() === '.' && this.reader.peek(1) !== '.') {
      this.reader.advance(); // consume '.'
      let fractionDigits = 0;
      while (isDigit(this.reader.peek())) {
        this.reader.advance();
        fractionDigits += 1;
      }
      if (fractionDigits === 0 || this.reader.peek() === '.') {
        hasInvalidDecimal = true;
        while (isDigit(this.reader.peek()) || this.reader.peek() === '.') {
          this.reader.advance();
        }
      }
    }

    const endPos = this.reader.getPosition();
    const lexeme = this.buffer.slice(startPos.offset, endPos.offset);
    const numericPart = lexeme.slice(symbol.length);

    if (hasInvalidDecimal) {
      this.reporter.report({
        code: 'FPL-L007',
        message: `Invalid currency literal '${lexeme}'`,
        startPosition: startPos,
        endPosition: endPos,
        offendingLexeme: lexeme,
        suggestedFix: `Format currency with up to two decimal places, e.g. '${symbol}2500.00'.`,
      });
      return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
    }

    return this.generator.create(
      TokenType.CURRENCY,
      lexeme,
      {
        kind: 'Currency',
        currency: symbol,
        amount: Number(numericPart),
      },
      startPos,
      endPos,
    );
  }

  /**
   * Scans `@YYYY-MM-DD` date literal syntax.
   */
  private scanAtDateLiteral(startPos: TokenPosition): Token {
    this.reader.advance(); // consume '@'
    while (isDigit(this.reader.peek()) || this.reader.peek() === '-') {
      this.reader.advance();
    }
    const endPos = this.reader.getPosition();
    const lexeme = this.buffer.slice(startPos.offset, endPos.offset);
    const isoPart = lexeme.slice(1);

    if (!isValidIsoDate(isoPart)) {
      this.reporter.report({
        code: 'FPL-L004',
        message: `Invalid date literal '${lexeme}'`,
        startPosition: startPos,
        endPosition: endPos,
        offendingLexeme: lexeme,
        suggestedFix: 'Use valid ISO-8601 date format: DATE("YYYY-MM-DD") or @YYYY-MM-DD.',
      });
      return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
    }

    return this.generator.create(
      TokenType.DATE,
      lexeme,
      { kind: 'Date', iso: isoPart },
      startPos,
      endPos,
    );
  }

  /**
   * Scans integers, decimals, percentages (`12.5%`), ISO dates (`2026-01-01`),
   * and detects malformed numbers (`12.34.56`, `12abc`, `150%` out-of-range, `12.%`).
   */
  private scanNumericLiteral(startPos: TokenPosition): Token {
    while (isDigit(this.reader.peek())) {
      this.reader.advance();
    }

    // Check for bare ISO date literal: YYYY-MM-DD (e.g., 4 digits followed by '-' and 2 digits)
    const currentSlice = this.buffer.slice(startPos.offset, this.reader.getPosition().offset);
    if (
      currentSlice.length === 4 &&
      this.reader.peek() === '-' &&
      isDigit(this.reader.peek(1)) &&
      isDigit(this.reader.peek(2)) &&
      this.reader.peek(3) === '-'
    ) {
      this.reader.advance(); // '-'
      while (isDigit(this.reader.peek())) this.reader.advance();
      if (this.reader.peek() === '-') {
        this.reader.advance(); // '-'
        while (isDigit(this.reader.peek())) this.reader.advance();
      }
      const endPos = this.reader.getPosition();
      const dateLexeme = this.buffer.slice(startPos.offset, endPos.offset);
      if (!isValidIsoDate(dateLexeme)) {
        this.reporter.report({
          code: 'FPL-L004',
          message: `Invalid calendar date '${dateLexeme}'`,
          startPosition: startPos,
          endPosition: endPos,
          offendingLexeme: dateLexeme,
          suggestedFix: 'Ensure month is 01-12 and day is valid for the given month.',
        });
        return this.generator.create(TokenType.UNKNOWN, dateLexeme, null, startPos, endPos);
      }
      return this.generator.create(
        TokenType.DATE,
        dateLexeme,
        { kind: 'Date', iso: dateLexeme },
        startPos,
        endPos,
      );
    }

    let isDecimal = false;
    let isMalformedNumber = false;

    // Check for decimal point, ensuring it is not the `..` range operator
    if (this.reader.peek() === '.' && this.reader.peek(1) !== '.') {
      isDecimal = true;
      this.reader.advance(); // consume '.'

      if (!isDigit(this.reader.peek())) {
        isMalformedNumber = true;
      } else {
        while (isDigit(this.reader.peek())) {
          this.reader.advance();
        }
      }

      // Detect extra decimal points like 123.45.67
      if (this.reader.peek() === '.' && this.reader.peek(1) !== '.') {
        isMalformedNumber = true;
        while (isDigit(this.reader.peek()) || (this.reader.peek() === '.' && this.reader.peek(1) !== '.')) {
          this.reader.advance();
        }
      }
    }

    // Check for Percentage suffix `%`
    if (this.reader.peek() === '%') {
      this.reader.advance(); // consume '%'
      // Check if another '%' or alphanumeric follows (invalid percentage format)
      if (this.reader.peek() === '%' || isAlpha(this.reader.peek())) {
        while (this.reader.peek() === '%' || isAlphaNumeric(this.reader.peek())) {
          this.reader.advance();
        }
        const endPos = this.reader.getPosition();
        const lexeme = this.buffer.slice(startPos.offset, endPos.offset);
        this.reporter.report({
          code: 'FPL-L008',
          message: `Invalid percentage format '${lexeme}'`,
          startPosition: startPos,
          endPosition: endPos,
          offendingLexeme: lexeme,
          suggestedFix: 'Write a valid percentage literal such as `12.5%` or `8%`.',
        });
        return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
      }

      const endPos = this.reader.getPosition();
      const lexeme = this.buffer.slice(startPos.offset, endPos.offset);
      if (isMalformedNumber) {
        this.reporter.report({
          code: 'FPL-L008',
          message: `Invalid percentage literal '${lexeme}'`,
          startPosition: startPos,
          endPosition: endPos,
          offendingLexeme: lexeme,
          suggestedFix: 'Provide digits after the decimal point, e.g. `12.50%`.',
        });
        return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
      }

      const rateValue = Number(lexeme.slice(0, -1));
      return this.generator.create(
        TokenType.PERCENTAGE,
        lexeme,
        { kind: 'Percentage', rate: rateValue },
        startPos,
        endPos,
      );
    }

    // Check if an identifier character immediately follows a number (e.g. `2ndLoan`)
    if (isAlpha(this.reader.peek())) {
      while (isAlphaNumeric(this.reader.peek())) {
        this.reader.advance();
      }
      const endPos = this.reader.getPosition();
      const lexeme = this.buffer.slice(startPos.offset, endPos.offset);
      this.reporter.report({
        code: 'FPL-L003',
        message: `Invalid identifier or numeric literal '${lexeme}': identifiers cannot start with a digit`,
        startPosition: startPos,
        endPosition: endPos,
        offendingLexeme: lexeme,
        suggestedFix: `Rename the identifier to start with a letter (e.g. '_${lexeme}') or separate the number and identifier with a space.`,
      });
      return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
    }

    const endPos = this.reader.getPosition();
    const lexeme = this.buffer.slice(startPos.offset, endPos.offset);

    if (isMalformedNumber) {
      this.reporter.report({
        code: 'FPL-L003',
        message: `Malformed numeric literal '${lexeme}'`,
        startPosition: startPos,
        endPosition: endPos,
        offendingLexeme: lexeme,
        suggestedFix: 'Ensure decimal numbers contain a single decimal point followed by digits (e.g. `123.45`).',
      });
      return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
    }

    const numericValue = Number(lexeme);
    return this.generator.create(
      isDecimal ? TokenType.DECIMAL : TokenType.INTEGER,
      lexeme,
      numericValue,
      startPos,
      endPos,
    );
  }

  /**
   * Scans identifiers, reserved keywords, built-in type keywords, and structured
   * constructor literals (`CURRENCY(...)`, `DATE(...)`, `IS NOT`, `NOT IN`).
   */
  private scanIdentifierOrKeyword(startPos: TokenPosition): Token {
    while (isAlphaNumeric(this.reader.peek())) {
      this.reader.advance();
    }

    const endPos = this.reader.getPosition();
    const lexeme = this.buffer.slice(startPos.offset, endPos.offset);

    // 1. Constructor literal: DATE("YYYY-MM-DD")
    if (lexeme === 'DATE' && this.reader.peek() === '(') {
      return this.scanDateConstructorLiteral(startPos);
    }

    // 2. Constructor literal: CURRENCY(150000.00)
    if (lexeme === 'CURRENCY' && this.reader.peek() === '(') {
      return this.scanCurrencyConstructorLiteral(startPos);
    }

    // 3. Currency code prefix followed by digits (e.g., INR 5000.00 or USD 100)
    if (isCurrencyCodePrefix(lexeme)) {
      const savedTest = this.tryScanCodePrefixedCurrency(startPos, lexeme);
      if (savedTest) {
        return savedTest;
      }
    }

    // 4. Check Reserved Keywords (ALL CAPS)
    const keywordType = RESERVED_KEYWORDS[lexeme];
    if (keywordType !== undefined) {
      if (keywordType === TokenType.BOOLEAN) {
        return this.generator.create(
          TokenType.BOOLEAN,
          lexeme,
          lexeme === 'TRUE',
          startPos,
          endPos,
        );
      }
      if (keywordType === TokenType.NULL) {
        return this.generator.create(TokenType.NULL, lexeme, null, startPos, endPos);
      }
      return this.generator.create(keywordType, lexeme, null, startPos, endPos);
    }

    // 5. Check Built-in Type Keywords (int, decimal, string, boolean, date, currency, percentage, ...)
    const typeKeyword = TYPE_KEYWORDS[lexeme];
    if (typeKeyword !== undefined) {
      return this.generator.create(typeKeyword, lexeme, null, startPos, endPos);
    }

    // 6. Validate Identifier Naming Rules
    const validation = validateIdentifierConventions(lexeme);
    if (!validation.valid) {
      this.reporter.report({
        code: 'FPL-L003',
        message: validation.reason ?? `Invalid identifier '${lexeme}'`,
        startPosition: startPos,
        endPosition: endPos,
        offendingLexeme: lexeme,
        suggestedFix: validation.suggestion ?? 'Use a valid FPL identifier.',
      });
      return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
    }

    return this.generator.create(TokenType.IDENTIFIER, lexeme, null, startPos, endPos);
  }

  /**
   * Scans `DATE("YYYY-MM-DD")` constructor literal.
   */
  private scanDateConstructorLiteral(startPos: TokenPosition): Token {
    this.reader.advance(); // consume '('
    while (!this.reader.isAtEnd() && this.reader.peek() === ' ') {
      this.reader.advance();
    }

    let dateStr = '';
    if (this.reader.peek() === '"' || this.reader.peek() === "'") {
      const quote = this.reader.advance();
      while (!this.reader.isAtEnd() && this.reader.peek() !== quote && this.reader.peek() !== ')' && this.reader.peek() !== '\n') {
        dateStr += this.reader.advance();
      }
      if (this.reader.peek() === quote) {
        this.reader.advance();
      }
    } else {
      while (!this.reader.isAtEnd() && this.reader.peek() !== ')' && this.reader.peek() !== '\n') {
        dateStr += this.reader.advance();
      }
    }

    while (!this.reader.isAtEnd() && this.reader.peek() === ' ') {
      this.reader.advance();
    }

    const hasClosingParen = this.reader.match(')');
    const endPos = this.reader.getPosition();
    const lexeme = this.buffer.slice(startPos.offset, endPos.offset);

    if (!hasClosingParen || !isValidIsoDate(dateStr.trim())) {
      this.reporter.report({
        code: 'FPL-L004',
        message: `Invalid date literal '${lexeme}'`,
        startPosition: startPos,
        endPosition: endPos,
        offendingLexeme: lexeme,
        suggestedFix: 'Use valid ISO calendar format: `DATE("YYYY-MM-DD")`, e.g. `DATE("2026-01-15")`.',
      });
      return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
    }

    return this.generator.create(
      TokenType.DATE,
      lexeme,
      { kind: 'Date', iso: dateStr.trim() },
      startPos,
      endPos,
    );
  }

  /**
   * Scans `CURRENCY(150000.00)` constructor literal.
   */
  private scanCurrencyConstructorLiteral(startPos: TokenPosition): Token {
    this.reader.advance(); // consume '('
    while (!this.reader.isAtEnd() && this.reader.peek() === ' ') {
      this.reader.advance();
    }

    let amountStr = '';
    while (
      !this.reader.isAtEnd() &&
      this.reader.peek() !== ')' &&
      this.reader.peek() !== '\n'
    ) {
      amountStr += this.reader.advance();
    }

    const hasClosingParen = this.reader.match(')');
    const endPos = this.reader.getPosition();
    const lexeme = this.buffer.slice(startPos.offset, endPos.offset);
    const trimmedAmount = amountStr.trim();

    const isValidNumeric = /^-?\d+(\.\d{1,4})?$/.test(trimmedAmount);
    if (!hasClosingParen || !isValidNumeric) {
      this.reporter.report({
        code: 'FPL-L007',
        message: `Invalid currency format '${lexeme}'`,
        startPosition: startPos,
        endPosition: endPos,
        offendingLexeme: lexeme,
        suggestedFix: 'Use a valid numeric amount inside CURRENCY(...), e.g. `CURRENCY(250000.00)`.',
      });
      return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
    }

    return this.generator.create(
      TokenType.CURRENCY,
      lexeme,
      {
        kind: 'Currency',
        currency: 'DEFAULT',
        amount: Number(trimmedAmount),
      },
      startPos,
      endPos,
    );
  }

  /**
   * Attempts to scan an ISO currency code literal like `INR 5000.00` or `USD 250.50`
   * when an ISO code is immediately followed by whitespace and a number.
   */
  private tryScanCodePrefixedCurrency(
    startPos: TokenPosition,
    code: string,
  ): Token | null {
    let lookahead = 0;
    while (this.reader.peek(lookahead) === ' ') {
      lookahead += 1;
    }

    if (lookahead === 0 || !isDigit(this.reader.peek(lookahead))) {
      return null;
    }

    // Consume spaces
    for (let i = 0; i < lookahead; i++) {
      this.reader.advance();
    }

    // Consume digits
    while (isDigit(this.reader.peek())) {
      this.reader.advance();
    }

    let isMalformed = false;
    if (this.reader.peek() === '.' && this.reader.peek(1) !== '.') {
      this.reader.advance();
      if (!isDigit(this.reader.peek())) {
        isMalformed = true;
      }
      while (isDigit(this.reader.peek())) {
        this.reader.advance();
      }
    }

    const endPos = this.reader.getPosition();
    const lexeme = this.buffer.slice(startPos.offset, endPos.offset);
    const amountPart = lexeme.slice(code.length).trim();

    if (isMalformed) {
      this.reporter.report({
        code: 'FPL-L007',
        message: `Invalid currency format '${lexeme}'`,
        startPosition: startPos,
        endPosition: endPos,
        offendingLexeme: lexeme,
        suggestedFix: `Provide a valid decimal amount after ${code}, e.g. '${code} 1500.00'.`,
      });
      return this.generator.create(TokenType.UNKNOWN, lexeme, null, startPos, endPos);
    }

    return this.generator.create(
      TokenType.CURRENCY,
      lexeme,
      {
        kind: 'Currency',
        currency: code,
        amount: Number(amountPart),
      },
      startPos,
      endPos,
    );
  }
}

/**
 * High-level convenience API to scan FPL source code and return the token stream,
 * diagnostics, and pretty-printed console table.
 *
 * @param source   - Raw FPL source code
 * @param fileName - Optional source file name
 */
export function compileSource(source: string, fileName = 'workspace.fpl'): LexerResult {
  const lexer = new Lexer(source, fileName);
  return lexer.tokenize();
}

/**
 * Convenience helper to tokenize an FPL source string directly.
 *
 * @param source   - Raw FPL source code
 * @param fileName - Optional source file name
 */
export function tokenize(source: string, fileName = 'workspace.fpl'): LexerResult {
  const lexer = new Lexer(source, fileName);
  return lexer.tokenize();
}
