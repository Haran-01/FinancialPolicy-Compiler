/**
 * @finpolicy/compiler — Public API
 *
 * Completed Phases:
 * - Phase 3A: Lexical Analysis (`Lexer`, `compileSource`, `tokenize`)
 * - Phase 3B: Parsing Engine & Central AST Repository (`Parser`, `parseTokens`, `ASTRepository`, `ASTBuilder`, `ASTPrettyPrinter`)
 * - Phase 3C: Semantic Analysis & Symbol Table Engine (`SemanticAnalyzer`, `analyzeSemantics`, `SymbolTable`, `ScopeManager`, `TypeChecker`, `DependencyAnalyzer`)
 *
 * Downstream phases (IR, Optimizer, CodeGen, Runtime) remain interface contracts
 * until their respective implementation phases.
 */

// ── Lexer Implementation & Types ──────────────────────────────────────────
export {
  Lexer,
  compileSource,
  tokenize,
  SourceBuffer,
  CharacterReader,
  TokenGenerator,
  DiagnosticReporter,
  TokenType,
  TokenCategory,
  RESERVED_KEYWORDS,
  TYPE_KEYWORDS,
  MULTI_CHAR_OPERATORS,
  SINGLE_CHAR_OPERATORS,
  DELIMITERS,
  getTokenCategory,
  formatTokenTable,
  isValidIsoDate,
} from './lexer';

export type {
  ILexer,
  Token,
  TokenPosition,
  TokenLiteralValue,
  CurrencyLiteralValue,
  PercentageLiteralValue,
  DateLiteralValue,
  LexerDiagnostic,
  LexerError,
  LexerResult,
  LexerDiagnosticSeverity,
} from './lexer';

// ── Parser Implementation & Types ─────────────────────────────────────────
export {
  Parser,
  parseTokens,
  TokenStream,
  ParserContext,
  SyntaxDiagnostics,
  RecoveryEngine,
} from './parser';

export type {
  IParser,
  ParseResult,
  ParseError,
  ParserBlockKind,
  SyntaxDiagnostic,
  SyntaxSeverity,
  ReportSyntaxErrorParams,
} from './parser';

// ── AST & Central ASTRepository ───────────────────────────────────────────
export {
  ASTFactory,
  ASTBuilder,
  BaseASTVisitor,
  ASTPrettyPrinter,
  ASTRepository,
} from './ast';

export type {
  ASTRepositoryMetadata,
  ASTVisitor,
  ASTGraphNode,
  ASTGraphEdge,
  ASTGraphRepresentation,
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
} from './ast';

// ── Symbol Table & Scope Management ───────────────────────────────────────
export {
  LexicalScope,
  GlobalScope,
  PolicyScope,
  FunctionScope,
  BlockScope,
  ScopeStack,
  ScopeManager,
  SymbolTable,
  FPL_BUILTIN_FUNCTIONS,
} from './symbol-table';

export type {
  ISymbolTable,
  Symbol,
  SymbolKind,
  FPLDataType,
  SymbolMutability,
  SymbolVisibility,
  SymbolInitStatus,
  ScopeKind,
  ParameterSignature,
  Scope,
  SymbolTableViewRow,
} from './symbol-table';

// ── Semantic Analysis Engine ──────────────────────────────────────────────
export {
  DOMAIN_ENTITY_SCHEMAS,
  TypeResolver,
  TypeChecker,
  SemanticMetadataDecorator,
  SemanticDiagnostics,
  ConstantResolver,
  ReferenceResolver,
  FunctionResolver,
  PolicyResolver,
  DependencyAnalyzer,
  SemanticVisitor,
  SemanticAnalyzer,
  analyzeSemantics,
} from './semantic';

export type {
  ISemanticAnalyzer,
  SemanticResult,
  SemanticError,
  EvaluationCategory,
  NodeSemanticMetadata,
  TypeInspectorHoverInfo,
  SemanticSeverity,
  SemanticDiagnostic,
  ReportSemanticDiagnosticParams,
  DependencyEntityKind,
  DependencyGraphNode,
  DependencyGraphEdge,
  DependencyGraph,
} from './semantic';

// ── Intermediate Representation (IR) Generation Engine ────────────────────
export {
  TemporaryVariableGenerator,
  TemporaryVariableManager,
  LabelGenerator,
  LabelManager,
  IRFactory,
  InstructionBuilder,
  IRBuilder,
  TACGenerator,
  QuadrupleGenerator,
  TripleGenerator,
  IndirectTripleGenerator,
  BasicBlockBuilder,
  ControlFlowBuilder,
  CFGBuilder,
  IRValidator,
  IRPrettyPrinter,
  IRSerializer,
  IRVisitor,
  IRGenerator,
  generateIR,
} from './ir';

export type {
  IIRGenerator,
  IRInstruction,
  IRProgram,
  IROpcode,
  IROperand,
  ThreeAddressInstruction,
  Quadruple,
  Triple,
  IndirectTripleEntry,
  IndirectTripleTable,
  TemporaryVariableInfo,
  LabelInfo,
  BasicBlockKind,
  BasicBlock,
  CFGEdgeKind,
  CFGEdge,
  ControlFlowGraph,
  IRValidationCode,
  IRValidationIssue,
  IRValidationResult,
  SerializedIRJson,
  BinaryIREnvelope,
} from './ir';

// ── Optimization Engine (Phase 3E) ────────────────────────────────────────
export {
  ConstantEvaluator,
  ExpressionAnalyzer,
  DataFlowAnalyzer,
  ControlFlowAnalyzer,
  IRRewriter,
  OptimizationContext,
  BaseOptimizationPass,
  ConstantFoldingPass,
  ConstantPropagationPass,
  CopyPropagationPass,
  CommonSubexpressionEliminationPass,
  DeadCodeEliminationPass,
  DeadPolicyEliminationPass,
  StrengthReductionPass,
  AlgebraicSimplificationPass,
  ConditionalSimplificationPass,
  JumpOptimizationPass,
  BasicBlockOptimizationPass,
  RuleReorderingPass,
  createStandardOptimizationPasses,
  OptimizationMetrics,
  OptimizationReporter,
  OptimizationPipeline,
  OptimizationManager,
  Optimizer,
  optimizeIR,
} from './optimizer';

export type {
  IOptimizer,
  OptimizationPass,
  OptimizationPassName,
  OptimizationOptions,
  OptimizationResult,
  OptimizationReport,
  OptimizationMetricsSummary,
  PassStatistics,
  PassExecutionSnapshot,
  TransformationRecord,
  DeadEntityWarning,
  SideBySideDiffRow,
  ConstantFoldOutcome,
  AlgebraicSimplificationMatch,
  StrengthReductionMatch,
  UseDefSummary,
} from './optimizer';

// ── Code Generator (Interface Only) ───────────────────────────────────────
export type {
  ICodeGenerator,
  GeneratedCode,
} from './codegen/codegen.interface';

// ── Financial Policy Virtual Machine (FPVM — Phase 4) ─────────────────────
export {
  FPVMRuntimeException,
  RuntimeDiagnostics,
  RuntimeLogger,
  StackManager,
  FrameManager,
  CallStack,
  HeapManager,
  MemoryManager,
  InstructionDecoder,
  ProgramLoader,
  Profiler,
  VMDebugger,
  InstructionDispatcher,
  FinancialPolicyVM,
  VirtualMachine,
  ExecutionEngine,
  executePolicyIR,
} from './runtime';

export type {
  IFinancialPolicyVM,
  IExecutionEngine,
  ExecutionContext,
  ExecutionOptions,
  RuntimeError,
  IRExecutor,
  VMExecutionStatus,
  VMDecision,
  VMRegisterState,
  StackFrameKind,
  StackFrame,
  StackFrameSnapshot,
  HeapObject,
  MemoryStatistics,
  DecodedOpcode,
  DecodedInstruction,
  SubroutineMetadata,
  LoadedProgramImage,
  RuntimeErrorCode,
  RuntimeDiagnostic,
  RuntimeLogEntry,
  VariableChangeDelta,
  StackChangeDelta,
  VMExecutionTraceStep,
  HotInstructionProfile,
  ProfilerReport,
  Breakpoint,
  DebuggerState,
  VariableSnapshotView,
  FPVMExecutionReport,
  FPVMVisualizationPayload,
  StepMode,
  DispatchStepOutcome,
} from './runtime';

// ── Diagnostics (Interface Only) ──────────────────────────────────────────
export type {
  IDiagnostics,
  CompilerDiagnostic,
  CompilerPhase,
  DiagnosticSeverity,
} from './diagnostics/diagnostics.interface';

// ── Pipeline (Interface Only) ─────────────────────────────────────────────
export type {
  CompilerPipeline,
  PipelineStage,
  PipelineResult,
  PipelineStageResult,
} from './pipeline/pipeline.interface';

export {
  DEFAULT_COMPILE_OPTIONS,
  FinPolicyCompilerPipeline,
  compilePolicySource,
  compileAndRunPolicy,
  collectCompilationDiagnostics,
} from './pipeline';

export type {
  CompilerPipelineSuccess,
  CompilerPipelineFailure,
  FinPolicyCompileResult,
  CompileAndRunResult,
} from './pipeline';
