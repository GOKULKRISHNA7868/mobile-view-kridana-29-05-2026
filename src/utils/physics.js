// Currently the wheel physics is implemented inside SpinWheel.jsx.
// This file is provided for future extraction/customization of physics helpers.

export const TAU = Math.PI * 2;

export function normalizeAngle(angle) {
  return ((angle % TAU) + TAU) % TAU;
}

export function computeSpinVelocity({
  totalRotation,
  durationMs
}) {
  const frames = durationMs / 16.67;
  return totalRotation / frames;
}
