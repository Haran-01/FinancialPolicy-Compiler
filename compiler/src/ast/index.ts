/**
 * @finpolicy/compiler — AST Module Barrel Exports
 */

export type {
  ASTNodeType,
  ASTPosition,
  ASTSourceLocation,
  ASTNode,
  IASTNode,
  ASTProgram,
  ASTImportDeclaration,
  ASTTypeAnnotation,
  ASTParameterDeclaration,
  ASTConstantDeclaration,
  ASTVariableDeclaration,
  ASTFunctionDeclaration,
  ASTInputBlock,
  ASTOutputBlock,
  ASTWhenBlock,
  ASTThenBlock,
  ASTElseBlock,
  ASTPolicyDeclaration,
  ASTRuleDeclaration,
  AssignmentOperator,
  ASTAssignmentStatement,
  ASTSetStatement,
  ASTEmitStatement,
  ASTApplyStatement,
  ASTIfStatement,
  ASTElseIfStatement,
  ASTElseStatement,
  ASTMatchStatement,
  ASTCaseClause,
  ASTDefaultClause,
  ASTForStatement,
  ASTWhileStatement,
  ASTForeachStatement,
  ASTTryStatement,
  ASTCatchClause,
  ASTReturnStatement,
  ASTCallArgument,
  ASTCallStatement,
  ASTLogStatement,
  ASTAssertStatement,
  ASTThrowStatement,
  ASTBreakStatement,
  ASTContinueStatement,
  ASTDecisionStatement,
  ASTExpressionStatement,
  ASTStatementNode,
  BinaryCategory,
  ASTBinaryExpression,
  ASTUnaryExpression,
  ASTTernaryExpression,
  ASTParenthesizedExpression,
  LiteralKind,
  ASTLiteralExpression,
  ASTIdentifierExpression,
  ASTFunctionCallExpression,
  ASTPolicyCallExpression,
  ASTMemberExpression,
  ASTIndexExpression,
  ASTArrayLiteral,
  ASTObjectProperty,
  ASTObjectLiteral,
  ASTBetweenExpression,
  ASTInExpression,
  ASTNullCheckExpression,
  ASTExpressionNode,
} from './ast.interface';

export { ASTFactory } from './ast-factory';
export { ASTBuilder } from './ast-builder';
export { BaseASTVisitor } from './ast-visitor';
export type { ASTVisitor } from './ast-visitor';
export { ASTPrettyPrinter } from './ast-pretty-printer';
export type {
  ASTGraphNode,
  ASTGraphEdge,
  ASTGraphRepresentation,
} from './ast-pretty-printer';
export { ASTRepository } from './ast-repository';
export type { ASTRepositoryMetadata } from './ast-repository';
