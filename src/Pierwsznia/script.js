(() => {
const formularz = document.getElementById("pierwszniaForm");
const poleLiczby = document.getElementById("liczba");
const wynik = document.getElementById("wynik");

function is_prime(n)
{
    if(n < 2)
        return false;
    else if(n === 2)
        return true;
    else if(n % 2 === 0)
        return false;
    else{
        for(let i = 3; i * i <= n; i += 2)
        {
            if(n % i === 0)
                return false;
        }
        return true;
    }
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
    if(n <= 1)
    {
        wynik.textContent = `Pierwsznia z ${n} nie istnieje, gdyż nie ma liczb pierwszych <= ${n}. 2 jest najmniejszą liczbą pierwszą.`;
        return;
    }
    // Obliczanie pierwszni za pomocą BigInt
    let result = 1n;

    for (let i = 2n; i <= BigInt(n); i++) {
        if(is_prime(Number(i)))
        {
            result *= i;
        }
        
    }

    // Wyświetlenie wyniku
    wynik.textContent = `${n}# = ${result}`;
});
})();