/**
 * Financial Policy Language (FPL) — High-Level AST Builder
 *
 * Wraps `ASTFactory` with semantic builder methods for constructing Root,
 * Declaration, Statement, and Expression AST nodes cleanly from the
 * Recursive Descent Parser.
 */

import type { Token } from '../lexer/lexer.interface';
import { ASTFactory } from './ast-factory';
import type {
  ASTNode,
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
  ASTStatementNode,
  ASTAssignmentStatement,
  AssignmentOperator,
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
  ASTCallStatement,
  ASTCallArgument,
  ASTLogStatement,
  ASTAssertStatement,
  ASTThrowStatement,
  ASTBreakStatement,
  ASTContinueStatement,
  ASTDecisionStatement,
  ASTExpressionStatement,
  ASTExpressionNode,
  ASTBinaryExpression,
  BinaryCategory,
  ASTUnaryExpression,
  ASTTernaryExpression,
  ASTParenthesizedExpression,
  ASTLiteralExpression,
  LiteralKind,
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
} from './ast.interface';

export class ASTBuilder {
  public readonly factory: ASTFactory;

  constructor(fileName = 'workspace.fpl') {
    this.factory = new ASTFactory(fileName);
  }

  public reset(): void {
    this.factory.resetIdCounter();
  }

  // ─── Root & Declarations ──────────────────────────────────────────────────

  public buildProgram(
    params: {
      imports: ASTImportDeclaration[];
      constants: ASTConstantDeclaration[];
      variables: ASTVariableDeclaration[];
      functions: ASTFunctionDeclaration[];
      policies: ASTPolicyDeclaration[];
      rules: ASTRuleDeclaration[];
      statements: ASTStatementNode[];
    },
    startToken: Token,
    endToken: Token,
  ): ASTProgram {
    const children: ASTNode[] = [
      ...params.imports,
      ...params.constants,
      ...params.variables,
      ...params.functions,
      ...params.policies,
      ...params.rules,
      ...params.statements,
    ];

    return this.factory.createBaseNode<ASTProgram>(
      'Program',
      this.factory.createLocation(startToken, endToken),
      children,
      params,
    );
  }

  public buildImport(
    path: string,
    alias: string | null,
    startToken: Token,
    endToken: Token,
  ): ASTImportDeclaration {
    return this.factory.createBaseNode<ASTImportDeclaration>(
      'ImportDeclaration',
      this.factory.createLocation(startToken, endToken),
      [],
      { path, alias },
    );
  }

  public buildTypeAnnotation(
    typeName: string,
    isArray: boolean,
    elementType: string | null,
    startToken: Token,
    endToken: Token = startToken,
  ): ASTTypeAnnotation {
    return this.factory.createBaseNode<ASTTypeAnnotation>(
      'TypeAnnotation',
      this.factory.createLocation(startToken, endToken),
      [],
      { typeName, isArray, elementType },
    );
  }

  public buildParameter(
    name: string,
    typeAnnotation: ASTTypeAnnotation,
    startToken: Token,
    endToken: Token,
  ): ASTParameterDeclaration {
    return this.factory.createBaseNode<ASTParameterDeclaration>(
      'ParameterDeclaration',
      this.factory.createLocation(startToken, endToken),
      [typeAnnotation],
      { name, typeAnnotation },
    );
  }

  public buildConstantDeclaration(
    name: string,
    typeAnnotation: ASTTypeAnnotation | null,
    value: ASTExpressionNode,
    startToken: Token,
    endToken: Token,
  ): ASTConstantDeclaration {
    const children: ASTNode[] = [];
    if (typeAnnotation) children.push(typeAnnotation);
    children.push(value);

    return this.factory.createBaseNode<ASTConstantDeclaration>(
      'ConstantDeclaration',
      this.factory.createLocation(startToken, endToken),
      children,
      { name, typeAnnotation, value },
    );
  }

  public buildVariableDeclaration(
    kind: 'LET' | 'VAR',
    name: string,
    typeAnnotation: ASTTypeAnnotation | null,
    initializer: ASTExpressionNode | null,
    startToken: Token,
    endToken: Token,
  ): ASTVariableDeclaration {
    const children: ASTNode[] = [];
    if (typeAnnotation) children.push(typeAnnotation);
    if (initializer) children.push(initializer);

    return this.factory.createBaseNode<ASTVariableDeclaration>(
      'VariableDeclaration',
      this.factory.createLocation(startToken, endToken),
      children,
      {
        kind,
        isMutable: kind === 'VAR',
        name,
        typeAnnotation,
        initializer,
      },
    );
  }

  public buildFunctionDeclaration(
    name: string,
    parameters: ASTParameterDeclaration[],
    returnType: ASTTypeAnnotation | null,
    body: ASTStatementNode[],
    startToken: Token,
    endToken: Token,
  ): ASTFunctionDeclaration {
    const children: ASTNode[] = [...parameters];
    if (returnType) children.push(returnType);
    children.push(...body);

    return this.factory.createBaseNode<ASTFunctionDeclaration>(
      'FunctionDeclaration',
      this.factory.createLocation(startToken, endToken),
      children,
      { name, parameters, returnType, body },
    );
  }

  public buildInputBlock(
    parameters: ASTParameterDeclaration[],
    startToken: Token,
    endToken: Token,
  ): ASTInputBlock {
    return this.factory.createBaseNode<ASTInputBlock>(
      'InputBlock',
      this.factory.createLocation(startToken, endToken),
      [...parameters],
      { parameters },
    );
  }

  public buildOutputBlock(
    parameters: ASTParameterDeclaration[],
    startToken: Token,
    endToken: Token,
  ): ASTOutputBlock {
    return this.factory.createBaseNode<ASTOutputBlock>(
      'OutputBlock',
      this.factory.createLocation(startToken, endToken),
      [...parameters],
      { parameters },
    );
  }

  public buildWhenBlock(
    condition: ASTExpressionNode,
    startToken: Token,
    endToken: Token,
  ): ASTWhenBlock {
    return this.factory.createBaseNode<ASTWhenBlock>(
      'WhenBlock',
      this.factory.createLocation(startToken, endToken),
      [condition],
      { condition },
    );
  }

  public buildThenBlock(
    statements: ASTStatementNode[],
    startToken: Token,
    endToken: Token,
  ): ASTThenBlock {
    return this.factory.createBaseNode<ASTThenBlock>(
      'ThenBlock',
      this.factory.createLocation(startToken, endToken),
      [...statements],
      { statements },
    );
  }

  public buildElseBlock(
    statements: ASTStatementNode[],
    startToken: Token,
    endToken: Token,
  ): ASTElseBlock {
    return this.factory.createBaseNode<ASTElseBlock>(
      'ElseBlock',
      this.factory.createLocation(startToken, endToken),
      [...statements],
      { statements },
    );
  }

  public buildPolicyDeclaration(
    params: {
      name: string;
      inputBlock: ASTInputBlock | null;
      outputBlock: ASTOutputBlock | null;
      whenBlock: ASTWhenBlock | null;
      thenBlock: ASTThenBlock | null;
      elseBlock: ASTElseBlock | null;
      rules: ASTRuleDeclaration[];
    },
    startToken: Token,
    endToken: Token,
  ): ASTPolicyDeclaration {
    const children: ASTNode[] = [];
    if (params.inputBlock) children.push(params.inputBlock);
    if (params.outputBlock) children.push(params.outputBlock);
    if (params.whenBlock) children.push(params.whenBlock);
    if (params.thenBlock) children.push(params.thenBlock);
    if (params.elseBlock) children.push(params.elseBlock);
    children.push(...params.rules);

    return this.factory.createBaseNode<ASTPolicyDeclaration>(
      'PolicyDeclaration',
      this.factory.createLocation(startToken, endToken),
      children,
      params,
    );
  }

  public buildRuleDeclaration(
    name: string,
    condition: ASTExpressionNode | null,
    statements: ASTStatementNode[],
    startToken: Token,
    endToken: Token,
  ): ASTRuleDeclaration {
    const children: ASTNode[] = [];
    if (condition) children.push(condition);
    children.push(...statements);

    return this.factory.createBaseNode<ASTRuleDeclaration>(
      'RuleDeclaration',
      this.factory.createLocation(startToken, endToken),
      children,
      { name, condition, statements },
    );
  }

  // ─── Statement Builders ───────────────────────────────────────────────────

  public buildAssignmentStatement(
    target: ASTExpressionNode,
    operator: AssignmentOperator,
    value: ASTExpressionNode,
    startToken: Token,
    endToken: Token,
  ): ASTAssignmentStatement {
    return this.factory.createBaseNode<ASTAssignmentStatement>(
      'AssignmentStatement',
      this.factory.createLocation(startToken, endToken),
      [target, value],
      { target, operator, value },
    );
  }

  public buildSetStatement(
    target: ASTExpressionNode,
    operator: AssignmentOperator,
    value: ASTExpressionNode,
    startToken: Token,
    endToken: Token,
  ): ASTSetStatement {
    return this.factory.createBaseNode<ASTSetStatement>(
      'SetStatement',
      this.factory.createLocation(startToken, endToken),
      [target, value],
      { target, operator, value },
    );
  }

  public buildEmitStatement(
    target: string,
    value: ASTExpressionNode,
    startToken: Token,
    endToken: Token,
  ): ASTEmitStatement {
    return this.factory.createBaseNode<ASTEmitStatement>(
      'EmitStatement',
      this.factory.createLocation(startToken, endToken),
      [value],
      { target, value },
    );
  }

  public buildApplyStatement(
    ruleName: string,
    startToken: Token,
    endToken: Token,
  ): ASTApplyStatement {
    return this.factory.createBaseNode<ASTApplyStatement>(
      'ApplyStatement',
      this.factory.createLocation(startToken, endToken),
      [],
      { ruleName },
    );
  }

  public buildElseIfStatement(
    condition: ASTExpressionNode,
    consequent: ASTStatementNode[],
    startToken: Token,
    endToken: Token,
  ): ASTElseIfStatement {
    return this.factory.createBaseNode<ASTElseIfStatement>(
      'ElseIfStatement',
      this.factory.createLocation(startToken, endToken),
      [condition, ...consequent],
      { condition, consequent },
    );
  }

  public buildElseStatement(
    statements: ASTStatementNode[],
    startToken: Token,
    endToken: Token,
  ): ASTElseStatement {
    return this.factory.createBaseNode<ASTElseStatement>(
      'ElseStatement',
      this.factory.createLocation(startToken, endToken),
      [...statements],
      { statements },
    );
  }

  public buildIfStatement(
    condition: ASTExpressionNode,
    thenBranch: ASTStatementNode[],
    elseIfBranches: ASTElseIfStatement[],
    elseBranch: ASTElseStatement | null,
    startToken: Token,
    endToken: Token,
  ): ASTIfStatement {
    const children: ASTNode[] = [condition, ...thenBranch, ...elseIfBranches];
    if (elseBranch) children.push(elseBranch);

    return this.factory.createBaseNode<ASTIfStatement>(
      'IfStatement',
      this.factory.createLocation(startToken, endToken),
      children,
      { condition, thenBranch, elseIfBranches, elseBranch },
    );
  }

  public buildCaseClause(
    values: ASTExpressionNode[],
    statements: ASTStatementNode[],
    startToken: Token,
    endToken: Token,
  ): ASTCaseClause {
    return this.factory.createBaseNode<ASTCaseClause>(
      'CaseClause',
      this.factory.createLocation(startToken, endToken),
      [...values, ...statements],
      { values, statements },
    );
  }

  public buildDefaultClause(
    statements: ASTStatementNode[],
    startToken: Token,
    endToken: Token,
  ): ASTDefaultClause {
    return this.factory.createBaseNode<ASTDefaultClause>(
      'DefaultClause',
      this.factory.createLocation(startToken, endToken),
      [...statements],
      { statements },
    );
  }

  public buildMatchStatement(
    discriminant: ASTExpressionNode,
    cases: ASTCaseClause[],
    defaultCase: ASTDefaultClause | null,
    startToken: Token,
    endToken: Token,
  ): ASTMatchStatement {
    const children: ASTNode[] = [discriminant, ...cases];
    if (defaultCase) children.push(defaultCase);

    return this.factory.createBaseNode<ASTMatchStatement>(
      'MatchStatement',
      this.factory.createLocation(startToken, endToken),
      children,
      { discriminant, cases, defaultCase },
    );
  }

  public buildForStatement(
    iterator: string,
    start: ASTExpressionNode,
    end: ASTExpressionNode,
    step: ASTExpressionNode | null,
    body: ASTStatementNode[],
    startToken: Token,
    endToken: Token,
  ): ASTForStatement {
    const children: ASTNode[] = [start, end];
    if (step) children.push(step);
    children.push(...body);

    return this.factory.createBaseNode<ASTForStatement>(
      'ForStatement',
      this.factory.createLocation(startToken, endToken),
      children,
      { iterator, start, end, step, body },
    );
  }

  public buildWhileStatement(
    condition: ASTExpressionNode,
    body: ASTStatementNode[],
    startToken: Token,
    endToken: Token,
  ): ASTWhileStatement {
    return this.factory.createBaseNode<ASTWhileStatement>(
      'WhileStatement',
      this.factory.createLocation(startToken, endToken),
      [condition, ...body],
      { condition, body },
    );
  }

  public buildForeachStatement(
    iterator: string,
    collection: ASTExpressionNode,
    body: ASTStatementNode[],
    startToken: Token,
    endToken: Token,
  ): ASTForeachStatement {
    return this.factory.createBaseNode<ASTForeachStatement>(
      'ForeachStatement',
      this.factory.createLocation(startToken, endToken),
      [collection, ...body],
      { iterator, collection, body },
    );
  }

  public buildCatchClause(
    errorVariable: string | null,
    body: ASTStatementNode[],
    startToken: Token,
    endToken: Token,
  ): ASTCatchClause {
    return this.factory.createBaseNode<ASTCatchClause>(
      'CatchClause',
      this.factory.createLocation(startToken, endToken),
      [...body],
      { errorVariable, body },
    );
  }

  public buildTryStatement(
    tryBlock: ASTStatementNode[],
    catchClause: ASTCatchClause | null,
    startToken: Token,
    endToken: Token,
  ): ASTTryStatement {
    const children: ASTNode[] = [...tryBlock];
    if (catchClause) children.push(catchClause);

    return this.factory.createBaseNode<ASTTryStatement>(
      'TryStatement',
      this.factory.createLocation(startToken, endToken),
      children,
      { tryBlock, catchClause },
    );
  }

  public buildReturnStatement(
    value: ASTExpressionNode | null,
    startToken: Token,
    endToken: Token,
  ): ASTReturnStatement {
    return this.factory.createBaseNode<ASTReturnStatement>(
      'ReturnStatement',
      this.factory.createLocation(startToken, endToken),
      value ? [value] : [],
      { value },
    );
  }

  public buildCallStatement(
    callee: string,
    args: ASTCallArgument[],
    returnBinding: string | null,
    startToken: Token,
    endToken: Token,
  ): ASTCallStatement {
    const children = args.map((a) => a.value);
    return this.factory.createBaseNode<ASTCallStatement>(
      'CallStatement',
      this.factory.createLocation(startToken, endToken),
      children,
      { callee, arguments: args, returnBinding },
    );
  }

  public buildLogStatement(
    level: 'LOG' | 'WARN',
    expression: ASTExpressionNode,
    startToken: Token,
    endToken: Token,
  ): ASTLogStatement {
    return this.factory.createBaseNode<ASTLogStatement>(
      'LogStatement',
      this.factory.createLocation(startToken, endToken),
      [expression],
      { level, expression },
    );
  }

  public buildAssertStatement(
    condition: ASTExpressionNode,
    message: ASTExpressionNode | null,
    startToken: Token,
    endToken: Token,
  ): ASTAssertStatement {
    const children: ASTNode[] = [condition];
    if (message) children.push(message);
    return this.factory.createBaseNode<ASTAssertStatement>(
      'AssertStatement',
      this.factory.createLocation(startToken, endToken),
      children,
      { condition, message },
    );
  }

  public buildThrowStatement(
    errorCode: ASTExpressionNode,
    message: ASTExpressionNode | null,
    startToken: Token,
    endToken: Token,
  ): ASTThrowStatement {
    const children: ASTNode[] = [errorCode];
    if (message) children.push(message);
    return this.factory.createBaseNode<ASTThrowStatement>(
      'ThrowStatement',
      this.factory.createLocation(startToken, endToken),
      children,
      { errorCode, message },
    );
  }

  public buildBreakStatement(token: Token): ASTBreakStatement {
    return this.factory.createBaseNode<ASTBreakStatement>(
      'BreakStatement',
      this.factory.createLocation(token, token),
      [],
      {},
    );
  }

  public buildContinueStatement(token: Token): ASTContinueStatement {
    return this.factory.createBaseNode<ASTContinueStatement>(
      'ContinueStatement',
      this.factory.createLocation(token, token),
      [],
      {},
    );
  }

  public buildDecisionStatement(
    decision: 'ALLOW' | 'DENY' | 'REVIEW',
    reason: ASTExpressionNode | null,
    assignTo: ASTExpressionNode | null,
    startToken: Token,
    endToken: Token,
  ): ASTDecisionStatement {
    const type =
      decision === 'ALLOW'
        ? 'AllowStatement'
        : decision === 'DENY'
          ? 'DenyStatement'
          : 'ReviewStatement';
    const children: ASTNode[] = [];
    if (reason) children.push(reason);
    if (assignTo) children.push(assignTo);

    return this.factory.createBaseNode<ASTDecisionStatement>(
      type,
      this.factory.createLocation(startToken, endToken),
      children,
      { decision, reason, assignTo },
    );
  }

  public buildExpressionStatement(
    expression: ASTExpressionNode,
  ): ASTExpressionStatement {
    return this.factory.createBaseNode<ASTExpressionStatement>(
      'ExpressionStatement',
      expression.location,
      [expression],
      { expression },
    );
  }

  // ─── Expression Builders ──────────────────────────────────────────────────

  public buildBinaryExpression(
    category: BinaryCategory,
    operator: string,
    left: ASTExpressionNode,
    right: ASTExpressionNode,
  ): ASTBinaryExpression {
    const nodeType =
      category === 'ARITHMETIC'
        ? 'ArithmeticExpression'
        : category === 'COMPARISON'
          ? 'ComparisonExpression'
          : category === 'LOGICAL'
            ? 'LogicalExpression'
            : 'BinaryExpression';

    return this.factory.createBaseNode<ASTBinaryExpression>(
      nodeType,
      this.factory.createLocationFromNodes(left, right),
      [left, right],
      { category, operator, left, right },
    );
  }

  public buildUnaryExpression(
    operator: string,
    operand: ASTExpressionNode,
    startToken: Token,
  ): ASTUnaryExpression {
    const location = {
      file: startToken.fileName || operand.location.file,
      line: startToken.startPosition.line,
      column: startToken.startPosition.column,
      endLine: operand.location.endLine,
      endColumn: operand.location.endColumn,
      startOffset: startToken.startPosition.offset,
      endOffset: operand.location.endOffset,
    };

    return this.factory.createBaseNode<ASTUnaryExpression>(
      'UnaryExpression',
      location,
      [operand],
      { operator, operand, prefix: true },
    );
  }

  public buildTernaryExpression(
    condition: ASTExpressionNode,
    consequent: ASTExpressionNode,
    alternate: ASTExpressionNode,
    startToken: Token,
  ): ASTTernaryExpression {
    const location = {
      file: startToken.fileName || condition.location.file,
      line: startToken.startPosition.line,
      column: startToken.startPosition.column,
      endLine: alternate.location.endLine,
      endColumn: alternate.location.endColumn,
      startOffset: startToken.startPosition.offset,
      endOffset: alternate.location.endOffset,
    };

    return this.factory.createBaseNode<ASTTernaryExpression>(
      'TernaryExpression',
      location,
      [condition, consequent, alternate],
      { condition, consequent, alternate },
    );
  }

  public buildParenthesizedExpression(
    expression: ASTExpressionNode,
    startToken: Token,
    endToken: Token,
  ): ASTParenthesizedExpression {
    return this.factory.createBaseNode<ASTParenthesizedExpression>(
      'ParenthesizedExpression',
      this.factory.createLocation(startToken, endToken),
      [expression],
      { expression },
    );
  }

  public buildLiteralExpression(
    literalKind: LiteralKind,
    token: Token,
  ): ASTLiteralExpression {
    return this.factory.createBaseNode<ASTLiteralExpression>(
      'LiteralExpression',
      this.factory.createLocation(token, token),
      [],
      {
        literalKind,
        raw: token.lexeme,
        value: token.literal,
      },
    );
  }

  public buildIdentifierExpression(token: Token): ASTIdentifierExpression {
    return this.factory.createBaseNode<ASTIdentifierExpression>(
      'IdentifierExpression',
      this.factory.createLocation(token, token),
      [],
      { name: token.lexeme },
    );
  }

  public buildFunctionCallExpression(
    callee: string,
    args: ASTExpressionNode[],
    startToken: Token,
    endToken: Token,
  ): ASTFunctionCallExpression {
    return this.factory.createBaseNode<ASTFunctionCallExpression>(
      'FunctionCallExpression',
      this.factory.createLocation(startToken, endToken),
      [...args],
      { callee, arguments: args },
    );
  }

  public buildPolicyCallExpression(
    policyName: string,
    args: ASTCallArgument[],
    returnBinding: string | null,
    startToken: Token,
    endToken: Token,
  ): ASTPolicyCallExpression {
    const children = args.map((a) => a.value);
    return this.factory.createBaseNode<ASTPolicyCallExpression>(
      'PolicyCallExpression',
      this.factory.createLocation(startToken, endToken),
      children,
      { policyName, arguments: args, returnBinding },
    );
  }

  public buildMemberExpression(
    object: ASTExpressionNode,
    propertyToken: Token,
  ): ASTMemberExpression {
    const location = {
      file: object.location.file,
      line: object.location.line,
      column: object.location.column,
      endLine: propertyToken.endPosition.line,
      endColumn: propertyToken.endPosition.column,
      startOffset: object.location.startOffset,
      endOffset: propertyToken.endPosition.offset,
    };

    return this.factory.createBaseNode<ASTMemberExpression>(
      'MemberExpression',
      location,
      [object],
      { object, property: propertyToken.lexeme },
    );
  }

  public buildIndexExpression(
    object: ASTExpressionNode,
    index: ASTExpressionNode,
    endToken: Token,
  ): ASTIndexExpression {
    const location = {
      file: object.location.file,
      line: object.location.line,
      column: object.location.column,
      endLine: endToken.endPosition.line,
      endColumn: endToken.endPosition.column,
      startOffset: object.location.startOffset,
      endOffset: endToken.endPosition.offset,
    };

    return this.factory.createBaseNode<ASTIndexExpression>(
      'IndexExpression',
      location,
      [object, index],
      { object, index },
    );
  }

  public buildArrayLiteral(
    elements: ASTExpressionNode[],
    startToken: Token,
    endToken: Token,
  ): ASTArrayLiteral {
    return this.factory.createBaseNode<ASTArrayLiteral>(
      'ArrayLiteral',
      this.factory.createLocation(startToken, endToken),
      [...elements],
      { elements },
    );
  }

  public buildObjectProperty(
    key: string,
    value: ASTExpressionNode,
    startToken: Token,
  ): ASTObjectProperty {
    const location = {
      file: startToken.fileName,
      line: startToken.startPosition.line,
      column: startToken.startPosition.column,
      endLine: value.location.endLine,
      endColumn: value.location.endColumn,
      startOffset: startToken.startPosition.offset,
      endOffset: value.location.endOffset,
    };

    return this.factory.createBaseNode<ASTObjectProperty>(
      'ObjectProperty',
      location,
      [value],
      { key, value },
    );
  }

  public buildObjectLiteral(
    properties: ASTObjectProperty[],
    startToken: Token,
    endToken: Token,
  ): ASTObjectLiteral {
    return this.factory.createBaseNode<ASTObjectLiteral>(
      'ObjectLiteral',
      this.factory.createLocation(startToken, endToken),
      [...properties],
      { properties },
    );
  }

  public buildBetweenExpression(
    target: ASTExpressionNode,
    lower: ASTExpressionNode,
    upper: ASTExpressionNode,
  ): ASTBetweenExpression {
    return this.factory.createBaseNode<ASTBetweenExpression>(
      'BetweenExpression',
      this.factory.createLocationFromNodes(target, upper),
      [target, lower, upper],
      { target, lower, upper },
    );
  }

  public buildInExpression(
    target: ASTExpressionNode,
    collection: ASTExpressionNode,
    negated: boolean,
  ): ASTInExpression {
    return this.factory.createBaseNode<ASTInExpression>(
      'InExpression',
      this.factory.createLocationFromNodes(target, collection),
      [target, collection],
      { target, collection, negated },
    );
  }

  public buildNullCheckExpression(
    target: ASTExpressionNode,
    negated: boolean,
    endToken: Token,
  ): ASTNullCheckExpression {
    const location = {
      file: target.location.file,
      line: target.location.line,
      column: target.location.column,
      endLine: endToken.endPosition.line,
      endColumn: endToken.endPosition.column,
      startOffset: target.location.startOffset,
      endOffset: endToken.endPosition.offset,
    };

    return this.factory.createBaseNode<ASTNullCheckExpression>(
      'NullCheckExpression',
      location,
      [target],
      { target, negated },
    );
  }
}
