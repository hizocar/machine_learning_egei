# Session 6 · Trees and Ensembles: Can Flexibility Find Whom the Logit Misses?

<div class="usm-session-meta">
<span>Friday 6 November 2026</span>
<span>13:00 – 16:00</span>
<a class="usm-tag-gold" href="../../program/#5-course-contents" title="Block D of the course contents in the Program">Syllabus block D · Trees and Forests</a>
<span class="usm-tag-skill">Assistant skill: refactoring into functions</span>
</div>

<div class="usm-actions usm-session-actions">
<a class="usm-primary" href="../../notebooks/s06_trees/">Notebook</a>
<a href="https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/s06_trees.ipynb" target="_blank" rel="noopener">Open in Colab</a>
<a href="#check-your-understanding">Check your understanding</a>
</div>

## ❓ Today's question

> The Session 5 logit is a straight line on the log-odds scale: every variable pushes the probability
> up or down by the same amount, whatever the other variables say. Real poverty is full of
> interactions: working few hours matters more if there are children to feed. **Can a more flexible
> model find the poor households the logit misses, and what do we give up in exchange?**

## 🔁 What you already know

- [Session 3](class3.md): flexible models overfit. KNN with k = 1 memorises.
- [Session 4](class4.md): pipelines, cross-validation, and never choosing with the test set.
- [Session 5](class5.md): the logit, AUC, and the threshold as a policy decision (cost = 3·FN + FP),
  chosen with `cross_val_predict` on the training set.

## ✨ New today

| Tool | What it is for |
|---|---|
| `DecisionTreeClassifier` | Predict with a sequence of yes/no questions learned from the data |
| Gini impurity | Measure how mixed a group is, to choose each question |
| `max_depth` · `min_samples_leaf` | Stop a tree from memorising the training set |
| `plot_tree` · `export_text` | Read a fitted tree as rules |
| Bootstrap · bagging | Average many trees fitted on resampled data to cancel their noise |
| `RandomForestClassifier` · out-of-bag score | Bagging plus random subsets of variables, with free validation |
| `HistGradientBoostingClassifier` | Add small trees in sequence, each correcting the errors of the previous ones |
| `permutation_importance` | Ask how much a model relies on each variable |

## 🗓️ Agenda (3 hours)

| Time | Block |
|---|---|
| 13:00 – 13:15 | Recap: the logit, its threshold and its blind spots |
| 13:15 – 14:10 | Decision trees: Gini, splits, depth and overfitting |
| 14:10 – 14:25 | Break |
| 14:25 – 15:05 | Ensembles: bagging, random forests, boosting |
| 15:05 – 15:35 | **Lab:** the race, refactored into functions · permutation importance |
| 15:35 – 16:00 | Project work: Checkpoint 1 questions (due Thursday 12 November) |

## 📖 Contents

### 1. A tree is a sequence of questions

Imagine a social worker with a clipboard. The first question splits the households into two piles;
each pile gets its own next question, and so on. After a few questions, each final pile (a **leaf**)
is a group of similar households, and the model predicts the share of poor households in that pile.

The tree learns which questions to ask. To do that it needs a way to say how good a pile is.

### 2. Choosing a question: the Gini impurity

A group with a share $p$ of poor households has **Gini impurity**

$$G = 1 - p^2 - (1-p)^2 = 2p(1-p)$$

In words: pick two households at random from the group. $G$ is the probability that one is poor and
the other is not. A pure group (all poor, or none) has $G = 0$; a 50/50 group has the maximum,
$G = 0.5$. A split is scored by the **weighted average** impurity of the two groups it creates, and
the tree keeps the split with the lowest score.

!!! example "Worked example by hand"
    Eight households, three of them poor:

    | Household | Years of schooling | Household size | Poor |
    |---|---:|---:|:---:|
    | H1 | 6 | 5 | ✔ |
    | H2 | 8 | 3 | ✔ |
    | H3 | 8 | 2 | |
    | H4 | 10 | 6 | ✔ |
    | H5 | 12 | 3 | |
    | H6 | 12 | 1 | |
    | H7 | 14 | 4 | |
    | H8 | 16 | 2 | |

    **Before any split:** $p = 3/8 = 0.375$, so $G = 2 \times 0.375 \times 0.625 = 0.469$.

    **Split A, "schooling ≤ 10?"**
    - *Yes* group: H1–H4, 3 poor out of 4, so $G = 2 \times 0.75 \times 0.25 = 0.375$.
    - *No* group: H5–H8, 0 poor out of 4, so $G = 0$.
    - Weighted: $\tfrac{4}{8} \times 0.375 + \tfrac{4}{8} \times 0 = 0.188$.

    **Split B, "household size ≤ 3?"**
    - *Yes* group: H2, H3, H5, H6, H8, 1 poor out of 5, so $G = 2 \times 0.2 \times 0.8 = 0.320$.
    - *No* group: H1, H4, H7, 2 poor out of 3, so $G = 2 \times \tfrac{2}{3} \times \tfrac{1}{3} = 0.444$.
    - Weighted: $\tfrac{5}{8} \times 0.320 + \tfrac{3}{8} \times 0.444 = 0.367$.

    Split A removes $0.469 - 0.188 = 0.281$ of impurity and split B only $0.102$, so the tree asks
    about schooling first. A real tree does this for every variable and every possible cut, then
    repeats inside each group.

Now try it on the 11,250 training households. On real data no single variable separates poor from
non-poor cleanly. The best cut on schooling (≤ 12) only takes the impurity from 0.355 to 0.346.

<div class="ml-widget" data-widget="tree-split"></div>

Notice what the tree does **not** need: scaling. "Schooling ≤ 12" is the same question in years or
in standard deviations. Categories still need one-hot encoding, because scikit-learn's trees split on
numbers.

### 3. The tree we actually get

Fitted on all the variables, the first question is **"does the head work 27.5 hours a week or
less?"**, a group that includes heads who do not work at all. On the *yes* side 33% of households are
poor; on the *no* side, 13%. The next questions differ by branch: for low-hours households the tree
asks about the head's age, then about housing tenure or household size; for full-time workers it asks
whether there are children, then about the type of job or schooling. That is an **interaction**,
found without anyone writing it down.

### 4. How deep? Overfitting, again

Every extra level doubles the number of groups. Deep enough, each leaf holds a handful of households
and the tree memorises them: it is KNN with k = 1 all over again. Move the slider and watch both the
curves and the tree.

<div class="ml-widget" data-widget="tree-depth"></div>

| Tree | Train AUC | CV AUC |
|---|---:|---:|
| `max_depth=3` | 0.738 | 0.735 |
| `max_depth=6` (best by CV) | 0.795 | 0.759 |
| `max_depth=12` | 0.929 | 0.693 |
| No limit | **1.000** | **0.618** |
| No depth limit, `min_samples_leaf=100` | — | 0.763 |
| *Logit, for reference* | *0.789* | *0.781* |

Even the best single tree stays below the logit. A tree is flexible but **unstable**: change a few
households and the first question can change, and everything below it with it.

### 5. Many trees: bagging and random forests

The cure for instability is to grow many trees and average them.

1. **Bootstrap:** draw 11,250 households *with replacement* from the training set. Some appear twice,
   and about a third are left out.
2. **Bagging** (*bootstrap aggregating*): fit one deep tree per bootstrap sample and average their
   probabilities. Each tree overfits in its own way, and the average cancels much of that noise.
3. **Random forest:** at each split, a tree may only consider a random subset of the variables
   (`max_features`, by default the square root of their number). The trees become more different
   from each other, so their average improves further.

The households a tree never saw are its **out-of-bag** sample: a free validation set.

<div class="ml-widget" data-widget="forest-vote"></div>

| Model | CV AUC |
|---|---:|
| Bagging (all variables at each split) | 0.787 ± 0.004 |
| Random forest (300 trees, `min_samples_leaf=5`) | **0.797 ± 0.007** |
| Random forest, out-of-bag AUC (no CV needed) | 0.798 |

### 6. Trees that learn from their mistakes: gradient boosting

A forest grows its trees **independently** and averages them. Boosting grows them **in sequence**:
each new tree is small, and it is fitted to what the current model still gets wrong. It is added with
a small weight (`learning_rate`), so the model improves step by step. Too many steps overfit, so
`HistGradientBoostingClassifier` sets aside 10% of the training data and **stops early** when that
held-out score stops improving.

!!! info "From econometrics to ML"
    - In a regression, an interaction exists only if you write `hours × children` into the model. A
      tree finds interactions and thresholds on its own. That is its strength, and also why it
      overfits.
    - A tree has no coefficients and no standard errors. You cannot ask "is schooling significant?".
      You can ask "how much worse does the model predict without schooling?" (section 8).
    - Bagging is the bootstrap you know from econometrics. There it estimated the variability of an
      estimator; here it *reduces* the variability of a prediction by averaging.
    - None of these models is causal. A tree that splits on hours of work is not saying that more
      hours would lift a household out of poverty.

### 7. The race, done properly

Four models, compared with the **same** 5 folds and the **same** test set. Each model gets its own
threshold, chosen to minimise 3·FN + FP on **out-of-fold** probabilities (`cross_val_predict`) from
the training set, never on the test set.

<div class="ml-widget" data-widget="model-race"></div>

| Model | Train AUC | CV AUC | Test AUC | Threshold | Recall | Precision | Cost 3·FN + FP |
|---|---:|---:|---:|---:|---:|---:|---:|
| Logit (Session 5) | 0.789 | 0.781 ± 0.009 | 0.794 | 0.26 | 0.680 | 0.454 | 1,540 |
| Tree (depth 4) | 0.757 | 0.746 ± 0.009 | 0.767 | 0.24 | 0.682 | 0.446 | 1,560 |
| Random forest | 0.903 | 0.797 ± 0.007 | 0.814 | 0.24 | 0.745 | **0.460** | **1,421** |
| Gradient boosting | 0.910 | **0.798 ± 0.007** | **0.815** | 0.20 | **0.788** | 0.439 | 1,422 |

The ensembles gain about **0.02 of AUC** and cut the policy cost by about **8%**. The forest reaches
75% of poor households against the logit's 68%, at slightly better precision; boosting picks a lower
threshold and reaches 79%, at lower precision, for the same total cost. That gain is real, but it is
not a revolution, and it comes at a price (section 9).

### 8. What does the forest rely on? Permutation importance

`feature_importances_` (impurity importance) adds up how much each column reduced the Gini while the
trees were being *trained*, and it favours variables with many possible cut points.
**Permutation importance** asks a cleaner question on the *test* set: if I shuffle this column so it
carries no information, how much AUC does the model lose?

| Variable | AUC lost when shuffled |
|---|---:|
| `head_age` | 0.037 |
| `head_weekly_hours` | 0.031 |
| `has_children` | 0.029 |
| `housing_tenure` | 0.028 |
| `household_type` | 0.019 |
| `has_elderly` | 0.018 |

Two cautions. Importance describes what the model **uses to predict**, not what **causes** poverty.
And when two variables carry the same information (years of schooling and education level), shuffling
one costs little, because the other covers for it.

### 9. Accuracy vs. explanation

A household excluded from a programme has the right to ask *why*. With a depth-3 or depth-4 tree the
answer is a short chain of questions: "the head works more than 27.5 hours, there are no children, and
the head is not self-employed". With 300 trees there is no short answer. Against the depth-4 tree,
the forest gains about 0.05 of AUC and saves about 140 cost units on 3,750 test households. Whether
that is worth the loss of transparency is a decision for the programme. Your job is to put both
numbers on the table.

### Common mistakes

| Mistake | Why it hurts | How to avoid it |
|---|---|---|
| Growing a tree with no limits | Train AUC 1.000, CV AUC 0.618: pure memorisation | Set `max_depth` or `min_samples_leaf` and choose them by CV |
| Comparing models on different splits | Differences can be luck of the split, not the model | Same `cv` object and same test set for every model |
| Reading `feature_importances_` as causal effects | Importance is about prediction, and impurity importance is biased | Use permutation importance, and still don't read it causally |
| Choosing each model's threshold on the test set | The comparison becomes optimistic, the Leak C of Session 4 | `cross_val_predict` on the training set |
| Keeping the forest because its AUC is highest | You lose the ability to explain each decision | Report the trade-off and let the decision-maker weigh it |
| Scaling features "just in case" before a tree | Harmless but useless, and it adds a step you must explain | Trees only need numbers, not comparable scales |

## ✅ Check your understanding

??? question "1. A leaf holds 50 households, 10 of them poor. What is its Gini impurity, and what probability does the tree predict for a new household that lands there?"
    $p = 10/50 = 0.2$, so $G = 2 \times 0.2 \times 0.8 = 0.32$. The tree predicts the leaf's poverty
    share: a probability of 0.2. Whether that household gets the subsidy depends on the threshold
    (0.24 for the forest, 0.26 for the logit), not on the tree.

??? question "2. The unrestricted tree has a train AUC of 1.000 and a CV AUC of 0.618. Explain both numbers."
    With no depth limit, the tree keeps splitting until each leaf is pure, often a single household,
    so it predicts every training household perfectly (AUC 1.000). Those leaves describe individual
    households, not patterns, so on households it has not seen the rules are mostly noise (CV AUC
    0.618, much worse than the logit's 0.781). It is the same phenomenon as KNN with k = 1.

??? question "3. Why does a tree not need `StandardScaler`, while KNN does?"
    KNN compares households by distance, and distance depends on units. A tree only asks "is this
    value above or below a cut?", and the answer is the same in years, months or standard deviations.
    One-hot encoding is still needed, because scikit-learn's trees only split numeric columns.

??? question "4. Bagging scored 0.787 and the random forest 0.797. What does the forest do differently, and why does it help?"
    At each split, each tree of the forest may only look at a random subset of the variables. With
    bagging, every tree tends to start with the same strong question (hours of work), so the trees are
    similar and their errors are correlated. Averaging correlated errors cancels little. Forcing the
    trees to differ makes their errors less correlated, so the average cancels more noise.

??? question "5. The ministry insists that every excluded household can be told why. What do you recommend, and what does it cost?"
    A shallow tree (depth 3–4), presented as a scorecard. On our test set the depth-4 tree costs
    1,560 against 1,421 for the random forest: about 140 more cost units, mainly poor households left
    out. One honest option is to use the forest to rank households and the tree to explain the rule,
    checking that the two rarely disagree, but that is a policy choice, not a statistical one. Put the
    numbers on the table.

## 🧪 Lab

[📓 Session 6 — Trees and Ensembles](../notebooks/s06_trees.ipynb) ·
[![Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/s06_trees.ipynb)

!!! example "Assistant skill: refactor a script into functions"
    ```text
    Here is my notebook code that evaluates four classifiers (paste it).
    Refactor it into two functions: cost_threshold(p, y, fn_cost, fp_cost) and
    evaluate(model, X_train, y_train, X_test, y_test, cv) -> dict.
    Keep the results identical. The threshold must be chosen with out-of-fold predictions on the
    training set only. Add a docstring to each function and change nothing else.
    ```
    Then run the old and the new code and compare the results table **number by number**. A refactor
    that changes a result is a bug, even if the new number looks better. A common one: the assistant
    "simplifies" by choosing the threshold on `X_test`.

!!! abstract "Key takeaways"
    - A tree predicts with yes/no questions chosen to make groups as pure as possible (Gini). It needs
      no scaling and finds interactions on its own.
    - Unrestricted trees memorise (train AUC 1.000, CV 0.618). Limit depth or leaf size, and choose
      the limit by CV.
    - Averaging many different trees (bagging, random forests) cancels their noise. Boosting adds
      small trees that correct each other.
    - On our data the ensembles beat the logit by about 0.02 AUC and about 8% in policy cost: a real
      but modest gain that costs explainability.
    - Compare models on the same folds, with thresholds chosen out-of-fold, and read importance as
      predictive, never causal.

    ```python
    tree   = DecisionTreeClassifier(max_depth=4, min_samples_leaf=20)
    forest = RandomForestClassifier(n_estimators=300, min_samples_leaf=5, n_jobs=-1)
    boost  = HistGradientBoostingClassifier()
    oof = cross_val_predict(model, X_train, y_train, cv=cv, method="predict_proba")[:, 1]
    permutation_importance(model, X_test, y_test, scoring="roc_auc", n_repeats=5)
    ```

## ✍️ Before Session 7

- [ ] Notebook exercises 1–3. Exercise 3, the scorecard, is good practice for your project memo.
- [ ] Read ISLR, chapter 8 (sections 8.1 and 8.2). See the [Program](../program.md#7-readings).
- [ ] **Checkpoint 1 is due Thursday 12 November, 23:59.** It covers Sessions 1–5. Trees are welcome
      as an extra model, but not required.

## 📚 Next session

[Session 7](class7.md) (Friday 13 November): every question on a proxy-means form costs money to ask and is one
more thing a household can misreport. **Which variables do we really need?** Selection and shrinkage:
LASSO, Ridge and Elastic Net.
