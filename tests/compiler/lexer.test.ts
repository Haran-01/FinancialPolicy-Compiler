import { describe, it, expect } from 'vitest';
import {
  Lexer,
  compileSource,
  tokenize,
  TokenType,
  TokenCategory,
  SourceBuffer,
  CharacterReader,
} from '../../compiler/src';

describe('FinPolicy Compiler — Lexical Analyzer (FPL)', () => {
  // ─── 1. Architecture & Reader Modules ───────────────────────────────────────
  describe('SourceBuffer & CharacterReader', () => {
    it('tracks 1-indexed line and column numbers accurately across newlines', () => {
      const buffer = new SourceBuffer('POLICY Loan\nWHEN\n  age >= 21', 'loan.fpl');
      const reader = new CharacterReader(buffer);

      expect(buffer.getFileName()).toBe('loan.fpl');
      expect(buffer.getLineCount()).toBe(3);
      expect(buffer.getLineText(2)).toBe('WHEN');

      expect(reader.getPosition()).toEqual({ line: 1, column: 1, offset: 0 });
      while (reader.peek() !== '\n') {
        reader.advance();
      }
      reader.advance(); // consume '\n'
      expect(reader.getPosition().line).toBe(2);
      expect(reader.getPosition().column).toBe(1);
    });
  });

  // ─── 2. Empty & Whitespace-Only Files ───────────────────────────────────────
  describe('Empty & Whitespace Inputs', () => {
    it('handles an empty file and emits only EOF', () => {
      const result = tokenize('', 'empty.fpl');
      expect(result.hasErrors).toBe(false);
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]?.type).toBe(TokenType.EOF);
      expect(result.tokens[0]?.fileName).toBe('empty.fpl');
    });

    it('ignores spaces, tabs, carriage returns, and newlines without emitting tokens', () => {
      const result = tokenize('   \t\t  \r\n  \n  \t ');
      expect(result.hasErrors).toBe(false);
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]?.type).toBe(TokenType.EOF);
      expect(result.tokens[0]?.line).toBe(3);
    });
  });

  // ─── 3. Reserved Keywords & Type Keywords ───────────────────────────────────
  describe('Reserved Keywords & Built-in Types', () => {
    it('recognizes all core FPL reserved keywords', () => {
      const source = [
        'POLICY INPUT OUTPUT WHEN THEN ELSE ELSEIF FUNCTION RETURN IMPORT',
        'CONST LET VAR CALL END AND OR NOT WHILE FOR FOREACH BREAK CONTINUE',
        'TRY CATCH LOG SET ALLOW DENY REVIEW RULE IN MATCH CASE DEFAULT',
      ].join(' ');

      const result = tokenize(source);
      expect(result.hasErrors).toBe(false);

      const types = result.tokens.slice(0, -1).map((t) => t.type);
      expect(types).toContain(TokenType.POLICY);
      expect(types).toContain(TokenType.WHEN);
      expect(types).toContain(TokenType.ELSEIF);
      expect(types).toContain(TokenType.FOREACH);
      expect(types).toContain(TokenType.ALLOW);
      expect(types).toContain(TokenType.DENY);
      expect(types).toContain(TokenType.RULE);
    });

    it('recognizes built-in data type keywords', () => {
      const source = 'int decimal string boolean date currency percentage array object customer loan account';
      const result = tokenize(source);
      expect(result.hasErrors).toBe(false);
      expect(result.tokens[0]?.type).toBe(TokenType.INT_TYPE);
      expect(result.tokens[5]?.type).toBe(TokenType.CURRENCY_TYPE);
      expect(result.tokens[6]?.type).toBe(TokenType.PERCENTAGE_TYPE);
      expect(result.tokens[9]?.type).toBe(TokenType.CUSTOMER_TYPE);
      expect(result.tokens[0]?.category).toBe(TokenCategory.TYPE_KEYWORD);
    });
  });

  // ─── 4. Identifiers & Naming Conventions ────────────────────────────────────
  describe('Identifiers', () => {
    it('recognizes policy names, variables, constants, and namespaces', () => {
      const source = 'LoanApproval creditScore MAX_LOAN_AMOUNT _internal CreditLib.Check';
      const result = tokenize(source);
      expect(result.hasErrors).toBe(false);
      expect(result.tokens[0]?.type).toBe(TokenType.IDENTIFIER);
      expect(result.tokens[0]?.lexeme).toBe('LoanApproval');
      expect(result.tokens[1]?.lexeme).toBe('creditScore');
      expect(result.tokens[2]?.lexeme).toBe('MAX_LOAN_AMOUNT');
      expect(result.tokens[3]?.lexeme).toBe('_internal');
      expect(result.tokens[4]?.lexeme).toBe('CreditLib');
      expect(result.tokens[5]?.type).toBe(TokenType.DOT);
      expect(result.tokens[6]?.lexeme).toBe('Check');
    });

    it('flags identifiers exceeding 128 characters', () => {
      const longIdent = 'a'.repeat(130);
      const result = tokenize(longIdent);
      expect(result.hasErrors).toBe(true);
      expect(result.diagnostics[0]?.code).toBe('FPL-L003');
    });

    it('flags identifiers starting with a digit', () => {
      const result = tokenize('LET 2ndLoan : currency');
      expect(result.hasErrors).toBe(true);
      expect(result.diagnostics[0]?.code).toBe('FPL-L003');
      expect(result.diagnostics[0]?.offendingLexeme).toBe('2ndLoan');
    });
  });

  // ─── 5. Literals ────────────────────────────────────────────────────────────
  describe('Literals (Int, Decimal, Currency, Percentage, Boolean, String, Date, Null)', () => {
    it('recognizes integer and decimal literals with numeric literal values', () => {
      const result = tokenize('21 650 0.42 150000.75');
      expect(result.hasErrors).toBe(false);

      expect(result.tokens[0]?.type).toBe(TokenType.INTEGER);
      expect(result.tokens[0]?.literal).toBe(21);

      expect(result.tokens[2]?.type).toBe(TokenType.DECIMAL);
      expect(result.tokens[2]?.literal).toBe(0.42);
    });

    it('recognizes currency literals in constructor, symbol, and ISO code formats', () => {
      const result = tokenize('CURRENCY(250000.00) $1500.50 ₹85000 INR 10000.00');
      expect(result.hasErrors).toBe(false);

      expect(result.tokens[0]?.type).toBe(TokenType.CURRENCY);
      expect(result.tokens[0]?.literal).toEqual({
        kind: 'Currency',
        currency: 'DEFAULT',
        amount: 250000,
      });

      expect(result.tokens[1]?.type).toBe(TokenType.CURRENCY);
      expect(result.tokens[1]?.literal).toEqual({
        kind: 'Currency',
        currency: '$',
        amount: 1500.5,
      });

      expect(result.tokens[2]?.type).toBe(TokenType.CURRENCY);
      expect(result.tokens[2]?.literal).toEqual({
        kind: 'Currency',
        currency: '₹',
        amount: 85000,
      });

      expect(result.tokens[3]?.type).toBe(TokenType.CURRENCY);
      expect(result.tokens[3]?.literal).toEqual({
        kind: 'Currency',
        currency: 'INR',
        amount: 10000,
      });
    });

    it('recognizes percentage literals', () => {
      const result = tokenize('8.5% 18% 100.00%');
      expect(result.hasErrors).toBe(false);
      expect(result.tokens[0]?.type).toBe(TokenType.PERCENTAGE);
      expect(result.tokens[0]?.literal).toEqual({ kind: 'Percentage', rate: 8.5 });
      expect(result.tokens[1]?.literal).toEqual({ kind: 'Percentage', rate: 18 });
    });

    it('recognizes boolean and null literals', () => {
      const result = tokenize('TRUE FALSE NULL');
      expect(result.hasErrors).toBe(false);
      expect(result.tokens[0]?.type).toBe(TokenType.BOOLEAN);
      expect(result.tokens[0]?.literal).toBe(true);
      expect(result.tokens[1]?.type).toBe(TokenType.BOOLEAN);
      expect(result.tokens[1]?.literal).toBe(false);
      expect(result.tokens[2]?.type).toBe(TokenType.NULL);
      expect(result.tokens[2]?.literal).toBeNull();
    });

    it('recognizes string literals including escape sequences and Unicode', () => {
      const result = tokenize('"Approved for Arjun Mehta — ₹5,00,000\\nVerified"');
      expect(result.hasErrors).toBe(false);
      expect(result.tokens[0]?.type).toBe(TokenType.STRING);
      expect(result.tokens[0]?.literal).toBe('Approved for Arjun Mehta — ₹5,00,000\nVerified');
    });

    it('recognizes date literals in DATE("YYYY-MM-DD"), @YYYY-MM-DD, and bare ISO formats', () => {
      const result = tokenize('DATE("2026-01-15") @2026-10-01 2026-12-31');
      expect(result.hasErrors).toBe(false);
      expect(result.tokens[0]?.type).toBe(TokenType.DATE);
      expect(result.tokens[0]?.literal).toEqual({ kind: 'Date', iso: '2026-01-15' });
      expect(result.tokens[1]?.type).toBe(TokenType.DATE);
      expect(result.tokens[1]?.literal).toEqual({ kind: 'Date', iso: '2026-10-01' });
      expect(result.tokens[2]?.type).toBe(TokenType.DATE);
      expect(result.tokens[2]?.literal).toEqual({ kind: 'Date', iso: '2026-12-31' });
    });
  });

  // ─── 6. Operators & Delimiters ──────────────────────────────────────────────
  describe('Operators & Delimiters', () => {
    it('recognizes arithmetic, comparison, assignment, range, and null-coalescing operators', () => {
      const source = '+ - * / % == != > < >= <= = += -= *= /= .. ??';
      const result = tokenize(source);
      expect(result.hasErrors).toBe(false);

      const expected = [
        TokenType.PLUS,
        TokenType.MINUS,
        TokenType.STAR,
        TokenType.SLASH,
        TokenType.PERCENT,
        TokenType.EQUAL_EQUAL,
        TokenType.NOT_EQUAL,
        TokenType.GREATER,
        TokenType.LESS,
        TokenType.GREATER_EQUAL,
        TokenType.LESS_EQUAL,
        TokenType.ASSIGN,
        TokenType.PLUS_ASSIGN,
        TokenType.MINUS_ASSIGN,
        TokenType.STAR_ASSIGN,
        TokenType.SLASH_ASSIGN,
        TokenType.RANGE,
        TokenType.NULL_COALESCE,
        TokenType.EOF,
      ];

      expect(result.tokens.map((t) => t.type)).toEqual(expected);
    });

    it('distinguishes between decimal numbers and the `..` range operator', () => {
      const result = tokenize('21..60');
      expect(result.hasErrors).toBe(false);
      expect(result.tokens[0]?.type).toBe(TokenType.INTEGER);
      expect(result.tokens[0]?.literal).toBe(21);
      expect(result.tokens[1]?.type).toBe(TokenType.RANGE);
      expect(result.tokens[2]?.type).toBe(TokenType.INTEGER);
      expect(result.tokens[2]?.literal).toBe(60);
    });

    it('recognizes all delimiters', () => {
      const result = tokenize('( ) { } [ ] , : ; .');
      expect(result.hasErrors).toBe(false);
      const expected = [
        TokenType.LPAREN,
        TokenType.RPAREN,
        TokenType.LBRACE,
        TokenType.RBRACE,
        TokenType.LBRACKET,
        TokenType.RBRACKET,
        TokenType.COMMA,
        TokenType.COLON,
        TokenType.SEMICOLON,
        TokenType.DOT,
        TokenType.EOF,
      ];
      expect(result.tokens.map((t) => t.type)).toEqual(expected);
    });
  });

  // ─── 7. Comments (Single-line, Multi-line, Nested) ──────────────────────────
  describe('Comments & Line Number Preservation', () => {
    it('ignores single-line, multi-line, and nested multi-line comments while preserving line numbers', () => {
      const source = [
        '// Header comment',
        'POLICY LoanApproval',
        '/* Multi-line comment',
        '   /* Nested comment block */',
        '   still inside outer comment */',
        'WHEN',
        '    AGE >= 21',
      ].join('\n');

      const result = tokenize(source);
      expect(result.hasErrors).toBe(false);
      expect(result.tokens[0]?.lexeme).toBe('POLICY');
      expect(result.tokens[0]?.line).toBe(2);
      expect(result.tokens[2]?.lexeme).toBe('WHEN');
      expect(result.tokens[2]?.line).toBe(6);
      expect(result.tokens[3]?.lexeme).toBe('AGE');
      expect(result.tokens[3]?.line).toBe(7);
      expect(result.tokens[3]?.column).toBe(5);
    });

    it('reports an error on unterminated multi-line comments', () => {
      const result = tokenize('POLICY Loan /* unterminated comment');
      expect(result.hasErrors).toBe(true);
      expect(result.diagnostics[0]?.code).toBe('FPL-L006');
    });
  });

  // ─── 8. Error Detection & Diagnostics ───────────────────────────────────────
  describe('Lexical Diagnostics & Error Recovery', () => {
    it('detects unknown characters, unterminated strings, invalid numbers, currency, and percentage formats', () => {
      const source = [
        'LET badChar = ~',
        'LET str = "unterminated string',
        'LET badNum = 123.45.67',
        'LET badCurr = $',
        'LET badPct = 15.5%%',
        'LET badDate = DATE("2026-13-45")',
      ].join('\n');

      const result = compileSource(source, 'errors.fpl');
      expect(result.hasErrors).toBe(true);
      expect(result.diagnostics.length).toBeGreaterThanOrEqual(6);

      const codes = result.diagnostics.map((d) => d.code);
      expect(codes).toContain('FPL-L001'); // Unknown character ~
      expect(codes).toContain('FPL-L002'); // Unterminated string
      expect(codes).toContain('FPL-L003'); // Invalid number 123.45.67
      expect(codes).toContain('FPL-L007'); // Invalid currency $
      expect(codes).toContain('FPL-L008'); // Invalid percentage 15.5%%
      expect(codes).toContain('FPL-L004'); // Invalid date

      expect(result.formattedDiagnostics).toContain('Suggested Fix:');
    });
  });

  // ─── 9. Streaming API & Pretty Table Output ─────────────────────────────────
  describe('Compiler API (nextToken, peek, reset, formattedTable)', () => {
    it('supports streaming token iteration and lookahead via nextToken() and peek()', () => {
      const source = [
        'POLICY LoanApproval',
        '',
        'WHEN',
        '    AGE >= 21',
      ].join('\n');

      const lexer = new Lexer(source, 'loan_approval.fpl');
      expect(lexer.peek().type).toBe(TokenType.POLICY);
      expect(lexer.peek(1).lexeme).toBe('LoanApproval');

      const first = lexer.nextToken();
      expect(first.type).toBe(TokenType.POLICY);
      expect(first.line).toBe(1);
      expect(first.column).toBe(1);

      const second = lexer.nextToken();
      expect(second.type).toBe(TokenType.IDENTIFIER);
      expect(second.lexeme).toBe('LoanApproval');
      expect(second.line).toBe(1);
      expect(second.column).toBe(8);

      lexer.reset();
      expect(lexer.nextToken().type).toBe(TokenType.POLICY);
    });

    it('generates formatted console table output matching specification', () => {
      const source = [
        'POLICY LoanApproval',
        '',
        'WHEN',
        '    AGE >= 21',
      ].join('\n');

      const result = compileSource(source);
      expect(result.formattedTable).toContain('TOKEN TYPE');
      expect(result.formattedTable).toContain('POLICY');
      expect(result.formattedTable).toContain('LoanApproval');
      expect(result.formattedTable).toContain('GREATER_EQUAL');
      expect(result.formattedTable).toContain('INTEGER');
    });
  });

  // ─── 10. Large Policy File Performance Test ─────────────────────────────────
  describe('Large File Stress Test', () => {
    it('scans 2,000 lines of FPL source code cleanly and quickly', () => {
      const block = [
        'RULE ScoreCheck',
        '    LET base : currency = CURRENCY(50000.00)',
        '    IF applicant.creditScore >= 720 AND rate <= 12.5% THEN',
        '        ALLOW WITH reason = "Approved"',
        '    END',
        'END',
      ].join('\n');

      const largeSource = Array.from({ length: 350 }, () => block).join('\n\n');
      const result = compileSource(largeSource, 'large_policy.fpl');

      expect(result.hasErrors).toBe(false);
      expect(result.tokens.length).toBeGreaterThan(7000);
    });
  });
});
