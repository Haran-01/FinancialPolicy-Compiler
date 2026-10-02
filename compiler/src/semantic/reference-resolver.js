"use strict";
/**
 * Financial Policy Language (FPL) — Reference, Policy, Function & Constant Resolvers
 *
 * Dedicated resolver classes adhering to Single Responsibility Principle:
 * - `ConstantResolver`: Evaluates compile-time constant expressions and resolves `CONST` references
 * - `FunctionResolver`: Resolves user-defined and built-in function calls and validates parameter types
 * - `PolicyResolver`: Resolves policy declarations, imported policies, and validates `CALL` inputs
 * - `ReferenceResolver`: Resolves variables, parameters, and constants across the scope chain
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyResolver = exports.FunctionResolver = exports.ReferenceResolver = exports.ConstantResolver = void 0;
class ConstantResolver {
    symbolTable;
    constructor(symbolTable) {
        this.symbolTable = symbolTable;
    }
    /**
     * Attempts to evaluate a compile-time constant value from an expression AST node.
     * Returns `undefined` if the expression depends on runtime inputs.
     */
    tryEvaluateConstant(expr) {
        if (!expr)
            return undefined;
        switch (expr.type) {
            case 'LiteralExpression':
                return expr.value;
            case 'ParenthesizedExpression':
                return this.tryEvaluateConstant(expr.expression);
            case 'IdentifierExpression': {
                const name = expr.name;
                const sym = this.symbolTable.resolve(name);
                if (sym &&
                    (sym.kind === 'Constant' || sym.mutability === 'immutable') &&
                    sym.currentValue !== undefined) {
                    return sym.currentValue;
                }
                return undefined;
            }
            case 'UnaryExpression': {
                const u = expr;
                const val = this.tryEvaluateConstant(u.operand);
                if (typeof val === 'number') {
                    if (u.operator === '-')
                        return -val;
                    if (u.operator === '+')
                        return +val;
                }
                if (typeof val === 'boolean' && u.operator === 'NOT') {
                    return !val;
                }
                return undefined;
            }
            case 'BinaryExpression':
            case 'ArithmeticExpression':
            case 'ComparisonExpression':
            case 'LogicalExpression': {
                const b = expr;
                const leftVal = this.tryEvaluateConstant(b.left);
                const rightVal = this.tryEvaluateConstant(b.right);
                if (leftVal === undefined || rightVal === undefined)
                    return undefined;
                if (typeof leftVal === 'number' && typeof rightVal === 'number') {
                    switch (b.operator) {
                        case '+':
                            return leftVal + rightVal;
                        case '-':
                            return leftVal - rightVal;
                        case '*':
                            return leftVal * rightVal;
                        case '/':
                            return rightVal !== 0 ? leftVal / rightVal : undefined;
                        case '%':
                            return rightVal !== 0 ? leftVal % rightVal : undefined;
                        case '^':
                            return Math.pow(leftVal, rightVal);
                        case '==':
                        case '=':
                            return leftVal === rightVal;
                        case '!=':
                            return leftVal !== rightVal;
                        case '>':
                            return leftVal > rightVal;
                        case '<':
                            return leftVal < rightVal;
                        case '>=':
                            return leftVal >= rightVal;
                        case '<=':
                            return leftVal <= rightVal;
                    }
                }
                if (typeof leftVal === 'boolean' && typeof rightVal === 'boolean') {
                    if (b.operator === 'AND')
                        return leftVal && rightVal;
                    if (b.operator === 'OR')
                        return leftVal || rightVal;
                }
                return undefined;
            }
            default:
                return undefined;
        }
    }
}
exports.ConstantResolver = ConstantResolver;
class ReferenceResolver {
    symbolTable;
    diagnostics;
    constructor(symbolTable, diagnostics) {
        this.symbolTable = symbolTable;
        this.diagnostics = diagnostics;
    }
    /**
     * Resolves a variable, constant, or parameter identifier and validates that
     * it has been declared and initialized before use.
     */
    resolveIdentifier(node) {
        const name = node.name;
        if (name === '<error>')
            return null;
        // Handle legacy implicit decision identifiers `APPROVE` / `REJECT` gracefully as warnings or undefined
        const symbol = this.symbolTable.incrementReference(name, {
            line: node.line,
            column: node.column,
            context: 'Expression',
        });
        if (!symbol) {
            this.diagnostics.report({
                code: 'FPL-T002',
                message: `Undefined identifier '${name}'`,
                node,
                relatedSymbol: name,
                suggestedFix: `Declare '${name}' using 'LET ${name} : <type>', 'VAR ${name} : <type>', 'CONST', or inside the policy 'INPUT' block before referencing it.`,
            });
            return null;
        }
        if (!symbol.isInitialized && symbol.kind === 'Variable') {
            this.diagnostics.report({
                code: 'FPL-T006',
                message: `Variable '${name}' is read before being initialized`,
                node,
                relatedSymbol: name,
                suggestedFix: `Assign a value to '${name}' before using it in an expression.`,
            });
        }
        return symbol;
    }
}
exports.ReferenceResolver = ReferenceResolver;
class FunctionResolver {
    symbolTable;
    typeChecker;
    diagnostics;
    constructor(symbolTable, typeChecker, diagnostics) {
        this.symbolTable = symbolTable;
        this.typeChecker = typeChecker;
        this.diagnostics = diagnostics;
    }
    /**
     * Resolves a function call and validates argument count and parameter types.
     */
    resolveAndValidateCall(node, calleeName, argTypes, argNodes) {
        const symbol = this.symbolTable.incrementReference(calleeName, {
            line: node.line,
            column: node.column,
            context: 'FunctionCall',
        });
        if (!symbol ||
            (symbol.kind !== 'Function' && symbol.kind !== 'BuiltinFunction')) {
            this.diagnostics.report({
                code: 'FPL-T003',
                message: `Undefined function '${calleeName}'`,
                node,
                relatedSymbol: calleeName,
                suggestedFix: `Define 'FUNCTION ${calleeName}(...)' before calling it, or check the spelling of built-in functions (e.g. EMI, ROUND, MIN, MAX).`,
            });
            return { symbol: null, returnType: 'unknown' };
        }
        const params = symbol.parameters ?? [];
        const minArgs = params.filter((p) => !p.optional).length;
        const maxArgs = params.length;
        if (argTypes.length < minArgs || argTypes.length > maxArgs) {
            this.diagnostics.report({
                code: 'FPL-T008',
                message: `Function '${calleeName}' expects ${minArgs === maxArgs ? minArgs : `${minArgs}..${maxArgs}`} argument(s), but received ${argTypes.length}`,
                node,
                relatedSymbol: calleeName,
                suggestedFix: `Pass (${params.map((p) => `${p.name}: ${p.type}`).join(', ')}) when calling '${calleeName}'.`,
            });
        }
        else {
            for (let i = 0; i < argTypes.length; i++) {
                const expectedParam = params[i];
                const actualType = argTypes[i];
                const argNode = argNodes[i] ?? node;
                if (expectedParam &&
                    !this.typeChecker.isAssignable(expectedParam.type, actualType)) {
                    this.diagnostics.report({
                        code: 'FPL-T001',
                        message: `Argument ${i + 1} ('${expectedParam.name}') of function '${calleeName}' expects type '${expectedParam.type}', but received '${actualType}'`,
                        node: argNode,
                        relatedSymbol: calleeName,
                        suggestedFix: `Convert or pass a value of type '${expectedParam.type}' for parameter '${expectedParam.name}'.`,
                    });
                }
            }
        }
        return {
            symbol,
            returnType: symbol.returnType ?? 'unknown',
        };
    }
}
exports.FunctionResolver = FunctionResolver;
class PolicyResolver {
    symbolTable;
    typeChecker;
    diagnostics;
    constructor(symbolTable, typeChecker, diagnostics) {
        this.symbolTable = symbolTable;
        this.typeChecker = typeChecker;
        this.diagnostics = diagnostics;
    }
    /**
     * Resolves a policy invocation (`CALL PolicyName WITH ...`) and validates
     * that the target policy or imported namespace exists and its input types match.
     */
    resolveAndValidatePolicyCall(node, calleeName, callArgs, argTypes) {
        // Support qualified imported policy calls like `CreditLib.CheckEligibility`
        const parts = calleeName.split('.');
        const baseName = parts[0];
        const symbol = this.symbolTable.incrementReference(parts.length > 1 ? baseName : calleeName, {
            line: node.line,
            column: node.column,
            context: 'PolicyCall',
        });
        if (!symbol) {
            this.diagnostics.report({
                code: 'FPL-T004',
                message: `Undefined policy '${calleeName}' in CALL statement`,
                node,
                relatedSymbol: calleeName,
                suggestedFix: `Declare 'POLICY ${calleeName}' or import its module using 'IMPORT "..." AS ${baseName}'.`,
            });
            return null;
        }
        if (symbol.kind !== 'Policy' && symbol.kind !== 'ImportedPolicy' && symbol.kind !== 'Rule') {
            this.diagnostics.report({
                code: 'FPL-T004',
                message: `'${calleeName}' is a '${symbol.kind}', not a callable Policy`,
                node,
                relatedSymbol: calleeName,
                suggestedFix: `Use 'CALL' only with a declared POLICY or imported policy alias.`,
            });
            return null;
        }
        // If local policy with known input parameters, validate argument types
        if (symbol.kind === 'Policy' && symbol.parameters && symbol.parameters.length > 0 && callArgs.length > 0) {
            for (let i = 0; i < callArgs.length; i++) {
                const arg = callArgs[i];
                const actualType = argTypes[i] ?? 'unknown';
                const expectedParam = arg.name
                    ? symbol.parameters.find((p) => p.name === arg.name)
                    : symbol.parameters[i];
                if (arg.name && !expectedParam) {
                    this.diagnostics.report({
                        code: 'FPL-T009',
                        message: `Policy '${calleeName}' does not have an INPUT parameter named '${arg.name}'`,
                        node: arg.value,
                        relatedSymbol: calleeName,
                        suggestedFix: `Valid INPUT parameters for '${calleeName}': ${symbol.parameters.map((p) => p.name).join(', ')}.`,
                    });
                }
                else if (expectedParam &&
                    !this.typeChecker.isAssignable(expectedParam.type, actualType)) {
                    this.diagnostics.report({
                        code: 'FPL-T001',
                        message: `Policy '${calleeName}' input '${expectedParam.name}' expects type '${expectedParam.type}', but received '${actualType}'`,
                        node: arg.value,
                        relatedSymbol: calleeName,
                        suggestedFix: `Pass a '${expectedParam.type}' value for input '${expectedParam.name}'.`,
                    });
                }
            }
        }
        return symbol;
    }
}
exports.PolicyResolver = PolicyResolver;
//# sourceMappingURL=reference-resolver.js.map