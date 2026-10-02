"use strict";
/**
 * @finpolicy/compiler — Lexical Analysis Module Public Exports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = exports.compileSource = exports.Lexer = exports.formatTokenTable = exports.validateIdentifierConventions = exports.isValidIsoDate = exports.isCurrencyCodePrefix = exports.isCurrencySymbol = exports.isWhitespace = exports.isAlphaNumeric = exports.isDigit = exports.isAlpha = exports.DiagnosticReporter = exports.TokenGenerator = exports.CharacterReader = exports.SourceBuffer = exports.getTokenCategory = exports.DELIMITERS = exports.SINGLE_CHAR_OPERATORS = exports.MULTI_CHAR_OPERATORS = exports.TYPE_KEYWORDS = exports.RESERVED_KEYWORDS = exports.TokenCategory = exports.TokenType = void 0;
var token_types_1 = require("./token-types");
Object.defineProperty(exports, "TokenType", { enumerable: true, get: function () { return token_types_1.TokenType; } });
Object.defineProperty(exports, "TokenCategory", { enumerable: true, get: function () { return token_types_1.TokenCategory; } });
Object.defineProperty(exports, "RESERVED_KEYWORDS", { enumerable: true, get: function () { return token_types_1.RESERVED_KEYWORDS; } });
Object.defineProperty(exports, "TYPE_KEYWORDS", { enumerable: true, get: function () { return token_types_1.TYPE_KEYWORDS; } });
Object.defineProperty(exports, "MULTI_CHAR_OPERATORS", { enumerable: true, get: function () { return token_types_1.MULTI_CHAR_OPERATORS; } });
Object.defineProperty(exports, "SINGLE_CHAR_OPERATORS", { enumerable: true, get: function () { return token_types_1.SINGLE_CHAR_OPERATORS; } });
Object.defineProperty(exports, "DELIMITERS", { enumerable: true, get: function () { return token_types_1.DELIMITERS; } });
Object.defineProperty(exports, "getTokenCategory", { enumerable: true, get: function () { return token_types_1.getTokenCategory; } });
var source_buffer_1 = require("./source-buffer");
Object.defineProperty(exports, "SourceBuffer", { enumerable: true, get: function () { return source_buffer_1.SourceBuffer; } });
var character_reader_1 = require("./character-reader");
Object.defineProperty(exports, "CharacterReader", { enumerable: true, get: function () { return character_reader_1.CharacterReader; } });
var token_generator_1 = require("./token-generator");
Object.defineProperty(exports, "TokenGenerator", { enumerable: true, get: function () { return token_generator_1.TokenGenerator; } });
var diagnostic_reporter_1 = require("./diagnostic-reporter");
Object.defineProperty(exports, "DiagnosticReporter", { enumerable: true, get: function () { return diagnostic_reporter_1.DiagnosticReporter; } });
var lexer_utils_1 = require("./lexer-utils");
Object.defineProperty(exports, "isAlpha", { enumerable: true, get: function () { return lexer_utils_1.isAlpha; } });
Object.defineProperty(exports, "isDigit", { enumerable: true, get: function () { return lexer_utils_1.isDigit; } });
Object.defineProperty(exports, "isAlphaNumeric", { enumerable: true, get: function () { return lexer_utils_1.isAlphaNumeric; } });
Object.defineProperty(exports, "isWhitespace", { enumerable: true, get: function () { return lexer_utils_1.isWhitespace; } });
Object.defineProperty(exports, "isCurrencySymbol", { enumerable: true, get: function () { return lexer_utils_1.isCurrencySymbol; } });
Object.defineProperty(exports, "isCurrencyCodePrefix", { enumerable: true, get: function () { return lexer_utils_1.isCurrencyCodePrefix; } });
Object.defineProperty(exports, "isValidIsoDate", { enumerable: true, get: function () { return lexer_utils_1.isValidIsoDate; } });
Object.defineProperty(exports, "validateIdentifierConventions", { enumerable: true, get: function () { return lexer_utils_1.validateIdentifierConventions; } });
Object.defineProperty(exports, "formatTokenTable", { enumerable: true, get: function () { return lexer_utils_1.formatTokenTable; } });
var lexer_1 = require("./lexer");
Object.defineProperty(exports, "Lexer", { enumerable: true, get: function () { return lexer_1.Lexer; } });
Object.defineProperty(exports, "compileSource", { enumerable: true, get: function () { return lexer_1.compileSource; } });
Object.defineProperty(exports, "tokenize", { enumerable: true, get: function () { return lexer_1.tokenize; } });
//# sourceMappingURL=index.js.map