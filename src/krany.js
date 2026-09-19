(() => {
	const form = document.getElementById('taps-form');
	const countInput = document.getElementById('tap-count');
	const timesContainer = document.getElementById('tap-times');
	const errorMessage = document.getElementById('taps-error');
	const leftTaps = document.getElementById('tap-lines-left');
	const rightTaps = document.getElementById('tap-lines-right');
	const water = document.getElementById('water');
	const percentOutput = document.getElementById('tank-percent');
	const statusOutput = document.getElementById('tank-status');
	const timeOutput = document.getElementById('tank-time');

	let animationFrame;

	const formatHours = (hours) => {
		if (hours < 0.01) {
			return `${(hours * 60).toFixed(2)} min`;
		}

		return `${hours.toFixed(2)} godz.`;
	};

	const createTapRows = () => {
		const count = Number.parseInt(countInput.value, 10);
		if (!Number.isInteger(count) || count < 1 || count > 20) {
			timesContainer.innerHTML = '';
			leftTaps.innerHTML = '';
			rightTaps.innerHTML = '';
			return;
		}

		timesContainer.innerHTML = Array.from({ length: count }, (_, index) => `
			<label class="tap-time-row" for="tap-time-${index + 1}">
				<span><b>Kran ${index + 1}</b> napełnia basen w czasie</span>
				<span class="tap-input-wrap">
					<input id="tap-time-${index + 1}" name="tap-time-${index + 1}" type="number" min="0.01" step="any" placeholder="${index + 1 === 1 ? '6' : index + 1 === 2 ? '8' : 'np. 10'}" required>
					<span>godz.</span>
				</span>
			</label>
		`).join('');

		const tapMarkup = (index) => `
			<div class="tap-illustration">
				<span class="tap-label">K${index + 1}</span>
				<span class="tap-body"><span class="tap-handle"></span></span>
				<span class="tap-stream"></span>
			</div>
		`;
		const leftCount = Math.ceil(count / 2);
		leftTaps.innerHTML = Array.from({ length: leftCount }, (_, index) => tapMarkup(index)).join('');
		rightTaps.innerHTML = Array.from({ length: count - leftCount }, (_, index) => tapMarkup(leftCount + index)).join('');
	};

	const resetAnimation = () => {
		cancelAnimationFrame(animationFrame);
		water.style.height = '0%';
		percentOutput.value = '0%';
		percentOutput.textContent = '0%';
		statusOutput.textContent = 'Gotowy do napełniania.';
		timeOutput.textContent = '--';
		document.querySelectorAll('.tap-illustration').forEach((tap) => {
			tap.classList.remove('is-active');
			tap.style.removeProperty('--stream-thickness');
			tap.style.removeProperty('--stream-speed');
		});
	};

	const startAnimation = (hours, values) => {
		const start = performance.now();
		const duration = Math.min(12000, Math.max(2500, hours * 1000));
		const taps = document.querySelectorAll('.tap-illustration');
		const fastestRate = Math.max(...values.map((value) => 1 / value));
		taps.forEach((tap, index) => {
			const relativeRate = (1 / values[index]) / fastestRate;
			tap.style.setProperty('--stream-thickness', `${3 + (relativeRate * 9)}px`);
			tap.style.setProperty('--stream-speed', `${Math.max(0.28, 0.85 - (relativeRate * 0.5))}s`);
			tap.classList.add('is-active');
		});

		const animate = (now) => {
			const progress = Math.min(1, (now - start) / duration);
			const percentage = Math.round(progress * 100);
			water.style.height = `${percentage}%`;
			percentOutput.value = `${percentage}%`;
			percentOutput.textContent = `${percentage}%`;

			if (progress < 1) {
				animationFrame = requestAnimationFrame(animate);
			} else {
				statusOutput.textContent = 'Zbiornik jest pełny.';
				taps.forEach((tap) => tap.classList.remove('is-active'));
			}
		};

		animationFrame = requestAnimationFrame(animate);
	};

	countInput.addEventListener('input', createTapRows);
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const values = [...timesContainer.querySelectorAll('input')].map((input) => Number(input.value));
		const invalidValue = values.some((value) => !Number.isFinite(value) || value <= 0);

		if (invalidValue || values.length === 0) {
			errorMessage.textContent = 'Wpisz dodatni czas dla każdego kranu.';
			return;
		}

		errorMessage.textContent = '';
		const combinedRate = values.reduce((sum, value) => sum + (1 / value), 0);
		const totalTime = 1 / combinedRate;
		resetAnimation();
		timeOutput.textContent = formatHours(totalTime);
		statusOutput.textContent = `Wspólna wydajność: ${combinedRate.toFixed(4)} zbiornika na godzinę.`;
		startAnimation(totalTime, values);
	});

	createTapRows();
	resetAnimation();
})();
