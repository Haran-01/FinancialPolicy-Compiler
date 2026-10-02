/**
 * @finpolicy/compiler — Symbol Table Module Barrel Exports
 */

export type {
  SymbolKind,
  FPLDataType,
  SymbolMutability,
  SymbolVisibility,
  SymbolInitStatus,
  ScopeKind,
  ParameterSignature,
  Symbol,
  Scope,
  SymbolTableViewRow,
  ISymbolTable,
} from './symbol-table.interface';

export {
  LexicalScope,
  GlobalScope,
  PolicyScope,
  FunctionScope,
  BlockScope,
  ScopeStack,
  ScopeManager,
} from './scope-manager';

export { SymbolTable, FPL_BUILTIN_FUNCTIONS } from './symbol-table';
