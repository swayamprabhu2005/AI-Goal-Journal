Personal Productivity Score — Specification
Author: Sheryl
Component: Productivity Score Logic
Status: Design spec for implementation
---
1. Purpose
Produce a single explainable score from 0–100 representing a user's current productivity, derived from goals, journal activity, and AI-extracted journal signals — using a consistent, deterministic formula, not an AI-generated number. Gemini's role is limited to extracting structured signals from journal text; it never assigns the score itself. This guarantees that two users with equivalent underlying behavior always receive the same score.
---
2. Inputs
#	Input	Source	Extracted by
1	Goal progress (active goals)	`goals` table	Backend (deterministic)
2	Goal completion ratio	`goals` table	Backend (deterministic)
3	Completed activities/tasks	`journals.ai_analysis.activities`	Gemini (extraction), counted by backend
4	Journal consistency (activity frequency)	`journals.created_at` timestamps	Backend (deterministic)
5	Blockers (frequency/recency)	`journals.ai_analysis.blockers`	Gemini (extraction), counted by backend
What Gemini extracts vs. what the backend calculates
This split is the core design decision: Gemini never outputs a number that becomes part of the score. It only extracts structured facts from unstructured text — exactly what it already does today (activities, blockers, goal mentions). The backend then counts, aggregates, and weights those facts using a fixed formula.
Layer	Responsibility
Gemini	From journal text: identify completed activities, identify blockers (+ category), identify goal-related activity/mentions. Already implemented in `gemini_service.analyze_journal`.
Backend	Count/aggregate the above, combine with persisted goal status/progress and journal timestamps, apply the fixed weighted formula below, output 0–100.
This means the score is reproducible — recomputing it from the same stored data always yields the same result, and it isn't vulnerable to LLM output drift between calls.
---
3. Weightings
Component              Weight             Rationale
Goal Progress          30%                Primary signal are active goals actually moving forward
Goal Completion        20%                Rewards follow-through, not just activity
Completed Activities   20%                Captures day-to-day execution, not just goal-linked work
Journal Consistency    30%                Reflects engagement/reflection habit, a leading indicator
Blockers (penalty)     -10% (deduction)   Recurring/unresolved blockers reduce the score, reflects friction
---
4. Formula
```
Base Score =
      (0.30 × GoalProgressScore)
    + (0.20 × GoalCompletionScore)
    + (0.20 × CompletedActivitiesScore)
    + (0.30 × JournalConsistencyScore)

Blocker Penalty = min(15, BlockerCount_last_7_days × 3)

Final Score = clamp( Base Score − Blocker Penalty, 0, 100 )
```
Component definitions
GoalProgressScore (0–100):
Average `progress_percent` across all active goals. If a goal hasn't been updated in >30 days, its contribution decays toward 0 (stale progress shouldn't count as current momentum).
GoalCompletionScore (0–100):
`(completed goals / total goals) × 100`. If the user has fewer than 3 goals total, dampen slightly (×0.8) so one lucky early completion doesn't read as a perfect record.
CompletedActivitiesScore (0–100):
Count of activities marked `"completed"` by Gemini across the last 7 days, scaled against a target of 10 completed activities/week → `min(100, (completed_count / 10) × 100)`. Target is a starting assumption, tunable once real usage data exists.
JournalConsistencyScore (0–100):
Distinct days journaled in the last 7 days, scaled against a target of 5 active days/week (not 7 — daily journaling isn't realistic for every user type) → `min(100, (days_journaled / 5) × 100)`.
BlockerPenalty:
Counts blockers extracted across the last 7 days. Each blocker costs 3 points, capped at a 15-point maximum deduction — so blockers matter, but can't tank the score entirely (a rough week shouldn't zero out otherwise-strong progress).
---
5. Handling Insufficient / Missing Data
Scenario	Handling
No goals at all	`GoalProgressScore = 0`, `GoalCompletionScore = 0` — score reflects that goal-setting hasn't started yet, not an error state
No journal entries in the last 7 days	`CompletedActivitiesScore = 0`, `JournalConsistencyScore = 0`, `BlockerPenalty = 0` (no data = no penalty either)
New user (first day)	All components default to 0 rather than null/undefined; score naturally starts near 0 and grows as real data accumulates — no artificial "starter" score is injected
Goal exists but `progress_percent` not yet tracked	Treated as neutral midpoint (50) for that goal only, flagged in the breakdown as "estimated" rather than measured, until real progress data is available
Partial week (e.g., app used for only 2 days so far)	Formula still runs on whatever window of real data exists — no special-casing required, since the targets (10 activities/week, 5 days/week) already scale linearly and cap at 100 rather than requiring a "complete" week
Principle: missing data always defaults to the lowest reasonable value for that component (0, or neutral-50 only where no ground truth exists yet) rather than being excluded from the average — so an inactive user trends toward a low score instead of an artificially inflated one from having "no bad data to average in."
---
6. Example Calculations
Example 1 — Highly engaged user
2 active goals, avg progress 80%, both updated within last 3 days → GoalProgressScore = 80
5 goals total, 3 completed → GoalCompletionScore = 60
12 completed activities in last 7 days → CompletedActivitiesScore = min(100, 120) = 100
Journaled 6 of last 7 days → JournalConsistencyScore = min(100, 120) = 100
1 blocker logged in last 7 days → BlockerPenalty = min(15, 3) = 3
```
Base = (0.30 × 80) + (0.20 × 60) + (0.20 × 100) + (0.30 × 100)
     = 24 + 12 + 20 + 30 = 86
Final = clamp(86 − 3, 0, 100) = 83
```
Score: 83/100 — "Solid progress, keep the consistency going." Sensible: strong activity and consistency, but goal completion ratio and one blocker keep it from the 90s.
Example 2 — Inactive/stalled user
1 active goal, progress 20%, last updated 25 days ago → decay applies, effective GoalProgressScore ≈ 20 × 0.4 = 8
2 goals total, 0 completed → GoalCompletionScore = 0
0 completed activities in last 7 days → CompletedActivitiesScore = 0
Journaled 0 of last 7 days → JournalConsistencyScore = 0
No journal entries → BlockerPenalty = 0 (no data, no penalty)
```
Base = (0.30 × 8) + (0.20 × 0) + (0.20 × 0) + (0.30 × 0) = 2.4
Final = clamp(2.4 − 0, 0, 100) = 2
```
Score: 2/100 — "Just getting started." Sensible: correctly reflects near-total inactivity without being unfairly punitive (no blocker penalty on top of an already-low base).
Example 3 — Moderate user with recurring friction
3 active goals, avg progress 55%, updated within last week → GoalProgressScore = 55
4 goals total, 1 completed → GoalCompletionScore = 25
6 completed activities in last 7 days → CompletedActivitiesScore = min(100, 60) = 60
Journaled 4 of last 7 days → JournalConsistencyScore = min(100, 80) = 80
4 blockers logged in last 7 days (recurring technical issue) → BlockerPenalty = min(15, 12) = 12
```
Base = (0.30 × 55) + (0.20 × 25) + (0.20 × 60) + (0.30 × 80)
     = 16.5 + 5 + 12 + 24 = 57.5
Final = clamp(57.5 − 12, 0, 100) = 45.5 → 46
```
Score: 46/100 — "Making some headway." Sensible: reasonable underlying activity and consistency, but the recurring-blocker penalty visibly drags the score down — which is the intended signal (surface friction, don't hide it).
---
7. Why This Satisfies the "No Arbitrary AI Score" Requirement
Gemini's output per journal entry (activities, blockers) is already schema-constrained and has been stable/tested across sample entries (Day 3–7 work).
The score itself is computed by a pure function of counts, ratios, and timestamps — given the same stored `goals`/`journals` data, it always produces the same output, regardless of which Gemini call or model version originally extracted the underlying facts.
This also makes the score auditable: every component can be shown in the UI with its raw value, so a user (or a grader) can verify the math rather than trusting an opaque AI-generated figure.
---
8. Next Steps (Implementation)
Confirm progress is read from progress_value across Goal domain models and repository layers.
Implement `ProductivityScoreService.compute_score()` per this formula (draft version already built — see `productivity_score_service.py`).
Add `GET /productivity-score` endpoint.
Add UI display (score + component breakdown) once endpoint is live.