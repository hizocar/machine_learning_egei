---
hide:
  - navigation
---

# Glossary

Every term the course uses, in plain words, with the session where it first appears. When a term
has a usual name in econometrics, it is given too.

## Data and evaluation

| Term | Meaning | Session |
|---|---|:---:|
| **Unit of analysis** | What one row represents (here, one household). Make it the unit you will make decisions about. | [2](classes/class2.md) |
| **Nominal / ordinal variable** | Categories without order (region) / with an order but no fixed spacing (education level). | [1](classes/class1.md) |
| **Target (label, outcome)** | The variable the model predicts: $y$ in econometrics. | [3](classes/class3.md) |
| **Feature (predictor)** | A variable the model uses as input: a regressor in econometrics. | [3](classes/class3.md) |
| **Training set / test set** | The rows the model learns from / the rows kept aside to measure performance on unseen data. | [3](classes/class3.md) |
| **Baseline** | The simplest possible prediction (the mean, or the majority class). Every model must beat it. | [4](classes/class4.md) |
| **RMSE** | Root mean squared error: the typical size of a prediction error, in the units of the target. | [3](classes/class3.md) |
| **Overfitting / underfitting** | Learning the noise of the training data (low train error, high test error) / being too rigid to learn the pattern. | [3](classes/class3.md) |
| **Bias–variance trade-off** | Flexible models have low bias and high variance; rigid ones the reverse. The best test error is in between. | [3](classes/class3.md) |
| **Hyperparameter** | A setting chosen before fitting (k in KNN, depth of a tree, the penalty λ), not learned from the data. | [3](classes/class3.md) |
| **Cross-validation (k-fold)** | Split the training set into k folds; each fold takes a turn as validation. Gives a mean score and its spread. | [4](classes/class4.md) |
| **Data leakage** | Information that would not be available at prediction time reaching the model. Makes scores look better than reality. | [4](classes/class4.md) |
| **Target leakage** | A feature computed from the target (e.g. `income_decile` when predicting income). The predictive cousin of a *bad control*. | [4](classes/class4.md) |
| **Proxy means test** | Predicting a household's welfare from easy-to-observe characteristics, to target social programmes. The course case. | [Case](case.md) |

## Preprocessing and pipelines

| Term | Meaning | Session |
|---|---|:---:|
| **Scaling (standardisation)** | Rescaling each variable to mean 0 and standard deviation 1, so units do not decide distances or penalties. | [4](classes/class4.md) |
| **Pipeline** | One object that chains preprocessing steps and a model, and fits them in the right order on each training fold. | [4](classes/class4.md) |
| **Imputation** | Filling missing values. The rule depends on what *missing* means: unknown (median) or not applicable (0 / own category). | [5](classes/class5.md) |
| **One-hot encoding** | Turning a categorical variable into one 0/1 column per category: dummy variables in econometrics. | [5](classes/class5.md) |
| **ColumnTransformer** | Applies a different preprocessing pipeline to each group of columns. | [5](classes/class5.md) |
| **Stratified split** | A split that keeps the same share of each class in every part. | [5](classes/class5.md) |

## Classification

| Term | Meaning | Session |
|---|---|:---:|
| **Logistic regression (logit)** | Models $P(y = 1)$ as $1/(1 + e^{-z})$ with $z$ a linear score. The same model as in econometrics, judged by prediction. | [5](classes/class5.md) |
| **Decision threshold** | The probability above which we predict "yes". 0.5 is a default, not a rule; it should follow from the cost of each error. | [5](classes/class5.md) |
| **Confusion matrix** | The 2×2 table of true/false positives and negatives. | [5](classes/class5.md) |
| **False positive / false negative** | Predicting "poor" for a non-poor household (inclusion error) / missing a poor household (exclusion error). | [5](classes/class5.md) |
| **Accuracy** | Share of correct predictions. Misleading when one class is much more common. | [5](classes/class5.md) |
| **Recall (sensitivity)** | Of the actual positives, the share the model finds: TP / (TP + FN). | [5](classes/class5.md) |
| **Precision** | Of the predicted positives, the share that are right: TP / (TP + FP). | [5](classes/class5.md) |
| **ROC curve** | Recall against false positive rate, for every threshold. | [5](classes/class5.md) |
| **AUC** | Area under the ROC curve: the probability that a random positive gets a higher score than a random negative. 0.5 = coin, 1 = perfect. | [5](classes/class5.md) |
| **Odds ratio** | $e^{\beta}$: how a one-unit change multiplies the odds. In a predictive model, an association, not a causal effect. | [5](classes/class5.md) |

## Trees and ensembles

| Term | Meaning | Session |
|---|---|:---:|
| **Decision tree** | A sequence of yes/no questions ("does the head work more than 27.5 hours?") that ends in a prediction at each leaf. | [6](classes/class6.md) |
| **Gini impurity** | How mixed a node is: $1 - \sum_k p_k^2$. 0 if all households in it share the same class; 0.5 at a 50/50 mix. | [6](classes/class6.md) |
| **Split** | The question that divides a node in two; the tree picks the one that lowers impurity the most. | [6](classes/class6.md) |
| **Depth / `min_samples_leaf`** | How many questions in a row a tree may ask / the smallest group a leaf may contain. Both control overfitting. | [6](classes/class6.md) |
| **Bootstrap / bagging** | Resampling the rows with replacement / training many models on bootstrap samples and averaging them, to cut variance. | [6](classes/class6.md) |
| **Random forest** | Bagging of trees where each split only considers a random subset of features (`max_features`), so the trees disagree more and the average is better. | [6](classes/class6.md) |
| **Out-of-bag (OOB) score** | Each tree is evaluated on the rows its bootstrap left out: a free validation score. | [6](classes/class6.md) |
| **Gradient boosting** | Trees built one after another, each correcting the errors of the ones before; `learning_rate` sets how big each correction is. | [6](classes/class6.md) |
| **Permutation importance** | How much the validation score drops when one feature is shuffled. Measures predictive use, not causal effect. | [6](classes/class6.md) |

## Selection and shrinkage

| Term | Meaning | Session |
|---|---|:---:|
| **Forward (stepwise) selection** | Start with no variables and add, one at a time, the one that improves the CV score most. | [7](classes/class7.md) |
| **Regularisation (penalisation)** | Adding a cost for large coefficients to the fitting criterion, trading a little bias for less variance. | [7](classes/class7.md) |
| **Ridge (L2)** | Penalty $\lambda \sum_j \beta_j^2$: shrinks all coefficients towards zero, never exactly to zero. | [7](classes/class7.md) |
| **LASSO (L1)** | Penalty $\lambda \sum_j \lvert\beta_j\rvert$: shrinks, and sets some coefficients exactly to zero, so it also selects variables. | [7](classes/class7.md) |
| **Elastic Net** | A mix of the L1 and L2 penalties (`l1_ratio`). | [7](classes/class7.md) |
| **λ and `C`** | The penalty strength. scikit-learn uses $C = 1/\lambda$: a *small* C means a *strong* penalty. | [7](classes/class7.md) |
| **Regularisation path** | How each coefficient changes as the penalty goes from strong to weak. | [7](classes/class7.md) |
| **1-SE rule** | Choose the simplest model whose CV score is within one standard error of the best (SE = standard deviation across folds / √k). | [7](classes/class7.md) |

## Unlabeled data

| Term | Meaning | Session |
|---|---|:---:|
| **Unsupervised learning** | Finding structure in the features when there is no target to predict. | [8](classes/class8.md) |
| **Principal component (PC)** | A new axis, a weighted mix of the standardised variables, pointing where the data spread most. PC1 keeps the most variance, PC2 the most of what is left, and so on. | [8](classes/class8.md) |
| **Explained variance ratio** | Share of the total variance a component keeps. Tells you how much a 2-D map hides. | [8](classes/class8.md) |
| **Loadings** | The weights of each original variable in a component: what the axis "means". | [8](classes/class8.md) |
| **k-means** | Splits the data into k groups by alternating two steps: assign each point to the nearest centroid, move each centroid to the mean of its points. | [8](classes/class8.md) |
| **Centroid** | The average profile of a cluster. | [8](classes/class8.md) |
| **Inertia** | Sum of squared distances from each point to its centroid. Always falls as k grows. | [8](classes/class8.md) |
| **Local minimum (`n_init`)** | k-means can get stuck in a worse solution depending on its start. Several starts (`n_init`) keep the best. | [8](classes/class8.md) |
| **Elbow / silhouette** | Two imperfect guides for k: where inertia stops falling fast / how much closer points are to their own cluster than to the next. | [8](classes/class8.md) |
| **Hierarchical clustering** | Merges the closest households or groups step by step; the dendrogram shows every level at once. | [8](classes/class8.md) |
| **Cluster profiling** | Describing each cluster in the original units, and only then looking at outcomes such as poverty. | [8](classes/class8.md) |
