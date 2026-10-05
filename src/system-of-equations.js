const TOL = 1e-10;

function cloneMatrix(matrix) {
	return matrix.map((row) => [...row]);
}

function formatNumber(value) {
	if (Math.abs(value) < TOL) return '0';
	return Number(value.toPrecision(8)).toString();
}

function formatNumberTeX(value) {
	const formatted = formatNumber(value);
	const scientific = formatted.match(/^(-?\d+(?:\.\d+)?)e([+-]?\d+)$/i);
	return scientific ? `${scientific[1]}\\times 10^{${Number(scientific[2])}}` : formatted;
}

function isValidVariableName(name) {
	return /^[A-Za-z][A-Za-z0-9]*(?:_[0-9]+)?$/.test(name);
}

function formatVariableTeX(name) {
	if (!isValidVariableName(name)) throw new Error('Nieprawidłowa nazwa zmiennej.');
	const [base, index] = name.split('_');
	return `\\mathit{${base}}${index ? `_{${index}}` : ''}`;
}

function formatMatrix(matrix) {
	return matrix.map((row) => `[ ${row.map(formatNumber).join('  ')} ]`).join('\n');
}

function formatMatrixTeX(matrix) {
	const variableCount = matrix[0].length - 1;
	const columns = `${'r'.repeat(variableCount)}|r`;
	const rows = matrix.map((row) => `${row.slice(0, variableCount).map(formatNumberTeX).join(' & ')} & ${formatNumberTeX(row[variableCount])}`);
	return `\\left[\\begin{array}{${columns}}${rows.join(' \\\\ ')}\\end{array}\\right]`;
}

function determinant(matrix) {
	const size = matrix.length;
	const work = cloneMatrix(matrix);
	let result = 1;

	for (let column = 0; column < size; column += 1) {
		let pivotRow = column;
		for (let row = column + 1; row < size; row += 1) {
			if (Math.abs(work[row][column]) > Math.abs(work[pivotRow][column])) pivotRow = row;
		}
		if (Math.abs(work[pivotRow][column]) < TOL) return 0;
		if (pivotRow !== column) {
			[work[column], work[pivotRow]] = [work[pivotRow], work[column]];
			result *= -1;
		}
		const pivot = work[column][column];
		result *= pivot;
		for (let row = column + 1; row < size; row += 1) {
			const factor = work[row][column] / pivot;
			for (let index = column + 1; index < size; index += 1) {
				work[row][index] -= factor * work[column][index];
			}
		}
	}
	return result;
}

function eliminate(inputMatrix, reduced, steps) {
	const matrix = cloneMatrix(inputMatrix);
	const equationCount = matrix.length;
	const variableCount = matrix[0].length - 1;
	const pivots = [];
	let pivotRow = 0;

	for (let column = 0; column < variableCount && pivotRow < equationCount; column += 1) {
		let bestRow = pivotRow;
		for (let row = pivotRow + 1; row < equationCount; row += 1) {
			if (Math.abs(matrix[row][column]) > Math.abs(matrix[bestRow][column])) bestRow = row;
		}
		if (Math.abs(matrix[bestRow][column]) < TOL) continue;

		if (bestRow !== pivotRow) {
			[matrix[pivotRow], matrix[bestRow]] = [matrix[bestRow], matrix[pivotRow]];
			steps.push({
				title: 'Zamiana wierszy',
				titleMath: `R_{${pivotRow + 1}} \\leftrightarrow R_{${bestRow + 1}}`,
				matrix: cloneMatrix(matrix),
			});
		}

		const pivot = matrix[pivotRow][column];
		if (reduced && Math.abs(pivot - 1) >= TOL) {
			for (let index = column; index <= variableCount; index += 1) matrix[pivotRow][index] /= pivot;
			steps.push({
				title: 'Normalizacja wiersza',
				titleMath: `R_{${pivotRow + 1}} \\leftarrow \\frac{1}{${formatNumberTeX(pivot)}}R_{${pivotRow + 1}}`,
				matrix: cloneMatrix(matrix),
			});
		}

		const firstRow = reduced ? 0 : pivotRow + 1;
		for (let row = firstRow; row < equationCount; row += 1) {
			if (row === pivotRow) continue;
			const factor = matrix[row][column] / matrix[pivotRow][column];
			if (Math.abs(factor) < TOL) {
				matrix[row][column] = 0;
				continue;
			}
			for (let index = column; index <= variableCount; index += 1) {
				matrix[row][index] -= factor * matrix[pivotRow][index];
				if (Math.abs(matrix[row][index]) < TOL) matrix[row][index] = 0;
			}
			steps.push({
				title: 'Eliminacja współczynnika',
				titleMath: `R_{${row + 1}} \\leftarrow R_{${row + 1}} - (${formatNumberTeX(factor)})R_{${pivotRow + 1}}`,
				matrix: cloneMatrix(matrix),
			});
		}
		pivots.push({ row: pivotRow, column });
		pivotRow += 1;
	}

	const inconsistent = matrix.some((row) => row.slice(0, variableCount).every((value) => Math.abs(value) < TOL)
		&& Math.abs(row[variableCount]) >= TOL);
	return { matrix, pivots, rank: pivots.length, inconsistent };
}

function solveLinearSystem(coefficients, constants, method = 'gauss', variableNames = null) {
	const size = coefficients.length;
	if (!Number.isInteger(size) || size < 1 || size > 10 || constants.length !== size
		|| coefficients.some((row) => row.length !== size)) {
		throw new Error('Układ musi mieć od 1 do 10 równań i tyle samo niewiadomych.');
	}
	if (![...coefficients.flat(), ...constants].every(Number.isFinite)) {
		throw new Error('Wszystkie współczynniki muszą być poprawnymi liczbami.');
	}
	const names = variableNames ?? Array.from({ length: size }, (_, index) => `x_${index + 1}`);
	if (names.length !== size || names.some((name) => !isValidVariableName(name)) || new Set(names).size !== size) {
		throw new Error('Każda niewiadoma musi mieć unikalną nazwę, np. x_1, y lub z.');
	}

	const augmented = coefficients.map((row, index) => [...row, constants[index]]);
	const steps = [{ title: 'Macierz rozszerzona układu', matrix: cloneMatrix(augmented) }];
	const eliminationSteps = method === 'cramer' ? [] : steps;
	const echelon = eliminate(augmented, method === 'jordan', eliminationSteps);
	const status = echelon.inconsistent ? 'none' : (echelon.rank < size ? 'infinite' : 'unique');
	let solution = null;
	if (method !== 'cramer') {
		steps.push({ title: method === 'jordan' ? 'Macierz w postaci zredukowanej' : 'Macierz schodkowa', matrix: echelon.matrix });
	}

	if (status === 'unique' && method !== 'cramer') {
		solution = Array(size).fill(0);
		if (method === 'jordan') {
			for (const pivot of echelon.pivots) {
				solution[pivot.column] = echelon.matrix[pivot.row][size];
				steps.push({
					title: 'Odczytanie rozwiązania dla',
					titleVariable: formatVariableTeX(names[pivot.column]),
					math: `${formatVariableTeX(names[pivot.column])} &= ${formatNumberTeX(solution[pivot.column])}`,
				});
			}
		} else {
			for (let row = size - 1; row >= 0; row -= 1) {
				const column = echelon.pivots[row].column;
				let numerator = echelon.matrix[row][size];
				const substitutions = [];
				for (let index = column + 1; index < size; index += 1) {
					numerator -= echelon.matrix[row][index] * solution[index];
					substitutions.push(`(${formatNumberTeX(echelon.matrix[row][index])})(${formatNumberTeX(solution[index])})`);
				}
				solution[column] = numerator / echelon.matrix[row][column];
				steps.push({
					title: 'Podstawienie wsteczne dla',
					titleVariable: formatVariableTeX(names[column]),
					math: `${formatVariableTeX(names[column])} &= \\frac{${formatNumberTeX(echelon.matrix[row][size])}${substitutions.map((term) => ` - ${term}`).join('')}}{${formatNumberTeX(echelon.matrix[row][column])}} = ${formatNumberTeX(solution[column])}`,
				});
			}
		}
	}

	if (method === 'cramer') {
		if (size > 5) throw new Error('Metoda Cramera jest dostępna dla maksymalnie 5 niewiadomych.');
		const mainDeterminant = determinant(coefficients);
		steps.push({ title: 'Wyznacznik macierzy współczynników', math: `\\Delta &= ${formatNumberTeX(mainDeterminant)}` });
		if (Math.abs(mainDeterminant) >= TOL) {
			solution = constants.map((_, column) => {
				const replaced = coefficients.map((row, index) => row.map((value, current) => current === column ? constants[index] : value));
				const value = determinant(replaced);
				steps.push({
					title: 'Wyznacznik',
					titleMath: `\\Delta_{${column + 1}}`,
					math: `\\Delta_{${column + 1}} &= ${formatNumberTeX(value)}, & ${formatVariableTeX(names[column])} &= \\frac{\\Delta_{${column + 1}}}{\\Delta} = ${formatNumberTeX(value / mainDeterminant)}`,
				});
				return value / mainDeterminant;
			});
		} else {
			steps.push({
				title: 'Nie można zastosować wzorów Cramera',
				math: '\\Delta = 0',
				text: 'Układ nie ma rozwiązania jednoznacznego. Klasyfikację wyznaczono metodą eliminacji.',
			});
		}
	}

	if (status === 'none') steps.push({ title: 'Układ sprzeczny', text: 'Wiersz zerowych współczynników z niezerową prawą stroną oznacza brak rozwiązań.' });
	if (status === 'infinite') {
		const reduced = method === 'jordan' ? echelon : eliminate(augmented, true, []);
		const pivotColumns = new Set(reduced.pivots.map((pivot) => pivot.column));
		const freeColumns = Array.from({ length: size }, (_, column) => column).filter((column) => !pivotColumns.has(column));
		const parameterNames = new Map(freeColumns.map((column, index) => [column, `\\mathit{t}_{${index + 1}}`]));
		const expressions = freeColumns.map((column) => `${formatVariableTeX(names[column])} &= ${parameterNames.get(column)}`);
		for (const pivot of reduced.pivots) {
			const terms = freeColumns.map((column) => `(${formatNumberTeX(-reduced.matrix[pivot.row][column])})${parameterNames.get(column)}`);
			expressions.push(`${formatVariableTeX(names[pivot.column])} &= ${formatNumberTeX(reduced.matrix[pivot.row][size])}${terms.map((term) => ` + ${term}`).join('')}`);
		}
		steps.push({
			title: 'Opis parametryczny rozwiązań',
			text: `Rząd macierzy wynosi ${echelon.rank}, a liczba niewiadomych ${size}.`,
			math: `\\begin{aligned}${expressions.join(' \\\\ ')}\\end{aligned}`,
		});
	}

	return { status, solution, rank: echelon.rank, steps };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { TOL, determinant, solveLinearSystem, formatMatrix };

if (typeof document !== 'undefined') {
	const form = document.querySelector('#system-form');
	if (form) {
		const sizeSelect = document.querySelector('#equation-count');
		const methodSelect = document.querySelector('#solution-method');
		const grid = document.querySelector('#equation-grid');
		const methodNote = document.querySelector('#method-note');
		const result = document.querySelector('#system-result');
		const summary = document.querySelector('#system-summary');
		const stepsContainer = document.querySelector('#system-steps');
		const preview = document.querySelector('#equation-preview-render');
		let previewQueue = Promise.resolve();
		let previewVersion = 0;
		const initialValues = [
			[1, 1, 1, 6],
			[2, -1, 1, 3],
			[1, 2, -1, 2],
		];

		function renderInputs(size, previousValues = null, previousNames = null) {
			grid.replaceChildren();
			const table = document.createElement('div');
			table.className = 'equation-table';
			table.style.setProperty('--system-size', size);
			table.setAttribute('role', 'group');
			table.setAttribute('aria-label', `${size} równań z ${size} niewiadomymi`);

			const header = document.createElement('div');
			header.className = 'equation-row equation-header';
			for (let column = 0; column < size; column += 1) {
				const variable = document.createElement('input');
				variable.className = 'variable-name-input';
				variable.type = 'text';
				variable.required = true;
				variable.pattern = '[A-Za-z][A-Za-z0-9]*(_[0-9]+)?';
				variable.maxLength = 16;
				variable.value = previousNames?.[column] ?? `x_${column + 1}`;
				variable.dataset.variableIndex = column;
				variable.setAttribute('aria-label', `Nazwa niewiadomej numer ${column + 1}`);
				header.append(variable);
			}
			const equals = document.createElement('span');
			equals.className = 'equation-equals';
			equals.textContent = '=';
			const rhsHeader = document.createElement('span');
			rhsHeader.className = 'equation-rhs-header';
			rhsHeader.textContent = 'Wynik';
			header.append(equals, rhsHeader);
			table.append(header);

			for (let row = 0; row < size; row += 1) {
				const equation = document.createElement('div');
				equation.className = 'equation-row';
				equation.setAttribute('role', 'group');
				equation.setAttribute('aria-label', `Równanie ${row + 1}`);
				for (let column = 0; column < size; column += 1) {
					const input = document.createElement('input');
					input.type = 'number';
					input.step = 'any';
					input.required = true;
					input.value = previousValues?.[row]?.[column] ?? initialValues[row]?.[column] ?? 0;
					input.dataset.row = row;
					input.dataset.column = column;
					input.setAttribute('aria-label', `Współczynnik przy ${previousNames?.[column] ?? `x_${column + 1}`} w równaniu ${row + 1}`);
					equation.append(input);
				}
				const equalsSign = document.createElement('span');
				equalsSign.className = 'equation-equals';
				equalsSign.textContent = '=';
				const constant = document.createElement('input');
				constant.type = 'number';
				constant.step = 'any';
				constant.required = true;
				constant.value = previousValues?.[row]?.[size] ?? initialValues[row]?.[size] ?? 0;
				constant.dataset.row = row;
				constant.dataset.column = size;
				constant.setAttribute('aria-label', `Wyraz wolny w równaniu ${row + 1}`);
				equation.append(equalsSign, constant);
				table.append(equation);
			}
			grid.append(table);
		}

		function getVariableNames() {
			const inputs = Array.from(grid.querySelectorAll('.variable-name-input'));
			const names = inputs.map((input) => input.value.trim());
			const seen = new Set();
			inputs.forEach((input, index) => {
				const name = names[index];
				let message = '';
				if (!isValidVariableName(name)) message = 'Użyj nazwy, np. x, y, z lub x_1.';
				else if (seen.has(name)) message = 'Każda niewiadoma musi mieć inną nazwę.';
				input.setCustomValidity(message);
				if (isValidVariableName(name)) seen.add(name);
			});
			return names;
		}

		function updateCoefficientLabels(names = getVariableNames()) {
			for (const input of grid.querySelectorAll('input[data-row][data-column]')) {
				const column = Number(input.dataset.column);
				if (column < names.length) {
					input.setAttribute('aria-label', `Współczynnik przy ${names[column]} w równaniu ${Number(input.dataset.row) + 1}`);
				}
			}
		}

		function updateMethodNote() {
			const cramerOption = methodSelect.querySelector('option[value="cramer"]');
			const exceedsCramerLimit = Number(sizeSelect.value) > 5;
			cramerOption.disabled = exceedsCramerLimit;
			if (exceedsCramerLimit && methodSelect.value === 'cramer') methodSelect.value = 'gauss';
			const useCramer = methodSelect.value === 'cramer';
			methodNote.textContent = exceedsCramerLimit
				? 'Metoda Cramera jest dostępna maksymalnie dla 5 niewiadomych.'
				: useCramer
					? 'Metoda Cramera wymaga niezerowego wyznacznika macierzy współczynników.'
				: 'Dla układów osobliwych solver określa, czy rozwiązań jest zero, jedno czy nieskończenie wiele.';
			methodNote.classList.toggle('system-warning', exceedsCramerLimit);
		}

		function appendStep(step, index) {
			const item = document.createElement('details');
			item.className = 'system-step';
			item.open = index === 0 || index === 1;
			const heading = document.createElement('summary');
			const number = document.createElement('span');
			number.className = 'system-step-number';
			number.textContent = String(index + 1).padStart(2, '0');
			const title = document.createElement('span');
			title.append(document.createTextNode(step.title));
			if (step.titleVariable) {
				const variable = document.createElement('span');
				variable.textContent = `\\(${step.titleVariable}\\)`;
				title.append(variable);
			}
			if (step.titleMath) {
				const operation = document.createElement('span');
				operation.textContent = `\\(${step.titleMath}\\)`;
				title.append(operation);
			}
			heading.append(number, title);
			item.append(heading);
			if (step.matrix) {
				const matrix = document.createElement('p');
				matrix.className = 'system-step-math system-matrix';
				matrix.textContent = `\\[${formatMatrixTeX(step.matrix)}\\]`;
				item.append(matrix);
			}
			if (step.text) {
				const text = document.createElement('p');
				text.className = 'system-step-text';
				text.textContent = step.text;
				item.append(text);
			}
			if (step.math) {
				const math = document.createElement('p');
				math.className = 'system-step-math';
				const aligned = step.math.includes('\\begin{aligned}')
					? step.math
					: `\\begin{aligned}${step.math}\\end{aligned}`;
				math.textContent = `\\[${aligned}\\]`;
				item.append(math);
			}
			stepsContainer.append(item);
		}

		function formatTeXNumber(value) {
			const formatted = formatNumber(value);
			const scientific = formatted.match(/^(-?\d+(?:\.\d+)?)e([+-]?\d+)$/i);
			return scientific ? `${scientific[1]}\\times 10^{${Number(scientific[2])}}` : formatted;
		}

		function formatEquation(row, size, names) {
			const terms = [];
			for (let column = 0; column < size; column += 1) {
				const coefficient = row[column];
				if (Math.abs(coefficient) < TOL) continue;
				const magnitude = Math.abs(coefficient);
				const coefficientText = Math.abs(magnitude - 1) < TOL ? '' : `${formatTeXNumber(magnitude)}\\,`;
				const sign = terms.length === 0 ? (coefficient < 0 ? '-' : '') : (coefficient < 0 ? ' - ' : ' + ');
				terms.push(`${sign}${coefficientText}${formatVariableTeX(names[column])}`);
			}
			const leftSide = terms.join('') || '0';
			return `${leftSide} &= ${formatTeXNumber(row[size])}`;
		}

		function renderEquationPreview() {
			if (!preview) return;
			const size = Number(sizeSelect.value);
			const names = getVariableNames();
			const validNames = names.every(isValidVariableName) && new Set(names).size === size;
			const rows = Array.from({ length: size }, (_, row) => {
				const values = Array.from(grid.querySelectorAll(`input[data-row="${row}"]`), (input) => Number(input.value));
				return values.length === size + 1 ? values : Array(size + 1).fill(0);
			});
			const tex = validNames
				? `\\left\\{\\begin{aligned}${rows.map((row) => formatEquation(row, size, names)).join(' \\\\ ')}\\end{aligned}\\right.`
				: null;
			const requestVersion = ++previewVersion;
			previewQueue = previewQueue.then(async () => {
				await MathJax.startup.promise;
				if (requestVersion !== previewVersion) return;
				MathJax.typesetClear([preview]);
				preview.replaceChildren();
				if (tex) {
					preview.textContent = `\\[${tex}\\]`;
					await MathJax.typesetPromise([preview]);
				} else {
					preview.textContent = 'Podaj unikalne nazwy, np. x, y, z lub x_1.';
				}
			}).catch(() => {
				if (requestVersion === previewVersion) preview.textContent = 'Nie udało się wyrenderować podglądu MathJax.';
			});
		}

		renderInputs(Number(sizeSelect.value));
		updateMethodNote();
		updateCoefficientLabels();
		renderEquationPreview();

		grid.addEventListener('input', () => {
			result.hidden = true;
			const names = getVariableNames();
			updateCoefficientLabels(names);
			renderEquationPreview();
		});

		sizeSelect.addEventListener('change', () => {
			const size = Number(sizeSelect.value);
			const oldSize = grid.querySelectorAll('.equation-row:not(.equation-header)').length;
			const previousRows = Array.from({ length: oldSize }, (_, row) => Array.from(
				grid.querySelectorAll(`input[data-row="${row}"]`), (input) => input.value,
			).map((value) => value === '' ? 0 : Number(value)));
			const previousNames = Array.from(grid.querySelectorAll('.variable-name-input'), (input) => input.value);
			const previous = Array.from({ length: size }, (_, row) => Array.from({ length: size + 1 }, (_, column) => (
				column === size ? previousRows[row]?.[oldSize] ?? 0
					: column < oldSize ? previousRows[row]?.[column] ?? 0 : 0
			)));
			const names = Array.from({ length: size }, (_, column) => previousNames[column] ?? `x_${column + 1}`);
			renderInputs(size, previous, names);
			if (result.hidden === false) result.hidden = true;
			updateMethodNote();
			updateCoefficientLabels(names);
			renderEquationPreview();
		});

		methodSelect.addEventListener('change', () => {
			updateMethodNote();
			result.hidden = true;
		});

		form.addEventListener('submit', (event) => {
			event.preventDefault();
			const size = Number(sizeSelect.value);
			const method = methodSelect.value;
			const fields = Array.from(grid.querySelectorAll('input[data-row][data-column]'));
			const values = Array.from({ length: size }, () => Array(size + 1).fill(0));
			for (const field of fields) values[Number(field.dataset.row)][Number(field.dataset.column)] = Number(field.value);
			const names = getVariableNames();
			if (!form.reportValidity()) return;

			try {
				const solved = solveLinearSystem(values.map((row) => row.slice(0, size)), values.map((row) => row[size]), method, names);
				const labels = {
					unique: ['Jedno rozwiązanie', 'system-unique'],
					infinite: ['Nieskończenie wiele rozwiązań', 'system-infinite'],
					none: ['Brak rozwiązań', 'system-none'],
				};
				summary.replaceChildren();
				summary.className = `system-summary ${labels[solved.status][1]}`;
				const status = document.createElement('p');
				status.className = 'system-status';
				status.textContent = `\\[\\text{${labels[solved.status][0]}}\\]`;
				summary.append(status);
				if (solved.status === 'unique') {
					const answer = document.createElement('p');
					answer.className = 'system-answer';
					const equations = solved.solution.map((value, index) => `${formatVariableTeX(names[index])} &= ${formatNumberTeX(value)}`);
					answer.textContent = `\\[\\begin{aligned}${equations.join(' \\\\ ')}\\end{aligned}\\]`;
					summary.append(answer);
				}
				MathJax.typesetClear([summary, stepsContainer]);
				stepsContainer.replaceChildren();
				solved.steps.forEach(appendStep);
				previewQueue = previewQueue.then(async () => {
					await MathJax.startup.promise;
					await MathJax.typesetPromise([summary, stepsContainer]);
				}).catch(() => {});
				result.hidden = false;
				result.scrollIntoView({ behavior: 'smooth', block: 'start' });
			} catch (error) {
				summary.className = 'system-summary system-none';
				summary.replaceChildren();
				const message = document.createElement('p');
				message.className = 'system-status';
				message.textContent = `\\[\\text{${error.message}}\\]`;
				summary.append(message);
				stepsContainer.replaceChildren();
				MathJax.typesetClear([summary, stepsContainer]);
				previewQueue = previewQueue.then(async () => {
					await MathJax.startup.promise;
					await MathJax.typesetPromise([summary]);
				}).catch(() => {});
				result.hidden = false;
			}
		});
	}
}
