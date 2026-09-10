(() => {
const formularz = document.getElementById("howManyDigits");
const poleLiczby = document.getElementById("liczbaCyfr");
const wynik = document.getElementById("wynikDigits");

formularz.addEventListener("submit", function (event) {
	event.preventDefault();

	const wartosc = poleLiczby.value;

	if (wartosc === "") {
		wynik.textContent = "Błąd: wprowadź liczbę.";
		return;
	}

	const n = Number(wartosc);

	if (!Number.isInteger(n) || n < 0) {
		wynik.textContent = "Błąd: wprowadź liczbę naturalną.";
		return;
	}

	if (n === 0 || n === 1) {
		wynik.textContent = `${n}! ma 1 cyfrę w zapisie dziesiętnym`;
		return;
	}

	let logarytmSilni = 0;

	for (let i = 2; i <= n; i++) {
		logarytmSilni += Math.log10(i);
	}

	const liczbaCyfr = Math.floor(logarytmSilni) + 1;
	wynik.textContent = `${n}! ma ${liczbaCyfr} cyfr w zapisie dziesiętnym`;
});
})();
