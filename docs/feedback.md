---
hide:
  - navigation
---

<div class="usm-hero" markdown>
<div>
<h1>Grades and Feedback</h1>
<p>Your score on each project delivery, criterion by criterion, with what to improve for the next
one. Each student has a personal code, sent by email. Only that code reveals your feedback.</p>
</div>
</div>

## Checkpoint 1

<div class="fb-reveal" data-fb-reveal data-fb-src="data/feedback/checkpoint1.json" markdown>
<form class="fb-form" autocomplete="off">
<label for="fb-code-cp1">Your personal code</label>
<div class="fb-row">
<input id="fb-code-cp1" name="code" type="text" inputmode="text" spellcheck="false"
       autocapitalize="characters" placeholder="XXXX-XXXX-XXXX-XXXX" required>
<button type="submit" class="usm-btn">Reveal</button>
</div>
<p class="fb-status" role="status" aria-live="polite"></p>
</form>
<div class="fb-output" hidden></div>
</div>

!!! info "How to read your feedback"
    - **Scores follow the [Checkpoint 1 rubric](projects.md#checkpoint-1-an-honest-first-model):**
      framing 20, data 20, pipeline 30, metric 20, clarity 10, for a total of 100.
    - **Cell numbers** count from the top of your notebook, starting at 1.
    - **The *Priorities for the final delivery* list is the part to act on.** It maps to the
      [final delivery rubric](projects.md#final-delivery-compare-decide-defend). Your final report
      must say how you responded to this feedback.
    - **Questions?** Bring them to the project clinic on Friday 20 November.

!!! note "Privacy"
    Feedback is stored encrypted, and the page decrypts it in your browser. Without your code, nobody
    can read it, including anyone else in the course. Do not share your code.
