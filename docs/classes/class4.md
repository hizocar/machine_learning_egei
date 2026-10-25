# Session 4 · The ML Pipeline: Is Our Error Honest?

<div class="usm-session-meta">
<span>Friday 23 October 2026</span>
<span>13:00 – 16:00</span>
<a class="usm-tag-gold" href="../../program/#5-course-contents" title="Block B of the course contents in the Program">Syllabus block B · The ML Pipeline</a>
<span>Taught · revised notes</span>
</div>

<div class="usm-actions usm-session-actions">
<a class="usm-primary" href="../../notebooks/s04_pipeline/">Notebook</a>
<a href="https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/s04_pipeline.ipynb" target="_blank" rel="noopener">Open in Colab</a>
<a href="#check-your-understanding">Check your understanding</a>
</div>

!!! success "Revised notes for this session"
    These notes rebuild Session 4 on [the course case](../case.md) and use **only what we had seen
    up to Session 3**, plus the three tools this session introduces. Work through the notebook
    before Session 5: classification starts from this pipeline.

## ❓ Today's question

> Last session we predicted household income from a few observable characteristics. **How do we
> know the error we report is the error we would get on households the model has never seen?**

## 🔁 What you already know

From [Session 3](class3.md): a train/test split, linear regression, KNN, and the bias–variance
trade-off (k = 1 memorises, a huge k ignores the data).

## ✨ New today

| Tool | What it is for |
|---|---|
| `StandardScaler` | Put variables on the same scale so that distances (KNN) are fair |
| `Pipeline` / `make_pipeline` | Glue preprocessing and model into one object, fitted in the right order |
| `KFold` + `cross_val_score` | Choose hyperparameters (k) without touching the test set |
| **Data leakage** | Three ways information from the answer sneaks into the model |

## 🗓️ Agenda (3 hours)

| Time | Block |
|---|---|
| 13:00 – 13:15 | Recap of Session 3: train vs. test error, KNN, bias–variance |
| 13:15 – 14:10 | Scaling, by hand and in code · the `Pipeline` |
| 14:10 – 14:25 | Break |
| 14:25 – 15:05 | Cross-validation: choosing k without touching the test set |
| 15:05 – 16:00 | **Leakage hunt** on the case data · assistant audit |

## 📖 Contents

### 1. The setup

We predict **log income per capita** from three observables: age of the head of household, years of
schooling and household size. The log is there because income is extremely skewed. The first number
every model must beat is the **baseline**: predicting the average for everyone.

| Model | Test RMSE (log income) |
|---|---:|
| Baseline: everybody gets the mean | 0.707 |
| Linear regression | 0.610 |
| KNN, k = 1 | 0.820 (train: 0.659) |
| KNN, k = 100, scaled | **0.582** |

Move the slider. To draw it in two dimensions, the figure uses **one** variable (years of
schooling) and 400 households, so its best k and its errors differ from the three-variable table
above. The shape of the story is the same: with k = 1 the curve chases every household and the test
error jumps, and with a very large k it flattens into the average.

<div class="ml-widget" data-widget="knn-k"></div>

### 2. Scaling, and why order matters

KNN measures distance. Age ranges from 15 to 100, schooling from 0 to 25, so without scaling the
variable with the widest range dominates just because of its units. `StandardScaler` fixes that, but
it **learns** a mean and a standard deviation, and anything learned must come from the training set
only.

!!! example "Worked example by hand: scaling changes who your neighbours are"
    We want to predict log income per capita for a new household: head aged **40**, **12** years of
    schooling, **4** members. Four training households, and k = 2:

    | | Age | Schooling | Size | log income p.c. |
    |---|---:|---:|---:|---:|
    | A | 40 | 17 | 4 | 13.5 |
    | B | 49 | 12 | 4 | 12.8 |
    | C | 41 | 6 | 4 | 12.2 |
    | D | 55 | 12 | 3 | 12.9 |

    **Without scaling** (plain Euclidean distance):
    A = √(0² + 5² + 0²) = **5.0** · B = √(9²) = 9.0 · C = √(1² + 6²) = **6.1** · D = √(15² + 1²) = 15.0.
    The two nearest are A and C, so the prediction is (13.5 + 12.2) / 2 = **12.85**, about
    CLP 381,000 per person.

    **With scaling** (divide each difference by the standard deviation in the training data:
    16.5 for age, 4.5 for schooling, 1.5 for size):
    A = 5/4.5 = 1.11 · B = 9/16.5 = **0.55** · C = √(0.06² + 1.33²) = 1.34 · D = √(0.91² + 0.67²) = 1.13.
    Now the two nearest are B and A, and the prediction is (12.8 + 13.5) / 2 = **13.15**, about
    CLP 514,000.

    Same data, same k, a **35% different prediction**. Without scaling, nine years of age "looked"
    bigger than six years of schooling, purely because of the units.

The standard deviations you divide by are *learned* from data. That is where the order of operations
starts to matter:

<div class="ml-widget" data-widget="split-first"></div>

### 3. The pipeline

A `Pipeline` makes the right order automatic: `.fit()` fits the scaler and then the model on the
data it receives, and `.predict()` applies both.

```python
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsRegressor

model = make_pipeline(StandardScaler(), KNeighborsRegressor(n_neighbors=100))
model.fit(X_train, y_train)
```

### 4. Cross-validation: choosing k without peeking

If we try twenty values of k and keep the best **test** score, the test set has chosen the model and
its score is no longer honest. Instead we split the **training set** into 5 folds. Each fold takes a
turn as validation while the other four fit the pipeline, and the scaler is refitted every time.

<div class="ml-widget" data-widget="kfold"></div>

| What CV gives you | Our case (k = 100) |
|---|---|
| **Mean error** — the expected performance | 0.572 |
| **Spread across folds** — how much is luck | ± 0.005 |
| **A fold that collapses** — something structural | none here |

!!! info "From econometrics to ML"
    - In econometrics you judge a model **in sample** (R², t-statistics). Here the only score that
      counts is computed **out of sample**, on households the model never saw.
    - Adding a regressor never lowers the in-sample R². It can easily *raise* the test error. That is
      overfitting, the bias–variance trade-off of Session 3.
    - The spread of the CV scores plays a role similar to a standard error: it tells you how much
      your number would move with a different sample.
    - Target leakage is the predictive cousin of a **bad control**: a regressor that is itself a
      function of the outcome. In both cases the model looks better and answers the wrong question.

### 5. The leakage hunt

**Leakage** is any way information you would not have at prediction time reaches the model. Toggle
the variables and watch the error:

<div class="ml-widget" data-widget="leak-hunt"></div>

| Leak | On our data | Lesson |
|---|---|---|
| **Scaling before the split** | 0.582 → 0.582: negligible with 15,000 rows | Keep the habit anyway: with small data, or with steps that learn more (imputers, target encoders, feature selection), the same mistake inflates scores |
| **A feature built from the target** (`income_decile`) | 0.582 → **0.313** | The decile is computed *from income*. In a proxy means test you would never have it |
| **Choosing the model on the test set** | Optimistic by construction | Choose with CV, test once at the end |
| **The same unit on both sides** | Avoided: one row per household | With one row per *person*, relatives would sit in train and test |

> ⚠️ **The rule of thumb:** if a result is much better than you expected, do not celebrate. Ask of
> every feature: *would I have this value at the moment I need the prediction?*

### 6. Common mistakes

| Mistake | Why it hurts | How to avoid it |
|---|---|---|
| Fitting the scaler (or imputer) on the full data | Test information shapes the training data; scores become optimistic | Put every learned step inside a `Pipeline` |
| Choosing k (or anything) by looking at the test score | The test score becomes the best of many tries | Choose with `cross_val_score` on the training set; test once |
| Reporting only the mean CV score | Hides whether the result is stable or lucky | Report mean ± spread across folds |
| Forgetting the baseline | "RMSE 0.58" means nothing on its own | Always show the predict-the-mean error next to it |
| Using variables you would not have at prediction time | The model is useless in production, however good it looks | For every feature, ask *when* you would know its value |
| Splitting people when the decision is about households | Relatives on both sides leak shared information | Make the row the unit you predict for, or use `GroupKFold` |

## ✅ Check your understanding

??? question "1. Why is it wrong to try k = 1, 5, 25, 100 and keep the one with the lowest test RMSE?"
    Because the test set has then *chosen* the model. Its score is the best of four tries, so it is
    optimistic, and you no longer have untouched data to report an honest error. Choose k with
    cross-validation on the training set and use the test set once, at the end.

??? question "2. The five fold RMSEs for k = 100 are 0.574, 0.577, 0.577, 0.570 and 0.563. What do you report?"
    Mean = (0.574 + 0.577 + 0.577 + 0.570 + 0.563) / 5 = **0.572**, with a spread of about ±0.005.
    The folds agree to within a few thousandths, so the result is stable. Compare it with the
    baseline of 0.707: the model cuts the error by about 19%.

??? question "3. A classmate predicts income with R² = 0.95 using schooling, household size and income_decile. What is your first question?"
    *Would you know `income_decile` before knowing income?* No: the decile is computed from income.
    The feature leaks the target. Without it the honest error is around 0.58, not 0.31.

??? question "4. Is `df['head_weekly_hours'].fillna(0)` before the split a leak? And filling with the mean?"
    Filling with **0** is a fixed rule that does not look at the data, so it cannot leak, and it is
    also the *correct* value (missing means the head does not work). Filling with the **mean** learns
    a number from the data. Done before the split, the test rows would help compute it. Learned steps
    go inside the pipeline.

??? question "5. Scaling before the split barely changed our RMSE (0.582 vs 0.582). So why bother?"
    Because with 15,000 rows a mean and a standard deviation hardly move when you add the test rows.
    With a few hundred rows, or with steps that learn much more from the data (target encoding,
    feature selection, imputing with a model), the same mistake can inflate scores a lot. The
    pipeline makes the right order automatic, so you never have to judge case by case.

## 🧪 Lab

Work through the notebook in pairs. It rebuilds every number on this page from the raw CSV.

[📓 Session 4 — The ML Pipeline](../notebooks/s04_pipeline.ipynb) ·
[![Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/s04_pipeline.ipynb)

!!! example "Assistant skill: audit a pipeline for leakage"
    ```text
    Here is my scikit-learn code (paste it). Review it for data leakage.
    For every transformation, say whether it is fitted before or after the train/test split.
    For every feature, say whether it would be available at prediction time in a proxy means test.
    List the problems first, then the corrected code.
    ```
    Then check it against the notebook. Did it catch `income_decile`? Did it flag anything that is
    not actually a problem? Both kinds of mistake go in your assistant log.

!!! abstract "Key takeaways"
    - **Split first.** The test set stands for future households; nothing you decide may use it.
    - **Scale for distance-based models.** KNN compares households through distances, and units must
      not decide who is "near".
    - **Anything learned goes inside the pipeline**: scalers, imputers, encoders, the model.
    - **Choose with cross-validation, report mean ± spread, test once.**
    - **Suspect great results.** For every feature, ask whether you would have it at prediction time.

    ```python
    model = make_pipeline(StandardScaler(), KNeighborsRegressor(n_neighbors=100))
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    scores = -cross_val_score(model, X_train, y_train, cv=cv, scoring="neg_root_mean_squared_error")
    print(scores.mean(), scores.std())
    model.fit(X_train, y_train)          # refit on all training data, then test once
    ```

## ✍️ Before Session 5

- [ ] Finish the three exercises at the end of the notebook.
- [ ] Read [The Case](../case.md), especially the warning about the income columns.
- [ ] Read Gupta (2017), *Cross-Validation in Machine Learning*. See the [Program](../program.md#7-readings).

## 📚 Next session

[Session 5](class5.md) (Friday 30 October): a programme does not pay "a predicted income", it
decides **yes or no**. We turn the question into classification: *who is poor?* The project is
released.
