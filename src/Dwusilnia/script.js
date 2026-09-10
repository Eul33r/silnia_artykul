(() => {
const formularz = document.getElementById("dwusilniaForm");
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

    // Obliczanie dwusilni za pomocą BigInt
    let result = 1n;

    if(n % 2 === 0)
    {
        for (let i = 2n; i <= BigInt(n); i += 2n) {
        result *= i;
        }
    }
    else
    {
        for (let i = 3n; i <= BigInt(n); i += 2n) {
        result *= i;
        }
    }

    // Wyświetlenie wyniku
    wynik.textContent = `${n}!! = ${result}`;
});
})();