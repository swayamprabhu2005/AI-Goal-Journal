import os
import csv
from collections import Counter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")
DOMAIN_CSV = os.path.join(BASE_DIR, "domain_journal_samples.csv")

LABEL_MAPPING = {
    "joy": "accomplishment",
    "sadness": "burnout",
    "anger": "frustration",
    "fear": "overwhelmed",
    "love": "gratitude",
    "surprise": "breakthrough",
    "neutral": "neutral"
}

NEW_CLASSES = {
    "accomplishment",
    "motivation",
    "focus",
    "gratitude",
    "breakthrough",
    "burnout",
    "overwhelmed",
    "frustration",
    "guilt",
    "neutral"
}


def transform_dataset():
    print("=" * 60)
    print("[*] Transforming Emotion Dataset to 10 Goal Journal Classes")
    print("=" * 60)

    # 1. Read domain-specific entries
    domain_rows = []
    if os.path.exists(DOMAIN_CSV):
        with open(DOMAIN_CSV, mode="r", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader, None)
            for r in reader:
                if len(r) >= 2 and r[0].strip() and r[1].strip() in NEW_CLASSES:
                    domain_rows.append((r[0].strip(), r[1].strip()))
        print(f"Loaded {len(domain_rows)} domain-specific goal journal entries.")

    # 2. Process each split (train, val, test)
    all_combined_rows = []

    for split in ["train", "val", "test"]:
        input_csv = os.path.join(PROCESSED_DIR, f"{split}.csv")
        output_csv = os.path.join(PROCESSED_DIR, f"{split}_10_class.csv")
        transformed_rows = []

        if os.path.exists(input_csv):
            with open(input_csv, mode="r", encoding="utf-8") as f:
                reader = csv.reader(f)
                header = next(reader, None)
                for r in reader:
                    if len(r) >= 2:
                        text = r[0].strip()
                        old_label = r[1].strip().lower()
                        new_label = LABEL_MAPPING.get(old_label, old_label)
                        if new_label in NEW_CLASSES:
                            transformed_rows.append((text, new_label))

        # Add domain samples into train split (weighted 5x so new classes have ample presence)
        if split == "train":
            for _ in range(5):
                for text, label in domain_rows:
                    transformed_rows.append((text, label))
        elif split == "val":
            # Add a portion of domain samples into validation
            for text, label in domain_rows[:25]:
                transformed_rows.append((text, label))

        # Write output CSV
        with open(output_csv, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["text", "emotion"])
            writer.writerows(transformed_rows)

        counts = Counter(label for _, label in transformed_rows)
        print(f"\n[OK] {split.upper()} (Total: {len(transformed_rows)} rows):")
        for cls, count in counts.most_common():
            print(f"   - {cls:15}: {count}")

        all_combined_rows.extend(transformed_rows)

    # 3. Create a master unified CSV for Kaggle Upload
    kaggle_csv = os.path.join(BASE_DIR, "GoalEmotion_10_Classes_Kaggle.csv")
    with open(kaggle_csv, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "emotion"])
        writer.writerows(all_combined_rows)

    print(f"\n[SUCCESS] Master Kaggle Dataset generated: {kaggle_csv}")
    print(f"   Total entries: {len(all_combined_rows)}")


if __name__ == "__main__":
    transform_dataset()
