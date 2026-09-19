(() => {
  const form = document.getElementById('ramp-form');
  if (!form) return;

  const feedback = document.getElementById('ramp-feedback');
  const canvas = document.getElementById('ramp-force-diagram');
  const motionCanvas = document.getElementById('ramp-motion-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const motionCtx = motionCanvas ? motionCanvas.getContext('2d') : null;
  const resultElements = {
    length: document.getElementById('result-length'),
    height: document.getElementById('result-height'),
    base: document.getElementById('result-base'),
    angle: document.getElementById('result-angle'),
    weight: document.getElementById('result-weight'),
    parallel: document.getElementById('result-parallel'),
    perpendicular: document.getElementById('result-perpendicular'),
    normal: document.getElementById('result-normal'),
    acceleration: document.getElementById('result-acceleration'),
    initialVelocity: document.getElementById('result-initial-velocity'),
    finalVelocity: document.getElementById('result-final-velocity'),
    distance: document.getElementById('result-distance'),
  };
  const fields = {
    length: document.getElementById('ramp-length'),
    height: document.getElementById('ramp-height'),
    base: document.getElementById('ramp-base'),
    angleDeg: document.getElementById('ramp-angle'),
    mass: document.getElementById('ramp-mass'),
    initialVelocity: document.getElementById('ramp-velocity'),
    gravity: document.getElementById('ramp-gravity'),
    frictionMode: document.getElementById('ramp-friction-mode'),
    muStatic: document.getElementById('ramp-mu-static'),
    muKinetic: document.getElementById('ramp-mu-kinetic'),
  };

  function setFeedback(message, type = 'info') {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.remove('is-error', 'is-success');
    if (type === 'error') feedback.classList.add('is-error');
    if (type === 'success') feedback.classList.add('is-success');
  }

  function readNumber(field) {
    const raw = field.value.trim();
    if (raw === '') return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  }

  function buildInput() {
    return {
      length: readNumber(fields.length),
      height: readNumber(fields.height),
      base: readNumber(fields.base),
      angleDeg: readNumber(fields.angleDeg),
      mass: readNumber(fields.mass),
      initialVelocity: readNumber(fields.initialVelocity),
      gravity: readNumber(fields.gravity),
      frictionMode: fields.frictionMode.value,
      muStatic: readNumber(fields.muStatic),
      muKinetic: readNumber(fields.muKinetic),
    };
  }

  const simState = {
    running: false,
    startTimestamp: 0,
    elapsedMs: 0,
    lastProgress: 0,
    snapshot: null,
    rafId: null,
  };

  function drawArrow(fromX, fromY, toX, toY, color, label, labelColor = '#0f172a') {
    if (!ctx) return;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLength = 12;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = labelColor;
    ctx.font = '12px sans-serif';
    ctx.fillText(label, toX + 8, toY - 8);
  }

  function renderMotionAtProgress(progress) {
    if (!motionCanvas || !motionCtx || !simState.snapshot) return;

    const { geometry, acceleration, initialVelocity, travelDistance } = simState.snapshot;
    const width = motionCanvas.width;
    const height = motionCanvas.height;
    const startX = 120;
    const startY = 300;
    const rampLength = 420;
    const rampAngle = geometry.angleRad;
    const endX = startX + rampLength * Math.cos(rampAngle);
    const endY = startY - rampLength * Math.sin(rampAngle);
    const effectiveDistance = Math.max(0, travelDistance || 0);
    const distanceToDraw = Math.min(effectiveDistance, effectiveDistance * progress);

    motionCtx.clearRect(0, 0, width, height);
    motionCtx.fillStyle = '#edf6ff';
    motionCtx.fillRect(0, 0, width, height);

    motionCtx.beginPath();
    motionCtx.moveTo(startX, startY);
    motionCtx.lineTo(endX, endY);
    motionCtx.strokeStyle = '#334155';
    motionCtx.lineWidth = 8;
    motionCtx.stroke();

    const boxX = startX + distanceToDraw * Math.cos(rampAngle);
    const boxY = startY - distanceToDraw * Math.sin(rampAngle);

    motionCtx.fillStyle = '#60a5fa';
    motionCtx.beginPath();
    motionCtx.moveTo(boxX - 24, boxY);
    motionCtx.lineTo(boxX + 24, boxY);
    motionCtx.lineTo(boxX + 34, boxY - 28);
    motionCtx.lineTo(boxX - 34, boxY - 28);
    motionCtx.closePath();
    motionCtx.fill();

    motionCtx.fillStyle = '#0f172a';
    motionCtx.font = '13px sans-serif';
    motionCtx.fillText(`a = ${acceleration.toFixed(3)} m/s²`, 30, 50);
    motionCtx.fillText(`v₀ = ${initialVelocity.toFixed(3)} m/s`, 30, 72);
    motionCtx.fillText(`s = ${distanceToDraw.toFixed(2)} m`, 30, 94);

    if (progress >= 1) {
      motionCtx.fillStyle = '#166534';
      motionCtx.font = '700 18px sans-serif';
      motionCtx.fillText('Dotarł do końca równi', 470, 80);
    }
  }

  function renderForceDiagram(data) {
    if (!canvas || !ctx) return;

    const { geometry, forces, friction } = data;
    const width = canvas.width;
    const height = canvas.height;
    const slopeStartX = 120;
    const slopeStartY = 310;
    const rampLength = 420;
    const angleRad = geometry.angleRad;
    const slopeEndX = slopeStartX + rampLength * Math.cos(angleRad);
    const slopeEndY = slopeStartY - rampLength * Math.sin(angleRad);
    const blockX = slopeStartX + 180 * Math.cos(angleRad);
    const blockY = slopeStartY - 180 * Math.sin(angleRad);
    const maxForce = Math.max(forces.weight, forces.parallel, forces.perpendicular, friction?.maxStaticFriction || 0, 1);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#edf6ff';
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(slopeStartX, slopeStartY);
    ctx.lineTo(slopeEndX, slopeEndY);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(slopeStartX + 125, slopeStartY - 36, 78, 28);

    ctx.beginPath();
    ctx.moveTo(blockX - 24, blockY);
    ctx.lineTo(blockX + 24, blockY);
    ctx.lineTo(blockX + 34, blockY - 28);
    ctx.lineTo(blockX - 34, blockY - 28);
    ctx.closePath();
    ctx.fillStyle = '#60a5fa';
    ctx.fill();

    const weightVectorLength = 90 * (forces.weight / maxForce);
    const parallelVectorLength = 110 * (forces.parallel / maxForce);
    const perpendicularVectorLength = 95 * (forces.perpendicular / maxForce);

    const weightEndX = blockX;
    const weightEndY = blockY + weightVectorLength;
    drawArrow(blockX, blockY, weightEndX, weightEndY, '#1d4ed8', 'Fg');

    const parallelAxisX = blockX + Math.cos(angleRad) * parallelVectorLength;
    const parallelAxisY = blockY - Math.sin(angleRad) * parallelVectorLength;
    drawArrow(blockX, blockY, parallelAxisX, parallelAxisY, '#16a34a', 'F||');

    const normalAngle = angleRad - Math.PI / 2;
    const normalEndX = blockX + Math.cos(normalAngle) * perpendicularVectorLength;
    const normalEndY = blockY + Math.sin(normalAngle) * perpendicularVectorLength;
    drawArrow(blockX, blockY, normalEndX, normalEndY, '#f59e0b', 'N');

    const frictionArrowLength = 70 * ((friction?.maxStaticFriction || forces.parallel) / maxForce);
    const frictionDir = friction && friction.canMove ? 1 : -1;
    const frictionEndX = blockX - Math.cos(angleRad) * frictionArrowLength * frictionDir;
    const frictionEndY = blockY + Math.sin(angleRad) * frictionArrowLength * frictionDir;
    drawArrow(blockX, blockY, frictionEndX, frictionEndY, '#ef4444', 'Ft');

    ctx.fillStyle = '#0f172a';
    ctx.font = '13px sans-serif';
    ctx.fillText('α', slopeStartX + 120, slopeStartY - 30);
    ctx.fillText('Fg = F|| + F⊥', 500, 80);
  }

  function updateResults(data) {
    const entries = [
      ['length', `${data.geometry.length.toFixed(3)} m`],
      ['height', `${data.geometry.height.toFixed(3)} m`],
      ['base', `${data.geometry.base.toFixed(3)} m`],
      ['angle', `${data.geometry.angleDeg.toFixed(2)}°`],
      ['weight', `${data.forces.weight.toFixed(3)} N`],
      ['parallel', `${data.forces.parallel.toFixed(3)} N`],
      ['perpendicular', `${data.forces.perpendicular.toFixed(3)} N`],
      ['normal', `${data.forces.normal.toFixed(3)} N`],
      ['acceleration', `${data.motion.acceleration.toFixed(3)} m/s²`],
      ['initialVelocity', `${data.motion.initialVelocity.toFixed(3)} m/s`],
      ['finalVelocity', `${data.motion.finalVelocity.toFixed(3)} m/s`],
      ['distance', `${data.motion.distance.toFixed(3)} m`],
    ];

    entries.forEach(([key, value]) => {
      if (resultElements[key]) {
        resultElements[key].textContent = value;
      }
    });
  }

  function buildSimulationSnapshot(input) {
    const geometry = {
      length: input.length,
      height: input.height,
      base: input.base,
      angleDeg: input.angleDeg,
    };

    const resolved = window.RowniaPochyla.inferTriangle(geometry);
    const mass = input.mass ?? 0;
    const gravity = input.gravity ?? 9.81;
    const angle = resolved.angleDeg;
    const forces = window.RowniaPochyla.calculateForceComponents({ mass, gravity, angleDeg: angle });
    const frictionState = input.frictionMode === 'kinetic'
      ? window.RowniaPochyla.evaluateStaticFriction({
          mass,
          gravity,
          angleDeg: angle,
          muStatic: input.muStatic ?? 0.2,
        })
      : { canMove: true, reason: 'Brak tarcia — ruch jest rozważany bez oporu.', maxStaticFriction: 0 };

    const acceleration = frictionState.canMove ? forces.parallel / mass : 0;
    const initialVelocity = input.initialVelocity ?? 0;
    const travelDistance = Math.max(0, resolved.length);
    const timeToEnd = acceleration > 0
      ? (-initialVelocity + Math.sqrt(initialVelocity * initialVelocity + 2 * acceleration * travelDistance)) / acceleration
      : 0;

    return {
      geometry: resolved,
      forces,
      friction: frictionState,
      acceleration,
      initialVelocity,
      travelDistance,
      duration: Math.max(0, timeToEnd),
      finalVelocity: initialVelocity + acceleration * timeToEnd,
    };
  }

  function handleSubmit(event) {
    event.preventDefault();

    const input = buildInput();

    try {
      const snapshot = buildSimulationSnapshot(input);
      const mass = input.mass ?? 0;

      if (!Number.isFinite(mass) || mass <= 0) {
        throw new Error('Masa musi być większa od zera.');
      }

      const motion = window.RowniaPochyla.calculateMotion({
        initialVelocity: snapshot.initialVelocity,
        acceleration: snapshot.acceleration,
        time: 1,
      });

      const message = [
        `Geometria: l = ${snapshot.geometry.length.toFixed(3)} m, h = ${snapshot.geometry.height.toFixed(3)} m, d = ${snapshot.geometry.base.toFixed(3)} m, α = ${snapshot.geometry.angleDeg.toFixed(2)}°`,
        `Fg = ${snapshot.forces.weight.toFixed(3)} N, F|| = ${snapshot.forces.parallel.toFixed(3)} N, F⊥ = ${snapshot.forces.perpendicular.toFixed(3)} N`,
        `Przyspieszenie = ${snapshot.acceleration.toFixed(3)} m/s²`,
        `Stan: ${snapshot.friction.canMove ? 'możliwe ruszenie' : 'ciało nie rusza'}`,
        `v1 = ${motion.finalVelocity.toFixed(3)} m/s po 1 s`,
      ].join(' | ');

      const data = {
        geometry: snapshot.geometry,
        forces: snapshot.forces,
        friction: snapshot.friction,
        motion: {
          ...motion,
          acceleration: snapshot.acceleration,
        },
      };

      updateResults(data);
      renderForceDiagram(data);
      simState.snapshot = snapshot;
      simState.running = false;
      simState.elapsedMs = 0;
      simState.lastProgress = 0;
      renderMotionAtProgress(0);
      setFeedback(message, 'success');
    } catch (error) {
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#edf6ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#475569';
        ctx.font = '18px sans-serif';
        ctx.fillText('Brak prawidłowych danych do narysowania diagramu', 120, 200);
      }
      setFeedback(error.message || 'Wystąpił błąd w obliczeniach.', 'error');
    }
  }

  function renderPreviewFromCurrentInput() {
    const input = buildInput();
    const hasAnyData = Object.values(input).some((value) => typeof value === 'number' && Number.isFinite(value));
    if (!hasAnyData) {
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#edf6ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#475569';
        ctx.font = '18px sans-serif';
        ctx.fillText('Wprowadź dane, aby zobaczyć diagram sił', 150, 200);
      }
      return;
    }

    try {
      const geometry = {
        length: input.length,
        height: input.height,
        base: input.base,
        angleDeg: input.angleDeg,
      };

      if (input.mass === undefined || input.mass <= 0) {
        return;
      }

      const resolved = window.RowniaPochyla.inferTriangle(geometry);
      const forces = window.RowniaPochyla.calculateForceComponents({ mass: input.mass, gravity: input.gravity ?? 9.81, angleDeg: resolved.angleDeg });
      const frictionState = input.frictionMode === 'kinetic'
        ? window.RowniaPochyla.evaluateStaticFriction({
            mass: input.mass,
            gravity: input.gravity ?? 9.81,
            angleDeg: resolved.angleDeg,
            muStatic: input.muStatic ?? 0.2,
          })
        : { canMove: true, maxStaticFriction: 0 };

      renderForceDiagram({
        geometry: resolved,
        forces,
        friction: frictionState,
      });
    } catch (error) {
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#edf6ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#475569';
        ctx.font = '18px sans-serif';
        ctx.fillText('Dane geometryczne są niekompletne lub sprzeczne', 120, 200);
      }
    }
  }

  function startSimulation() {
    if (!simState.snapshot || simState.snapshot.duration <= 0) return;
    simState.running = true;
    simState.startTimestamp = performance.now() - simState.elapsedMs;

    const tick = (timestamp) => {
      if (!simState.running) return;
      simState.elapsedMs = timestamp - simState.startTimestamp;
      const totalMs = Math.max(1, simState.snapshot.duration * 1000);
      const progress = Math.min(1, simState.elapsedMs / totalMs);
      simState.lastProgress = progress;
      renderMotionAtProgress(progress);

      if (progress < 1) {
        simState.rafId = requestAnimationFrame(tick);
      } else {
        simState.running = false;
      }
    };

    if (simState.rafId) cancelAnimationFrame(simState.rafId);
    simState.rafId = requestAnimationFrame(tick);
  }

  function pauseSimulation() {
    simState.running = false;
    if (simState.rafId) cancelAnimationFrame(simState.rafId);
    simState.rafId = null;
  }

  function resetSimulation() {
    pauseSimulation();
    simState.elapsedMs = 0;
    simState.lastProgress = 0;
    renderMotionAtProgress(0);
  }

  const startButton = document.getElementById('ramp-sim-start');
  const pauseButton = document.getElementById('ramp-sim-pause');
  const resetButton = document.getElementById('ramp-sim-reset');

  startButton?.addEventListener('click', startSimulation);
  pauseButton?.addEventListener('click', pauseSimulation);
  resetButton?.addEventListener('click', resetSimulation);

  form.addEventListener('submit', handleSubmit);
  form.addEventListener('input', renderPreviewFromCurrentInput);
  form.addEventListener('reset', () => {
    setFeedback('Wprowadź dane i kliknij „Oblicz”.');
    Object.values(resultElements).forEach((element) => {
      if (element) element.textContent = '—';
    });
    simState.running = false;
    simState.elapsedMs = 0;
    simState.lastProgress = 0;
    simState.snapshot = null;
    if (simState.rafId) cancelAnimationFrame(simState.rafId);
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#edf6ff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#475569';
      ctx.font = '18px sans-serif';
      ctx.fillText('Wprowadź dane, aby zobaczyć diagram sił', 150, 200);
    }
    if (motionCanvas && motionCtx) {
      motionCtx.clearRect(0, 0, motionCanvas.width, motionCanvas.height);
      motionCtx.fillStyle = '#edf6ff';
      motionCtx.fillRect(0, 0, motionCanvas.width, motionCanvas.height);
      motionCtx.fillStyle = '#475569';
      motionCtx.font = '18px sans-serif';
      motionCtx.fillText('Wprowadź dane, aby zobaczyć ruch', 180, 200);
    }
  });

  if (motionCanvas && motionCtx) {
    motionCtx.clearRect(0, 0, motionCanvas.width, motionCanvas.height);
    motionCtx.fillStyle = '#edf6ff';
    motionCtx.fillRect(0, 0, motionCanvas.width, motionCanvas.height);
    motionCtx.fillStyle = '#475569';
    motionCtx.font = '18px sans-serif';
    motionCtx.fillText('Wprowadź dane, aby zobaczyć ruch', 180, 200);
  }
})();
