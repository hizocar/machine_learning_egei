/* ==========================================================================
   course-now.js — "Where are we in the course?"

   Works out the next session from today's date and
   - fills <div class="usm-now" data-usm-now></div> on the home page,
   - highlights that session's row in the plan table on Classes (.usm-plan),
   - marks it "Next" in the sidebar.

   The calendar below is the single place to change a date for these three
   cues. Re-runs on every page change via document$ (Material instant navigation).
   ========================================================================== */
(function () {
  "use strict";

  const COLAB = "https://colab.research.google.com/github/hizocar/machine_learning_egei/blob/main/docs/notebooks/";

  // date = the (last) Friday of the session; sessions run 13:00–16:00.
  const SESSIONS = [
    { n: 1, date: "2026-09-11", title: "Data and Decision Making", question: "What kind of data do we have?", nb: "s01_types_of_data" },
    { n: 2, date: "2026-09-25", title: "Data Manipulation", question: "How do we build one clean row per unit?", nb: "s02_data_manipulation" },
    { n: 3, date: "2026-10-09", title: "What Is Machine Learning?", question: "Can we predict from data? How wrong are we?", nb: "s03_ml_models" },
    { n: 4, date: "2026-10-23", title: "The ML Pipeline", question: "Is the error we report honest?", nb: "s04_pipeline" },
    { n: 5, date: "2026-10-30", title: "Classification", question: "Who is poor?", nb: "s05_classification" },
    { n: 6, date: "2026-11-06", title: "Trees and Ensembles", question: "Can a more flexible model find the poor households the logit misses?", nb: "s06_trees" },
    { n: 7, date: "2026-11-13", title: "Selection and Shrinkage", question: "Which variables do we really need?", nb: "s07_shrinkage" },
    { n: 8, date: "2026-11-20", title: "Unlabeled Data", question: "What types of households are there, without labels?", nb: "s08_unsupervised" },
    { n: 9, date: "2026-11-27", title: "Final Presentations", question: "Can you defend your model in front of a decision-maker?", nb: null },
  ];

  const DEADLINES = [
    { what: "Checkpoint 1", due: "2026-11-12T23:59" },
    { what: "Final delivery", due: "2026-11-26T23:59" },
  ];

  const DAY = 86400000;
  const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const base = () => (typeof __md_scope !== "undefined" ? __md_scope : new URL(".", location));
  const url = (path) => new URL(path, base()).href;

  function local(dateStr, hh, mm) {
    const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d, hh, mm);
  }

  function inDays(target, now) {
    const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const b = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const n = Math.round((b - a) / DAY);
    return n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`;
  }

  function nextSession(now) {
    return SESSIONS.find((s) => local(s.date, 16, 0) >= now) || null;
  }

  function el(tag, attrs, text) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    if (text != null) e.textContent = text;
    return e;
  }

  function renderCard(root, s, now) {
    root.replaceChildren();
    const main = el("div");
    if (!s) {
      main.append(
        el("h2", {}, "The course has finished"),
        el("p", { class: "usm-now-question" }, "Every session, notebook and the project brief stay available here."),
      );
      const actions = el("div", { class: "usm-actions" });
      actions.append(el("a", { href: url("classes/classes/"), class: "usm-primary" }, "All sessions"));
      root.append(main, actions);
      return;
    }
    const start = local(s.date, 13, 0);
    const live = now >= start;
    main.append(
      el("h2", {}, (live ? "Now: " : "Next session: ") + s.question),
      el("p", { class: "usm-now-when" },
        `Session ${s.n} · ${s.title} · ${fmt.format(start)}, 13:00\u2060–\u206016:00 · ${live ? "in progress" : inDays(start, now)}`),
    );
    const actions = el("div", { class: "usm-actions" });
    actions.append(el("a", { href: url(`classes/class${s.n}/`), class: "usm-primary" }, "Open the session"));
    if (s.nb) {
      actions.append(
        el("a", { href: url(`notebooks/${s.nb}/`) }, "Notebook"),
        el("a", { href: COLAB + s.nb + ".ipynb", target: "_blank", rel: "noopener" }, "Open in Colab"),
      );
    }
    root.append(main, actions);

    const d = DEADLINES.find((x) => local(x.due, 23, 59) >= now);
    if (d) {
      const due = local(d.due, 23, 59);
      const p = el("p", { class: "usm-now-deadline" });
      p.append("Next deadline: ", el("strong", {}, d.what), ` · ${fmt.format(due)}, 23:59 · ${inDays(due, now)} · `);
      p.append(el("a", { href: url("projects/") }, "brief and rubric"));
      root.append(p);
    }
  }

  function markPlan(s) {
    document.querySelectorAll(".usm-plan tbody tr").forEach((tr) => {
      tr.classList.remove("usm-is-next");
      tr.querySelectorAll(".usm-next-pill").forEach((p) => p.remove());
      const a = tr.querySelector("td a");
      if (s && a && new URL(a.href).pathname.endsWith(`/classes/class${s.n}/`)) {
        tr.classList.add("usm-is-next");
        const cell = tr.children[1];
        if (cell) cell.append(el("span", { class: "usm-next-pill" }, "Next"));
      }
    });
  }

  function markNav(s) {
    document.querySelectorAll(".md-nav__link.usm-is-next").forEach((a) => a.classList.remove("usm-is-next"));
    if (!s) return;
    document.querySelectorAll("a.md-nav__link").forEach((a) => {
      const u = new URL(a.href, location);
      // Skip table-of-contents anchors: on the session's own page they share its path.
      if (!u.hash && u.pathname.endsWith(`/classes/class${s.n}/`)) a.classList.add("usm-is-next");
    });
  }

  function run() {
    const now = new Date();
    const s = nextSession(now);
    document.querySelectorAll("[data-usm-now]").forEach((root) => renderCard(root, s, now));
    markPlan(s);
    markNav(s);
  }

  if (typeof document$ !== "undefined") document$.subscribe(run);
  else document.addEventListener("DOMContentLoaded", run);
})();
