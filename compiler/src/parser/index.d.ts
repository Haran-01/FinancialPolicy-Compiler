/**
 * @finpolicy/compiler — Parser Module Barrel Exports
 */
export type { IParser, ParseResult, ParseError, } from './parser.interface';
export { TokenStream } from './token-stream';
export { ParserContext } from './parser-context';
export type { ParserBlockKind } from './parser-context';
export { SyntaxDiagnostics } from './syntax-diagnostics';
export type { SyntaxDiagnostic, SyntaxSeverity, ReportSyntaxErrorParams, } from './syntax-diagnostics';
export { RecoveryEngine } from './recovery-engine';
export { Parser, parseTokens } from './parser';
/**
 * Convenience source parser used by backend integration and QA harnesses.
 */
export declare function parseSource(source: string, fileName?: string): import("./parser.interface").ParseResult;
//# sourceMappingURL=index.d.ts.map