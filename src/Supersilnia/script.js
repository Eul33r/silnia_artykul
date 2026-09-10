(() => {
const formularz = document.getElementById("superfactorialForm");
const poleLiczby = document.getElementById("liczba");
const wynik = document.getElementById("wynik");


function factorial(n)
{
    // Obliczanie silni za pomocą BigInt
    let result = 1n;

    for (let i = 2n; i <= BigInt(n); i++) {
        result *= i;
    }
    return result
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
        result *= factorial(i);
    }

    // Wyświetlenie wyniku
    wynik.textContent = `sf(${n}) = ${result}`;
});
})();