# FinPolicy Studio Focus Recommendation

## Core Product Story

FinPolicy Studio should present one clear workflow:

1. Author a Financial Policy Language (`.fpl`) policy.
2. Compile it through lexer, parser, semantic analysis, IR generation, and optimization.
3. Execute it on the Financial Policy Virtual Machine.
4. Inspect diagnostics, optimized TAC, CFG/basic blocks, symbol table, and VM trace in Developer Mode.

The main application should feel like a compiler IDE for financial policies, not a broad enterprise SaaS platform.

## Main Navigation

Keep the visible product surface small:

- Studio
- Policies
- Execution History
- Dashboard
- Audit Log
- Settings

The following pages can remain as optional/internal routes, but should not be first-class navigation items:

- Compiler Console
- QA & Benchmarks
- Analytics
- Release Center
- API Keys

## Recommended Demo Flow

For project presentation:

1. Open `Studio`.
2. Select a sample policy from the workspace explorer.
3. Compile the policy and show diagnostics.
4. Toggle Developer Mode.
5. Walk through tokens, parser/AST summary, semantic table, IR/TAC, optimization, and VM trace.
6. Execute with sample inputs and explain the final decision.

## Cleanup Priorities

1. Treat `/studio` as the primary experience.
2. Keep compiler internals behind Developer Mode.
3. Remove duplicate mental models between `/studio` and `/compiler`.
4. Decide whether the app uses the real backend compiler path or the frontend live demo engines.
5. Make backend contracts build-clean only after the frontend story is stable.

## Current Direction

The frontend has been adjusted so the default route and sidebar favor the focused Studio workflow. Optional enterprise pages still exist for reuse, but they no longer dominate the visible user journey.
