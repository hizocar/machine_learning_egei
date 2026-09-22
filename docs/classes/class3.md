# Class 3 · What Is Machine Learning?

<div class="usm-session-meta">
<span>📅 Friday 2 October 2026</span>
<span>⏱️ 13:00 – 16:00</span>
<span class="usm-tag-gold">Block B · Machine Learning Models</span>
<span class="usm-tag-red">🤖 Assistant skill: ask it to teach, not only to code</span>
</div>

## 🎯 Objectives

- Explain what a model is, what "fitting" means, and what a cost function measures.
- Fit your first models: **KNN** and **polynomial regression**.
- Read the bias–variance trade-off in a chart, and connect it to overfitting and underfitting.
- Distinguish **training error** from **test error**, and say why only one of them matters.
- Use the assistant as a tutor: ask it to explain a concept and then verify the explanation against the data.

## 🗓️ Agenda (3 hours)

| Time | Block |
|---|---|
| 13:00 – 13:15 | Recap of Class 2 and Lab 1 |
| 13:15 – 14:15 | What a model is · fitting · the cost function · KNN |
| 14:15 – 14:30 | Break |
| 14:30 – 15:20 | **Lab:** polynomial regression, from underfitting to overfitting |
| 15:20 – 15:55 | Training error vs. test error: the first honest evaluation |
| 15:55 – 16:00 | Wrap-up and homework |

## 📖 Contents

### 1. A model is a rule learned from examples

A model takes inputs **X** and produces a prediction **ŷ**. *Fitting* means choosing the rule's
parameters so that the predictions are as close as possible to the observed **y** — where "close" is
defined by a **cost function** (for regression, typically the mean squared error).

Nothing in that sentence guarantees the rule will work on data it has never seen. That is the whole
problem of the course.

### 2. KNN: the simplest useful predictor

K-nearest neighbours predicts a new case by looking at the *k* most similar cases in the training
data and averaging (or voting on) their outcomes. It has no equation to interpret, which makes it a
clean way to see the effect of one hyperparameter:

| k | Behaviour | Consequence |
|---:|---|---|
| **1** | Follows every point exactly | Memorises noise — overfitting |
| **moderate** | Smooths locally | Usually the sweet spot |
| **very large** | Predicts close to the global average | Ignores structure — underfitting |

### 3. Overfitting, underfitting and the bias–variance trade-off

- **Underfitting (high bias):** the model is too rigid to capture the pattern. Training error is high and test error is high.
- **Overfitting (high variance):** the model captures the noise as if it were signal. Training error is very low and test error is high.

The polynomial regression lab makes this visible: as the degree grows, the fitted curve bends to
touch every point, training error falls towards zero — and test error turns upwards.

> 💡 **The rule to remember:** a model that fits the training data perfectly has told you nothing.
> The only number that carries information is the error on data the model has not seen.

### 4. Training error vs. test error

We split the data before fitting, and we report the test error. Today this is a simple hold-out
split; in [Class 4](class4.md) we replace it with cross-validation and go hunting for the ways this
discipline quietly breaks.

## 🧪 Lab: from underfitting to overfitting

In the Class 3 notebook, fit polynomials of increasing degree to the same data and plot training and
test error against the degree. Identify the degree at which test error stops improving.

!!! example "Use the assistant as a tutor"
    ```text
    Explain, in five lines and without formulas, why the training error of a polynomial regression
    keeps falling as the degree increases while the test error eventually rises.
    Then give me the scikit-learn code to reproduce that with a train/test split, and plot both
    curves against the polynomial degree.
    Finally: name two things about this plot that could mislead me.
    ```
    The last line is the one that matters. An assistant that is asked for the weaknesses of its own
    output is far more useful than one asked only for code.

**Verify before keeping:** was the split made *before* fitting? Is the same scaling applied to both
sets? Is `random_state` fixed so the plot is reproducible?

## 📓 Notebook

[📓 Class 3 — Machine Learning Models](../notebooks/class3.ipynb) ·
[![Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/class3.ipynb)

## ✍️ Homework

- [ ] Finish the polynomial experiment and write **three lines** explaining which degree you would choose and why.
- [ ] Read ISLR sections 2.1–2.2, or Koehrsen (2018), *Overfitting vs. Underfitting* — both listed in the [Program](../program.md#7-readings).

## 📚 Next session

[Class 4](class4.md) (Friday 9 October) turns today's single split into a proper **machine learning
pipeline** with cross-validation — and **Project 1 is released**.
