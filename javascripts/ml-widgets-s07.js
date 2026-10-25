/* ==========================================================================
   ml-widgets-s07.js — Session 7 · Selection and Shrinkage

   Registers into window.MLWidgets (defined in ml-widgets.js) and reuses its
   helpers. Data: docs/data/widgets/s07_*.json, exported by
   scripts/build_widget_data_s07.py from the same models as the s07 notebook.
   ========================================================================== */
(function () {
  "use strict";
  const ML = window.MLWidgets;
  if (!ML) return;
  const { WIDGETS, mountAll } = ML;
  const {
    h, header, slider, btn, stats, el, text, plot, pathD, tween, fx, onVisible, channel,
    load, f, reduced, wait, SPRING, fail,
  } = ML.helpers;

  const log10 = Math.log10;
  let clipId = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ========================================================================
     Session 7 · 1 — The LASSO path
     ======================================================================== */
  WIDGETS["lasso-path"] = function (root) {
    header(root, "The LASSO path: which questions survive the penalty?",
      "An L1-penalised logit for poverty, fitted on the course data for 40 penalty strengths. Each line is " +
      "one coefficient. Move the slider from a strong penalty (left) to a weak one (right) and watch " +
      "coefficients leave zero, one by one.");

    load("s07_path.json").then((d) => {
      const n = d.C.length;
      const lc = d.C.map(log10);
      const nf = d.features.length;
      const at = (j, k) => d.coef[j][k];

      const controls = h("div", { class: "ml-controls" });
      const bar = h("div", { class: "ml-buttons" });
      root.append(controls, bar);

      // --- Path plot -----------------------------------------------------------------------
      let ymin = 0, ymax = 0;
      d.coef.forEach((row) => row.forEach((v) => { ymin = Math.min(ymin, v); ymax = Math.max(ymax, v); }));
      const pad = 0.08 * (ymax - ymin);
      const p = plot(root, 560, 300, { l: 48, r: 14, t: 22, b: 40 }, "LASSO coefficient paths against the penalty");
      p.domain([lc[0], lc[n - 1]], [ymin - pad, ymax + pad]);
      const yt = [];
      for (let v = Math.ceil(ymin * 2) / 2; v <= ymax + 1e-9; v += 0.5) yt.push(+v.toFixed(1));
      p.axes({
        xt: [-3, -2, -1, 0, 1], xfmt: (v) => String(10 ** v >= 1 ? 10 ** v : (10 ** v).toFixed(-v)),
        yt, yfmt: (v) => v.toFixed(1), xl: "C = 1/λ (log scale) — weaker penalty →", yl: "coefficient",
      });
      el("line", { x1: p.x(lc[0]), x2: p.x(lc[n - 1]), y1: p.y(0), y2: p.y(0), class: "ax" }, p.svg);

      const lines = d.features.map((name, j) => {
        const path = el("path", {
          d: pathD(lc.map((x, k) => [p.x(x), p.y(at(j, k))])), class: "ml-s07-path",
        }, p.svg);
        el("title", {}, path).textContent = name;
        return path;
      });

      const refLine = (k, label, cls, dy) => {
        el("line", { x1: p.x(lc[k]), x2: p.x(lc[k]), y1: p.m.t, y2: p.h - p.m.b, class: cls }, p.svg);
        text(p.svg, p.x(lc[k]), p.m.t - 8 + dy, label, { "text-anchor": "middle", class: "ml-svg-small " + cls + "-lab" });
      };
      refLine(d.one_se, "1-SE", "ml-s07-onese", 0);
      refLine(d.best, "CV-best", "ml-s07-best", 0);

      const marker = el("line", { y1: p.m.t, y2: p.h - p.m.b, class: "ml-marker" }, p.svg);
      const dots = d.features.map(() => el("circle", { r: 3, class: "ml-s07-dot" }, p.svg));

      // --- CV AUC plot ---------------------------------------------------------------------
      const q = plot(root, 560, 150, { l: 48, r: 14, t: 10, b: 34 }, "Cross-validated AUC against the penalty");
      q.domain([lc[0], lc[n - 1]], [0.5, 0.8]);
      q.axes({ yt: [0.5, 0.6, 0.7, 0.8], yfmt: (v) => v.toFixed(1), yl: "CV AUC", xt: [] });
      // Band: ± 1 standard error of the CV mean (fold sd / √5), the unit the 1-SE rule uses.
      const band = lc.map((x, k) => [q.x(x), q.y(d.auc[k] + d.auc_se[k])])
        .concat(lc.slice().reverse().map((x, i) => {
          const k = n - 1 - i;
          return [q.x(x), q.y(d.auc[k] - d.auc_se[k])];
        }));
      el("path", { d: pathD(band) + "Z", class: "ml-s07-band" }, q.svg);
      const cut = d.auc[d.best] - d.auc_se[d.best];
      el("line", { x1: q.x(lc[0]), x2: q.x(lc[n - 1]), y1: q.y(cut), y2: q.y(cut), class: "ml-s07-onese" }, q.svg);
      text(q.svg, q.x(lc[0]) + 4, q.y(cut) - 5, `best − 1 SE = ${f(cut)}`, { class: "ml-svg-small ml-s07-onese-lab" });
      el("path", { d: pathD(lc.map((x, k) => [q.x(x), q.y(d.auc[k])])), class: "ml-line-model" }, q.svg);
      [[d.one_se, "ml-s07-onese"], [d.best, "ml-s07-best"]].forEach(([k, cls]) =>
        el("line", { x1: q.x(lc[k]), x2: q.x(lc[k]), y1: q.m.t, y2: q.h - q.m.b, class: cls }, q.svg));
      const qMarker = el("line", { y1: q.m.t, y2: q.h - q.m.b, class: "ml-marker" }, q.svg);
      const qDot = el("circle", { r: 4.5, class: "ml-marker-dot" }, q.svg);

      // --- Readouts ------------------------------------------------------------------------
      const st = stats(root, [
        { k: "C", label: "Penalty C" },
        { k: "nz", label: "Coefficients ≠ 0" },
        { k: "qs", label: "Questions on the form", cls: "is-test" },
        { k: "auc", label: "CV AUC (± SE)" },
      ]);
      const qTitle = h("p", { class: "ml-s07-qtitle" }, "The 19 questions — filled: still needed at this penalty");
      const chipsWrap = h("div", { class: "ml-s07-qchips" });
      const questions = [];
      d.groups.forEach((g) => { if (!questions.includes(g)) questions.push(g); });
      const chip = {};
      questions.forEach((g) => {
        chip[g] = h("span", { class: "ml-s07-q" }, g);
        chipsWrap.append(chip[g]);
      });
      const top = h("p", { class: "ml-note ml-s07-top" });
      const note = h("p", { class: "ml-note" });
      root.append(qTitle, chipsWrap, top, note);

      // --- Behaviour -----------------------------------------------------------------------
      let shown = d.one_se;
      const anim = channel();

      function draw(kf) {
        const k0 = Math.floor(kf), k1 = Math.min(n - 1, k0 + 1), u = kf - k0;
        const x = lc[k0] + (lc[k1] - lc[k0]) * u;
        marker.setAttribute("x1", p.x(x)); marker.setAttribute("x2", p.x(x));
        qMarker.setAttribute("x1", q.x(x)); qMarker.setAttribute("x2", q.x(x));
        const a = d.auc[k0] + (d.auc[k1] - d.auc[k0]) * u;
        qDot.setAttribute("cx", q.x(x)); qDot.setAttribute("cy", q.y(a));
        const kn = Math.round(kf);
        for (let j = 0; j < nf; j++) {
          const v = at(j, k0) + (at(j, k1) - at(j, k0)) * u;
          dots[j].setAttribute("cx", p.x(x));
          dots[j].setAttribute("cy", p.y(v));
          dots[j].style.opacity = at(j, kn) !== 0 ? 1 : 0;
        }
      }

      function readout(k) {
        const used = new Set(d.groups.filter((g, j) => at(j, k) !== 0));
        st.set("C", `${f(d.C[k], d.C[k] < 0.1 ? 4 : 3)} (λ = ${f(1 / d.C[k], 1)})`);
        st.set("nz", `${d.nonzero[k]} / ${d.n_columns}`);
        st.set("qs", `${used.size} / ${d.n_questions}`);
        st.set("auc", `${f(d.auc[k])} ± ${f(d.auc_se[k])}`);
        lines.forEach((ln, j) => ln.setAttribute("class", "ml-s07-path" + (used.has(d.groups[j]) ? " is-on" : "")));
        questions.forEach((g) => {
          const on = used.has(g);
          const was = chip[g].classList.contains("is-on");
          chip[g].classList.toggle("is-on", on);
          if (on !== was) fx(chip[g], { transform: ["scale(0.85)", "scale(1)"] }, { duration: 0.25 });
        });
        const big = d.features.map((name, j) => [name, at(j, k)]).filter((e) => e[1] !== 0)
          .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3);
        top.textContent = big.length
          ? "Largest coefficients here: " + big.map(([nm, v]) => `${nm} (${v > 0 ? "+" : "−"}${f(Math.abs(v), 2)})`).join(" · ")
          : "";
        note.className = "ml-note" + (k === d.one_se ? " is-ok" : "");
        if (k === 0) {
          note.textContent = "Strongest penalty: almost every coefficient is zero and the model barely beats a coin (AUC ≈ 0.5).";
        } else if (k === d.one_se) {
          note.textContent = `1-SE rule: the most penalised model whose CV AUC is within one standard error (fold sd / √5) of ` +
            `the best. ${d.nonzero[k]} coefficients — but they still come ` +
            `from ${used.size} of the ${d.n_questions} questions. LASSO drops dummies, not questions: keeping one region ` +
            "dummy still means asking the region.";
        } else if (k === d.best) {
          note.textContent = `CV-best: AUC ${f(d.auc[k])}, the same as the unpenalised model. With 11,250 households the penalty ` +
            "buys sparsity, not accuracy.";
        } else if (k > d.best) {
          note.textContent = "Weaker penalties than the CV-best add coefficients without adding AUC.";
        } else {
          note.textContent = "Stronger penalties than the 1-SE choice start to cost real AUC.";
        }
      }

      function goTo(k, instant) {
        k = clamp(Math.round(k), 0, n - 1);
        sl.set(k);
        readout(k);
        if (instant) { shown = k; draw(k); return; }
        anim(tween(shown, k, SPRING, (v) => { shown = v; draw(v); }));
      }

      const sl = slider(controls, {
        label: "Penalty: move right to weaken it", min: 0, max: n - 1, step: 1, value: d.one_se,
        fmt: (k) => "C = " + f(d.C[k], d.C[k] < 0.1 ? 4 : 2),
      }, (k) => goTo(k));
      btn(bar, "Strongest penalty", () => goTo(0));
      btn(bar, "1-SE rule", () => goTo(d.one_se), "is-primary");
      btn(bar, "CV-best", () => goTo(d.best));
      btn(bar, "Weakest penalty", () => goTo(n - 1));

      goTo(0, true);
      onVisible(root, () => {
        lines.forEach((ln, j) => fx(ln, { opacity: [0, 1] }, { duration: 0.4, delay: Math.min(0.4, j * 0.006) }));
        wait(350).then(() => goTo(d.one_se));
      });
    }).catch((e) => fail(root, e));
  };

  /* ========================================================================
     Session 7 · 2 — Why L1 gives exact zeros: the geometry
     ======================================================================== */
  WIDGETS["penalty-geometry"] = function (root) {
    header(root, "Why LASSO sets coefficients exactly to zero",
      "A synthetic two-coefficient example, not CASEN data. The ellipses are contours of the loss, " +
      "centred on the unpenalised estimate. A penalty is a budget: the coefficients must stay inside the " +
      "shape. The solution is the first point where an ellipse touches it.");

    const BH = [1.6, 0.5];
    const A = [[1.0, 0.55], [0.55, 0.9]];
    const loss = (b) => {
      const u = b[0] - BH[0], v = b[1] - BH[1];
      return A[0][0] * u * u + 2 * A[0][1] * u * v + A[1][1] * v * v;
    };
    // radius of the constraint shape at angle th: mix = 0 diamond (L1), 1 circle (L2)
    const radius = (th, t, mix) => {
      const rd = t / (Math.abs(Math.cos(th)) + Math.abs(Math.sin(th)));
      return rd + (t - rd) * mix;
    };
    function solve(t, kind) {
      const inside = kind === "l1" ? Math.abs(BH[0]) + Math.abs(BH[1]) <= t : Math.hypot(BH[0], BH[1]) <= t;
      if (inside) return BH.slice();
      let best = null, bl = Infinity;
      const N = 3000;
      for (let i = 0; i < N; i++) {
        let b;
        if (kind === "l2") {
          const a = (2 * Math.PI * i) / N;
          b = [t * Math.cos(a), t * Math.sin(a)];
        } else {
          const s = (4 * i) / N, seg = Math.floor(s), u = s - seg;
          const C = [[t, 0], [0, t], [-t, 0], [0, -t], [t, 0]];
          b = [C[seg][0] * (1 - u) + C[seg + 1][0] * u, C[seg][1] * (1 - u) + C[seg + 1][1] * u];
        }
        const l = loss(b);
        if (l < bl) { bl = l; best = b; }
      }
      // Snap the numerical solution onto a corner when it is within grid resolution of one.
      if (kind === "l1") best = best.map((v) => (Math.abs(v) < t * 2e-3 ? 0 : v));
      return best;
    }

    const chips = h("div", { class: "ml-chips" });
    const controls = h("div", { class: "ml-controls" });
    root.append(chips, controls);
    const l1Chip = h("button", { type: "button", class: "ml-chip-toggle ml-s07-mode", "aria-pressed": "true" }, "L1 · LASSO (diamond)");
    const l2Chip = h("button", { type: "button", class: "ml-chip-toggle ml-s07-mode", "aria-pressed": "false" }, "L2 · Ridge (circle)");
    chips.append(l1Chip, l2Chip);

    // Equal scales on both axes, so the circle looks like a circle.
    const xd = [-0.7, 2.2], ydm = [-0.7, 1.3];
    const W = 520, m = { l: 40, r: 14, t: 14, b: 36 };
    const kpx = (W - m.l - m.r) / (xd[1] - xd[0]);
    const H = Math.round(kpx * (ydm[1] - ydm[0]) + m.t + m.b);
    const p = plot(root, W, H, m, "Loss contours and the L1 or L2 constraint region");
    p.domain(xd, ydm);
    el("line", { x1: p.x(xd[0]), x2: p.x(xd[1]), y1: p.y(0), y2: p.y(0), class: "ax" }, p.svg);
    el("line", { x1: p.x(0), x2: p.x(0), y1: p.y(ydm[0]), y2: p.y(ydm[1]), class: "ax" }, p.svg);
    text(p.svg, p.x(xd[1]) - 4, p.y(0) - 6, "β₁", { "text-anchor": "end", class: "ml-svg-label" });
    text(p.svg, p.x(0) + 6, p.y(ydm[1]) + 12, "β₂", { class: "ml-svg-label" });

    // Contours: Q(b) = level is an ellipse; parametrise through the eigenvectors of A.
    const tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[0][1];
    const l1e = tr / 2 + Math.sqrt(tr * tr / 4 - det), l2e = tr / 2 - Math.sqrt(tr * tr / 4 - det);
    const v1 = [A[0][1], l1e - A[0][0]], nv = Math.hypot(v1[0], v1[1]);
    const e1 = [v1[0] / nv, v1[1] / nv], e2 = [-e1[1], e1[0]];
    const ellipse = (level) => {
      const pts = [];
      for (let i = 0; i <= 96; i++) {
        const a = (2 * Math.PI * i) / 96;
        const c = Math.sqrt(level / l1e) * Math.cos(a), s = Math.sqrt(level / l2e) * Math.sin(a);
        pts.push([p.x(BH[0] + c * e1[0] + s * e2[0]), p.y(BH[1] + c * e1[1] + s * e2[1])]);
      }
      return pathD(pts) + "Z";
    };
    // Contours extend past the axes; clip everything drawn in data space to the plot area.
    const cid = "ml-s07-clip-" + ++clipId;
    el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b }, el("clipPath", { id: cid }, el("defs", {}, p.svg)));
    const g = el("g", { "clip-path": `url(#${cid})` }, p.svg);
    [0.05, 0.2, 0.45, 0.8, 1.3, 2.0].forEach((lv) => el("path", { d: ellipse(lv), class: "ml-s07-contour" }, g));

    const region = el("path", { class: "ml-s07-region" }, g);
    const touch = el("path", { class: "ml-s07-contour is-active" }, g);
    el("circle", { cx: p.x(BH[0]), cy: p.y(BH[1]), r: 4, class: "ml-s07-ols" }, p.svg);
    text(p.svg, p.x(BH[0]) + 7, p.y(BH[1]) - 7, "unpenalised estimate", { class: "ml-svg-small muted" });
    const solDot = el("circle", { r: 6, class: "ml-marker-dot" }, p.svg);
    const solLab = text(p.svg, 0, 0, "solution", { class: "ml-svg-small" });

    const st = stats(root, [
      { k: "b1", label: "β₁" },
      { k: "b2", label: "β₂", cls: "is-test" },
      { k: "zero", label: "β₂ exactly zero?" },
    ]);
    const note = h("p", { class: "ml-note" });
    root.append(note);

    let mode = "l1", mix = 0, t = 0.9, sol = solve(t, mode);
    const mixAnim = channel(), solAnim = channel();

    function drawRegion() {
      const pts = [];
      for (let i = 0; i <= 160; i++) {
        const th = (2 * Math.PI * i) / 160, r = radius(th, t, mix);
        pts.push([p.x(r * Math.cos(th)), p.y(r * Math.sin(th))]);
      }
      region.setAttribute("d", pathD(pts) + "Z");
    }
    function drawSol(b) {
      solDot.setAttribute("cx", p.x(b[0]));
      solDot.setAttribute("cy", p.y(b[1]));
      solLab.setAttribute("x", p.x(b[0]) + 9);
      solLab.setAttribute("y", p.y(b[1]) + 15);
      const lv = loss(b);
      touch.setAttribute("d", lv > 1e-6 ? ellipse(lv) : "");
    }
    function readout() {
      st.set("b1", f(sol[0], 2));
      st.set("b2", f(sol[1], 2));
      const zero = sol[1] === 0;
      st.set("zero", zero ? "yes" : "no");
      const free = (mode === "l1" ? Math.abs(BH[0]) + Math.abs(BH[1]) : Math.hypot(BH[0], BH[1])) <= t;
      note.textContent = free
        ? "The budget is large enough to contain the unpenalised estimate: no shrinkage at all."
        : mode === "l1"
          ? zero
            ? "The ellipse first touches the diamond at a corner, on the β₁ axis: β₂ is exactly 0. Corners are why LASSO drops variables."
            : "With this budget the touching point is on an edge: both coefficients shrink, neither is zero. Shrink the budget and watch it slide into the corner."
          : "The circle has no corners: β₂ shrinks towards 0 as the budget tightens, but never reaches it. Ridge keeps every variable.";
    }
    function update(instant) {
      const target = solve(t, mode);
      const from = sol.slice();
      sol = target;
      readout();
      if (instant) { drawSol(target); return; }
      solAnim(tween(0, 1, SPRING, (u) => drawSol([from[0] + (target[0] - from[0]) * u, from[1] + (target[1] - from[1]) * u])));
    }
    function setMode(next) {
      if (next === mode) return;
      mode = next;
      l1Chip.setAttribute("aria-pressed", String(mode === "l1"));
      l2Chip.setAttribute("aria-pressed", String(mode === "l2"));
      mixAnim(tween(mix, mode === "l2" ? 1 : 0, { duration: 0.45 }, (v) => { mix = v; drawRegion(); }));
      update();
    }
    l1Chip.addEventListener("click", () => setMode("l1"));
    l2Chip.addEventListener("click", () => setMode("l2"));
    slider(controls, { label: "Budget for the coefficients (smaller = stronger penalty)", min: 0.1, max: 2.4, step: 0.05, value: t, fmt: (v) => v.toFixed(2) },
      (v) => { t = v; drawRegion(); update(); });

    drawRegion();
    drawSol(sol);
    readout();
    onVisible(root, () => {
      fx(region, { opacity: [0, 1] }, { duration: 0.4 });
      fx(solDot, { opacity: [0, 1], transform: ["scale(0.4)", "scale(1)"] }, { duration: 0.35, delay: 0.2 });
    });
  };

  /* ========================================================================
     Session 7 · 3 — Forward selection: how many questions does the form need?
     ======================================================================== */
  WIDGETS["forward-steps"] = function (root) {
    header(root, "Forward selection: build the form one question at a time",
      "At each step we add the question that raises the cross-validated AUC the most (logit, course data). " +
      "Watch how fast the gains flatten — and decide where you would stop.");

    load("s07_forward.json").then((d) => {
      const S = d.steps, N = S.length;
      const bar = h("div", { class: "ml-buttons" });
      root.append(bar);

      const p = plot(root, 560, 280, { l: 48, r: 14, t: 16, b: 40 }, "Cross-validated AUC as questions are added");
      p.domain([0.5, N + 0.5], [0.64, 0.79]);
      p.axes({
        xt: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19], yt: [0.65, 0.7, 0.75], yfmt: (v) => v.toFixed(2),
        xl: "number of questions on the form", yl: "CV AUC",
      });
      el("rect", {
        x: p.x(0.5), width: p.x(N + 0.5) - p.x(0.5), y: p.y(d.full), height: p.y(d.full - 0.01) - p.y(d.full),
        class: "ml-s07-band",
      }, p.svg);
      el("line", { x1: p.x(0.5), x2: p.x(N + 0.5), y1: p.y(d.full), y2: p.y(d.full), class: "ml-baseline" }, p.svg);
      text(p.svg, p.x(N + 0.5) - 4, p.y(d.full) - 5, `all 19 questions: ${f(d.full)}`, { "text-anchor": "end", class: "ml-svg-small muted" });
      text(p.svg, p.x(N + 0.5) - 4, p.y(d.full - 0.01) + 12, "within 0.01", { "text-anchor": "end", class: "ml-svg-small muted" });

      const line = el("path", { class: "ml-line-model" }, p.svg);
      const enoughMark = el("g", { opacity: 0 }, p.svg);
      el("line", { x1: p.x(d.enough + 1), x2: p.x(d.enough + 1), y1: p.y(0.79), y2: p.y(0.64), class: "ml-cheap" }, enoughMark);
      text(enoughMark, p.x(d.enough + 1) + 5, p.y(0.655), `${d.enough + 1} questions are enough`, { class: "ml-svg-small ml-lab-cheap" });
      const dots = S.map((s, i) => el("circle", { cx: p.x(i + 1), cy: p.y(s.auc), r: 0, class: "ml-s07-step" }, p.svg));

      const st = stats(root, [
        { k: "n", label: "Questions on the form" },
        { k: "auc", label: "CV AUC", cls: "is-test" },
        { k: "gap", label: "Gap to all 19" },
      ]);
      const list = h("ol", { class: "ml-s07-list" });
      const note = h("p", { class: "ml-note" });
      root.append(list, note);

      let k = 0, playing = 0;
      const anims = [];

      function show(i) {
        const s = S[i];
        const gain = i ? s.auc - S[i - 1].auc : null;
        line.setAttribute("d", pathD(S.slice(0, i + 1).map((v, j) => [p.x(j + 1), p.y(v.auc)])));
        anims.push(tween(0, 4.5, SPRING, (r) => dots[i].setAttribute("r", Math.max(0, r))));
        const li = h("li", {}, h("code", {}, s.add), h("span", {}, gain === null ? ` ${f(s.auc)}` : ` +${f(gain)}`));
        if (i <= d.enough) li.className = "is-core";
        list.append(li);
        fx(li, { opacity: [0, 1], transform: ["translateX(-6px)", "translateX(0)"] }, { duration: 0.25 });
        st.set("n", `${i + 1} / ${N}`);
        st.set("auc", f(s.auc));
        st.set("gap", f(d.full - s.auc));
        if (i === d.enough) {
          enoughMark.setAttribute("opacity", 1);
          fx(enoughMark, { opacity: [0, 1] }, { duration: 0.35 });
        }
        note.className = "ml-note" + (i === d.enough ? " is-ok" : "");
        note.textContent = i === d.enough
          ? `${i + 1} questions reach ${f(s.auc)}, within 0.01 of the full form. The other ${N - i - 1} questions add almost nothing — ` +
            "but each one costs interview time and is one more answer an applicant could shade."
          : s.add === "head_schooling_years"
            ? "head_schooling_years enters only now: head_education already carries almost the same information. Redundant is not the same as irrelevant."
            : i < d.enough
              ? `Adding ${s.add}: +${f(gain === null ? s.auc - 0.5 : gain)} AUC.`
              : i === N - 1
                ? "All 19 questions. Compare the first seven steps with the last twelve."
                : `Adding ${s.add}: ${gain >= 0.0005 ? "+" + f(gain) : "less than +0.001"} AUC.`;
      }
      function next() {
        if (k >= N) return;
        show(k);
        k += 1;
      }
      function reset() {
        playing += 1;
        anims.splice(0).forEach((a) => a.stop());
        k = 0;
        line.setAttribute("d", "");
        dots.forEach((c) => c.setAttribute("r", 0));
        list.textContent = "";
        enoughMark.setAttribute("opacity", 0);
        ["n", "auc", "gap"].forEach((x) => st.set(x, "—"));
        note.textContent = "";
        note.className = "ml-note";
      }
      async function playTo(last) {
        const my = ++playing;
        while (k <= last && k < N) {
          next();
          await wait(320);
          if (my !== playing) return;
        }
      }

      btn(bar, "＋ Add the next question", () => { playing += 1; next(); }, "is-primary");
      btn(bar, "▶ Play to 19", () => playTo(N - 1));
      btn(bar, "Reset", reset);
      onVisible(root, () => playTo(d.enough));
    }).catch((e) => fail(root, e));
  };

  mountAll();
})();
