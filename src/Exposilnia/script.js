(() => {
const formularz = document.getElementById("eksposilniaForm");
const poleLiczby = document.getElementById("liczba");
const wynik = document.getElementById("wynik");

function potegaBigInt(podstawa, wykladnik) {
    let wynikPotegi = 1n;

    while (wykladnik > 0n) {
        if (wykladnik % 2n === 1n) {
            wynikPotegi *= podstawa;
        }

        podstawa *= podstawa;
        wykladnik /= 2n;
    }

    return wynikPotegi;
}
formularz.addEventListener("submit", function (event) {
    event.preventDefault();

    const wartosc = poleLiczby.value;

    if (wartosc === "") {
        wynik.textContent = "Błąd: wprowadź liczbę.";
        return;
    }

    const n = Number(wartosc);

    if (!Number.isInteger(n) || n < 0) {
        wynik.textContent = "Błąd: wprowadź liczbę naturalną.";
        return;
    }

    if (n === 0) {
        wynik.textContent =
            "Dla n = 0 silnia eksponencjalna jest niezdefiniowana.";
        return;
    }

    let result = 1n;

    for (let podstawa = 2n; podstawa <= BigInt(n); podstawa++) {
        result = potegaBigInt(podstawa, result);
    }

    wynik.textContent = `E(${n}) = ${result}`;
});
})();