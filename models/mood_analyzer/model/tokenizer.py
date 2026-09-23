import re
import json
from collections import Counter
from typing import List, Dict, Union


CONTRACTIONS: Dict[str, str] = {
    r"\bi'm\b": "i am",
    r"\bi've\b": "i have",
    r"\bi'll\b": "i will",
    r"\bi'd\b": "i would",
    r"\bdon't\b": "do not",
    r"\bdidn't\b": "did not",
    r"\bdoesn't\b": "does not",
    r"\bcan't\b": "cannot",
    r"\bcouldn't\b": "could not",
    r"\bwon't\b": "will not",
    r"\bwouldn't\b": "would not",
    r"\bshouldn't\b": "should not",
    r"\bwasn't\b": "was not",
    r"\bweren't\b": "were not",
    r"\bisn't\b": "is not",
    r"\baren't\b": "are not",
    r"\bit's\b": "it is",
    r"\bthat's\b": "that is",
    r"\bthere's\b": "there is",
    r"\bwhat's\b": "what is",
    r"\blet's\b": "let us",
}


class JournalTokenizer:
    """
    Self-contained rule-based and frequency-indexed tokenizer for emotional text.
    Handles text normalization, contraction expansion, and vocabulary mapping.
    """
    def __init__(self, max_length: int = 80):
        self.max_length = max_length
        self.word_to_index: Dict[str, int] = {"<PAD>": 0, "<UNK>": 1}
        self.index_to_word: Dict[int, str] = {0: "<PAD>", 1: "<UNK>"}

    @staticmethod
    def clean_text(text: str) -> str:
        """Normalizes text and expands common English contractions."""
        if not isinstance(text, str):
            text = str(text)
        text = text.lower()
        for pattern, replacement in CONTRACTIONS.items():
            text = re.sub(pattern, replacement, text)
        # Remove non-alphanumeric characters while keeping single spaces
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        # Collapse multiple spaces
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def tokenize(self, text: str) -> List[str]:
        cleaned = self.clean_text(text)
        return cleaned.split() if cleaned else []

    def build_vocab(self, texts: List[str], min_freq: int = 1, max_vocab_size: int = 25000):
        """Constructs word vocabulary from training corpus."""
        counter = Counter()
        for text in texts:
            tokens = self.tokenize(text)
            counter.update(tokens)

        self.word_to_index = {"<PAD>": 0, "<UNK>": 1}
        idx = 2
        for word, count in counter.most_common(max_vocab_size):
            if count >= min_freq:
                self.word_to_index[word] = idx
                idx += 1

        self.index_to_word = {i: w for w, i in self.word_to_index.items()}
        print(f"Vocabulary successfully built! Total tokens: {len(self.word_to_index)}")

    def text_to_ids(self, text: str) -> List[int]:
        """Converts raw string to list of token IDs with padding/truncation."""
        tokens = self.tokenize(text)
        unk_id = self.word_to_index.get("<UNK>", 1)
        ids = [self.word_to_index.get(token, unk_id) for token in tokens]

        # Truncate or pad to max_length
        if len(ids) > self.max_length:
            ids = ids[:self.max_length]
        else:
            ids = ids + [0] * (self.max_length - len(ids))
        return ids

    def save_vocab(self, file_path: str):
        """Saves vocabulary dictionary to JSON file."""
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(self.word_to_index, f, ensure_ascii=False, indent=2)
        print(f"Vocabulary saved to {file_path}")

    def load_vocab(self, file_path: str):
        """Loads vocabulary dictionary from JSON file."""
        with open(file_path, "r", encoding="utf-8") as f:
            self.word_to_index = json.load(f)
        self.index_to_word = {int(v): k for k, v in self.word_to_index.items()}
        print(f"Vocabulary loaded from {file_path} (Size: {len(self.word_to_index)})")

    @property
    def vocab_size(self) -> int:
        return len(self.word_to_index)
