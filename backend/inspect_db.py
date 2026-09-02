"""
inspect_db.py

Helper script to view all current database records in SQLite (users, journals, goals, progress, ai_summaries).
Run: python inspect_db.py
"""

import sqlite3

def inspect():
    conn = sqlite3.connect("ai_goal_journal.db")
    cursor = conn.cursor()

    tables = ["users", "journals", "goals", "progress", "ai_summaries"]

    print("=" * 60)
    print("      AI GOAL JOURNAL DATABASE CONTENT VIEWER")
    print("=" * 60)

    for table in tables:
        print(f"\n--- TABLE: {table.upper()} ---")
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [col[1] for col in cursor.fetchall()]
            
            print(f"Columns: {columns}")
            if not rows:
                print("(No records found)")
            else:
                for idx, row in enumerate(rows, 1):
                    print(f"  [{idx}] {row}")
        except Exception as e:
            print(f"Error querying table {table}: {e}")

    print("\n" + "=" * 60)
    conn.close()

if __name__ == "__main__":
    inspect()
