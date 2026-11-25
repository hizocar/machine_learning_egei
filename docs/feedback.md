---
hide:
  - navigation
---

<div class="usm-hero" markdown>
<div>
<h1>Grades and Feedback</h1>
<p>Your score on each project delivery, criterion by criterion, with what to improve for the next
one. Find your name and press <strong>Reveal</strong>.</p>
</div>
</div>

## Final delivery · pre-feedback

Feedback on the drafts sent before the final deadline (**Thursday 26 November, 23:59**). It is not
a grade. Each review is ordered by impact: start with **Fix before you submit**, then **Improve if
time allows**. It maps to the [final delivery
rubric](projects.md#final-delivery-compare-decide-defend).

<details class="fb-card" markdown>
<summary><span class="fb-name">Pamina</span><span class="fb-btn">Reveal</span></summary>

**Project:** Targeting alcohol-prevention outreach in Germany (ESS Round 11) under a fixed budget of
100 contacts.

This is feedback on your draft, not a grade. It is ordered by what moves your final grade most, and
it is sized for the time left before the deadline (Thu 26 Nov, 23:59). *Cell numbers count from the
top of your notebook, starting at 1.*

#### Big picture

You responded to the Checkpoint 1 feedback thoroughly, and the change log (cell 56) shows it.

- The decision rule is now coherent: a fixed budget, ranking, then precision@100 and recall@100.
- Random targeting is the honest baseline.
- The demographic-only model directly tests whether more data is worth collecting.
- Every comparison now runs on out-of-fold predictions with one shared `cv` object.
- The test set is used once, and you state the Checkpoint 1 caveat.

That is the right skeleton. What is left is mostly about **how much your differences can be
trusted** and **turning the result into a recommendation with numbers**.

| Final rubric criterion | Where you stand | Main gap |
|---|---|---|
| Response to feedback and final pipeline (15) | Strong | — |
| Breadth and correctness of methods (25) | Good | Random forest not tuned; LASSO only at one C |
| Honest comparison and model choice (20) | Needs work | KNN chosen on a 2-hit difference you yourself call noise |
| Recommendation, quantified, limitations (20) | Needs work | "440 per 1,000" extrapolation is not valid as stated; no cost or benefit figure |
| Presentation and defence (20) | — | See the last section |

#### Fix before you submit

##### 1. Your model choice contradicts your own reading of the results

Cell 51 says the differences between models are "almost negligible and may reflect sampling
variation", and then picks KNN because it found 44 hits against LASSO's 43 and the logit's 42.
Both statements cannot be true at once. A quick sense of the noise: with 100 contacts and a hit
rate around 42%, the standard error is √(0.42 × 0.58 / 100) ≈ 0.05. That is **about ±10 hits** for
a 95% interval. A 2-hit gap is well inside it.

**What to do:**

- **Show the noise.** Compute precision@k inside each fold (the top 20 of each of the 5 folds)
    and report the mean and standard deviation per model. Alternatively, bootstrap the
    out-of-fold predictions about 1,000 times. Either way, put an interval next to each number in
    the comparison table (cell 49).
- **Then choose on the tie-breakers that matter to a ministry:** interpretability, the data it
    needs and stability. That points to the **logistic regression**, or even the
    **demographic-only model**, not KNN. KNN also has the *lowest* AUC of the full models (0.598)
    and cannot explain why someone was selected. That is awkward for a programme that must avoid
    stigma, a point you raise yourself in cell 54.
- **Check KNN for ties.** With k = 200, KNN probabilities can only take values in steps of
    1/200 = 0.005, so many people near the top-100 cut-off share the same score, and `argsort`
    breaks those ties arbitrarily. Run `np.sort(p_knn)[-110:]` to see how many tied values sit
    around position 100. If many are tied, the "44" partly depends on row order.
- **Note the metric mismatch.** k was chosen by AUC (cell 33) but the model is judged by
    precision@100. One sentence is enough; optionally, choose k by precision@100.

##### 2. The "per 1,000 contacts" extrapolation (cell 54) needs its condition

"KNN would identify approximately 440 frequent binge drinkers per 1,000 contacts" holds only if
those 1,000 contacts are still the **top 5.5%** of the population, the same share as 100 out of
1,802 in your training set. That would mean screening about 18,000 people. If the ministry
contacts more people from the same population, precision falls, because you go further down the
ranking. Your test evaluation already gets this right: 33 contacts out of 601 keeps the same 5.5%
share (cell 53).

**What to do:** state the budget as a share ("we contact the top 5.5% of screened adults"), and
show precision at a few shares (5%, 10%, 20%) on the out-of-fold predictions. A small table or a
curve of precision vs. share contacted is enough. That tells the ministry what happens if the
budget grows.

##### 3. Quantify the recommendation

The final rubric asks for the *expected effect with explicit assumptions*. Right now the
recommendation stops at "hits per 100 contacts". Add one back-of-the-envelope paragraph:

> Per 1,000 contacts at the top 5.5%: N_model frequent binge drinkers reached vs. about 300 at
> random → (N_model − 300) extra people reached. If outreach costs €X per person and prevention
> avoids €Y of later costs per frequent drinker reached, with effectiveness e, the net gain is
> (N_model − 300) × e × Y − 1,000 × X.

Use explicit placeholders with a source for each one, even rough ones (your Sacks et al. reference
can anchor Y). Then compare the full model with the demographic-only model in the same units.
"Collecting six more variables buys about 50 extra people per 1,000" (cell 54) is the right
question; give it a euro value, or the break-even cost of collecting those variables.

#### Improve if time allows

##### 4. Tune the random forest (cell 42)

The forest uses fixed settings (`min_samples_leaf=5`, `n_estimators=300`). Session 6 tunes the
tree-size parameters with cross-validation. A small `GridSearchCV` over
`min_samples_leaf ∈ {5, 20, 50}` and `max_depth ∈ {None, 5, 10}` with your `cv` takes minutes and
closes the "was the forest given a fair chance?" question. A forest with leaves of 5 on 1,800
noisy survey rows is likely to overfit. Larger leaves will probably help.

##### 5. Show the LASSO path, not only the CV optimum (cells 45–47)

At the CV-best C = 1.0 the penalty is weak, so it is not surprising that every original variable
survives. Your question was *can the ministry collect fewer variables?* To answer it, run the path
as in Session 7: for C in `np.logspace(-3, 0, 8)`, record the CV precision@100 (or AUC) **and how
many of the 8 original variables keep at least one non-zero coefficient**. Then you can say "with
4 variables we keep X% of the performance", which links directly to your demographic-only
comparison.

##### 6. Give age a fair shape in the demographic-only model (cell 39)

Age enters the logit as a straight line, but binge drinking is typically highest among young
adults and falls with age. That pattern is not linear in the log-odds. Use age bands (for example
18–29, 30–44, 45–64, 65+) or add age². If the demographic-only model improves, your conclusion
"age and gender get you most of the way" gets stronger.

##### 7. Interpret what drives the risk

Use the LASSO or logistic coefficients (cell 46) for a short paragraph on who is flagged. For
example: living on a farm or in the countryside raises the risk, being female lowers it, and so
does being widowed. Say that these are associations, not causes. This answers the "interpret"
part of the brief and helps you defend the targeting rule ethically.

##### 8. Limitations: what would break in production

Your limitations paragraph (cell 54) covers self-reporting and generalisation. Add:

- the ministry does not hold survey answers, so which **administrative sources** would supply age,
    gender, income and marital status;
- the ESS fieldwork is from 2023–24 and behaviour shifts;
- the **ethical constraint**: a model flagging people by gender, marital status or income for
    "alcohol risk" needs a careful outreach design. You mention it; make it a concrete design rule.

#### Small fixes

- Remove the leftover notes in cells 22 and 29 ("Because of the pre in the cell above…"). They
    refer to an earlier version of the notebook.
- Cell 54: the sentence with parentheses "(precision@33) … (test set) … 44 (13)" is hard to read.
    Split it into one sentence for the CV result and one for the test result.
- "may be a reasonable alternatives" → "alternative".
- Report the random baseline's recall@100 the same way in cell 24 and cell 49 (the two cells
    compute it with different formulas, even though the values agree).

#### Before you submit and present

- **Deliverables:** the brief asks for the notebook **plus a report (max. 8 pages)**, the
    assistant log and slides for the presentation on Friday. Your notebook already reads like a
    report. Make sure the PDF report exists and tells the story without the code.
- **Run Restart and run all** and check that every number quoted in the text matches a printed
    output.
- **Defence (20%):** be ready to explain without notes why precision@100 rather than AUC, why the
    random baseline is about 30, what `cross_val_predict` returns, and why you did not choose the
    model on the test set.

</details>

<details class="fb-card" markdown>
<summary><span class="fb-name">Sofía</span><span class="fb-btn">Reveal</span></summary>

**Project:** Which households should an ISAPRE call? Predicting ISAPRE vs. FONASA coverage with
CASEN to attract clients of competing ISAPREs.

This is feedback on your draft, not a grade. It is ordered by what moves your final grade most, and
it is sized for the time left before the deadline (Thu 26 Nov, 23:59). *Cell numbers count from the
top of your notebook, starting at 1.*

#### Big picture

This is a very strong draft, and it responds to every point of the Checkpoint 1 feedback.

- The decision is now coherent (option a: poaching from competitors), with the value of a call
    built from explicit figures.
- The threshold comes from the costs and is checked against calibration and out-of-fold profit.
- The sensitivity to the conversion rate is the right way to handle your weakest assumption.
- Gradient boosting is compared fold by fold and correctly read as a tie.
- LASSO answers a real business question (how short the form can be), and the location-only model
    turns a leakage assumption into a measured result.
- The test set is used once, with the caveat stated.

What is left is mostly **interpretation, a few unsupported numbers, and polish**.

| Final rubric criterion | Where you stand | Main gap |
|---|---|---|
| Response to feedback and final pipeline (15) | Strong | — |
| Breadth and correctness of methods (25) | Strong | The short-form result is measured with the shrunk model, not refitted |
| Honest comparison and model choice (20) | Strong | Model chosen in cell 31, before the comparison |
| Recommendation, quantified, limitations (20) | Good | No interpretation of *who* gets called; sources for the money figures |
| Presentation and defence (20) | — | See the last section |

#### Fix before you submit

##### 1. Interpret the final model: who gets called?

The brief asks you to **interpret and recommend**. The notebook never shows what drives the
prediction. Add a short table of the 10 largest logistic regression coefficients as **odds ratios**
(`np.exp(coef_)`), with feature names from `get_feature_names_out()`, and one paragraph in plain
words. Your LASSO path already hints at the answer:

- years of schooling of the head;
- living in an apartment rather than a house;
- the Metropolitan Region;
- weekly hours worked.

Say that these are associations, not causes, and that because C = 100 the model is almost
unregularised. If two encoded columns of the same variable carry opposite signs, explain why. This
also prepares you for the "why did the model call this household?" question in the defence.

##### 2. Every money figure needs a source (cell 1)

Your profit chain multiplies four numbers, and each one changes the threshold:

- **CLP 240,103 per month:** per household, or per contributor (cotizante)? Name the source, for
    example the Superintendencia de Salud statistical bulletin, and its year.
- **"About 11% remains after health care and sick-leave costs":** source, or call it an
    assumption.
- **23% market share "similar to the market leader":** source.
- **CLP 2,000 per call:** you already flag it as your estimate. Good.

Then add one sentence on the time horizon. You value a new client at **one year** of margin, which
is conservative if clients stay several years. Say so, because it means your threshold is, if
anything, too strict.

##### 3. Move the model choice to after the comparison

Cell 31 ends with "Logistic regression performs better … so we select it as our final model". That
is *before* gradient boosting, LASSO and the comparison in cell 43, where the real choice is made.
Delete that sentence, or turn it into "logistic regression beats KNN". A reader should see the
decision once, after all the evidence.

#### Improve if time allows

##### 4. Refit the short form instead of reading the shrunk model (cells 36–38)

The ROC AUC values in the LASSO path (0.83 for 2 variables, 0.881 for 13) are those of the
**penalised** model. With a strong penalty the remaining coefficients are also shrunk toward zero,
which understates what a short form can do. For the form-length question, use LASSO only to
**select** the questions, then refit a plain logistic regression on the selected original
variables, cross-validated on the same `cv`. The 13-question form will probably lose less than
the 7% of profit you report (cell 44), which makes your "shorter form" option more attractive. The
comparison table already has a row for it, so just replace it.

##### 5. Express the profit on a scale a manager can use

"CLP 6.78 million" on the out-of-fold training set and "CLP 1.73 million" on the test set describe
lists of 11,433 and 2,859 households. That reads as if the model earned less on the test set. Put
everything **per 1,000 households screened** (and per 1,000 calls, as you already do in cell 53).
Then the out-of-fold and test numbers can be compared directly, and they are close, which
supports your generalisation claim.

##### 6. Survey weights in the evaluation

You explain well why the real call list has more ISAPRE households (17.5% weighted vs. 10.8%).
Two cheap upgrades:

- Report the test profit **weighted** by `survey_weight`. Most metrics accept `sample_weight`, and
    the profit can be computed as a weighted sum. This estimates profit on a population-like list.
- In the limitations, name the standard fix for a different base rate: adjust the predicted odds
    by the ratio of the prior odds (prior-shift correction), or recalibrate on a pilot.

##### 7. Notebook structure

- Use one heading level for sections. "LASSO" (cell 35) and "Model Comparisson" (cell 42) are `#`
    while the others are `##`. Also fix the typo: *Comparison*.
- Cell 43 redefines the cost parameters that cell 49 defines again. Define them once, near the
    top, next to the introduction that explains them.
- Two rows of the assistant log have an empty last column (LASSO and Recommendation). Fill them.
    What did you check or change in the draft recommendation? Also fix "sugested".

#### Before you submit and present

- **Deliverables:** the brief asks for the notebook **plus a report (max. 8 pages)**, the
    assistant log and slides for the presentation on Friday. Your recommendation section is
    almost the report already. Make sure the PDF exists and reads without the code.
- **Run Restart and run all** once more and check every quoted number against its output.
- **Defence (20%):** your log is honest that an assistant reorganised the notebook and wrote parts
    of the code (for example the `feature_mapping` loop in cell 36). Expect questions on exactly
    those parts. Be ready to explain, without notes:
    - why the threshold is call cost / V;
    - what the calibration table shows;
    - why gradient boosting is a tie and not a win;
    - why LASSO drops `head_activity` but keeps `head_job_type`;
    - why the test result is "slightly optimistic".

</details>

## Checkpoint 1

Scores follow the [Checkpoint 1 rubric](projects.md#checkpoint-1-an-honest-first-model)
(framing 20 · data 20 · pipeline 30 · metric 20 · clarity 10). The **Priorities for the final
delivery** list is the part to act on: your final report must say how you responded to it.
Questions? Bring them to the project clinic on Friday 20 November.


<details class="fb-card" markdown>
<summary><span class="fb-name">Pamina</span><span class="fb-btn">Reveal</span></summary>

**Project:** Can machine learning improve the targeting of alcohol-prevention programmes in Germany?
(ESS Round 11, 2,403 respondents, target = frequent binge drinking.)

<div class="fb-score"><span class="fb-score-num">88</span><span class="fb-score-den">/ 100</span></div>

| Criterion | Weight | Points | In one line |
|---|---:|---:|---|
| Framing: question, target, decision, cost of each mistake | 20 | **17** | Clear decision and cost ratio. The "fixed budget of 100" plan and the threshold rule are two different decisions. |
| Data preparation, documented (incl. missing values) | 20 | **18** | A codebook-based missing-value table, the best in the group. Survey weights and the "frequent" cut-off need one line each. |
| Pipeline and validation: split, baseline, CV, no leakage | 30 | **26** | Threshold chosen on out-of-fold predictions, exactly right. The test set was used more than once (−3). |
| Metric and threshold, read honestly | 20 | **18** | The most honest reading in the group. Make "target everyone" the baseline your model has to beat. |
| Clarity of the memo and the assistant log | 10 | **9** | Clear prose and a log with real rejections. |

*Cell numbers count from the top of your notebook, starting at 1.*

#### What already works

- **The decision is real and the costs are explicit.** A government chooses whom to contact, you
    name both errors (wasted outreach and stigma vs. missed prevention), and you fix FN = 3 × FP before
    modelling. You also say clearly that the model is not causal (cell 1).
- **The target is built with care.** Abstainers are coded 0 from `alcfreq`, not dropped, and only
    the 17 true non-responses are removed, with the reason given (cells 9–10, 16).
- **Missing values are explained from the codebook.** Refusals, "don't know" and not-applicable are
    told apart. A separate *missing* category for income (246 rows, 10%) is the right call, because
    refusing to report income is itself informative (cell 16).
- **The threshold is chosen correctly.** You chose it from `cross_val_predict` on the training data
    (cells 32–33), which is the method the course asks for.
- **You admitted the test-set slip and limited what you claim because of it** (cells 34 and 45). That is exactly the
    professional habit we want.

#### Criterion by criterion

##### Framing · 17/20

- **Pick one decision rule.** Cell 1 promises a *fixed budget of 100 people* judged by recall. With
    a fixed budget the threshold no longer matters: you rank everyone by predicted risk and contact
    the top 100. The right metrics are then **precision@100 and recall@100**, and the threshold
    analysis answers a different question ("whom would we contact if the budget were free?"). Both
    are legitimate. Say which one the ministry faces, or show both and explain when each applies.
- **Back the 3:1 ratio with numbers.** Sacks et al. (2015) estimate the total cost of excessive
    drinking. That is not the cost of *missing one person* relative to *contacting one person*. A
    back-of-the-envelope version is enough: outreach per person ≈ €X; a missed case costs
    (treatment cost avoided) × (probability that prevention works) ≈ €Y; ratio ≈ Y/X. Then the 3 is
    an assumption a reader can disagree with, instead of a number that comes from nowhere.

##### Data preparation · 18/20

- **Justify "monthly or more" as *frequent*.** It is a defensible choice, close to the WHO
    definition of heavy episodic drinking (at least monthly). Say so in one line with the source,
    because the target definition drives everything else.
- **Survey weights.** The 29.9% prevalence is unweighted. That is fine for training a classifier,
    but say it explicitly, and use the ESS weights (`anweight`) whenever you state a share of
    *German adults*.
- **`sclmeet` is in your extract but never discussed.** Social-meeting frequency could well
    predict binge drinking. Would a ministry have it at prediction time? Probably not, and that is
    the reason to exclude it. Write that reason down, as you did for the alcohol variables.

##### Pipeline and validation · 26/30

- **Test set used more than once (−3).** Cell 30 scores the model on the test set at 0.5 before
    the threshold is chosen, and the extra tuning you describe in cell 34 also touched it. See
    *One rule for everyone* below.
- **The threshold grid is coarse.** You tried six values. Use something like
    `np.linspace(0.05, 0.6, 56)`. Also add a sanity check: with FN = 3 and FP = 1 the cost-minimising
    threshold for calibrated probabilities is 1 / (1 + 3) = **0.25**. Your cross-validation found
    exactly 0.25. Say that, because it shows theory and data agree.
- **The KNN search is well done.** The grid goes wide enough (1 to 500) to show the curve flatten,
    and you read k = 200 correctly as a sign that the features carry little local structure.

##### Metric and threshold · 18/20

- **Make your best finding the headline.** Cell 45 notes that targeting *everyone* costs 421
    against your model's 403. That is the key result. When the prevalence (30%) is above the cost
    threshold (25%), the cheapest trivial policy is not "contact nobody", it is **"contact
    everyone"**. That is the baseline your model has to beat. On your own training out-of-fold
    numbers, "everyone" costs 1,263 (all 1,263 non-drinkers contacted) and your best rule costs
    1,158, about **8% cheaper**. On the test set the saving is about 4%. Report it that way.
- **Call the model comparison a tie.** The AUCs are 0.605 vs. 0.598 (cell 42), and the KNN AUC
    varies by about ±0.02 across folds (cell 36). That difference is within noise. "Logistic
    regression is preferred because it is simpler and equally good" is the honest version.
- **Narrow the conclusion.** "Socioeconomic and demographic characteristics cannot reliably
    predict binge drinking" (cell 43) should say *these eight variables*. Other observable variables
    might do better.

##### Clarity and assistant log · 9/10

- The log has real rejections and corrections, including the test-set slip. Keep that standard.
- Fix one unclear row: "I initially kept preprocessing inside the pipeline". Did you keep it there,
    or move it later?

#### Priorities for the final delivery (due Thu 26 Nov)

1. **Freeze the test set** and redo every comparison on out-of-fold predictions (see below). This
     feeds the final criterion *Response to feedback and quality of the final pipeline*.
2. **Settle the decision rule.** Your three strategies are an excellent design: random,
     demographic-only (age + gender) and full model, with 100 contacts each. Evaluate them with
     **precision@100 / recall@100** on out-of-fold predictions. Random gives about 30 hits per 100;
     how many does each model give?
3. **Three families of methods:**
     - your logistic regression;
     - a **random forest or gradient boosting** (Session 6), which can pick up interactions such as
         age × gender × activity that a logit misses;
     - **LASSO** (Session 7), which answers "do we need all eight variables, or are age and gender
         enough?". That is exactly your strategy 2 vs. strategy 3 question.
4. **Quantify the recommendation.** For example: "per 1,000 contacts the model reaches N frequent
     binge drinkers vs. 300 at random, saving €Z under assumptions A, B, C".
5. **Limitations.** Drinking is self-reported, there is a gap between survey and register data,
     and income and employment may not be available to the ministry.

</details>


<details class="fb-card" markdown>
<summary><span class="fb-name">Sofía</span><span class="fb-btn">Reveal</span></summary>

**Project:** Which households should an ISAPRE call? Predicting private health insurance (ISAPRE
vs. FONASA) with CASEN (14,292 households).

<div class="fb-score"><span class="fb-score-num">83</span><span class="fb-score-den">/ 100</span></div>

| Criterion | Weight | Points | In one line |
|---|---:|---:|---|
| Framing: question, target, decision, cost of each mistake | 20 | **16** | Clear decision-maker and costs. But under your own story the *false positives* are the households worth calling. |
| Data preparation, documented (incl. missing values) | 20 | **18** | Excellent "not applicable vs. unknown" reasoning. Weights and the dropped insurance groups need a line. |
| Pipeline and validation: split, baseline, CV, no leakage | 30 | **26** | Clean pipeline and a grid extended past its edge. The test set was used more than once (−3), and cells ran out of order. |
| Metric and threshold, read honestly | 20 | **15** | Good cost reasoning, but the reported cost (762) does not match the printed threshold (0.143 → 783), and the sensitivity analysis has no code. |
| Clarity of the memo and the assistant log | 10 | **8** | The best assistant log in the group. The notebook has leftovers. |

*Cell numbers count from the top of your notebook, starting at 1.*

#### What already works

- **The target is one the brief explicitly allows** (public vs. private health insurance), and the
    decision-maker is concrete: an ISAPRE deciding whom to call (cell 5).
- **Missing values are reasoned, not just filled.** You saw that `head_job_type` and
    `head_weekly_hours` are missing *because the head does not work*. That is "not applicable", not
    "unknown". You also explained why a row-level rule can go before the split while a median must
    go inside the pipeline (cells 11–12). This is exactly the distinction Session 4 is about.
- **The leakage paragraph is the strongest in the group** (cell 29). Income and `poor` are dropped
    because an ISAPRE would not know them before calling, every kept variable is justified by how it
    could be obtained, and you say what would change if only location data were available.
- **Good validation reflexes.** The best k = 101 sat at the edge of the grid, so you extended the
    grid (cell 22). And you did not oversell C = 10 against C = 1 (a 0.0001 difference).
- **The threshold comes from the costs,** with the formula 1/(1 + 6) written out (cell 25).

#### Criterion by criterion

##### Framing · 16/20

- **Who exactly is worth a call?** Target = 1 means the household *already has* ISAPRE. In your
    confusion matrix at 0.143 (cell 26):
    - The **244 true positives** are households that are already privately insured, possibly by
        this ISAPRE.
    - The **399 false positives** are FONASA households that *look like* ISAPRE clients. Under the
        story in cell 5 ("call those whose profile looks like that of its current clients"), they are
        the leads.

    So in your decision, the "mistake" is the product. Choose one of two stories and rewrite the
    costs to match:

    - **(a) Poaching from competing ISAPREs:** true positives are the prospects. Then you need to
        know which ISAPRE they use, or assume a share.
    - **(b) A look-alike model to convert FONASA households:** predicted positives among FONASA
        households are the leads. The value of a call is then
        (conversion rate) × (margin of a client), and "false positive" no longer means "wasted call".

    This is the single most important fix for the final delivery.

- **Argue the 6:1 ratio.** "Losing a client costs six calls" needs a reason. A rough figure is
    enough: the cost of a call in CLP and the expected margin of a new client over a year.

##### Data preparation · 18/20

- **The groups you dropped will still be on the call list.** You removed 708 households (armed
    forces, none, other, missing) (cell 9). That is fine for defining the target, but a real call
    list will include them. Say how the model would treat them, or why they can be excluded before
    calling.
- **Survey weights.** The 10.8% ISAPRE share is unweighted. CASEN's `survey_weight` turns it into
    a population share. Mention it whenever you talk about "households in Chile".
- **Overlapping variables.** `head_activity` and the new `head_job_type = not_working` carry
    overlapping information. That is harmless for the logit, but worth a line, and it matters for
    LASSO in Session 7.

##### Pipeline and validation · 26/30

- **Test set used more than once (−3).**
    - Cell 26 evaluates two thresholds on the test set.
    - The cost of 762 in cell 27 is the cost at threshold **0.15**, which is not in any printed
        output, so it came from another run.
    - The sensitivity analysis in cell 28 compares thresholds *on the test set*.

    Cell 29 then says "the test set was used only once". Fix the procedure and the sentence (see
    below).

- **Check the theoretical threshold with cross-validation.** 1/(1 + c) is the optimal threshold
    only if the predicted probabilities are calibrated. Check it on out-of-fold predictions:
    `cross_val_predict(final_model, X_train, y_train, cv=cv, method="predict_proba")`, then the
    cost for each threshold on a fine grid. A quick reproduction of your pipeline gives a
    CV-optimal threshold of about **0.14**, which agrees with the formula. Put that confirmation in
    the notebook.
- **Notebook hygiene.**
    - The execution counts skip 12, 15, 17 and 21, so cells were re-run out of order.
    - Cell 15 repeats the whole preparation from scratch.
    - Cell 24 is empty.

    Run **Restart and run all**, and keep one clean path from loading the data to the result.

##### Metric and threshold · 15/20

- **Every number in the text must come from a printed cell.** The printed matrix at 0.143 (cell
    26) has FP = 399 and FN = 64, so the cost is 399 + 6 × 64 = **783**, not 762. Cell 27 says the
    threshold was "rounded to 0.15", while the code uses 0.143 and the log says you changed it to
    0.14. Pick one threshold, print its matrix, and quote that.
- **Show the sensitivity analysis as code and output.** The idea in cell 28 is excellent (ratios
    2 / 6 / 10 → thresholds 0.33 / 0.14 / 0.09), but there is no code, so a reader cannot check it.
    Do it on out-of-fold predictions and show it as a small table, or as one cost-vs-threshold curve
    per ratio.
- **Translate precision into calls.** 38% precision means about 2.6 calls per ISAPRE-type
    household found, against about 9.3 calls at random (10.8%). Managers think in calls, not in
    precision.

##### Clarity and assistant log · 8/10

- **The log is the best in the group** (cell 30). It names concrete errors you caught: the
    duplicated target, the wrong denominator in the missing-value table, k at the edge of the grid,
    and the assistant ignoring your instructions.
- **Clean up the notebook:**
    - "texto en negrita" is left over at the end of cell 5.
    - Cell 25 mixes Spanish into the English text ("Entonces el umbral se calcula así", "umbral").
    - Typos: *woth*, *loosing*, *costumer*.
    - The introduction appears after four code cells. Put the framing first.

#### Priorities for the final delivery (due Thu 26 Nov)

1. **Rewrite the decision** following option (a) or (b) above, and redo the cost table so that
     "mistake" means what it should.
2. **Freeze the test set.** Move the threshold choice and the sensitivity analysis to out-of-fold
     predictions, with code, and correct the "used only once" sentence.
3. **Three families of methods:**
     - your logistic regression;
     - a **random forest or gradient boosting** (Session 6), which may capture interactions such as
         region × education × tenure;
     - **LASSO** (Session 7), framed as "how short can the contact form be?". Compare the full model
         with a location-and-dwelling-only model, the scenario you raised yourself in cell 29.
4. **Quantify the recommendation.** For example: "per 1,000 calls, the model reaches N leads vs.
     108 at random; at conversion rate r and margin m, that is CLP Z", with the assumptions
     stated.
5. **A clean, re-runnable notebook,** with the framing first and every quoted number printed.

</details>


<details class="fb-card" markdown>
<summary><span class="fb-name">Vakarė</span><span class="fb-btn">Reveal</span></summary>

**Project:** Who should get a mailed reminder for heating assistance? Predicting infrequent internet
use in Estonia, Latvia and Lithuania (ESS Round 11, 3,748 adults).

<div class="fb-score"><span class="fb-score-num">82</span><span class="fb-score-den">/ 100</span></div>

| Criterion | Weight | Points | In one line |
|---|---:|---:|---|
| Framing: question, target, decision, cost of each mistake | 20 | **16** | An original, concrete decision. The 3:1 cost ratio appears late and unargued, and `country` does not fit a single municipality. |
| Data preparation, documented (incl. missing values) | 20 | **18** | The best sample-flow and missing-code tables in the group. The imputation choice is not justified. |
| Pipeline and validation: split, baseline, CV, no leakage | 30 | **24** | Correct pipeline and cutoffs from out-of-fold predictions. k = 31 sits at the edge of the grid, the test set was used more than once (−3), and the data path is hard-coded. |
| Metric and threshold, read honestly | 20 | **17** | Excellent decision language (letters sent, users reached). A 2-point cost gap is a tie. |
| Clarity of the memo and the assistant log | 10 | **7** | Very clear prose. The assistant log has no rejections. |

*Cell numbers count from the top of your notebook, starting at 1.*

#### What already works

- **The decision is original and concrete.** A municipality with a limited budget for letters
    needs to reach people who will miss an online announcement. Both errors are described in human
    terms, and recall is chosen for a reason (cell 1).
- **The sample flow is documented to the row.** Every filter (country, age, valid answer) has its
    rows removed, and every missing predictor value is counted by its original ESS code (refusal,
    don't know, no answer) (cell 2). You also say explicitly that the shares are unweighted.
- **The cutoffs are chosen on the training data with out-of-fold predictions.** The comment
    "score each training respondent using a fold that did not train on them" (cell 8) shows you
    understand why.
- **The metric fits the imbalance.** You use average precision for model selection with a 17%
    positive class, and you explain it in plain words (cell 7).
- **The results are in decision language.** "KNN would reach 14 more infrequent users if the
    municipality can send 58 additional letters" (cell 11) is exactly how a decision-maker wants to
    read a model.

#### Criterion by criterion

##### Framing · 16/20

- **Put the cost ratio in the framing and argue it.** FN = 3 × FP first appears in the evaluation
    code (cell 8). Move it to section 1 and give a reason: the cost of a letter (printing and postage)
    vs. the harm of a missed deadline (a winter without assistance). An explicit range is fine
    ("between 3 and 10").
- **A municipality lives in one country.** `country` is a predictor, but a Latvian municipality
    gains nothing from knowing that its residents live in Latvia. Either the decision-maker is
    national or regional and the pooled model makes sense, or you should model within a country, or
    at least show results by country. Your own table shows very different base rates (8% in Estonia
    vs. 23% in Latvia).
- **Eligibility.** Heating assistance usually targets low-income households, so a letter to an
    infrequent user who is not eligible is also wasted. Say whether the model is meant for the
    eligible population, and if possible restrict to it (for example, lower income deciles or
    pensioners).

##### Data preparation · 18/20

- **Justify the imputation.** You recoded refusals and "don't know" as missing (good), then filled
    categories with the most frequent value. With 3 to 13 missing values per column this barely
    matters, but say why you chose it over a separate *missing* category.
- **The target cut-off.** One line on why "a few times a week" counts as *frequent*: is someone who
    goes online twice a week likely to see a deadline announcement in time?
- **Education categories.** Does `eisced` contain code 55 ("other")? If it does, say how it is
    treated. Right now it would silently become its own category.

##### Pipeline and validation · 24/30

- **k is at the edge of the grid.** The KNN grid was [5, 15, 31] and the best was 31, the largest
    value tried (cell 6). When the best value sits at the edge, extend the grid (51, 101, 201…) until
    the score turns down. Otherwise you have not shown that KNN is worse, only that it is worse at
    k ≤ 31. Also print the **full CV table** (mean and standard deviation for every value), not just
    the best score, so the reader can see the bias–variance curve.
- **Test set used more than once (−3).** Both models are scored on the test set (cell 8), the
    precision–recall curves are drawn on it (cell 10), and the logistic-vs-KNN preference is argued
    from test costs (cell 11). Compare models on out-of-fold predictions, then test the chosen one
    once (see below).
- **Make the notebook reproducible (−1).** `csv_path = "C:/Users/vakar/..."` only works on your
    computer. Use a relative path, and either include the extract or write the exact ESS download
    steps (round, edition, variables) at the top.

##### Metric and threshold · 17/20

- **Call 247 vs. 249 a tie.** A 2-point difference on a single test set of 937 people is noise. Say
    so, and let the decision rest on what the municipality values: fewer letters or more people
    reached. You already write it that way, so just drop the hint that one model "scores better".
- **Add the theory check.** With FN = 3 and FP = 1, the optimal cutoff for calibrated probabilities
    is 1 / (1 + 3) = 0.25. Your CV cutoffs (0.30 and 0.20) are on either side of it. That is worth
    one sentence.
- **Report both trivial policies.** "Send no letters" costs 489. "Send everyone a letter" costs
    774 on the test set (all 774 frequent users). Showing that the model beats both makes the result
    much stronger.

##### Clarity and assistant log · 7/10

- **The prose is the clearest in the group.** A reader with no ML background could follow it.
- **The assistant log needs rejections.** Every row says "kept" or "checked" (cell 13). The course
    guide is explicit: a log with no rejections is a weak log. What did the assistant get wrong? Which
    suggestion did you not take? Did you question the KNN grid it proposed? Even small corrections
    count.

#### Priorities for the final delivery (due Thu 26 Nov)

1. **Freeze the test set** and move every comparison to out-of-fold predictions (see below).
2. **Fix the KNN grid** and print the full CV tables for both models.
3. **Three families of methods:**
     - your logistic regression;
     - a **random forest or gradient boosting** (Session 6), since age × country and age ×
         activity interactions are likely here;
     - **LASSO** (Session 7), or a **register-only model** (age, area, household size: what a
         municipality really holds) compared with the full one. That turns your leakage assumption in
         cell 12 into a result.
4. **Quantify the recommendation.** For example: "per 1,000 letters the model reaches N infrequent
     users vs. 174 at random", with the cost assumptions stated and, ideally, results by country.
5. **A reproducible data path and a real assistant log.**

</details>


### One rule for everyone: the test set

All three Checkpoint 1 notebooks used the test set more than once. That happens to almost everyone
the first time, and it is easy to fix. The same deduction (−3 in *Pipeline and validation*) applies
to all three projects, so being honest about it cost you nothing extra.

For the final delivery:

1. **Define one `cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` near the top** and pass
     that same object to every `GridSearchCV`, `cross_val_score` and `cross_val_predict`. The final
     rubric asks for a comparison "with cross-validation on the same splits", and this is how you get it.
2. **Do every comparison on out-of-fold predictions from the training set.** That covers model vs.
     model, threshold vs. threshold and cost ratio vs. cost ratio. `cross_val_predict(..., method="predict_proba")` gives you
     one honest probability per training row, and you can compute any confusion matrix, cost or
     curve from it.
3. **Touch the test set once,** at the very end, for the model and threshold you have already chosen.
     Print that single result and do not change anything after seeing it.
4. **Say it in the report:** your test set was already seen in Checkpoint 1, so the final test number
     is slightly optimistic. One sentence is enough. It is a strength, not a weakness.

Before you submit, run **Runtime → Restart and run all** and check that every number in your text
matches a printed output.

