(() => {
	const MIN_YEAR = 1583;
	const MAX_YEAR = 9999;
	const MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
		'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
	const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
	const RELATED = [
		{ name: 'Środa Popielcowa', offset: -46 },
		{ name: 'Niedziela Palmowa', offset: -7 },
		{ name: 'Wielki Piątek', offset: -2 },
		{ name: 'Poniedziałek Wielkanocny', offset: 1 },
		{ name: 'Zesłanie Ducha Świętego', offset: 49 },
		{ name: 'Boże Ciało', offset: 60 }
	];

	function gaussEaster(year) {
		const a = year % 19;
		const b = year % 4;
		const c = year % 7;
		const k = Math.floor(year / 100);
		const p = Math.floor((13 + 8 * k) / 25);
		const q = Math.floor(k / 4);
		const M = (15 - p + k - q) % 30;
		const N = (4 + k - q) % 7;
		const d = (19 * a + M) % 30;
		const e = (2 * b + 4 * c + 6 * d + N) % 7;

		let marchDay = 22 + d + e;
		let exception = null;
		if (d === 29 && e === 6) {
			marchDay = 50;
			exception = 'd = 29 i e = 6: zamiast 26 kwietnia Wielkanoc przypada 19 kwietnia.';
		} else if (d === 28 && e === 6 && (11 * M + 11) % 30 < 19) {
			marchDay = 49;
			exception = 'd = 28, e = 6 i (11M + 11) mod 30 < 19: zamiast 25 kwietnia Wielkanoc przypada 18 kwietnia.';
		}
		const month = marchDay > 31 ? 4 : 3;
		const day = marchDay > 31 ? marchDay - 31 : marchDay;
		return { a: a, b: b, c: c, k: k, p: p, q: q, M: M, N: N, d: d, e: e, month: month, day: day, exception: exception };
	}

	function shiftDate(year, month, day, offset) {
		const date = new Date(Date.UTC(year, month - 1, day + offset));
		return { day: date.getUTCDate(), month: date.getUTCMonth() + 1, weekday: date.getUTCDay() };
	}

	function formatDate(date) {
		return date.day + ' ' + MONTHS[date.month - 1];
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = { gaussEaster: gaussEaster };
	}
	if (typeof document === 'undefined') return;

	const form = document.getElementById('easter-form');
	const input = document.getElementById('easter-year');
	const result = document.getElementById('easter-result');
	if (!form || !input || !result) return;

	function element(tag, className, text) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text !== undefined) node.textContent = text;
		return node;
	}

	function showError(text) {
		result.className = 'easter-result is-error';
		result.replaceChildren(element('p', '', text));
	}

	function stepsTable(year, easter) {
		const rows = [
			['a', 'r mod 19', easter.a],
			['b', 'r mod 4', easter.b],
			['c', 'r mod 7', easter.c],
			['k', '⌊r / 100⌋', easter.k],
			['p', '⌊(13 + 8k) / 25⌋', easter.p],
			['q', '⌊k / 4⌋', easter.q],
			['M', '(15 − p + k − q) mod 30', easter.M],
			['N', '(4 + k − q) mod 7', easter.N],
			['d', '(19a + M) mod 30', easter.d],
			['e', '(2b + 4c + 6d + N) mod 7', easter.e],
			['22 + d + e', 'dzień marca (powyżej 31 → kwiecień)', 22 + easter.d + easter.e]
		];
		const table = element('table', 'easter-steps');
		const head = table.createTHead().insertRow();
		['Symbol', 'Wzór', 'Wartość'].forEach((title) => head.appendChild(element('th', '', title)));
		const body = table.createTBody();
		rows.forEach((row) => {
			const tr = body.insertRow();
			tr.insertCell().textContent = row[0];
			tr.insertCell().textContent = row[1];
			tr.insertCell().textContent = String(row[2]);
		});
		const wrapper = element('div', 'easter-table-scroll');
		wrapper.appendChild(table);
		return wrapper;
	}

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const text = input.value.trim();
		if (!/^\+?\d{1,5}$/.test(text)) {
			showError('Podaj rok jako liczbę całkowitą z przedziału ' + MIN_YEAR + '–' + MAX_YEAR + '.');
			return;
		}
		const year = Number(text);
		if (year < MIN_YEAR || year > MAX_YEAR) {
			showError('Algorytm dotyczy kalendarza gregoriańskiego: podaj rok z przedziału ' + MIN_YEAR + '–' + MAX_YEAR + '.');
			return;
		}

		const easter = gaussEaster(year);
		const date = shiftDate(year, easter.month, easter.day, 0);
		const verdict = element('p', 'easter-verdict',
			'Wielkanoc w roku ' + year + ': ' + formatDate(date) + ' (' + WEEKDAYS[date.weekday] + ')');

		const related = element('ul', 'easter-related');
		RELATED.forEach((feast) => {
			const feastDate = shiftDate(year, easter.month, easter.day, feast.offset);
			const item = element('li');
			item.append(element('span', 'easter-feast', feast.name), element('span', 'easter-feast-date',
				formatDate(feastDate) + ' (' + WEEKDAYS[feastDate.weekday] + ')'));
			related.appendChild(item);
		});

		const nodes = [verdict,
			element('h3', '', 'Kolejne kroki algorytmu'), stepsTable(year, easter)];
		if (easter.exception) nodes.push(element('p', 'easter-exception', 'Wyjątek Gaussa — ' + easter.exception));
		nodes.push(element('h3', '', 'Święta zależne od Wielkanocy'), related);

		result.className = 'easter-result';
		result.replaceChildren(...nodes);
	});
})();
