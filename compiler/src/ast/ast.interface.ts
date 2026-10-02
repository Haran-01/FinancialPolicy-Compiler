/**
 * Financial Policy Language (FPL) — Abstract Syntax Tree (AST) Definitions
 *
 * Defines every AST node interface for the FinPolicy Compiler Parsing Engine.
 * Every node carries:
 * - `type`: Discriminated union node kind (`ASTNodeType`)
 * - `id`: Globally unique node identifier (e.g. `ast_1`, `ast_2`)
 * - `parent`: Reference to parent `ASTNode | null` (linked during tree construction)
 * - `children`: Ordered array of child `ASTNode[]` for uniform tree traversal
 * - `location`: Complete source location (`file`, `line`, `column`, `endLine`, `endColumn`, `startOffset`, `endOffset`)
 * - `line`, `column`, `startOffset`, `endOffset`: Direct top-level coordinates
 */

import type { TokenLiteralValue } from '../lexer/lexer.interface';

// ─────────────────────────────────────────────────────────────────────────────
// Node Type Discriminant
// ─────────────────────────────────────────────────────────────────────────────

export type ASTNodeType =
  // ── Root & Top-Level Declarations ────────────────────────────────────────
  | 'Program'
  | 'ImportDeclaration'
  | 'PolicyDeclaration'
  | 'FunctionDeclaration'
  | 'ConstantDeclaration'
  | 'ConstDeclaration'
  | 'VariableDeclaration'
  | 'LetDeclaration'
  | 'VarDeclaration'
  | 'RuleDeclaration'
  // ── Policy Sections & Parameters ─────────────────────────────────────────
  | 'InputBlock'
  | 'OutputBlock'
  | 'WhenBlock'
  | 'ThenBlock'
  | 'ElseBlock'
  | 'ParameterDeclaration'
  | 'TypeAnnotation'
  // ── Statement Nodes ──────────────────────────────────────────────────────
  | 'AssignmentStatement'
  | 'SetStatement'
  | 'EmitStatement'
  | 'ApplyStatement'
  | 'IfStatement'
  | 'ElseIfStatement'
  | 'ElseIfClause'
  | 'ElseStatement'
  | 'ElseClause'
  | 'MatchStatement'
  | 'CaseClause'
  | 'DefaultClause'
  | 'ForStatement'
  | 'WhileStatement'
  | 'ForeachStatement'
  | 'TryStatement'
  | 'CatchClause'
  | 'ReturnStatement'
  | 'CallStatement'
  | 'LogStatement'
  | 'WarnStatement'
  | 'AssertStatement'
  | 'ThrowStatement'
  | 'BreakStatement'
  | 'ContinueStatement'
  | 'AllowStatement'
  | 'DenyStatement'
  | 'ReviewStatement'
  | 'ExpressionStatement'
  // ── Expression Nodes ─────────────────────────────────────────────────────
  | 'BinaryExpression'
  | 'ArithmeticExpression'
  | 'ComparisonExpression'
  | 'LogicalExpression'
  | 'UnaryExpression'
  | 'TernaryExpression'
  | 'ParenthesizedExpression'
  | 'LiteralExpression'
  | 'IdentifierExpression'
  | 'Identifier'
  | 'FunctionCallExpression'
  | 'CallExpression'
  | 'PolicyCallExpression'
  | 'MemberExpression'
  | 'IndexExpression'
  | 'ArrayLiteral'
  | 'ObjectLiteral'
  | 'ObjectProperty'
  | 'RangeExpression'
  | 'BetweenExpression'
  | 'InExpression'
  | 'NullCheckExpression'
  | 'NullCoalesceExpression'
  | 'PercentageOfExpression'
  // ── Legacy Literal Aliases ───────────────────────────────────────────────
  | 'IntegerLiteral'
  | 'DecimalLiteral'
  | 'StringLiteral'
  | 'BooleanLiteral'
  | 'DateLiteral'
  | 'CurrencyLiteral'
  | 'NullLiteral';

// ─────────────────────────────────────────────────────────────────────────────
// Source Location & Base Node
// ─────────────────────────────────────────────────────────────────────────────

/** Backward-compatible 1-indexed position */
export interface ASTPosition {
  line: number;
  column: number;
  offset: number;
}

/** Complete source span attached to every AST node */
export interface ASTSourceLocation {
  file: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  startOffset: number;
  endOffset: number;
}

/**
 * Base interface implemented by every AST node in the FinPolicy Compiler.
 */
export interface ASTNode {
  /** Discriminant node type */
  type: ASTNodeType;
  /** Unique identifier for UI selection, Graphviz export, and AST maps */
  id: string;
  /** Reference to parent node (`null` for root `Program` node) */
  parent: ASTNode | null;
  /** Direct child AST nodes in syntactic order */
  children: ASTNode[];
  /** Full source span location */
  location: ASTSourceLocation;
  /** Backward-compatible start position */
  position: ASTPosition;
  /** 1-indexed starting line number */
  line: number;
  /** 1-indexed starting column number */
  column: number;
  /** 0-indexed starting character offset */
  startOffset: number;
  /** 0-indexed ending character offset */
  endOffset: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IASTNode extends ASTNode {}

// ─────────────────────────────────────────────────────────────────────────────
// Root & Top-Level Declarations
// ─────────────────────────────────────────────────────────────────────────────

export interface ASTProgram extends ASTNode {
  type: 'Program';
  imports: ASTImportDeclaration[];
  constants: ASTConstantDeclaration[];
  variables: ASTVariableDeclaration[];
  functions: ASTFunctionDeclaration[];
  policies: ASTPolicyDeclaration[];
  rules: ASTRuleDeclaration[];
  statements: ASTStatementNode[];
}

export interface ASTImportDeclaration extends ASTNode {
  type: 'ImportDeclaration';
  path: string;
  alias: string | null;
}

export interface ASTTypeAnnotation extends ASTNode {
  type: 'TypeAnnotation';
  typeName: string;
  isArray: boolean;
  elementType: string | null;
}

export interface ASTParameterDeclaration extends ASTNode {
  type: 'ParameterDeclaration';
  name: string;
  typeAnnotation: ASTTypeAnnotation;
}

export interface ASTConstantDeclaration extends ASTNode {
  type: 'ConstantDeclaration';
  name: string;
  typeAnnotation: ASTTypeAnnotation | null;
  value: ASTExpressionNode;
}

export interface ASTVariableDeclaration extends ASTNode {
  type: 'VariableDeclaration';
  kind: 'LET' | 'VAR';
  isMutable: boolean;
  name: string;
  typeAnnotation: ASTTypeAnnotation | null;
  initializer: ASTExpressionNode | null;
}

export interface ASTFunctionDeclaration extends ASTNode {
  type: 'FunctionDeclaration';
  name: string;
  parameters: ASTParameterDeclaration[];
  returnType: ASTTypeAnnotation | null;
  body: ASTStatementNode[];
}

export interface ASTInputBlock extends ASTNode {
  type: 'InputBlock';
  parameters: ASTParameterDeclaration[];
}

export interface ASTOutputBlock extends ASTNode {
  type: 'OutputBlock';
  parameters: ASTParameterDeclaration[];
}

export interface ASTWhenBlock extends ASTNode {
  type: 'WhenBlock';
  condition: ASTExpressionNode;
}

export interface ASTThenBlock extends ASTNode {
  type: 'ThenBlock';
  statements: ASTStatementNode[];
}

export interface ASTElseBlock extends ASTNode {
  type: 'ElseBlock';
  statements: ASTStatementNode[];
}

export interface ASTPolicyDeclaration extends ASTNode {
  type: 'PolicyDeclaration';
  name: string;
  inputBlock: ASTInputBlock | null;
  outputBlock: ASTOutputBlock | null;
  whenBlock: ASTWhenBlock | null;
  thenBlock: ASTThenBlock | null;
  elseBlock: ASTElseBlock | null;
  rules: ASTRuleDeclaration[];
}

export interface ASTRuleDeclaration extends ASTNode {
  type: 'RuleDeclaration';
  name: string;
  condition: ASTExpressionNode | null;
  statements: ASTStatementNode[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Statement Nodes
// ─────────────────────────────────────────────────────────────────────────────

export type AssignmentOperator = '=' | '+=' | '-=' | '*=' | '/=';

export interface ASTAssignmentStatement extends ASTNode {
  type: 'AssignmentStatement';
  target: ASTExpressionNode;
  operator: AssignmentOperator;
  value: ASTExpressionNode;
}

export interface ASTSetStatement extends ASTNode {
  type: 'SetStatement';
  target: ASTExpressionNode;
  operator: AssignmentOperator;
  value: ASTExpressionNode;
}

export interface ASTEmitStatement extends ASTNode {
  type: 'EmitStatement';
  target: string;
  value: ASTExpressionNode;
}

export interface ASTApplyStatement extends ASTNode {
  type: 'ApplyStatement';
  ruleName: string;
}

export interface ASTElseIfStatement extends ASTNode {
  type: 'ElseIfStatement';
  condition: ASTExpressionNode;
  consequent: ASTStatementNode[];
}

export interface ASTElseStatement extends ASTNode {
  type: 'ElseStatement';
  statements: ASTStatementNode[];
}

export interface ASTIfStatement extends ASTNode {
  type: 'IfStatement';
  condition: ASTExpressionNode;
  thenBranch: ASTStatementNode[];
  elseIfBranches: ASTElseIfStatement[];
  elseBranch: ASTElseStatement | null;
}

export interface ASTCaseClause extends ASTNode {
  type: 'CaseClause';
  values: ASTExpressionNode[];
  statements: ASTStatementNode[];
}

export interface ASTDefaultClause extends ASTNode {
  type: 'DefaultClause';
  statements: ASTStatementNode[];
}

export interface ASTMatchStatement extends ASTNode {
  type: 'MatchStatement';
  discriminant: ASTExpressionNode;
  cases: ASTCaseClause[];
  defaultCase: ASTDefaultClause | null;
}

export interface ASTForStatement extends ASTNode {
  type: 'ForStatement';
  iterator: string;
  start: ASTExpressionNode;
  end: ASTExpressionNode;
  step: ASTExpressionNode | null;
  body: ASTStatementNode[];
}

export interface ASTWhileStatement extends ASTNode {
  type: 'WhileStatement';
  condition: ASTExpressionNode;
  body: ASTStatementNode[];
}

export interface ASTForeachStatement extends ASTNode {
  type: 'ForeachStatement';
  iterator: string;
  collection: ASTExpressionNode;
  body: ASTStatementNode[];
}

export interface ASTCatchClause extends ASTNode {
  type: 'CatchClause';
  errorVariable: string | null;
  body: ASTStatementNode[];
}

export interface ASTTryStatement extends ASTNode {
  type: 'TryStatement';
  tryBlock: ASTStatementNode[];
  catchClause: ASTCatchClause | null;
}

export interface ASTReturnStatement extends ASTNode {
  type: 'ReturnStatement';
  value: ASTExpressionNode | null;
}

export interface ASTCallArgument {
  name: string | null;
  value: ASTExpressionNode;
}

export interface ASTCallStatement extends ASTNode {
  type: 'CallStatement';
  callee: string;
  arguments: ASTCallArgument[];
  returnBinding: string | null;
}

export interface ASTLogStatement extends ASTNode {
  type: 'LogStatement';
  level: 'LOG' | 'WARN';
  expression: ASTExpressionNode;
}

export interface ASTAssertStatement extends ASTNode {
  type: 'AssertStatement';
  condition: ASTExpressionNode;
  message: ASTExpressionNode | null;
}

export interface ASTThrowStatement extends ASTNode {
  type: 'ThrowStatement';
  errorCode: ASTExpressionNode;
  message: ASTExpressionNode | null;
}

export interface ASTBreakStatement extends ASTNode {
  type: 'BreakStatement';
}

export interface ASTContinueStatement extends ASTNode {
  type: 'ContinueStatement';
}

export interface ASTDecisionStatement extends ASTNode {
  type: 'AllowStatement' | 'DenyStatement' | 'ReviewStatement';
  decision: 'ALLOW' | 'DENY' | 'REVIEW';
  reason: ASTExpressionNode | null;
  assignTo: ASTExpressionNode | null;
}

export interface ASTExpressionStatement extends ASTNode {
  type: 'ExpressionStatement';
  expression: ASTExpressionNode;
}

export type ASTStatementNode =
  | ASTVariableDeclaration
  | ASTAssignmentStatement
  | ASTSetStatement
  | ASTEmitStatement
  | ASTApplyStatement
  | ASTIfStatement
  | ASTElseIfStatement
  | ASTElseStatement
  | ASTMatchStatement
  | ASTForStatement
  | ASTWhileStatement
  | ASTForeachStatement
  | ASTTryStatement
  | ASTReturnStatement
  | ASTCallStatement
  | ASTLogStatement
  | ASTAssertStatement
  | ASTThrowStatement
  | ASTBreakStatement
  | ASTContinueStatement
  | ASTDecisionStatement
  | ASTExpressionStatement;

// ─────────────────────────────────────────────────────────────────────────────
// Expression Nodes
// ─────────────────────────────────────────────────────────────────────────────

export type BinaryCategory = 'ARITHMETIC' | 'COMPARISON' | 'LOGICAL' | 'COALESCE' | 'PERCENTAGE_OF' | 'RANGE';

export interface ASTBinaryExpression extends ASTNode {
  type: 'BinaryExpression' | 'ArithmeticExpression' | 'ComparisonExpression' | 'LogicalExpression';
  category: BinaryCategory;
  operator: string;
  left: ASTExpressionNode;
  right: ASTExpressionNode;
}

export interface ASTUnaryExpression extends ASTNode {
  type: 'UnaryExpression';
  operator: string;
  operand: ASTExpressionNode;
  prefix: boolean;
}

export interface ASTTernaryExpression extends ASTNode {
  type: 'TernaryExpression';
  condition: ASTExpressionNode;
  consequent: ASTExpressionNode;
  alternate: ASTExpressionNode;
}

export interface ASTParenthesizedExpression extends ASTNode {
  type: 'ParenthesizedExpression';
  expression: ASTExpressionNode;
}

export type LiteralKind =
  | 'INTEGER'
  | 'DECIMAL'
  | 'CURRENCY'
  | 'PERCENTAGE'
  | 'BOOLEAN'
  | 'STRING'
  | 'DATE'
  | 'NULL';

export interface ASTLiteralExpression extends ASTNode {
  type: 'LiteralExpression';
  literalKind: LiteralKind;
  raw: string;
  value: TokenLiteralValue;
}

export interface ASTIdentifierExpression extends ASTNode {
  type: 'IdentifierExpression';
  name: string;
}

export interface ASTFunctionCallExpression extends ASTNode {
  type: 'FunctionCallExpression';
  callee: string;
  arguments: ASTExpressionNode[];
}

export interface ASTPolicyCallExpression extends ASTNode {
  type: 'PolicyCallExpression';
  policyName: string;
  arguments: ASTCallArgument[];
  returnBinding: string | null;
}

export interface ASTMemberExpression extends ASTNode {
  type: 'MemberExpression';
  object: ASTExpressionNode;
  property: string;
}

export interface ASTIndexExpression extends ASTNode {
  type: 'IndexExpression';
  object: ASTExpressionNode;
  index: ASTExpressionNode;
}

export interface ASTArrayLiteral extends ASTNode {
  type: 'ArrayLiteral';
  elements: ASTExpressionNode[];
}

export interface ASTObjectProperty extends ASTNode {
  type: 'ObjectProperty';
  key: string;
  value: ASTExpressionNode;
}

export interface ASTObjectLiteral extends ASTNode {
  type: 'ObjectLiteral';
  properties: ASTObjectProperty[];
}

export interface ASTBetweenExpression extends ASTNode {
  type: 'BetweenExpression';
  target: ASTExpressionNode;
  lower: ASTExpressionNode;
  upper: ASTExpressionNode;
}

export interface ASTInExpression extends ASTNode {
  type: 'InExpression';
  target: ASTExpressionNode;
  collection: ASTExpressionNode;
  negated: boolean;
}

export interface ASTNullCheckExpression extends ASTNode {
  type: 'NullCheckExpression';
  target: ASTExpressionNode;
  negated: boolean;
}

export type ASTExpressionNode =
  | ASTBinaryExpression
  | ASTUnaryExpression
  | ASTTernaryExpression
  | ASTParenthesizedExpression
  | ASTLiteralExpression
  | ASTIdentifierExpression
  | ASTFunctionCallExpression
  | ASTPolicyCallExpression
  | ASTMemberExpression
  | ASTIndexExpression
  | ASTArrayLiteral
  | ASTObjectLiteral
  | ASTBetweenExpression
  | ASTInExpression
  | ASTNullCheckExpression;
