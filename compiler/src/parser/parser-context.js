"use strict";
/**
 * Financial Policy Language (FPL) — Parser Context
 *
 * Tracks the active syntactic scopes during Recursive Descent Parsing so that
 * error messages and panic-mode synchronization know whether the parser is
 * inside a `POLICY`, `FUNCTION`, `RULE`, `IF`, or loop block.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserContext = void 0;
class ParserContext {
    blockStack = ['PROGRAM'];
    loopDepth = 0;
    inPanicMode = false;
    enterBlock(kind) {
        this.blockStack.push(kind);
        if (kind === 'LOOP') {
            this.loopDepth += 1;
        }
    }
    exitBlock() {
        const popped = this.blockStack.pop();
        if (popped === 'LOOP' && this.loopDepth > 0) {
            this.loopDepth -= 1;
        }
        return popped;
    }
    currentBlock() {
        return this.blockStack[this.blockStack.length - 1] ?? 'PROGRAM';
    }
    isInsideBlock(kind) {
        return this.blockStack.includes(kind);
    }
    isInsideLoop() {
        return this.loopDepth > 0;
    }
    setPanicMode(panic) {
        this.inPanicMode = panic;
    }
    isInPanicMode() {
        return this.inPanicMode;
    }
    reset() {
        this.blockStack.length = 0;
        this.blockStack.push('PROGRAM');
        this.loopDepth = 0;
        this.inPanicMode = false;
    }
}
exports.ParserContext = ParserContext;
//# sourceMappingURL=parser-context.js.map