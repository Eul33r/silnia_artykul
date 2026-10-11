(() => {
const NS = "http://www.w3.org/2000/svg";
const form = document.getElementById("quadratic-ineqForm");
const fields = ["a", "b", "c"].map((id) => document.getElementById(id));
const typeSelect = document.getElementById("ineq-type");
const output = document.getElementById("wynik");
const flowBox = document.getElementById("flowchart");
const graphBox = document.getElementById("graph");

const TYPES = {
    gt: { sym: ">", strict: true, sign: 1, read: ["Odczytaj x, dla których parabola", "leży NAD osią OX (f(x) > 0).", "Miejsca zerowe: kółka puste."] },
    lt: { sym: "<", strict: true, sign: -1, read: ["Odczytaj x, dla których parabola", "leży POD osią OX (f(x) < 0).", "Miejsca zerowe: kółka puste."] },
    geq: { sym: "≥", strict: false, sign: 1, read: ["Odczytaj x, dla których parabola", "leży NAD osią lub NA niej (f(x) ≥ 0).", "Miejsca zerowe: kółka pełne."] },
    leq: { sym: "≤", strict: false, sign: -1, read: ["Odczytaj x, dla których parabola", "leży POD osią lub NA niej (f(x) ≤ 0).", "Miejsca zerowe: kółka pełne."] },
    neq: { sym: "≠", strict: true, sign: 0, read: ["Odczytaj wszystkie x poza", "miejscami zerowymi (f(x) ≠ 0).", "Miejsca zerowe: kółka puste."] }
};

const COLORS = {
    term: "#7bd88f", process: "#8ec5ff", decision: "#ffd966", result: "#f4a6a6", read: "#d7b6f2", edge: "#445"
};

const fmt = (v) => {
    const r = Math.round(v * 1e6) / 1e6;
    return Object.is(r, -0) ? "0" : String(r).replace(".", ",");
};
const parse = (s) => Number(s.trim().replace(",", "."));

function el(name, attrs = {}, parent) {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
}

function text(parent, x, y, lines, size = 13) {
    const t = el("text", { x, y: y - ((lines.length - 1) * (size + 2)) / 2 + size / 3, "text-anchor": "middle", "font-size": size, fill: "#111" }, parent);
    lines.forEach((line, i) => {
        const s = el("tspan", { x, dy: i === 0 ? 0 : size + 2 }, t);
        s.textContent = line;
    });
}

// ---------- schemat blokowy ----------
function drawFlowchart(typeKey, active) {
    const type = TYPES[typeKey];
    const on = (id) => !active || active.has(id);
    const svg = el("svg", { viewBox: "0 0 720 700", width: "100%", role: "img", "aria-label": "Schemat blokowy algorytmu" });
    const defs = el("defs", {}, svg);
    const marker = el("marker", { id: "arr", markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: "auto" }, defs);
    el("path", { d: "M0,0 L8,4 L0,8 z", fill: COLORS.edge }, marker);

    const edge = (id, d, label, lx, ly) => {
        const g = el("g", { opacity: on(id) ? 1 : 0.25 }, svg);
        el("path", { d, fill: "none", stroke: COLORS.edge, "stroke-width": on(id) && active ? 3 : 1.5, "marker-end": "url(#arr)" }, g);
        if (label) text(g, lx, ly, [label], 12);
    };
    const node = (id, shape, cx, cy, w, h, color, lines) => {
        const g = el("g", { opacity: on(id) ? 1 : 0.35 }, svg);
        const common = { fill: color, stroke: "#333", "stroke-width": on(id) && active ? 3 : 1.5 };
        const l = cx - w / 2, r = cx + w / 2, t = cy - h / 2, b = cy + h / 2;
        if (shape === "oval") el("rect", { ...common, x: l, y: t, width: w, height: h, rx: h / 2 }, g);
        else if (shape === "rect") el("rect", { ...common, x: l, y: t, width: w, height: h, rx: 3 }, g);
        else if (shape === "diamond") el("polygon", { ...common, points: `${cx},${t} ${r},${cy} ${cx},${b} ${l},${cy}` }, g);
        text(g, cx, cy, lines);
    };

    const M = 250, R = 560;
    node("start", "oval", M, 30, 160, 40, COLORS.term, ["START"]);
    edge("start", `M${M},50 V80`);
    node("start", "rect", M, 105, 280, 50, COLORS.process, ["Oblicz Δ = b² − 4ac", "(a ≠ 0)"]);
    edge("start", `M${M},130 V150`);
    node("start", "diamond", M, 200, 200, 100, COLORS.decision, ["Δ > 0 ?"]);
    edge("pos", `M${M + 100},200 H${R - 110}`, "TAK", M + 130, 192);
    node("pos", "rect", R, 200, 200, 60, COLORS.process, ["x₁ = (−b − √Δ)/2a", "x₂ = (−b + √Δ)/2a"]);
    edge("nonpos", `M${M},250 V290`, "NIE", M + 18, 272);
    node("nonpos", "diamond", M, 340, 200, 100, COLORS.decision, ["Δ = 0 ?"]);
    edge("zero", `M${M + 100},340 H${R - 110}`, "TAK", M + 130, 332);
    node("zero", "rect", R, 340, 200, 60, COLORS.process, ["x₀ = −b / 2a"]);
    edge("neg", `M${M},390 V430`, "NIE", M + 18, 412);
    node("neg", "rect", M, 455, 240, 50, COLORS.result, ["Brak miejsc zerowych", "(parabola nie przecina OX)"]);
    edge("neg", `M${M},480 V520`);
    edge("pos", `M${R},230 V560 H${M + 140}`);
    edge("zero", `M${R},370 V560`);
    node("draw", "rect", M, 560, 280, 60, COLORS.process, ["Naszkicuj oś OX i parabolę:", "a > 0 – ramiona w górę,", "a < 0 – ramiona w dół"]);
    edge("draw", `M${M},590 V615`);
    node("draw", "rect", M, 650, 360, 70, COLORS.read, type.read);
    // zamknięcie schematu
    return svg;
}

// ---------- rozwiązanie ----------
function solveSet(a, b, c, typeKey) {
    const type = TYPES[typeKey];
    const delta = b * b - 4 * a * c;
    const roots = delta < 0 ? [] : delta === 0 ? [-b / (2 * a)] : [(-b - Math.sqrt(delta)) / (2 * a), (-b + Math.sqrt(delta)) / (2 * a)].sort((x, y) => x - y);
    const n = roots.length;
    const sa = Math.sign(a);
    const segSign = (i) => (n === 2 && i === 1 ? -sa : sa);
    const holds = (s) => (type.sign === 0 ? s !== 0 : s === type.sign);

    const items = [];
    for (let i = 0; i <= n; i++) {
        items.push({ kind: "seg", i, ok: holds(segSign(i)) });
        if (i < n) items.push({ kind: "pt", i, ok: !type.strict });
    }
    const point = (it) => roots[it.i];
    const lo = (it) => (it.kind === "pt" ? roots[it.i] : it.i === 0 ? -Infinity : roots[it.i - 1]);
    const hi = (it) => (it.kind === "pt" ? roots[it.i] : it.i === n ? Infinity : roots[it.i]);

    const groups = [];
    let cur = null;
    for (const it of items) {
        if (it.ok) {
            if (!cur) groups.push((cur = { first: it, last: it }));
            else cur.last = it;
        } else cur = null;
    }
    const parts = groups.map((g) => {
        const l = lo(g.first), h = hi(g.last);
        const lb = g.first.kind === "pt" ? "⟨" : "(";
        const rb = g.last.kind === "pt" ? "⟩" : ")";
        const ls = l === -Infinity ? "−∞" : fmt(l), hs = h === Infinity ? "∞" : fmt(h);
        return `${lb === "⟨" ? "⟨" : "("}${ls}; ${hs}${rb === "⟩" ? "⟩" : ")"}`;
    });
    let answer;
    if (!groups.length) answer = "∅ (brak rozwiązań)";
    else if (groups.length === 1 && lo(groups[0].first) === -Infinity && hi(groups[0].last) === Infinity) answer = "x ∈ ℝ";
    else answer = "x ∈ " + parts.join(" ∪ ");
    return { delta, roots, items, answer, point, lo, hi };
}

// ---------- wykres ----------
function drawGraph(a, res, typeKey) {
    graphBox.replaceChildren();
    const W = 600, H = 200, AY = 100, CX = 300;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img", "aria-label": "Uproszczony wykres paraboli" }, graphBox);
    const n = res.roots.length;
    const px = n === 2 ? [200, 400] : n === 1 ? [300] : [];
    const dir = a > 0 ? 1 : -1; // 1 – ramiona w górę
    const k = n === 2 ? 60 / 10000 : 0.006;
    const vertexUp = n === 2 ? -60 : n === 1 ? 0 : 40;
    let d = "";
    for (let x = 30; x <= 570; x += 6) {
        const up = dir * (vertexUp + k * (x - CX) ** 2);
        d += `${d ? "L" : "M"}${x},${AY - up} `;
    }
    el("path", { d, fill: "none", stroke: "#9aa", "stroke-width": 2 }, svg);
    el("line", { x1: 10, y1: AY, x2: W - 10, y2: AY, stroke: "#222", "stroke-width": 2, "marker-end": "url(#arr2)" }, svg);
    const defs = el("defs", {}, svg);
    const m = el("marker", { id: "arr2", markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: "auto" }, defs);
    el("path", { d: "M0,0 L8,4 L0,8 z", fill: "#222" }, m);
    const ox = el("text", { x: W - 14, y: AY + 18, "font-size": 13, "text-anchor": "end" }, svg);
    ox.textContent = "x";

    const xs = (v) => (v === -Infinity ? 10 : v === Infinity ? W - 14 : px[res.roots.indexOf(v)]);
    for (const it of res.items) {
        if (it.kind !== "seg" || !it.ok) continue;
        const x1 = xs(res.lo(it)), x2 = xs(res.hi(it));
        el("line", { x1, y1: AY, x2, y2: AY, stroke: "#e0457b", "stroke-width": 7, "stroke-linecap": "butt" }, svg);
    }
    res.roots.forEach((r, i) => {
        const ok = res.items.find((it) => it.kind === "pt" && it.i === i).ok;
        el("circle", { cx: px[i], cy: AY, r: 6, fill: ok ? "#e0457b" : "#fff", stroke: "#e0457b", "stroke-width": 2.5 }, svg);
        const t = el("text", { x: px[i], y: AY + 26, "font-size": 13, "text-anchor": "middle" }, svg);
        t.textContent = fmt(r);
    });
}

// ---------- obsługa ----------
function activeSet(delta) {
    const s = new Set(["start", "draw"]);
    if (delta > 0) s.add("pos");
    else {
        s.add("nonpos");
        s.add(delta === 0 ? "zero" : "neg");
    }
    return s;
}

function renderFlow(active) {
    flowBox.replaceChildren(drawFlowchart(typeSelect.value, active));
}

function line(text, cls = "") {
    const p = document.createElement("p");
    p.textContent = text;
    if (cls) p.className = cls;
    output.appendChild(p);
}

function linear(b, c, typeKey) {
    // a = 0: bx + c ∘ 0
    const type = TYPES[typeKey];
    if (b === 0) {
        const s = c === 0 ? 0 : Math.sign(c);
        const ok = type.sign === 0 ? s !== 0 : type.strict ? s === type.sign : s === type.sign || s === 0;
        return ok ? "x ∈ ℝ" : "∅ (brak rozwiązań)";
    }
    const x0 = -c / b;
    if (typeKey === "neq") return `x ∈ ℝ \\ {${fmt(x0)}}`;
    const up = (type.sign === 1) === (b > 0);
    const closed = !type.strict;
    return up ? `x ∈ ${closed ? "⟨" : "("}${fmt(x0)}; ∞)` : `x ∈ (−∞; ${fmt(x0)}${closed ? "⟩" : ")"}`;
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const vals = fields.map((f) => f.value.trim());
    if (vals.some((v) => v === "")) {
        output.textContent = "Błąd: wprowadź wszystkie trzy współczynniki.";
        return;
    }
    const [a, b, c] = vals.map(parse);
    if (![a, b, c].every(Number.isFinite)) {
        output.textContent = "Błąd: współczynniki muszą być skończonymi liczbami rzeczywistymi.";
        return;
    }
    const key = typeSelect.value;
    const type = TYPES[key];
    output.replaceChildren();
    graphBox.replaceChildren();
    line(`Rozwiązujemy nierówność: ${fmt(a)}x² + ${fmt(b)}x + ${fmt(c)} ${type.sym} 0`);

    if (a === 0) {
        renderFlow(null);
        line("Ponieważ a = 0, nierówność nie jest kwadratowa (jest liniowa lub stała).");
        line(linear(b, c, key), "solution");
        return;
    }

    const res = solveSet(a, b, c, key);
    line(`Krok 1. Współczynniki: a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}.`);
    line(`Krok 2. Δ = b² − 4ac = ${fmt(b)}² − 4·${fmt(a)}·${fmt(c)} = ${fmt(res.delta)}.`);
    if (res.delta > 0) {
        line(`Krok 3. Δ > 0, dwa miejsca zerowe: √Δ = ${fmt(Math.sqrt(res.delta))}, x₁ = ${fmt(res.roots[0])}, x₂ = ${fmt(res.roots[1])}.`);
    } else if (res.delta === 0) {
        line(`Krok 3. Δ = 0, jedno miejsce zerowe: x₀ = −b/2a = ${fmt(res.roots[0])}.`);
    } else {
        line("Krok 3. Δ < 0, brak miejsc zerowych – parabola nie przecina osi OX.");
    }
    line(`Krok 4. a ${a > 0 ? ">" : "<"} 0, więc ramiona paraboli skierowane są ${a > 0 ? "w górę" : "w dół"}. Szkicujemy wykres (poniżej).`);
    line(`Krok 5. ${type.read.join(" ")}`);
    line(`Odpowiedź: ${res.answer}`, "solution");

    renderFlow(activeSet(res.delta));
    drawGraph(a, res, key);
});

typeSelect.addEventListener("change", () => {
    renderFlow(null);
});

renderFlow(null);
})();
