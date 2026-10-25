/* ==========================================================================
   ml-widgets-s06.js — Session 6 · Trees and ensembles

   Registers into window.MLWidgets (ml-widgets.js) and reuses its helpers, so
   the four widgets look and move like the Session 4–5 ones. Data comes from
   docs/data/widgets/s06_*.json, exported by scripts/build_widget_data_s06.py
   with the same split, folds and models as docs/notebooks/s06_trees.ipynb.
   ========================================================================== */
(function () {
  "use strict";
  const ML = window.MLWidgets;
  if (!ML) return;
  const { WIDGETS, mountAll } = ML;
  const {
    SPRING, tween, fx, onVisible, channel, sum, f, pct, thousands, rng, load, h, header, slider,
    btn, stats, el, text, plot, pathD, range, fail, reduced,
  } = ML.helpers;

  const gini = (p) => 2 * p * (1 - p);
  // Background tint for a group of households: more red = more poor (share 0.6+ is fully tinted).
  const tint = (share) => `color-mix(in srgb, var(--ml-c3) ${Math.round(Math.min(1, share / 0.6) * 40)}%, var(--ml-soft))`;

  function select(parent, label, options, onChange) {
    const s = h("select", { "aria-label": label });
    options.forEach(([value, text_]) => s.append(h("option", { value }, text_)));
    s.addEventListener("change", () => onChange(s.value));
    parent.append(h("div", { class: "ml-control" }, h("label", {}, h("span", {}, label)), s));
    return s;
  }

  /* ========================================================================
     Session 6 · 1 — One split: the Gini impurity
     ======================================================================== */
  WIDGETS["tree-split"] = function (root) {
    header(root, "One question, two groups",
      "A tree's first move: pick a variable and a cut point that split the 11,250 training households into two " +
      "groups that are as pure as possible. Bars show how many households have each value (red = poor). " +
      "Move the cut, then let the tree find the best one.");

    load("s06_split.json").then((data) => {
      const wrap = h("div", { class: "ml-grid-2" });
      root.append(wrap);
      const main = h("div", {});
      const side = h("div", {});
      wrap.append(main, side);

      const hp = plot(main, 520, 230, { l: 48, b: 38, t: 14 }, "Households by value of the chosen variable, split into poor and not poor, with the cut point");
      const gp = plot(main, 520, 150, { l: 48, b: 34, t: 18 }, "Weighted Gini impurity after the split, for every cut point");
      const barsG = el("g", {}, hp.svg);
      const axesH = el("g", {}, hp.svg);
      const axesG = el("g", {}, gp.svg);
      const curve = el("path", { class: "ml-line-test", d: "" }, gp.svg);
      const parentLine = el("line", { class: "ml-baseline" }, gp.svg);
      const parentLab = text(gp.svg, 0, 0, "before the split", { class: "muted ml-svg-small", "text-anchor": "end" });
      const cutH = el("line", { class: "ml-threshold" }, hp.svg);
      const cutHit = el("circle", { r: 22, class: "ml-hit" }, hp.svg);  // invisible touch area
      const cutHandle = el("circle", { r: 7, class: "ml-threshold-handle" }, hp.svg);
      const cutG = el("line", { class: "ml-marker" }, gp.svg);
      const cutDot = el("circle", { r: 4.5, class: "ml-marker-dot" }, gp.svg);

      const controls = h("div", { class: "ml-controls" });
      side.append(controls);
      const children = h("div", { class: "ml6-children" });
      main.append(children);
      const st = stats(side, [
        { k: "before", label: "Gini before" },
        { k: "after", label: "Gini after (weighted)", cls: "is-test" },
        { k: "drop", label: "Impurity removed" },
      ]);
      const note = h("p", { class: "ml-note" });
      side.append(note);

      function childCard(title) {
        const fill = h("span", { class: "ml6-fill" });
        const n = h("strong", {}, "—");
        const share = h("span", {}, "");
        const card = h("div", { class: "ml6-child" },
          h("div", { class: "ml6-child-title" }, title, n),
          h("div", { class: "ml6-bar", role: "img", "aria-label": "share of poor households" }, fill),
          share);
        children.append(card);
        return { card, fill, n, share, title: card.firstChild.firstChild };
      }
      const L = childCard("");
      const R = childCard("");

      let col = "head_schooling_years";
      let D, cuts, imps, best, total, parentG;
      const cutAnim = channel();
      let shownCut = 0;

      function prepare() {
        D = data[col];
        total = { n: sum(D.n), poor: sum(D.poor) };
        parentG = gini(total.poor / total.n);
        // A cut c means "value <= c"; the last value would leave the right group empty.
        cuts = D.v.slice(0, -1);
        imps = cuts.map((c) => impurity(c).w);
        best = cuts[imps.indexOf(Math.min(...imps))];
      }
      function impurity(c) {
        let ln = 0, lp = 0;
        D.v.forEach((v, i) => { if (v <= c) { ln += D.n[i]; lp += D.poor[i]; } });
        const rn = total.n - ln, rp = total.poor - lp;
        const gl = gini(lp / ln), gr = gini(rp / rn);
        return { ln, lp, rn, rp, gl, gr, w: (ln / total.n) * gl + (rn / total.n) * gr };
      }

      function drawStatic() {
        barsG.innerHTML = "";
        axesH.innerHTML = "";
        axesG.innerHTML = "";
        const vmin = D.v[0], vmax = D.v[D.v.length - 1];
        const nmax = Math.max(...D.n);
        const step = nmax > 2500 ? 1000 : nmax > 1000 ? 500 : nmax > 400 ? 200 : 100;
        hp.domain([vmin - 0.5, vmax + 0.5], [0, Math.ceil(nmax / step) * step]);
        const ticksX = range(Math.ceil(vmin / 5) * 5, vmax, vmax - vmin > 40 ? 10 : vmax - vmin > 15 ? 5 : 1);
        axesH.append(hp.axes({ xt: ticksX, yt: range(0, hp.yd[1], step), xl: D.label, yl: "households" }));
        const bw = Math.max(1, hp.x(1) - hp.x(0) - 1.5);
        D.v.forEach((v, i) => {
          const x = hp.x(v) - bw / 2;
          const yNeg = hp.y(D.n[i] - D.poor[i]);
          el("rect", { x, width: bw, y: yNeg, height: hp.y(0) - yNeg, class: "ml-hist-neg ml6-bar-neg" }, barsG);
          const yPos = hp.y(D.n[i]);
          el("rect", { x, width: bw, y: yPos, height: yNeg - yPos, class: "ml-hist-pos ml6-bar-pos" }, barsG);
        });
        const gmin = Math.min(...imps), gmax = parentG;
        const lo = Math.floor((gmin - 0.004) * 200) / 200, hi = Math.ceil((gmax + 0.004) * 200) / 200;
        gp.domain(hp.xd, [lo, hi]);
        axesG.append(gp.axes({ xt: ticksX, yt: [lo, (lo + hi) / 2, hi], yfmt: (v) => v.toFixed(3), xl: "cut point (value ≤ cut goes left)" }));
        curve.setAttribute("d", pathD(cuts.map((c, i) => [gp.x(c + 0.5), gp.y(imps[i])])));
        parentLine.setAttribute("x1", gp.m.l);
        parentLine.setAttribute("x2", gp.w - gp.m.r);
        parentLine.setAttribute("y1", gp.y(parentG));
        parentLine.setAttribute("y2", gp.y(parentG));
        parentLab.setAttribute("x", gp.w - gp.m.r);
        parentLab.setAttribute("y", gp.y(parentG) - 4);
        [cutH, cutHit, cutHandle, cutG, cutDot].forEach((n) => n.parentNode.appendChild(n));
      }

      function placeCut(cf) {
        const x = hp.x(cf + 0.5);
        cutH.setAttribute("x1", x); cutH.setAttribute("x2", x);
        cutH.setAttribute("y1", hp.m.t); cutH.setAttribute("y2", hp.y(0));
        cutHandle.setAttribute("cx", x); cutHandle.setAttribute("cy", hp.m.t);
        cutHit.setAttribute("cx", x); cutHit.setAttribute("cy", hp.m.t);
        const gx = gp.x(cf + 0.5);
        cutG.setAttribute("x1", gx); cutG.setAttribute("x2", gx);
        cutG.setAttribute("y1", gp.m.t); cutG.setAttribute("y2", gp.h - gp.m.b);
        const c = Math.round(cf);
        const i = Math.max(0, Math.min(cuts.length - 1, cuts.indexOf(c) >= 0 ? cuts.indexOf(c) : 0));
        cutDot.setAttribute("cx", gx);
        cutDot.setAttribute("cy", gp.y(imps[i]));
        barsG.querySelectorAll("rect").forEach((r, j) => {
          const v = D.v[Math.floor(j / 2)];
          r.style.opacity = v <= cf + 0.5 ? "" : "0.55";
        });
      }

      function update(c) {
        const r = impurity(c);
        const unit = col === "head_age" ? " years" : col === "household_size" ? (c === 1 ? " person" : " people") : " years";
        L.title.textContent = `≤ ${c}${unit}: `;
        R.title.textContent = `> ${c}${unit}: `;
        L.n.textContent = thousands(r.ln) + " households";
        R.n.textContent = thousands(r.rn) + " households";
        [[L, r.lp / r.ln, r.gl], [R, r.rp / r.rn, r.gr]].forEach(([side_, share, g]) => {
          side_.share.textContent = `${pct(share)} poor · Gini ${f(g)}`;
          side_.card.style.background = tint(share);
          fx(side_.fill, { width: [side_.fill.style.width || "0%", (share * 100).toFixed(1) + "%"] }, SPRING);
        });
        st.set("before", f(parentG));
        st.set("after", f(r.w));
        st.set("drop", f(parentG - r.w));
        note.className = "ml-note" + (c === best ? " is-ok" : "");
        note.textContent = c === best
          ? `Best cut for this variable: ≤ ${best}. The tree compares this with the best cut of every other variable ` +
            `and keeps the largest drop. On the full data it picks weekly hours of work (≤ 27.5 h), which removes 0.020.`
          : `This cut removes ${f(parentG - r.w)} of impurity. The tree searches for the cut where the curve below is lowest.`;
      }

      function moveTo(c, animate) {
        const c0 = shownCut;
        cS.set(c);
        if (animate === false || reduced()) {
          shownCut = c; placeCut(c); update(c); return;
        }
        cutAnim(tween(c0, c, { type: "spring", stiffness: 120, damping: 18 }, (v) => { shownCut = v; placeCut(v); }));
        update(c);
      }

      select(controls, "Variable", [
        ["head_schooling_years", "Schooling (years)"],
        ["household_size", "Household size"],
        ["head_age", "Age of the head"],
      ], (v) => {
        col = v;
        prepare();
        cS.input.min = cuts[0];
        cS.input.max = cuts[cuts.length - 1];
        drawStatic();
        const start = cuts[Math.floor(cuts.length * 0.25)];
        shownCut = start;
        moveTo(start, false);
      });
      prepare();
      const cS = slider(controls, {
        label: "Cut point (≤)", min: cuts[0], max: cuts[cuts.length - 1], step: 1, value: 4,
      }, (v) => moveTo(v));
      const bwrap = h("div", { class: "ml-buttons" });
      side.insertBefore(bwrap, controls.nextSibling);
      btn(bwrap, "Find the best cut", () => moveTo(best), "is-primary");

      // Drag the cut directly on the histogram.
      let dragging = false;
      const toCut = (ev) => {
        const rct = hp.svg.getBoundingClientRect();
        const px = ((ev.clientX - rct.left) / rct.width) * hp.w;
        return Math.max(cuts[0], Math.min(cuts[cuts.length - 1], Math.round(hp.ix(px) - 0.5)));
      };
      hp.svg.addEventListener("pointerdown", (ev) => { dragging = true; hp.svg.setPointerCapture(ev.pointerId); moveTo(toCut(ev)); });
      hp.svg.addEventListener("pointermove", (ev) => {
        if (!dragging) return;
        const c = toCut(ev);
        if (c !== cS.get()) { cS.set(c); shownCut = c; placeCut(c); update(c); }
      });
      ["pointerup", "pointercancel"].forEach((e) => hp.svg.addEventListener(e, () => { dragging = false; }));

      drawStatic();
      shownCut = 4;
      placeCut(4);
      update(4);
      onVisible(root, () => {
        fx(barsG, { opacity: [0, 1] }, { duration: 0.45 });
        fx(curve, { opacity: [0, 1] }, { duration: 0.45, delay: 0.15 });
      });
    }).catch((e) => fail(root, e));
  };

  /* ========================================================================
     Session 6 · 2 — How deep? Train vs CV AUC, and the real tree
     ======================================================================== */
  WIDGETS["tree-depth"] = function (root) {
    header(root, "How deep should the tree grow?",
      "Each level asks one more question and doubles the number of groups. The curves are the real train and " +
      "cross-validated AUC of trees of each depth; the outline below is the actual tree fitted on the training " +
      "households (first three levels).");

    Promise.all([load("s06_depth.json"), load("s06_race.json")]).then(([d, race]) => {
      const logitCV = race.find((r) => r.model.startsWith("Logit")).cv;
      const wrap = h("div", { class: "ml-grid-2" });
      root.append(wrap);
      const main = h("div", {});
      const side = h("div", {});
      wrap.append(main, side);

      const p = plot(main, 520, 250, { l: 46, b: 38, t: 16 }, "Train and cross-validated AUC against tree depth");
      p.domain([1, 12], [0.6, 1.0]);
      p.axes({ xt: d.depth, yt: [0.6, 0.7, 0.8, 0.9, 1.0], yfmt: (v) => v.toFixed(1), xl: "max_depth", yl: "AUC" });
      el("line", { x1: p.m.l, x2: p.w - p.m.r, y1: p.y(logitCV), y2: p.y(logitCV), class: "ml-baseline" }, p.svg);
      text(p.svg, p.w - p.m.r, p.y(logitCV) + 13, `logit, CV ${logitCV.toFixed(3)}`, { class: "muted ml-svg-small", "text-anchor": "end" });
      const trainPath = el("path", { class: "ml-line-train", d: pathD(d.depth.map((x, i) => [p.x(x), p.y(d.train[i])])) }, p.svg);
      const cvPath = el("path", { class: "ml-line-test", d: pathD(d.depth.map((x, i) => [p.x(x), p.y(d.cv[i])])) }, p.svg);
      text(p.svg, p.x(10.6), p.y(d.train[9]) - 8, "train", { class: "ml-lab-train" });
      text(p.svg, p.x(9.4), p.y(d.cv[8]) + 16, "cross-validation", { class: "ml-lab-test" });
      const mk = el("line", { y1: p.m.t, y2: p.h - p.m.b, class: "ml-marker" }, p.svg);
      const dTrain = el("circle", { r: 4, class: "ml-marker-dot" }, p.svg);
      const dCV = el("circle", { r: 4.5, class: "ml-marker-dot" }, p.svg);

      const controls = h("div", { class: "ml-controls" });
      side.append(controls);
      const st = stats(side, [
        { k: "train", label: "Train AUC", cls: "is-train" },
        { k: "cv", label: "CV AUC", cls: "is-test" },
        { k: "groups", label: "Groups (max)" },
      ]);
      const note = h("p", { class: "ml-note" });
      side.append(note);

      // The outline of the fitted tree.
      const outline = h("div", { class: "ml6-tree", role: "tree", "aria-label": "Fitted decision tree, first three levels" });
      root.append(outline);
      const extra = h("p", { class: "ml-honest" });
      root.append(extra);
      const byId = {};
      d.tree.forEach((n) => { byId[n.id] = n; });
      const rows = d.tree.map((n) => {
        const q = h("span", { class: "ml6-q" }, n.q || "");
        const leaf = h("span", { class: "ml6-leaf" }, "");
        const branch = n.branch ? h("span", { class: "ml6-branch ml6-branch-" + n.branch }, n.branch) : h("span", { class: "ml6-branch ml6-root" }, "all");
        const row = h("div", { class: "ml6-node", role: "treeitem", style: `--depth:${n.depth}` },
          branch,
          h("span", { class: "ml6-stat" }, `${thousands(n.n)} · `, h("strong", {}, pct(n.poor, 0)), " poor"),
          q, leaf);
        row.style.background = tint(n.poor);
        outline.append(row);
        return { n, row, q, leaf };
      });

      let shownD = 1;
      const mAnim = channel();
      function place(dv) {
        const x = p.x(dv);
        const i = Math.min(11, Math.max(0, Math.round(dv) - 1));
        mk.setAttribute("x1", x); mk.setAttribute("x2", x);
        dTrain.setAttribute("cx", x); dTrain.setAttribute("cy", p.y(d.train[i]));
        dCV.setAttribute("cx", x); dCV.setAttribute("cy", p.y(d.cv[i]));
      }
      function showTree(depth, animate) {
        const vis = Math.min(depth, 3);
        let k = 0;
        rows.forEach(({ n, row, q, leaf }) => {
          const on = n.depth <= vis;
          const wasOn = row.style.display !== "none";
          row.style.display = on ? "" : "none";
          const isLeaf = n.depth === vis || !n.q;
          q.style.display = isLeaf ? "none" : "";
          leaf.textContent = isLeaf ? (n.poor >= 0.35 ? "→ high-risk group" : n.poor <= 0.1 ? "→ low-risk group" : "") : "";
          leaf.classList.toggle("is-low", isLeaf && n.poor <= 0.1);
          if (on && !wasOn && animate) fx(row, { opacity: [0, 1], transform: ["translateX(-10px)", "translateX(0)"] }, { duration: 0.3, delay: 0.04 * k++ });
        });
        extra.textContent = depth > 3
          ? `Levels 4–${depth} are not drawn: at depth ${depth} the tree can split the households into up to ${thousands(2 ** depth)} groups. ` +
            `Each group gets smaller, and its poverty share noisier.`
          : "Each row is a group of training households: how many, and what share are poor. Read a path from the top: it is a rule anyone can apply.";
      }
      function update(depth, animate) {
        const i = depth - 1;
        st.set("train", f(d.train[i]));
        st.set("cv", f(d.cv[i]));
        st.set("groups", thousands(2 ** depth));
        const bestI = d.cv.indexOf(Math.max(...d.cv));
        note.className = "ml-note" + (depth >= 9 ? " is-warn" : "");
        note.textContent = depth <= 2
          ? `Depth ${depth}: too few questions. Train and CV agree, but both are low: the tree underfits.`
          : i === bestI
            ? `Depth ${depth} has the best CV AUC (${f(d.cv[i])}), and it is still below the logit (${f(logitCV)}).`
            : depth >= 9
              ? `Depth ${depth}: train AUC ${f(d.train[i])}, CV ${f(d.cv[i])}. The tree is memorising the training households.`
              : `Depth ${depth}: the gap between train and CV is ${f(d.train[i] - d.cv[i])}. Watch it grow.`;
        mAnim(tween(shownD, depth, SPRING, (v) => { shownD = v; place(v); }));
        showTree(depth, animate !== false);
      }
      slider(controls, { label: "max_depth", min: 1, max: 12, step: 1, value: 1 }, (v) => update(v));

      place(1);
      update(1, false);
      onVisible(root, () => {
        [trainPath, cvPath].forEach((pth, j) => {
          const len = pth.getTotalLength ? pth.getTotalLength() : 600;
          pth.style.strokeDasharray = len;
          fx(pth, { strokeDashoffset: [len, 0] }, { duration: 0.8, delay: j * 0.2 });
        });
      });
    }).catch((e) => fail(root, e));
  };

  /* ========================================================================
     Session 6 · 3 — A forest votes
     ======================================================================== */
  WIDGETS["forest-vote"] = function (root) {
    header(root, "300 trees vote on one household",
      "Each tree of the random forest saw a different bootstrap sample, so each gives its own probability that " +
      "the household is poor (one dot per tree). The forest's answer is their average. Grow the forest and watch " +
      "the average settle while the individual trees keep disagreeing.");

    Promise.all([load("s06_forest.json"), load("s06_race.json")]).then(([d, race]) => {
      const thr = race.find((r) => r.model === "Random forest").threshold;
      const pick = h("div", { class: "ml-buttons", role: "group", "aria-label": "Choose a household" });
      root.append(pick);
      const desc = h("p", { class: "ml-sub ml6-desc" });
      root.append(desc);

      const wrap = h("div", { class: "ml-grid-2" });
      root.append(wrap);
      const main = h("div", {});
      const side = h("div", {});
      wrap.append(main, side);

      const sp = plot(main, 520, 170, { l: 20, r: 20, b: 36, t: 22 }, "Probability of being poor given by each tree, and their average");
      sp.domain([0, 1], [0, 1]);
      sp.axes({ xt: [0, 0.2, 0.4, 0.6, 0.8, 1], xfmt: (v) => v.toFixed(1), xl: "probability that the household is poor (one dot = one tree)" });
      const thrLine = el("line", { x1: sp.x(thr), x2: sp.x(thr), y1: sp.m.t, y2: sp.h - sp.m.b, class: "ml-cheap" }, sp.svg);
      text(sp.svg, sp.x(thr) + 4, sp.m.t + 2, `subsidy threshold ${thr.toFixed(2)}`, { class: "ml-lab-cheap ml-svg-small" });
      const dotsG = el("g", {}, sp.svg);
      const avgLine = el("line", { y1: sp.m.t + 8, y2: sp.h - sp.m.b, class: "ml-threshold" }, sp.svg);
      const avgLab = text(sp.svg, 0, sp.m.t + 6, "", { class: "ml-svg-label", "text-anchor": "middle" });

      const cp = plot(main, 520, 150, { l: 46, b: 34, t: 14 }, "Running average of the trees' probabilities against the number of trees");
      cp.domain([1, 300], [0, 1]);
      cp.axes({ xt: [1, 50, 100, 150, 200, 250, 300], yt: [0, 0.5, 1], yfmt: (v) => v.toFixed(1), xl: "number of trees averaged" });
      const runPath = el("path", { class: "ml-line-model", d: "" }, cp.svg);
      const thrC = el("line", { x1: cp.m.l, x2: cp.w - cp.m.r, class: "ml-cheap" }, cp.svg);

      const controls = h("div", { class: "ml-controls" });
      side.append(controls);
      const bw = h("div", { class: "ml-buttons" });
      side.append(bw);
      const st = stats(side, [
        { k: "n", label: "Trees" },
        { k: "avg", label: "Forest average", cls: "is-test" },
        { k: "sd", label: "Spread of single trees" },
        { k: "dec", label: "Decision" },
      ]);
      const note = h("p", { class: "ml-note" });
      main.append(note);

      let H, dots = [], run = [], shownN = 0;
      const nAnim = channel();

      function choose(i) {
        H = d.households[i];
        [...pick.children].forEach((b, j) => b.setAttribute("aria-pressed", j === i ? "true" : "false"));
        desc.textContent = `${H.label}: ${H.desc}. Actually poor: ${H.poor ? "yes" : "no"}.`;
        dotsG.innerHTML = "";
        const jit = rng(5 + i);
        dots = H.votes.map((v) => el("circle", {
          cx: sp.x(v), cy: sp.y(0.12 + jit() * 0.62), r: 3, class: "ml-dot-pos", opacity: 0,
        }, dotsG));
        let s = 0;
        run = H.votes.map((v, j) => (s += v) / (j + 1));
        thrC.setAttribute("y1", cp.y(thr)); thrC.setAttribute("y2", cp.y(thr));
        shownN = 0;
        draw(0);
        nS.set(1);
        grow(300);
      }
      function draw(nf) {
        const n = Math.max(0, Math.min(300, Math.round(nf)));
        dots.forEach((c, j) => { c.setAttribute("opacity", j < n ? 0.55 : 0); });
        if (n === 0) {
          avgLine.style.opacity = 0; avgLab.textContent = ""; runPath.setAttribute("d", "");
          return;
        }
        const a = run[n - 1];
        avgLine.style.opacity = 1;
        avgLine.setAttribute("x1", sp.x(a)); avgLine.setAttribute("x2", sp.x(a));
        avgLab.setAttribute("x", Math.max(sp.m.l + 30, Math.min(sp.w - sp.m.r - 30, sp.x(a))));
        avgLab.textContent = `average ${a.toFixed(2)}`;
        runPath.setAttribute("d", pathD(run.slice(0, n).map((v, j) => [cp.x(j + 1), cp.y(v)])));
        const sel = H.votes.slice(0, n);
        const m = sum(sel) / n;
        const sdv = Math.sqrt(sum(sel.map((v) => (v - m) ** 2)) / n);
        st.set("n", String(n));
        st.set("avg", a.toFixed(3));
        st.set("sd", n > 1 ? sdv.toFixed(2) : "—");
        st.set("dec", a >= thr ? "subsidy" : "no subsidy");
      }
      function grow(n) {
        const n0 = shownN;
        const dur = reduced() ? 0 : Math.min(3, 0.6 + Math.abs(n - n0) / 120);
        nAnim(tween(n0, n, { duration: dur, ease: "linear" }, (v) => { shownN = v; draw(v); nS.set(Math.max(1, Math.round(v))); }));
        const lo = Math.min(...H.votes), hi = Math.max(...H.votes);
        note.textContent = `Single trees range from ${lo.toFixed(2)} to ${hi.toFixed(2)} for this household, ` +
          `yet the average of 300 trees is ${H.forest.toFixed(3)}. Averaging many noisy, different trees cancels ` +
          `much of their noise: that is why the forest beats any single tree.`;
      }

      d.households.forEach((hh, i) => {
        const b = btn(pick, hh.label, () => choose(i));
        b.setAttribute("aria-pressed", "false");
        b.classList.add("ml6-toggle");
      });
      const nS = slider(controls, { label: "Trees averaged", min: 1, max: 300, step: 1, value: 300 }, (v) => {
        nAnim({ stop() {} });
        shownN = v; draw(v);
      });
      btn(bw, "▶ Grow the forest again", () => { shownN = 0; draw(0); grow(300); }, "is-primary");

      H = d.households[0];
      let started = false;
      onVisible(root, () => { if (!started) { started = true; choose(0); } });
      // Draw a static state immediately for readers who never scroll it into view.
      desc.textContent = `${H.label}: ${H.desc}. Actually poor: ${H.poor ? "yes" : "no"}.`;
    }).catch((e) => fail(root, e));
  };

  /* ========================================================================
     Session 6 · 4 — The race: four models on the same folds
     ======================================================================== */
  WIDGETS["model-race"] = function (root) {
    header(root, "Four models, same folds, same test set",
      "Cross-validated AUC (bar, with ± one standard deviation across the 5 folds) and test AUC (dot), or the " +
      "policy cost 3·FN + FP on the test set at each model's own threshold, chosen on the training folds.");

    load("s06_race.json").then((race) => {
      const bw = h("div", { class: "ml-buttons", role: "group", "aria-label": "Metric" });
      root.append(bw);
      const sw = (inner) => {
        const s = el("svg", { viewBox: "0 0 26 12", "aria-hidden": "true" });
        inner(s);
        return s;
      };
      const legend = h("div", { class: "ml6-legend" },
        h("span", {}, sw((s) => el("rect", { x: 0, y: 2, width: 26, height: 8, rx: 2, class: "ml-fill" }, s)), "bar: CV mean (5 folds)"),
        h("span", {}, sw((s) => el("line", { x1: 2, x2: 24, y1: 6, y2: 6, class: "ml6-whisker" }, s)), "line: ± 1 sd across folds"),
        h("span", {}, sw((s) => el("circle", { cx: 13, cy: 6, r: 4.5, class: "ml-marker-dot" }, s)), "dot: test AUC"));
      root.append(legend);
      const p = plot(root, 560, 52 + race.length * 64, { l: 16, r: 64, t: 10, b: 34 }, "Model comparison");
      const axesG = el("g", {}, p.svg);
      const barsG = el("g", {}, p.svg);
      const table = h("table", { class: "ml6-table" });
      root.append(h("div", { class: "ml6-table-wrap" }, table));
      const note = h("p", { class: "ml-note" });
      root.append(note);
      table.append(h("thead", {}, h("tr", {}, ["Model", "Threshold", "Recall", "Precision", "Cost"].map((t) => h("th", {}, t)))));
      const tb = h("tbody", {});
      race.forEach((r) => tb.append(h("tr", {},
        h("td", {}, r.model), h("td", {}, r.threshold.toFixed(2)), h("td", {}, pct(r.recall)),
        h("td", {}, pct(r.precision)), h("td", {}, thousands(r.cost)))));
      table.append(tb);

      const rowH = 64;
      const y0 = (i) => p.m.t + i * rowH + 8;
      let metric = "auc";
      let lastMetric = null;
      const items = race.map((r, i) => {
        text(p.svg, p.m.l, y0(i) + 4, r.model, { class: "ml-svg-label" });
        const bar = el("rect", { x: p.m.l, y: y0(i) + 10, height: 20, width: 0, rx: 4, class: "ml-fill" }, barsG);
        const whisk = el("line", { y1: y0(i) + 20, y2: y0(i) + 20, class: "ml6-whisker" }, barsG);
        const dot = el("circle", { cy: y0(i) + 20, r: 5, class: "ml-marker-dot" }, barsG);
        const val = text(p.svg, 0, y0(i) + 24, "", { class: "ml-svg-label" });
        // Under the bar: both numbers, named, so the dot is never read as the CV mean.
        const sub = text(p.svg, p.m.l, y0(i) + 46, "", { class: "ml-svg-small" });
        if (r.model.startsWith("Logit")) bar.classList.add("is-muted");
        return { r, bar, whisk, dot, val, sub };
      });
      const shown = items.map(() => 0);
      const anims = items.map(() => channel());

      function render(animate) {
        axesG.innerHTML = "";
        const auc = metric === "auc";
        if (auc) p.domain([0.7, 0.84], [0, 1]); else p.domain([1300, 1600], [0, 1]);
        const xt = auc ? [0.7, 0.74, 0.78, 0.82] : [1300, 1400, 1500, 1600];
        axesG.append(p.axes({ xt, xfmt: auc ? (v) => v.toFixed(2) : thousands, xl: auc ? "AUC (higher is better)" : "policy cost 3·FN + FP on the test set (lower is better)" }));
        items.forEach((it, i) => {
          const target = auc ? it.r.cv : it.r.cost;
          const from = shown[i] || p.xd[0];
          const start = metric === lastMetric ? from : p.xd[0];
          // Whisker, dot and labels fade in as the bar arrives, so they never sit apart from it.
          const marks = [it.whisk, it.dot, it.val, it.sub];
          const drawBar = (v) => {
            shown[i] = v;
            it.bar.setAttribute("width", Math.max(0, p.x(v) - p.m.l));
            it.val.setAttribute("x", p.x(Math.max(v, auc ? it.r.cv + it.r.sd : v, auc ? it.r.test : v)) + 10);
            const k = target === start ? 1 : Math.max(0, Math.min(1, (v - start) / (target - start)));
            const o = String(Math.max(0, (k - 0.7) / 0.3));
            marks.forEach((m) => { m.style.opacity = o; });
          };
          it.val.textContent = auc ? "" : thousands(it.r.cost);
          it.sub.textContent = auc ? `CV ${it.r.cv.toFixed(3)} ± ${it.r.sd.toFixed(3)} · test ${it.r.test.toFixed(3)}` : "";
          it.whisk.style.display = auc ? "" : "none";
          it.dot.style.display = auc ? "" : "none";
          if (auc) {
            it.whisk.setAttribute("x1", p.x(it.r.cv - it.r.sd)); it.whisk.setAttribute("x2", p.x(it.r.cv + it.r.sd));
            it.dot.setAttribute("cx", p.x(it.r.test));
          }
          if (animate === false) drawBar(target);
          else anims[i](tween(start, target, { duration: 0.7, delay: i * 0.15 }, drawBar));
        });
        lastMetric = metric;
        const lg = race[0], rf = race.find((r) => r.model === "Random forest"), gb = race.find((r) => r.model === "Gradient boosting");
        note.textContent = auc
          ? `The ensembles gain about ${(gb.cv - lg.cv).toFixed(2)} of CV AUC over the logit; the depth-4 tree loses ${(lg.cv - race[1].cv).toFixed(2)}. Dots are test AUC.`
          : `At each model's own threshold, the forest and boosting cut the policy cost from ${thousands(lg.cost)} to about ${thousands(Math.round((rf.cost + gb.cost) / 2))}, ` +
            `roughly ${Math.round(100 * (1 - (rf.cost + gb.cost) / 2 / lg.cost))}% less.`;
      }
      const bA = btn(bw, "AUC", () => { metric = "auc"; bA.setAttribute("aria-pressed", "true"); bC.setAttribute("aria-pressed", "false"); render(); });
      const bC = btn(bw, "Policy cost", () => { metric = "cost"; bC.setAttribute("aria-pressed", "true"); bA.setAttribute("aria-pressed", "false"); render(); });
      [bA, bC].forEach((b) => b.classList.add("ml6-toggle"));
      bA.setAttribute("aria-pressed", "true");
      bC.setAttribute("aria-pressed", "false");
      metric = "auc";
      // Initial axes without bars, then the race starts when the widget is seen.
      p.domain([0.7, 0.84], [0, 1]);
      axesG.append(p.axes({ xt: [0.7, 0.74, 0.78, 0.82], xfmt: (v) => v.toFixed(2), xl: "AUC (higher is better)" }));
      items.forEach((it) => { it.whisk.style.display = "none"; it.dot.style.display = "none"; });
      onVisible(root, () => render());
    }).catch((e) => fail(root, e));
  };

  mountAll();
})();
