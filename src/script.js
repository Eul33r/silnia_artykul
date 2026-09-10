const formularz = document.getElementById("silniaForm");
const poleLiczby = document.getElementById("liczba");
const wynik = document.getElementById("wynik");

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
    let silnia = 1n;

    for (let i = 2n; i <= BigInt(n); i++) {
        silnia *= i;
    }

    // Wyświetlenie wyniku
    wynik.textContent = `${n}! = ${silnia}`;
});