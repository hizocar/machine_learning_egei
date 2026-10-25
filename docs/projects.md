---
hide:
  - navigation
---

<div class="usm-hero" markdown>
<div>
<h1>The Project</h1>
<p>One project, built over the second half of the course, in two deliveries, and 100% of the final grade. You do to a problem
of your choice what we do in class to the CASEN case: frame it, build an honest pipeline, compare
models and turn the result into a decision someone can act on. Each delivery includes the log of
what you delegated to your assistant and what you had to correct.</p>
</div>
</div>

## Overview

| | Checkpoint 1 | Final delivery |
|---|---|---|
| **Weight** | **40%** | **60%** |
| **Covers** | Sessions 1–5: framing, data, pipeline, a baseline and a linear/logistic model | Everything, including trees, shrinkage or unsupervised methods |
| **Deliver** | Notebook + memo (max. 3 pages) + assistant log | Notebook + report (max. 8 pages) + assistant log + presentation |
| **Due** | Thursday 12 November, 23:59 | Thursday 26 November, 23:59 |
| **Feedback / presented** | Written feedback, discussed in class on Friday 20 November | Presented on Friday 27 November (12 min + questions) |
| **Team** | Groups of 2–3, released on Friday 30 October (Session 5) | Same groups |

```text
Final grade = 0.40 × Checkpoint 1 + 0.60 × Final delivery
```

<div class="usm-cta" markdown>
<div class="usm-cta-text">
<strong>📧 How to submit</strong>
<span>Share the notebook (Colab link with view access, or the <code>.ipynb</code> file) and the document by email to <strong>hizocar@gmail.com</strong>, with the subject <code>Project – Checkpoint 1 – Group name</code> or <code>Project – Final – Group name</code>, before 23:59 on the due date.</span>
</div>
[✉️ hizocar@gmail.com](mailto:hizocar@gmail.com){.usm-btn}
</div>

## Choosing the problem

Your question must name **who decides what** with your prediction: a ministry that targets a
subsidy, a bank that approves a loan, a firm that tries to keep a customer. Two routes:

- **Your own dataset.** Public data is fine (Kaggle, UCI, the World Bank, open government data, the
  Banco Central de Chile…), but the question must be yours. At least ~1,000 rows and a clear target.
- **CASEN, with another target.** The [course data](case.md) has more questions in it than poverty:
  labour informality, public vs. private health insurance, overcrowding. Poverty and income are
  **not** allowed as targets, since we solve those in class.

Either way, write down early which variables you would really have **at prediction time**. Most
project disasters start there.

---

## Checkpoint 1: an honest first model

<div class="usm-deliverable" markdown>
<span class="usm-deliverable-badge">Checkpoint 1 · 40% of the final grade</span>

**Goal:** a framed problem, a clean dataset and a first model whose error you can defend.

**Instructions**

1. **Frame the problem.** The question, the target, the decision that changes, and the cost of each
   kind of mistake.
2. **Prepare the data.** One row per unit of analysis. Document every row you drop and every
   variable you transform, and what *missing* means for each column with missing values.
3. **Split first; baseline next.** A trivial model (the mean, or the majority class) that every
   later result is measured against.
4. **Build a pipeline.** Preprocessing inside a `Pipeline`, with linear or logistic regression and
   at least one KNN model, chosen by cross-validation.
5. **Evaluate with the right metric.** For classification, a confusion matrix and a threshold you
   justify with the costs from step 1.
6. **Leakage check.** One paragraph: which features did you remove or keep, and why each one would
   be available at prediction time.
7. **Assistant log** (see [Code Assistants](code-assistants.md#the-assistant-log-required-in-both-deliveries)).

**Grading rubric**

| Criterion | Weight |
|---|---:|
| Framing: the question, the target, the decision and the cost of each mistake | 20% |
| Data preparation, with documented choices (including missing values) | 20% |
| Pipeline and validation: split, baseline, CV, no leakage | 30% |
| Metric and threshold, read honestly | 20% |
| Clarity of the memo and the assistant log | 10% |

</div>

---

## Final delivery: compare, decide, defend

<div class="usm-deliverable" markdown>
<span class="usm-deliverable-badge">Final delivery · 60% of the final grade</span>

**Goal:** take the Checkpoint 1 project to a recommendation, using the full toolbox of the course
and the feedback you received.

**Instructions**

1. **Respond to the feedback** on Checkpoint 1: what you changed, and why.
2. **Apply at least three families of methods**: your Checkpoint 1 model, a tree-based ensemble
   (Session 6), and either shrinkage (Session 7) or an unsupervised step (Session 8).
3. **Compare them honestly** with cross-validation on the same splits, and explain the trade-offs:
   not only which one scored highest, but which one you would deploy and why.
4. **Interpret and recommend.** What should the decision-maker do differently because of this model?
   Quantify the expected effect, with explicit assumptions.
5. **State the limitations,** including what would break in production and what data you would
   need next.
6. **Assistant log.**

**Grading rubric**

| Criterion | Weight |
|---|---:|
| Response to feedback and quality of the final pipeline | 15% |
| Breadth and correctness of the methods applied | 25% |
| Honest comparison and model choice | 20% |
| Recommendation, quantified and with limitations | 20% |
| Presentation and defence of your own code | 20% |

</div>

---

!!! warning "A model you cannot explain is not a finished project"
    The final presentation includes questions about your own code and the choices behind it. The
    assistant can write the pipeline, but only you can justify it.
