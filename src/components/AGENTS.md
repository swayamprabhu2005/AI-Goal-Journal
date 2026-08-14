# UI Components DOX Contract — src/components/AGENTS.md

> **Subtree Scope**: Reusable UI primitives and shared components (`src/components/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

Provide reusable, accessible, unstyled-by-default or token-styled UI components that encapsulate visual consistency and interaction states across the application.

---

## 2. Component Contracts

- **`VoiceRecorder.jsx`**:
  - Encapsulates `navigator.mediaDevices.getUserMedia` and `MediaRecorder`.
  - Must support lifecycle: `idle` $\rightarrow$ `recording` $\rightarrow$ `recorded` $\rightarrow$ `transcribing` $\rightarrow$ `editable_transcript`.
  - Must provide an editable `<textarea>` containing the raw transcript so the user can edit or discard before inserting into the journal.
  - Must cleanly release audio tracks (`stream.getTracks().forEach(t => t.stop())`) and revoke object URLs on unmount/reset.
- **`Button.jsx`**:
  - Supports variants: `primary`, `secondary`, `ghost`, `danger`.
  - Supports `loading` spinner and `disabled` states with accessible focus rings.
- **`Card.jsx`**:
  - Container element applying `rounded-card border border-line bg-white/80 p-5 shadow-soft`.
- **`Input.jsx`**:
  - Accessible form control with `<label>`, error messaging, and `aria-invalid` bindings.
- **`Navbar.jsx` / `Sidebar.jsx` / `AppShell.jsx`**:
  - Application layout frames providing consistent brand header and navigation links (`Dashboard`, `Journal`, `Goals`, `AI Coach`, `Profile`).

---

## 3. Prohibited Patterns

- Do NOT embed direct API calls inside primitive components (like `Button` or `Card`).
- Do NOT use hardcoded colors outside the Tailwind theme palette.
