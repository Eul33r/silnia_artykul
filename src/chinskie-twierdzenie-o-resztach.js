function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// Rozszerzony algorytm Euklidesa: zwraca [g, x, y] takie, że a*x + b*y = g = NWD(a, b)
function extendedGcd(a, b) {
    if (b === 0) {
        return [a, 1, 0];
    }
    const [g, x1, y1] = extendedGcd(b, a % b);
    return [g, y1, x1 - Math.floor(a / b) * y1];
}

// Odwrotność modularna a^{-1} (mod m), zakładamy NWD(a, m) = 1
function modInverse(a, m) {
    const [, x] = extendedGcd(((a % m) + m) % m, m);
    return ((x % m) + m) % m;
}

(() => {
    const form = document.getElementById('crtForm');
    const countInput = document.getElementById('crt-count');
    const rowsContainer = document.getElementById('crt-rows');
    const wynik = document.getElementById('wynik_crt');

    const createRows = () => {
        const count = Number.parseInt(countInput.value, 10);
        if (!Number.isInteger(count) || count < 2 || count > 12) {
            rowsContainer.innerHTML = '';
            return;
        }

        rowsContainer.innerHTML = Array.from({ length: count }, (_, index) => `
            <div class="crt-row">
                <span>x \u2261</span>
                <input id="crt-r-${index + 1}" type="number" step="1" placeholder="r${index + 1}, np. ${index + 1}" required>
                <span>(mod</span>
                <input id="crt-m-${index + 1}" type="number" step="1" min="1" placeholder="m${index + 1}, np. ${index + 5}" required>
                <span>)</span>
            </div>
        `).join('');
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const count = Number.parseInt(countInput.value, 10);
        if (!Number.isInteger(count) || count < 2 || count > 12) {
            wynik.textContent = 'Błąd: liczba kongruencji musi być całkowita, z zakresu od 2 do 12.';
            return;
        }

        const remainders = [];
        const moduli = [];

        for (let i = 1; i <= count; i += 1) {
            const rValue = document.getElementById(`crt-r-${i}`).value;
            const mValue = document.getElementById(`crt-m-${i}`).value;

            if (rValue === '' || mValue === '') {
                wynik.textContent = `Błąd: uzupełnij resztę i moduł dla kongruencji ${i}.`;
                return;
            }

            const r = Number(rValue);
            const m = Number(mValue);

            if (!Number.isInteger(r) || !Number.isInteger(m)) {
                wynik.textContent = `Błąd: reszta i moduł kongruencji ${i} muszą być liczbami całkowitymi.`;
                return;
            }

            if (m <= 0) {
                wynik.textContent = `Błąd: moduł kongruencji ${i} musi być liczbą dodatnią.`;
                return;
            }

            remainders.push(((r % m) + m) % m);
            moduli.push(m);
        }

        // Sprawdzenie, czy moduły są parami względnie pierwsze
        for (let i = 0; i < count; i += 1) {
            for (let j = i + 1; j < count; j += 1) {
                const wspolnyDzielnik = gcd(moduli[i], moduli[j]);
                if (wspolnyDzielnik !== 1) {
                    wynik.innerHTML = `Układ jest sprzeczny (nie ma rozwiązania): moduły \\(m_${i + 1} = ${moduli[i]}\\) i \\(m_${j + 1} = ${moduli[j]}\\) nie są względnie pierwsze (\\(NWD(m_${i + 1}, m_${j + 1}) = ${wspolnyDzielnik} \\neq 1\\)).`;
                    if (window.MathJax && MathJax.typesetPromise) {
                        MathJax.typesetPromise([wynik]);
                    }
                    return;
                }
            }
        }

        const M = moduli.reduce((product, m) => product * m, 1);

        let x = 0;
        for (let i = 0; i < count; i += 1) {
            const Mi = M / moduli[i];
            const MiInverse = modInverse(Mi, moduli[i]);
            x += remainders[i] * Mi * MiInverse;
        }
        x = ((x % M) + M) % M;

        wynik.innerHTML = `Rozwiązanie: \\(x = ${x} \\pmod{${M}}\\), czyli \\(x \\in \\{${x}, ${x + M}, ${x + 2 * M}, \\cdots\\}\\) oraz \\(x \\in \\{${x - M}, ${x - 2 * M}, \\cdots\\}\\).`;
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise([wynik]);
        }
    });

    countInput.addEventListener('input', createRows);
    createRows();
})();
