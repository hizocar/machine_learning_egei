# 📋 Program — Machine Learning with Business Applications

<div class="usm-session-meta">
<span>🎓 5 ECTS</span>
<span>📍 Universidad Técnica Federico Santa María</span>
<span class="usm-tag-gold">Compulsory · GEME track</span>
</div>

## 1. Course identification

| | |
|---|---|
| **Course title** | Machine Learning — Business Applications |
| **Programme** | EGEI · Track GEME (Globalisation and Emerging Market Economies) |
| **ECTS** | 5 |
| **Prerequisites** | Applied Econometrics I and II |
| **Lecturer** | Sebastián Azócar M., MSc in Data Science |
| **Contact** | [hizocar@gmail.com](mailto:hizocar@gmail.com) |
| **Language** | English |
| **Tools** | Python · scikit-learn · an AI coding assistant of your choice |

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

## 4. Learning methods

Learning by doing. Each session mixes a short conceptual block with hands-on work on a notebook, and
students are expected to read the assigned material **before** class. A study load of at least three
hours per week outside the classroom is assumed. All assessed work is project-based.

## 5. Course contents

### A. Data and decision making
- Different types of data · data manipulation · from a business question to a dataset

### B. What is machine learning?
- **B.1 ML models:** what a model is · fitting a model · KNN · polynomial regression ·
  overfitting and underfitting (bias vs. variance) · the cost function · training and test error
- **B.2 The ML pipeline:** the bias–variance trade-off · cross-validation · applying the pipeline

### C. Classification
- **C.1 Logistic regression:** what classification is · technique and methodology · measuring model
  performance · the ROC curve
- **C.2 Generative models:** the naïve Bayes classifier · text classification · NLP application:
  measuring text sentiment

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

### G. Introduction to neural networks
- **G.1 Foundations:** the simple perceptron · structure of an ANN · methods
- **G.2 Implementation:** training the model · advantages, limitations and optimization

### H. Working with AI coding assistants *(transversal)*
- Prompting for code that is specific enough to be useful · reading and reviewing generated code ·
  testing before trusting · typical failure modes in data work (leakage, silent type coercion,
  fabricated APIs, wrong metric) · reproducibility · disclosure and academic honesty

> 📖 The full guide for this thread is on the [Code Assistants](code-assistants.md) page.

## 6. Assessment

All of the final grade comes from **two projects**. There are no written exams and no separate
in-class activities.

| Assessment | Weight | What it covers |
|---|---:|---|
| **Project 1** — supervised learning on a business problem | **40%** | Contents A, B and C |
| **Project 2** — end-to-end ML case, student-chosen data | **60%** | All contents, including D–G |
| **Total** | **100%** | |

Each project is delivered as a **reproducible notebook + short report + live presentation**, and
includes a mandatory **assistant log**: which tool you used, for what, and what you had to correct.
Full instructions, deadlines and the grading rubric are on the [Projects](projects.md) page.

```text
Final grade = 0.40 × Project 1 + 0.60 × Project 2
```

!!! warning "Assistant use: allowed, expected, and disclosed"
    Using an AI coding assistant is **permitted and encouraged** in both projects. Two rules apply:
    (1) **you must be able to explain every line you submit** — presentations include questions
    about your own code; (2) **you must disclose** what you delegated in the assistant log. Code you
    cannot explain is treated as code you did not write.

## 7. Readings

### Foundations
1. [Breiman, L. (2001). *Statistical Modeling: The Two Cultures.* Statistical Science, 16(3), 199-231.](http://users.csc.calpoly.edu/~dsun09/data401/readings/Breiman-Two-Cultures.pdf)
2. [Zhang (2018). *Data Types From A Machine Learning Perspective With Examples.*](https://towardsdatascience.com/data-types-from-a-machine-learning-perspective-with-examples-111ac679e8bc)
3. [Burgess, M. (2018). *This is how Netflix's secret recommendation system works.* Wired.](https://www.wired.co.uk/article/netflix-data-personalisation-watching)

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
