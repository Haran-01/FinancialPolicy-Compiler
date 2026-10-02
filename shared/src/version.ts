/**
 * FinPolicy Compiler — Enterprise Release & Build Information (v1.0.0)
 */

export interface BuildInformation {
  productName: string
  version: string
  releaseChannel: 'ENTERPRISE_GA'
  buildNumber: string
  releaseDate: string
  languageVersion: string
  compilerPhases: string[]
  virtualMachine: string
  ideName: string
  minimumNodeVersion: string
}

export const FINPOLICY_VERSION_INFO: BuildInformation = {
  productName: 'FinPolicy Compiler Platform',
  version: '1.0.0',
  releaseChannel: 'ENTERPRISE_GA',
  buildNumber: '2026.10.02-GA.100',
  releaseDate: '2026-10-02',
  languageVersion: 'FPL 1.0 (Financial Policy Language)',
  compilerPhases: [
    '1. Lexical Analyzer (DFA Scanner)',
    '2. Recursive Descent Parser & AST Repository',
    '3. Semantic Analysis & Scoped Symbol Table',
    '4. Intermediate Representation (TAC, Quadruples, Triples, CFG)',
    '5. 12-Pass Optimization Engine',
    '6. Financial Policy Virtual Machine (FPVM)',
  ],
  virtualMachine: 'FPVM 1.0 Deterministic Stack & Heap Runtime',
  ideName: 'FinPolicy Studio IDE 1.0',
  minimumNodeVersion: '20.0.0',
}
