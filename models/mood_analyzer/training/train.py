import os
import csv
import json
import time
from collections import Counter
from typing import Dict, List, Tuple

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from model.architecture import EmotionDetectionModel
from model.tokenizer import JournalTokenizer
from model.dataset import EmotionDataset, EMOTION_LABELS, ID_TO_EMOTION


def get_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def compute_class_weights(labels: List[int], num_classes: int) -> torch.Tensor:
    """Computes smoothed inverse class frequencies to prevent bias towards majority classes."""
    counts = Counter(labels)
    total = len(labels)
    weights = []
    for i in range(num_classes):
        count = counts.get(i, 1)
        w = total / (num_classes * count)
        weights.append(min(w, 8.0))
    return torch.tensor(weights, dtype=torch.float)


def evaluate(model: nn.Module, dataloader: DataLoader, criterion: nn.Module, device: torch.device) -> Tuple[float, float]:
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for inputs, targets in dataloader:
            inputs, targets = inputs.to(device), targets.to(device)
            logits, _ = model(inputs)
            loss = criterion(logits, targets)
            total_loss += loss.item() * inputs.size(0)
            preds = torch.argmax(logits, dim=1)
            correct += (preds == targets).sum().item()
            total += targets.size(0)

    avg_loss = total_loss / max(total, 1)
    accuracy = (correct / max(total, 1)) * 100.0
    return avg_loss, accuracy


def train():
    device = get_device()
    print("=" * 60)
    print(f"[*] Training Enhanced 10-Class Mood Model (Multi-Head Attention) on: {device}")
    print("=" * 60)

    # 1. Directories setup
    os.makedirs("models", exist_ok=True)
    train_path = os.path.join("data", "processed", "train_10_class.csv")
    val_path = os.path.join("data", "processed", "val_10_class.csv")

    if not os.path.exists(train_path):
        from data.build_10_class_dataset import transform_dataset
        transform_dataset()

    # 2. Collect training texts for vocabulary building
    texts_for_vocab: List[str] = []
    train_rows: List[Tuple[str, str]] = []

    with open(train_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader, None)
        for r in reader:
            if len(r) >= 2 and r[0].strip() and r[1].strip() in EMOTION_LABELS:
                train_rows.append((r[0].strip(), r[1].strip()))
                texts_for_vocab.append(r[0].strip())

    print(f"Total training examples: {len(train_rows)}")

    # 3. Build & Save Tokenizer / Vocabulary
    tokenizer = JournalTokenizer(max_length=80)
    tokenizer.build_vocab(texts_for_vocab, min_freq=1)
    vocab_file = os.path.join("models", "vocabulary.json")
    tokenizer.save_vocab(vocab_file)

    # Save label mapping
    mapping_file = os.path.join("models", "label_mapping.json")
    with open(mapping_file, "w", encoding="utf-8") as f:
        json.dump(EMOTION_LABELS, f, indent=2)

    # 4. Prepare Datasets & DataLoaders
    class DirectDataset(torch.utils.data.Dataset):
        def __init__(self, rows, tok):
            self.tok = tok
            self.samples = [(text, EMOTION_LABELS[lbl]) for text, lbl in rows]
        def __len__(self):
            return len(self.samples)
        def __getitem__(self, idx):
            t, l = self.samples[idx]
            return torch.tensor(self.tok.text_to_ids(t), dtype=torch.long), torch.tensor(l, dtype=torch.long)

    train_dataset = DirectDataset(train_rows, tokenizer)
    val_dataset = EmotionDataset(val_path, tokenizer)

    batch_size = 64
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    # 5. Inverse Class Weights
    train_labels = [l for _, l in train_dataset.samples]
    class_weights = compute_class_weights(train_labels, num_classes=len(EMOTION_LABELS)).to(device)

    # 6. Initialize Enhanced Model (200d, 4-Head Attention, LayerNorm)
    model = EmotionDetectionModel(
        vocab_size=tokenizer.vocab_size,
        embedding_dim=200,
        hidden_dim=200,
        num_classes=len(EMOTION_LABELS),
        num_layers=2,
        dropout=0.3,
        num_heads=4
    ).to(device)

    # Label smoothing regularizes boundary reflections
    criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=0.05)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    epochs = 12
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    # 7. Training Loop with Cosine Annealing
    best_val_acc = 0.0
    best_model_path = os.path.join("models", "emotion_model.pth")

    for epoch in range(1, epochs + 1):
        start_time = time.time()
        model.train()
        running_loss = 0.0
        train_correct = 0
        train_total = 0

        for inputs, targets in train_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            optimizer.zero_grad()
            logits, _ = model(inputs)
            loss = criterion(logits, targets)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            preds = torch.argmax(logits, dim=1)
            train_correct += (preds == targets).sum().item()
            train_total += targets.size(0)

        scheduler.step()
        epoch_train_loss = running_loss / train_total
        epoch_train_acc = (train_correct / train_total) * 100.0
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        elapsed = time.time() - start_time

        print(
            f"Epoch [{epoch:02d}/{epochs:02d}] ({elapsed:.1f}s) | "
            f"Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc:.2f}% | "
            f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}%"
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), best_model_path)
            print(f"  [*] Best checkpoint saved: {best_val_acc:.2f}% -> {best_model_path}")

    print(f"\n[DONE] Training complete! Best validation accuracy: {best_val_acc:.2f}%")
    print(f"[ARTIFACT] Model weights: {best_model_path}")
    print(f"[ARTIFACT] Vocabulary:    {vocab_file}")


if __name__ == "__main__":
    train()
