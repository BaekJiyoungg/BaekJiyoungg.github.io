/* =========================================================
   Jiyoung Baek — magazine edition
   Page-flip book built from the flat list of <section class="page">.
   ========================================================= */
(() => {
  const root = document.documentElement;

  // ===== Small helpers =====
  const pad = (n) => String(n).padStart(2, "0");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ===== Theme toggle =====
  $("#theme-toggle").addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  // ===== Season / year =====
  const now = new Date();
  const m = now.getMonth();
  const season = m === 11 || m < 2 ? "Winter" : m < 5 ? "Spring" : m < 8 ? "Summer" : "Autumn";
  const seasonYear = m === 11 ? now.getFullYear() + 1 : now.getFullYear();
  $$("[data-season]").forEach((el) => (el.textContent = `${season} ${seasonYear}`));
  $$("[data-year]").forEach((el) => (el.textContent = now.getFullYear()));

  // Placeholder links (href="#") do nothing instead of jumping.
  $$('a[href="#"]').forEach((a) =>
    a.addEventListener("click", (e) => e.preventDefault())
  );

  // ===== Generative illustrations =====
  const rand = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const f1 = (n) => n.toFixed(1);

  const ART = {
    // City street network with one highlighted route
    streets(r) {
      const W = 600, H = 840, cols = 9, rows = 12;
      const dx = W / (cols - 3), dy = H / (rows - 3);
      const P = [];
      for (let i = 0; i < cols; i++) {
        P[i] = [];
        for (let j = 0; j < rows; j++) {
          P[i][j] = [(i - 1) * dx + (r() - 0.5) * dx * 0.55, (j - 1) * dy + (r() - 0.5) * dy * 0.55];
        }
      }
      let out = "";
      // a few filled blocks
      for (let i = 0; i < cols - 1; i++) for (let j = 0; j < rows - 1; j++) {
        if (r() < 0.16) {
          const a = P[i][j], b = P[i + 1][j], c = P[i + 1][j + 1], d = P[i][j + 1];
          out += `<polygon class="art-blk" points="${[a, b, c, d].map((p) => p.map(f1).join(",")).join(" ")}"/>`;
        }
      }
      // streets
      let d = "";
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const p = P[i][j];
        if (i < cols - 1 && r() < 0.88) d += `M${f1(p[0])} ${f1(p[1])}L${f1(P[i + 1][j][0])} ${f1(P[i + 1][j][1])}`;
        if (j < rows - 1 && r() < 0.88) d += `M${f1(p[0])} ${f1(p[1])}L${f1(P[i][j + 1][0])} ${f1(P[i][j + 1][1])}`;
        // occasional alley through the block
        if (i < cols - 1 && j < rows - 1 && r() < 0.3) {
          const q = P[i + 1][j + 1];
          d += `M${f1((p[0] + P[i + 1][j][0]) / 2)} ${f1((p[1] + P[i + 1][j][1]) / 2)}L${f1((P[i][j + 1][0] + q[0]) / 2)} ${f1((P[i][j + 1][1] + q[1]) / 2)}`;
        }
      }
      out += `<path class="art-ink" stroke-width="1" opacity="0.45" d="${d}"/>`;
      // arterials
      for (let k = 0; k < 2; k++) {
        const y0 = H * (0.3 + r() * 0.5), y1 = H * (0.2 + r() * 0.7);
        out += `<path class="art-ink" stroke-width="3.2" opacity="0.8" d="M-20 ${f1(y0)} C ${f1(W * 0.35)} ${f1(y0 + (r() - 0.5) * 300)}, ${f1(W * 0.65)} ${f1(y1 + (r() - 0.5) * 300)}, ${W + 20} ${f1(y1)}"/>`;
      }
      // route: random monotone walk on the grid
      let i = 1 + Math.floor(r() * 2), j = 2;
      const route = [P[i][j]];
      while (i < cols - 2 && j < rows - 2) {
        if (r() < 0.5) i++; else j++;
        route.push(P[i][j]);
      }
      out += `<polyline class="art-acc" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" points="${route.map((p) => p.map(f1).join(",")).join(" ")}"/>`;
      const s = route[0], e = route[route.length - 1];
      out += `<circle class="art-dacc" cx="${f1(s[0])}" cy="${f1(s[1])}" r="9"/>`;
      out += `<circle cx="${f1(e[0])}" cy="${f1(e[1])}" r="10" fill="none" stroke="var(--accent)" stroke-width="4"/>`;
      // data points at intersections
      for (let k = 0; k < 26; k++) {
        const p = P[1 + Math.floor(r() * (cols - 2))][1 + Math.floor(r() * (rows - 2))];
        out += `<circle class="art-dot" cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(2 + r() * 2.5)}"/>`;
      }
      return out;
    },

    // Many points, one fitted curve
    scatter(r) {
      const W = 400, H = 300;
      const g = () => (r() + r() + r() - 1.5) * 1.4;
      const fn = (x) => H - 48 - 190 * (Math.log(1 + x / 50) / Math.log(1 + 380 / 50));
      let out = `<path class="art-ink" opacity="0.35" stroke-width="1" d="M30 ${H - 30}H${W - 10}M30 ${H - 30}V12"/>`;
      for (let x = 30; x < W; x += 40) out += `<path class="art-ink" opacity="0.35" d="M${x} ${H - 30}v5"/>`;
      for (let k = 0; k < 420; k++) {
        const x = 32 + r() * (W - 44);
        const y = fn(x) + g() * 22;
        if (y > 14 && y < H - 32) out += `<circle class="art-dot" opacity="${f1(0.25 + r() * 0.5)}" cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.2 + r() * 1.4)}"/>`;
      }
      let d = "";
      for (let x = 32; x <= W - 12; x += 6) d += `${d ? "L" : "M"}${x} ${f1(fn(x))}`;
      out += `<path class="art-acc" stroke-width="3" d="${d}"/>`;
      return out;
    },

    // Schelling segregation on a grid
    segregation(r) {
      const C = 40, R = 30, S = 10;
      const g = [];
      for (let k = 0; k < C * R; k++) { const v = r(); g.push(v < 0.45 ? 1 : v < 0.9 ? 2 : 0); }
      const at = (x, y) => g[((y + R) % R) * C + ((x + C) % C)];
      for (let it = 0; it < 30; it++) {
        const empties = []; g.forEach((v, k) => !v && empties.push(k));
        for (let k = 0; k < g.length; k++) {
          const v = g[k]; if (!v) continue;
          const x = k % C, y = (k / C) | 0;
          let same = 0, tot = 0;
          for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
            if (!a && !b) continue;
            const n = at(x + a, y + b); if (n) { tot++; if (n === v) same++; }
          }
          if (tot && same / tot < 0.5) {
            const ei = Math.floor(r() * empties.length), e = empties[ei];
            g[e] = v; g[k] = 0; empties[ei] = k;
          }
        }
      }
      let out = "";
      g.forEach((v, k) => {
        if (!v) return;
        const x = (k % C) * S + S / 2, y = ((k / C) | 0) * S + S / 2;
        out += v === 1
          ? `<circle class="art-dot" opacity="0.8" cx="${x}" cy="${y}" r="3.2"/>`
          : `<rect class="art-dacc" x="${x - 3.4}" y="${y - 3.4}" width="6.8" height="6.8"/>`;
      });
      return out;
    },

    // Network with hubs
    network(r) {
      const W = 400, H = 300, N = 52, nodes = [];
      let tries = 0;
      while (nodes.length < N && tries++ < 4000) {
        const p = [10 + r() * (W - 20), 10 + r() * (H - 20)];
        if (nodes.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) > 28)) nodes.push(p);
      }
      const deg = nodes.map(() => 0), edges = [];
      nodes.forEach((p, a) => {
        const near = nodes.map((q, b) => [Math.hypot(p[0] - q[0], p[1] - q[1]), b]).sort((x, y) => x[0] - y[0]).slice(1, 3 + Math.floor(r() * 2));
        near.forEach(([, b]) => { if (a < b || !edges.some((e) => e[0] === b && e[1] === a)) { edges.push([a, b]); deg[a]++; deg[b]++; } });
      });
      const hubs = deg.map((d, k) => [d, k]).sort((x, y) => y[0] - x[0]).slice(0, 4).map((x) => x[1]);
      const hub = hubs[0];
      // long-range links from the main hub
      nodes.forEach((p, k) => { if (k !== hub && r() < 0.12) { edges.push([hub, k, 1]); deg[hub]++; } });
      let out = "", acc = "";
      edges.forEach(([a, b, far]) => {
        const p = nodes[a], q = nodes[b];
        if (far) {
          const mx = (p[0] + q[0]) / 2 + (q[1] - p[1]) * 0.2, my = (p[1] + q[1]) / 2 - (q[0] - p[0]) * 0.2;
          acc += `<path class="art-acc" stroke-width="1.4" opacity="0.85" d="M${f1(p[0])} ${f1(p[1])}Q${f1(mx)} ${f1(my)} ${f1(q[0])} ${f1(q[1])}"/>`;
        } else {
          out += `<path class="art-ink" stroke-width="0.9" opacity="0.4" d="M${f1(p[0])} ${f1(p[1])}L${f1(q[0])} ${f1(q[1])}"/>`;
        }
      });
      out += acc;
      nodes.forEach((p, k) => {
        const rr = 1.8 + Math.sqrt(deg[k]) * (hubs.includes(k) ? 2.2 : 0.9);
        out += `<circle class="${k === hub ? "art-dacc" : "art-dot"}" cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(rr)}"/>`;
      });
      return out;
    },

    // Topographic rings around agglomeration peaks
    topo(r) {
      const W = 400, H = 300;
      const peaks = [[W * (0.22 + r() * 0.12), H * (0.3 + r() * 0.35)], [W * (0.62 + r() * 0.15), H * (0.35 + r() * 0.35)], [W * (0.45 + r() * 0.1), H * (0.85 + r() * 0.1)]];
      const ph = [r() * 6, r() * 6, r() * 6];
      let out = "";
      peaks.forEach((c, pi) => {
        const rings = pi === 2 ? 5 : 8 + Math.floor(r() * 4);
        for (let k = 1; k <= rings; k++) {
          const base = k * (pi === 2 ? 14 : 12);
          let d = "";
          for (let a = 0; a <= 64; a++) {
            const t = (a / 64) * Math.PI * 2;
            const rad = base * (1 + 0.16 * Math.sin(3 * t + ph[pi] + k * 0.3) + 0.08 * Math.sin(5 * t - ph[pi]));
            d += `${a ? "L" : "M"}${f1(c[0] + Math.cos(t) * rad * 1.15)} ${f1(c[1] + Math.sin(t) * rad * 0.85)}`;
          }
          const isAcc = pi === 0 && k === 1;
          out += `<path class="${isAcc ? "art-acc" : "art-ink"}" stroke-width="${isAcc ? 2.4 : k % 4 === 0 ? 1.4 : 0.8}" opacity="${isAcc ? 1 : 0.5}" d="${d}Z"/>`;
        }
      });
      out += `<path class="art-acc" stroke-width="2" stroke-dasharray="6 5" d="M${f1(peaks[0][0])} ${f1(peaks[0][1])}L${f1(peaks[1][0])} ${f1(peaks[1][1])}"/>`;
      peaks.slice(0, 2).forEach((c) => (out += `<circle class="art-dacc" cx="${f1(c[0])}" cy="${f1(c[1])}" r="4.5"/>`));
      return out;
    },

    barcode(r) {
      let x = 2, out = "";
      while (x < 118) {
        const w = [1, 1, 1.5, 2, 3][Math.floor(r() * 5)];
        if (r() < 0.62) out += `<rect class="art-dot" x="${f1(x)}" y="0" width="${w}" height="40"/>`;
        x += w + 0.8;
      }
      return out;
    },
  };

  $$("svg[data-art]").forEach((svg) => {
    const fn = ART[svg.dataset.art];
    const seed = svg.dataset.seed ? +svg.dataset.seed : Math.floor(Math.random() * 1e9);
    if (fn) svg.innerHTML = fn(rand(seed));
  });

  // ===== Pages: running heads + folios =====
  const src = $("#pages-src");
  const pages = $$(".page", src);
  const N = pages.length;
  const idIndex = {};
  pages.forEach((p, i) => {
    if (p.id) idIndex[p.id] = i;
    if (p.hasAttribute("data-nofolio")) return;
    const pi = $(".pi", p);
    const rh = document.createElement("header");
    rh.className = "rh";
    rh.innerHTML = `<span>Jiyoung Baek</span><span>${p.dataset.section || p.dataset.title || ""}</span>`;
    const fo = document.createElement("footer");
    fo.className = "fo";
    fo.innerHTML = `<span class="fo-n">${pad(i + 1)}</span><span>Issue No. 01 — ${season} ${seasonYear}</span>`;
    pi.prepend(rh);
    pi.append(fo);
  });
  $$("[data-pageof]").forEach((el) => {
    const i = idIndex[el.dataset.pageof];
    if (i != null) el.textContent = pad(i + 1);
  });

  // ===== Book =====
  const book = $("#book");
  const stage = $("#stage");
  const scrubber = $("#scrubber");
  const label = $("#label");
  const prevBtn = $("#prev");
  const nextBtn = $("#next");
  const hint = $("#hint");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FLIP = reduceMotion ? 0 : 900;

  let mode = null;   // "spread" | "single"
  let leaves = [];   // { el, front, back }
  let cur = 0;       // number of flipped leaves
  let seq = 0;

  const L = () => leaves.length;
  const maxCur = () => (mode === "spread" ? L() : L() - 1);
  const restZ = (k, flipped) => (flipped ? k + 1 : L() - k);
  const decideMode = () =>
    window.innerWidth < 760 || window.innerWidth / window.innerHeight < 0.95 ? "single" : "spread";

  function visiblePages() {
    if (mode === "spread") return [2 * cur - 1, 2 * cur].filter((i) => i >= 0 && i < N);
    return [cur];
  }
  function curForPage(i) {
    i = Math.max(0, Math.min(N - 1, i));
    return mode === "spread" ? Math.ceil(i / 2) : i;
  }

  function build(newMode, keepPage) {
    mode = newMode;
    root.classList.toggle("spread", mode === "spread");
    root.classList.toggle("single", mode === "single");
    hint.textContent = mode === "single"
      ? "Swipe or tap a page to turn"
      : "← → keys · or click a page to turn";
    book.textContent = "";
    leaves = [];
    const per = mode === "spread" ? 2 : 1;
    for (let i = 0; i < N; i += per) {
      const el = document.createElement("div");
      el.className = "leaf";
      const front = document.createElement("div");
      front.className = "face front";
      front.append(pages[i]);
      const back = document.createElement("div");
      back.className = "face back";
      if (per === 2 && pages[i + 1]) back.append(pages[i + 1]);
      else back.classList.add("blank");
      el.append(front, back);
      book.append(el);
      leaves.push({ el, front, back });
    }
    cur = curForPage(keepPage);
    leaves.forEach(({ el }, k) => {
      const f = k < cur;
      el.classList.toggle("flipped", f);
      el.classList.toggle("gone", f && mode === "single");
      el.style.zIndex = restZ(k, f);
    });
    // build scrubber
    scrubber.textContent = "";
    for (let s = 0; s <= maxCur(); s++) {
      const b = document.createElement("button");
      b.className = "tick";
      const vis = mode === "spread" ? [2 * s - 1, 2 * s].filter((i) => i >= 0 && i < N) : [s];
      b.title = vis.map((i) => pages[i].dataset.title).join(" / ");
      b.setAttribute("aria-label", `Go to ${b.title}`);
      b.addEventListener("click", () => setCur(s));
      scrubber.append(b);
    }
    update();
  }

  function turn(k) {
    const leaf = leaves[k];
    if (!leaf) return;
    const el = leaf.el;
    const want = k < cur;
    if (el.classList.contains("flipped") === want) return;
    clearTimeout(el._t);
    el.classList.remove("gone");
    el.style.zIndex = 1000 + ++seq;
    void el.offsetWidth; // apply visibility before the transform changes
    el.classList.toggle("flipped", want);
    el.classList.add("turning");
    el._t = setTimeout(() => {
      el.classList.remove("turning");
      const f = el.classList.contains("flipped");
      el.style.zIndex = restZ(k, f);
      if (f && mode === "single") el.classList.add("gone");
    }, FLIP + 40);
  }

  function setCur(target) {
    target = Math.max(0, Math.min(maxCur(), target));
    if (target === cur) return;
    const ks = [];
    if (target > cur) for (let k = cur; k < target; k++) ks.push(k);
    else for (let k = cur - 1; k >= target; k--) ks.push(k);
    cur = target;
    const gap = ks.length > 1 ? Math.min(150, 700 / ks.length) : 0;
    ks.forEach((k, i) => (i === 0 || reduceMotion ? turn(k) : setTimeout(() => turn(k), i * gap)));
    update();
    hint.classList.add("hide");
  }

  const next = () => setCur(cur + 1);
  const prev = () => setCur(cur - 1);
  const goToPage = (i) => setCur(curForPage(i));

  function update() {
    leaves.forEach(({ el, front, back }, k) => {
      const showFront = k === cur;
      const showBack = mode === "spread" && k === cur - 1;
      front.inert = !showFront;
      back.inert = !showBack;
      el.classList.toggle("top-r", showFront);
      el.classList.toggle("top-l", showBack);
    });
    book.classList.toggle("at-start", mode === "spread" && cur === 0);
    book.classList.toggle("at-end", mode === "spread" && cur === L());
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === maxCur();
    $$(".tick", scrubber).forEach((t, s) => {
      t.classList.toggle("done", s < cur);
      t.classList.toggle("active", s === cur);
    });
    const vis = visiblePages();
    label.textContent = vis.length === 1 && (vis[0] === 0 || vis[0] === N - 1)
      ? pages[vis[0]].dataset.title
      : `${vis.map((i) => pad(i + 1)).join("–")} · ${vis.map((i) => pages[i].dataset.title).join(" / ")}`;
    history.replaceState(null, "", `#p${vis[0] + 1}`);
    document.title = vis[0] === 0
      ? "Jiyoung Baek — Computational Social Science & Urban AI"
      : `${pages[vis[vis.length - 1]].dataset.title} — Jiyoung Baek`;
  }

  // ===== Hash routing (#p5 or #inequality) =====
  function pageFromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    const m = /^p(\d+)$/.exec(h);
    if (m) return +m[1] - 1;
    if (h in idIndex) return idIndex[h];
    return 0;
  }
  window.addEventListener("hashchange", () => goToPage(pageFromHash()));

  // ===== Input =====
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-goto]");
    if (go) {
      const i = idIndex[go.dataset.goto];
      if (i != null) { e.preventDefault(); goToPage(i); }
      return;
    }
    if (e.target.closest("a, button")) return;
    const face = e.target.closest(".face");
    if (!face || face.classList.contains("blank")) return;
    if (String(window.getSelection())) return;
    if (mode === "single") {
      const r = face.getBoundingClientRect();
      (e.clientX - r.left < r.width * 0.3 ? prev : next)();
    } else {
      (face.classList.contains("front") ? next : prev)();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest("input, textarea, select")) return;
    switch (e.key) {
      case "ArrowRight": case "PageDown": next(); break;
      case "ArrowLeft": case "PageUp": prev(); break;
      case "Home": setCur(0); break;
      case "End": setCur(maxCur()); break;
      case " ": if (e.target === document.body) { e.preventDefault(); (e.shiftKey ? prev : next)(); } break;
      default: return;
    }
  });

  let tx = 0, ty = 0;
  stage.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) (dx < 0 ? next : prev)();
  }, { passive: true });

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const m = decideMode();
      if (m !== mode) build(m, visiblePages()[0]);
    }, 120);
  });

  // ===== Go =====
  build(decideMode(), pageFromHash());
})();
