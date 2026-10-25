/* ==========================================================================
   ml-widgets.js — Interactive widgets for Machine Learning — EGEI

   Each <div class="ml-widget" data-widget="name"></div> in the Markdown is
   mounted by WIDGETS[name]. Everything is drawn by hand in SVG; colours come
   from the CSS variables in ml-widgets.css, so light and dark mode both work.

   Motion (motion.dev, loaded globally as window.Motion) drives every
   transition: entries run once when the widget enters the viewport, slider
   updates use short springs, and prefers-reduced-motion shows the final state
   without animating.

   All numbers come from docs/data/widgets/*.json, exported by
   scripts/build_widget_data.py from the course dataset (CASEN 2022 sample),
   so the page matches what students reproduce in the session notebooks.

   Re-mounted on every page change via document$ (Material instant navigation).
   ========================================================================== */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const WIDGETS = {};

  /* ------------------------------------------------------------------------
     Motion helpers
     ------------------------------------------------------------------------ */
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE_OUT = [0.22, 1, 0.36, 1];
  const SPRING = { type: "spring", stiffness: 260, damping: 30 };

  /* Animates a number from `from` to `to`, calling onUpdate on every frame.
     Returns an object with stop(). Falls back to requestAnimationFrame if the
     Motion bundle failed to load. */
  function tween(from, to, opts, onUpdate, onComplete) {
    if (reduced()) {
      onUpdate(to);
      if (onComplete) onComplete();
      return { stop() {} };
    }
    const M = window.Motion;
    if (M && typeof M.animate === "function") {
      return M.animate(from, to, Object.assign({ duration: 0.35, ease: EASE_OUT }, opts, {
        onUpdate,
        onComplete,
      }));
    }
    const ms = ((opts && opts.duration) || 0.35) * 1000;
    const delay = ((opts && opts.delay) || 0) * 1000;
    let stopped = false;
    const t0 = performance.now() + delay;
    function frame(now) {
      if (stopped) return;
      const t = Math.max(0, Math.min(1, (now - t0) / ms));
      const k = 1 - (1 - t) ** 3;
      onUpdate(from + (to - from) * k);
      if (t < 1) requestAnimationFrame(frame);
      else if (onComplete) onComplete();
    }
    requestAnimationFrame(frame);
    return { stop() { stopped = true; } };
  }

  /* Animates an element's CSS (opacity/transform) with Motion; no-op if reduced. */
  function fx(node, keyframes, opts) {
    const M = window.Motion;
    if (reduced() || !M || typeof M.animate !== "function") {
      for (const k in keyframes) {
        const v = keyframes[k];
        node.style[k] = Array.isArray(v) ? v[v.length - 1] : v;
      }
      return { stop() {} };
    }
    return M.animate(node, keyframes, Object.assign({ duration: 0.35, ease: EASE_OUT }, opts));
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms));

  /* Runs fn once, the first time the node is at least 30% visible. */
  function onVisible(node, fn) {
    if (reduced() || !("IntersectionObserver" in window)) {
      fn();
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        fn();
      }
    }, { threshold: 0.3 });
    io.observe(node);
  }

  /* A handle that keeps only the latest running animation of a widget part. */
  function channel() {
    let current = null;
    return (anim) => {
      if (current) current.stop();
      current = anim;
      return anim;
    };
  }

  const lerp = (a, b, k) => a + (b - a) * k;
  const lerpArr = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));

  /* ------------------------------------------------------------------------
     Numbers
     ------------------------------------------------------------------------ */
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const mean = (a) => sum(a) / a.length;
  // Population sd (ddof=0), the same as numpy's scores.std() in the session notebooks.
  const sd = (a) => {
    const m = mean(a);
    return Math.sqrt(sum(a.map((v) => (v - m) ** 2)) / a.length);
  };
  const rmse = (y, yhat) => Math.sqrt(mean(y.map((v, i) => (v - yhat[i]) ** 2)));
  const f = (v, d = 3) => (Number.isFinite(v) ? v.toFixed(d) : "—");
  const pct = (v, d = 1) => (Number.isFinite(v) ? (100 * v).toFixed(d) + "%" : "—");
  const thousands = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  /* Reproducible pseudo-random numbers (mulberry32), used only for jitter. */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------------------
     Data loading (cached per page load)
     ------------------------------------------------------------------------ */
  const cache = {};
  function load(file) {
    const base = typeof __md_scope !== "undefined" ? __md_scope : new URL(".", location);
    const url = new URL("data/widgets/" + file, base).href;
    if (!cache[url]) {
      cache[url] = fetch(url).then((r) => {
        if (!r.ok) throw new Error(file + ": HTTP " + r.status);
        return r.json();
      });
    }
    return cache[url];
  }

  /* ------------------------------------------------------------------------
     HTML helpers
     ------------------------------------------------------------------------ */
  function h(tag, attrs, ...children) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === "class") e.className = attrs[k];
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    children.flat().forEach((c) => e.append(c instanceof Node ? c : document.createTextNode(c)));
    return e;
  }

  function header(root, title, sub) {
    root.append(h("div", { class: "ml-title" }, h("span", { class: "ml-chip" }, "Interactive"), title));
    if (sub) root.append(h("p", { class: "ml-sub" }, sub));
  }

  function slider(parent, o, onInput) {
    const fmt = o.fmt || ((v) => v);
    const out = h("output", {}, fmt(o.value));
    const inp = h("input", {
      type: "range", min: o.min, max: o.max, step: o.step, value: o.value, "aria-label": o.label,
    });
    inp.addEventListener("input", () => {
      out.textContent = fmt(+inp.value);
      if (onInput) onInput(+inp.value);
    });
    const wrap = h("div", { class: "ml-control" }, h("label", {}, h("span", {}, o.label), out), inp);
    parent.append(wrap);
    return {
      get: () => +inp.value,
      set: (v) => { inp.value = v; out.textContent = fmt(+inp.value); },
      input: inp,
    };
  }

  function btn(parent, label, onClick, cls) {
    const b = h("button", { type: "button", class: "ml-btn " + (cls || "") }, label);
    b.addEventListener("click", onClick);
    parent.append(b);
    return b;
  }

  function stats(parent, defs) {
    const wrap = h("div", { class: "ml-stats" });
    const cells = {};
    defs.forEach((d) => {
      const strong = h("strong", {}, "—");
      cells[d.k] = strong;
      wrap.append(h("div", { class: "ml-stat " + (d.cls || "") }, h("span", {}, d.label), strong));
    });
    parent.append(wrap);
    return { set: (k, v) => { cells[k].textContent = v; }, cell: (k) => cells[k] };
  }

  /* ------------------------------------------------------------------------
     SVG helpers
     ------------------------------------------------------------------------ */
  /* Charts scale with their container, so a 10-unit label can render at 6px on a phone and ~8px
     in a desktop two-column layout. Whenever a chart is drawn below its design size, --ml-k
     enlarges its SVG text so the smallest class still renders at ~10.5px. Axis titles then make
     room: the x title moves down while the viewBox grows by the same amount, and the rotated
     y title moves left into the widget padding. Only on phone-width screens with a large k
     (.is-compact) is the y title dropped instead (the caption and aria-label still name it). */
  const MIN_TEXT_PX = 10.5;
  const narrow = window.matchMedia("(max-width: 600px)");

  function fitTitles(svg) {
    const k = +svg.dataset.k || 1;
    const extra = svg.dataset.vbh ? svg.viewBox.baseVal.height - +svg.dataset.vbh : 0;
    svg.querySelectorAll(".ml-xtitle").forEach((t) => {
      if (!t.dataset.y0) t.dataset.y0 = t.getAttribute("y");
      t.setAttribute("y", +t.dataset.y0 + extra);
    });
    svg.querySelectorAll(".ml-ytitle").forEach((t) => {
      if (!t.dataset.t0) t.dataset.t0 = t.getAttribute("transform") || "";
      // Park the title just left of its widest tick label (measured), never further right than drawn.
      let dx = 0;
      try {
        const ticks = [...t.parentNode.querySelectorAll(".ml-ytick")];
        if (ticks.length && k > 1) {
          const left = Math.min(...ticks.map((n) => n.getBBox().x));
          const fs = parseFloat(getComputedStyle(t).fontSize) || 11;
          dx = Math.max(0, Math.round(12 - (left - 0.75 * fs)));
        }
      } catch (e) { dx = 0; }
      t.setAttribute("transform", (dx ? `translate(${-dx} 0) ` : "") + t.dataset.t0);
    });
  }

  const textFit = typeof ResizeObserver !== "undefined" ? new ResizeObserver((entries) => {
    entries.forEach(({ target }) => {
      const vb = target.viewBox && target.viewBox.baseVal;
      const w = target.getBoundingClientRect().width;
      if (!vb || !vb.width || !w) return;
      const k = Math.min(1.9, Math.max(1, MIN_TEXT_PX / (10 * (w / vb.width))));
      target.style.setProperty("--ml-k", k.toFixed(3));
      target.dataset.k = k.toFixed(3);
      target.classList.toggle("is-compact", narrow.matches && k > 1.2);
      if (!target.dataset.vbh) target.dataset.vbh = vb.height;
      const hgt = +target.dataset.vbh + (k > 1.05 ? Math.round(10 * (k - 1)) : 0);
      if (vb.height !== hgt) target.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.width} ${hgt}`);
      fitTitles(target);
    });
  }) : null;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    if (tag === "svg" && textFit) textFit.observe(e);
    return e;
  }

  function text(parent, x, y, s, attrs) {
    const t = el("text", Object.assign({ x, y }, attrs || {}), parent);
    t.textContent = s;
    return t;
  }

  /* A plot area with linear scales and axes. */
  function plot(parent, w, hgt, margin, label) {
    const m = Object.assign({ l: 44, r: 12, t: 12, b: 36 }, margin || {});
    const svg = el("svg", { viewBox: `0 0 ${w} ${hgt}`, class: "ml-plot", role: "img", "aria-label": label });
    parent.append(svg);
    const p = { svg, w, h: hgt, m, xd: [0, 1], yd: [0, 1] };
    p.domain = (xd, yd) => { p.xd = xd; p.yd = yd; return p; };
    p.x = (v) => m.l + ((v - p.xd[0]) / (p.xd[1] - p.xd[0])) * (w - m.l - m.r);
    p.y = (v) => hgt - m.b - ((v - p.yd[0]) / (p.yd[1] - p.yd[0])) * (hgt - m.t - m.b);
    p.ix = (px) => p.xd[0] + ((px - m.l) / (w - m.l - m.r)) * (p.xd[1] - p.xd[0]);
    p.axes = (o) => {
      const g = el("g", { class: "ml-axes" }, svg);
      (o.yt || []).forEach((v) => {
        el("line", { x1: m.l, x2: w - m.r, y1: p.y(v), y2: p.y(v), class: "grid" }, g);
        text(g, m.l - 6, p.y(v) + 3.5, o.yfmt ? o.yfmt(v) : v, { "text-anchor": "end", class: "ml-ytick" });
      });
      (o.xt || []).forEach((v) => {
        text(g, p.x(v), hgt - m.b + 15, o.xfmt ? o.xfmt(v) : v, { "text-anchor": "middle" });
      });
      el("line", { x1: m.l, x2: w - m.r, y1: hgt - m.b, y2: hgt - m.b, class: "ax" }, g);
      if (o.xl) text(g, (m.l + w - m.r) / 2, hgt - 4, o.xl, { "text-anchor": "middle", class: "muted ml-xtitle" });
      if (o.yl) {
        text(g, 12, (m.t + hgt - m.b) / 2, o.yl, {
          "text-anchor": "middle", class: "muted ml-ytitle",
          transform: `rotate(-90 12 ${(m.t + hgt - m.b) / 2})`,
        });
      }
      fitTitles(svg);  // axes can be redrawn after the chart was resized; keep the title offsets
      return g;
    };
    return p;
  }

  const pathD = (pts) => pts.map((q, i) => (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)).join("");
  const range = (a, b, step) => {
    const out = [];
    for (let v = a; v <= b + 1e-9; v += step) out.push(+v.toFixed(6));
    return out;
  };

  /* Shows an error inside the widget instead of failing silently. */
  function fail(root, err) {
    console.error("ml-widgets:", root.dataset.widget, err);
    root.append(h("p", { class: "ml-note" }, "This interactive could not be loaded. Try reloading the page."));
  }

  /* ========================================================================
     Session 4 · 1 — KNN: choosing k
     ======================================================================== */
  WIDGETS["knn-k"] = function (root) {
    header(root, "KNN: how many neighbours?",
      "300 training and 100 test households from the course data. The line is the KNN prediction of " +
      "log income per capita from the head of household's years of schooling. Move k and watch both errors.");

    load("s04_knn.json").then((d) => {
      const jit = rng(11);
      const pts = d.x.map((x, i) => ({ x, y: d.y[i], test: d.test[i] === 1, jx: x + (jit() - 0.5) * 0.6 }));
      const train = pts.filter((q) => !q.test);
      const test = pts.filter((q) => q.test);

      // Training points sorted once; neighbours are the k closest by |x|, ties broken by order.
      const tx = train.map((q) => q.x);
      const ty = train.map((q) => q.y);
      const order = tx.map((_, i) => i);

      const xmin = Math.min(...d.x), xmax = Math.max(...d.x);
      const grid = range(xmin, xmax, 0.5);
      const K_MAX = 150;

      // Errors for every k, computed once (the curve in the small chart).
      const trainErr = [], testErr = [];
      const byX = {};
      const neighbours = (x0) => byX[x0] || (byX[x0] = order.slice()
        .sort((a, b) => Math.abs(tx[a] - x0) - Math.abs(tx[b] - x0) || a - b));
      const cum = (x0) => {
        const key = "c" + x0;
        if (byX[key]) return byX[key];
        const idx = neighbours(x0);
        const c = [0];
        idx.forEach((i) => c.push(c[c.length - 1] + ty[i]));
        return (byX[key] = c);
      };
      // Prediction for k neighbours = (sum of the k nearest y) / k, from cumulative sums.
      const predFast = (x0, k) => cum(x0)[k] / k;
      // A training household is its own nearest neighbour (distance 0), as in scikit-learn,
      // so it goes first among the ties at its x: k = 1 reproduces the training data exactly.
      const pos = tx.map((x0, i) => neighbours(x0).indexOf(i));
      const predTrain = (i, k) => (pos[i] < k ? cum(tx[i])[k] : cum(tx[i])[k - 1] + ty[i]) / k;
      for (let k = 1; k <= K_MAX; k++) {
        trainErr.push(rmse(ty, ty.map((_, i) => predTrain(i, k))));
        testErr.push(rmse(test.map((q) => q.y), test.map((q) => predFast(q.x, k))));
      }
      const bestK = testErr.indexOf(Math.min(...testErr)) + 1;

      const wrap = h("div", { class: "ml-grid-2" });
      root.append(wrap);
      const main = h("div", {});
      const side = h("div", {});
      wrap.append(main, side);

      const p = plot(main, 520, 300, { l: 44 }, "Scatter of schooling years against log income per capita with the KNN prediction line");
      const ylo = Math.floor(Math.min(...d.y) * 2) / 2, yhi = Math.ceil(Math.max(...d.y) * 2) / 2;
      p.domain([xmin - 1, xmax + 1], [ylo, yhi]);
      p.axes({ xt: range(0, 25, 5), yt: range(Math.ceil(ylo), yhi, 1), xl: "Head of household: years of schooling", yl: "log income p.c." });
      const dots = el("g", {}, p.svg);
      pts.forEach((q) => {
        el("circle", {
          cx: p.x(q.jx), cy: p.y(q.y), r: q.test ? 3.2 : 2.6,
          class: q.test ? "ml-dot-test" : "ml-dot-train",
        }, dots);
      });
      const line = el("path", { class: "ml-line-model", d: "" }, p.svg);

      const leg = el("g", { class: "ml-legend" }, p.svg);
      el("circle", { cx: 60, cy: 20, r: 3, class: "ml-dot-train" }, leg);
      text(leg, 68, 23.5, "train");
      el("circle", { cx: 112, cy: 20, r: 3.2, class: "ml-dot-test" }, leg);
      text(leg, 120, 23.5, "test");

      // Small chart: error against k.
      const sp = plot(side, 260, 190, { l: 40, b: 34, t: 20 }, "Training and test error against k");
      // Train error falls to 0 at k = 1; the axis starts near the test errors and clips below,
      // so the U-shape of the test curve stays readable.
      const emax = Math.max(...testErr) + 0.02;
      const emin = Math.floor((Math.min(...testErr, ...trainErr.slice(5)) - 0.03) * 20) / 20;
      sp.domain([1, K_MAX], [emin, emax]);
      sp.axes({ xt: [1, 50, 100, 150], yt: range(Math.ceil(emin * 20) / 20, emax, 0.05), yfmt: (v) => v.toFixed(2), xl: "k" });
      const clipId = "ml-clip-" + Math.random().toString(36).slice(2, 8);
      el("rect", { x: sp.m.l, y: sp.m.t, width: sp.w - sp.m.l - sp.m.r, height: sp.h - sp.m.t - sp.m.b },
        el("clipPath", { id: clipId }, el("defs", {}, sp.svg)));
      const clipped = el("g", { "clip-path": `url(#${clipId})` }, sp.svg);
      el("path", { class: "ml-line-train", d: pathD(trainErr.map((e, i) => [sp.x(i + 1), sp.y(e)])) }, clipped);
      el("path", { class: "ml-line-test", d: pathD(testErr.map((e, i) => [sp.x(i + 1), sp.y(e)])) }, clipped);
      text(sp.svg, sp.w - sp.m.r, 12, "test RMSE", { "text-anchor": "end", class: "ml-lab-test" });
      text(sp.svg, sp.m.l + 4, 12, "train RMSE", { class: "ml-lab-train" });
      const kLine = el("line", { y1: sp.m.t, y2: sp.h - sp.m.b, class: "ml-marker" }, sp.svg);
      const kDot = el("circle", { r: 4, class: "ml-marker-dot" }, sp.svg);

      const controls = h("div", { class: "ml-controls" });
      side.append(controls);
      const st = stats(side, [
        { k: "train", label: "Train RMSE", cls: "is-train" },
        { k: "test", label: "Test RMSE", cls: "is-test" },
      ]);
      const note = h("p", { class: "ml-note" });
      side.append(note);

      let shown = grid.map(() => mean(ty));
      const lineAnim = channel();
      const markAnim = channel();
      let kShown = 1;

      function drawLine(vals) {
        line.setAttribute("d", pathD(grid.map((x, i) => [p.x(x), p.y(vals[i])])));
      }
      function drawMarker(kf) {
        const k = Math.max(1, Math.min(K_MAX, kf));
        const i = Math.round(k) - 1;
        kLine.setAttribute("x1", sp.x(k));
        kLine.setAttribute("x2", sp.x(k));
        kDot.setAttribute("cx", sp.x(k));
        kDot.setAttribute("cy", sp.y(testErr[i]));
      }
      function update(k, animate) {
        const target = grid.map((x) => predFast(x, k));
        const from = shown.slice();
        const run = (kk) => { shown = lerpArr(from, target, kk); drawLine(shown); };
        if (animate === false) run(1);
        else lineAnim(tween(0, 1, SPRING, run));
        const k0 = kShown;
        markAnim(tween(k0, k, SPRING, (v) => { kShown = v; drawMarker(v); }));
        st.set("train", f(trainErr[k - 1]));
        st.set("test", f(testErr[k - 1]));
        note.textContent = k <= 3
          ? `k = ${k}: the line chases individual households. Train error is low, test error is the worst — it memorises.`
          : k >= 120
            ? `k = ${k}: each prediction averages a large share of the data, so the curve flattens and starts ignoring schooling.`
            : `k = ${k}. On these 100 test households the error is lowest around k = ${bestK}. Choosing k by peeking at the test set is exactly what cross-validation replaces.`;
      }

      const kS = slider(controls, { label: "k (neighbours)", min: 1, max: K_MAX, step: 1, value: 1 }, (v) => update(v));
      drawLine(shown);
      drawMarker(1);
      st.set("train", f(trainErr[0]));
      st.set("test", f(testErr[0]));
      onVisible(root, () => {
        fx(dots, { opacity: [0, 1] }, { duration: 0.45 });
        update(kS.get());
      });
    }).catch((e) => fail(root, e));
  };

  /* ========================================================================
     Session 4 · 2 — Scale, then split vs split, then scale
     ======================================================================== */
  WIDGETS["split-first"] = function (root) {
    header(root, "Which rows does the scaler see?",
      "A scaler learns a mean and a standard deviation from the data it is fitted on. Fit it before the " +
      "split and the test rows have already shaped it. Play both orders.");

    const N = 40, NT = 10;
    const W = 520, H = 250;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "ml-plot", role: "img", "aria-label": "Animated rows flowing into a scaler" });
    const bar = h("div", { class: "ml-buttons" });
    root.append(bar, svg);

    // Rows start as a 8×5 block on the left.
    const home = (i) => [32 + (i % 8) * 18, 60 + Math.floor(i / 8) * 18];
    const r0 = rng(5);
    const testIdx = new Set();
    while (testIdx.size < NT) testIdx.add(Math.floor(r0() * N));

    text(svg, 95, 34, "Data (rows)", { "text-anchor": "middle", class: "ml-svg-label" });
    const trainBox = el("rect", { x: 200, y: 44, width: 120, height: 110, rx: 8, class: "ml-box" }, svg);
    text(svg, 260, 34, "Train", { "text-anchor": "middle", class: "ml-svg-label" });
    const testBox = el("rect", { x: 200, y: 172, width: 120, height: 60, rx: 8, class: "ml-box ml-box-test" }, svg);
    text(svg, 260, 247, "Test", { "text-anchor": "middle", class: "ml-svg-label" });
    const scaler = el("rect", { x: 372, y: 64, width: 128, height: 150, rx: 10, class: "ml-scaler" }, svg);
    text(svg, 436, 52, "StandardScaler.fit()", { "text-anchor": "middle", class: "ml-svg-label ml-mono" });
    const sTxt1 = text(svg, 436, 156, "mean, sd from", { "text-anchor": "middle", class: "ml-svg-small" });
    const sTxt2 = text(svg, 436, 178, "— rows", { "text-anchor": "middle", class: "ml-svg-big" });
    const sTxt3 = text(svg, 436, 198, "", { "text-anchor": "middle", class: "ml-svg-small ml-warn-text" });
    void trainBox; void testBox; void scaler; void sTxt1;

    const dots = [];
    for (let i = 0; i < N; i++) {
      const [x, y] = home(i);
      dots.push({ el: el("circle", { cx: x, cy: y, r: 6, class: "ml-row" }, svg), x, y, test: testIdx.has(i) });
    }
    const slotTrain = (j) => [214 + (j % 6) * 18, 62 + Math.floor(j / 6) * 18];
    const slotTest = (j) => [214 + (j % 6) * 18, 190 + Math.floor(j / 6) * 18];
    const slotScaler = (j) => [386 + (j % 7) * 16, 80 + Math.floor(j / 7) * 10];

    const verdict = h("div", { class: "ml-note" });
    root.append(verdict);

    const anims = [];
    function stopAll() { anims.splice(0).forEach((a) => a.stop()); }
    function move(dot, to, delay, dur) {
      const fx0 = dot.x, fy0 = dot.y;
      return new Promise((res) => {
        anims.push(tween(0, 1, { duration: dur || 0.4, delay: reduced() ? 0 : delay || 0, ease: EASE_OUT }, (k) => {
          dot.x = lerp(fx0, to[0], k);
          dot.y = lerp(fy0, to[1], k);
          dot.el.setAttribute("cx", dot.x);
          dot.el.setAttribute("cy", dot.y);
        }, res));
      });
    }
    function reset() {
      stopAll();
      dots.forEach((d, i) => {
        [d.x, d.y] = home(i);
        d.el.setAttribute("cx", d.x);
        d.el.setAttribute("cy", d.y);
        d.el.setAttribute("class", "ml-row");
        d.el.style.opacity = 1;
      });
      sTxt2.textContent = "— rows";
      sTxt3.textContent = "";
      verdict.className = "ml-note";
      verdict.textContent = "";
    }

    // Each dot that goes to the scaler leaves a ghost behind and the ghost flies in.
    function feedScaler(list, delayStep) {
      const ghosts = list.map((d, j) => {
        const g = { el: el("circle", { cx: d.x, cy: d.y, r: 3, class: "ml-row-ghost" + (d.test ? " is-test" : "") }, svg), x: d.x, y: d.y };
        return move(g, slotScaler(j), j * delayStep, 0.45);
      });
      return Promise.all(ghosts);
    }
    function clearGhosts() { svg.querySelectorAll(".ml-row-ghost").forEach((n) => n.remove()); }

    async function split(step) {
      let a = 0, b = 0;
      const ps = dots.map((d) => {
        const to = d.test ? slotTest(b++) : slotTrain(a++);
        if (d.test) d.el.setAttribute("class", "ml-row is-test");
        return move(d, to, (a + b) * step, 0.42);
      });
      await Promise.all(ps);
    }

    let running = 0;
    async function play(mode) {
      const my = ++running;
      reset();
      clearGhosts();
      await wait(150);
      if (mode === "wrong") {
        // Fit the scaler on everything, then split.
        dots.forEach((d) => { if (d.test) d.el.setAttribute("class", "ml-row is-test is-early"); });
        await feedScaler(dots, 0.025);
        if (my !== running) return;
        sTxt2.textContent = `${N} rows`;
        sTxt3.textContent = `${NT} of them are test rows`;
        await wait(250);
        await split(0.015);
        if (my !== running) return;
        verdict.className = "ml-note is-warn";
        verdict.textContent = `The ${NT} test rows helped set the mean and sd before the model ever saw them, ` +
          "so the test score is no longer computed on truly unseen data.";
      } else {
        await split(0.015);
        if (my !== running) return;
        await wait(200);
        await feedScaler(dots.filter((d) => !d.test), 0.025);
        if (my !== running) return;
        sTxt2.textContent = `${N - NT} rows`;
        sTxt3.textContent = "";
        verdict.className = "ml-note is-ok";
        verdict.textContent = "The scaler only learns from the training rows. The test rows are transformed " +
          "with that mean and sd, as new households would be in production.";
      }
      const honest = h("p", { class: "ml-honest" },
        h("strong", {}, "How much does it matter here? "),
        "On the course data (15,000 households, KNN with k = 100) the test RMSE is 0.582 both ways: with " +
        "this many rows a mean and a standard deviation barely move. The habit still matters, because " +
        "other steps — imputers, encoders, feature selection — learn far more from the data and leak much more.");
      verdict.append(honest);
    }

    btn(bar, "▶ Scale, then split", () => play("wrong"), "is-warn");
    btn(bar, "▶ Split, then scale", () => play("right"), "is-primary");
    btn(bar, "Reset", () => { running++; reset(); clearGhosts(); });

    onVisible(root, () => {
      dots.forEach((d, i) => fx(d.el, { opacity: [0, 1] }, { duration: 0.3, delay: i * 0.008 }));
    });
  };

  /* ========================================================================
     Session 4 · 3 — k-fold cross-validation
     ======================================================================== */
  WIDGETS["kfold"] = function (root) {
    header(root, "5-fold cross-validation",
      "The training data is cut into five folds. Each fold takes one turn as the validation set while the " +
      "other four train the model. Five scores instead of one — and their spread tells you how much is luck.");

    load("s04_cv.json").then((d) => {
      const ks = Object.keys(d.folds).map(Number).sort((a, b) => a - b);
      const controls = h("div", { class: "ml-controls" });
      const bar = h("div", { class: "ml-buttons" });
      root.append(controls, bar);

      const sel = h("select", { "aria-label": "Number of neighbours k" });
      ks.forEach((k) => {
        const o = h("option", { value: k }, `k = ${k}`);
        if (k === 100) o.selected = true;
        sel.append(o);
      });
      controls.append(h("div", { class: "ml-control" }, h("label", {}, h("span", {}, "KNN model")), sel));

      const W = 520, H = 290;
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "ml-plot", role: "img", "aria-label": "Five folds and their validation RMSE" });
      root.append(svg);

      // Folds as horizontal strips.
      const fx0 = 40, fw = (W - 80) / 5;
      const blocks = [];
      for (let i = 0; i < 5; i++) {
        const r = el("rect", { x: fx0 + i * fw + 2, y: 30, width: fw - 4, height: 34, rx: 6, class: "ml-fold" }, svg);
        const t = text(svg, fx0 + i * fw + fw / 2, 51, `Fold ${i + 1}`, { "text-anchor": "middle", class: "ml-fold-label" });
        blocks.push({ r, t });
      }
      const roleTxt = text(svg, W / 2, 18, "Training data (80% of households)", { "text-anchor": "middle", class: "ml-svg-label" });

      // Score chart.
      const p = { m: { l: 40, r: 40, t: 96, b: 30 } };
      const ylo = 0.5, yhi = 0.85;
      const y = (v) => H - p.m.b - ((v - ylo) / (yhi - ylo)) * (H - p.m.t - p.m.b);
      [0.5, 0.6, 0.7, 0.8].forEach((v) => {
        el("line", { x1: p.m.l, x2: W - p.m.r, y1: y(v), y2: y(v), class: "grid" }, svg);
        text(svg, p.m.l - 6, y(v) + 3.5, v.toFixed(1), { "text-anchor": "end" });
      });
      text(svg, 12, (p.m.t + H - p.m.b) / 2, "RMSE", { "text-anchor": "middle", class: "muted", transform: `rotate(-90 12 ${(p.m.t + H - p.m.b) / 2})` });
      el("line", { x1: p.m.l, x2: W - p.m.r, y1: y(d.baseline), y2: y(d.baseline), class: "ml-baseline" }, svg);
      el("line", { x1: W - p.m.r - 150, x2: W - p.m.r - 126, y1: p.m.t - 12, y2: p.m.t - 12, class: "ml-baseline" }, svg);
      text(svg, W - p.m.r - 120, p.m.t - 8.5, `predict the mean: ${d.baseline.toFixed(3)}`, { class: "ml-svg-small muted" });
      const bars = [];
      for (let i = 0; i < 5; i++) {
        const bx = fx0 + i * fw + fw * 0.3;
        const b = el("rect", { x: bx, width: fw * 0.4, y: y(ylo), height: 0, rx: 3, class: "ml-bar" }, svg);
        const lab = text(svg, bx + fw * 0.2, y(ylo) - 4, "", { "text-anchor": "middle", class: "ml-svg-small" });
        bars.push({ b, lab });
      }
      const meanLine = el("line", { x1: p.m.l, x2: W - p.m.r, y1: y(ylo), y2: y(ylo), class: "ml-mean-line", opacity: 0 }, svg);

      const st = stats(root, [
        { k: "mean", label: "Mean RMSE", cls: "is-test" },
        { k: "sd", label: "Std. dev. across folds" },
        { k: "vs", label: "vs. predicting the mean" },
      ]);
      const note = h("p", { class: "ml-note" });
      root.append(note);

      const anims = [];
      const stopAll = () => anims.splice(0).forEach((a) => a.stop());
      let running = 0;

      function setRoles(active) {
        blocks.forEach((bk, i) => {
          const cls = active === null ? "ml-fold" : i === active ? "ml-fold is-val" : "ml-fold is-train";
          bk.r.setAttribute("class", cls);
          bk.t.textContent = active === null ? `Fold ${i + 1}` : i === active ? "validate" : "train";
        });
        roleTxt.textContent = active === null ? "Training data (80% of households)" : `Round ${active + 1} of 5`;
      }
      function resetBars() {
        bars.forEach((b) => { b.b.setAttribute("y", y(ylo)); b.b.setAttribute("height", 0); b.lab.textContent = ""; });
        meanLine.setAttribute("opacity", 0);
        ["mean", "sd", "vs"].forEach((k) => st.set(k, "—"));
        note.textContent = "";
      }
      function dropBar(i, v) {
        return new Promise((res) => {
          anims.push(tween(ylo, v, Object.assign({}, SPRING), (val) => {
            const top = y(Math.max(ylo, val));
            bars[i].b.setAttribute("y", top);
            bars[i].b.setAttribute("height", y(ylo) - top);
            bars[i].lab.setAttribute("y", top - 4);
            bars[i].lab.textContent = Math.max(ylo, val).toFixed(3);
          }, res));
        });
      }

      async function run() {
        const my = ++running;
        stopAll();
        resetBars();
        const k = +sel.value;
        const scores = d.folds[String(k)];
        for (let i = 0; i < 5; i++) {
          setRoles(i);
          if (!reduced()) fx(blocks[i].r, { transform: ["scale(1)", "scale(1.06)", "scale(1)"] }, { duration: 0.35 });
          await dropBar(i, scores[i]);
          if (my !== running) return;
          await wait(220);
          if (my !== running) return;
        }
        setRoles(null);
        const m = mean(scores), s = sd(scores);
        anims.push(tween(ylo, m, { duration: 0.45 }, (v) => {
          meanLine.setAttribute("y1", y(v));
          meanLine.setAttribute("y2", y(v));
        }));
        meanLine.setAttribute("opacity", 1);
        st.set("mean", f(m));
        st.set("sd", f(s));
        st.set("vs", (m < d.baseline ? "−" : "+") + pct(Math.abs(m - d.baseline) / d.baseline, 0));
        note.textContent = k === 1
          ? "k = 1 is worse than simply predicting the mean on every fold: memorising does not generalise."
          : k >= 100
            ? `k = ${k}: the five folds agree within a few thousandths. Differences between k = 100 and k = 400 are smaller than the fold-to-fold noise — prefer the simpler story.`
            : `k = ${k}: compare the mean with k = 100 and look at the spread before declaring a winner.`;
      }

      const go = btn(bar, "▶ Run cross-validation", run, "is-primary");
      sel.addEventListener("change", run);
      void go;
      onVisible(root, run);
    }).catch((e) => fail(root, e));
  };

  /* ========================================================================
     Session 4 · 4 — Leakage hunt
     ======================================================================== */
  WIDGETS["leak-hunt"] = function (root) {
    header(root, "Leak hunt: which features would you really have?",
      "Test RMSE of a KNN model (k = 25 with the decile, k = 100 without) predicting log income per capita. " +
      "Toggle the features in and watch the error.");

    const RES = { none: 0.707, obs: 0.582, leak: 0.313 };
    const chips = h("div", { class: "ml-chips" });
    root.append(chips);

    const obsChip = h("button", { type: "button", class: "ml-chip-toggle", "aria-pressed": "true" },
      "head_age · head_schooling_years · household_size");
    const leakChip = h("button", { type: "button", class: "ml-chip-toggle is-danger", "aria-pressed": "false" },
      "income_decile");
    chips.append(obsChip, leakChip);

    const W = 520, H = 120;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "ml-plot", role: "img", "aria-label": "Test RMSE bar" });
    root.append(svg);
    const x0 = 20, x1 = W - 20, maxV = 0.8;
    const x = (v) => x0 + (v / maxV) * (x1 - x0);
    el("rect", { x: x0, y: 40, width: x1 - x0, height: 26, rx: 6, class: "ml-track" }, svg);
    const fill = el("rect", { x: x0, y: 40, width: x(RES.obs) - x0, height: 26, rx: 6, class: "ml-fill" }, svg);
    const val = text(svg, x(RES.obs) - 8, 58, RES.obs.toFixed(3), { "text-anchor": "end", class: "ml-bar-value" });
    el("line", { x1: x(RES.none), x2: x(RES.none), y1: 32, y2: 74, class: "ml-baseline" }, svg);
    text(svg, x(RES.none), 26, "predict the mean (0.707)", { "text-anchor": "middle", class: "ml-svg-small muted" });
    [0, 0.2, 0.4, 0.6, 0.8].forEach((v) => text(svg, x(v), 92, v.toFixed(1), { "text-anchor": "middle", class: "ml-svg-small muted" }));
    text(svg, (x0 + x1) / 2, 112, "Test RMSE (log income per capita) — lower is better", { "text-anchor": "middle", class: "ml-svg-small muted" });

    const alert = h("div", { class: "ml-alert", role: "alert", hidden: "" },
      h("strong", {}, "Too good to be true. "),
      "The error almost halves. But income_decile is computed from household income — the very thing we " +
      "are trying to predict. A household applying for a subsidy does not arrive with its income decile " +
      "attached. Ask of every feature: would I have this at prediction time?");
    const note = h("p", { class: "ml-note" });
    root.append(alert, note);

    const anim = channel();
    let shown = RES.obs;
    function state() {
      const obs = obsChip.getAttribute("aria-pressed") === "true";
      const leak = leakChip.getAttribute("aria-pressed") === "true";
      return obs ? (leak ? "leak" : "obs") : "none";
    }
    function update() {
      const s = state();
      const target = RES[s];
      leakChip.disabled = s === "none";
      const from = shown;
      anim(tween(from, target, SPRING, (v) => {
        shown = v;
        fill.setAttribute("width", Math.max(0, x(v) - x0));
        val.setAttribute("x", Math.max(x0 + 40, x(v) - 8));
        val.textContent = v.toFixed(3);
      }));
      fill.setAttribute("class", "ml-fill" + (s === "leak" ? " is-danger" : s === "none" ? " is-muted" : ""));
      if (s === "leak") {
        alert.hidden = false;
        fx(alert, { opacity: [0, 1], transform: ["translateY(6px)", "translateY(0)"] }, { duration: 0.3 });
      } else alert.hidden = true;
      note.textContent = s === "none"
        ? "No features: the best you can do is predict the average for everyone. That is the baseline every model must beat."
        : s === "obs"
          ? "Three things a social worker can observe in a visit: an honest 18% improvement over the baseline."
          : "";
    }
    function toggle(chip) {
      if (chip.disabled) return;
      chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true"));
      if (chip === obsChip && chip.getAttribute("aria-pressed") === "false") leakChip.setAttribute("aria-pressed", "false");
      update();
    }
    obsChip.addEventListener("click", () => toggle(obsChip));
    leakChip.addEventListener("click", () => toggle(leakChip));

    fill.setAttribute("width", 0);
    shown = 0;
    onVisible(root, update);
  };

  /* ========================================================================
     Session 5 · 1 — The logistic curve
     ======================================================================== */
  WIDGETS["sigmoid"] = function (root) {
    header(root, "From a linear score to a probability",
      "The logit you know from econometrics, now used to predict. 400 households: is the household poor (1) " +
      "or not (0), against the head of household's years of schooling. Move the coefficients, then let " +
      "maximum likelihood find them.");

    load("s05_sigmoid.json").then((d) => {
      const X = d.x, Y = d.y;
      const sig = (z) => 1 / (1 + Math.exp(-z));
      const logloss = (b0, b1) => {
        let s = 0;
        for (let i = 0; i < X.length; i++) {
          const p = Math.min(1 - 1e-12, Math.max(1e-12, sig(b0 + b1 * X[i])));
          s += Y[i] ? -Math.log(p) : -Math.log(1 - p);
        }
        return s / X.length;
      };
      // Exact maximum likelihood by Newton–Raphson (two parameters, a handful of iterations).
      function mle() {
        let b0 = 0, b1 = 0;
        for (let it = 0; it < 50; it++) {
          let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
          for (let i = 0; i < X.length; i++) {
            const p = sig(b0 + b1 * X[i]), w = p * (1 - p), r = Y[i] - p;
            g0 += r; g1 += r * X[i];
            h00 += w; h01 += w * X[i]; h11 += w * X[i] * X[i];
          }
          const det = h00 * h11 - h01 * h01;
          if (!(Math.abs(det) > 1e-12)) break;
          const d0 = (h11 * g0 - h01 * g1) / det, d1 = (h00 * g1 - h01 * g0) / det;
          b0 += d0; b1 += d1;
          if (Math.abs(d0) + Math.abs(d1) < 1e-10) break;
        }
        return Number.isFinite(b0 + b1) ? [b0, b1] : [d.b0, d.b1];
      }
      const [m0, m1] = mle();

      const controls = h("div", { class: "ml-controls" });
      root.append(controls);
      const p = plot(root, 520, 290, { l: 44, r: 44 }, "Logistic curve of the probability of being poor against years of schooling");
      const xmax = Math.max(...X) + 1;
      p.domain([-0.5, xmax], [-0.08, 1.08]);
      p.axes({ xt: range(0, 20, 5), yt: [0, 0.25, 0.5, 0.75, 1], yfmt: (v) => v.toFixed(2), xl: "Head of household: years of schooling", yl: "P(poor)" });
      // Right axis for the linear score z.
      const Z = 4;
      const zy = (z) => p.y(0.5 + z / (2 * Z));
      [-4, -2, 0, 2, 4].forEach((z) => text(p.svg, p.w - p.m.r + 6, zy(z) + 3.5, z, { class: "ml-svg-small ml-lab-z" }));
      text(p.svg, p.w - 8, p.m.t + 4, "z", { class: "ml-svg-small ml-lab-z", "text-anchor": "end" });

      const jit = rng(4);
      const dots = el("g", {}, p.svg);
      X.forEach((x, i) => {
        el("circle", {
          cx: p.x(x + (jit() - 0.5) * 0.5), cy: p.y(Y[i] + (Y[i] ? -1 : 1) * jit() * 0.06),
          r: 2.6, class: Y[i] ? "ml-dot-pos" : "ml-dot-neg",
        }, dots);
      });
      const zLine = el("path", { class: "ml-line-z" }, p.svg);
      const curve = el("path", { class: "ml-line-model" }, p.svg);
      const grid = range(-0.5, xmax, 0.25);

      const st = stats(root, [
        { k: "ll", label: "Log-loss (lower is better)", cls: "is-test" },
        { k: "best", label: "At maximum likelihood" },
        { k: "eq", label: "Model" },
      ]);
      st.set("best", f(logloss(m0, m1)));
      const note = h("p", { class: "ml-note" });
      root.append(note);

      function draw(b0, b1) {
        curve.setAttribute("d", pathD(grid.map((x) => [p.x(x), p.y(sig(b0 + b1 * x))])));
        const pts = grid.map((x) => [p.x(x), zy(Math.max(-Z * 1.1, Math.min(Z * 1.1, b0 + b1 * x)))]);
        zLine.setAttribute("d", pathD(pts));
        st.set("ll", f(logloss(b0, b1)));
        st.set("eq", `z = ${b0.toFixed(2)} ${b1 < 0 ? "−" : "+"} ${Math.abs(b1).toFixed(3)}·x`);
      }

      const START = [1.5, -0.3];
      const s0 = slider(controls, { label: "Intercept b₀", min: -3, max: 3, step: 0.01, value: START[0], fmt: (v) => v.toFixed(2) }, () => draw(s0.get(), s1.get()));
      const s1 = slider(controls, { label: "Slope b₁ (per year of schooling)", min: -0.5, max: 0.5, step: 0.005, value: START[1], fmt: (v) => v.toFixed(3) }, () => draw(s0.get(), s1.get()));
      const bar = h("div", { class: "ml-buttons" });
      controls.after(bar);
      const anim = channel();
      btn(bar, "Fit (maximum likelihood)", () => {
        const a0 = s0.get(), a1 = s1.get();
        anim(tween(0, 1, { type: "spring", stiffness: 120, damping: 18 }, (k) => {
          const b0 = lerp(a0, m0, k), b1 = lerp(a1, m1, k);
          s0.set(b0); s1.set(b1);
          draw(b0, b1);
        }));
        note.textContent = `Fitted: b₀ = ${m0.toFixed(2)}, b₁ = ${m1.toFixed(3)}. Each extra year of schooling lowers the log-odds ` +
          `of being poor by ${Math.abs(m1).toFixed(3)}. Notice how flat the curve is: one variable is not enough to ` +
          "separate poor from non-poor households — which is why the session model uses many.";
      }, "is-primary");
      btn(bar, "Reset", () => {
        anim({ stop() {} });
        s0.set(START[0]); s1.set(START[1]);
        draw(START[0], START[1]);
        note.textContent = "";
      });

      draw(START[0], START[1]);
      onVisible(root, () => fx(dots, { opacity: [0, 1] }, { duration: 0.45 }));
    }).catch((e) => fail(root, e));
  };

  /* ========================================================================
     Session 5 · 2 — Threshold, confusion matrix, ROC and policy cost
     ======================================================================== */
  WIDGETS["threshold"] = function (root) {
    header(root, "Where do we draw the line?",
      "Predicted probability of being poor for the test households (the logistic model of this session). " +
      "Households above the threshold receive the subsidy. Drag the threshold and watch who gets it.");

    load("s05_scores.json").then((d) => {
      const P = d.p, Y = d.y, n = P.length;
      const nPos = sum(Y), nNeg = n - nPos;

      function confusion(t) {
        let tp = 0, fp = 0;
        for (let i = 0; i < n; i++) {
          if (P[i] > t) { if (Y[i]) tp++; else fp++; }
        }
        return { tp, fp, fn: nPos - tp, tn: nNeg - fp };
      }

      // ROC from every distinct score, and AUC by the trapezoid rule.
      const idx = P.map((_, i) => i).sort((a, b) => P[b] - P[a]);
      const roc = [[0, 0]];
      let tp = 0, fp = 0;
      for (let j = 0; j < n; j++) {
        const i = idx[j];
        if (Y[i]) tp++; else fp++;
        if (j === n - 1 || P[idx[j + 1]] !== P[i]) roc.push([fp / nNeg, tp / nPos]);
      }
      let auc = 0;
      for (let j = 1; j < roc.length; j++) auc += (roc[j][0] - roc[j - 1][0]) * (roc[j][1] + roc[j - 1][1]) / 2;

      const layout = h("div", { class: "ml-grid-2" });
      root.append(layout);
      const left = h("div", {});
      const right = h("div", {});
      layout.append(left, right);

      /* --- Histograms ---------------------------------------------------- */
      const BINS = 40;
      const hp = new Array(BINS).fill(0), hn = new Array(BINS).fill(0);
      P.forEach((v, i) => {
        const b = Math.min(BINS - 1, Math.floor(v * BINS));
        (Y[i] ? hp : hn)[b]++;
      });
      const hmax = Math.max(...hp, ...hn);
      const hp_ = plot(left, 520, 250, { l: 44, t: 26 }, "Histograms of predicted probability for poor and non-poor households, with a threshold line");
      hp_.domain([0, 1], [0, hmax * 1.08]);
      hp_.axes({ xt: [0, 0.2, 0.4, 0.6, 0.8, 1], xfmt: (v) => v.toFixed(1), yt: range(0, hmax, hmax > 400 ? 200 : 100), xl: "Predicted probability of being poor", yl: "households" });
      const area = (counts, cls) => {
        const pts = [[hp_.x(0), hp_.y(0)]];
        counts.forEach((c, b) => {
          pts.push([hp_.x(b / BINS), hp_.y(c)]);
          pts.push([hp_.x((b + 1) / BINS), hp_.y(c)]);
        });
        pts.push([hp_.x(1), hp_.y(0)]);
        return el("path", { d: pathD(pts) + "Z", class: cls }, hp_.svg);
      };
      const areaN = area(hn, "ml-hist-neg");
      const areaP = area(hp, "ml-hist-pos");
      const leg = el("g", { class: "ml-legend" }, hp_.svg);
      el("rect", { x: 300, y: 6, width: 10, height: 10, class: "ml-hist-neg" }, leg);
      text(leg, 314, 15, "not poor");
      el("rect", { x: 380, y: 6, width: 10, height: 10, class: "ml-hist-pos" }, leg);
      text(leg, 394, 15, "poor");
      const cheap = el("line", { y1: hp_.m.t, y2: hp_.h - hp_.m.b, class: "ml-cheap" }, hp_.svg);
      const cheapLab = text(hp_.svg, 0, hp_.m.t - 4, "lowest cost", { "text-anchor": "middle", class: "ml-svg-small ml-lab-cheap" });
      const tLine = el("line", { y1: hp_.m.t - 6, y2: hp_.h - hp_.m.b, class: "ml-threshold" }, hp_.svg);
      const tHit = el("circle", { r: 22, cy: hp_.m.t - 6, class: "ml-hit" }, hp_.svg);
      const tHandle = el("circle", { r: 7, cy: hp_.m.t - 6, class: "ml-threshold-handle", tabindex: "-1" }, hp_.svg);
      const shadeL = el("rect", { y: hp_.m.t, height: hp_.h - hp_.m.t - hp_.m.b, x: hp_.m.l, class: "ml-shade" }, hp_.svg);
      hp_.svg.insertBefore(shadeL, areaN);

      /* --- ROC ------------------------------------------------------------ */
      const rp = plot(right, 260, 250, { l: 40, b: 36, t: 26, r: 10 }, "ROC curve with the current threshold marked");
      rp.domain([0, 1], [0, 1]);
      rp.axes({ xt: [0, 0.5, 1], yt: [0, 0.5, 1], xl: "False positive rate", yl: "True positive rate (recall)" });
      el("line", { x1: rp.x(0), y1: rp.y(0), x2: rp.x(1), y2: rp.y(1), class: "ml-diag" }, rp.svg);
      const step = Math.max(1, Math.floor(roc.length / 300));
      const rocPts = roc.filter((_, j) => j % step === 0 || j === roc.length - 1);
      el("path", { d: pathD(rocPts.map((q) => [rp.x(q[0]), rp.y(q[1])])), class: "ml-line-model" }, rp.svg);
      text(rp.svg, rp.m.l + 4, 14, `ROC curve · AUC = ${auc.toFixed(3)}`, { class: "ml-svg-label" });
      const rocDot = el("circle", { r: 5.5, class: "ml-marker-dot" }, rp.svg);

      /* --- Controls, matrix, metrics -------------------------------------- */
      const controls = h("div", { class: "ml-controls" });
      root.append(controls);
      const tS = slider(controls, { label: "Threshold", min: 0.02, max: 0.98, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) }, (v) => update(v));

      const matrix = h("div", { class: "ml-matrix", role: "table", "aria-label": "Confusion matrix" });
      const cell = (cls, label) => {
        const num = h("strong", {}, "—");
        const c = h("div", { class: "ml-cell " + cls, role: "cell" }, num, h("span", {}, label));
        return { c, num };
      };
      const cTP = cell("is-tp", "poor · subsidised");
      const cFN = cell("is-fn", "poor · excluded");
      const cFP = cell("is-fp", "not poor · subsidised");
      const cTN = cell("is-tn", "not poor · not subsidised");
      matrix.append(
        // scikit-learn's order, as on the session page: rows = actual (not poor, poor), columns = predicted.
        h("div", { class: "ml-mh" }), h("div", { class: "ml-mh" }, "Predicted not poor"), h("div", { class: "ml-mh" }, "Predicted poor"),
        h("div", { class: "ml-mh ml-mh-row" }, "Actually not poor"), cTN.c, cFP.c,
        h("div", { class: "ml-mh ml-mh-row" }, "Actually poor"), cFN.c, cTP.c,
      );
      const st = stats(root, [
        { k: "acc", label: "Accuracy" },
        { k: "prec", label: "Precision" },
        { k: "rec", label: "Recall", cls: "is-test" },
        { k: "base", label: "Accuracy if nobody is poor" },
      ]);
      root.insertBefore(matrix, st.cell("acc").parentNode.parentNode);
      st.set("base", pct(nNeg / n));

      const costBox = h("div", { class: "ml-cost" });
      root.append(costBox);
      costBox.append(h("div", { class: "ml-cost-title" }, "Policy cost (relative units)"));
      const costControls = h("div", { class: "ml-controls" });
      costBox.append(costControls);
      const cfn = slider(costControls, { label: "Cost of excluding a poor household", min: 1, max: 10, step: 1, value: 3 }, () => recost());
      const cfp = slider(costControls, { label: "Cost of subsidising a non-poor household", min: 1, max: 10, step: 1, value: 1 }, () => recost());
      const costStats = stats(costBox, [
        { k: "now", label: "Total cost at this threshold" },
        { k: "best", label: "Cheapest threshold" },
        { k: "bestCost", label: "Cost there" },
      ]);
      const costBar = h("div", { class: "ml-buttons" });
      costBox.append(costBar);
      btn(costBar, "Jump to the cheapest threshold", () => animateTo(bestT), "is-primary");
      btn(costBar, "Back to 0.50", () => animateTo(0.5));
      const note = h("p", { class: "ml-note" });
      root.append(note);

      const thresholds = range(0.02, 0.98, 0.01);
      const confs = thresholds.map(confusion);
      let bestT = 0.5;
      const costOf = (c) => cfn.get() * c.fn + cfp.get() * c.fp;
      function recost() {
        let bi = 0;
        confs.forEach((c, i) => { if (costOf(c) < costOf(confs[bi])) bi = i; });
        bestT = thresholds[bi];
        cheap.setAttribute("x1", hp_.x(bestT));
        cheap.setAttribute("x2", hp_.x(bestT));
        cheapLab.setAttribute("x", hp_.x(bestT));
        costStats.set("best", bestT.toFixed(2));
        costStats.set("bestCost", thousands(costOf(confs[bi])));
        costStats.set("now", thousands(costOf(confusion(tS.get()))));
      }

      // Counts animate between thresholds.
      let shownC = confusion(0.5);
      const cAnim = channel();
      const tAnim = channel();
      let tShown = 0.5;
      function placeThreshold(t) {
        tLine.setAttribute("x1", hp_.x(t));
        tLine.setAttribute("x2", hp_.x(t));
        tHandle.setAttribute("cx", hp_.x(t));
        tHit.setAttribute("cx", hp_.x(t));
        shadeL.setAttribute("width", Math.max(0, hp_.x(t) - hp_.m.l));
        const c = confusion(t);
        rocDot.setAttribute("cx", rp.x(c.fp / nNeg));
        rocDot.setAttribute("cy", rp.y(c.tp / nPos));
      }
      function writeCounts(c) {
        cTP.num.textContent = thousands(c.tp);
        cFN.num.textContent = thousands(c.fn);
        cFP.num.textContent = thousands(c.fp);
        cTN.num.textContent = thousands(c.tn);
      }
      function update(t, fromAnim) {
        if (!fromAnim) {
          const t0 = tShown;
          tAnim(tween(t0, t, SPRING, (v) => { tShown = v; placeThreshold(v); }));
        }
        const target = confusion(t);
        const from = Object.assign({}, shownC);
        cAnim(tween(0, 1, { duration: 0.3 }, (k) => {
          shownC = {
            tp: lerp(from.tp, target.tp, k), fn: lerp(from.fn, target.fn, k),
            fp: lerp(from.fp, target.fp, k), tn: lerp(from.tn, target.tn, k),
          };
          writeCounts(shownC);
        }));
        const acc = (target.tp + target.tn) / n;
        const prec = target.tp + target.fp ? target.tp / (target.tp + target.fp) : NaN;
        const rec = target.tp / nPos;
        st.set("acc", pct(acc));
        st.set("prec", pct(prec));
        st.set("rec", pct(rec));
        costStats.set("now", thousands(costOf(target)));
        const missed = target.fn;
        note.textContent = t >= 0.45
          ? `At ${t.toFixed(2)} accuracy looks fine (${pct(acc)} vs ${pct(nNeg / n)} for "nobody is poor"), but ${thousands(missed)} of ` +
            `${thousands(nPos)} poor households — ${pct(missed / nPos, 0)} — are left out of the programme.`
          : `At ${t.toFixed(2)} the programme reaches ${pct(rec, 0)} of poor households, at the price of ` +
            `${thousands(target.fp)} non-poor households also subsidised. Which error is worse is a policy decision, not a statistical one.`;
      }
      function animateTo(t) {
        const t0 = tS.get();
        tAnim(tween(t0, t, { type: "spring", stiffness: 140, damping: 20 }, (v) => {
          const vv = Math.max(0.02, Math.min(0.98, v));
          tShown = vv;
          tS.set(Math.round(vv * 100) / 100);
          placeThreshold(vv);
        }, () => update(t, true)));
        update(t, true);
      }

      // Dragging the threshold directly on the histogram.
      let dragging = false;
      const toT = (ev) => {
        const r = hp_.svg.getBoundingClientRect();
        const px = ((ev.clientX - r.left) / r.width) * hp_.w;
        return Math.round(Math.max(0.02, Math.min(0.98, hp_.ix(px))) * 100) / 100;
      };
      hp_.svg.addEventListener("pointerdown", (ev) => {
        dragging = true;
        hp_.svg.setPointerCapture(ev.pointerId);
        const t = toT(ev);
        tS.set(t);
        update(t);
      });
      hp_.svg.addEventListener("pointermove", (ev) => {
        if (!dragging) return;
        const t = toT(ev);
        if (t === tS.get()) return;
        tS.set(t);
        tShown = t;
        placeThreshold(t);
        update(t, true);
      });
      const end = () => { dragging = false; };
      hp_.svg.addEventListener("pointerup", end);
      hp_.svg.addEventListener("pointercancel", end);

      placeThreshold(0.5);
      writeCounts(shownC);
      update(0.5, true);
      recost();
      onVisible(root, () => {
        fx(areaN, { opacity: [0, 1] }, { duration: 0.4 });
        fx(areaP, { opacity: [0, 1] }, { duration: 0.4, delay: 0.12 });
      });
    }).catch((e) => fail(root, e));
  };

  /* ------------------------------------------------------------------------
     Mount
     ------------------------------------------------------------------------ */
  function mountAll() {
    document.querySelectorAll(".ml-widget[data-widget]").forEach((root) => {
      if (root.dataset.mounted) return;
      const fn = WIDGETS[root.dataset.widget];
      if (!fn) return;
      root.dataset.mounted = "1";
      try {
        fn(root);
      } catch (err) {
        fail(root, err);
      }
    });
  }

  // Session files (ml-widgets-sNN.js) register into WIDGETS with these helpers, then call mountAll().
  window.MLWidgets = {
    WIDGETS, mountAll,
    helpers: {
      NS, reduced, EASE_OUT, SPRING, tween, fx, wait, onVisible, channel, lerp, lerpArr,
      sum, mean, sd, rmse, f, pct, thousands, rng, load, h, header, slider, btn, stats,
      el, text, plot, pathD, range, fail,
    },
  };

  if (typeof document$ !== "undefined") document$.subscribe(mountAll);
  else document.addEventListener("DOMContentLoaded", mountAll);
})();
