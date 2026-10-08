(() => {
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
})();
