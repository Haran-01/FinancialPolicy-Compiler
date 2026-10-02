"use strict";
/**
 * @finpolicy/compiler — Semantic Analysis Module Barrel Exports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSemantics = exports.SemanticAnalyzer = exports.SemanticVisitor = exports.DependencyAnalyzer = exports.PolicyResolver = exports.FunctionResolver = exports.ReferenceResolver = exports.ConstantResolver = exports.SemanticDiagnostics = exports.SemanticMetadataDecorator = exports.TypeChecker = exports.TypeResolver = exports.DOMAIN_ENTITY_SCHEMAS = void 0;
var type_system_1 = require("./type-system");
Object.defineProperty(exports, "DOMAIN_ENTITY_SCHEMAS", { enumerable: true, get: function () { return type_system_1.DOMAIN_ENTITY_SCHEMAS; } });
Object.defineProperty(exports, "TypeResolver", { enumerable: true, get: function () { return type_system_1.TypeResolver; } });
Object.defineProperty(exports, "TypeChecker", { enumerable: true, get: function () { return type_system_1.TypeChecker; } });
var semantic_metadata_1 = require("./semantic-metadata");
Object.defineProperty(exports, "SemanticMetadataDecorator", { enumerable: true, get: function () { return semantic_metadata_1.SemanticMetadataDecorator; } });
var semantic_diagnostics_1 = require("./semantic-diagnostics");
Object.defineProperty(exports, "SemanticDiagnostics", { enumerable: true, get: function () { return semantic_diagnostics_1.SemanticDiagnostics; } });
var reference_resolver_1 = require("./reference-resolver");
Object.defineProperty(exports, "ConstantResolver", { enumerable: true, get: function () { return reference_resolver_1.ConstantResolver; } });
Object.defineProperty(exports, "ReferenceResolver", { enumerable: true, get: function () { return reference_resolver_1.ReferenceResolver; } });
Object.defineProperty(exports, "FunctionResolver", { enumerable: true, get: function () { return reference_resolver_1.FunctionResolver; } });
Object.defineProperty(exports, "PolicyResolver", { enumerable: true, get: function () { return reference_resolver_1.PolicyResolver; } });
var dependency_analyzer_1 = require("./dependency-analyzer");
Object.defineProperty(exports, "DependencyAnalyzer", { enumerable: true, get: function () { return dependency_analyzer_1.DependencyAnalyzer; } });
var semantic_analyzer_1 = require("./semantic-analyzer");
Object.defineProperty(exports, "SemanticVisitor", { enumerable: true, get: function () { return semantic_analyzer_1.SemanticVisitor; } });
Object.defineProperty(exports, "SemanticAnalyzer", { enumerable: true, get: function () { return semantic_analyzer_1.SemanticAnalyzer; } });
Object.defineProperty(exports, "analyzeSemantics", { enumerable: true, get: function () { return semantic_analyzer_1.analyzeSemantics; } });
//# sourceMappingURL=index.js.map