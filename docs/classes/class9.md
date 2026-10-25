# Session 9 · Final Presentations and Closing

<div class="usm-session-meta">
<span>Friday 27 November 2026</span>
<span>13:00 – 16:00</span>
<span class="usm-tag-gold">Project · Final delivery</span>
<span class="usm-tag-red">60% of the final grade</span>
</div>

<div class="usm-actions usm-session-actions">
<a class="usm-primary" href="../../projects/">Project brief and rubric</a>
</div>

!!! warning "Deadline"
    The notebook, the report (max. 8 pages) and the assistant log are due on **Thursday
    26 November, 23:59**, by email with the subject `Project – Final – Group name`. Slides can be
    sent up to 12:00 on the day of the presentation. Details are on the [Project](../projects.md)
    page.

## ❓ Today's question

> You have built a model on a real problem. **Can you convince a decision-maker to use it, and
> defend every choice behind it?**

## 🗓️ Agenda (3 hours)

| Time | Block |
|---|---|
| 13:00 – 13:10 | Order of presentations (drawn at random) |
| 13:10 – 15:40 | Presentations: **12 minutes + 5 minutes of questions** per group, with a break halfway |
| 15:40 – 16:00 | Course closing |

## How to structure 12 minutes

A decision-maker remembers three things: the problem, what your model changes, and whether they
can trust it. A structure that works:

| Minutes | Slide(s) | What it must answer |
|---:|---|---|
| 1.5 | **The decision** | Who decides what with your prediction? What does each kind of error cost? |
| 1.5 | **The data** | Unit of analysis, rows, target, and what you would *not* have at prediction time |
| 3 | **The honest comparison** | Baseline vs. your models, same CV folds, mean ± spread. One table or one chart, not five |
| 2 | **The choice** | Which model you would deploy, and why: not only the highest score |
| 2.5 | **The recommendation** | What changes because of the model, quantified, with explicit assumptions |
| 1.5 | **Limits** | What would break in production, and what data you would need next |

!!! tip "One number per slide"
    If a slide needs a pointer to explain, it has too much on it. The chart that compares your
    models is the most important one in the talk; give it the most time.

## The questions you will be asked

Questions are about **your** code and **your** choices. Every member of the group must be able to
answer them. Expect questions like these:

- *Show me where you split the data. What happens to the test set after that line?*
- *Which steps are inside your pipeline? What would change if this one were outside?*
- *Why this metric, and why this threshold? What would a 1:1 cost ratio change?*
- *Pick one feature: would you really know its value when the decision is made?*
- *Your best model beats the baseline by X. Is that more than the spread across folds?*
- *What did the assistant get wrong, and how did you notice?* (from your assistant log)

!!! warning "Code you cannot explain is code you did not write"
    This is the core of the assessment. If a group member cannot explain a part of the notebook, that
    part counts as not done, whoever (or whatever) wrote it.

## ✅ Final checklist

- [ ] The notebook runs from top to bottom after *Restart & Run all*.
- [ ] The baseline appears next to every model score.
- [ ] Every model was compared on the same cross-validation folds; the test set was used once.
- [ ] The threshold (if classification) is justified with the costs of each error.
- [ ] The report states assumptions and limitations explicitly.
- [ ] The assistant log has real entries, including what you rejected or corrected.
- [ ] You responded to the Checkpoint 1 feedback, and the report says how.

## Course closing: what you can now do

Look back at the case. Starting from a survey file, you have:

| Session | You learned to… |
|---|---|
| 1–2 | Read a dataset by its types and turn it into one clean row per household |
| 3 | Fit a model, and see why fitting the training data says nothing |
| 4 | Report an error you can defend: pipelines, cross-validation, no leakage |
| 5 | Turn probabilities into decisions, and price each kind of mistake |
| 6 | Use flexible models (trees and ensembles), and weigh accuracy against explainability |
| 7 | Ask which variables are worth collecting, and shrink the rest |
| 8 | Find structure without labels, and use it to design policy |

Throughout, you wrote less code by hand than any cohort before you, and you had to **review** more
of it. That habit of verifying is the part that will not go out of date.

### Where to go next

- **Text and naïve Bayes**, and **neural networks**: ISLR chapters 4.4 and 10, at the same level as
  this course.
- **Causal machine learning**: when the question is "what is the effect of the programme?" rather
  than "who is poor?". Look for *double/debiased machine learning* (Chernozhukov et al., 2018).
- **Targeting in practice**: compare your proxy means test with the community-based and
  self-targeting approaches discussed in the development literature.

Thank you for a great term. 🎓
