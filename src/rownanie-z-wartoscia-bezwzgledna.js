(function () {
    const MAX_N = 60;
    const MAX_SET = 200000;
    const MAX_SHOWN = 200;
    const MAX_STEPS = 1000;

    // Parsuje dziesiętny zapis (także z przecinkiem) na { int: BigInt, scale: liczba miejsc }.
    function parseDecimal(str) {
        const s = String(str).trim().replace(',', '.');
        const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(s);
        if (!match) return null;
        const frac = match[3] || '';
        let v = BigInt(match[2] + frac);
        if (match[1] === '-') v = -v;
        return { int: v, scale: frac.length };
    }

    function formatScaled(v, scale) {
        const neg = v < 0n;
        let s = (neg ? -v : v).toString();
        if (scale > 0) {
            s = s.padStart(scale + 1, '0');
            let intPart = s.slice(0, -scale);
            let frac = s.slice(-scale).replace(/0+$/, '');
            s = frac ? intPart + ',' + frac : intPart;
        }
        return (neg ? '-' : '') + s;
    }

    // Rozwiązuje f_n(x) = m, gdzie f_1 = |x-a_1|, f_k = |f_{k-1} - a_k|. Wszystko w arytmetyce całkowitej.
    function solve(aInts, mInt) {
        if (mInt < 0n) return [];
        let values = new Set([mInt]);
        for (let k = aInts.length - 1; k >= 1; k--) {
            const next = new Set();
            for (const v of values) {
                const p = aInts[k] + v;
                const q = aInts[k] - v;
                if (p >= 0n) next.add(p);
                if (q >= 0n) next.add(q);
            }
            if (next.size > MAX_SET) throw new Error('Zbyt wiele rozwiązań do wyznaczenia.');
            values = next;
            if (values.size === 0) return [];
        }
        const xs = new Set();
        for (const v of values) {
            xs.add(aInts[0] + v);
            xs.add(aInts[0] - v);
        }
        return [...xs].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    }

    // Zdejmuje wartości bezwzględne od zewnątrz; każdy węzeł to równanie f_k(x) = v, dzieci to alternatywa.
    function buildStep(k, v, a, scale, budget) {
        const li = document.createElement('li');
        const fmt = function (z) { return formatScaled(z, scale); };
        const ak = a[k - 1];
        const head = k === 1 ? '|x − ' + fmt(ak) + '| = ' + fmt(v) : 'f' + k + '(x) = ' + fmt(v);
        const title = document.createElement('div');
        li.appendChild(title);

        if (v < 0n) {
            title.textContent = head + ' — sprzeczność (wartość bezwzględna ≥ 0), gałąź odpada';
            li.className = 'abs-dead';
            return li;
        }
        if (budget.left <= 0) {
            title.textContent = head + ' …';
            budget.truncated = true;
            return li;
        }
        budget.left--;

        const options = v === 0n ? [v] : [v, -v];
        const rhs = options.map(function (s) { return fmt(s); }).join(' lub ');
        const target = k === 1 ? 'x − ' + fmt(ak) : 'f' + (k - 1) + '(x) − ' + fmt(ak);
        title.textContent = head + ' ⟹ ' + target + ' = ' + rhs;

        const ul = document.createElement('ul');
        options.forEach(function (s) {
            if (k === 1) {
                const leaf = document.createElement('li');
                leaf.className = 'abs-solution';
                leaf.textContent = 'x = ' + fmt(ak + s);
                ul.appendChild(leaf);
            } else {
                const child = buildStep(k - 1, ak + s, a, scale, budget);
                ul.appendChild(child);
            }
        });
        li.appendChild(ul);
        return li;
    }

    const nInput = document.getElementById('abs-n');
    const buildBtn = document.getElementById('abs-build');
    const form = document.getElementById('abs-form');
    const fields = document.getElementById('abs-fields');
    const mInput = document.getElementById('abs-m');
    const result = document.getElementById('abs-result');
    if (!nInput || !form) return;

    function showError(msg) {
        result.className = 'abs-result abs-error';
        result.textContent = msg;
    }

    function buildFields() {
        const n = Number(nInput.value);
        if (!Number.isInteger(n) || n < 1 || n > MAX_N) {
            showError('Podaj całkowite n z przedziału 1–' + MAX_N + '.');
            return;
        }
        fields.innerHTML = '';
        for (let i = 1; i <= n; i++) {
            const label = document.createElement('label');
            label.className = 'abs-field';
            const span = document.createElement('span');
            span.textContent = 'a' + i;
            const input = document.createElement('input');
            input.type = 'text';
            input.inputMode = 'decimal';
            input.className = 'abs-a';
            input.required = true;
            input.value = String(i);
            label.append(span, input);
            fields.appendChild(label);
        }
        form.hidden = false;
        result.className = 'abs-result';
        result.textContent = '';
    }

    buildBtn.addEventListener('click', buildFields);
    nInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            buildFields();
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const inputs = [...fields.querySelectorAll('.abs-a')];
        const parsed = inputs.map(function (i) { return parseDecimal(i.value); });
        const mParsed = parseDecimal(mInput.value);
        if (parsed.includes(null) || mParsed === null) {
            showError('Wszystkie pola muszą zawierać liczby dziesiętne (np. 2, -3, 1,5).');
            return;
        }
        const scale = Math.max(mParsed.scale, ...parsed.map(function (p) { return p.scale; }));
        const toScaled = function (p) { return p.int * 10n ** BigInt(scale - p.scale); };

        let xs;
        try {
            xs = solve(parsed.map(toScaled), toScaled(mParsed));
        } catch (err) {
            showError(err.message);
            return;
        }

        result.className = 'abs-result';
        result.innerHTML = '';
        const count = document.createElement('p');
        count.className = 'abs-count';
        count.textContent = 'Liczba rozwiązań: ' + xs.length;
        result.appendChild(count);

        const scaled = parsed.map(toScaled);
        const budget = { left: MAX_STEPS, truncated: false };
        const steps = buildStep(scaled.length, toScaled(mParsed), scaled, scale, budget);
        const h = document.createElement('h3');
        h.textContent = 'Etapy rozwiązania';
        const tree = document.createElement('ul');
        tree.className = 'abs-tree';
        tree.appendChild(steps);
        result.append(h, tree);
        if (budget.truncated) {
            const w = document.createElement('p');
            w.textContent = 'Drzewo przypadków zostało skrócone (limit ' + MAX_STEPS + ' kroków).';
            result.appendChild(w);
        }
        if (xs.length === 0) return;

        const shown = xs.slice(0, MAX_SHOWN).map(function (x) { return formatScaled(x, scale); });
        const p = document.createElement('p');
        p.textContent = 'x ∈ {' + shown.join('; ') + (xs.length > MAX_SHOWN ? '; …' : '') + '}';
        result.appendChild(p);
        if (xs.length > MAX_SHOWN) {
            const note = document.createElement('p');
            note.textContent = 'Wyświetlono pierwsze ' + MAX_SHOWN + ' rozwiązań.';
            result.appendChild(note);
        }
    });
})();
