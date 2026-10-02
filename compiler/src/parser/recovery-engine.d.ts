/**
 * Financial Policy Language (FPL) — Panic-Mode Error Recovery Engine
 *
 * Synchronizes the `TokenStream` after a syntax error so that the Recursive
 * Descent Parser can resume parsing subsequent statements or top-level
 * declarations and report all syntax errors in a single compilation pass.
 */
import { TokenStream } from './token-stream';
import { ParserContext } from './parser-context';
export declare class RecoveryEngine {
    private readonly stream;
    private readonly context;
    constructor(stream: TokenStream, context: ParserContext);
    /**
     * Advances the token stream to the next safe statement or declaration boundary.
     */
    synchronize(): void;
    /**
     * Synchronizes specifically to the next top-level declaration (`IMPORT`, `CONST`,
     * `FUNCTION`, `POLICY`, `RULE`).
     */
    synchronizeToTopLevel(): void;
}
//# sourceMappingURL=recovery-engine.d.ts.map