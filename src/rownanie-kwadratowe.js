function solve(a, b, c) {
    if (a === 0) {
        if (b === 0) {
            return c === 0 ? { type: "identity" } : { type: "contradiction" };
        }

        return { type: "linear", root: -c / b };
    }

    const delta = b * b - 4 * a * c;
    if (delta < 0) {
        return { type: "quadratic", delta, roots: [] };
    }

    if (delta === 0) {
        return { type: "quadratic", delta, roots: [-b / (2 * a)] };
    }

    const squareRoot = Math.sqrt(delta);
    return {
        type: "quadratic",
        delta,
        roots: [(-b - squareRoot) / (2 * a), (-b + squareRoot) / (2 * a)]
    };
}


(() => {
const formularz = document.getElementById("quadratic-eqForm");
const pola = [
    document.getElementById("a"),
    document.getElementById("b"),
    document.getElementById("c")
];
const wynik = document.getElementById("wynik");

function parseCoefficient(value) {
    return Number(value.trim().replace(",", "."));
}

function formatNumber(value) {
    return Object.is(value, -0) ? "0" : String(value);
}

function addResultLine(text, className = "") {
    const line = document.createElement("p");
    line.textContent = text;
    if (className) {
        line.className = className;
    }
    wynik.appendChild(line);
}

formularz.addEventListener("submit", function (event) {
    event.preventDefault();

    const wartosci = pola.map((pole) => pole.value.trim());
    if (wartosci.some((wartosc) => wartosc === "")) {
        wynik.textContent = "Błąd: wprowadź wszystkie trzy współczynniki.";
        return;
    }

    const [a, b, c] = wartosci.map(parseCoefficient);
    if (![a, b, c].every(Number.isFinite)) {
        wynik.textContent = "Błąd: współczynniki muszą być skończonymi liczbami rzeczywistymi.";
        return;
    }

    wynik.replaceChildren();
    addResultLine(`Rozwiązujemy równanie: ${formatNumber(a)}x² + ${formatNumber(b)}x + ${formatNumber(c)} = 0.`);

    if (a !== 0 && b === 0 && c === 0) {
        addResultLine("Ponieważ b = 0 i c = 0, równanie ma postać ax² = 0.");
        addResultLine(`${formatNumber(a)}x² = 0  ⟹  x² = 0  ⟹  x = 0.`, "solution");
        return;
    }

    if (a !== 0 && b === 0) {
        const rhs = -c / a;
        addResultLine("Ponieważ b = 0, nie liczymy delty. Przenosimy wyraz wolny na prawą stronę:");
        addResultLine(`${formatNumber(a)}x² = ${formatNumber(-c)}`);
        addResultLine(`Dzielimy obie strony przez ${formatNumber(a)}: x² = ${formatNumber(rhs)}.`);
        if (rhs < 0) {
            addResultLine("Prawa strona jest ujemna, a kwadrat liczby rzeczywistej nie może być ujemny, więc równanie nie ma rozwiązań rzeczywistych.");
        } else {
            const root = Math.sqrt(rhs);
            addResultLine("Prawa strona jest dodatnia, więc pierwiastkujemy obie strony: |x| = √" + formatNumber(rhs) + ", czyli x = ±√" + formatNumber(rhs) + ".");
            addResultLine(`x₁ = ${formatNumber(-root)}, x₂ = ${formatNumber(root)}.`, "solution");
        }
        return;
    }

    if (a !== 0 && c === 0) {
        const root = -b / a;
        addResultLine("Ponieważ c = 0, nie liczymy delty. Wyciągamy x przed nawias:");
        addResultLine(`x · (${formatNumber(a)}x + ${formatNumber(b)}) = 0`);
        addResultLine("Iloczyn jest równy zero, gdy co najmniej jeden z czynników jest równy zero:");
        addResultLine("x = 0  lub  " + `${formatNumber(a)}x + ${formatNumber(b)} = 0.`);
        addResultLine(`Z drugiego równania: x = -b / a = ${formatNumber(root)}.`);
        addResultLine(`x₁ = 0, x₂ = ${formatNumber(root)}.`, "solution");
        return;
    }

    const result = solve(a, b, c);
    if (result.type === "identity") {
        addResultLine("Ponieważ 0 = 0, równanie jest tożsamościowe. Ma nieskończenie wiele rozwiązań rzeczywistych.");
        return;
    }

    if (result.type === "contradiction") {
        addResultLine("Ponieważ otrzymujemy sprzeczność, równanie nie ma rozwiązań rzeczywistych.");
        return;
    }

    if (result.type === "linear") {
        addResultLine(`Ponieważ a = 0, jest to równanie liniowe: ${formatNumber(b)}x + ${formatNumber(c)} = 0.`);
        addResultLine(`x = -c / b = ${formatNumber(result.root)}.`);
        return;
    }

    addResultLine(`Delta: Δ = b² - 4ac = ${formatNumber(b)}² - 4 · ${formatNumber(a)} · ${formatNumber(c)} = ${formatNumber(result.delta)}.`);
    if (result.roots.length === 0) {
        addResultLine("Ponieważ Δ < 0, równanie nie ma rozwiązań w zbiorze liczb rzeczywistych.");
    } else if (result.roots.length === 1) {
        addResultLine("Ponieważ Δ = 0, istnieje jeden pierwiastek podwójny:");
        addResultLine(`x₀ = -b / (2a) = ${formatNumber(result.roots[0])}.`, "solution");
    } else {
        addResultLine("Ponieważ Δ > 0, istnieją dwa pierwiastki:");
        addResultLine(`x₁ = (-b - √Δ) / (2a) = ${formatNumber(result.roots[0])}.`, "solution");
        addResultLine(`x₂ = (-b + √Δ) / (2a) = ${formatNumber(result.roots[1])}.`, "solution");
    }
});
})();