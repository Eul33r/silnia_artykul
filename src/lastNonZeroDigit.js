(() => {
const formularz = document.getElementById("lastNonZeroDigit");
const poleLiczby = document.getElementById("liczbaOstatniaCyfra");
const wynik = document.getElementById("wynikOstatniaCyfra");

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

    let silnia = 1;

    for (let i = 2; i <= n; i++) {
        silnia *= i;

        while (silnia % 10 === 0) {
            silnia /= 10;
        }

        silnia %= 1000000;
    }

    wynik.textContent = `Ostatnią niezerową cyfrą liczby ${n}! jest ${silnia % 10}`;
});
})();