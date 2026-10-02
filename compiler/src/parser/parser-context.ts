/**
 * Financial Policy Language (FPL) — Parser Context
 *
 * Tracks the active syntactic scopes during Recursive Descent Parsing so that
 * error messages and panic-mode synchronization know whether the parser is
 * inside a `POLICY`, `FUNCTION`, `RULE`, `IF`, or loop block.
 */

export type ParserBlockKind =
  | 'PROGRAM'
  | 'POLICY'
  | 'FUNCTION'
  | 'RULE'
  | 'IF'
  | 'MATCH'
  | 'LOOP'
  | 'TRY';

export class ParserContext {
  private readonly blockStack: ParserBlockKind[] = ['PROGRAM'];
  private loopDepth = 0;
  private inPanicMode = false;

  public enterBlock(kind: ParserBlockKind): void {
    this.blockStack.push(kind);
    if (kind === 'LOOP') {
      this.loopDepth += 1;
    }
  }

  public exitBlock(): ParserBlockKind | undefined {
    const popped = this.blockStack.pop();
    if (popped === 'LOOP' && this.loopDepth > 0) {
      this.loopDepth -= 1;
    }
    return popped;
  }

  public currentBlock(): ParserBlockKind {
    return this.blockStack[this.blockStack.length - 1] ?? 'PROGRAM';
  }

  public isInsideBlock(kind: ParserBlockKind): boolean {
    return this.blockStack.includes(kind);
  }

  public isInsideLoop(): boolean {
    return this.loopDepth > 0;
  }

  public setPanicMode(panic: boolean): void {
    this.inPanicMode = panic;
  }

  public isInPanicMode(): boolean {
    return this.inPanicMode;
  }

  public reset(): void {
    this.blockStack.length = 0;
    this.blockStack.push('PROGRAM');
    this.loopDepth = 0;
    this.inPanicMode = false;
  }
}
