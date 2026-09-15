function multifactorial(n, k) {
    // Check whether n and k are integers
    if (!Number.isInteger(n) || !Number.isInteger(k)) {
        return NaN;
    }

    // Check for invalid values
    if (k < 0 || k > n) {
        return 0n;
    }
    n = BigInt(n);
    k = BigInt(k);
    let r = BigInt(n % k);
    let result = 1n;
    for(let i = 1n; i <= BigInt(n); i++)
    {
        if(i % k === r)
            result *= i;
    }

    return result;
}



(() => {
const formularz = document.getElementById("multifactorialForm");
const pole_n = document.getElementById("liczban");
const pole_k = document.getElementById("liczbak");
const wynik = document.getElementById("wynik");

formularz.addEventListener("submit", function (event) {
    event.preventDefault();

    const wartosc1 = pole_n.value;
    const wartosc2 = pole_k.value;


    // Sprawdzenie, czy pole nie jest puste
    if (wartosc1 === "" || wartosc2 === "") {
        wynik.textContent = "Błąd: wprowadź liczby";
        return;
    }

    const n = Number(wartosc1);
    const k = Number(wartosc2);

    // Sprawdzenie, czy liczba jest całkowita i nieujemna
    if (!Number.isInteger(n) || n < 0) {
        wynik.textContent = "Błąd: n musi być liczbą naturalną(!)";
        return;
    }
    if (!Number.isInteger(k) || k <= 0) {
        wynik.textContent = "Błąd: k musi być liczbą całkowitą dodatnią(!)";
        return;
    }

    // if (k > n) {
    //     wynik.textContent = "Błąd: k nie może być większe od n (k ≤ n)";
    //     return;
    // }

    const result = multifactorial(n, k);
    console.log(result);
    // Wyświetlenie wyniku i ponowne renderowanie MathJax
    wynik.innerHTML = `\(\\(${n}!)_{${k}} = ${result.toString()}\\)`;
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([wynik]);
    }
});
})();