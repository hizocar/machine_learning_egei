# Classes

One problem runs through the whole course: **predicting which households are poor from what we can
observe about them**, using Chile's CASEN survey (see [The Case](../case.md)). Each session answers
the next question that problem raises, and pairs a modelling topic with an **assistant skill**.

!!! info "Schedule"
    **Fridays, 13:00 – 16:00**, 11 September – 27 November 2026. No class on 18 September
    (Fiestas Patrias) or 16 October.

## Session plan

<div class="usm-plan" markdown>

| # | Date | The question | New methods | Assistant skill |
|---:|---|---|---|---|
| 1 | Fri 11 Sep ✅ | [What kind of data do we have?](class1.md) | Types of data · Python setup | The prompt-and-verify cycle |
| 2 | Fri 25 Sep ✅ | [How do we build one clean row per unit?](class2.md) | pandas: select, filter, group, join, reshape | Delegating wrangling; catching silent coercion |
| 3 | Fri 2 & 9 Oct ✅ | [Can we predict from data? How wrong are we?](class3.md) | Train/test · KNN · polynomial regression · bias–variance | Asking it to teach, not only to code |
| 4 | Fri 23 Oct ✅ | [Is the error we report honest?](class4.md) | Scaling · `Pipeline` · cross-validation · leakage | Auditing a pipeline for leakage |
| 5 | Fri 30 Oct | [Who is poor?](class5.md) · *Project released* | Logistic regression · confusion matrix · threshold · ROC/AUC · encoding | Choosing the metric instead of accepting the default |
| 6 | Fri 6 Nov | [Can a more flexible model find whom the logit misses?](class6.md) | Decision trees · bagging · random forests · boosting | Refactoring a script into functions |
| 7 | Fri 13 Nov | [Which variables do we really need?](class7.md) · *Checkpoint 1 due Thu 12 Nov* | Subset selection · LASSO · Ridge · Elastic Net | Debugging with the assistant instead of guessing |
| 8 | Fri 20 Nov | [What types of households are there, without labels?](class8.md) · project clinic | PCA · k-means · hierarchical clustering | Reviewing generated plots and their interpretation |
| 9 | Fri 27 Nov | [Final presentations](class9.md) · *Final delivery due Thu 26 Nov* | — | Defending your own code under questions |

</div>

!!! note "One rule behind this plan"
    Every session page lists its **✨ New today** tools. Nothing shows up in a session's code or
    lab before it appears in that list, in that session or an earlier one. If you find something
    that breaks the rule, tell us: it is a bug in the course.

### How a session is built

Every session page follows the same structure, so you always know where to look:

1. **❓ Today's question:** the next step in the case.
2. **🔁 What you already know:** links to the sessions it builds on.
3. **✨ New today:** the tools introduced, and nothing else.
4. **📖 Contents:** explanations with interactive figures built on the case data.
5. **🧪 Lab:** one notebook (Colab-ready) that reproduces every number on the page.
6. **🤖 Assistant skill:** a prompt to try and what to check in the answer.
7. **✅ Check your understanding:** short questions with worked answers.
8. **📝 Key takeaways**, **✍️ homework** and the question for the next session.

Each page also has a **✋ worked example by hand** (small enough to do on paper), a
**🎓 From econometrics to ML** box connecting the method to what you already know, and a table of
**⚠️ common mistakes**. Terms are collected in the [Glossary](../glossary.md).

### How a 3-hour session runs

| Time | Block |
|---|---|
| 13:00 – 13:15 | Recap and questions on the previous session |
| 13:15 – 14:10 | Concept block |
| 14:10 – 14:25 | Break |
| 14:25 – 15:35 | Hands-on lab, paired with your assistant |
| 15:35 – 16:00 | Project work and wrap-up |

### Key dates

| Milestone | Date |
|---|---|
| Project released | Friday 30 October |
| **Checkpoint 1** due (40%) | Thursday 12 November, 23:59 |
| Checkpoint 1 feedback | Friday 20 November, in class |
| **Final delivery** due (60%) | Thursday 26 November, 23:59 |
| Final presentations | Friday 27 November, in class |

## Homework

Homework is formative. It is not graded, but it is the fastest way to find out whether you have
understood a topic before it appears in the project.

| Homework | Topic | Notebook |
|---|---|---|
| **HW 1** | Python basics | [Open](../homeworks/Python_Basics_Homework.ipynb) · [Colab](https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/homeworks/Python_Basics_Homework.ipynb) |
| **Lab 1** | Data manipulation | [Open](../homeworks/lab1.ipynb) · [Colab](https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/homeworks/lab1.ipynb) |
| **Sessions 4–8** | Exercises at the end of each session notebook | See each session page |

!!! tip "How to use your assistant on homework"
    Do the exercise yourself first, then ask the assistant to review your solution and explain what
    it would do differently. Asking for the answer first is faster and teaches you nothing, and the
    project presentations include questions about your own code.
