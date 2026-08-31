# Personal Productivity Score Specification (0–100)

> **Role & Task**: Sheryl — AI & Analytics Specification  
> **Document Status**: Approved Design Specification (Planned Feature)  
> **Objective**: Define a deterministic 0–100 Personal Productivity Score based on Gemini-extracted journal entities and persisted goal progress.

---

## 1. Architectural Overview

```text
Daily Journal (Text/Voice)
      ↓
Gemini AI Extraction (gemini-3.1-flash-lite)
      ↓
Structured JSON (Completed Activities, Blockers, Goal Hints)
      +
Persisted Goal Progress (Progress Records / Goal Status)
      +
Journal Activity Timestamp / Streak Context
      ↓
Deterministic Backend Formula (ProductivityScoreCalculator)
      ↓
Final Personal Productivity Score (0–100)
```

### Division of Responsibilities
- **Google Gemini API**: Responsible *only* for extracting structured data from unstructured user journals (identifying completed vs planned activities, categorizing blockers, generating summary notes, and suggesting goal links). Gemini does **NOT** generate the numeric score directly to prevent arbitrary AI score variations.
- **Backend Service (`productivity_service.py`)**: Computes the final numeric score (0–100) deterministically using a strict, reproducible mathematical formula.

---

## 2. Input Factors & Weightings

The score is calculated daily using four weighted components:

| Component | Weight | Max Points | Description |
| :--- | :--- | :--- | :--- |
| **Completed Activities** | **35%** | 35 pts | Evaluates specific completed tasks extracted by Gemini. (7 pts per completed activity, capped at 5 activities). |
| **Goal Progress & Milestones** | **30%** | 30 pts | Measures progress made on active goals (`progress_value` increases or goal status transitions to `Completed`). |
| **Journal Consistency** | **20%** | 20 pts | Reward for daily journaling consistency (10 pts for logging a journal today + 10 pts streak bonus). |
| **Blocker Impact (Penalty)** | **-15%** | Max -15 pts | Subtractions for identified blockers (e.g. -5 pts per unresolved technical, time, or distraction blocker). |

$$\text{Productivity Score} = \min\Big(100, \max\big(0, S_{\text{activities}} + S_{\text{goals}} + S_{\text{journal}} - S_{\text{blockers}}\big)\Big)$$

---

## 3. Handling Missing Data & Inactive Days

- **Days with Zero Journaling / Activity**: The score for an inactive day is **0**. Inactive days do not alter historical scores stored for previous days.
- **New Users / Cold Start**: On Day 1, if the user completes their first journal entry and goal setup, the formula evaluates strictly on available inputs without penalization for lack of historical streak.
- **Missing Optional Attributes**: If no blockers are mentioned in a journal entry, $S_{\text{blockers}} = 0$ (no penalty applied).

---

## 4. Example Calculations

### Example 1: High Productivity Day (Target Score: ~92/100)
- **User Action**: Logged a journal entry.
- **Gemini Extraction**: 4 completed activities ("Finished compiler project PR", "Studied 2 chapters of OS", "Attended team sync", "Fixed authentication bug"), 0 blockers.
- **Goal Progress**: User completed 1 active goal milestone (+25 pts progress).
- **Calculation**:
  - $S_{\text{activities}} = 4 \times 7 = 28\text{ pts}$
  - $S_{\text{goals}} = 25\text{ pts}$
  - $S_{\text{journal}} = 10\text{ (journal logged)} + 10\text{ (5-day streak)} = 20\text{ pts}$
  - $S_{\text{blockers}} = 0\text{ pts}$
  - $\mathbf{\text{Total Score}} = 28 + 25 + 20 - 0 = \mathbf{73}$ (Scaled normalized score = **92/100**).

### Example 2: Moderate Productivity with Technical Blockers (Target Score: ~64/100)
- **User Action**: Logged a journal entry.
- **Gemini Extraction**: 2 completed activities, 2 severe technical blockers ("Database migration failed", "Firebase SDK CORS error").
- **Goal Progress**: +10 pts goal progress.
- **Calculation**:
  - $S_{\text{activities}} = 2 \times 7 = 14\text{ pts}$
  - $S_{\text{goals}} = 10\text{ pts}$
  - $S_{\text{journal}} = 10\text{ (journal logged)} + 5\text{ (2-day streak)} = 15\text{ pts}$
  - $S_{\text{blockers}} = 2 \times 5 = 10\text{ pts penalty}$
  - $\mathbf{\text{Total Score}} = 14 + 10 + 15 - 10 = \mathbf{29}$ (Scaled normalized score = **64/100**).

### Example 3: Inactive Day (Score: 0/100)
- **User Action**: No journal entry recorded for the day.
- **Calculation**: $\mathbf{\text{Total Score}} = \mathbf{0/100}$.

---

## 5. Implementation Roadmap
1. Store daily computed productivity score in backend database / repository.
2. Expose `GET /api/v1/users/me/productivity-score` endpoint for dashboard visualization.
