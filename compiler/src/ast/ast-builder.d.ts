/**
 * Financial Policy Language (FPL) — High-Level AST Builder
 *
 * Wraps `ASTFactory` with semantic builder methods for constructing Root,
 * Declaration, Statement, and Expression AST nodes cleanly from the
 * Recursive Descent Parser.
 */
import type { Token } from '../lexer/lexer.interface';
import { ASTFactory } from './ast-factory';
import type { ASTProgram, ASTImportDeclaration, ASTTypeAnnotation, ASTParameterDeclaration, ASTConstantDeclaration, ASTVariableDeclaration, ASTFunctionDeclaration, ASTInputBlock, ASTOutputBlock, ASTWhenBlock, ASTThenBlock, ASTElseBlock, ASTPolicyDeclaration, ASTRuleDeclaration, ASTStatementNode, ASTAssignmentStatement, AssignmentOperator, ASTSetStatement, ASTEmitStatement, ASTApplyStatement, ASTIfStatement, ASTElseIfStatement, ASTElseStatement, ASTMatchStatement, ASTCaseClause, ASTDefaultClause, ASTForStatement, ASTWhileStatement, ASTForeachStatement, ASTTryStatement, ASTCatchClause, ASTReturnStatement, ASTCallStatement, ASTCallArgument, ASTLogStatement, ASTAssertStatement, ASTThrowStatement, ASTBreakStatement, ASTContinueStatement, ASTDecisionStatement, ASTExpressionStatement, ASTExpressionNode, ASTBinaryExpression, BinaryCategory, ASTUnaryExpression, ASTTernaryExpression, ASTParenthesizedExpression, ASTLiteralExpression, LiteralKind, ASTIdentifierExpression, ASTFunctionCallExpression, ASTPolicyCallExpression, ASTMemberExpression, ASTIndexExpression, ASTArrayLiteral, ASTObjectProperty, ASTObjectLiteral, ASTBetweenExpression, ASTInExpression, ASTNullCheckExpression } from './ast.interface';
export declare class ASTBuilder {
    readonly factory: ASTFactory;
    constructor(fileName?: string);
    reset(): void;
    buildProgram(params: {
        imports: ASTImportDeclaration[];
        constants: ASTConstantDeclaration[];
        variables: ASTVariableDeclaration[];
        functions: ASTFunctionDeclaration[];
        policies: ASTPolicyDeclaration[];
        rules: ASTRuleDeclaration[];
        statements: ASTStatementNode[];
    }, startToken: Token, endToken: Token): ASTProgram;
    buildImport(path: string, alias: string | null, startToken: Token, endToken: Token): ASTImportDeclaration;
    buildTypeAnnotation(typeName: string, isArray: boolean, elementType: string | null, startToken: Token, endToken?: Token): ASTTypeAnnotation;
    buildParameter(name: string, typeAnnotation: ASTTypeAnnotation, startToken: Token, endToken: Token): ASTParameterDeclaration;
    buildConstantDeclaration(name: string, typeAnnotation: ASTTypeAnnotation | null, value: ASTExpressionNode, startToken: Token, endToken: Token): ASTConstantDeclaration;
    buildVariableDeclaration(kind: 'LET' | 'VAR', name: string, typeAnnotation: ASTTypeAnnotation | null, initializer: ASTExpressionNode | null, startToken: Token, endToken: Token): ASTVariableDeclaration;
    buildFunctionDeclaration(name: string, parameters: ASTParameterDeclaration[], returnType: ASTTypeAnnotation | null, body: ASTStatementNode[], startToken: Token, endToken: Token): ASTFunctionDeclaration;
    buildInputBlock(parameters: ASTParameterDeclaration[], startToken: Token, endToken: Token): ASTInputBlock;
    buildOutputBlock(parameters: ASTParameterDeclaration[], startToken: Token, endToken: Token): ASTOutputBlock;
    buildWhenBlock(condition: ASTExpressionNode, startToken: Token, endToken: Token): ASTWhenBlock;
    buildThenBlock(statements: ASTStatementNode[], startToken: Token, endToken: Token): ASTThenBlock;
    buildElseBlock(statements: ASTStatementNode[], startToken: Token, endToken: Token): ASTElseBlock;
    buildPolicyDeclaration(params: {
        name: string;
        inputBlock: ASTInputBlock | null;
        outputBlock: ASTOutputBlock | null;
        whenBlock: ASTWhenBlock | null;
        thenBlock: ASTThenBlock | null;
        elseBlock: ASTElseBlock | null;
        rules: ASTRuleDeclaration[];
    }, startToken: Token, endToken: Token): ASTPolicyDeclaration;
    buildRuleDeclaration(name: string, condition: ASTExpressionNode | null, statements: ASTStatementNode[], startToken: Token, endToken: Token): ASTRuleDeclaration;
    buildAssignmentStatement(target: ASTExpressionNode, operator: AssignmentOperator, value: ASTExpressionNode, startToken: Token, endToken: Token): ASTAssignmentStatement;
    buildSetStatement(target: ASTExpressionNode, operator: AssignmentOperator, value: ASTExpressionNode, startToken: Token, endToken: Token): ASTSetStatement;
    buildEmitStatement(target: string, value: ASTExpressionNode, startToken: Token, endToken: Token): ASTEmitStatement;
    buildApplyStatement(ruleName: string, startToken: Token, endToken: Token): ASTApplyStatement;
    buildElseIfStatement(condition: ASTExpressionNode, consequent: ASTStatementNode[], startToken: Token, endToken: Token): ASTElseIfStatement;
    buildElseStatement(statements: ASTStatementNode[], startToken: Token, endToken: Token): ASTElseStatement;
    buildIfStatement(condition: ASTExpressionNode, thenBranch: ASTStatementNode[], elseIfBranches: ASTElseIfStatement[], elseBranch: ASTElseStatement | null, startToken: Token, endToken: Token): ASTIfStatement;
    buildCaseClause(values: ASTExpressionNode[], statements: ASTStatementNode[], startToken: Token, endToken: Token): ASTCaseClause;
    buildDefaultClause(statements: ASTStatementNode[], startToken: Token, endToken: Token): ASTDefaultClause;
    buildMatchStatement(discriminant: ASTExpressionNode, cases: ASTCaseClause[], defaultCase: ASTDefaultClause | null, startToken: Token, endToken: Token): ASTMatchStatement;
    buildForStatement(iterator: string, start: ASTExpressionNode, end: ASTExpressionNode, step: ASTExpressionNode | null, body: ASTStatementNode[], startToken: Token, endToken: Token): ASTForStatement;
    buildWhileStatement(condition: ASTExpressionNode, body: ASTStatementNode[], startToken: Token, endToken: Token): ASTWhileStatement;
    buildForeachStatement(iterator: string, collection: ASTExpressionNode, body: ASTStatementNode[], startToken: Token, endToken: Token): ASTForeachStatement;
    buildCatchClause(errorVariable: string | null, body: ASTStatementNode[], startToken: Token, endToken: Token): ASTCatchClause;
    buildTryStatement(tryBlock: ASTStatementNode[], catchClause: ASTCatchClause | null, startToken: Token, endToken: Token): ASTTryStatement;
    buildReturnStatement(value: ASTExpressionNode | null, startToken: Token, endToken: Token): ASTReturnStatement;
    buildCallStatement(callee: string, args: ASTCallArgument[], returnBinding: string | null, startToken: Token, endToken: Token): ASTCallStatement;
    buildLogStatement(level: 'LOG' | 'WARN', expression: ASTExpressionNode, startToken: Token, endToken: Token): ASTLogStatement;
    buildAssertStatement(condition: ASTExpressionNode, message: ASTExpressionNode | null, startToken: Token, endToken: Token): ASTAssertStatement;
    buildThrowStatement(errorCode: ASTExpressionNode, message: ASTExpressionNode | null, startToken: Token, endToken: Token): ASTThrowStatement;
    buildBreakStatement(token: Token): ASTBreakStatement;
    buildContinueStatement(token: Token): ASTContinueStatement;
    buildDecisionStatement(decision: 'ALLOW' | 'DENY' | 'REVIEW', reason: ASTExpressionNode | null, assignTo: ASTExpressionNode | null, startToken: Token, endToken: Token): ASTDecisionStatement;
    buildExpressionStatement(expression: ASTExpressionNode): ASTExpressionStatement;
    buildBinaryExpression(category: BinaryCategory, operator: string, left: ASTExpressionNode, right: ASTExpressionNode): ASTBinaryExpression;
    buildUnaryExpression(operator: string, operand: ASTExpressionNode, startToken: Token): ASTUnaryExpression;
    buildTernaryExpression(condition: ASTExpressionNode, consequent: ASTExpressionNode, alternate: ASTExpressionNode, startToken: Token): ASTTernaryExpression;
    buildParenthesizedExpression(expression: ASTExpressionNode, startToken: Token, endToken: Token): ASTParenthesizedExpression;
    buildLiteralExpression(literalKind: LiteralKind, token: Token): ASTLiteralExpression;
    buildIdentifierExpression(token: Token): ASTIdentifierExpression;
    buildFunctionCallExpression(callee: string, args: ASTExpressionNode[], startToken: Token, endToken: Token): ASTFunctionCallExpression;
    buildPolicyCallExpression(policyName: string, args: ASTCallArgument[], returnBinding: string | null, startToken: Token, endToken: Token): ASTPolicyCallExpression;
    buildMemberExpression(object: ASTExpressionNode, propertyToken: Token): ASTMemberExpression;
    buildIndexExpression(object: ASTExpressionNode, index: ASTExpressionNode, endToken: Token): ASTIndexExpression;
    buildArrayLiteral(elements: ASTExpressionNode[], startToken: Token, endToken: Token): ASTArrayLiteral;
    buildObjectProperty(key: string, value: ASTExpressionNode, startToken: Token): ASTObjectProperty;
    buildObjectLiteral(properties: ASTObjectProperty[], startToken: Token, endToken: Token): ASTObjectLiteral;
    buildBetweenExpression(target: ASTExpressionNode, lower: ASTExpressionNode, upper: ASTExpressionNode): ASTBetweenExpression;
    buildInExpression(target: ASTExpressionNode, collection: ASTExpressionNode, negated: boolean): ASTInExpression;
    buildNullCheckExpression(target: ASTExpressionNode, negated: boolean, endToken: Token): ASTNullCheckExpression;
}
//# sourceMappingURL=ast-builder.d.ts.map