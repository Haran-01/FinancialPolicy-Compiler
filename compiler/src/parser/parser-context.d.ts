/**
 * Financial Policy Language (FPL) — Parser Context
 *
 * Tracks the active syntactic scopes during Recursive Descent Parsing so that
 * error messages and panic-mode synchronization know whether the parser is
 * inside a `POLICY`, `FUNCTION`, `RULE`, `IF`, or loop block.
 */
export type ParserBlockKind = 'PROGRAM' | 'POLICY' | 'FUNCTION' | 'RULE' | 'IF' | 'MATCH' | 'LOOP' | 'TRY';
export declare class ParserContext {
    private readonly blockStack;
    private loopDepth;
    private inPanicMode;
    enterBlock(kind: ParserBlockKind): void;
    exitBlock(): ParserBlockKind | undefined;
    currentBlock(): ParserBlockKind;
    isInsideBlock(kind: ParserBlockKind): boolean;
    isInsideLoop(): boolean;
    setPanicMode(panic: boolean): void;
    isInPanicMode(): boolean;
    reset(): void;
}
//# sourceMappingURL=parser-context.d.ts.map