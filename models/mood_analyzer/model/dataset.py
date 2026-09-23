import csv
from typing import List, Tuple, Dict, Optional
import torch
from torch.utils.data import Dataset
from .tokenizer import JournalTokenizer


EMOTION_LABELS: Dict[str, int] = {
    "accomplishment": 0,
    "motivation": 1,
    "focus": 2,
    "gratitude": 3,
    "breakthrough": 4,
    "burnout": 5,
    "overwhelmed": 6,
    "frustration": 7,
    "guilt": 8,
    "neutral": 9
}

ID_TO_EMOTION: Dict[int, str] = {v: k for k, v in EMOTION_LABELS.items()}


class EmotionDataset(Dataset):
    """
    PyTorch Dataset for 10-Class Goal & Reflection Emotion Recognition.
    Reads text and emotion label from CSV file without relying on external dependencies.
    """
    def __init__(self, csv_file: str, tokenizer: JournalTokenizer, label_map: Optional[Dict[str, int]] = None):
        self.tokenizer = tokenizer
        self.label_map = label_map or EMOTION_LABELS
        self.samples: List[Tuple[str, int]] = []
        
        with open(csv_file, mode="r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            
            # Identify columns
            text_idx, label_idx = 0, 1
            if header:
                for i, col in enumerate(header):
                    col_lower = col.strip().lower()
                    if col_lower in ["text", "sentence", "content"]:
                        text_idx = i
                    elif col_lower in ["emotion", "label", "mood"]:
                        label_idx = i

            for row in reader:
                if len(row) > max(text_idx, label_idx):
                    text = row[text_idx].strip()
                    label_str = row[label_idx].strip().lower()
                    
                    if label_str in self.label_map:
                        self.samples.append((text, self.label_map[label_str]))

        print(f"Loaded {len(self.samples)} valid samples from {csv_file}")

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        text, label = self.samples[idx]
        input_ids = self.tokenizer.text_to_ids(text)
        return torch.tensor(input_ids, dtype=torch.long), torch.tensor(label, dtype=torch.long)
