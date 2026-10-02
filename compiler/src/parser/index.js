"use strict";
/**
 * @finpolicy/compiler — Parser Module Barrel Exports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTokens = exports.Parser = exports.RecoveryEngine = exports.SyntaxDiagnostics = exports.ParserContext = exports.TokenStream = void 0;
exports.parseSource = parseSource;
const lexer_1 = require("../lexer");
const parser_1 = require("./parser");
var token_stream_1 = require("./token-stream");
Object.defineProperty(exports, "TokenStream", { enumerable: true, get: function () { return token_stream_1.TokenStream; } });
var parser_context_1 = require("./parser-context");
Object.defineProperty(exports, "ParserContext", { enumerable: true, get: function () { return parser_context_1.ParserContext; } });
var syntax_diagnostics_1 = require("./syntax-diagnostics");
Object.defineProperty(exports, "SyntaxDiagnostics", { enumerable: true, get: function () { return syntax_diagnostics_1.SyntaxDiagnostics; } });
var recovery_engine_1 = require("./recovery-engine");
Object.defineProperty(exports, "RecoveryEngine", { enumerable: true, get: function () { return recovery_engine_1.RecoveryEngine; } });
var parser_2 = require("./parser");
Object.defineProperty(exports, "Parser", { enumerable: true, get: function () { return parser_2.Parser; } });
Object.defineProperty(exports, "parseTokens", { enumerable: true, get: function () { return parser_2.parseTokens; } });
/**
 * Convenience source parser used by backend integration and QA harnesses.
 */
function parseSource(source, fileName = 'workspace.fpl') {
    const lexResult = (0, lexer_1.tokenize)(source, fileName);
    return (0, parser_1.parseTokens)(lexResult.tokens);
}
//# sourceMappingURL=index.js.map