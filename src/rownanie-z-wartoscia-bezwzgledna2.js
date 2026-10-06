(() => {
	const MAX_N = 60;
	const MAX_DIGITS = 100;

	function parseDecimal(value) {
		const text = String(value).trim().replace(',', '.');
		const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(text);
		if (!match || text.length > MAX_DIGITS) return null;
		const fraction = match[3] || '';
		let integer = BigInt(match[2] + fraction);
		if (match[1] === '-') integer = -integer;
		return { integer: integer, scale: fraction.length };
	}

	function formatScaled(value, scale) {
		const negative = value < 0n;
		let digits = (negative ? -value : value).toString();
		if (scale > 0) {
			digits = digits.padStart(scale + 1, '0');
			const whole = digits.slice(0, -scale);
			const fraction = digits.slice(-scale).replace(/0+$/, '');
			digits = fraction ? whole + ',' + fraction : whole;
		}
		return (negative ? '-' : '') + digits;
	}

	function gcd(left, right) {
		left = left < 0n ? -left : left;
		right = right < 0n ? -right : right;
		while (right !== 0n) {
			const remainder = left % right;
			left = right;
			right = remainder;
		}
		return left;
	}

	function normalizeRational(numerator, denominator) {
		if (denominator < 0n) {
			numerator = -numerator;
			denominator = -denominator;
		}
		const divisor = gcd(numerator, denominator);
		return { numerator: numerator / divisor, denominator: denominator / divisor };
	}

	function formatCoordinate(value, scale) {
		const denominator = value.denominator * 10n ** BigInt(scale);
		const divisor = gcd(value.numerator, denominator);
		const numerator = value.numerator / divisor;
		const reducedDenominator = denominator / divisor;
		return reducedDenominator === 1n
			? numerator.toString()
			: '\\frac{' + numerator.toString() + '}{' + reducedDenominator.toString() + '}';
	}

	function formatScaledLatex(value, scale) {
		return formatScaled(value, scale).replace(',', '{,}');
	}

	function compareRational(left, right) {
		const difference = left.numerator * right.denominator - right.numerator * left.denominator;
		return difference < 0n ? -1 : difference > 0n ? 1 : 0;
	}

	function solveCases(values, target) {
		const breakpoints = [...new Set(values)].sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
		const cases = [];
		const pointSolutions = new Map();
		const intervalSolutions = [];
		const intervals = [{ lower: null, upper: breakpoints[0] }];

		for (let index = 1; index < breakpoints.length; index++) {
			intervals.push({ lower: breakpoints[index - 1], upper: breakpoints[index] });
		}
		intervals.push({ lower: breakpoints[breakpoints.length - 1], upper: null });

		intervals.forEach((interval, index) => {
			let slope = 0n;
			let intercept = 0n;
			const expandedTerms = values.map((value) => {
				const positive = interval.lower !== null && value <= interval.lower;
				if (positive) {
					slope += 1n;
					intercept -= value;
					return '(x − ' + formatScaled(value, solveCases.scale) + ')';
				}
				slope -= 1n;
				intercept += value;
				return '(' + formatScaled(value, solveCases.scale) + ' − x)';
			});
			const currentCase = { interval: interval, slope: slope, intercept: intercept, terms: expandedTerms };

			if (slope === 0n) {
				currentCase.result = intercept === target ? 'interval' : 'empty';
				if (intercept === target) intervalSolutions.push(interval);
			} else {
				const root = normalizeRational(target - intercept, slope);
				const aboveLower = interval.lower === null || root.numerator >= interval.lower * root.denominator;
				const belowUpper = interval.upper === null || root.numerator <= interval.upper * root.denominator;
				if (aboveLower && belowUpper) {
					currentCase.result = 'point';
					pointSolutions.set(root.numerator + '/' + root.denominator, root);
				} else {
					currentCase.result = 'empty';
				}
				currentCase.root = root;
			}
			currentCase.index = index + 1;
			cases.push(currentCase);
		});

		const points = [...pointSolutions.values()]
			.filter((point) => !intervalSolutions.some((interval) =>
				(interval.lower === null || point.numerator >= interval.lower * point.denominator) &&
				(interval.upper === null || point.numerator <= interval.upper * point.denominator)))
			.sort(compareRational);

		return { breakpoints: breakpoints, cases: cases, points: points, intervals: intervalSolutions };
	}

	function linearExpression(slope, intercept, scale) {
		let expression;
		if (slope === 1n) expression = 'x';
		else if (slope === -1n) expression = '−x';
		else expression = slope.toString() + 'x';

		if (intercept > 0n) expression += ' + ' + formatScaled(intercept, scale);
		else if (intercept < 0n) expression += ' − ' + formatScaled(-intercept, scale);
		return expression;
	}

	function intervalLabel(interval, breakpoints, scale) {
		if (interval.lower === null) return 'x ≤ ' + formatScaled(interval.upper, scale);
		if (interval.upper === null) return 'x ≥ ' + formatScaled(interval.lower, scale);
		return formatScaled(interval.lower, scale) + ' ≤ x ≤ ' + formatScaled(interval.upper, scale);
	}

	function floorDivide(numerator, denominator) {
		let quotient = numerator / denominator;
		if (numerator < 0n && numerator % denominator !== 0n) quotient -= 1n;
		return quotient;
	}

	function createNumberLine(breakpoints, solutions, scale) {
		const extents = breakpoints.slice();
		solutions.points.forEach((point) => extents.push(floorDivide(point.numerator, point.denominator)));
		solutions.intervals.forEach((interval) => {
			if (interval.lower !== null) extents.push(interval.lower);
			if (interval.upper !== null) extents.push(interval.upper);
		});

		let minimum = extents.reduce((best, value) => value < best ? value : best, extents[0]);
		let maximum = extents.reduce((best, value) => value > best ? value : best, extents[0]);
		let padding = (maximum - minimum) / 10n;
		if (padding < 1n) padding = 1n;
		minimum -= padding;
		maximum += padding;
		const span = maximum - minimum;
		const position = (value) => Number(((value - minimum) * 1000000000n) / span) / 1000000000 * 1000;
		const positionRational = (numerator, denominator) =>
			Number(((numerator - minimum * denominator) * 1000000000n) / (span * denominator)) / 1000000000 * 1000;
		const namespace = 'http://www.w3.org/2000/svg';
		const createSvgElement = (name, attributes) => {
			const element = document.createElementNS(namespace, name);
			Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
			return element;
		};
		const wrapper = document.createElement('div');
		wrapper.className = 'abs-axis-widget';
		const toolbar = document.createElement('div');
		toolbar.className = 'abs-axis-controls';
		const svg = createSvgElement('svg', {
			class: 'abs-axis-svg',
			viewBox: '0 0 1000 150',
			role: 'img',
			'tabindex': '0',
			'aria-label': 'Interaktywna oś liczbowa. Przeciągnij, aby przesunąć; użyj kółka myszy, aby przybliżyć lub oddalić.'
		});
		let viewX = -80;
		let viewWidth = 1160;
		const viewHeight = 150;

		function draw() {
			svg.setAttribute('viewBox', viewX + ' 0 ' + viewWidth + ' ' + viewHeight);
			svg.replaceChildren();
			svg.appendChild(createSvgElement('line', {
				class: 'abs-axis-line', x1: viewX, x2: viewX + viewWidth, y1: 72, y2: 72
			}));
			solutions.intervals.forEach((interval) => {
				const left = interval.lower === null ? viewX : Math.max(viewX, position(interval.lower));
				const right = interval.upper === null ? viewX + viewWidth : Math.min(viewX + viewWidth, position(interval.upper));
				if (right <= left) return;
				svg.appendChild(createSvgElement('line', {
					class: 'abs-axis-solution', x1: left, x2: right, y1: 72, y2: 72
				}));
			});
			solutions.points.forEach((point) => {
				const x = positionRational(point.numerator, point.denominator);
				if (x < viewX || x > viewX + viewWidth) return;
				svg.appendChild(createSvgElement('circle', { class: 'abs-axis-solution-point', cx: x, cy: 72, r: 6 }));
			});
			let lastLabelX = -Infinity;
			const bounds = svg.getBoundingClientRect();
			const minimumLabelGap = viewWidth * 56 / Math.max(bounds.width || 800, 1);
			breakpoints.forEach((value) => {
				const x = position(value);
				if (x < viewX || x > viewX + viewWidth) return;
				svg.appendChild(createSvgElement('line', {
					class: 'abs-axis-mark', x1: x, x2: x, y1: 60, y2: 84
				}));
				if (x - lastLabelX >= minimumLabelGap) {
					const label = createSvgElement('text', { class: 'abs-axis-label', x: x, y: 108, 'text-anchor': 'middle' });
					label.textContent = formatScaled(value, scale);
					svg.appendChild(label);
					lastLabelX = x;
				}
			});
		}

		function zoom(factor, anchor) {
			const nextWidth = Math.min(100000, Math.max(8, viewWidth * factor));
			const ratio = (anchor - viewX) / viewWidth;
			viewX = anchor - ratio * nextWidth;
			viewWidth = nextWidth;
			draw();
		}

		function addControl(label, title, action) {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'abs-axis-control';
			button.textContent = label;
			button.title = title;
			button.setAttribute('aria-label', title);
			button.addEventListener('click', action);
			toolbar.appendChild(button);
		}
		addControl('+', 'Przybliż oś', () => zoom(0.7, viewX + viewWidth / 2));
		addControl('−', 'Oddal oś', () => zoom(1.4, viewX + viewWidth / 2));
		addControl('↺', 'Przywróć cały zakres', () => {
			viewX = -80;
			viewWidth = 1160;
			draw();
		});

		let drag = null;
		svg.addEventListener('pointerdown', (event) => {
			if (event.button !== 0) return;
			drag = { pointerId: event.pointerId, startX: event.clientX, viewX: viewX };
			svg.setPointerCapture(event.pointerId);
			svg.classList.add('is-dragging');
		});
		svg.addEventListener('pointermove', (event) => {
			if (!drag || drag.pointerId !== event.pointerId) return;
			const bounds = svg.getBoundingClientRect();
			viewX = drag.viewX - (event.clientX - drag.startX) * viewWidth / bounds.width;
			draw();
		});
		const finishDrag = (event) => {
			if (!drag || drag.pointerId !== event.pointerId) return;
			drag = null;
			svg.classList.remove('is-dragging');
		};
		svg.addEventListener('pointerup', finishDrag);
		svg.addEventListener('pointercancel', finishDrag);
		svg.addEventListener('wheel', (event) => {
			event.preventDefault();
			const bounds = svg.getBoundingClientRect();
			const anchor = viewX + (event.clientX - bounds.left) / bounds.width * viewWidth;
			zoom(event.deltaY < 0 ? 0.85 : 1.18, anchor);
		}, { passive: false });
		svg.addEventListener('keydown', (event) => {
			if (event.key === '+' || event.key === '=') zoom(0.7, viewX + viewWidth / 2);
			if (event.key === '-') zoom(1.4, viewX + viewWidth / 2);
			if (event.key === 'ArrowLeft') { viewX -= viewWidth * 0.1; draw(); }
			if (event.key === 'ArrowRight') { viewX += viewWidth * 0.1; draw(); }
		});
		draw();
		wrapper.append(toolbar, svg);
		requestAnimationFrame(draw);
		return wrapper;
	}

	function intervalLatex(interval, scale) {
		const left = interval.lower === null ? '-\\infty' : formatScaledLatex(interval.lower, scale);
		const right = interval.upper === null ? '\\infty' : formatScaledLatex(interval.upper, scale);
		const leftDelimiter = interval.lower === null ? '(' : '[';
		const rightDelimiter = interval.upper === null ? ')' : ']';
		return '\\left' + leftDelimiter + ' ' + left + ', ' + right + ' \\right' + rightDelimiter;
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = { solveCases: solveCases };
	}
	if (typeof document === 'undefined') return;

	const nInput = document.getElementById('abs-n');
	const buildButton = document.getElementById('abs-build');
	const form = document.getElementById('abs-form');
	const fields = document.getElementById('abs-fields');
	const mInput = document.getElementById('abs-m');
	const equationPreview = document.getElementById('abs-equation-preview');
	const result = document.getElementById('abs-result');
	if (!nInput || !buildButton || !form || !fields || !mInput || !equationPreview || !result) return;
	let previewTimer = null;
	let previewVersion = 0;
	let previewQueue = Promise.resolve();

	function showError(message) {
		if (window.MathJax && window.MathJax.typesetClear) window.MathJax.typesetClear([result]);
		result.className = 'abs-result abs-error';
		result.textContent = message;
	}

	function updateEquationPreview() {
		const version = ++previewVersion;
		const parsed = [...fields.querySelectorAll('.abs-a')].map((input) => parseDecimal(input.value));
		if (parsed.length === 0) return;
		const parsedM = parseDecimal(mInput.value);
		const scale = Math.max(0, ...parsed.filter(Boolean).map((value) => value.scale), parsedM ? parsedM.scale : 0);
		const toScaled = (value) => value.integer * 10n ** BigInt(scale - value.scale);
		const terms = parsed.map((value, index) => {
			const coefficient = value === null ? 'a_{' + (index + 1) + '}' : formatScaledLatex(toScaled(value), scale);
			return '\\left|x - (' + coefficient + ')\\right|';
		});
		const rightSide = parsedM === null ? 'm' : formatScaledLatex(toScaled(parsedM), scale);
		let equation;
		if (terms.length <= 4) {
			equation = terms.join(' + ') + ' = ' + rightSide;
		} else {
			const lines = [];
			for (let index = 0; index < terms.length; index += 4) {
				const line = terms.slice(index, index + 4).join(' + ');
				lines.push((index === 0 ? '&' : '&+\\quad ') + line);
			}
			lines[lines.length - 1] += ' = ' + rightSide;
			equation = '\\begin{aligned}' + lines.join('\\\\') + '\\end{aligned}';
		}
		if (window.MathJax && window.MathJax.typesetClear) window.MathJax.typesetClear([equationPreview]);
		equationPreview.textContent = '\\[' + equation + '\\]';
		clearTimeout(previewTimer);
		previewTimer = setTimeout(() => {
			previewQueue = previewQueue.catch(() => {}).then(async () => {
				if (!window.MathJax || !window.MathJax.startup) return;
				await window.MathJax.startup.promise;
				if (version !== previewVersion) return;
				window.MathJax.typesetClear([equationPreview]);
				await window.MathJax.typesetPromise([equationPreview]);
			});
		}, 100);
	}

	function buildFields() {
		const count = Number(nInput.value);
		if (!Number.isInteger(count) || count < 1 || count > MAX_N) {
			showError('Podaj całkowite n z przedziału 1–' + MAX_N + '.');
			return;
		}
		fields.replaceChildren();
		for (let index = 1; index <= count; index++) {
			const label = document.createElement('label');
			label.className = 'abs-field';
			const caption = document.createElement('span');
			caption.textContent = 'a' + index;
			const input = document.createElement('input');
			input.type = 'text';
			input.inputMode = 'decimal';
			input.className = 'abs-a';
			input.required = true;
			input.value = String(index);
			label.append(caption, input);
			fields.appendChild(label);
		}
		form.hidden = false;
		result.className = 'abs-result';
		if (window.MathJax && window.MathJax.typesetClear) window.MathJax.typesetClear([result]);
		result.replaceChildren();
		updateEquationPreview();
	}

	function renderResults(values, target, scale) {
		const solved = solveCases(values, target);
		if (window.MathJax && window.MathJax.typesetClear) window.MathJax.typesetClear([result]);
		const count = document.createElement('p');
		count.className = 'abs-count';
		count.textContent = solved.intervals.length > 0
			? 'Liczba rozwiązań: nieskończenie wiele'
			: 'Liczba rozwiązań: ' + solved.points.length;
		result.className = 'abs-result';
		result.replaceChildren(count);

		const axisHeading = document.createElement('h3');
		axisHeading.textContent = 'Punkty podziału i rozwiązania na osi';
		result.append(axisHeading, createNumberLine(solved.breakpoints, solved, scale));

		const stepsHeading = document.createElement('h3');
		stepsHeading.textContent = 'Przypadki na przedziałach';
		const list = document.createElement('ol');
		list.className = 'abs-cases';
		solved.cases.forEach((currentCase) => {
			const item = document.createElement('li');
			item.className = 'abs-case';
			const heading = document.createElement('strong');
			heading.textContent = 'Przypadek ' + currentCase.index + ': ' + intervalLabel(currentCase.interval, solved.breakpoints, scale);
			const expansion = document.createElement('p');
			expansion.textContent = '\\(' + currentCase.terms.join(' + ').replaceAll('−', '-').replaceAll(',', '{,}') + ' = ' + formatScaledLatex(target, scale) + '\\)';
			const simplified = document.createElement('p');
			simplified.textContent = 'Po uproszczeniu: \\(' + linearExpression(currentCase.slope, currentCase.intercept, scale).replaceAll('−', '-').replaceAll(',', '{,}') + ' = ' + formatScaledLatex(target, scale) + '\\)';
			const conclusion = document.createElement('p');

			if (currentCase.result === 'interval') {
				conclusion.textContent = 'Tożsamość na tym przedziale: \\(x \\in ' + intervalLatex(currentCase.interval, scale) + '\\).';
				item.classList.add('abs-case-solution');
			} else if (currentCase.result === 'point') {
				conclusion.textContent = 'Rozwiązanie w tym przedziale: \\(x = ' + formatCoordinate(currentCase.root, scale) + '\\).';
				item.classList.add('abs-case-solution');
			} else if (currentCase.slope === 0n) {
				conclusion.textContent = 'Lewa strona jest stała i różna od m, więc w tym przedziale brak rozwiązań.';
			} else {
				conclusion.textContent = 'Wyliczony punkt \\(x = ' + formatCoordinate(currentCase.root, scale) + '\\) nie należy do tego przedziału; brak rozwiązań w tym przypadku.';
			}
			item.append(heading, expansion, simplified, conclusion);
			list.appendChild(item);
		});
		result.append(stepsHeading, list);

		const answer = document.createElement('p');
		answer.className = 'abs-final-answer';
		if (solved.intervals.length > 0) {
			const intervals = solved.intervals.map((interval) => intervalLatex(interval, scale)).join(' \\cup ');
			answer.textContent = 'Zbiór rozwiązań: \\(x \\in \\left\\{ ' + intervals + ' \\right\\}\\).';
		} else if (solved.points.length > 0) {
			answer.textContent = 'Zbiór rozwiązań: \\(x \\in \\left\\{ ' + solved.points.map((point) => formatCoordinate(point, scale)).join(', ') + ' \\right\\}\\).';
		} else {
			answer.textContent = 'Zbiór rozwiązań: \\(x \\in \\varnothing\\).';
		}
		result.appendChild(answer);
		if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
			window.MathJax.startup.promise.then(() => window.MathJax.typesetPromise([result]));
		}
	}

	buildButton.addEventListener('click', buildFields);
	fields.addEventListener('input', updateEquationPreview);
	mInput.addEventListener('input', updateEquationPreview);
	nInput.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			buildFields();
		}
	});

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const parsedValues = [...fields.querySelectorAll('.abs-a')].map((input) => parseDecimal(input.value));
		const parsedTarget = parseDecimal(mInput.value);
		if (parsedTarget === null || parsedValues.length === 0 || parsedValues.includes(null)) {
			showError('Wpisz liczby dziesiętne (np. 2, -3 lub 1,5); każda może mieć maksymalnie ' + MAX_DIGITS + ' znaków.');
			return;
		}

		const scale = Math.max(parsedTarget.scale, ...parsedValues.map((value) => value.scale));
		const toScaled = (value) => value.integer * 10n ** BigInt(scale - value.scale);
		solveCases.scale = scale;
		renderResults(parsedValues.map(toScaled), toScaled(parsedTarget), scale);
	});

})();
