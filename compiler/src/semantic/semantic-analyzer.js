"use strict";
/**
 * Financial Policy Language (FPL) — Semantic Visitor & Semantic Analyzer Engine
 *
 * Implements `SemanticVisitor` (extending `BaseASTVisitor<FPLDataType>`) and the
 * top-level `SemanticAnalyzer` facade.
 *
 * Validation Pipeline:
 * 1. Pre-pass: Register top-level `IMPORT`, `CONST`, `FUNCTION`, `POLICY`, and `RULE`
 *    headers into `GlobalScope` and `DependencyAnalyzer` (detecting duplicate definitions
 *    while enabling forward policy/function calls and mutual recursion detection).
 * 2. Traversal Pass:
 *    - Manage nested `PolicyScope`, `FunctionScope`, and `BlockScope` (`IfBlock`, `LoopBlock`, `Rule`)
 *    - Validate `LET` (immutable) vs `VAR` (mutable) declarations and definite assignment
 *    - Validate all expressions (`Arithmetic`, `Comparison`, `Logical`, `Member`, `Index`, `Between`, `In`)
 *    - Validate `IF`, `ELSEIF`, `WHILE`, and `WHEN` conditions evaluate strictly to `boolean`
 *    - Validate `RETURN` types inside functions and ensure non-void functions return a value
 *    - Validate `EMIT` and `SET` target mutability and type compatibility
 *    - Detect unreachable statements after `RETURN`, `ALLOW`, `DENY`, `REVIEW`, `BREAK`, `CONTINUE`
 *    - Decorate every AST node in `ASTRepository` with `NodeSemanticMetadata`
 * 3. Post-pass:
 *    - Run `DependencyAnalyzer` to detect circular policy calls and recursive functions
 *    - Check for unused variables and parameters (warnings)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticAnalyzer = exports.SemanticVisitor = void 0;
exports.analyzeSemantics = analyzeSemantics;
const ast_visitor_1 = require("../ast/ast-visitor");
const ast_repository_1 = require("../ast/ast-repository");
const symbol_table_1 = require("../symbol-table/symbol-table");
const type_system_1 = require("./type-system");
const reference_resolver_1 = require("./reference-resolver");
const dependency_analyzer_1 = require("./dependency-analyzer");
const semantic_diagnostics_1 = require("./semantic-diagnostics");
const semantic_metadata_1 = require("./semantic-metadata");
class SemanticVisitor extends ast_visitor_1.BaseASTVisitor {
    repository;
    symbolTable;
    typeResolver;
    typeChecker;
    constantResolver;
    referenceResolver;
    functionResolver;
    policyResolver;
    dependencyAnalyzer;
    diagnostics;
    decorator;
    currentContainerName = null;
    currentFunctionReturnType = null;
    currentFunctionHasReturn = false;
    loopDepth = 0;
    importedPaths = new Set();
    constructor(repository, sourceCode = '') {
        super();
        this.repository = repository;
        this.symbolTable = new symbol_table_1.SymbolTable();
        this.typeResolver = new type_system_1.TypeResolver();
        this.typeChecker = new type_system_1.TypeChecker();
        this.diagnostics = new semantic_diagnostics_1.SemanticDiagnostics(sourceCode);
        this.constantResolver = new reference_resolver_1.ConstantResolver(this.symbolTable);
        this.referenceResolver = new reference_resolver_1.ReferenceResolver(this.symbolTable, this.diagnostics);
        this.functionResolver = new reference_resolver_1.FunctionResolver(this.symbolTable, this.typeChecker, this.diagnostics);
        this.policyResolver = new reference_resolver_1.PolicyResolver(this.symbolTable, this.typeChecker, this.diagnostics);
        this.dependencyAnalyzer = new dependency_analyzer_1.DependencyAnalyzer();
        this.decorator = new semantic_metadata_1.SemanticMetadataDecorator(this.repository);
    }
    defaultResult() {
        return 'void';
    }
    // ─── Top-Level Program & Pre-Registration Pass ────────────────────────────
    visitProgram(node) {
        // Pass 1: Pre-register Imports, Functions, Policies, and top-level Rules
        for (const imp of node.imports) {
            this.registerImportDeclaration(imp);
        }
        for (const fn of node.functions) {
            this.preRegisterFunction(fn);
        }
        for (const pol of node.policies) {
            this.preRegisterPolicy(pol);
        }
        for (const rule of node.rules) {
            this.preRegisterRule(rule);
        }
        // Pass 2: Full semantic traversal of Constants, Variables, Functions, Policies, Rules, and Statements
        for (const c of node.constants) {
            this.visitConstantDeclaration(c);
        }
        for (const v of node.variables) {
            this.visitVariableDeclaration(v);
        }
        for (const fn of node.functions) {
            this.visitFunctionDeclaration(fn);
        }
        for (const pol of node.policies) {
            this.visitPolicyDeclaration(pol);
        }
        for (const rule of node.rules) {
            this.visitRuleDeclaration(rule);
        }
        this.checkStatementBlock(node.statements);
        // Pass 3: Check for unused local variables and parameters (warnings)
        this.reportUnusedSymbols();
        this.decorator.decorate(node, {
            resolvedType: 'void',
            scope: this.symbolTable.globalScope(),
            evaluationCategory: 'DECLARATION',
        });
        return 'void';
    }
    registerImportDeclaration(node) {
        if (!node.path || !node.path.endsWith('.fpl')) {
            this.diagnostics.report({
                code: 'FPL-T013',
                message: `Invalid import path '${node.path}': imported files must have the '.fpl' extension`,
                node,
                suggestedFix: `Provide a valid '.fpl' file path, e.g. 'IMPORT "shared/rules.fpl" AS Rules'.`,
            });
        }
        if (this.importedPaths.has(node.path)) {
            this.diagnostics.report({
                code: 'FPL-T005',
                message: `Duplicate import of '${node.path}'`,
                severity: 'WARNING',
                node,
                suggestedFix: `Remove the duplicate IMPORT statement for '${node.path}'.`,
            });
        }
        this.importedPaths.add(node.path);
        const symbolName = node.alias ?? node.path;
        const existing = this.symbolTable.resolveInCurrentScope(symbolName);
        if (existing) {
            this.diagnostics.report({
                code: 'FPL-T005',
                message: `Duplicate import alias '${symbolName}' (already declared at line ${existing.declarationLine})`,
                node,
                relatedSymbol: symbolName,
                suggestedFix: `Choose a unique alias after 'AS'.`,
            });
            return;
        }
        const sym = this.symbolTable.declare({
            name: symbolName,
            kind: 'ImportedPolicy',
            symbolType: 'ImportedPolicy',
            variableType: 'policy',
            typeName: 'ImportedPolicy',
            scopeName: 'Global',
            scopeKind: 'Global',
            scopeLevel: 0,
            declarationLocation: node.location,
            declarationLine: node.line,
            declarationColumn: node.column,
            referenceCount: 0,
            mutability: 'immutable',
            visibility: 'imported',
            isInitialized: true,
            initializationStatus: 'Valid',
        });
        this.dependencyAnalyzer.registerEntity(symbolName, 'Import', node);
        this.decorator.decorate(node, {
            resolvedType: 'policy',
            scope: this.symbolTable.currentScope(),
            symbol: sym,
            evaluationCategory: 'DECLARATION',
        });
    }
    preRegisterFunction(node) {
        const existing = this.symbolTable.resolveInCurrentScope(node.name);
        if (existing) {
            this.diagnostics.report({
                code: 'FPL-T005',
                message: `Duplicate function declaration '${node.name}' (previously declared at line ${existing.declarationLine})`,
                node,
                relatedSymbol: node.name,
                suggestedFix: `Rename function '${node.name}' or remove the duplicate declaration.`,
            });
            return;
        }
        const paramSigs = node.parameters.map((p) => ({
            name: p.name,
            type: this.typeResolver.resolveTypeAnnotation(p.typeAnnotation),
        }));
        const returnType = node.returnType
            ? this.typeResolver.resolveTypeAnnotation(node.returnType)
            : 'void';
        this.symbolTable.declare({
            name: node.name,
            kind: 'Function',
            symbolType: 'Function',
            variableType: 'function',
            typeName: `(${paramSigs.map((p) => p.type).join(', ')}) -> ${returnType}`,
            parameters: paramSigs,
            returnType,
            scopeName: 'Global',
            scopeKind: 'Global',
            scopeLevel: 0,
            declarationLocation: node.location,
            declarationLine: node.line,
            declarationColumn: node.column,
            referenceCount: 0,
            mutability: 'immutable',
            visibility: 'global',
            isInitialized: true,
            initializationStatus: 'Valid',
        });
        this.dependencyAnalyzer.registerEntity(node.name, 'Function', node);
    }
    preRegisterPolicy(node) {
        const existing = this.symbolTable.resolveInCurrentScope(node.name);
        if (existing) {
            this.diagnostics.report({
                code: 'FPL-T005',
                message: `Duplicate policy declaration '${node.name}' (previously declared at line ${existing.declarationLine})`,
                node,
                relatedSymbol: node.name,
                suggestedFix: `Give each POLICY a unique PascalCase name.`,
            });
            return;
        }
        const inputs = (node.inputBlock?.parameters ?? []).map((p) => ({
            name: p.name,
            type: this.typeResolver.resolveTypeAnnotation(p.typeAnnotation),
        }));
        const outputs = (node.outputBlock?.parameters ?? []).map((p) => ({
            name: p.name,
            type: this.typeResolver.resolveTypeAnnotation(p.typeAnnotation),
        }));
        this.symbolTable.declare({
            name: node.name,
            kind: 'Policy',
            symbolType: 'Policy',
            variableType: 'policy',
            typeName: 'Policy',
            parameters: inputs,
            outputs,
            scopeName: 'Global',
            scopeKind: 'Global',
            scopeLevel: 0,
            declarationLocation: node.location,
            declarationLine: node.line,
            declarationColumn: node.column,
            referenceCount: 0,
            mutability: 'immutable',
            visibility: 'global',
            isInitialized: true,
            initializationStatus: 'Valid',
        });
        this.dependencyAnalyzer.registerEntity(node.name, 'Policy', node);
    }
    preRegisterRule(node) {
        const existing = this.symbolTable.resolveInCurrentScope(node.name);
        if (existing) {
            this.diagnostics.report({
                code: 'FPL-T005',
                message: `Duplicate rule declaration '${node.name}' (previously declared at line ${existing.declarationLine})`,
                node,
                relatedSymbol: node.name,
                suggestedFix: `Rename rule '${node.name}' to a unique identifier.`,
            });
            return;
        }
        this.symbolTable.declare({
            name: node.name,
            kind: 'Rule',
            symbolType: 'Rule',
            variableType: 'policy',
            typeName: 'Rule',
            scopeName: this.symbolTable.currentScope().name,
            scopeKind: this.symbolTable.currentScope().kind,
            scopeLevel: this.symbolTable.currentScope().level,
            declarationLocation: node.location,
            declarationLine: node.line,
            declarationColumn: node.column,
            referenceCount: 0,
            mutability: 'immutable',
            visibility: 'global',
            isInitialized: true,
            initializationStatus: 'Valid',
        });
        this.dependencyAnalyzer.registerEntity(node.name, 'Rule', node);
    }
    // ─── Constant & Variable Declarations ─────────────────────────────────────
    visitConstantDeclaration(node) {
        const existing = this.symbolTable.resolveInCurrentScope(node.name);
        if (existing) {
            this.diagnostics.report({
                code: 'FPL-T005',
                message: `Duplicate constant '${node.name}' in scope '${this.symbolTable.currentScope().name}'`,
                node,
                relatedSymbol: node.name,
                suggestedFix: `Remove the duplicate CONST '${node.name}' or rename it.`,
            });
        }
        const valueType = this.visit(node.value);
        const declaredType = node.typeAnnotation
            ? this.typeResolver.resolveTypeAnnotation(node.typeAnnotation)
            : valueType;
        if (node.typeAnnotation &&
            !this.typeChecker.isAssignable(declaredType, valueType)) {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `Type mismatch in CONST '${node.name}': cannot assign value of type '${valueType}' to constant of type '${declaredType}'`,
                node: node.value,
                relatedSymbol: node.name,
                suggestedFix: `Change the constant value to match '${declaredType}' or update the type annotation.`,
            });
        }
        const constValue = this.constantResolver.tryEvaluateConstant(node.value);
        let sym = existing;
        if (!existing) {
            sym = this.symbolTable.declare({
                name: node.name,
                kind: 'Constant',
                symbolType: 'Constant',
                variableType: declaredType,
                typeName: declaredType,
                scopeName: this.symbolTable.currentScope().name,
                scopeKind: this.symbolTable.currentScope().kind,
                scopeLevel: this.symbolTable.currentScope().level,
                declarationLocation: node.location,
                declarationLine: node.line,
                declarationColumn: node.column,
                referenceCount: 0,
                mutability: 'immutable',
                visibility: this.symbolTable.currentScope().kind === 'Global' ? 'global' : 'local',
                isInitialized: true,
                initializationStatus: 'Constant',
                currentValue: constValue,
            });
        }
        this.decorator.decorate(node, {
            resolvedType: declaredType,
            scope: this.symbolTable.currentScope(),
            symbol: sym,
            constantValue: constValue,
            evaluationCategory: 'COMPILE_TIME_CONSTANT',
        });
        return declaredType;
    }
    visitVariableDeclaration(node) {
        const scope = this.symbolTable.currentScope();
        const existing = this.symbolTable.resolveInCurrentScope(node.name);
        if (existing) {
            this.diagnostics.report({
                code: 'FPL-T005',
                message: `Duplicate declaration of '${node.name}' in ${scope.name} (already declared at line ${existing.declarationLine})`,
                node,
                relatedSymbol: node.name,
                suggestedFix: `Use 'SET ${node.name} = ...' to update an existing variable or choose a new variable name.`,
            });
        }
        const initType = node.initializer ? this.visit(node.initializer) : null;
        const declaredType = node.typeAnnotation
            ? this.typeResolver.resolveTypeAnnotation(node.typeAnnotation)
            : (initType ?? 'unknown');
        if (node.typeAnnotation &&
            initType !== null &&
            !this.typeChecker.isAssignable(declaredType, initType)) {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `Type mismatch in '${node.kind} ${node.name}': cannot assign '${initType}' to variable of type '${declaredType}'`,
                node: node.initializer,
                relatedSymbol: node.name,
                suggestedFix: `Provide a '${declaredType}' expression or change the type annotation of '${node.name}'.`,
            });
        }
        const constVal = node.kind === 'LET' && node.initializer
            ? this.constantResolver.tryEvaluateConstant(node.initializer)
            : undefined;
        const isInitialized = node.initializer !== null;
        let sym = existing;
        if (!existing) {
            sym = this.symbolTable.declare({
                name: node.name,
                kind: 'Variable',
                symbolType: 'Variable',
                variableType: declaredType,
                typeName: declaredType,
                elementType: node.typeAnnotation?.elementType
                    ? this.typeResolver.normalizeTypeName(node.typeAnnotation.elementType)
                    : null,
                scopeName: scope.name,
                scopeKind: scope.kind,
                scopeLevel: scope.level,
                declarationLocation: node.location,
                declarationLine: node.line,
                declarationColumn: node.column,
                referenceCount: 0,
                mutability: node.isMutable ? 'mutable' : 'immutable',
                visibility: scope.kind === 'Global' ? 'global' : 'local',
                isInitialized,
                initializationStatus: isInitialized ? 'Initialized' : 'Uninitialized',
                currentValue: constVal,
            });
        }
        this.decorator.decorate(node, {
            resolvedType: declaredType,
            scope,
            symbol: sym,
            constantValue: constVal,
            evaluationCategory: 'DECLARATION',
        });
        return declaredType;
    }
    // ─── Function & Policy Declarations ───────────────────────────────────────
    visitFunctionDeclaration(node) {
        const fnSym = this.symbolTable.resolve(node.name);
        const fnScope = this.symbolTable.enterScope('Function', node.name);
        const prevContainer = this.currentContainerName;
        const prevReturnType = this.currentFunctionReturnType;
        const prevHasReturn = this.currentFunctionHasReturn;
        this.currentContainerName = node.name;
        this.currentFunctionReturnType = node.returnType
            ? this.typeResolver.resolveTypeAnnotation(node.returnType)
            : 'void';
        this.currentFunctionHasReturn = false;
        for (const param of node.parameters) {
            const existingParam = this.symbolTable.resolveInCurrentScope(param.name);
            const paramType = this.typeResolver.resolveTypeAnnotation(param.typeAnnotation);
            if (existingParam) {
                this.diagnostics.report({
                    code: 'FPL-T005',
                    message: `Duplicate parameter '${param.name}' in FUNCTION '${node.name}'`,
                    node: param,
                    relatedSymbol: param.name,
                    suggestedFix: `Give each parameter in '${node.name}' a distinct name.`,
                });
            }
            else {
                const pSym = this.symbolTable.declare({
                    name: param.name,
                    kind: 'InputParameter',
                    symbolType: 'InputParameter',
                    variableType: paramType,
                    typeName: paramType,
                    scopeName: fnScope.name,
                    scopeKind: 'Function',
                    scopeLevel: fnScope.level,
                    declarationLocation: param.location,
                    declarationLine: param.line,
                    declarationColumn: param.column,
                    referenceCount: 0,
                    mutability: 'immutable',
                    visibility: 'function',
                    isInitialized: true,
                    initializationStatus: 'Initialized',
                });
                this.decorator.decorate(param, {
                    resolvedType: paramType,
                    scope: fnScope,
                    symbol: pSym,
                    evaluationCategory: 'DECLARATION',
                });
            }
        }
        this.checkStatementBlock(node.body);
        if (this.currentFunctionReturnType !== 'void' &&
            !this.currentFunctionHasReturn) {
            this.diagnostics.report({
                code: 'FPL-T010',
                message: `Function '${node.name}' declares return type '${this.currentFunctionReturnType}' but has no RETURN statement`,
                node,
                relatedSymbol: node.name,
                suggestedFix: `Add a 'RETURN <${this.currentFunctionReturnType}>' statement inside FUNCTION '${node.name}'.`,
            });
        }
        this.currentContainerName = prevContainer;
        this.currentFunctionReturnType = prevReturnType;
        this.currentFunctionHasReturn = prevHasReturn;
        this.symbolTable.exitScope();
        this.decorator.decorate(node, {
            resolvedType: 'function',
            scope: this.symbolTable.currentScope(),
            symbol: fnSym,
            evaluationCategory: 'DECLARATION',
        });
        return 'function';
    }
    visitPolicyDeclaration(node) {
        const policySym = this.symbolTable.resolve(node.name);
        const policyScope = this.symbolTable.enterScope('Policy', node.name);
        const prevContainer = this.currentContainerName;
        this.currentContainerName = node.name;
        if (node.inputBlock) {
            this.visitInputBlock(node.inputBlock);
        }
        if (node.outputBlock) {
            this.visitOutputBlock(node.outputBlock);
        }
        // Pre-register any nested rules inside the policy scope
        for (const r of node.rules) {
            this.preRegisterRule(r);
        }
        if (node.whenBlock) {
            this.visitWhenBlock(node.whenBlock);
        }
        if (node.thenBlock) {
            this.visitThenBlock(node.thenBlock);
        }
        if (node.elseBlock) {
            this.visitElseBlock(node.elseBlock);
        }
        for (const r of node.rules) {
            this.visitRuleDeclaration(r);
        }
        this.currentContainerName = prevContainer;
        this.symbolTable.exitScope();
        this.decorator.decorate(node, {
            resolvedType: 'policy',
            scope: this.symbolTable.currentScope(),
            symbol: policySym,
            evaluationCategory: 'DECLARATION',
        });
        return 'policy';
    }
    visitInputBlock(node) {
        const scope = this.symbolTable.currentScope();
        for (const param of node.parameters) {
            const existing = this.symbolTable.resolveInCurrentScope(param.name);
            const paramType = this.typeResolver.resolveTypeAnnotation(param.typeAnnotation);
            if (existing) {
                this.diagnostics.report({
                    code: 'FPL-T005',
                    message: `Duplicate INPUT parameter '${param.name}'`,
                    node: param,
                    relatedSymbol: param.name,
                    suggestedFix: `Remove the duplicate INPUT parameter '${param.name}'.`,
                });
            }
            else {
                const sym = this.symbolTable.declare({
                    name: param.name,
                    kind: 'InputParameter',
                    symbolType: 'InputParameter',
                    variableType: paramType,
                    typeName: paramType,
                    scopeName: scope.name,
                    scopeKind: scope.kind,
                    scopeLevel: scope.level,
                    declarationLocation: param.location,
                    declarationLine: param.line,
                    declarationColumn: param.column,
                    referenceCount: 0,
                    mutability: 'immutable',
                    visibility: 'policy',
                    isInitialized: true,
                    initializationStatus: 'Initialized',
                });
                this.decorator.decorate(param, {
                    resolvedType: paramType,
                    scope,
                    symbol: sym,
                    evaluationCategory: 'DECLARATION',
                });
            }
        }
        return 'void';
    }
    visitOutputBlock(node) {
        const scope = this.symbolTable.currentScope();
        for (const param of node.parameters) {
            const existing = this.symbolTable.resolveInCurrentScope(param.name);
            const paramType = this.typeResolver.resolveTypeAnnotation(param.typeAnnotation);
            if (existing) {
                this.diagnostics.report({
                    code: 'FPL-T005',
                    message: `Duplicate OUTPUT parameter '${param.name}' (conflicts with declaration at line ${existing.declarationLine})`,
                    node: param,
                    relatedSymbol: param.name,
                    suggestedFix: `Rename OUTPUT parameter '${param.name}'.`,
                });
            }
            else {
                const sym = this.symbolTable.declare({
                    name: param.name,
                    kind: 'OutputParameter',
                    symbolType: 'OutputParameter',
                    variableType: paramType,
                    typeName: paramType,
                    scopeName: scope.name,
                    scopeKind: scope.kind,
                    scopeLevel: scope.level,
                    declarationLocation: param.location,
                    declarationLine: param.line,
                    declarationColumn: param.column,
                    referenceCount: 0,
                    mutability: 'mutable',
                    visibility: 'policy',
                    isInitialized: true,
                    initializationStatus: 'Initialized',
                });
                this.decorator.decorate(param, {
                    resolvedType: paramType,
                    scope,
                    symbol: sym,
                    evaluationCategory: 'DECLARATION',
                });
            }
        }
        return 'void';
    }
    visitWhenBlock(node) {
        const condType = this.visit(node.condition);
        if (condType !== 'boolean' && condType !== 'unknown') {
            this.diagnostics.report({
                code: 'FPL-T007',
                message: `Policy WHEN condition must evaluate to 'boolean', but found '${condType}'`,
                node: node.condition,
                suggestedFix: `Use a comparison or logical expression (e.g. 'salary >= 50000') that evaluates to boolean.`,
            });
        }
        this.decorator.decorate(node, {
            resolvedType: 'boolean',
            scope: this.symbolTable.currentScope(),
            evaluationCategory: 'RUNTIME_INPUT_DEPENDENT',
        });
        return 'boolean';
    }
    visitThenBlock(node) {
        this.symbolTable.enterScope('Block', 'Then');
        this.checkStatementBlock(node.statements);
        this.symbolTable.exitScope();
        return 'void';
    }
    visitElseBlock(node) {
        this.symbolTable.enterScope('Block', 'Else');
        this.checkStatementBlock(node.statements);
        this.symbolTable.exitScope();
        return 'void';
    }
    visitRuleDeclaration(node) {
        const ruleSym = this.symbolTable.resolve(node.name);
        this.symbolTable.enterScope('Rule', node.name);
        const prevContainer = this.currentContainerName;
        this.currentContainerName = node.name;
        if (node.condition) {
            const condType = this.visit(node.condition);
            if (condType !== 'boolean' && condType !== 'unknown') {
                this.diagnostics.report({
                    code: 'FPL-T007',
                    message: `RULE '${node.name}' WHEN condition must evaluate to 'boolean', but found '${condType}'`,
                    node: node.condition,
                    relatedSymbol: node.name,
                    suggestedFix: `Ensure the RULE condition is a boolean expression.`,
                });
            }
        }
        this.checkStatementBlock(node.statements);
        this.currentContainerName = prevContainer;
        this.symbolTable.exitScope();
        this.decorator.decorate(node, {
            resolvedType: 'policy',
            scope: this.symbolTable.currentScope(),
            symbol: ruleSym,
            evaluationCategory: 'DECLARATION',
        });
        return 'policy';
    }
    // ─── Statement Validation ─────────────────────────────────────────────────
    /**
     * Validates a sequence of statements and detects unreachable code after
     * terminal control-flow statements (`ALLOW`, `DENY`, `REVIEW`, `RETURN`, `BREAK`, `CONTINUE`, `THROW`).
     */
    checkStatementBlock(statements) {
        let terminatedBy = null;
        let reportedUnreachable = false;
        for (const stmt of statements) {
            if (terminatedBy && !reportedUnreachable) {
                reportedUnreachable = true;
                this.diagnostics.report({
                    code: 'FPL-T014',
                    message: `Unreachable statement after '${terminatedBy}'`,
                    severity: 'WARNING',
                    node: stmt,
                    suggestedFix: `Remove statements appearing after '${terminatedBy}' in the same block.`,
                });
            }
            this.visit(stmt);
            if (stmt.type === 'AllowStatement' ||
                stmt.type === 'DenyStatement' ||
                stmt.type === 'ReviewStatement' ||
                stmt.type === 'ReturnStatement' ||
                stmt.type === 'BreakStatement' ||
                stmt.type === 'ContinueStatement' ||
                stmt.type === 'ThrowStatement') {
                terminatedBy = stmt.type.replace('Statement', '').toUpperCase();
            }
        }
    }
    visitAssignmentStatement(node) {
        return this.validateMutation(node, node.target, node.operator, node.value);
    }
    visitSetStatement(node) {
        return this.validateMutation(node, node.target, node.operator, node.value);
    }
    validateMutation(stmtNode, target, operator, valueExpr) {
        const rhsType = this.visit(valueExpr);
        if (target.type === 'IdentifierExpression') {
            const ident = target;
            const sym = this.symbolTable.incrementReference(ident.name, {
                line: ident.line,
                column: ident.column,
                context: 'Assignment',
            });
            if (!sym) {
                this.diagnostics.report({
                    code: 'FPL-T002',
                    message: `Cannot assign to undefined variable '${ident.name}'`,
                    node: target,
                    relatedSymbol: ident.name,
                    suggestedFix: `Declare '${ident.name}' with 'VAR ${ident.name} : <type>' before assigning to it.`,
                });
                return 'unknown';
            }
            // Allow initial assignment to an uninitialized `LET` variable (bind-once),
            // but forbid reassigning an already-initialized `LET`, `CONST`, or `INPUT` parameter.
            if (sym.mutability === 'immutable' && sym.isInitialized) {
                this.diagnostics.report({
                    code: 'FPL-T006',
                    message: `Cannot reassign immutable ${sym.kind.toLowerCase()} '${ident.name}'`,
                    node: stmtNode,
                    relatedSymbol: ident.name,
                    suggestedFix: sym.kind === 'Variable'
                        ? `Declare '${ident.name}' using 'VAR' instead of 'LET' if it needs to be modified.`
                        : `'${ident.name}' is a ${sym.kind} and cannot be modified.`,
                });
            }
            if (!this.typeChecker.isAssignable(sym.variableType, rhsType)) {
                this.diagnostics.report({
                    code: 'FPL-T001',
                    message: `Type mismatch in assignment to '${ident.name}': expected '${sym.variableType}', but received '${rhsType}'`,
                    node: valueExpr,
                    relatedSymbol: ident.name,
                    suggestedFix: `Assign a value of type '${sym.variableType}' to '${ident.name}'.`,
                });
            }
            if (operator !== '=' && !this.typeChecker.isNumeric(sym.variableType) && sym.variableType !== 'currency') {
                this.diagnostics.report({
                    code: 'FPL-T001',
                    message: `Compound assignment '${operator}' requires a numeric or currency variable, found '${sym.variableType}'`,
                    node: stmtNode,
                    relatedSymbol: ident.name,
                    suggestedFix: `Use '=' for non-numeric assignments.`,
                });
            }
            this.symbolTable.markInitialized(ident.name);
            this.decorator.decorate(target, {
                resolvedType: sym.variableType,
                scope: this.symbolTable.currentScope(),
                symbol: sym,
            });
            this.decorator.decorate(stmtNode, {
                resolvedType: sym.variableType,
                scope: this.symbolTable.currentScope(),
                symbol: sym,
                evaluationCategory: 'STATEMENT',
            });
            return sym.variableType;
        }
        const lhsType = this.visit(target);
        if (!this.typeChecker.isAssignable(lhsType, rhsType)) {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `Type mismatch in assignment: cannot assign '${rhsType}' to '${lhsType}'`,
                node: valueExpr,
                suggestedFix: `Ensure the assigned expression matches type '${lhsType}'.`,
            });
        }
        return lhsType;
    }
    visitEmitStatement(node) {
        const valType = this.visit(node.value);
        const sym = this.symbolTable.incrementReference(node.target, {
            line: node.line,
            column: node.column,
            context: 'Emit',
        });
        if (!sym) {
            this.diagnostics.report({
                code: 'FPL-T002',
                message: `Cannot EMIT undeclared output variable '${node.target}'`,
                node,
                relatedSymbol: node.target,
                suggestedFix: `Declare '${node.target} : <type>' inside the policy's 'OUTPUT' block.`,
            });
            return 'unknown';
        }
        if (sym.kind !== 'OutputParameter' && sym.kind !== 'Variable') {
            this.diagnostics.report({
                code: 'FPL-T009',
                message: `'${node.target}' is a '${sym.kind}', not an OUTPUT parameter`,
                node,
                relatedSymbol: node.target,
                suggestedFix: `Use 'EMIT' only with variables declared in the 'OUTPUT' section.`,
            });
        }
        if (!this.typeChecker.isAssignable(sym.variableType, valType)) {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `Type mismatch in EMIT '${node.target}': expected '${sym.variableType}', but received '${valType}'`,
                node: node.value,
                relatedSymbol: node.target,
                suggestedFix: `Emit a value of type '${sym.variableType}' for output '${node.target}'.`,
            });
        }
        this.decorator.decorate(node, {
            resolvedType: sym.variableType,
            scope: this.symbolTable.currentScope(),
            symbol: sym,
            evaluationCategory: 'STATEMENT',
        });
        return sym.variableType;
    }
    visitApplyStatement(node) {
        const targetSym = this.symbolTable.incrementReference(node.ruleName, {
            line: node.line,
            column: node.column,
            context: 'Apply',
        });
        if (!targetSym ||
            (targetSym.kind !== 'Rule' &&
                targetSym.kind !== 'Policy' &&
                targetSym.kind !== 'ImportedPolicy')) {
            this.diagnostics.report({
                code: 'FPL-T004',
                message: `Undefined policy or rule '${node.ruleName}' in APPLY statement`,
                node,
                relatedSymbol: node.ruleName,
                suggestedFix: `Declare 'POLICY ${node.ruleName}' or 'RULE ${node.ruleName} ... END' before applying it.`,
            });
        }
        else if (this.currentContainerName) {
            this.dependencyAnalyzer.addDependency(this.currentContainerName, node.ruleName, targetSym.kind === 'Rule' ? 'RULE_APPLY' : 'POLICY_CALL', node);
        }
        this.decorator.decorate(node, {
            resolvedType: 'void',
            scope: this.symbolTable.currentScope(),
            symbol: targetSym,
            evaluationCategory: 'STATEMENT',
        });
        return 'void';
    }
    visitIfStatement(node) {
        const condType = this.visit(node.condition);
        if (condType !== 'boolean' && condType !== 'unknown') {
            this.diagnostics.report({
                code: 'FPL-T007',
                message: `IF condition must evaluate to 'boolean', but found '${condType}'`,
                node: node.condition,
                suggestedFix: `Write a boolean comparison (e.g. 'IF salary > 0 THEN') instead of '${condType}'.`,
            });
        }
        this.symbolTable.enterScope('IfBlock', 'IfThen');
        this.checkStatementBlock(node.thenBranch);
        this.symbolTable.exitScope();
        for (const elseIf of node.elseIfBranches) {
            const eiCondType = this.visit(elseIf.condition);
            if (eiCondType !== 'boolean' && eiCondType !== 'unknown') {
                this.diagnostics.report({
                    code: 'FPL-T007',
                    message: `ELSEIF condition must evaluate to 'boolean', but found '${eiCondType}'`,
                    node: elseIf.condition,
                    suggestedFix: `Ensure the ELSEIF condition is a boolean expression.`,
                });
            }
            this.symbolTable.enterScope('IfBlock', 'ElseIf');
            this.checkStatementBlock(elseIf.consequent);
            this.symbolTable.exitScope();
        }
        if (node.elseBranch) {
            this.symbolTable.enterScope('IfBlock', 'Else');
            this.checkStatementBlock(node.elseBranch.statements);
            this.symbolTable.exitScope();
        }
        this.decorator.decorate(node, {
            resolvedType: 'void',
            scope: this.symbolTable.currentScope(),
            evaluationCategory: 'STATEMENT',
        });
        return 'void';
    }
    visitMatchStatement(node) {
        const discType = this.visit(node.discriminant);
        for (const c of node.cases) {
            for (const val of c.values) {
                const caseType = this.visit(val);
                if (!this.typeChecker.isAssignable(discType, caseType)) {
                    this.diagnostics.report({
                        code: 'FPL-T001',
                        message: `CASE value type '${caseType}' is not compatible with MATCH expression type '${discType}'`,
                        node: val,
                        suggestedFix: `Use CASE values of type '${discType}'.`,
                    });
                }
            }
            this.symbolTable.enterScope('Block', 'Case');
            this.checkStatementBlock(c.statements);
            this.symbolTable.exitScope();
        }
        if (node.defaultCase) {
            this.symbolTable.enterScope('Block', 'Default');
            this.checkStatementBlock(node.defaultCase.statements);
            this.symbolTable.exitScope();
        }
        this.decorator.decorate(node, {
            resolvedType: 'void',
            scope: this.symbolTable.currentScope(),
            evaluationCategory: 'STATEMENT',
        });
        return 'void';
    }
    visitForStatement(node) {
        const startType = this.visit(node.start);
        const endType = this.visit(node.end);
        if (startType !== 'int' && startType !== 'unknown') {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `FOR loop start bound must be 'int', found '${startType}'`,
                node: node.start,
                suggestedFix: `Use an integer start bound in the FOR loop.`,
            });
        }
        if (endType !== 'int' && endType !== 'unknown') {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `FOR loop end bound must be 'int', found '${endType}'`,
                node: node.end,
                suggestedFix: `Use an integer end bound in the FOR loop.`,
            });
        }
        if (node.step) {
            const stepType = this.visit(node.step);
            if (stepType !== 'int' && stepType !== 'unknown') {
                this.diagnostics.report({
                    code: 'FPL-T001',
                    message: `FOR loop STEP must be 'int', found '${stepType}'`,
                    node: node.step,
                    suggestedFix: `Use a non-zero integer STEP value.`,
                });
            }
        }
        const loopScope = this.symbolTable.enterScope('LoopBlock', `For:${node.iterator}`);
        this.symbolTable.declare({
            name: node.iterator,
            kind: 'Variable',
            symbolType: 'Variable',
            variableType: 'int',
            typeName: 'int',
            scopeName: loopScope.name,
            scopeKind: 'LoopBlock',
            scopeLevel: loopScope.level,
            declarationLocation: node.location,
            declarationLine: node.line,
            declarationColumn: node.column,
            referenceCount: 1, // Loop counter is implicitly used by the loop header
            mutability: 'immutable',
            visibility: 'local',
            isInitialized: true,
            initializationStatus: 'Initialized',
        });
        this.loopDepth += 1;
        this.checkStatementBlock(node.body);
        this.loopDepth -= 1;
        this.symbolTable.exitScope();
        return 'void';
    }
    visitWhileStatement(node) {
        const condType = this.visit(node.condition);
        if (condType !== 'boolean' && condType !== 'unknown') {
            this.diagnostics.report({
                code: 'FPL-T007',
                message: `WHILE condition must evaluate to 'boolean', but found '${condType}'`,
                node: node.condition,
                suggestedFix: `Provide a boolean condition for the WHILE loop.`,
            });
        }
        this.symbolTable.enterScope('LoopBlock', 'While');
        this.loopDepth += 1;
        this.checkStatementBlock(node.body);
        this.loopDepth -= 1;
        this.symbolTable.exitScope();
        return 'void';
    }
    visitForeachStatement(node) {
        const collType = this.visit(node.collection);
        if (collType !== 'array' && collType !== 'unknown') {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `FOREACH requires an 'array' collection, but found '${collType}'`,
                node: node.collection,
                suggestedFix: `Iterate over an array expression in FOREACH.`,
            });
        }
        const loopScope = this.symbolTable.enterScope('LoopBlock', `Foreach:${node.iterator}`);
        this.symbolTable.declare({
            name: node.iterator,
            kind: 'Variable',
            symbolType: 'Variable',
            variableType: 'unknown',
            typeName: 'unknown',
            scopeName: loopScope.name,
            scopeKind: 'LoopBlock',
            scopeLevel: loopScope.level,
            declarationLocation: node.location,
            declarationLine: node.line,
            declarationColumn: node.column,
            referenceCount: 1,
            mutability: 'immutable',
            visibility: 'local',
            isInitialized: true,
            initializationStatus: 'Initialized',
        });
        this.loopDepth += 1;
        this.checkStatementBlock(node.body);
        this.loopDepth -= 1;
        this.symbolTable.exitScope();
        return 'void';
    }
    visitTryStatement(node) {
        this.symbolTable.enterScope('Block', 'Try');
        this.checkStatementBlock(node.tryBlock);
        this.symbolTable.exitScope();
        if (node.catchClause) {
            const catchScope = this.symbolTable.enterScope('Block', 'Catch');
            if (node.catchClause.errorVariable) {
                this.symbolTable.declare({
                    name: node.catchClause.errorVariable,
                    kind: 'Variable',
                    symbolType: 'Variable',
                    variableType: 'object',
                    typeName: 'object',
                    scopeName: catchScope.name,
                    scopeKind: 'Block',
                    scopeLevel: catchScope.level,
                    declarationLocation: node.catchClause.location,
                    declarationLine: node.catchClause.line,
                    declarationColumn: node.catchClause.column,
                    referenceCount: 1,
                    mutability: 'immutable',
                    visibility: 'local',
                    isInitialized: true,
                    initializationStatus: 'Initialized',
                });
            }
            this.checkStatementBlock(node.catchClause.body);
            this.symbolTable.exitScope();
        }
        return 'void';
    }
    visitBreakStatement(node) {
        if (this.loopDepth <= 0) {
            this.diagnostics.report({
                code: 'FPL-T015',
                message: `'BREAK' statement cannot be used outside of a FOR, WHILE, or FOREACH loop`,
                node,
                suggestedFix: `Use 'BREAK' only inside a loop body.`,
            });
        }
        return 'void';
    }
    visitContinueStatement(node) {
        if (this.loopDepth <= 0) {
            this.diagnostics.report({
                code: 'FPL-T015',
                message: `'CONTINUE' statement cannot be used outside of a FOR, WHILE, or FOREACH loop`,
                node,
                suggestedFix: `Use 'CONTINUE' only inside a loop body.`,
            });
        }
        return 'void';
    }
    visitReturnStatement(node) {
        this.currentFunctionHasReturn = true;
        const actualType = node.value ? this.visit(node.value) : 'void';
        if (this.currentFunctionReturnType !== null &&
            !this.typeChecker.isAssignable(this.currentFunctionReturnType, actualType)) {
            this.diagnostics.report({
                code: 'FPL-T010',
                message: `Return type mismatch in function '${this.currentContainerName ?? ''}': expected '${this.currentFunctionReturnType}', but returned '${actualType}'`,
                node: node.value ?? node,
                relatedSymbol: this.currentContainerName,
                suggestedFix: `Return a value of type '${this.currentFunctionReturnType}'.`,
            });
        }
        this.decorator.decorate(node, {
            resolvedType: actualType,
            scope: this.symbolTable.currentScope(),
            evaluationCategory: 'STATEMENT',
        });
        return actualType;
    }
    visitCallStatement(node) {
        const argTypes = node.arguments.map((a) => this.visit(a.value));
        const targetSym = this.policyResolver.resolveAndValidatePolicyCall(node, node.callee, node.arguments, argTypes);
        if (this.currentContainerName) {
            this.dependencyAnalyzer.addDependency(this.currentContainerName, node.callee.split('.')[0], 'POLICY_CALL', node);
        }
        if (node.returnBinding) {
            const scope = this.symbolTable.currentScope();
            const existing = this.symbolTable.resolveInCurrentScope(node.returnBinding);
            if (!existing) {
                this.symbolTable.declare({
                    name: node.returnBinding,
                    kind: 'Variable',
                    symbolType: 'Variable',
                    variableType: 'policy_result',
                    typeName: 'policy_result',
                    scopeName: scope.name,
                    scopeKind: scope.kind,
                    scopeLevel: scope.level,
                    declarationLocation: node.location,
                    declarationLine: node.line,
                    declarationColumn: node.column,
                    referenceCount: 0,
                    mutability: 'immutable',
                    visibility: 'local',
                    isInitialized: true,
                    initializationStatus: 'Initialized',
                });
            }
            else {
                this.symbolTable.markInitialized(node.returnBinding);
            }
        }
        this.decorator.decorate(node, {
            resolvedType: 'policy_result',
            scope: this.symbolTable.currentScope(),
            symbol: targetSym,
            evaluationCategory: 'STATEMENT',
        });
        return 'policy_result';
    }
    visitLogStatement(node) {
        this.visit(node.expression);
        return 'void';
    }
    visitAssertStatement(node) {
        const condType = this.visit(node.condition);
        if (condType !== 'boolean' && condType !== 'unknown') {
            this.diagnostics.report({
                code: 'FPL-T007',
                message: `ASSERT condition must evaluate to 'boolean', found '${condType}'`,
                node: node.condition,
                suggestedFix: `Pass a boolean condition to ASSERT.`,
            });
        }
        if (node.message) {
            this.visit(node.message);
        }
        return 'void';
    }
    visitThrowStatement(node) {
        this.visit(node.errorCode);
        if (node.message) {
            this.visit(node.message);
        }
        return 'void';
    }
    visitDecisionStatement(node) {
        if (node.reason) {
            const rType = this.visit(node.reason);
            if (rType !== 'string' && rType !== 'unknown') {
                this.diagnostics.report({
                    code: 'FPL-T001',
                    message: `Decision '${node.decision}' reason must be of type 'string', found '${rType}'`,
                    node: node.reason,
                    suggestedFix: `Provide a string message after 'WITH reason = "..."'.`,
                });
            }
        }
        if (node.assignTo) {
            this.visit(node.assignTo);
        }
        this.decorator.decorate(node, {
            resolvedType: 'policy_result',
            scope: this.symbolTable.currentScope(),
            evaluationCategory: 'STATEMENT',
        });
        return 'policy_result';
    }
    visitExpressionStatement(node) {
        return this.visit(node.expression);
    }
    // ─── Expression Validation & Type Inference ───────────────────────────────
    visitLiteralExpression(node) {
        const resolvedType = this.typeResolver.resolveLiteralKind(node.literalKind);
        this.decorator.decorate(node, {
            resolvedType,
            scope: this.symbolTable.currentScope(),
            constantValue: node.value,
            evaluationCategory: 'COMPILE_TIME_CONSTANT',
        });
        return resolvedType;
    }
    visitIdentifierExpression(node) {
        const symbol = this.referenceResolver.resolveIdentifier(node);
        const resolvedType = symbol ? symbol.variableType : 'unknown';
        this.decorator.decorate(node, {
            resolvedType,
            scope: this.symbolTable.currentScope(),
            symbol,
            constantValue: symbol?.currentValue,
        });
        return resolvedType;
    }
    visitParenthesizedExpression(node) {
        const innerType = this.visit(node.expression);
        const constVal = this.constantResolver.tryEvaluateConstant(node.expression);
        this.decorator.decorate(node, {
            resolvedType: innerType,
            scope: this.symbolTable.currentScope(),
            constantValue: constVal,
        });
        return innerType;
    }
    visitUnaryExpression(node) {
        const operandType = this.visit(node.operand);
        let resultType = operandType;
        if (node.operator === 'NOT') {
            const check = this.typeChecker.checkLogicalOperation('NOT', operandType);
            if (!check.valid) {
                this.diagnostics.report({
                    code: 'FPL-T001',
                    message: check.message,
                    node,
                    suggestedFix: `Apply 'NOT' only to boolean expressions.`,
                });
            }
            resultType = 'boolean';
        }
        else if (node.operator === '-' || node.operator === '+') {
            if (!this.typeChecker.isNumeric(operandType) &&
                operandType !== 'currency' &&
                operandType !== 'percentage' &&
                operandType !== 'unknown') {
                this.diagnostics.report({
                    code: 'FPL-T001',
                    message: `Unary operator '${node.operator}' cannot be applied to type '${operandType}'`,
                    node,
                    suggestedFix: `Use unary '${node.operator}' only with numeric, currency, or percentage values.`,
                });
                resultType = 'unknown';
            }
        }
        const constVal = this.constantResolver.tryEvaluateConstant(node);
        this.decorator.decorate(node, {
            resolvedType: resultType,
            scope: this.symbolTable.currentScope(),
            constantValue: constVal,
        });
        return resultType;
    }
    visitBinaryExpression(node) {
        const leftType = this.visit(node.left);
        const rightType = this.visit(node.right);
        let resultType = 'unknown';
        switch (node.category) {
            case 'ARITHMETIC':
            case 'PERCENTAGE_OF': {
                const check = this.typeChecker.checkArithmeticOperation(node.operator, leftType, rightType);
                if (!check.valid) {
                    this.diagnostics.report({
                        code: 'FPL-T001',
                        message: check.message,
                        node,
                        suggestedFix: `Ensure both operands of '${node.operator}' have compatible numeric or financial types.`,
                    });
                }
                resultType = check.resultType;
                break;
            }
            case 'COMPARISON': {
                const check = this.typeChecker.checkComparisonOperation(node.operator, leftType, rightType);
                if (!check.valid) {
                    this.diagnostics.report({
                        code: 'FPL-T001',
                        message: check.message,
                        node,
                        suggestedFix: `Compare values of matching or compatible types.`,
                    });
                }
                resultType = 'boolean';
                break;
            }
            case 'LOGICAL': {
                const check = this.typeChecker.checkLogicalOperation(node.operator, leftType, rightType);
                if (!check.valid) {
                    this.diagnostics.report({
                        code: 'FPL-T007',
                        message: check.message,
                        node,
                        suggestedFix: `Ensure both sides of '${node.operator}' evaluate to boolean.`,
                    });
                }
                resultType = 'boolean';
                break;
            }
            case 'COALESCE': {
                resultType = leftType !== 'null' && leftType !== 'unknown' ? leftType : rightType;
                break;
            }
            case 'RANGE': {
                resultType = 'array';
                break;
            }
        }
        const constVal = this.constantResolver.tryEvaluateConstant(node);
        this.decorator.decorate(node, {
            resolvedType: resultType,
            scope: this.symbolTable.currentScope(),
            constantValue: constVal,
        });
        return resultType;
    }
    visitTernaryExpression(node) {
        const condType = this.visit(node.condition);
        if (condType !== 'boolean' && condType !== 'unknown') {
            this.diagnostics.report({
                code: 'FPL-T007',
                message: `Inline IF condition must evaluate to 'boolean', found '${condType}'`,
                node: node.condition,
                suggestedFix: `Use a boolean condition in 'IF <cond> THEN <expr1> ELSE <expr2>'.`,
            });
        }
        const thenType = this.visit(node.consequent);
        const elseType = this.visit(node.alternate);
        if (!this.typeChecker.isAssignable(thenType, elseType) &&
            !this.typeChecker.isAssignable(elseType, thenType)) {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `Inline IF...THEN...ELSE branches have incompatible types '${thenType}' and '${elseType}'`,
                node,
                suggestedFix: `Ensure both THEN and ELSE expressions return the same type.`,
            });
        }
        const resolvedType = this.typeChecker.isAssignable(thenType, elseType)
            ? thenType
            : elseType;
        this.decorator.decorate(node, {
            resolvedType,
            scope: this.symbolTable.currentScope(),
        });
        return resolvedType;
    }
    visitFunctionCallExpression(node) {
        const argTypes = node.arguments.map((arg) => this.visit(arg));
        const { symbol, returnType } = this.functionResolver.resolveAndValidateCall(node, node.callee, argTypes, node.arguments);
        if (this.currentContainerName && symbol && symbol.kind === 'Function') {
            this.dependencyAnalyzer.addDependency(this.currentContainerName, node.callee, 'FUNCTION_CALL', node);
        }
        this.decorator.decorate(node, {
            resolvedType: returnType,
            scope: this.symbolTable.currentScope(),
            symbol,
        });
        return returnType;
    }
    visitPolicyCallExpression(node) {
        const argTypes = node.arguments.map((a) => this.visit(a.value));
        const symbol = this.policyResolver.resolveAndValidatePolicyCall(node, node.policyName, node.arguments, argTypes);
        if (this.currentContainerName) {
            this.dependencyAnalyzer.addDependency(this.currentContainerName, node.policyName.split('.')[0], 'POLICY_CALL', node);
        }
        this.decorator.decorate(node, {
            resolvedType: 'policy_result',
            scope: this.symbolTable.currentScope(),
            symbol,
        });
        return 'policy_result';
    }
    visitMemberExpression(node) {
        const objType = this.visit(node.object);
        const resolution = this.typeResolver.resolveMemberFieldType(objType, node.property);
        if (!resolution.valid) {
            this.diagnostics.report({
                code: 'FPL-T016',
                message: resolution.errorReason,
                node,
                relatedSymbol: node.property,
                suggestedFix: `Check the field name '${node.property}' on type '${objType}'.`,
            });
        }
        this.decorator.decorate(node, {
            resolvedType: resolution.fieldType,
            scope: this.symbolTable.currentScope(),
        });
        return resolution.fieldType;
    }
    visitIndexExpression(node) {
        const objType = this.visit(node.object);
        const idxType = this.visit(node.index);
        if (objType !== 'array' && objType !== 'object' && objType !== 'unknown') {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `Cannot index into non-array type '${objType}'`,
                node,
                suggestedFix: `Index operator '[...]' can only be used on 'array' or 'object' types.`,
            });
        }
        if (objType === 'array' && idxType !== 'int' && idxType !== 'unknown') {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `Array index must be of type 'int', found '${idxType}'`,
                node: node.index,
                suggestedFix: `Use an integer index expression inside '[...]'.`,
            });
        }
        // Check if the array identifier has a known elementType
        let elemType = 'unknown';
        if (node.object.type === 'IdentifierExpression') {
            const sym = this.symbolTable.resolve(node.object.name);
            if (sym?.elementType) {
                elemType = sym.elementType;
            }
        }
        this.decorator.decorate(node, {
            resolvedType: elemType,
            scope: this.symbolTable.currentScope(),
        });
        return elemType;
    }
    visitArrayLiteral(node) {
        for (const elem of node.elements) {
            this.visit(elem);
        }
        this.decorator.decorate(node, {
            resolvedType: 'array',
            scope: this.symbolTable.currentScope(),
        });
        return 'array';
    }
    visitObjectLiteral(node) {
        for (const prop of node.properties) {
            this.visit(prop.value);
        }
        this.decorator.decorate(node, {
            resolvedType: 'object',
            scope: this.symbolTable.currentScope(),
        });
        return 'object';
    }
    visitBetweenExpression(node) {
        const targetType = this.visit(node.target);
        const lowerType = this.visit(node.lower);
        const upperType = this.visit(node.upper);
        if (!this.typeChecker.isAssignable(targetType, lowerType) &&
            !this.typeChecker.isAssignable(lowerType, targetType)) {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `BETWEEN lower bound type '${lowerType}' is incompatible with target type '${targetType}'`,
                node: node.lower,
                suggestedFix: `Use bounds matching type '${targetType}'.`,
            });
        }
        if (!this.typeChecker.isAssignable(targetType, upperType) &&
            !this.typeChecker.isAssignable(upperType, targetType)) {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `BETWEEN upper bound type '${upperType}' is incompatible with target type '${targetType}'`,
                node: node.upper,
                suggestedFix: `Use bounds matching type '${targetType}'.`,
            });
        }
        this.decorator.decorate(node, {
            resolvedType: 'boolean',
            scope: this.symbolTable.currentScope(),
        });
        return 'boolean';
    }
    visitInExpression(node) {
        this.visit(node.target);
        const collType = this.visit(node.collection);
        if (collType !== 'array' && collType !== 'unknown') {
            this.diagnostics.report({
                code: 'FPL-T001',
                message: `Right-hand side of 'IN' must be an 'array' or range, found '${collType}'`,
                node: node.collection,
                suggestedFix: `Use an array literal '[...]' or range 'a..b' after 'IN'.`,
            });
        }
        this.decorator.decorate(node, {
            resolvedType: 'boolean',
            scope: this.symbolTable.currentScope(),
        });
        return 'boolean';
    }
    visitNullCheckExpression(node) {
        this.visit(node.target);
        this.decorator.decorate(node, {
            resolvedType: 'boolean',
            scope: this.symbolTable.currentScope(),
        });
        return 'boolean';
    }
    // ─── Post-Pass: Unused Variables & Parameters ─────────────────────────────
    reportUnusedSymbols() {
        for (const sym of this.symbolTable.getAllSymbols(false)) {
            if ((sym.kind === 'Variable' || sym.kind === 'InputParameter') &&
                sym.referenceCount === 0 &&
                sym.scopeKind !== 'Global') {
                const dummyNode = {
                    type: 'IdentifierExpression',
                    id: sym.id,
                    parent: null,
                    children: [],
                    location: sym.declarationLocation,
                    position: {
                        line: sym.declarationLine,
                        column: sym.declarationColumn,
                        offset: sym.declarationLocation.startOffset,
                    },
                    line: sym.declarationLine,
                    column: sym.declarationColumn,
                    startOffset: sym.declarationLocation.startOffset,
                    endOffset: sym.declarationLocation.endOffset,
                };
                this.diagnostics.report({
                    code: 'FPL-W001',
                    message: `Unused ${sym.kind === 'InputParameter' ? 'parameter' : 'variable'} '${sym.name}' in ${sym.scopeName}`,
                    severity: 'WARNING',
                    node: dummyNode,
                    relatedSymbol: sym.name,
                    suggestedFix: `Remove '${sym.name}' if it is not needed, or reference it in your policy/function logic.`,
                });
            }
        }
    }
}
exports.SemanticVisitor = SemanticVisitor;
/**
 * Top-Level Semantic Analysis Engine (`ISemanticAnalyzer`).
 * Operates on the central `ASTRepository` ("Source of Truth"), populates the
 * `SymbolTable`, builds the `DependencyGraph`, decorates AST nodes with
 * `NodeSemanticMetadata`, and produces rich `SemanticDiagnostic` items.
 */
class SemanticAnalyzer {
    lastSymbolTable = new symbol_table_1.SymbolTable();
    lastDependencyGraph = null;
    lastDecorator = null;
    /**
     * Analyzes an `ASTRepository` (or raw `ASTProgram`) and returns a complete
     * {@link SemanticResult} containing diagnostics, symbol table views, and
     * dependency graphs.
     */
    analyze(sourceOfTruth, sourceCode = '') {
        const repository = sourceOfTruth instanceof ast_repository_1.ASTRepository
            ? sourceOfTruth
            : new ast_repository_1.ASTRepository(sourceOfTruth);
        const visitor = new SemanticVisitor(repository, sourceCode);
        const root = repository.getRoot();
        visitor.visit(root);
        const dependencyGraph = visitor.dependencyAnalyzer.analyze(visitor.diagnostics);
        this.lastSymbolTable = visitor.symbolTable;
        this.lastDependencyGraph = dependencyGraph;
        this.lastDecorator = visitor.decorator;
        const allDiagnostics = visitor.diagnostics.getAll();
        const errors = visitor.diagnostics.getErrors();
        const warnings = visitor.diagnostics.getWarnings();
        return {
            repository,
            symbolTable: visitor.symbolTable,
            symbolTableRows: visitor.symbolTable.getViewerRows(false),
            formattedSymbolTable: visitor.symbolTable.formatViewerTable(false),
            dependencyGraph,
            diagnostics: allDiagnostics,
            errors: errors.map((e) => ({
                ...e,
                severity: 'error',
            })),
            warnings: warnings.map((w) => ({
                ...w,
                severity: 'warning',
            })),
            hasErrors: visitor.diagnostics.hasErrors(),
            formattedDiagnostics: visitor.diagnostics.formatDiagnostics(),
            decorator: visitor.decorator,
        };
    }
    getSymbolTable() {
        return this.lastSymbolTable;
    }
    getDependencyGraph() {
        return this.lastDependencyGraph;
    }
    getMetadataDecorator() {
        return this.lastDecorator;
    }
}
exports.SemanticAnalyzer = SemanticAnalyzer;
/**
 * Convenience helper to run Semantic Analysis on an `ASTRepository` or `ASTProgram`.
 */
function analyzeSemantics(sourceOfTruth, sourceCode = '') {
    const analyzer = new SemanticAnalyzer();
    return analyzer.analyze(sourceOfTruth, sourceCode);
}
//# sourceMappingURL=semantic-analyzer.js.map