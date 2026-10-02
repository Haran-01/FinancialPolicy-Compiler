/**
 * @finpolicy/compiler — Lexical Analysis Module Public Exports
 */
export { TokenType, TokenCategory, RESERVED_KEYWORDS, TYPE_KEYWORDS, MULTI_CHAR_OPERATORS, SINGLE_CHAR_OPERATORS, DELIMITERS, getTokenCategory, } from './token-types';
export type { ILexer, Token, TokenPosition, TokenLiteralValue, CurrencyLiteralValue, PercentageLiteralValue, DateLiteralValue, LexerDiagnostic, LexerError, LexerResult, IASTNode, } from './lexer.interface';
export { SourceBuffer } from './source-buffer';
export { CharacterReader } from './character-reader';
export { TokenGenerator } from './token-generator';
export { DiagnosticReporter } from './diagnostic-reporter';
export type { LexerDiagnosticSeverity, ReportDiagnosticParams } from './diagnostic-reporter';
export { isAlpha, isDigit, isAlphaNumeric, isWhitespace, isCurrencySymbol, isCurrencyCodePrefix, isValidIsoDate, validateIdentifierConventions, formatTokenTable, } from './lexer-utils';
export { Lexer, compileSource, tokenize } from './lexer';
//# sourceMappingURL=index.d.ts.map