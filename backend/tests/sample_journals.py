"""
sample_journals.py

5 sample journal entries chosen to exercise different edge cases flagged
in the Day 1/2 research:
  1. Clear completed activity + a new stated goal
  2. Future intention only (should NOT become a "completed" activity)
  3. A blocker mentioned alongside progress
  4. Mixed tenses in one entry (past + ongoing + future in the same entry)
  5. An entry that should match an EXISTING goal, not create a new one

Each entry also carries the "existing_goals" context that should be sent
alongside it, per the goal-matching design from Day 1/2 research.
"""

SAMPLE_ENTRIES = [
    {
        "label": "1. Completed activity + new goal",
        "text": (
            "Went for a 5k run this morning before work, felt great. "
            "I think I really want to start training for a half marathon "
            "sometime next year."
        ),
        "existing_goals": [],
    },
    {
        "label": "2. Future intention only (no completed activity)",
        "text": (
            "Didn't get much done today. I really need to start "
            "exercising more regularly, maybe next week once things "
            "calm down at work."
        ),
        "existing_goals": [],
    },
    {
        "label": "3. Progress + explicit blocker",
        "text": (
            "Worked on the client report for about an hour but kept "
            "getting distracted by Slack notifications. Only got through "
            "the intro section. Frustrating."
        ),
        "existing_goals": [
            {"id": "g1", "text": "Finish the client report"},
        ],
    },
    {
        "label": "4. Mixed tenses in one entry",
        "text": (
            "Finished reading chapter 3 of the design book yesterday. "
            "Still working through chapter 4 today, going slowly. "
            "Planning to start the practice exercises once I'm done "
            "with the reading."
        ),
        "existing_goals": [
            {"id": "g2", "text": "Read the design book"},
        ],
    },
    {
        "label": "5. Should match an existing goal, not create a new one",
        "text": (
            "Hit the gym again today, third time this week. Slowly "
            "getting back into a routine with the workouts."
        ),
        "existing_goals": [
            {"id": "g3", "text": "Get back into a regular gym routine"},
        ],
    },
]