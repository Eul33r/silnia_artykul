function gcd(a, b){
    a = Math.abs(a);
    b = Math.abs(b);

    if (a == 0 && b == 0) {
        consol.log("Największy wspólny dzielnik dwóch zer nie istnieje!")
        return 0;
    }

    while (b != 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

function lcm(a, b)
{
    return (a/gcd(a,b))*b;
}

(() => {
const formularz = document.getElementById("lcmForm");
const pole_n = document.getElementById("lcm_liczba_a");
const pole_k = document.getElementById("lcm_liczba_b");
const wynik = document.getElementById("wynik_lcm");

formularz.addEventListener("submit", function (event) {
    event.preventDefault();

    const wartosc1 = pole_n.value;
    const wartosc2 = pole_k.value;


    // Sprawdzenie, czy pole nie jest puste
    if (wartosc1 === "" || wartosc2 === "") {
        wynik.textContent = "Błąd: wprowadź liczby";
        return;
    }

    const a = Number(wartosc1);
    const b = Number(wartosc2);

    // Sprawdzenie, czy liczba jest całkowita 
    if (!Number.isInteger(a)) {
        wynik.textContent = "Błąd: a musi być liczbą całkowitą";
        return;
    }
    if (!Number.isInteger(b)) {
        wynik.textContent = "Błąd: b musi być liczbą całkowitą";
        return;
    }



    const result = (a/gcd(a, b))*b;

    // Wyświetlenie wyniku i ponowne renderowanie MathJax
    wynik.innerHTML = `\\(NWW(${a}, ${b}) = ${result.toString()}\\)`;
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([wynik]);
    }
});
})();


