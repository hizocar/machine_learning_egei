# Class 4 · The Machine Learning Pipeline

<div class="usm-session-meta">
<span>📅 Friday 9 October 2026</span>
<span>⏱️ 13:00 – 16:00</span>
<span class="usm-tag-gold">Block B · The ML Pipeline</span>
<span class="usm-tag-red">📊 Project 1 released</span>
</div>

!!! warning "Project 1 is released today"
    The brief, the deliverables and the rubric are on the [Projects](../projects.md) page.
    **Due:** Thursday 22 October, 23:59 · **Presented:** Friday 23 October in class.
    The last block of today's session is dedicated to choosing your problem and your data.

## 🎯 Objectives

- Build a complete pipeline: preprocessing → model → evaluation, as a single reproducible object.
- Replace the single hold-out split with **k-fold cross-validation**, and explain what it buys you.
- Detect **data leakage**, the failure that makes a broken model look excellent.
- Audit assistant-generated pipelines for leakage before trusting their scores.

## 🗓️ Agenda (3 hours)

| Time | Block |
|---|---|
| 13:00 – 13:15 | Recap of Class 3: why test error is the only honest number |
| 13:15 – 14:10 | The pipeline: preprocessing inside the model, not before it |
| 14:10 – 14:25 | Break |
| 14:25 – 15:05 | Cross-validation: k-fold, stratification, and reading the variance |
| 15:05 – 15:35 | **Leakage hunt:** three broken pipelines to diagnose |
| 15:35 – 16:00 | Project 1 launch: choosing the problem and the data |

## 📖 Contents

### 1. Why a pipeline

Every transformation you apply to the data — imputing, scaling, encoding, selecting features — is
part of the model. If you apply it to the whole dataset and *then* split, information from the test
set has already leaked into training, and your score is fiction.

A `Pipeline` in scikit-learn fixes this structurally: transformations are fitted on the training
fold only, every time.

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression

pre = ColumnTransformer([
    ("num", Pipeline([("imp", SimpleImputer(strategy="median")),
                      ("sc", StandardScaler())]), num_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
])

model = Pipeline([("pre", pre), ("clf", LogisticRegression(max_iter=1000))])
```

### 2. Cross-validation

A single split gives you one number that depends on which rows happened to land in the test set.
k-fold cross-validation repeats the exercise k times and reports the distribution:

| | What it tells you |
|---|---|
| **Mean score** | The expected performance |
| **Standard deviation across folds** | How much of your result is luck |
| **A fold that collapses** | Something structural — a rare class, a time effect, a leaking feature |

Use **stratified** folds for classification so every fold keeps the class balance.

### 3. Data leakage: the expensive mistake

| Type of leakage | Example | Symptom |
|---|---|---|
| **Preprocessing leakage** | Scaler or imputer fitted before the split | Score drops in production |
| **Target leakage** | A feature that encodes the outcome (`payment_date` for predicting default) | Near-perfect score |
| **Temporal leakage** | Random split on time-ordered data | Model "predicts" the past |
| **Duplicate leakage** | The same customer in train and test | Optimistic and unstable scores |

> ⚠️ **The rule of thumb:** if your first result is much better than you expected, do not celebrate —
> go looking for the leak. In this course, an unexplained 0.99 AUC is treated as a bug report.

### 4. Auditing your assistant's pipeline

Assistants produce leaking pipelines constantly, because the leaking version is shorter and appears
in a lot of training data. Ask explicitly:

```text
Review this pipeline for data leakage. For every transformation, tell me whether it is fitted
before or after the train/test split, and whether any feature could encode the target.
List the problems, then give me the corrected version.
```

Then check it yourself — the point of the lab.

## 🧪 Lab: the leakage hunt

Three pipelines are provided; each reports an excellent score and each is broken. In pairs: find the
leak, name its type, fix it, and report the honest score. Then compare: how much of the original
performance was real?

## 📊 Project 1 launch (last block)

Before you leave, your group must have:

- [ ] A business question written in one sentence.
- [ ] The dataset identified and downloaded.
- [ ] The target variable named, and the decision that would change because of the prediction.
- [ ] A check that the target is not leaking into the features.

Full brief, deliverables and rubric: [Projects](../projects.md).

## ✍️ Homework

- [ ] Rebuild your Class 3 experiment as a `Pipeline` evaluated with 5-fold cross-validation.
- [ ] Read Gupta (2017), *Cross-Validation in Machine Learning* — see the [Program](../program.md#7-readings).

## 📚 Next session

[Class 5](classes.md) (Friday 16 October) moves to **classification**: logistic regression, the
confusion matrix and the ROC curve — including why accuracy is usually the wrong metric for a
business problem.
