# FinPolicy Studio — Enterprise IDE Architecture & Documentation

**Project:** FinPolicy Studio (`Phase 6`)  
**Language:** Financial Policy Language (`FPL`)  
**Route:** `/studio` ([`FinPolicyStudioPage.tsx`](file:///c:/Users/User/Desktop/compiler-project/frontend/src/pages/studio/FinPolicyStudioPage.tsx))  
**State Store:** [`studio.store.ts`](file:///c:/Users/User/Desktop/compiler-project/frontend/src/stores/studio.store.ts)

---

## 1. Feature-Based Folder Structure

```
frontend/src/
├── pages/studio/
│   └── FinPolicyStudioPage.tsx           # Full-screen desktop-style IDE shell
├── features/studio/
│   ├── StudioTopNavigation.tsx           # Logo, Workspace Selector, Search, Notifications, Theme, Dev Mode Toggle
│   ├── StudioLeftSidebar.tsx             # Project Explorer, Folders, Favorites, Pinned, Recent, History, File Ops
│   ├── StudioEditorToolbar.tsx           # Multi-Tabs, Split View, Save, Compile, Execute, Format, Versions, Share
│   ├── StudioBottomPanel.tsx             # Problems, Compiler Output, Execution Console, Logs, Terminal
│   ├── StudioRightSidebar.tsx            # Policy Properties & Execution Results
│   ├── StudioDeveloperPanel.tsx          # Collapsible Developer Mode Panel (OFF by default)
│   ├── StudioStatusBar.tsx               # Compiler Status, Current Policy, Cursor Position, Encoding, Timing
│   └── StudioModals.tsx                  # Command Palette (Ctrl+Shift+P), Global Search (Ctrl+F), Settings, Versions
├── stores/
│   └── studio.store.ts                   # Zustand store for FinPolicy Studio IDE state
└── lib/
    └── fpl-language.ts                   # Monaco FPL Language, Completions, Dark & Light Themes
```

---

## 2. Desktop IDE Layout Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Top Navigation: Logo | Workspace Selector | Search (Ctrl+F) | Dev Mode | Theme   │
├──────────────────┬────────────────────────────────────────────┬──────────────────┤
│ Left Sidebar     │ Editor Tabs & Action Toolbar               │ Right Sidebar    │
│ • Explorer       ├────────────────────────────────────────────┤ • Properties     │
│ • Folders        │ Main Monaco Editor (Single or Split View)  │ • Execution      │
│ • Policies       │ • Syntax Highlighting & Auto-Completion    │   Results        │
│ • Favorites      │ • Bracket Matching, Code Folding, Minimap  │   (Policy Name,  │
│ • Pinned         ├────────────────────────────────────────────┤    Decision,     │
│ • Recent Files   │ Bottom Panel                               │    Returned      │
│ • Compilations   │ • Problems | Output | Execution | Logs | $ │    Values, Time) │
│ • Executions     ├────────────────────────────────────────────┤                  │
│                  │ [Collapsible Developer Panel — When ON]    │                  │
├──────────────────┴────────────────────────────────────────────┴──────────────────┤
│ Status Bar: Compiler Status | Policy.fpl | Compile ms | Exec ms | Ln, Col | UTF-8│
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Developer Mode Progressive Disclosure

- **Default State:** `developerMode = false` (**OFF by default**).
- **When OFF:** All compiler internals (Lexer tokens, Parser trees, AST nodes, Semantic tables, Symbol tables, TAC/Quadruples IR, Optimization passes, and VM instruction traces) are completely hidden so policy authors experience a clean, high-productivity environment.
- **When ON:** Toggling **Developer Mode** in [`StudioTopNavigation.tsx`](file:///c:/Users/User/Desktop/compiler-project/frontend/src/features/studio/StudioTopNavigation.tsx) unlocks the collapsible [`StudioDeveloperPanel.tsx`](file:///c:/Users/User/Desktop/compiler-project/frontend/src/features/studio/StudioDeveloperPanel.tsx) with 10 specialized inspection views:
  1. `Compilation Pipeline`
  2. `Lexer Output`
  3. `Parser Output`
  4. `AST`
  5. `Semantic Analysis`
  6. `Symbol Table`
  7. `IR`
  8. `Optimization Summary`
  9. `Execution Trace`
  10. `Compiler Logs`

---

## 4. Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + S` | Save active policy |
| `Ctrl + Shift + B` | Compile active policy |
| `F5` | Execute active policy on FPVM |
| `Ctrl + F` | Open Global / Policy / Workspace Search |
| `Ctrl + Shift + P` | Open Command Palette |
