<div class="usm-hero" markdown>
<div>
<span class="usm-hero-tag">100% of the final grade</span>
<h1>🎯 Projects</h1>
<p>Two end-to-end projects on real data. You deliver a reproducible notebook, a short report and a
live presentation — plus the log of what you delegated to your code assistant and what you had to
correct.</p>
</div>
</div>

## Overview

| | Project 1 | Project 2 |
|---|---|---|
| **Weight** | **40%** | **60%** |
| **Scope** | Supervised learning on a given business problem | End-to-end ML case on data you choose |
| **Covers** | Contents A, B, C | All contents, including D–G |
| **Team** | Groups of 2–3 | Same groups |
| **Delivery** | Notebook + report + presentation | Notebook + report + presentation |
| **When** | After Session 5 | Final sessions |

```text
Final grade = 0.40 × Project 1 + 0.60 × Project 2
```

<div class="usm-cta" markdown>
<div class="usm-cta-text">
<strong>📧 How to submit</strong>
<span>Share the notebook (Colab link with view access, or the <code>.ipynb</code> file) and the report by email to <strong>hizocar@gmail.com</strong>, with the subject <code>Project X – Group name</code>, before 23:59 on the due date.</span>
</div>
[✉️ hizocar@gmail.com](mailto:hizocar@gmail.com){.usm-btn}
</div>

---

## 📍 Project 1 — Prediction on a business problem

<div class="usm-deliverable" markdown>
<span class="usm-deliverable-badge">Project 1 · 40% of the final grade</span>

**Goal:** take a business question, turn it into a supervised learning problem, and answer it with a
model you can defend — including how you evaluated it and what it would mean to act on it.

**Instructions**

1. **Frame the problem.** State the business question, the target variable, and what decision would
   change because of the prediction.
2. **Prepare the data.** Load, clean and explore the dataset. Document every choice that removes or
   transforms rows.
3. **Build a baseline first.** A trivial model (majority class, or the mean) — every later result is
   measured against it.
4. **Fit at least two models** seen in Sessions 3–5, with a proper train/test split and
   cross-validation.
5. **Evaluate with the right metric** for the business problem, and justify why it is the right one.
   Include a confusion matrix if it is a classification task.
6. **Interpret.** Which variables drive the prediction, and does that make business sense?
7. **Write the assistant log** (see [Code Assistants](code-assistants.md#the-assistant-log-required-in-both-projects)).

**Deliverables**

- [ ] Reproducible notebook — runs top to bottom from a clean kernel.
- [ ] Report of **max. 4 pages**: problem, data, method, results, limitations.
- [ ] Assistant log (half a page).
- [ ] Presentation of **10 minutes** + questions.

**Grading rubric**

| Criterion | Weight |
|---|---:|
| Problem framing: the question, the target and the decision are clear | 20% |
| Data preparation and exploration, with documented choices | 20% |
| Modelling: correct train/test discipline, sensible model choice, baseline | 25% |
| Evaluation: right metric, honest reading of the results | 20% |
| Communication: report, presentation, and answers about your own code | 15% |

</div>

---

## 📍 Project 2 — End-to-end machine learning case

<div class="usm-deliverable" markdown>
<span class="usm-deliverable-badge">Project 2 · 60% of the final grade</span>

**Goal:** run a complete ML project on a dataset of your choice, from the business question to a
recommendation, using the full toolbox of the course.

**Instructions**

1. **Choose the case and the data.** Public datasets are fine (Kaggle, UCI, open government data);
   the business question must be your own. Propose it in class before you start.
2. **Explore and prepare** the data, including the treatment of missing values and categorical
   variables.
3. **Apply at least three families of methods** from the course — for example a linear or logistic
   model, a tree-based ensemble, and either shrinkage (LASSO/Ridge/Elastic Net) or an unsupervised
   step (PCA/clustering).
4. **Compare them honestly** with cross-validation, and explain the trade-offs — not only which one
   scored highest, but which one you would deploy and why.
5. **Interpret and recommend.** What should the business do differently because of this model?
   Quantify the expected effect, with explicit assumptions.
6. **State the limitations**, including what would break in production and what data you would need
   next.
7. **Write the assistant log.**

**Deliverables**

- [ ] Reproducible notebook — runs top to bottom from a clean kernel.
- [ ] Report of **max. 8 pages**.
- [ ] Assistant log (half a page).
- [ ] Presentation of **15 minutes** + questions.

**Grading rubric**

| Criterion | Weight |
|---|---:|
| Relevance and framing of the chosen case | 15% |
| Data preparation and exploratory analysis | 15% |
| Breadth and correctness of the methods applied | 25% |
| Honest comparison and model selection | 20% |
| Business recommendation, quantified and with limitations | 15% |
| Communication and defence of your own code | 10% |

</div>

---

## Reference

The [Final Project notebook](homeworks/Final%20Project.ipynb) from previous years is available as a
structural reference for the expected level of depth.

!!! warning "A model you cannot explain is not a finished project"
    Both presentations include questions about your own code and about the choices behind it. This
    is the core of the assessment: the assistant can write the pipeline, but only you can justify it.
