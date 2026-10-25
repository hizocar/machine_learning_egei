# Session 7 · Selection and Shrinkage: How Short Can the Form Be?

<div class="usm-session-meta">
<span>Friday 13 November 2026</span>
<span>13:00 – 16:00</span>
<a class="usm-tag-gold" href="../../program/#5-course-contents" title="Block E of the course contents in the Program">Syllabus block E · Selection and Shrinkage</a>
<span class="usm-tag-red">Checkpoint 1 was due last night</span>
</div>

<div class="usm-actions usm-session-actions">
<a class="usm-primary" href="../../notebooks/s07_shrinkage/">Notebook</a>
<a href="https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/s07_shrinkage.ipynb" target="_blank" rel="noopener">Open in Colab</a>
<a href="#check-your-understanding">Check your understanding</a>
</div>

!!! note "Checkpoint 1"
    Checkpoint 1 of the [project](../projects.md) was due on Thursday 12 November at 23:59. Written
    feedback comes back before Session 8. Today's tools go straight into your final delivery: every
    group should ask *which of our variables do we really need?*

## ❓ Today's question

> Our poverty model asks **19 questions** in every household visit. Each question costs interview
> time, can be shaded by an applicant who knows what the programme is looking for, and has to be
> verified. **Which variables do we really need?** A form that is half as long and predicts almost
> as well is a policy win.

## 🔁 What you already know

From [Session 5](class5.md): the logit, the `ColumnTransformer` that turns 19 questions into 76
columns, and AUC as the yardstick. From [Session 4](class4.md): choose with cross-validation, test
once. From [Session 3](class3.md): the bias–variance trade-off, which comes back today in a new
form. From [Session 6](class6.md): the idea that a more flexible model is not always a better one.

## ✨ New today

| Tool | What it is for |
|---|---|
| The **cost of many variables** | Variance, interpretability and, in policy, the cost of collecting each one |
| **Forward stepwise selection** | Build the model one variable at a time, keeping the one that raises CV AUC most (`SequentialFeatureSelector` is the scikit-learn version for matrix columns) |
| **Ridge** (L2) · **LASSO** (L1) · **Elastic Net** | Penalised regression: shrink coefficients instead of choosing them (`l1_ratio` = 0, 1, or in between) |
| `C = 1/λ` | The penalty strength in scikit-learn. **Small C = strong penalty** |
| The **regularisation path** | All the models from "no variables" to "all variables", as the penalty weakens |
| The **1-SE rule** | Pick the simplest (most penalised) model whose CV AUC is within one standard error of the best, where SE = fold sd / √5 |

## 🗓️ Agenda (3 hours)

| Time | Block |
|---|---|
| 13:00 – 13:15 | Recap of Session 6 · questions on Checkpoint 1 |
| 13:15 – 13:45 | The cost of a variable · forward selection: how many questions does the form need? |
| 13:45 – 14:10 | Shrinkage: the penalty, the geometry, why LASSO gives exact zeros |
| 14:10 – 14:25 | Break |
| 14:25 – 15:35 | **Lab:** the LASSO path on the poverty model · when shrinkage pays off |
| 15:35 – 16:00 | Project work: which variables does *your* model need? |

## 📖 Contents

### 1. Why fewer variables?

More variables never hurt the fit on the training data. They can hurt in three other ways:

- **Variance.** Every coefficient is estimated with noise. With few observations per coefficient
  the model starts fitting that noise, the overfitting of Session 3 in a new form.
- **Interpretability.** A model with 7 inputs can be explained to a ministry. A model with 76 columns
  is a black box even if it is linear.
- **Cost and gaming.** In a proxy means test each variable is a question someone must ask, record
  and verify. The more questions, the more expensive the visit, and the more chances for an
  applicant to give the answer that qualifies.

Two families of tools answer the question: **selection** (keep some variables, drop the rest) and
**shrinkage** (keep all of them, but pull their coefficients towards zero).

### 2. Forward stepwise selection: build the form one question at a time

Trying every possible form would mean $2^{19} \approx 524{,}000$ models. **Forward stepwise
selection** is the greedy shortcut: start with no questions, and at each step add the one that raises
the cross-validated AUC the most.

We select **questions** (raw variables), not dummy columns: a form cannot ask "is the region
Maule?" without asking the region. Press *Play* and watch the gains flatten:

<div class="ml-widget" data-widget="forward-steps"></div>

| Questions | Last question added | CV AUC |
|---:|---|---:|
| 1 | `head_job_type` | 0.657 |
| 2 | `head_age` | 0.702 |
| 3 | `head_education` | 0.726 |
| 5 | `has_children` | 0.757 |
| 7 | `region` | 0.771 |
| **8** | `head_weekly_hours` | **0.774** |
| 10 | `overcrowding` | 0.779 |
| 19 | (all) | 0.781 |

**Eight questions get within 0.01 of the full form** (0.774 vs 0.781). Seven reach 0.771, a hair
below the line. The 0.01 is a convention, not a law, so show the whole curve and not just the
cut-off. The order tells a story too. `head_schooling_years` only enters at step 18, because `head_education` already carries almost the same information.
Greedy selection keeps one of two correlated variables and ignores the other, which makes the
second one *redundant*, not *irrelevant*.

### 3. Shrinkage: a price on every coefficient

Selection is all-or-nothing. **Shrinkage** keeps every variable, but adds a price for large
coefficients to the quantity the model minimises:

$$\underbrace{\text{log-loss}(\beta)}_{\text{fit the data}} \; + \; \lambda \cdot \underbrace{\text{penalty}(\beta)}_{\text{keep coefficients small}}$$

| Method | Penalty | What it does |
|---|---|---|
| **Ridge** (L2) | $\sum_j \beta_j^2$ | Shrinks all coefficients towards 0. None becomes exactly 0 |
| **LASSO** (L1) | $\sum_j \lvert\beta_j\rvert$ | Shrinks, and sets some coefficients **exactly** to 0, so it selects as well |
| **Elastic Net** | a mix of both | Sparse like LASSO, more stable when variables are correlated |

Read it in plain words: $\lambda$ is the exchange rate between fit and simplicity. With
$\lambda = 0$ you get the ordinary logit. As $\lambda$ grows, a coefficient has to "earn" its size by
improving the fit enough to pay for it. scikit-learn uses the inverse, $C = 1/\lambda$, so a
**small C means a strong penalty**.

Because the penalty compares coefficients with each other, all variables must be on the same scale.
A coefficient on income in pesos is tiny and a coefficient on a 0/1 dummy is large, for the same
importance. That is why the `StandardScaler` stays inside the pipeline.

!!! example "Worked example by hand"
    Take two standardised, uncorrelated variables whose unpenalised (OLS) coefficients are
    $\hat\beta_1 = 0.80$ and $\hat\beta_2 = 0.15$. In this simple case the penalised solutions have
    closed forms:

    - **Ridge** divides every coefficient by the same factor: $\beta^{\text{ridge}} = \hat\beta / (1 + \lambda)$
    - **LASSO** subtracts $\lambda$ and stops at zero: $\beta^{\text{lasso}} = \text{sign}(\hat\beta)\cdot\max(|\hat\beta| - \lambda,\; 0)$

    With $\lambda = 0.2$:

    | | $\hat\beta$ (no penalty) | Ridge: $\hat\beta / 1.2$ | LASSO: $\max(\lvert\hat\beta\rvert - 0.2, 0)$ |
    |---|---:|---:|---:|
    | $\beta_1$ | 0.80 | 0.80 / 1.2 = **0.667** | 0.80 − 0.20 = **0.60** |
    | $\beta_2$ | 0.15 | 0.15 / 1.2 = **0.125** | 0.15 − 0.20 < 0 → **0** |

    Ridge shrinks both coefficients by the same proportion. LASSO shrinks both by the same
    *amount*, and the small one does not survive. That is the whole mechanism of selection by
    LASSO: a coefficient smaller than $\lambda$ is set to zero.

Why does the absolute value produce exact zeros and the square does not? A penalty is equivalent to
a **budget**: the coefficients must stay inside a shape (a diamond for L1, a circle for L2), and the
solution is the first point where the contours of the loss touch it. Switch between L1 and L2 and
shrink the budget:

<div class="ml-widget" data-widget="penalty-geometry"></div>

The diamond has **corners on the axes**, and the contours usually touch it at a corner, where one
coefficient is exactly zero. The circle has no corners, so coefficients get smaller but never
vanish.

### 4. The LASSO path on the poverty model

We fit the L1-penalised logit for 40 values of C, from C = 0.001 (almost every coefficient is zero)
to C = 10 (almost no penalty), and record three things each time: the coefficients, the
cross-validated AUC, and how many **questions** still have at least one non-zero coefficient.

<div class="ml-widget" data-widget="lasso-path"></div>

| Penalty choice | C | Coefficients ≠ 0 (of 76) | Questions used (of 19) | CV AUC (± SE) |
|---|---:|---:|---:|---:|
| CV-best | 0.943 | 60 | 18 | 0.781 ± 0.004 |
| **1-SE rule** | 0.070 | **35** | **18** | 0.777 ± 0.004 |

The **1-SE rule** picks the simplest (most penalised) model whose CV AUC is within one standard
error of the best, where SE = fold sd / √5. The fold standard deviation is 0.009, so
SE = 0.009 / √5 ≈ 0.004, and any model scoring at least 0.781 − 0.004 = 0.777 is statistically
indistinguishable from the best. Among those, the rule takes the one with the strongest penalty.
It cuts the coefficients from 60 to 35.

But look at the last column. Those 35 coefficients still come from **18 of the 19 questions**.
LASSO drops *dummy columns*, not *questions*. It may keep `region = La Araucanía` and drop every
other region, and the form still has to ask for the region. To remove questions you need to select
whole groups of columns, which is what our forward selection did (the *group LASSO* does it with a
penalty, but it is not in scikit-learn).

!!! info "From econometrics to ML"
    - **OLS is unbiased; that is not the same as accurate.** With many correlated regressors its
      variance is large. Ridge accepts a little bias to remove a lot of variance: the
      bias–variance trade-off from Session 3, now on coefficients.
    - **scikit-learn's `LogisticRegression()` is already Ridge with C = 1** by default. Stata and
      statsmodels do not penalise. If you compare coefficients across software, this is why they differ.
    - **A LASSO zero is not "not significant".** It means "not needed for prediction, given the other
      variables". Between two correlated variables LASSO may keep one almost at random.
    - **Penalised coefficients are biased by design**, so the usual standard errors and p-values do
      not apply to them. If you need inference *after* selecting variables (for example, the
      effect of one policy variable controlling for many others), look at *post-double-selection*
      (Belloni, Chernozhukov & Hansen, 2014).

### 5. Ridge, LASSO, Elastic Net, and the short form, on the test set

| Model | Questions asked | CV AUC | Test AUC |
|---|---:|---:|---:|
| Full form, logit (Session 5) | 19 | 0.781 | **0.794** |
| Ridge, CV-best (C = 0.32) | 19 | 0.781 | — |
| Elastic Net (0.5), CV-best | 19 | 0.781 | — |
| LASSO, 1-SE rule | 18 | 0.777 | 0.795 |
| **Short form, forward selection** | **8** | 0.774 | 0.786 |

With 11,250 training households and 76 columns, the unpenalised logit is already stable. All three
penalties tie with it on AUC. **On this data shrinkage buys sparsity, not accuracy.** The real
choice is between the full form (0.794) and the 8-question form (0.786), which gives up 0.008 of
AUC to save 11 questions per visit. That trade-off belongs to the ministry, but it can now be argued
with numbers.

### 6. When does shrinkage pay off? When data is scarce

Imagine a pilot survey in one province: a few hundred households and the same 76 columns. We train
on random subsamples of the training set (5 repetitions each) and evaluate on the full test set:

| Training households | No penalty | Ridge (C by CV) | LASSO (C by CV) |
|---:|---:|---:|---:|
| 300 | 0.686 | **0.733** | 0.725 |
| 1,000 | 0.754 | **0.782** | 0.779 |
| 11,250 (all) | 0.794 | 0.795 | 0.795 |

With 300 households the unpenalised model has 76 coefficients to estimate from about 70 poor
households, and it fits the noise. The penalty cuts that variance and gains almost 0.05 of AUC.
With all the data the gap disappears. **The fewer observations per variable, the more the penalty
is worth.**

### Common mistakes

| Mistake | Why it hurts | How to avoid it |
|---|---|---|
| Penalising unscaled variables | The penalty punishes coefficients for their units, not their importance | Keep `StandardScaler` inside the pipeline, before the model |
| Reading `C` as $\lambda$ | You think you are penalising more when you are penalising less | Small C = strong penalty. Plot results against C and check |
| Selecting variables on the whole dataset, then cross-validating | The selection has seen the validation folds, so the CV score is optimistic (a leak) | Select inside CV on the training set; test once at the end |
| Reading a LASSO zero as "no effect" | Correlated variables share the work; LASSO keeps one | Say "not needed for prediction given the others" |
| Using `l1_ratio=1` on an old scikit-learn | Versions before 1.8 silently ignore it and fit a Ridge | Check `sklearn.__version__`; count `coef_ == 0` |
| Expecting LASSO to remove questions | It removes dummy columns, not whole categorical variables | Select raw variables (forward selection) when the unit of cost is the question |

## ✅ Check your understanding

??? question "1. Model A uses C = 0.01 and model B uses C = 10. Which one has more zero coefficients, and why?"
    **Model A.** $C = 1/\lambda$, so C = 0.01 means $\lambda = 100$, a very strong penalty, while
    C = 10 means $\lambda = 0.1$. The stronger the L1 penalty, the more coefficients cannot "pay"
    for themselves and are set to zero. In the path widget, C = 0.01 is near the left edge, where
    only a handful of lines have left zero.

??? question "2. A standardised variable has $\hat\beta = -0.35$. What are the Ridge and LASSO coefficients with $\lambda = 0.4$? And with $\lambda = 0.1$?"
    With $\lambda = 0.4$: Ridge $= -0.35 / 1.4 = -0.25$. LASSO: $|{-0.35}| - 0.4 < 0$, so
    **0**: the variable is dropped.

    With $\lambda = 0.1$: Ridge $= -0.35 / 1.1 \approx -0.318$. LASSO: $\text{sign}(-0.35) \cdot (0.35 - 0.1) = -0.25$.
    The sign is kept, and LASSO subtracts the same amount whatever the size of the coefficient.

??? question "3. A classmate adds `income_per_capita` (in pesos) and `head_age` (in years) to a LASSO without scaling. What goes wrong?"
    Two things. First, a **leak**: income is the variable poverty is defined from (Session 4),
    so it cannot be a feature at all. Second, even for legitimate variables, **units**: a
    coefficient on a variable measured in pesos is tiny (each peso matters little), so the
    penalty barely touches it, while a variable on a small scale needs a large coefficient and is
    punished hard. Selection would then depend on the units, not on how informative each variable is.
    Standardising puts every variable on the same footing.

??? question "4. The 1-SE LASSO has 35 non-zero coefficients but still needs 18 of the 19 questions. Explain, and suggest how to get a shorter form."
    The 19 questions become 76 columns after one-hot encoding, and LASSO penalises each column
    separately. Keeping a single dummy of a categorical variable (one region, one household type)
    is enough to force the form to ask that question. To shorten the *form*, select whole
    variables: forward selection over raw variables (8 questions for CV AUC 0.774), or a group-LASSO
    penalty that drops all the dummies of a variable together.

??? question "5. The ministry must choose between the full form (19 questions, test AUC 0.794) and the short form (8 questions, 0.786). Give one argument for each."
    **For the short form:** 11 fewer questions per visit means cheaper and faster
    targeting, so more households can be assessed with the same budget. It also leaves fewer
    answers an applicant can shade, and is easier to explain and audit. **For the full form:** the
    AUC gap is small on average, but at the chosen threshold it can mean a few more poor households
    excluded. Some dropped questions (overcrowding, dwelling type) are *observable by the
    interviewer* and hard to fake, which is valuable against manipulation even if their
    predictive gain is small. A good answer weighs the cost of a visit, the risk of gaming and
    the cost of each type of error (Session 5).

## 🧪 Lab

The notebook rebuilds every number on this page: forward selection, the LASSO path, the comparison
of penalties, the small-sample experiment and the final test. It runs in about two minutes.

[📓 Session 7 — Selection and Shrinkage](../notebooks/s07_shrinkage.ipynb) ·
[![Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/s07_shrinkage.ipynb)

!!! example "Assistant skill: debugging with the assistant instead of guessing"
    When something looks wrong, give the assistant the **symptom, the code and your environment**,
    and ask for a diagnosis you can check. Don't ask it to "fix it".
    ```text
    I fit LogisticRegression(l1_ratio=1, solver="liblinear", C=0.03) inside a Pipeline on Colab,
    expecting a LASSO, but none of the 76 coefficients is exactly zero. My scikit-learn version is
    (paste sklearn.__version__). Diagnose the cause. Show me the evidence: which line of the
    documentation for MY version explains it, and a two-line check I can run to confirm.
    ```
    Check: did it ask for (or use) your version before answering? Did it give you a check you can
    run (for example `(model[-1].coef_ == 0).sum()`), or only a confident explanation? An
    assistant trained on documentation of a different version will happily give you the wrong API
    with full confidence. That is a fabricated-API failure, and only the check catches it.

!!! abstract "Key takeaways"
    - Every variable has a cost: variance, interpretability, and in policy, collection and gaming.
    - **Forward selection** adds variables greedily by CV score. Select whole questions when the
      question is the unit of cost.
    - **Ridge** shrinks all coefficients, **LASSO** shrinks and sets some to exactly zero, and
      **Elastic Net** sits in between. Always standardise first.
    - In scikit-learn **C = 1/λ**: small C means a strong penalty. Choose it by CV, and when
      simplicity has value prefer the **1-SE** model: the simplest one whose CV AUC is within one
      standard error (fold sd / √5) of the best.
    - Shrinkage pays off most when observations are few relative to variables. With plenty of data
      its gift is sparsity.

    ```python
    lasso = Pipeline([("pre", preprocessor(RAW)),
                      ("clf", penalised_logit(C=0.07, l1_ratio=1))])    # l1_ratio: 0 Ridge, 1 LASSO
    auc = cross_val_score(lasso, X_train, y_train, cv=cv, scoring="roc_auc")
    lasso.fit(X_train, y_train)
    kept = (lasso.named_steps["clf"].coef_ != 0).sum()
    ```

## ✍️ Before Session 8

- [ ] Notebook exercises 1–3.
- [ ] Read ISLR, sections 6.1–6.2 (subset selection, Ridge and the LASSO). See the [Program](../program.md#7-readings).
- [ ] **Project:** run a LASSO path or a forward selection on your own model. Which variables does
      it need? Report the number of variables next to the CV score.
- [ ] Read your Checkpoint 1 feedback and list the changes you will make.

## 📚 Next session

[Session 8](class8.md) (Friday 20 November): so far every model has learned from a label, *poor* or *not poor*.
What if we drop the label and ask the data itself: **what types of households are there?**
Principal components and clustering, plus a project clinic.
