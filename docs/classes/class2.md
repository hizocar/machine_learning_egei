# Class 2 · Data Manipulation with pandas

<div class="usm-session-meta">
<span>📅 Friday 25 September 2026</span>
<span>⏱️ 13:00 – 16:00</span>
<span class="usm-tag-gold">Block A · Data</span>
<span class="usm-tag-red">🤖 Assistant skill: delegating wrangling</span>
</div>

!!! note "Next session"
    This is the session after the Fiestas Patrias break (no class on Friday 18 September). Bring
    your laptop with the environment from [Class 1](class1.md) working.

## 🎯 Objectives

- Load, inspect, clean, filter, join and aggregate data with `pandas`.
- Reshape a raw table into the tidy form a model expects: one row per observation, one column per variable.
- Delegate wrangling code to the assistant and **verify it** before keeping it.
- Recognise the three failure modes that cost the most time later: silent type coercion, lost rows in a join, and duplicated keys.

## 🗓️ Agenda (3 hours)

| Time | Block |
|---|---|
| 13:00 – 13:15 | Recap of Class 1 and homework questions |
| 13:15 – 14:15 | Core pandas: selection, filtering, `groupby`, joins, missing values |
| 14:15 – 14:30 | Break |
| 14:30 – 15:20 | **Lab:** wrangling a messy dataset with the assistant, verifying each step |
| 15:20 – 15:55 | Tidy data: from a raw export to a modelling table |
| 15:55 – 16:00 | Wrap-up and homework |

## 📖 Contents

### 1. The five operations you will use constantly

| Operation | pandas | The question it answers |
|---|---|---|
| **Select** | `df[['a','b']]` | Which variables do I need? |
| **Filter** | `df[df.a > 0]` | Which rows belong to my population? |
| **Aggregate** | `df.groupby('k').agg(...)` | What is the behaviour per customer / store / month? |
| **Join** | `df.merge(other, on='id', how='left')` | How do I bring in information from another table? |
| **Reshape** | `pivot_table`, `melt` | Is each row one observation? |

### 2. Tidy data: the shape a model expects

A modelling table has **one row per unit of analysis** (a customer, a transaction, a month) and one
column per variable, including exactly one target column. Most "the model does not work" problems are
really "the table is not tidy" problems.

### 3. The three expensive mistakes

| Mistake | How it shows up | How to catch it |
|---|---|---|
| **Silent type coercion** | A numeric column arrives as `object`; means and sums look wrong | `df.dtypes` after every load and merge |
| **Rows lost in a join** | The table shrinks and nobody notices | Compare `len(df)` before and after; use `how='left'` deliberately |
| **Duplicated keys** | The table *grows* after a join | `df['id'].duplicated().sum()` on both sides before merging |

> ⚠️ Assistants reproduce these three faithfully, because the code is syntactically perfect. The
> check is yours.

## 🧪 Lab: wrangling with the assistant

Work in pairs on the Class 2 notebook. For each step:

1. **Ask precisely.** Name the dataframe, the columns, the operation and the expected output.
2. **Read the generated code** before running it. If a line is unclear, ask for an explanation rather than running it blind.
3. **Verify** with the checklist: `df.shape`, `df.dtypes`, `df.isna().sum()`, and a spot check of 2–3 rows you can reason about.
4. **Log it**: note what you asked, what you kept and what you rejected. This is the habit that becomes the assistant log in your projects.

!!! example "A prompt for this lab"
    ```text
    I have a DataFrame `sales` with columns: order_id, customer_id, order_date (string),
    product, units (int), unit_price (float), region (categorical).

    1. Parse order_date to datetime and tell me how many rows fail to parse.
    2. Create revenue = units * unit_price.
    3. Build a customer-level table: one row per customer_id with total revenue, number of orders,
       first and last order date, and the most frequent region.
    Use pandas only. After each step, print the resulting shape and dtypes.
    ```
    The last sentence is not decoration: it is what turns the assistant's output into something you
    can verify.

## 📓 Notebook

[📓 Class 2 — Data Manipulation](../notebooks/class2.ipynb) ·
[![Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/class2.ipynb)

## ✍️ Homework

- [ ] [Lab 1 — Data manipulation](../homeworks/lab1.ipynb)
      ([Colab](https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/homeworks/lab1.ipynb)).
- [ ] Keep a short log of your assistant use while solving it — you will need the same format in Project 1.

## 📚 Next session

[Class 3](class3.md) (Friday 2 October) answers the question the whole course is built on:
**what is a machine learning model, and how do we know when it has learned something real?**
