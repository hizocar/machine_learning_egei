# Session 5 · Classification: Who Is Poor?

<div class="usm-session-meta">
<span>Friday 30 October 2026</span>
<span>13:00 – 16:00</span>
<a class="usm-tag-gold" href="../../program/#5-course-contents" title="Block C of the course contents in the Program">Syllabus block C · Classification</a>
<span class="usm-tag-red">Project released</span>
</div>

<div class="usm-actions usm-session-actions">
<a class="usm-primary" href="../../notebooks/s05_classification/">Notebook</a>
<a href="https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/s05_classification.ipynb" target="_blank" rel="noopener">Open in Colab</a>
<a href="#check-your-understanding">Check your understanding</a>
</div>

!!! warning "The course project is released today"
    Brief, checkpoints and rubric are on the [Project](../projects.md) page. **Checkpoint 1** is due
    on Thursday 12 November and covers everything up to today.

## ❓ Today's question

> A social programme does not pay "a predicted income". It decides **yes or no**. Can we predict
> directly whether a household is poor, and which mistakes should we be more afraid of?

## 🔁 What you already know

From [Session 4](class4.md): split first, put preprocessing inside a `Pipeline`, choose with
cross-validation, and suspect any feature you would not have at prediction time. From
**econometrics**: the logit model.

## ✨ New today

| Tool | What it is for |
|---|---|
| `LogisticRegression` | The logit, now judged by how well it predicts unseen households |
| Confusion matrix · precision · recall | Separate the two kinds of mistake |
| The **decision threshold** | Turn probabilities into decisions, according to the cost of each mistake |
| ROC curve · AUC | Judge the model across all thresholds |
| `stratify=` · `StratifiedKFold` | Keep the 23% of poor households in every split |
| `OneHotEncoder` · `SimpleImputer` · `ColumnTransformer` | Bring categorical variables and missing values *inside* the pipeline |
| `cross_val_predict` | Out-of-fold probabilities for choosing the threshold without the test set |

## 🗓️ Agenda (3 hours)

| Time | Block |
|---|---|
| 13:00 – 13:15 | Recap: the leakage hunt, and why income cannot be a feature |
| 13:15 – 14:10 | Logistic regression as a predictor · the accuracy trap · confusion matrix |
| 14:10 – 14:25 | Break |
| 14:25 – 15:05 | The threshold as a policy decision · ROC and AUC |
| 15:05 – 15:35 | **Lab:** categorical variables and missing values in the pipeline |
| 15:35 – 16:00 | Project launch: groups, question, data |

## 📖 Contents

### 1. The same model you know, used to predict

In econometrics you used the logit to estimate effects. The equation is identical:

$$P(\text{poor} \mid x) = \frac{1}{1 + e^{-(\beta_0 + \beta_1 x_1 + \dots + \beta_p x_p)}}$$

What changes is the question: not "is $\beta_1$ significant?" but "how well does this predict
households the model has never seen?". Here is the logit with just one variable, years of schooling.
Move the coefficients, then let maximum likelihood find them.

<div class="ml-widget" data-widget="sigmoid"></div>

!!! example "Worked example by hand: from a score to a probability"
    The fitted one-variable model is $z = -0.352 - 0.086 \times \text{schooling}$, and
    $p = 1/(1 + e^{-z})$ (coefficients rounded to three decimals, so the notebook may differ in the
    third decimal).

    | Schooling | $z$ | $e^{-z}$ | $p = 1/(1+e^{-z})$ |
    |---:|---:|---:|---:|
    | 8 years | −0.352 − 0.688 = −1.040 | 2.829 | 1 / 3.829 = **0.261** |
    | 12 years | −0.352 − 1.032 = −1.384 | 3.991 | 1 / 4.991 = **0.200** |
    | 16 years | −0.352 − 1.376 = −1.728 | 5.629 | 1 / 6.629 = **0.151** |

    Each extra year multiplies the **odds** of being poor by $e^{-0.086} = 0.918$, so four more
    years multiply them by 0.709. Notice that **no household gets a probability above 0.5** in this
    model. With a 0.5 threshold, schooling alone would never select anyone.

!!! info "From econometrics to ML"
    - **Same model, different scorecard.** In econometrics you ask whether $\beta_1$ is significantly
      different from zero. Here you ask how well the model ranks and classifies unseen households.
    - **Significant ≠ useful for prediction.** With 15,000 rows almost any variable is significant,
      even when adding it does not move the test AUC. The reverse also happens.
    - **Pseudo-R² ↔ AUC and the confusion matrix.** They summarise different things: fit of the
      likelihood vs. ability to separate classes at the thresholds you would actually use.
    - **Odds ratios are associations.** In a predictive model the coefficients absorb everything
      correlated with them. Do not read them as causal effects of schooling or region.

### 2. The accuracy trap

About **23%** of households are poor, so a "model" that says *nobody is poor* is already
**76.9% accurate**. Our logistic regression with all observable variables reaches **79.7%**. That
looks like a small win, and it hides a disaster:

| | predicted not poor | predicted poor |
|---|---:|---:|
| **actually not poor** | 2,754 | 130 |
| **actually poor** | **633** | 233 |

At the default threshold of 0.5 the model **misses almost three out of four poor households**
(recall = 0.27).

- **Recall:** of the poor households, the share we reach. TP / (TP + FN)
- **Precision:** of the households we select, the share that are actually poor. TP / (TP + FP)

### 3. The threshold is a policy decision

`.predict()` says "poor" when the probability is above 0.5, but nothing makes 0.5 right. Lower it and
the programme reaches more poor households (recall ↑) while subsidising more households that are
not poor (precision ↓). How much each mistake *costs* is not a statistical question. It belongs to
whoever runs the programme. Your job is to make the trade-off visible.

<div class="ml-widget" data-widget="threshold"></div>

| Threshold | Poor reached | Poor missed | Non-poor subsidised | Recall | Precision |
|---:|---:|---:|---:|---:|---:|
| 0.50 | 233 | 633 | 130 | 0.27 | 0.64 |
| 0.30 | 528 | 338 | 538 | 0.61 | 0.50 |
| 0.20 | 684 | 182 | 1,016 | 0.79 | 0.40 |

!!! example "Worked example by hand: what does each threshold cost?"
    Say that excluding a poor household costs **3** units and subsidising a non-poor household costs
    **1**. Using the table above:

    - Threshold 0.50: 3 × 633 + 1 × 130 = **2,029**
    - Threshold 0.20: 3 × 182 + 1 × 1,016 = **1,562**

    Lowering the threshold to 0.20 roughly multiplies the false positives by eight, and the total
    cost still falls by almost a quarter, because each missed poor household weighs three times as much.
    The widget finds the cheapest threshold for any pair of costs (≈ 0.24 for 3:1, total 1,482).

The **ROC curve** shows every threshold at once, and the **AUC** summarises it: the probability that
a random poor household gets a higher score than a random non-poor one. Ours is **0.79**, or
0.78 ± 0.01 with stratified 5-fold cross-validation.

### 4. All the information, inside the pipeline

Most of what we know about a household is categorical, and some values are missing. What *missing*
means decides the rule:

| Column | Why it is missing | Rule inside the pipeline |
|---|---|---|
| `head_weekly_hours` | the head does not work (6,105 cases) | fill with **0**, not the median (which would invent a 45-hour week) |
| `head_weekly_hours` | an employed head did not know (87 cases) | same column, *different* meaning: 0 is wrong here (notebook exercise 4) |
| `head_job_type` | the head does not work | its own category, `"missing"` |
| schooling, insurance, overcrowding | "doesn't know" (rare) | median, or its own category |

```python
pre = ColumnTransformer([
    ("num",   make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), NUM),
    ("hours", make_pipeline(SimpleImputer(strategy="constant", fill_value=0), StandardScaler()), HOURS),
    ("cat",   make_pipeline(SimpleImputer(strategy="constant", fill_value="missing"),
                            OneHotEncoder(handle_unknown="ignore")), CAT),
])
model = Pipeline([("pre", pre), ("clf", LogisticRegression(max_iter=3000))])
```

This is the Session 4 pipeline with more steps. Every *learned* value (medians, categories, scales)
is still learned on training folds only.

### 5. The leak, again

Add `income_per_capita` and the AUC jumps from 0.79 to **0.965**. Poverty is *defined* by comparing
income per capita with a poverty line, so this model only rediscovers the definition, and needs the
one variable a proxy means test exists to avoid.

### 6. Common mistakes

| Mistake | Why it hurts | How to avoid it |
|---|---|---|
| Reporting accuracy on an imbalanced problem | 77% is achievable by selecting nobody | Show the confusion matrix, recall and precision next to the baseline |
| Leaving the threshold at 0.5 | 0.5 encodes "both errors cost the same", a policy choice nobody made | Choose the threshold from the costs of each error |
| Choosing the threshold on the test set | The test score becomes optimistic (Leak C again) | Use cross-validated predictions on the training set |
| Imputing "not applicable" values with the median | Invents a 45-hour week for people who do not work | Ask what *missing* means; use 0 or a "missing" category |
| One-hot encoding before the split | Categories seen only in test leak into training | Encode inside the `ColumnTransformer` with `handle_unknown="ignore"` |
| Splitting without `stratify` | Train and test can end up with different shares of poor households | `train_test_split(..., stratify=y)` and `StratifiedKFold` |

## ✅ Check your understanding

??? question "1. A model has 85% accuracy on a problem where 85% of cases are negative. Is it good?"
    You cannot tell from accuracy. "Predict negative for everyone" also scores 85%. Look at the
    confusion matrix: how many positives does it find (recall), and how many of its positives are
    right (precision)?

??? question "2. From the matrix at 0.5 (TP = 233, FN = 633, FP = 130, TN = 2,754), compute recall and precision."
    Recall = 233 / (233 + 633) = 233 / 866 = **0.269**: the model reaches about one poor household
    in four. Precision = 233 / (233 + 130) = 233 / 363 = **0.642**: of those it selects, about six
    in ten are poor.

??? question "3. The ministry says: 'we prefer to subsidise some non-poor households rather than miss poor ones'. Do you raise or lower the threshold?"
    **Lower** it. A lower threshold selects more households, so recall rises and precision falls.
    That is exactly the trade the ministry is willing to make. The cost ratio tells you how far to go.

??? question "4. Our AUC is 0.79. Explain it to a policymaker in one sentence."
    "If you pick one poor and one non-poor household at random, the model gives the poor one a
    higher score 79% of the time." (A coin would do it 50% of the time.)

??? question "5. Adding income per capita raises the AUC to 0.965. Why should we still not use it?"
    Poverty is defined by comparing income per capita with a poverty line, so the model just
    rediscovers the definition. The point of a proxy means test is that income is *not* reliably
    observed when the decision is made. A feature you will not have at prediction time is a leak,
    however good it makes the score look.

## 🧪 Lab

[📓 Session 5 — Classification](../notebooks/s05_classification.ipynb) ·
[![Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/s05_classification.ipynb)

!!! example "Assistant skill: choose the metric, don't accept the default"
    ```text
    I have a logistic regression that predicts whether a household is poor (23% positive class).
    Here is my confusion matrix at threshold 0.5: (paste). Explain in plain language what each cell
    means for a social programme. Then write code that picks the threshold minimising 3*FN + 1*FP on
    cross-validated predictions (not on the test set). Tell me why that last condition matters.
    ```
    Check that it uses `cross_val_predict` (or equivalent) on the training set. An assistant that
    tunes the threshold on the test set has just reintroduced Leak C from Session 4.

!!! abstract "Key takeaways"
    - **Accuracy can hide a disaster.** Always compare with the majority-class baseline and look at
      the confusion matrix.
    - **Recall and precision answer different policy questions**: whom do we reach, and whom do we
      pay by mistake?
    - **The threshold is a decision, not a default.** It follows from the cost of each error. Choose
      it with cross-validated predictions.
    - **AUC judges the ranking across all thresholds.** It is useful for comparing models, not for
      choosing a cut-off.
    - **What *missing* means decides how to fill it**, and every learned step stays inside the pipeline.

    ```python
    model = Pipeline([("pre", pre), ("clf", LogisticRegression(max_iter=3000))])
    p = cross_val_predict(model, X_train, y_train, cv=StratifiedKFold(5, shuffle=True, random_state=42),
                          method="predict_proba")[:, 1]
    best_t = min(np.linspace(0.05, 0.9, 86),
                 key=lambda t: 3 * ((p < t) & (y_train == 1)).sum() + ((p >= t) & (y_train == 0)).sum())
    # best_t ≈ 0.26, chosen without ever looking at the test set
    ```

## Project launch (last block)

Before you leave, your group must have:

- [ ] A question written in one sentence: who makes which decision with your prediction?
- [ ] A dataset identified (your own, or CASEN with a target other than poverty or income).
- [ ] The target named, and a check that no feature is computed from it.

## ✍️ Before Session 6

- [ ] Notebook exercises 1–4.
- [ ] Read ISLR, sections 4.1–4.3. See the [Program](../program.md#7-readings).
- [ ] Start Checkpoint 1 of the [project](../projects.md).

## 📚 Next session

[Session 6](class6.md) (Friday 6 November): **trees and ensembles**. Can a more flexible model find poor
households that the logit misses, and what do we give up in exchange?
