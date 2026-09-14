function getSum(n, s1, s2, s3){
    let suma = [];
    suma[0] = 3; // x^0 + y^0 + z^0 = 1 + 1 + 1 = 3
    suma[1] = s1; // x + y + z
    suma[2] = s2; // x^2 + y^2 + z^2
    suma[3] = s3; // x^3 + y^3 + z^3

    const sigma1 = s1; // sigma1 = x+y+z
    const sigma2 = 0.5 * (s1*s1 - s2); // sigma2 = xy+xz+zy
    const sigma3 = (s3 - sigma1*s2 + sigma2*s1) / 3; // z tożsamości Newtona: p3 = sigma1*p2 - sigma2*p1 + 3*sigma3

    for(let i = 4; i <= n; i++)
    {
        suma[i] = suma[i-1]*sigma1 - suma[i-2]*sigma2 + suma[i-3]*sigma3;
    }

    return suma[n];
}

(() => {
const formularz = document.getElementById("girard_newtonForm");
const field_n = document.getElementById("n");
const field_s1 = document.getElementById("s1");
const field_s2 = document.getElementById("s2");
const field_s3 = document.getElementById("s3");
const wynik = document.getElementById("wynik");

formularz.addEventListener("submit", function (event) {
    event.preventDefault();

    // Sprawdzenie, czy pola nie są puste
    if (field_n.value === "" || field_s1.value === "" || field_s2.value === "" || field_s3.value === "") {
        wynik.classList.add("error");
        wynik.textContent = "Błąd: wypełnij wszystkie pola.";
        return;
    }

    const n = Number(field_n.value);
    const s1 = Number(field_s1.value);
    const s2 = Number(field_s2.value);
    const s3 = Number(field_s3.value);

    if (!Number.isInteger(n) || n < 0) {
        wynik.classList.add("error");
        wynik.textContent = "Błąd: n musi być nieujemną liczbą całkowitą.";
        return;
    }

    const wynikSumy = getSum(n, s1, s2, s3);

        // Wyświetlenie wyniku i ponowne renderowanie MathJax
    wynik.innerHTML = `\\(x^${n} + y^${n} + z^${n} = ${wynikSumy.toString()}\\)`;
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([wynik]);
    }
});
})();