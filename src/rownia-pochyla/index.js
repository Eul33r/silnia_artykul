function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function assertFiniteNumber(value, name) {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number.`);
  }
}

function assertPositive(value, name) {
  assertFiniteNumber(value, name);
  if (value <= 0) {
    throw new Error(`${name} must be greater than zero.`);
  }
}

function inferTriangle(input = {}) {
  const {
    length,
    height,
    base,
    angleDeg,
    angleRad,
  } = input;

  const angle = typeof angleDeg === 'number'
    ? angleDeg
    : typeof angleRad === 'number'
      ? toDegrees(angleRad)
      : undefined;

  const values = {
    length: typeof length === 'number' ? length : undefined,
    height: typeof height === 'number' ? height : undefined,
    base: typeof base === 'number' ? base : undefined,
    angleDeg: typeof angle === 'number' ? angle : undefined,
  };

  const known = Object.values(values).filter((value) => typeof value === 'number');
  if (known.length < 2) {
    throw new Error('Insufficient information to determine the incline geometry. Provide at least two values.');
  }

  if (values.angleDeg !== undefined && (values.angleDeg <= 0 || values.angleDeg >= 90)) {
    throw new Error('The incline angle must satisfy 0° < α < 90° for a standard slope.');
  }

  let resolved = {
    length: values.length,
    height: values.height,
    base: values.base,
    angleDeg: values.angleDeg,
  };

  if (values.length !== undefined && values.height !== undefined) {
    const baseValue = Math.sqrt(values.length * values.length - values.height * values.height);
    if (!Number.isFinite(baseValue) || baseValue <= 0) {
      throw new Error('Impossible geometry: the given length and height do not form a valid incline.');
    }
    resolved.base = baseValue;
    resolved.angleDeg = toDegrees(Math.asin(values.height / values.length));
  }

  if (values.length !== undefined && values.base !== undefined) {
    const heightValue = Math.sqrt(values.length * values.length - values.base * values.base);
    if (!Number.isFinite(heightValue) || heightValue <= 0) {
      throw new Error('Impossible geometry: the given length and base do not form a valid incline.');
    }
    resolved.height = heightValue;
    resolved.angleDeg = toDegrees(Math.acos(values.base / values.length));
  }

  if (values.height !== undefined && values.base !== undefined) {
    const lengthValue = Math.hypot(values.height, values.base);
    if (!Number.isFinite(lengthValue) || lengthValue <= 0) {
      throw new Error('Impossible geometry: the given height and base do not form a valid incline.');
    }
    resolved.length = lengthValue;
    resolved.angleDeg = toDegrees(Math.atan(values.height / values.base));
  }

  if (values.length !== undefined && values.angleDeg !== undefined) {
    resolved.height = values.length * Math.sin(toRadians(values.angleDeg));
    resolved.base = values.length * Math.cos(toRadians(values.angleDeg));
  }

  if (values.height !== undefined && values.angleDeg !== undefined) {
    resolved.length = values.height / Math.sin(toRadians(values.angleDeg));
    resolved.base = values.height / Math.tan(toRadians(values.angleDeg));
  }

  if (values.base !== undefined && values.angleDeg !== undefined) {
    resolved.height = values.base * Math.tan(toRadians(values.angleDeg));
    resolved.length = values.base / Math.cos(toRadians(values.angleDeg));
  }

  const finalLength = resolved.length ?? (resolved.height !== undefined && resolved.base !== undefined ? Math.hypot(resolved.height, resolved.base) : undefined);
  const finalHeight = resolved.height ?? (resolved.length !== undefined && resolved.base !== undefined ? Math.sqrt(resolved.length * resolved.length - resolved.base * resolved.base) : undefined);
  const finalBase = resolved.base ?? (resolved.length !== undefined && resolved.height !== undefined ? Math.sqrt(resolved.length * resolved.length - resolved.height * resolved.height) : undefined);
  const finalAngleDeg = resolved.angleDeg ?? (finalHeight !== undefined && finalBase !== undefined ? toDegrees(Math.atan(finalHeight / finalBase)) : undefined);

  if (finalLength === undefined || finalHeight === undefined || finalBase === undefined || finalAngleDeg === undefined) {
    throw new Error('Insufficient or inconsistent geometric data.');
  }

  if (finalLength <= 0 || finalHeight <= 0 || finalBase <= 0) {
    throw new Error('Invalid geometry: all geometric lengths must be positive.');
  }

  if (finalLength * finalLength < finalHeight * finalHeight + finalBase * finalBase - 1e-9 || finalLength * finalLength > finalHeight * finalHeight + finalBase * finalBase + 1e-9) {
    throw new Error('Impossible geometry: the values are inconsistent with a right triangle.');
  }

  return {
    length: finalLength,
    height: finalHeight,
    base: finalBase,
    angleDeg: finalAngleDeg,
    angleRad: toRadians(finalAngleDeg),
  };
}

function calculateWeight({ mass, gravity = 9.81 }) {
  assertPositive(mass, 'mass');
  assertPositive(gravity, 'gravity');
  return mass * gravity;
}

function calculateForceComponents({ mass, gravity = 9.81, angleDeg }) {
  assertPositive(mass, 'mass');
  assertPositive(gravity, 'gravity');

  if (angleDeg === undefined || !Number.isFinite(angleDeg)) {
    throw new Error('angleDeg is required to calculate force components.');
  }

  if (angleDeg <= 0 || angleDeg >= 90) {
    throw new Error('The incline angle must satisfy 0° < α < 90° for a standard slope.');
  }

  const angleRad = toRadians(angleDeg);
  const weight = mass * gravity;
  const parallel = weight * Math.sin(angleRad);
  const perpendicular = weight * Math.cos(angleRad);

  return {
    mass,
    gravity,
    angleDeg,
    angleRad,
    weight,
    parallel,
    perpendicular,
    normal: perpendicular,
  };
}

function evaluateStaticFriction({ mass, gravity = 9.81, angleDeg, muStatic }) {
  assertPositive(mass, 'mass');
  assertPositive(gravity, 'gravity');
  assertPositive(muStatic, 'muStatic');

  if (angleDeg === undefined || !Number.isFinite(angleDeg)) {
    throw new Error('angleDeg is required to evaluate static friction.');
  }

  const components = calculateForceComponents({ mass, gravity, angleDeg });
  const normal = components.normal;
  const maxStaticFriction = muStatic * normal;
  const canMove = components.parallel > maxStaticFriction;

  return {
    ...components,
    muStatic,
    maxStaticFriction,
    canMove,
    reason: canMove
      ? 'Ciało rusza, bo składowa równoległa jest większa niż maksymalne tarcie statyczne.'
      : 'Ciało nie rusza, bo maksymalne tarcie statyczne jest większe lub równe składowej równoległej.',
  };
}

function calculateMotion({ initialVelocity = 0, acceleration, time }) {
  assertFiniteNumber(initialVelocity, 'initialVelocity');
  assertFiniteNumber(acceleration, 'acceleration');
  assertFiniteNumber(time, 'time');

  if (time < 0) {
    throw new Error('time must be non-negative.');
  }

  const distance = initialVelocity * time + 0.5 * acceleration * time * time;
  const finalVelocity = initialVelocity + acceleration * time;

  return {
    initialVelocity,
    acceleration,
    time,
    distance,
    finalVelocity,
  };
}

const api = {
  toRadians,
  toDegrees,
  inferTriangle,
  calculateWeight,
  calculateForceComponents,
  evaluateStaticFriction,
  calculateMotion,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

if (typeof window !== 'undefined') {
  window.RowniaPochyla = api;
}
