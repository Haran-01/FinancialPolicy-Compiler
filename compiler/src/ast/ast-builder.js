"use strict";
/**
 * Financial Policy Language (FPL) — High-Level AST Builder
 *
 * Wraps `ASTFactory` with semantic builder methods for constructing Root,
 * Declaration, Statement, and Expression AST nodes cleanly from the
 * Recursive Descent Parser.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTBuilder = void 0;
const ast_factory_1 = require("./ast-factory");
class ASTBuilder {
    factory;
    constructor(fileName = 'workspace.fpl') {
        this.factory = new ast_factory_1.ASTFactory(fileName);
    }
    reset() {
        this.factory.resetIdCounter();
    }
    // ─── Root & Declarations ──────────────────────────────────────────────────
    buildProgram(params, startToken, endToken) {
        const children = [
            ...params.imports,
            ...params.constants,
            ...params.variables,
            ...params.functions,
            ...params.policies,
            ...params.rules,
            ...params.statements,
        ];
        return this.factory.createBaseNode('Program', this.factory.createLocation(startToken, endToken), children, params);
    }
    buildImport(path, alias, startToken, endToken) {
        return this.factory.createBaseNode('ImportDeclaration', this.factory.createLocation(startToken, endToken), [], { path, alias });
    }
    buildTypeAnnotation(typeName, isArray, elementType, startToken, endToken = startToken) {
        return this.factory.createBaseNode('TypeAnnotation', this.factory.createLocation(startToken, endToken), [], { typeName, isArray, elementType });
    }
    buildParameter(name, typeAnnotation, startToken, endToken) {
        return this.factory.createBaseNode('ParameterDeclaration', this.factory.createLocation(startToken, endToken), [typeAnnotation], { name, typeAnnotation });
    }
    buildConstantDeclaration(name, typeAnnotation, value, startToken, endToken) {
        const children = [];
        if (typeAnnotation)
            children.push(typeAnnotation);
        children.push(value);
        return this.factory.createBaseNode('ConstantDeclaration', this.factory.createLocation(startToken, endToken), children, { name, typeAnnotation, value });
    }
    buildVariableDeclaration(kind, name, typeAnnotation, initializer, startToken, endToken) {
        const children = [];
        if (typeAnnotation)
            children.push(typeAnnotation);
        if (initializer)
            children.push(initializer);
        return this.factory.createBaseNode('VariableDeclaration', this.factory.createLocation(startToken, endToken), children, {
            kind,
            isMutable: kind === 'VAR',
            name,
            typeAnnotation,
            initializer,
        });
    }
    buildFunctionDeclaration(name, parameters, returnType, body, startToken, endToken) {
        const children = [...parameters];
        if (returnType)
            children.push(returnType);
        children.push(...body);
        return this.factory.createBaseNode('FunctionDeclaration', this.factory.createLocation(startToken, endToken), children, { name, parameters, returnType, body });
    }
    buildInputBlock(parameters, startToken, endToken) {
        return this.factory.createBaseNode('InputBlock', this.factory.createLocation(startToken, endToken), [...parameters], { parameters });
    }
    buildOutputBlock(parameters, startToken, endToken) {
        return this.factory.createBaseNode('OutputBlock', this.factory.createLocation(startToken, endToken), [...parameters], { parameters });
    }
    buildWhenBlock(condition, startToken, endToken) {
        return this.factory.createBaseNode('WhenBlock', this.factory.createLocation(startToken, endToken), [condition], { condition });
    }
    buildThenBlock(statements, startToken, endToken) {
        return this.factory.createBaseNode('ThenBlock', this.factory.createLocation(startToken, endToken), [...statements], { statements });
    }
    buildElseBlock(statements, startToken, endToken) {
        return this.factory.createBaseNode('ElseBlock', this.factory.createLocation(startToken, endToken), [...statements], { statements });
    }
    buildPolicyDeclaration(params, startToken, endToken) {
        const children = [];
        if (params.inputBlock)
            children.push(params.inputBlock);
        if (params.outputBlock)
            children.push(params.outputBlock);
        if (params.whenBlock)
            children.push(params.whenBlock);
        if (params.thenBlock)
            children.push(params.thenBlock);
        if (params.elseBlock)
            children.push(params.elseBlock);
        children.push(...params.rules);
        return this.factory.createBaseNode('PolicyDeclaration', this.factory.createLocation(startToken, endToken), children, params);
    }
    buildRuleDeclaration(name, condition, statements, startToken, endToken) {
        const children = [];
        if (condition)
            children.push(condition);
        children.push(...statements);
        return this.factory.createBaseNode('RuleDeclaration', this.factory.createLocation(startToken, endToken), children, { name, condition, statements });
    }
    // ─── Statement Builders ───────────────────────────────────────────────────
    buildAssignmentStatement(target, operator, value, startToken, endToken) {
        return this.factory.createBaseNode('AssignmentStatement', this.factory.createLocation(startToken, endToken), [target, value], { target, operator, value });
    }
    buildSetStatement(target, operator, value, startToken, endToken) {
        return this.factory.createBaseNode('SetStatement', this.factory.createLocation(startToken, endToken), [target, value], { target, operator, value });
    }
    buildEmitStatement(target, value, startToken, endToken) {
        return this.factory.createBaseNode('EmitStatement', this.factory.createLocation(startToken, endToken), [value], { target, value });
    }
    buildApplyStatement(ruleName, startToken, endToken) {
        return this.factory.createBaseNode('ApplyStatement', this.factory.createLocation(startToken, endToken), [], { ruleName });
    }
    buildElseIfStatement(condition, consequent, startToken, endToken) {
        return this.factory.createBaseNode('ElseIfStatement', this.factory.createLocation(startToken, endToken), [condition, ...consequent], { condition, consequent });
    }
    buildElseStatement(statements, startToken, endToken) {
        return this.factory.createBaseNode('ElseStatement', this.factory.createLocation(startToken, endToken), [...statements], { statements });
    }
    buildIfStatement(condition, thenBranch, elseIfBranches, elseBranch, startToken, endToken) {
        const children = [condition, ...thenBranch, ...elseIfBranches];
        if (elseBranch)
            children.push(elseBranch);
        return this.factory.createBaseNode('IfStatement', this.factory.createLocation(startToken, endToken), children, { condition, thenBranch, elseIfBranches, elseBranch });
    }
    buildCaseClause(values, statements, startToken, endToken) {
        return this.factory.createBaseNode('CaseClause', this.factory.createLocation(startToken, endToken), [...values, ...statements], { values, statements });
    }
    buildDefaultClause(statements, startToken, endToken) {
        return this.factory.createBaseNode('DefaultClause', this.factory.createLocation(startToken, endToken), [...statements], { statements });
    }
    buildMatchStatement(discriminant, cases, defaultCase, startToken, endToken) {
        const children = [discriminant, ...cases];
        if (defaultCase)
            children.push(defaultCase);
        return this.factory.createBaseNode('MatchStatement', this.factory.createLocation(startToken, endToken), children, { discriminant, cases, defaultCase });
    }
    buildForStatement(iterator, start, end, step, body, startToken, endToken) {
        const children = [start, end];
        if (step)
            children.push(step);
        children.push(...body);
        return this.factory.createBaseNode('ForStatement', this.factory.createLocation(startToken, endToken), children, { iterator, start, end, step, body });
    }
    buildWhileStatement(condition, body, startToken, endToken) {
        return this.factory.createBaseNode('WhileStatement', this.factory.createLocation(startToken, endToken), [condition, ...body], { condition, body });
    }
    buildForeachStatement(iterator, collection, body, startToken, endToken) {
        return this.factory.createBaseNode('ForeachStatement', this.factory.createLocation(startToken, endToken), [collection, ...body], { iterator, collection, body });
    }
    buildCatchClause(errorVariable, body, startToken, endToken) {
        return this.factory.createBaseNode('CatchClause', this.factory.createLocation(startToken, endToken), [...body], { errorVariable, body });
    }
    buildTryStatement(tryBlock, catchClause, startToken, endToken) {
        const children = [...tryBlock];
        if (catchClause)
            children.push(catchClause);
        return this.factory.createBaseNode('TryStatement', this.factory.createLocation(startToken, endToken), children, { tryBlock, catchClause });
    }
    buildReturnStatement(value, startToken, endToken) {
        return this.factory.createBaseNode('ReturnStatement', this.factory.createLocation(startToken, endToken), value ? [value] : [], { value });
    }
    buildCallStatement(callee, args, returnBinding, startToken, endToken) {
        const children = args.map((a) => a.value);
        return this.factory.createBaseNode('CallStatement', this.factory.createLocation(startToken, endToken), children, { callee, arguments: args, returnBinding });
    }
    buildLogStatement(level, expression, startToken, endToken) {
        return this.factory.createBaseNode('LogStatement', this.factory.createLocation(startToken, endToken), [expression], { level, expression });
    }
    buildAssertStatement(condition, message, startToken, endToken) {
        const children = [condition];
        if (message)
            children.push(message);
        return this.factory.createBaseNode('AssertStatement', this.factory.createLocation(startToken, endToken), children, { condition, message });
    }
    buildThrowStatement(errorCode, message, startToken, endToken) {
        const children = [errorCode];
        if (message)
            children.push(message);
        return this.factory.createBaseNode('ThrowStatement', this.factory.createLocation(startToken, endToken), children, { errorCode, message });
    }
    buildBreakStatement(token) {
        return this.factory.createBaseNode('BreakStatement', this.factory.createLocation(token, token), [], {});
    }
    buildContinueStatement(token) {
        return this.factory.createBaseNode('ContinueStatement', this.factory.createLocation(token, token), [], {});
    }
    buildDecisionStatement(decision, reason, assignTo, startToken, endToken) {
        const type = decision === 'ALLOW'
            ? 'AllowStatement'
            : decision === 'DENY'
                ? 'DenyStatement'
                : 'ReviewStatement';
        const children = [];
        if (reason)
            children.push(reason);
        if (assignTo)
            children.push(assignTo);
        return this.factory.createBaseNode(type, this.factory.createLocation(startToken, endToken), children, { decision, reason, assignTo });
    }
    buildExpressionStatement(expression) {
        return this.factory.createBaseNode('ExpressionStatement', expression.location, [expression], { expression });
    }
    // ─── Expression Builders ──────────────────────────────────────────────────
    buildBinaryExpression(category, operator, left, right) {
        const nodeType = category === 'ARITHMETIC'
            ? 'ArithmeticExpression'
            : category === 'COMPARISON'
                ? 'ComparisonExpression'
                : category === 'LOGICAL'
                    ? 'LogicalExpression'
                    : 'BinaryExpression';
        return this.factory.createBaseNode(nodeType, this.factory.createLocationFromNodes(left, right), [left, right], { category, operator, left, right });
    }
    buildUnaryExpression(operator, operand, startToken) {
        const location = {
            file: startToken.fileName || operand.location.file,
            line: startToken.startPosition.line,
            column: startToken.startPosition.column,
            endLine: operand.location.endLine,
            endColumn: operand.location.endColumn,
            startOffset: startToken.startPosition.offset,
            endOffset: operand.location.endOffset,
        };
        return this.factory.createBaseNode('UnaryExpression', location, [operand], { operator, operand, prefix: true });
    }
    buildTernaryExpression(condition, consequent, alternate, startToken) {
        const location = {
            file: startToken.fileName || condition.location.file,
            line: startToken.startPosition.line,
            column: startToken.startPosition.column,
            endLine: alternate.location.endLine,
            endColumn: alternate.location.endColumn,
            startOffset: startToken.startPosition.offset,
            endOffset: alternate.location.endOffset,
        };
        return this.factory.createBaseNode('TernaryExpression', location, [condition, consequent, alternate], { condition, consequent, alternate });
    }
    buildParenthesizedExpression(expression, startToken, endToken) {
        return this.factory.createBaseNode('ParenthesizedExpression', this.factory.createLocation(startToken, endToken), [expression], { expression });
    }
    buildLiteralExpression(literalKind, token) {
        return this.factory.createBaseNode('LiteralExpression', this.factory.createLocation(token, token), [], {
            literalKind,
            raw: token.lexeme,
            value: token.literal,
        });
    }
    buildIdentifierExpression(token) {
        return this.factory.createBaseNode('IdentifierExpression', this.factory.createLocation(token, token), [], { name: token.lexeme });
    }
    buildFunctionCallExpression(callee, args, startToken, endToken) {
        return this.factory.createBaseNode('FunctionCallExpression', this.factory.createLocation(startToken, endToken), [...args], { callee, arguments: args });
    }
    buildPolicyCallExpression(policyName, args, returnBinding, startToken, endToken) {
        const children = args.map((a) => a.value);
        return this.factory.createBaseNode('PolicyCallExpression', this.factory.createLocation(startToken, endToken), children, { policyName, arguments: args, returnBinding });
    }
    buildMemberExpression(object, propertyToken) {
        const location = {
            file: object.location.file,
            line: object.location.line,
            column: object.location.column,
            endLine: propertyToken.endPosition.line,
            endColumn: propertyToken.endPosition.column,
            startOffset: object.location.startOffset,
            endOffset: propertyToken.endPosition.offset,
        };
        return this.factory.createBaseNode('MemberExpression', location, [object], { object, property: propertyToken.lexeme });
    }
    buildIndexExpression(object, index, endToken) {
        const location = {
            file: object.location.file,
            line: object.location.line,
            column: object.location.column,
            endLine: endToken.endPosition.line,
            endColumn: endToken.endPosition.column,
            startOffset: object.location.startOffset,
            endOffset: endToken.endPosition.offset,
        };
        return this.factory.createBaseNode('IndexExpression', location, [object, index], { object, index });
    }
    buildArrayLiteral(elements, startToken, endToken) {
        return this.factory.createBaseNode('ArrayLiteral', this.factory.createLocation(startToken, endToken), [...elements], { elements });
    }
    buildObjectProperty(key, value, startToken) {
        const location = {
            file: startToken.fileName,
            line: startToken.startPosition.line,
            column: startToken.startPosition.column,
            endLine: value.location.endLine,
            endColumn: value.location.endColumn,
            startOffset: startToken.startPosition.offset,
            endOffset: value.location.endOffset,
        };
        return this.factory.createBaseNode('ObjectProperty', location, [value], { key, value });
    }
    buildObjectLiteral(properties, startToken, endToken) {
        return this.factory.createBaseNode('ObjectLiteral', this.factory.createLocation(startToken, endToken), [...properties], { properties });
    }
    buildBetweenExpression(target, lower, upper) {
        return this.factory.createBaseNode('BetweenExpression', this.factory.createLocationFromNodes(target, upper), [target, lower, upper], { target, lower, upper });
    }
    buildInExpression(target, collection, negated) {
        return this.factory.createBaseNode('InExpression', this.factory.createLocationFromNodes(target, collection), [target, collection], { target, collection, negated });
    }
    buildNullCheckExpression(target, negated, endToken) {
        const location = {
            file: target.location.file,
            line: target.location.line,
            column: target.location.column,
            endLine: endToken.endPosition.line,
            endColumn: endToken.endPosition.column,
            startOffset: target.location.startOffset,
            endOffset: endToken.endPosition.offset,
        };
        return this.factory.createBaseNode('NullCheckExpression', location, [target], { target, negated });
    }
}
exports.ASTBuilder = ASTBuilder;
//# sourceMappingURL=ast-builder.js.map