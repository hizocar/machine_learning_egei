/* ==========================================================================
   ml-widgets-s08.js — Session 8 · Unlabeled data: PCA and clustering

   Registers three widgets into window.MLWidgets (defined in ml-widgets.js):
     pca-rotate       PCA on two standardised variables + explained variance of all ten
     kmeans-steps     k-means, one assign/update step at a time, on real PCA scores
     cluster-profile  elbow + silhouette, cluster profiles, then the poverty reveal

   Data: docs/data/widgets/s08_*.json, exported by scripts/build_widget_data_s08.py with the
   same features, scaling and seeds as docs/notebooks/s08_unsupervised.ipynb.
   ========================================================================== */
(function () {
  "use strict";
  const ML = window.MLWidgets;
  if (!ML) return;
  const { WIDGETS, mountAll, helpers } = ML;
  const {
    reduced, SPRING, tween, fx, wait, onVisible, channel, mean, f, pct, thousands, rng, load,
    h, header, btn, stats, el, text, plot, pathD, fail,
  } = helpers;

  /* ========================================================================
     Session 8 · 1 — PCA: the direction of most spread
     ======================================================================== */
  WIDGETS["pca-rotate"] = function (root) {
    header(root, "PCA: find the direction of most spread",
      "300 households, two standardised variables: age of the head and years of schooling. Older heads " +
      "had less schooling, so the cloud leans. Draw the components, rotate the axes onto them, then " +
      "squeeze the cloud onto PC1 and see how much information survives.");

    load("s08_pca2.json").then((d) => {
      const n = d.x.length;
      const jit = rng(11);
      // Schooling is an integer: a little vertical jitter (display only) keeps dots from stacking.
      const pts = d.x.map((x, i) => [x, d.y[i] + (jit() - 0.5) * 0.08]);
      const [u1, u2] = d.pc1;                       // PC1 unit vector in (age, schooling) space
      const v1 = [-u2, u1];                          // PC2, perpendicular
      const pc1s = pts.map((p) => p[0] * u1 + p[1] * u2);
      const pc2s = pts.map((p) => p[0] * v1[0] + p[1] * v1[1]);
      const angle = Math.atan2(u2, u1);              // rotate by -angle to make PC1 horizontal

      const grid = h("div", { class: "ml-grid-2" });
      const left = h("div");
      const right = h("div");
      grid.append(left, right);
      root.append(grid);

      const bar = h("div", { class: "ml-buttons" });
      left.append(bar);
      const P = plot(left, 380, 340, { l: 40, r: 14, t: 14, b: 38 }, "Standardised age versus schooling, with principal components");
      const L = 3.4;
      P.domain([-L, L], [-L, L]);
      const g0 = el("g", { class: "ml-axes" }, P.svg);
      [-2, 0, 2].forEach((v) => {
        el("line", { x1: P.x(v), x2: P.x(v), y1: P.y(-L), y2: P.y(L), class: "grid" }, g0);
        el("line", { x1: P.x(-L), x2: P.x(L), y1: P.y(v), y2: P.y(v), class: "grid" }, g0);
      });
      const xLab = text(P.svg, (P.m.l + P.w - P.m.r) / 2, P.h - 6, "age of head (z)", { "text-anchor": "middle", class: "muted" });
      const yMid = (P.m.t + P.h - P.m.b) / 2;
      const yLab = text(P.svg, 12, yMid, "schooling (z)", { "text-anchor": "middle", class: "muted", transform: `rotate(-90 12 ${yMid})` });

      const dotG = el("g", {}, P.svg);
      const dots = pts.map((p) => el("circle", { cx: P.x(p[0]), cy: P.y(p[1]), r: 2.6, class: "ml-dot-train" }, dotG));
      const ox = P.x(0), oy = P.y(0);
      const pxPerUnit = P.x(1) - P.x(0);
      const arrow = (cls) => el("line", { x1: ox, y1: oy, x2: ox, y2: oy, class: cls }, P.svg);
      const a1 = arrow("ml-s08-pc1");
      const a2 = arrow("ml-s08-pc2");
      const t1 = text(P.svg, ox, oy, "", { class: "ml-s08-pclab is-1" });
      const t2 = text(P.svg, ox, oy, "", { class: "ml-s08-pclab is-2" });

      const st = stats(left, [
        { k: "r", label: "Correlation" },
        { k: "v1", label: "Variance on PC1", cls: "is-train" },
        { k: "v2", label: "Variance on PC2" },
      ]);
      st.set("r", f(d.r, 2));
      st.set("v1", pct(d.evr2[0]));
      st.set("v2", pct(d.evr2[1]));
      const note = h("p", { class: "ml-note" });
      left.append(note);

      // State: rot in [0,1] (0 = original axes, 1 = PC1 horizontal), squash in [0,1] (1 = PC2 set to 0).
      let rot = 0, squash = 0, shown = false;
      const anim = channel();
      function place() {
        const th = -angle * rot;
        const c = Math.cos(th), s = Math.sin(th);
        pts.forEach((p, i) => {
          // In rotated coordinates PC2 shrinks towards 0 as squash grows.
          let x = p[0], y = p[1];
          if (squash > 0) {
            const a = pc1s[i], b = pc2s[i] * (1 - squash);
            x = a * u1 + b * v1[0];
            y = a * u2 + b * v1[1];
          }
          dots[i].setAttribute("cx", P.x(x * c - y * s));
          dots[i].setAttribute("cy", P.y(x * s + y * c));
        });
        const draw = (line, lab, dir, len, name) => {
          const dx = dir[0] * c - dir[1] * s, dy = dir[0] * s + dir[1] * c;
          const k = shown ? len : 0;
          line.setAttribute("x2", ox + dx * k * pxPerUnit);
          line.setAttribute("y2", oy - dy * k * pxPerUnit);
          lab.setAttribute("x", ox + dx * (k + 0.25) * pxPerUnit);
          lab.setAttribute("y", oy - dy * (k + 0.25) * pxPerUnit + 4);
          lab.textContent = shown ? name : "";
        };
        // Arrow length proportional to the spread (sd) along each component; PC1 stays inside the plot.
        draw(a1, t1, [u1, u2], 2.3 * Math.sqrt(d.evr2[0] * 2), "PC1");
        draw(a2, t2, v1, 2.3 * Math.sqrt(d.evr2[1] * 2), "PC2");
        const done = rot > 0.99;
        xLab.textContent = done ? "PC1: older & less schooled  →" : "age of head (z)";
        yLab.textContent = done ? "PC2" : "schooling (z)";
      }
      function animateTo(r, sq) {
        const r0 = rot, s0 = squash;
        anim(tween(0, 1, Object.assign({}, SPRING), (k) => {
          rot = r0 + (r - r0) * k;
          squash = s0 + (sq - s0) * k;
          place();
        }));
      }

      const bShow = btn(bar, "1 · Draw PC1 and PC2", () => {
        shown = true;
        anim(tween(0, 1, { duration: 0.5 }, () => place()));
        place();
        if (!reduced()) {
          fx(a1, { opacity: [0, 1] }, { duration: 0.4 });
          fx(a2, { opacity: [0, 1] }, { duration: 0.4, delay: 0.2 });
        }
        note.className = "ml-note";
        note.textContent = `PC1 points along the long side of the cloud: (${f(u1, 2)}, ${f(u2, 2)}), equal weights with ` +
          "opposite signs. Arrow lengths are proportional to the spread along each component.";
      }, "is-primary");
      btn(bar, "2 · Rotate onto PC1", () => {
        shown = true;
        animateTo(1, 0);
        note.className = "ml-note";
        note.textContent = "Nothing about the households changed: we only turned the axes. PC1 is now horizontal, " +
          "and the cloud is widest along it.";
      });
      btn(bar, "3 · Keep only PC1", () => {
        shown = true;
        animateTo(1, 1);
        note.className = "ml-note is-ok";
        note.textContent = `One number per household instead of two, and ${pct(d.evr2[0])} of the variance is kept. ` +
          `With two standardised variables PC1 always keeps (1 + |r|) / 2 = (1 + ${f(Math.abs(d.r), 3)}) / 2.`;
      });
      btn(bar, "Reset", () => {
        shown = false;
        animateTo(0, 0);
        note.className = "ml-note";
        note.textContent = "";
      });
      void bShow;
      place();

      // Right: explained variance of the full 10-variable PCA.
      right.append(h("p", { class: "ml-s08-side-title" }, "All ten household variables"));
      const evr = d.evr_full;
      const B = plot(right, 260, 250, { l: 36, r: 8, t: 14, b: 34 }, "Explained variance ratio of the ten principal components");
      B.domain([0, evr.length], [0, 1]);
      B.axes({ yt: [0, 0.25, 0.5, 0.75, 1], yfmt: (v) => Math.round(v * 100) + "%", xl: "component" });
      const bw = (B.x(1) - B.x(0)) * 0.7;
      const barsE = evr.map((v, i) => {
        const r = el("rect", { x: B.x(i) + (B.x(1) - B.x(0) - bw) / 2, width: bw, y: B.y(0), height: 0, rx: 2, class: "ml-bar" }, B.svg);
        text(B.svg, B.x(i + 0.5), B.h - B.m.b + 13, i + 1, { "text-anchor": "middle", class: "ml-svg-small" });
        return r;
      });
      let cum = 0;
      const cumPts = evr.map((v, i) => { cum += v; return [B.x(i + 0.5), B.y(cum)]; });
      const cumLine = el("path", { d: pathD(cumPts), class: "ml-line-model", opacity: 0 }, B.svg);
      const cumDots = cumPts.map((q) => el("circle", { cx: q[0], cy: q[1], r: 2.5, class: "ml-marker-dot", opacity: 0 }, B.svg));
      const c2 = evr[0] + evr[1];
      let need = 0, acc = 0;
      while (acc < 0.8 && need < evr.length) acc += evr[need++];
      right.append(h("p", { class: "ml-note" },
        `PC1 keeps ${pct(evr[0], 0)} of the variance and PC1 + PC2 ${pct(c2, 0)}. It takes ${need} components to pass 80%: ` +
        "household life does not reduce to one index."));

      onVisible(root, () => {
        dots.forEach((dt, i) => { if (i % 3 === 0) fx(dt, { opacity: [0, 0.55] }, { duration: 0.4, delay: (i % 30) * 0.008 }); });
        evr.forEach((v, i) => {
          tween(0, v, { duration: 0.45, delay: 0.05 * i }, (val) => {
            barsE[i].setAttribute("y", B.y(val));
            barsE[i].setAttribute("height", B.y(0) - B.y(val));
          });
        });
        fx(cumLine, { opacity: [0, 1] }, { duration: 0.4, delay: 0.6 });
        cumDots.forEach((cd) => fx(cd, { opacity: [0, 1] }, { duration: 0.3, delay: 0.7 }));
      });
      void n; void mean;
    }).catch((e) => fail(root, e));
  };

  /* ========================================================================
     Session 8 · 2 — k-means, step by step
     ======================================================================== */
  WIDGETS["kmeans-steps"] = function (root) {
    header(root, "k-means, one step at a time",
      "400 households on the first two principal components (PC1 ≈ life stage, PC2 ≈ size and crowding). " +
      "Press Step: households join their nearest centroid, then each centroid moves to the mean of its households. " +
      "Repeat until nobody switches.");

    load("s08_kmeans.json").then((d) => {
      const pts = d.x.map((x, i) => [x, d.y[i]]);
      const controls = h("div", { class: "ml-controls" });
      const bar = h("div", { class: "ml-buttons" });
      root.append(controls, bar);
      const sel = h("select", { "aria-label": "Number of clusters k" });
      [2, 3, 4, 5, 6].forEach((k) => {
        const o = h("option", { value: k }, `k = ${k}`);
        if (k === 4) o.selected = true;
        sel.append(o);
      });
      controls.append(h("div", { class: "ml-control" }, h("label", {}, h("span", {}, "Number of clusters")), sel));

      const xs = d.x, ys = d.y;
      const pad = 0.4;
      const P = plot(root, 560, 360, { l: 40, r: 14, t: 12, b: 38 }, "Households on two principal components, coloured by k-means cluster");
      P.domain([Math.min(...xs) - pad, Math.max(...xs) + pad], [Math.min(...ys) - pad, Math.max(...ys) + pad]);
      const xt = [-3, -2, -1, 0, 1, 2, 3, 4].filter((v) => v > P.xd[0] && v < P.xd[1]);
      const yt = [-2, 0, 2, 4, 6].filter((v) => v > P.yd[0] && v < P.yd[1]);
      P.axes({ xt, yt, xl: "PC1 (life stage: older →)", yl: "PC2 (size, crowding ↑)" });
      const linkG = el("g", {}, P.svg);
      const dotG = el("g", {}, P.svg);
      const dots = pts.map((p) => el("circle", { cx: P.x(p[0]), cy: P.y(p[1]), r: 3, class: "ml-s08-pt" }, dotG));
      const centG = el("g", {}, P.svg);

      const st = stats(root, [
        { k: "it", label: "Iteration" },
        { k: "phase", label: "Next step" },
        { k: "inertia", label: "Inertia (total sq. distance)", cls: "is-test" },
        { k: "moved", label: "Households that switched" },
      ]);
      const note = h("p", { class: "ml-note" });
      root.append(note);

      let K, C, assign, iter, phase, converged, cents, running = 0;
      const anims = [];
      const stopAll = () => anims.splice(0).forEach((a) => a.stop());

      const inertiaOf = () => pts.reduce((s, p, i) => {
        const c = C[assign[i]];
        return s + (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2;
      }, 0);

      function drawCentroids() {
        centG.replaceChildren();
        cents = C.map((c, j) => {
          const g = el("g", { class: `ml-s08-cent k${j}` }, centG);
          el("circle", { r: 9, class: "ml-s08-cent-ring" }, g);
          el("path", { d: "M-5 0H5M0 -5V5", class: "ml-s08-cent-cross" }, g);
          g.setAttribute("transform", `translate(${P.x(c[0])} ${P.y(c[1])})`);
          return g;
        });
      }
      function setCent(j, c) {
        cents[j].setAttribute("transform", `translate(${P.x(c[0])} ${P.y(c[1])})`);
      }
      function colour() {
        dots.forEach((dt, i) => dt.setAttribute("class", assign[i] < 0 ? "ml-s08-pt" : `ml-s08-pt k${assign[i]}`));
      }

      function reset() {
        running++;
        stopAll();
        K = +sel.value;
        C = d.init[String(K)].map((c) => c.slice());
        assign = pts.map(() => -1);
        iter = 0;
        phase = "assign";
        converged = false;
        linkG.replaceChildren();
        colour();
        drawCentroids();
        st.set("it", "0");
        st.set("phase", "assign");
        st.set("inertia", "—");
        st.set("moved", "—");
        note.className = "ml-note";
        note.textContent = `${K} starting centroids, chosen with the k-means++ rule (spread out, but random). Press Step.`;
        if (!reduced()) cents.forEach((g, j) => fx(g, { opacity: [0, 1] }, { duration: 0.3, delay: 0.06 * j }));
      }

      async function doAssign() {
        let moved = 0;
        const next = pts.map((p) => {
          let best = 0, bd = Infinity;
          C.forEach((c, j) => {
            const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2;
            if (dd < bd) { bd = dd; best = j; }
          });
          return best;
        });
        next.forEach((a, i) => { if (a !== assign[i]) moved++; });
        // Faint links to the chosen centroid, then fade them out.
        linkG.replaceChildren();
        if (!reduced()) {
          pts.forEach((p, i) => {
            if (i % 2) return;
            const c = C[next[i]];
            el("line", { x1: P.x(p[0]), y1: P.y(p[1]), x2: P.x(c[0]), y2: P.y(c[1]), class: `ml-s08-link k${next[i]}` }, linkG);
          });
          anims.push(fx(linkG, { opacity: [0, 0.5, 0] }, { duration: 1.1 }));
        }
        assign = next;
        colour();
        iter++;
        st.set("it", String(iter));
        st.set("moved", thousands(moved));
        st.set("inertia", f(inertiaOf(), 1));
        if (moved === 0 && iter > 1) {
          converged = true;
          st.set("phase", "done ✓");
          const target = d.final_inertia[String(K)];
          note.className = "ml-note is-ok";
          note.textContent = `Converged after ${iter - 1} updates: nobody switched cluster. Inertia ${f(inertiaOf(), 1)} ` +
            `(scikit-learn reaches ${f(target, 1)} from the same start). A different start could end somewhere else; that is why n_init matters.`;
          return;
        }
        phase = "update";
        st.set("phase", "update");
        note.className = "ml-note";
        note.textContent = `Assign: every household joins its nearest centroid. ${thousands(moved)} households ` +
          (iter === 1 ? "got a cluster." : "switched cluster.");
      }

      function doUpdate() {
        const before = C.map((c) => c.slice());
        C = C.map((c, j) => {
          const mine = pts.filter((_, i) => assign[i] === j);
          return mine.length ? [mean(mine.map((p) => p[0])), mean(mine.map((p) => p[1]))] : c;
        });
        return new Promise((res) => {
          anims.push(tween(0, 1, Object.assign({}, SPRING), (k) => {
            C.forEach((c, j) => setCent(j, [before[j][0] + (c[0] - before[j][0]) * k, before[j][1] + (c[1] - before[j][1]) * k]));
          }, res));
          phase = "assign";
          st.set("phase", "assign");
          st.set("inertia", f(inertiaOf(), 1));
          note.className = "ml-note";
          note.textContent = "Update: each centroid moves to the mean of its households, which can only lower the inertia.";
        });
      }

      async function step() {
        if (converged) return;
        if (phase === "assign") await doAssign();
        else await doUpdate();
      }
      async function runAll() {
        const my = ++running;
        for (let s = 0; s < 80 && !converged; s++) {
          await step();
          if (my !== running) return;
          await wait(phase === "update" ? 420 : 320);
          if (my !== running) return;
        }
      }

      btn(bar, "Step", () => { running++; step(); }, "is-primary");
      btn(bar, "▶ Run to the end", runAll);
      btn(bar, "Reset", reset);
      sel.addEventListener("change", reset);
      reset();
      onVisible(root, () => {
        dots.forEach((dt, i) => fx(dt, { opacity: [0, 1] }, { duration: 0.35, delay: (i % 40) * 0.01 }));
      });
    }).catch((e) => fail(root, e));
  };

  /* ========================================================================
     Session 8 · 3 — How many clusters, what they look like, and poverty
     ======================================================================== */
  const PROFILE_ROWS = [
    { k: "head_age", label: "Age of head", fmt: (v) => v.toFixed(0) },
    { k: "head_schooling_years", label: "Schooling (years)", fmt: (v) => v.toFixed(1) },
    { k: "household_size", label: "Household size", fmt: (v) => v.toFixed(1) },
    { k: "head_weekly_hours", label: "Weekly hours worked", fmt: (v) => v.toFixed(0) },
    { k: "has_children", label: "With children", fmt: (v) => pct(v, 0) },
    { k: "has_elderly", label: "With someone 60+", fmt: (v) => pct(v, 0) },
    { k: "owns_home", label: "Owns the home", fmt: (v) => pct(v, 0) },
    { k: "overcrowded", label: "Overcrowded", fmt: (v) => pct(v, 0) },
    { k: "rural", label: "Rural", fmt: (v) => pct(v, 0) },
  ];

  /* A suggested name from the profile — a starting point for discussion, not a fact. */
  function suggestName(c) {
    if (c.overcrowded > 0.5) return "Overcrowded families";
    const parts = [];
    if (c.has_elderly > 0.7) parts.push("Older households");
    else if (c.has_children > 0.9) parts.push("Families with children");
    else if (c.has_children < 0.1 && c.head_weekly_hours > 30) parts.push("Working adults, no children");
    else if (c.head_weekly_hours > 30) parts.push("Working households");
    else parts.push("Mixed");
    if (c.rural > 0.9) parts.push("rural");
    else if (c.rural < 0.05 && c.has_elderly > 0.7) parts.push("urban");
    if (c.has_children > 0.9 && c.owns_home > 0.95) parts.push("owners");
    if (c.has_children > 0.9 && c.owns_home < 0.05) parts.push("not owners");
    return parts.join(", ");
  }

  WIDGETS["cluster-profile"] = function (root) {
    header(root, "How many clusters, and who is in them?",
      "k-means on all 15,000 households and ten standardised variables. Pick k from the elbow and the silhouette, " +
      "read the profiles, and only then reveal how poverty differs across the clusters.");

    load("s08_clusters.json").then((d) => {
      const grid = h("div", { class: "ml-s08-curves" });
      root.append(grid);
      const curve = d.curve;
      const ks = curve.map((c) => c.k);
      let K = 4;
      const markers = [];

      function mini(title, key, fmt, yt) {
        const box = h("div");
        grid.append(box);
        box.append(h("p", { class: "ml-s08-side-title" }, title));
        const vals = curve.map((c) => c[key]);
        const lo = Math.min(...vals), hi = Math.max(...vals), padv = (hi - lo) * 0.15;
        const P = plot(box, 280, 170, { l: 46, r: 10, t: 10, b: 30 }, title);
        P.domain([ks[0] - 0.4, ks[ks.length - 1] + 0.4], [lo - padv, hi + padv]);
        P.axes({ xt: ks, yt: yt(lo, hi), yfmt: fmt, xl: "k" });
        const ptsXY = curve.map((c) => [P.x(c.k), P.y(c[key])]);
        const line = el("path", { d: pathD(ptsXY), class: "ml-line-train" }, P.svg);
        const dots = curve.map((c, i) => {
          // Transparent 28-unit target behind the 10-unit dot, so it is easy to tap.
          const hit = c.k <= 6 ? el("circle", { cx: ptsXY[i][0], cy: ptsXY[i][1], r: 14, class: "ml-hit ml-s08-khit" }, P.svg) : null;
          const dot = el("circle", { cx: ptsXY[i][0], cy: ptsXY[i][1], r: 5, class: "ml-s08-kdot", tabindex: c.k <= 6 ? 0 : -1, role: "button", "aria-label": `Choose k = ${c.k}` }, P.svg);
          if (c.k <= 6) {
            hit.addEventListener("click", () => choose(c.k));
            dot.addEventListener("click", () => choose(c.k));
            dot.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(c.k); } });
          } else dot.classList.add("is-off");
          return dot;
        });
        const mk = el("circle", { r: 9, class: "ml-s08-kring" }, P.svg);
        markers.push({ mk, ptsXY });
        onVisible(box, () => {
          const len = line.getTotalLength ? line.getTotalLength() : 0;
          if (len && !reduced()) {
            line.style.strokeDasharray = len;
            fx(line, { strokeDashoffset: [len, 0] }, { duration: 0.7 });
          }
          dots.forEach((dt, i) => fx(dt, { opacity: [0, 1] }, { duration: 0.25, delay: 0.08 * i }));
        });
      }
      mini("Inertia (lower is tighter; look for an elbow)", "inertia", (v) => Math.round(v / 1000) + "k",
        (lo, hi) => [lo, (lo + hi) / 2, hi].map((v) => Math.round(v / 5000) * 5000));
      mini("Silhouette (higher is better separated)", "silhouette", (v) => v.toFixed(2),
        (lo, hi) => [lo, (lo + hi) / 2, hi].map((v) => Math.round(v * 100) / 100));

      const controls = h("div", { class: "ml-controls" });
      root.append(controls);
      const sel = h("select", { "aria-label": "Number of clusters k" });
      [2, 3, 4, 5, 6].forEach((k) => {
        const o = h("option", { value: k }, `k = ${k}`);
        if (k === K) o.selected = true;
        sel.append(o);
      });
      controls.append(h("div", { class: "ml-control" }, h("label", {}, h("span", {}, "Profiles for")), sel));
      const bar = h("div", { class: "ml-buttons" });
      root.append(bar);
      const reveal = btn(bar, "Now look at poverty →", () => showPoverty(), "is-primary");

      const tableWrap = h("div", { class: "ml-s08-table-wrap" });
      root.append(h("p", { class: "ml-s08-swipe" }, "Swipe the table sideways to see every cluster →"), tableWrap);
      const note = h("p", { class: "ml-note" });
      root.append(note);
      const anim = channel();
      let povertyShown = false, povBars = [];

      function buildTable() {
        const prof = d.profiles[String(K)];
        const tbl = h("table", { class: "ml-s08-table" });
        const head = h("tr", {}, h("th", {}, ""));
        prof.forEach((c, j) => head.append(h("th", { class: `k${j}` },
          h("span", { class: "ml-s08-swatch" }), suggestName(c),
          h("small", {}, `${thousands(c.n)} households · ${pct(c.n / d.n, 0)}`))));
        tbl.append(h("thead", {}, head));
        const body = h("tbody");
        PROFILE_ROWS.forEach((r) => {
          // Bars start at zero (value / largest value in the row), so 0% really is an empty bar.
          const hi = Math.max(...prof.map((c) => c[r.k]));
          const tr = h("tr", {}, h("th", { scope: "row" }, r.label));
          prof.forEach((c, j) => {
            const w = hi > 0 ? (100 * c[r.k]) / hi : 0;
            const fill = h("span", { class: `ml-s08-fill k${j}`, style: `width:${w}%` });
            tr.append(h("td", {}, h("span", { class: "ml-s08-cellbar" }, fill), h("span", { class: "ml-s08-val" }, r.fmt(c[r.k]))));
          });
          body.append(tr);
        });
        // Poverty row, hidden until revealed.
        const pr = h("tr", { class: "ml-s08-poverty" }, h("th", { scope: "row" }, "Poverty rate"));
        povBars = prof.map((c) => {
          const fill = h("span", { class: "ml-s08-fill is-poor", style: "width:0%" });
          const val = h("span", { class: "ml-s08-val" }, "?");
          const avg = h("span", { class: "ml-s08-avg", style: `left:${(d.overall_poor / 0.5) * 100}%`, title: "overall poverty rate" });
          pr.append(h("td", {}, h("span", { class: "ml-s08-cellbar" }, fill, avg), val));
          return { fill, val, p: c.poor };
        });
        body.append(pr);
        tbl.append(body);
        tableWrap.replaceChildren(tbl);
        if (!reduced()) fx(tbl, { opacity: [0, 1], transform: ["translateY(6px)", "translateY(0)"] }, { duration: 0.35 });
      }

      function showPoverty() {
        povertyShown = true;
        reveal.disabled = true;
        const prof = d.profiles[String(K)];
        anim(tween(0, 1, { duration: 0.7 }, (k) => {
          povBars.forEach((b) => {
            b.fill.style.width = Math.min(100, (b.p * k / 0.5) * 100) + "%";
            b.val.textContent = pct(b.p * k, 0);
          });
        }, () => povBars.forEach((b) => { b.val.textContent = pct(b.p, 1); })));
        const hiC = prof.reduce((a, c) => (c.poor > a.poor ? c : a));
        const loC = prof.reduce((a, c) => (c.poor < a.poor ? c : a));
        const poorTotal = prof.reduce((s, c) => s + c.poor * c.n, 0);
        note.className = "ml-note is-warn";
        note.textContent = `The algorithm never saw who is poor. Still, poverty ranges from ${pct(loC.poor, 0)} (${suggestName(loC)}) ` +
          `to ${pct(hiC.poor, 0)} (${suggestName(hiC)}), against ${pct(d.overall_poor, 0)} overall (dashed mark). ` +
          `But the highest-poverty cluster holds only ${pct((hiC.poor * hiC.n) / poorTotal, 0)} of all poor households: ` +
          "segments help design programmes, they do not replace targeting.";
      }

      function choose(k) {
        K = k;
        sel.value = String(k);
        const i = ks.indexOf(k);
        markers.forEach((m) => {
          const [x, y] = m.ptsXY[i];
          const from = [+m.mk.getAttribute("cx") || x, +m.mk.getAttribute("cy") || y];
          tween(0, 1, Object.assign({}, SPRING), (t) => {
            m.mk.setAttribute("cx", from[0] + (x - from[0]) * t);
            m.mk.setAttribute("cy", from[1] + (y - from[1]) * t);
          });
        });
        buildTable();
        reveal.disabled = false;
        const c = curve[i];
        note.className = "ml-note";
        note.textContent = k === 3
          ? `k = 3 has the highest silhouette (${f(c.silhouette, 3)}), but it puts families with and without children in one group.`
          : k === 4
            ? `k = 4: from 3 to 4 clusters inertia still falls by ${thousands(curve[1].inertia - c.inertia)}; from 4 to 5 only by ` +
              `${thousands(c.inertia - curve[3].inertia)}. Silhouette ${f(c.silhouette, 3)}: low everywhere, households form a continuum.`
            : `k = ${k}: silhouette ${f(c.silhouette, 3)}, inertia ${thousands(c.inertia)}. Are the new groups different enough to deserve their own programme?`;
        if (povertyShown) showPoverty();
      }

      sel.addEventListener("change", () => choose(+sel.value));
      choose(K);
    }).catch((e) => fail(root, e));
  };

  mountAll();
})();
