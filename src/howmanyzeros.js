(() => {
const formularz = document.getElementById("howManyZeros");
const poleLiczby = document.getElementById("liczbaZera");
const wynik = document.getElementById("wynikZera");

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

 // Initialize result
    let count = 0;

    // Keep dividing n by powers of
    // 5 and update count
    for (let i = 5; Math.floor(n / i) >= 1; i *= 5)
        count += Math.floor(n / i);

    
    // Wyświetlenie wyniku
    wynik.textContent = `${n}! kończy się ${count} zerami`;
});
})();