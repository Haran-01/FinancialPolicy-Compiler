/**
 * FPL Parser Interface & Result Contracts
 *
 * Defines the public contract for the Recursive Descent Parser, ParseResult,
 * ASTRepository ("Source of Truth"), and UI visualization payloads.
 */

import type { Token } from '../lexer/lexer.interface';
import { TokenType } from '../lexer/token-types';
import type {
  ASTProgram,
  ASTPolicyDeclaration,
  ASTFunctionDeclaration,
  ASTStatementNode,
  ASTExpressionNode,
} from '../ast/ast.interface';
import type { ASTGraphRepresentation } from '../ast/ast-pretty-printer';
import type { ASTRepository } from '../ast/ast-repository';
import type { SyntaxDiagnostic } from './syntax-diagnostics';

export type ParseError = SyntaxDiagnostic;

/**
 * Complete output returned by `Parser.parse()` and `parseTokens()`.
 */
export interface ParseResult {
  /** Root `Program` AST node */
  ast: ASTProgram;
  /**
   * Central `ASTRepository` ("Source of Truth") indexed by node ID, node type,
   * and source location for consumption by Semantic Analyzer, Symbol Table Builder,
   * IR Generator, Optimizer, Execution Engine, and Frontend AST Viewer.
   */
  repository: ASTRepository;
  /** Recorded syntax diagnostics */
  diagnostics: SyntaxDiagnostic[];
  /** Alias for `diagnostics` */
  errors: SyntaxDiagnostic[];
  /** True if at least one syntax error occurred */
  hasErrors: boolean;
  /** Formatted Unicode tree string (`Program \n ├── Policy ...`) */
  prettyTree: string;
  /** Formatted syntax error report with code snippets and underlining */
  formattedDiagnostics: string;
  /** Cycle-free JSON serialization of the AST */
  json: string;
  /** Nodes & edges graph representation for UI AST Explorer */
  graph: ASTGraphRepresentation;
  /** Graphviz DOT representation */
  graphvizDot: string;
}

/**
 * Public Recursive Descent Parser Interface
 */
export interface IParser {
  /**
   * Parses the token stream, commits the resulting AST into the central
   * `ASTRepository`, and returns a complete {@link ParseResult}.
   */
  parse(tokens?: Token[]): ParseResult;

  /**
   * Returns the central `ASTRepository` holding the latest parsed AST.
   */
  getRepository(): ASTRepository;

  /**
   * Parses the top-level `Program` node.
   */
  parseProgram(): ASTProgram;

  /**
   * Parses a `POLICY` declaration block.
   */
  parsePolicy(): ASTPolicyDeclaration;

  /**
   * Parses a `FUNCTION` declaration block.
   */
  parseFunction(): ASTFunctionDeclaration;

  /**
   * Parses a statement inside a policy, function, rule, or control-flow block.
   */
  parseStatement(): ASTStatementNode | null;

  /**
   * Parses an arbitrary FPL expression respecting operator precedence.
   */
  parseExpression(): ASTExpressionNode;

  /**
   * Peeks at the token at `cursor + lookahead` without consuming it.
   */
  peek(lookahead?: number): Token;

  /**
   * Conditionally consumes the current token if it matches any of `types`.
   */
  match(...types: TokenType[]): boolean;

  /**
   * Consumes and returns the current token.
   */
  consume(): Token;

  /**
   * Asserts that the current token has `type`, consuming and returning it;
   * otherwise records a syntax error and synthesizes a recovery token.
   */
  expect(
    type: TokenType,
    code: string,
    message: string,
    suggestedFix: string,
  ): Token;

  /**
   * Triggers panic-mode error recovery to the next synchronization point.
   */
  synchronize(): void;

  /**
   * Alias for `synchronize()` satisfying legacy `recover` signature.
   */
  recover(error?: ParseError): void;

  /**
   * Returns `true` if any syntax error has been recorded.
   */
  hasErrors(): boolean;
}
