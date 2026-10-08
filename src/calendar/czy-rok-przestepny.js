(() => {
	const MAX_DIGITS = 60;

	function isLeapYear(year) {
		if (year % 400n === 0n) return true;
		if (year % 100n === 0n) return false;
		return year % 4n === 0n;
	}

	function initCalculator() {
		const form = document.getElementById('leap-form');
		const input = document.getElementById('leap-year');
		const result = document.getElementById('leap-result');
		if (!form || !input || !result) return;

		function showMessage(text, className) {
			result.className = 'leap-result ' + className;
			result.replaceChildren();
			const message = document.createElement('p');
			message.textContent = text;
			result.appendChild(message);
		}

		form.addEventListener('submit', (event) => {
			event.preventDefault();
			const text = input.value.trim();
			if (!/^\+?\d+$/.test(text) || text.length > MAX_DIGITS) {
				showMessage('Podaj dodatnią liczbę całkowitą (maksymalnie ' + MAX_DIGITS + ' cyfr).', 'is-error');
				return;
			}
			const year = BigInt(text);
			if (year < 1n) {
				showMessage('Rok musi być liczbą dodatnią.', 'is-error');
				return;
			}

			const checks = [
				{ divisor: 4n, label: 'dzieli się przez 4' },
				{ divisor: 100n, label: 'dzieli się przez 100' },
				{ divisor: 400n, label: 'dzieli się przez 400' }
			];
			const list = document.createElement('ul');
			list.className = 'leap-steps';
			checks.forEach((check) => {
				const remainder = year % check.divisor;
				const item = document.createElement('li');
				item.className = remainder === 0n ? 'is-yes' : 'is-no';
				item.textContent = year + ' mod ' + check.divisor + ' = ' + remainder + ' — rok ' +
					(remainder === 0n ? '' : 'nie ') + check.label;
				list.appendChild(item);
			});

			const leap = isLeapYear(year);
			const verdict = document.createElement('p');
			verdict.className = 'leap-verdict';
			verdict.textContent = 'Rok ' + year + (leap ? ' jest przestępny' : ' nie jest przestępny') +
				' (' + (leap ? '366' : '365') + ' dni).';

			result.className = 'leap-result ' + (leap ? 'is-leap' : 'is-common');
			result.replaceChildren(verdict, list);
		});
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = { isLeapYear: isLeapYear };
	}
	if (typeof document === 'undefined') return;

	initCalculator();
})();
