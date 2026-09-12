(() => {
    const canvas = document.getElementById('gridCanvas3D');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const endXInput = document.getElementById('endX3D');
    const endYInput = document.getElementById('endY3D');
    const endZInput = document.getElementById('endZ3D');

    const btnStart = document.getElementById('btnStart3D');
    const btnPause = document.getElementById('btnPause3D');
    const btnReset = document.getElementById('btnReset3D');
    const btnResetView = document.getElementById('btnResetView3D');
    const btnPrev = document.getElementById('btnPrev3D');
    const btnNext = document.getElementById('btnNext3D');
    const speedRange = document.getElementById('speedRange3D');
    const keepTrailsCheckbox = document.getElementById('keepTrails3D');

    const counterDisplay = document.getElementById('pathCounter3D');
    const sequenceDisplay = document.getElementById('pathSequence3D');
    const formulaDisplay = document.getElementById('pathFormula3D');

    const DEFAULT_AZIMUTH = -Math.PI / 4;
    const DEFAULT_ELEVATION = Math.PI / 6;
    const MAX_ELEVATION = 1.5;

    let paths = [];
    let currentIndex = 0;
    let isPlaying = false;
    let animationTimer = null;
    let a = 3, b = 2, c = 1; // rozmiary pudełka (punkt docelowy B)
    let azimuth = DEFAULT_AZIMUTH; // obrót wokół osi pionowej (Z)
    let elevation = DEFAULT_ELEVATION; // pochylenie kamery

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

    function multinomial(x, y, z) {
        return binomial(x + y + z, x) * binomial(y + z, y);
    }

    function generatePaths(x, y, z) {
        const allPaths = [];
        const maxPaths = 3000; // limit bezpieczeństwa przeglądarki

        function backtrack(rv, ru, rw, current) {
            if (allPaths.length >= maxPaths) return;
            if (rv === 0 && ru === 0 && rw === 0) {
                allPaths.push([...current]);
                return;
            }
            if (rv > 0) {
                current.push('V');
                backtrack(rv - 1, ru, rw, current);
                current.pop();
            }
            if (ru > 0) {
                current.push('U');
                backtrack(rv, ru - 1, rw, current);
                current.pop();
            }
            if (rw > 0) {
                current.push('W');
                backtrack(rv, ru, rw - 1, current);
                current.pop();
            }
        }

        backtrack(x, y, z, []);
        return allPaths;
    }

    function initProblem() {
        a = parseInt(endXInput.value, 10) || 0;
        b = parseInt(endYInput.value, 10) || 0;
        c = parseInt(endZInput.value, 10) || 0;

        const totalSteps = a + b + c;
        const totalCombinations = multinomial(a, b, c);

        paths = generatePaths(a, b, c);
        currentIndex = 0;

        if (formulaDisplay) {
            formulaDisplay.innerHTML = `Liczba wszystkich ścieżek: \\(\\binom{${totalSteps}}{${a},${b},${c}} = \\frac{${totalSteps}!}{${a}!\\cdot ${b}!\\cdot ${c}!} = ${totalCombinations}\\)`;
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

    // Rzut punktu (x, y, z) na płaszczyznę ekranu po obrocie o kąty azimuth/elevation.
    // Oś Z traktowana jest jako "pionowa" (w górę), X i Y jako podłoga.
    function isoRaw(x, y, z) {
        const cosAz = Math.cos(azimuth), sinAz = Math.sin(azimuth);
        const cosEl = Math.cos(elevation), sinEl = Math.sin(elevation);

        // obrót wokół osi Z (azimuth)
        const x1 = x * cosAz - y * sinAz;
        const y1 = x * sinAz + y * cosAz;

        // pochylenie kamery wokół osi X (elevation)
        const z2 = y1 * sinEl + z * cosEl;

        return {
            ix: x1,
            iy: -z2
        };
    }

    function getProjection() {
        const dx = Math.max(1, a);
        const dy = Math.max(1, b);
        const dz = Math.max(1, c);

        const corners = [
            [0, 0, 0], [dx, 0, 0], [0, dy, 0], [0, 0, dz],
            [dx, dy, 0], [dx, 0, dz], [0, dy, dz], [dx, dy, dz]
        ].map(([x, y, z]) => isoRaw(x, y, z));

        const minIX = Math.min(...corners.map(p => p.ix));
        const maxIX = Math.max(...corners.map(p => p.ix));
        const minIY = Math.min(...corners.map(p => p.iy));
        const maxIY = Math.max(...corners.map(p => p.iy));

        const padding = 45;
        const usableW = canvas.width - 2 * padding;
        const usableH = canvas.height - 2 * padding;

        const spanIX = Math.max(0.0001, maxIX - minIX);
        const spanIY = Math.max(0.0001, maxIY - minIY);

        const scale = Math.min(usableW / spanIX, usableH / spanIY);

        const offsetX = padding + (usableW - spanIX * scale) / 2 - minIX * scale;
        const offsetY = padding + (usableH - spanIY * scale) / 2 - minIY * scale;

        return function project(x, y, z) {
            const { ix, iy } = isoRaw(x, y, z);
            return { x: ix * scale + offsetX, y: iy * scale + offsetY };
        };
    }

    function draw() {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const dx = Math.max(1, a);
        const dy = Math.max(1, b);
        const dz = Math.max(1, c);

        const project = getProjection();

        function line(p1, p2, color, lineWidth) {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        // 1. Siatka podłogi (płaszczyzna z=0)
        ctx.strokeStyle = '#e0e0e0';
        for (let i = 0; i <= dx; i++) {
            line(project(i, 0, 0), project(i, dy, 0), '#e0e0e0', 1.2);
        }
        for (let j = 0; j <= dy; j++) {
            line(project(0, j, 0), project(dx, j, 0), '#e0e0e0', 1.2);
        }

        // 2. Krawędzie "pudełka" dla lepszej percepcji głębi
        const boxColor = '#bdbdbd';
        line(project(0, 0, 0), project(0, 0, dz), boxColor, 1.5);
        line(project(dx, 0, 0), project(dx, 0, dz), boxColor, 1.5);
        line(project(0, dy, 0), project(0, dy, dz), boxColor, 1.5);
        line(project(dx, dy, 0), project(dx, dy, dz), boxColor, 1.5);
        line(project(0, 0, dz), project(dx, 0, dz), boxColor, 1.5);
        line(project(dx, 0, dz), project(dx, dy, dz), boxColor, 1.5);
        line(project(dx, dy, dz), project(0, dy, dz), boxColor, 1.5);
        line(project(0, dy, dz), project(0, 0, dz), boxColor, 1.5);

        function drawSinglePath(pathSteps, color, lineWidth) {
            if (!pathSteps) return;
            let cx = 0, cy = 0, cz = 0;

            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const startPoint = project(cx, cy, cz);
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);

            for (const step of pathSteps) {
                if (step === 'V') cx += 1;
                else if (step === 'U') cy += 1;
                else if (step === 'W') cz += 1;
                const nextPt = project(cx, cy, cz);
                ctx.lineTo(nextPt.x, nextPt.y);
            }
            ctx.stroke();
        }

        // 3. Poprzednie ślady (jeśli włączone)
        if (keepTrailsCheckbox && keepTrailsCheckbox.checked && currentIndex > 0) {
            for (let pIdx = 0; pIdx < currentIndex; pIdx++) {
                drawSinglePath(paths[pIdx], getPathColor(pIdx, 0.2), 2);
            }
        }

        // 4. Bieżąca aktywna ścieżka
        if (paths.length > 0 && currentIndex < paths.length) {
            drawSinglePath(paths[currentIndex], getPathColor(currentIndex, 1), 4);
        }

        // 5. Punkty A i B
        const ptA = project(0, 0, 0);
        const ptB = project(a, b, c);

        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(ptA.x, ptA.y, 7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#1b5e20';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('A(0,0,0)', ptA.x - 10, ptA.y + 16);

        ctx.fillStyle = '#c62828';
        ctx.beginPath();
        ctx.arc(ptB.x, ptB.y, 7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#b71c1c';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`B(${a},${b},${c})`, ptB.x + 10, ptB.y - 10);
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
                const formattedSequence = paths[currentIndex].map(step => {
                    if (step === 'V') return '<span class="step-r">→ X</span>';
                    if (step === 'U') return '<span class="step-u">↑ Y</span>';
                    return '<span class="step-w">⇧ Z</span>';
                }).join(' ');
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

    function resetView() {
        azimuth = DEFAULT_AZIMUTH;
        elevation = DEFAULT_ELEVATION;
        draw();
    }

    // Obracanie bryłą przeciągnięciem myszką lub palcem
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    function rotateBy(deltaX, deltaY) {
        const sensitivity = 0.01;
        azimuth += deltaX * sensitivity;
        elevation = Math.max(-MAX_ELEVATION, Math.min(MAX_ELEVATION, elevation - deltaY * sensitivity));
        draw();
    }

    function startDrag(x, y) {
        isDragging = true;
        lastPointerX = x;
        lastPointerY = y;
        canvas.style.cursor = 'grabbing';
    }

    function moveDrag(x, y) {
        if (!isDragging) return;
        rotateBy(x - lastPointerX, y - lastPointerY);
        lastPointerX = x;
        lastPointerY = y;
    }

    function endDrag() {
        isDragging = false;
        canvas.style.cursor = 'grab';
    }

    canvas.addEventListener('mousedown', (e) => {
        startDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
        moveDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', endDrag);

    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        moveDrag(touch.clientX, touch.clientY);
        e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', endDrag);

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

    btnResetView.addEventListener('click', () => {
        resetView();
    });

    btnNext.addEventListener('click', () => {
        pauseAnimation();
        stepForward();
    });

    btnPrev.addEventListener('click', () => {
        pauseAnimation();
        stepBackward();
    });

    [endXInput, endYInput, endZInput].forEach(input => {
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
