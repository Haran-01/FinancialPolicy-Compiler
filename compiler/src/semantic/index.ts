/**
 * @finpolicy/compiler — Semantic Analysis Module Barrel Exports
 */

export type {
  ISemanticAnalyzer,
  SemanticResult,
  SemanticError,
} from './semantic.interface';

export {
  DOMAIN_ENTITY_SCHEMAS,
  TypeResolver,
  TypeChecker,
} from './type-system';

export {
  SemanticMetadataDecorator,
} from './semantic-metadata';
export type {
  EvaluationCategory,
  NodeSemanticMetadata,
  TypeInspectorHoverInfo,
} from './semantic-metadata';

export {
  SemanticDiagnostics,
} from './semantic-diagnostics';
export type {
  SemanticSeverity,
  SemanticDiagnostic,
  ReportSemanticDiagnosticParams,
} from './semantic-diagnostics';

export {
  ConstantResolver,
  ReferenceResolver,
  FunctionResolver,
  PolicyResolver,
} from './reference-resolver';

export {
  DependencyAnalyzer,
} from './dependency-analyzer';
export type {
  DependencyEntityKind,
  DependencyGraphNode,
  DependencyGraphEdge,
  DependencyGraph,
} from './dependency-analyzer';

export {
  SemanticVisitor,
  SemanticAnalyzer,
  analyzeSemantics,
} from './semantic-analyzer';
