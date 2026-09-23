# UI Components DOX Contract — src/components/AGENTS.md

> **Subtree Scope**: Reusable UI primitives and shared components (`src/components/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

Provide reusable, accessible, unstyled-by-default or token-styled UI components that encapsulate visual consistency and interaction states across the application.

---

## 2. Component Contracts

- **`TrendChart.jsx`**:
  - Reusable pure SVG vector trend chart for historical progress data and multi-goal trajectories.
  - Supports single-goal mode via `history` array or multi-goal mode via `multiSeries` array (each series containing `id`, `name`, `color`, and `points`).
  - Supports distinct Calm Moss line colors, milestone start/current badges (`Start 0%`, `Current X%`), coordinate scaling (`viewBox="0 0 100 100"` with `preserveAspectRatio="none"`), smooth gradient area fills, and interactive data point inspection.
  - Renders graceful empty state when fewer than 2 progress checkpoints are recorded.
- **`FormattedChatMessage.jsx`**:
  - High-readability chat renderer for AI coaching responses.
  - Formats markdown headers (`###`), bold keyphrases (`**`), bullet points, numbered action steps, and quote callouts into structured Calm Moss aesthetic cards.
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
  - Application layout frames providing consistent brand header and navigation links (`Dashboard`, `Journal`, `Goals`, `AI Coach`, `Insights`, `Habits`, `Progress`, `Calendar`, `Profile`).
  - `AppShell.jsx` ensures automatic scroll-to-top on route changes.

---

## 3. Prohibited Patterns

- Do NOT embed direct API calls inside primitive components (like `Button` or `Card`).
- Do NOT use hardcoded colors outside the Tailwind theme palette.
