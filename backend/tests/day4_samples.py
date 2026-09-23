"""
tests/day4_samples.py

The 4 cases the Day 4 task explicitly asks for:
  1. Multiple goals in one journal
  2. No clear goal
  3. Completed work
  4. A blocker
"""

DAY4_SAMPLES = [
    {
        "label": "1. Multiple goals",
        "text": (
            "Big day. Finally submitted the FastAPI assignment, that's "
            "one thing off my plate. Also want to start learning Docker "
            "properly this month, and I keep telling myself I should get "
            "back into reading before bed instead of scrolling my phone."
        ),
        "existing_goals": [],
    },
    {
        "label": "2. No clear goal",
        "text": (
            "Pretty uneventful day, just ran errands and caught up on "
            "some emails. Nothing major going on."
        ),
        "existing_goals": [],
    },
    {
        "label": "3. Completed work",
        "text": "Finished the React assignment tonight, submitted it before the deadline.",
        "existing_goals": ["Learn FastAPI"],
    },
    {
        "label": "4. Blocker",
        "text": (
            "Tried to work through the async programming section again "
            "today but I'm still struggling to understand how event "
            "loops actually work under the hood. Didn't make much progress."
        ),
        "existing_goals": ["Learn FastAPI"],
    },
]