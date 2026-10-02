/**
 * @finpolicy/compiler — Parser Module Barrel Exports
 */

import { tokenize } from '../lexer';
import { parseTokens as parseTokenStream } from './parser';

export type {
  IParser,
  ParseResult,
  ParseError,
} from './parser.interface';

export { TokenStream } from './token-stream';
export { ParserContext } from './parser-context';
export type { ParserBlockKind } from './parser-context';
export { SyntaxDiagnostics } from './syntax-diagnostics';
export type {
  SyntaxDiagnostic,
  SyntaxSeverity,
  ReportSyntaxErrorParams,
} from './syntax-diagnostics';
export { RecoveryEngine } from './recovery-engine';
export { Parser, parseTokens } from './parser';

/**
 * Convenience source parser used by backend integration and QA harnesses.
 */
export function parseSource(source: string, fileName = 'workspace.fpl') {
  const lexResult = tokenize(source, fileName);
  return parseTokenStream(lexResult.tokens);
}
