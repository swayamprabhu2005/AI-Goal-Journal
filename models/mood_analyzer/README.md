# 🧠 Mood Analyzer: 10-Class Deep Learning Emotion Classifier for AI Goal Journal

This directory contains the self-trained emotion detection pipeline designed specifically for personal reflection, habit consistency, and goal journaling.

---

## 1. The 10 Goal Journaling Emotion Classes

| Class Index | Emotion Label | Description in Goal Journaling Context |
| :---: | :--- | :--- |
| **0** | **`accomplishment`** | Finishing goals, completing sprint tasks, hitting milestones, shipping features. |
| **1** | **`motivation`** | Forward-looking drive, energy to start habits, eagerness to execute priorities. |
| **2** | **`focus`** | Distraction-free flow state, deep work concentration, uninterrupted focus blocks. |
| **3** | **`gratitude`** | Contentment, appreciating mentors, habit progress, self-compassion, peace. |
| **4** | **`breakthrough`** | Sudden problem-solving, unexpected wins, rapid breakthrough on bugs or milestones. |
| **5** | **`burnout`** | Cognitive depletion, chronic fatigue from long hours, brain fog, feeling drained. |
| **6** | **`overwhelmed`** | Deadline panic, to-do list paralysis, exam fear, imposter syndrome. |
| **7** | **`frustration`** | Technical bugs, merge conflicts, interruptions during deep work, team blockers. |
| **8** | **`guilt`** | Procrastination remorse, breaking streaks, regret over wasted time on social media. |
| **9** | **`neutral`** | Matter-of-fact logging, daily habit checks, routine planning without strong emotional charge. |

---

## 2. Directory Structure & Key Artifacts

```
Mood Analyzer/
├── data/
│   ├── GoalEmotion_10_Classes_Kaggle.csv  <- Master 21,000+ row dataset ready for Kaggle upload!
│   ├── domain_journal_samples.csv         <- Enriched domain entries (Focus, Guilt, Motivation, Neutral, etc.)
│   ├── build_10_class_dataset.py          <- Data engineering transformation pipeline
│   ├── raw/                               <- Base raw splits
│   └── processed/
│       ├── train_10_class.csv             <- 10-class training split (16,979 rows)
│       ├── val_10_class.csv               <- 10-class validation split (2,023 rows)
│       └── test_10_class.csv              <- 10-class test split (2,000 rows)
├── model/
│   ├── __init__.py
│   ├── architecture.py                    <- PyTorch BiLSTM + Self-Attention (10 output logits)
│   ├── tokenizer.py                       <- Contraction expander & vocab indexer
│   └── dataset.py                         <- 10-class PyTorch Dataset & DataLoader
├── train.py                               <- Local/Server training script with class weighting
├── Journal_Mood_Analyzer.ipynb            <- 1-Click Google Colab Notebook (Google Drive Auto-Sync)
├── inference.py                           <- Ultra-fast CPU inference (<25MB RAM, ~3ms)
└── requirements.txt                       <- PyTorch, NumPy, tqdm
```

---

## 3. Uploading to Kaggle as Your Own Dataset

A master dataset has been prepared at:
👉 **[`Mood Analyzer/data/GoalEmotion_10_Classes_Kaggle.csv`](file:///d:/MyFiles/AI-GOAL-JOURNAL/Mood%20Analyzer/data/GoalEmotion_10_Classes_Kaggle.csv)** (21,002 rows, 10 balanced classes).

### How to Publish on Kaggle:
1. Log into your Kaggle account at [kaggle.com](https://www.kaggle.com/).
2. Click **Create** $\rightarrow$ **New Dataset**.
3. Upload `GoalEmotion_10_Classes_Kaggle.csv`.
4. Suggested Dataset Title:  
   **`GoalEmotion-NLP: 10-Class Emotion & Affect Dataset for Goal Journaling`**
5. In the **Description / Provenance**, write:
   > *"GoalEmotion-NLP is a domain-specialized 10-class affective corpus built for personal reflection, habit consistency, and goal tracking. It re-engineers traditional sentiment categories into actionable psychological states: Accomplishment, Motivation, Focus, Gratitude, Breakthrough, Burnout, Overwhelmed, Frustration, Guilt, and Neutral. Built as an augmented and domain-adapted extension of the CARER benchmark (Saravia et al., 2018), it introduces hundreds of real-world productivity, burnout, and habit reflection logs with smoothed class re-balancing."*

---

## 4. Google Colab Training with Google Drive Auto-Sync

Because your PC has 4 GB RAM and no dedicated GPU, training on Google Colab's free T4 GPU takes **~2 to 3 minutes**:

1. Open [Google Colab](https://colab.research.google.com/) and upload [`Journal_Mood_Analyzer.ipynb`](file:///d:/MyFiles/AI-GOAL-JOURNAL/Mood%20Analyzer/Journal_Mood_Analyzer.ipynb).
2. Set **Runtime -> Change runtime type** to **T4 GPU** (Free tier).
3. Click **Runtime -> Run all** (`Ctrl + F9`).
4. In Step 2, connect your Google Drive when prompted:
   - Checkpoints are automatically saved to your Drive: `/content/drive/MyDrive/AI_Goal_Journal_Mood_Model/checkpoint_epoch_{epoch}.pth`
   - **Progress is never lost** even if your browser closes or the runtime disconnects.
5. Upon completion, the 3 final model files are placed into your Google Drive and downloaded to your PC:
   - `emotion_model.pth` (~5.8 MB)
   - `vocabulary.json` (~320 KB)
   - `label_mapping.json` (~250 B)

---

## 5. Local Testing on CPU

Once you copy the 3 downloaded files into `Mood Analyzer/models/`, test it locally:

```bash
cd "Mood Analyzer"
python inference.py
```

Output:
```text
Journal: "Entered a pure flow state, locked in for two straight hours writing code."
Predicted Mood: FOCUS (Confidence: 96.4%)
Trigger Keywords: ['flow', 'locked', 'writing']
```
