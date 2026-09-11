(() => {
    const canvas = document.getElementById('gridCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const startXInput = document.getElementById('startX');
    const startYInput = document.getElementById('startY');
    const endXInput = document.getElementById('endX');
    const endYInput = document.getElementById('endY');

    const btnStart = document.getElementById('btnStart');
    const btnPause = document.getElementById('btnPause');
    const btnReset = document.getElementById('btnReset');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const speedRange = document.getElementById('speedRange');
    const keepTrailsCheckbox = document.getElementById('keepTrails');

    const counterDisplay = document.getElementById('pathCounter');
    const sequenceDisplay = document.getElementById('pathSequence');
    const formulaDisplay = document.getElementById('pathFormula');

    let paths = [];
    let currentIndex = 0;
    let isPlaying = false;
    let animationTimer = null;
    let ax = 0, ay = 0, bx = 4, by = 5;

    function binomial(n, k) {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        k = Math.min(k, n - k);
        let res = 1;
        for (let i = 1; i <= k; i++) {
            res = (res * (n - i + 1)) / i;
        }
        return Math.round(res);
    }

    function generatePaths(dx, dy) {
        const allPaths = [];
        const maxPaths = 2000; // limit bezpieczeństwa przeglądarki

        function backtrack(cx, cy, current) {
            if (allPaths.length >= maxPaths) return;
            if (cx === dx && cy === dy) {
                allPaths.push([...current]);
                return;
            }
            if (cx < dx) {
                current.push('R');
                backtrack(cx + 1, cy, current);
                current.pop();
            }
            if (cy < dy) {
                current.push('U');
                backtrack(cx, cy + 1, current);
                current.pop();
            }
        }

        backtrack(0, 0, []);
        return allPaths;
    }

    function initProblem() {
        ax = parseInt(startXInput.value, 10) || 0;
        ay = parseInt(startYInput.value, 10) || 0;
        bx = parseInt(endXInput.value, 10) || 0;
        by = parseInt(endYInput.value, 10) || 0;

        if (bx < ax) {
            bx = ax;
            endXInput.value = bx;
        }
        if (by < ay) {
            by = ay;
            endYInput.value = by;
        }

        const dx = bx - ax;
        const dy = by - ay;
        const totalSteps = dx + dy;
        const totalCombinations = binomial(totalSteps, dx);

        paths = generatePaths(dx, dy);
        currentIndex = 0;

        if (formulaDisplay) {
            formulaDisplay.innerHTML = `Liczba wszystkich ścieżek: \\(\\binom{${dx} + ${dy}}{${dx}} = \\binom{${totalSteps}}{${dx}} = ${totalCombinations}\\)`;
            if (window.MathJax && MathJax.typesetPromise) {
                MathJax.typesetPromise([formulaDisplay]);
            }
        }

        updateUI();
        draw();
    }

    function getPathColor(index, alpha = 1) {
        const hue = (index * 137.508) % 360; // Złoty kąt dla maksymalnej różnorodności barw
        return `hsla(${hue}, 85%, 45%, ${alpha})`;
    }

    function draw() {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const dx = Math.max(1, bx - ax);
        const dy = Math.max(1, by - ay);

        const padding = 45;
        const usableW = width - 2 * padding;
        const usableH = height - 2 * padding;

        const cellW = usableW / dx;
        const cellH = usableH / dy;

        function toCanvasCoords(gridX, gridY) {
            const relX = gridX - ax;
            const relY = gridY - ay;
            return {
                x: padding + relX * cellW,
                y: height - padding - relY * cellH
            };
        }

        // 1. Rysowanie siatki
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1.5;

        for (let i = 0; i <= dx; i++) {
            const p1 = toCanvasCoords(ax + i, ay);
            const p2 = toCanvasCoords(ax + i, by);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Etykiety osi X
            ctx.fillStyle = '#333';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(ax + i, p1.x, height - padding + 20);
        }

        for (let j = 0; j <= dy; j++) {
            const p1 = toCanvasCoords(ax, ay + j);
            const p2 = toCanvasCoords(bx, ay + j);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Etykiety osi Y
            ctx.fillStyle = '#333';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(ay + j, padding - 12, p1.y + 4);
        }

        // 2. Rysowanie poprzednich śladów (jeśli włączone)
        if (keepTrailsCheckbox && keepTrailsCheckbox.checked && currentIndex > 0) {
            for (let pIdx = 0; pIdx < currentIndex; pIdx++) {
                drawSinglePath(paths[pIdx], getPathColor(pIdx, 0.25), 2.5);
            }
        }

        // 3. Rysowanie bieżącej aktywnej ścieżki
        if (paths.length > 0 && currentIndex < paths.length) {
            const activeColor = getPathColor(currentIndex, 1);
            drawSinglePath(paths[currentIndex], activeColor, 4.5);
        }

        function drawSinglePath(pathSteps, color, lineWidth) {
            if (!pathSteps) return;
            let curX = ax;
            let curY = ay;

            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const startPoint = toCanvasCoords(curX, curY);
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);

            for (const step of pathSteps) {
                if (step === 'R') curX += 1;
                else if (step === 'U') curY += 1;
                const nextPt = toCanvasCoords(curX, curY);
                ctx.lineTo(nextPt.x, nextPt.y);
            }
            ctx.stroke();
        }

        // 4. Rysowanie punktu A i B
        const ptA = toCanvasCoords(ax, ay);
        const ptB = toCanvasCoords(bx, by);

        // Punkt A (Start)
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(ptA.x, ptA.y, 7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#1b5e20';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`A(${ax},${ay})`, ptA.x - 10, ptA.y + 16);

        // Punkt B (Koniec)
        ctx.fillStyle = '#c62828';
        ctx.beginPath();
        ctx.arc(ptB.x, ptB.y, 7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#b71c1c';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`B(${bx},${by})`, ptB.x + 10, ptB.y - 10);
    }

    function updateUI() {
        const total = paths.length;
        const currentNumber = total > 0 ? currentIndex + 1 : 0;

        if (counterDisplay) {
            counterDisplay.textContent = total > 0 
                ? `Ścieżka: ${currentNumber} / ${total} (${Math.round((currentNumber / total) * 100)}%)`
                : 'Brak ścieżek';
        }

        if (sequenceDisplay) {
            if (total > 0 && paths[currentIndex]) {
                const formattedSequence = paths[currentIndex].map(step => 
                    step === 'R' ? '<span class="step-r">→ Prawo</span>' : '<span class="step-u">↑ Góra</span>'
                ).join(' ');
                sequenceDisplay.innerHTML = `<b>Sekwencja kroków:</b> ${formattedSequence}`;
            } else {
                sequenceDisplay.innerHTML = '<b>Sekwencja kroków:</b> —';
            }
        }

        if (btnPrev) btnPrev.disabled = currentIndex <= 0;
        if (btnNext) btnNext.disabled = currentIndex >= total - 1;
    }

    function stepForward() {
        if (currentIndex < paths.length - 1) {
            currentIndex++;
            updateUI();
            draw();
        } else {
            pauseAnimation();
        }
    }

    function stepBackward() {
        if (currentIndex > 0) {
            currentIndex--;
            updateUI();
            draw();
        }
    }

    function getDelay() {
        const raw = parseInt(speedRange.value, 10);
        // speedRange: 1 (wolno, 1000ms) do 10 (szybko, 30ms)
        return Math.max(30, 1050 - (raw * 100));
    }

    function playAnimation() {
        if (isPlaying) return;
        if (currentIndex >= paths.length - 1) {
            currentIndex = 0;
        }
        isPlaying = true;
        btnStart.textContent = 'Wznów';
        btnPause.style.display = 'inline-block';
        btnStart.style.display = 'none';

        function loop() {
            if (!isPlaying) return;
            stepForward();
            if (currentIndex < paths.length - 1 && isPlaying) {
                animationTimer = setTimeout(loop, getDelay());
            } else {
                pauseAnimation();
            }
        }
        animationTimer = setTimeout(loop, getDelay());
    }

    function pauseAnimation() {
        isPlaying = false;
        if (animationTimer) {
            clearTimeout(animationTimer);
            animationTimer = null;
        }
        btnStart.style.display = 'inline-block';
        btnPause.style.display = 'none';
    }

    function resetAnimation() {
        pauseAnimation();
        currentIndex = 0;
        updateUI();
        draw();
    }

    // Event listeners
    btnStart.addEventListener('click', () => {
        playAnimation();
    });

    btnPause.addEventListener('click', () => {
        pauseAnimation();
    });

    btnReset.addEventListener('click', () => {
        resetAnimation();
    });

    btnNext.addEventListener('click', () => {
        pauseAnimation();
        stepForward();
    });

    btnPrev.addEventListener('click', () => {
        pauseAnimation();
        stepBackward();
    });

    [startXInput, startYInput, endXInput, endYInput].forEach(input => {
        input.addEventListener('change', () => {
            pauseAnimation();
            initProblem();
        });
    });

    keepTrailsCheckbox.addEventListener('change', () => {
        draw();
    });

    // Inicjalizacja początkowa
    initProblem();
})();