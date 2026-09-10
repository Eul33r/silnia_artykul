(() => {
const formularz = document.getElementById("hipersilniaForm");
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

    // Sprawdzenie, czy pole nie jest puste
    if (wartosc === "") {
        wynik.textContent = "Błąd: wprowadź liczbę.";
        return;
    }

    const n = Number(wartosc);

    // Sprawdzenie, czy liczba jest całkowita i nieujemna
    if (!Number.isInteger(n) || n < 0) {
        wynik.textContent = "Błąd: wprowadź liczbę naturalną.";
        return;
    }

    // Obliczanie silni za pomocą BigInt
    let result = 1n;

    for (let i = 2n; i <= BigInt(n); i++) {
        result *= potegaBigInt(i, i);
    }

    // Wyświetlenie wyniku
    wynik.textContent = `H(${n}) = ${result}`;
});
})();