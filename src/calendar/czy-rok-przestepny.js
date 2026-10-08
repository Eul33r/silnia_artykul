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

	async function copyText(text) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (error) {
			// Brak dostępu do Clipboard API (np. kontekst niezabezpieczony lub file://).
			const area = document.createElement('textarea');
			area.value = text;
			area.setAttribute('readonly', '');
			area.style.position = 'fixed';
			area.style.opacity = '0';
			document.body.appendChild(area);
			area.select();
			let ok = false;
			try {
				ok = document.execCommand('copy');
			} catch (fallbackError) {
				ok = false;
			}
			area.remove();
			return ok;
		}
	}

	function initTabs() {
		document.querySelectorAll('.code-tabs').forEach((widget) => {
			const tabs = [...widget.querySelectorAll('[role="tab"]')];
			const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

			function select(index, focus) {
				tabs.forEach((tab, tabIndex) => {
					const active = tabIndex === index;
					tab.setAttribute('aria-selected', String(active));
					tab.tabIndex = active ? 0 : -1;
					panels[tabIndex].hidden = !active;
				});
				if (focus) tabs[index].focus();
			}

			const copyButton = widget.querySelector('.code-copy');
			const status = widget.querySelector('.code-copy-status');
			let resetTimer = null;
			if (copyButton) {
				copyButton.addEventListener('click', async () => {
					const panel = panels.find((candidate) => !candidate.hidden);
					const code = panel ? panel.querySelector('code').textContent : '';
					const copied = await copyText(code);
					copyButton.classList.toggle('is-copied', copied);
					status.textContent = copied ? 'Skopiowano do schowka' : 'Nie udało się skopiować';
					clearTimeout(resetTimer);
					resetTimer = setTimeout(() => {
						copyButton.classList.remove('is-copied');
						status.textContent = '';
					}, 2000);
				});
			}

			tabs.forEach((tab, index) => {
				tab.addEventListener('click', () => select(index, false));
				tab.addEventListener('keydown', (event) => {
					const last = tabs.length - 1;
					const moves = {
						ArrowRight: index === last ? 0 : index + 1,
						ArrowLeft: index === 0 ? last : index - 1,
						Home: 0,
						End: last
					};
					if (!(event.key in moves)) return;
					event.preventDefault();
					select(moves[event.key], true);
				});
			});
		});
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = { isLeapYear: isLeapYear };
	}
	if (typeof document === 'undefined') return;

	initCalculator();
	initTabs();
})();
