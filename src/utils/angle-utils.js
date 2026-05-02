export const TAU = Math.PI * 2;

export function normalizeAngle(angle) {
  return ((angle % TAU) + TAU) % TAU;
}

// Pointer is at 90° top (12 o'clock). We align the segment index so that
// index 0 is centered under the pointer when angle = 0. The wheel rotates by
// +angle, while the pointer stays fixed.
export function getSegmentIndexForAngle(wheelAngle, segmentCount) {
  if (!segmentCount || segmentCount <= 0) return -1;

  const slice = TAU / segmentCount;

  // Fixed pointer is at 12 o'clock.
  const pointerAngle = -Math.PI / 2;

  // Wheel has rotated by +wheelAngle. In wheel-local coordinates, the pointer
  // angle is pointerAngle - wheelAngle.
  const rel = normalizeAngle(pointerAngle - normalizeAngle(wheelAngle));

  const index = Math.floor(rel / slice);
  return index;
}

// Compute how much additional angle we must rotate from currentAngle so that
// the pointer lands on targetIndex after extraRotations full turns.
export function computeDeterministicDelta({
  currentAngle,
  targetIndex,
  segmentCount,
  extraRotations = 4
}) {
  if (segmentCount <= 0) return 0;

  const slice = TAU / segmentCount;
  const targetCenter = targetIndex * slice + slice / 2;

  // We want the wheel to stop so that the targetCenter is at 12 o'clock.
  const desiredAngleAtStop = normalizeAngle(targetCenter - Math.PI / 2);

  const currentNorm = normalizeAngle(currentAngle);
  const baseDelta = desiredAngleAtStop - currentNorm;

  const extra = extraRotations * TAU;
  return baseDelta + extra;
}
