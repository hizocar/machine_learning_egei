---
hide:
  - navigation
---

# Program

<div class="usm-session-meta">
<span>5 ECTS</span>
<span>Universidad Técnica Federico Santa María</span>
<span class="usm-tag-gold">Compulsory · GEME track</span>
</div>

## 1. Course identification

| Item | Detail |
|---|---|
| **Course title** | Machine Learning — Business Applications |
| **Programme** | EGEI · Track GEME (Globalisation and Emerging Market Economies) |
| **ECTS** | 5 |
| **Prerequisites** | Applied Econometrics I and II |
| **Lecturer** | Sebastián Azócar M., MSc in Data Science |
| **Contact** | [hizocar@gmail.com](mailto:hizocar@gmail.com) |
| **Language** | English |
| **Schedule** | **Fridays, 13:00 – 16:00** · 11 September – 27 November 2026 (10 meetings) |
| **Tools** | Python · scikit-learn · an AI coding assistant of your choice |
| **Course case** | [Targeting poor households with CASEN 2022](case.md) |

## 2. Course description

Machine learning (ML) uses algorithms that learn patterns from data instead of following rules
written by hand. This course covers the statistical methods and techniques used in ML to make
predictions with **business applications**: what a model can and cannot learn from data, how to
evaluate it honestly, and how to turn a prediction into a decision someone can act on.

**What changes this year.** Code assistants have moved from novelty to standard equipment on a data
team. Producing code is cheap now; *being accountable for it* is not. The course therefore runs two
threads in parallel:

- the **modelling thread** — the statistics and algorithms, which do not change because a machine
  writes the syntax for you; and
- the **workflow thread** — using an assistant to scaffold, refactor, debug and explain code, and
  verifying its output with the same scepticism you would apply to a colleague's pull request.

The second thread is not a bonus topic: an assistant that produces a plausible-looking model with a
silent data leak is worse than no assistant at all. Learning to catch that is part of the course.

## 3. Learning outcomes

On completion, students will be able to:

1. **Frame** a business question as a supervised or unsupervised learning problem, and state what a
   good answer would look like.
2. **Prepare and explore** real data in Python, reproducibly.
3. **Fit and tune** regression and classification models, and justify the choice of method.
4. **Evaluate** models honestly: train/test discipline, cross-validation, the bias–variance
   trade-off and the right metric for the business problem.
5. **Reduce and segment** data without labels using principal components and clustering.
6. **Work with an AI coding assistant** productively: prompt it precisely, review its output, test
   it, and identify when it is wrong.
7. **Communicate** results, assumptions and limitations to a non-technical audience.

## 4. Learning methods and schedule

Learning by doing. Sessions last **three hours** and follow the same rhythm: a concept block, a
hands-on lab paired with your assistant, and applied or project work. Students are expected to read
the assigned material **before** class, and a study load of at least three hours per week outside
the classroom is assumed. All assessed work is project-based.

### Calendar

Every session works on the same case, [predicting household poverty with CASEN 2022](case.md), and
introduces each method once, before it is used.

| # | Date | Session |
|---:|---|---|
| 1 | Fri 11 Sep ✅ | Data and decision making · Python and assistant setup |
| — | Fri 18 Sep | 🇨🇱 *No class — Fiestas Patrias* |
| 2 | Fri 25 Sep ✅ | Data manipulation with pandas |
| 3 | Fri 2 & 9 Oct ✅ | What is machine learning? Fitting, KNN, bias–variance |
| — | Fri 16 Oct | *No class* |
| 4 | Fri 23 Oct ✅ | The ML pipeline: scaling, cross-validation and data leakage |
| 5 | Fri 30 Oct | Classification: logistic regression, confusion matrix, threshold, ROC · **Project released** |
| 6 | Fri 6 Nov | Trees and ensembles |
| 7 | Fri 13 Nov | Variable selection and shrinkage: LASSO, Ridge, Elastic Net · *Checkpoint 1 due Thu 12 Nov* |
| 8 | Fri 20 Nov | Unlabeled data: PCA and clustering · project clinic |
| 9 | Fri 27 Nov | **Final presentations** and course closing |

> 🗓️ The detailed plan for each session, with objectives, labs and notebooks, is on the
> [Classes](classes/classes.md) page.

## 5. Course contents

### A. Data and decision making
- Different types of data · data manipulation · from a business question to a dataset

### B. What is machine learning?
- **B.1 ML models:** what a model is · fitting a model · KNN · polynomial regression ·
  overfitting and underfitting (bias vs. variance) · the cost function · training and test error
- **B.2 The ML pipeline:** scaling · pipelines · cross-validation · data leakage

### C. Classification
- **C.1 Logistic regression:** what classification is · the logit as a predictor · categorical
  variables and missing values in the pipeline
- **C.2 Measuring performance:** confusion matrix · precision and recall · the decision threshold
  and the cost of errors · the ROC curve and AUC

### D. Trees and forests
- **D.1 Tree-based methods:** structure of decision trees · loss functions · pruning · regression
  and classification trees
- **D.2 Ensemble methods:** bagging · random forests · boosting

### E. Selection and shrinkage
- **E.1 Variable selection:** best subset selection · stepwise, forward and backward selection
- **E.2 Shrinkage methods:** shrinkage vs. selection · LASSO · Ridge · Elastic Net

### F. Unlabeled data
- **F.1 Dimension reduction:** principal components and their application
- **F.2 Clustering:** k-means · hierarchical clustering · advantages and limitations

### G. Working with AI coding assistants *(transversal)*
- Prompting for code that is specific enough to be useful · reading and reviewing generated code ·
  testing before trusting · typical failure modes in data work (leakage, silent type coercion,
  fabricated APIs, wrong metric) · reproducibility · disclosure and academic honesty

> 📖 The full guide for this thread is on the [Code Assistants](code-assistants.md) page.

### Beyond this course

Two topics from previous editions do not fit in this term's calendar: **naïve Bayes and text
classification**, and **neural networks**. ISLR chapters 4.4 and 10 cover both, at the same level
as the course.

## 6. Assessment

All of the final grade comes from **one project, delivered in two parts**. There are no written
exams and no separate in-class activities.

| Assessment | Weight | Covers | Due | Format |
|---|---:|---|---|---|
| **Checkpoint 1**: framing, data, honest first model | **40%** | Contents A, B, C | Thu 12 Nov, 23:59 | Notebook + 3-page memo |
| **Final delivery**: comparison, recommendation, defence | **60%** | All contents | Thu 26 Nov, 23:59 | Notebook + 8-page report + presentation on Fri 27 Nov |
| **Total** | **100%** | | | |

Both deliveries include a mandatory **assistant log**: which tool you used, for what, and what you
had to correct. Full instructions, deadlines and the grading rubric are on the
[Project](projects.md) page.

```text
Final grade = 0.40 × Checkpoint 1 + 0.60 × Final delivery
```

!!! warning "Assistant use: allowed, expected, and disclosed"
    Using an AI coding assistant is **permitted and encouraged** in the project. Two rules apply:
    (1) **you must be able to explain every line you submit** — presentations include questions
    about your own code; (2) **you must disclose** what you delegated in the assistant log. Code you
    cannot explain is treated as code you did not write.

## 7. Readings

### Foundations
1. [Breiman, L. (2001). *Statistical Modeling: The Two Cultures.* Statistical Science, 16(3), 199-231.](http://users.csc.calpoly.edu/~dsun09/data401/readings/Breiman-Two-Cultures.pdf)
2. [Zhang (2018). *Data Types From A Machine Learning Perspective With Examples.*](https://towardsdatascience.com/data-types-from-a-machine-learning-perspective-with-examples-111ac679e8bc)
3. [Burgess, M. (2018). *This is how Netflix's secret recommendation system works.* Wired.](https://www.wired.co.uk/article/netflix-data-personalisation-watching)

### The course case
- [Ministerio de Desarrollo Social y Familia. *Encuesta CASEN 2022.*](https://observatorio.ministeriodesarrollosocial.gob.cl/) The source of the course data. See [The Case](case.md).
- [Grosh, M. & Baker, J. (1995). *Proxy Means Tests for Targeting Social Programs: Simulations and Speculation.* World Bank LSMS Working Paper 118.](https://documents.worldbank.org/en/publication/documents-reports/documentdetail/750401468776352539) Why predicting welfare from observables is a policy tool.

### Models, pipeline and evaluation
4. [Agarwal, A. (2018). *Polynomial Regression.*](https://towardsdatascience.com/polynomial-regression-bbe8b9d97491)
5. [Koehrsen, W. (2018). *Overfitting vs. Underfitting: A Complete Example.*](https://towardsdatascience.com/overfitting-vs-underfitting-a-complete-example-d05dd7e19765)
6. [Gupta, P. (2017). *Cross-Validation in Machine Learning.*](https://towardsdatascience.com/cross-validation-in-machine-learning-72924a69872f)

### Classification
7. ISLR, sections 4.1–4.3 and 4.6.2
8. [PennState STAT 508 — Lesson 9.1: Logistic Regression](https://online.stat.psu.edu/stat508/lesson/9/9.1)

### Trees and ensembles
9. ISLR, chapter 8
10. [PennState STAT 508 — Lesson 11: Tree-based Methods](https://online.stat.psu.edu/stat508/lesson/11)

### Selection and shrinkage
11. ISLR, sections 6.1–6.2
12. [PennState STAT 508 — Lesson 5: Shrinkage Methods](https://online.stat.psu.edu/stat508/lesson/5)

### Working with code assistants
13. [GitHub Copilot documentation](https://docs.github.com/copilot)
14. [Anthropic — Claude documentation](https://docs.claude.com)
15. [OpenAI — API and product documentation](https://platform.openai.com/docs)

> 📌 *ISLR* = James, Witten, Hastie & Tibshirani, *An Introduction to Statistical Learning*, freely
> available at [statlearning.com](https://www.statlearning.com).

Material and student projects from previous editions are in the [Archive](archive.md).
