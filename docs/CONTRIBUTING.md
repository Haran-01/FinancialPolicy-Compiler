# Contributing to FinPolicy Compiler

Thank you for your interest in contributing! This guide covers everything you need to know.

---

## Development Setup

```bash
# Fork + clone the repo
git clone https://github.com/your-org/finpolicy-compiler.git
cd finpolicy-compiler

# Install all workspace dependencies
npm install

# Copy env files and fill in DB credentials
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Apply migrations and seed
npm run db:migrate
npm run db:seed

# Start the dev servers
npm run dev
```

---

## Branch Naming

All branches must follow this pattern:

| Type       | Pattern                       | Example                        |
|------------|-------------------------------|--------------------------------|
| Feature    | `feature/<short-description>` | `feature/lexer-implementation` |
| Bug fix    | `fix/<short-description>`     | `fix/jwt-refresh-rotation`     |
| Docs       | `docs/<short-description>`    | `docs/api-reference-update`    |
| Chore      | `chore/<short-description>`   | `chore/update-dependencies`    |
| Release    | `release/<version>`           | `release/1.2.0`                |

Always branch from `develop`. Only `release/*` branches are merged to `main`.

---

## Commit Message Format

We follow **Conventional Commits**:

```
<type>(<scope>): <short description>

[optional body]

[optional footer — e.g. Closes #42]
```

### Types

| Type       | When to use                                          |
|------------|------------------------------------------------------|
| `feat`     | A new user-facing feature                            |
| `fix`      | A bug fix                                            |
| `docs`     | Documentation only changes                          |
| `style`    | Formatting, missing semicolons (no logic change)     |
| `refactor` | Code restructuring without feature change            |
| `test`     | Adding or updating tests                             |
| `chore`    | Build process, dependency updates, CI config         |
| `perf`     | Performance improvement                              |

### Examples

```
feat(compiler): add constant folding optimization pass
fix(auth): prevent refresh token reuse after logout
docs(api): add execution endpoint examples to API_REFERENCE.md
chore(deps): bump vitest to 1.6.0
```

---

## Pull Request Process

1. **Branch** from `develop` using the naming convention above.
2. **Write tests** for all new behaviour (see Testing Requirements below).
3. **Ensure CI passes** — lint, typecheck, and tests must all be green.
4. **Open a PR** against `develop` using the PR template.
5. **Request at least one review** from a maintainer.
6. **Squash-merge** once approved — the PR title becomes the commit message.

---

## Code Standards

- **TypeScript strict mode** is enforced — no `any` without justification.
- **ESLint + Prettier** must pass with zero warnings before merging.
- All **public interfaces** and **exported functions** must have JSDoc.
- Use `type` imports (`import type { ... }`) for type-only dependencies.
- Prefer `const` over `let`; never use `var`.
- No `console.log` in production code — use the logger service.

---

## Testing Requirements

| Code type               | Requirement                                         |
|-------------------------|-----------------------------------------------------|
| New API endpoint        | ≥ 1 integration test covering the happy path        |
| New compiler phase      | Unit tests for at least 3 representative inputs     |
| Bug fix                 | A regression test that fails before the fix         |
| Utility / helper        | Unit tests covering edge cases (null, empty, large) |

Run tests:
```bash
npm run test              # all workspaces
npm test --workspace=backend
npm test --workspace=compiler
```

---

## Reporting Issues

- Search existing issues before opening a new one.
- Include: Node version, OS, steps to reproduce, expected vs. actual behaviour.
- For security vulnerabilities, email maintainers directly — do NOT open a public issue.
