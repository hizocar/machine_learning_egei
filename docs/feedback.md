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

