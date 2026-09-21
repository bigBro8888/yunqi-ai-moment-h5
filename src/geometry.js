const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function fitStage(viewportWidth, viewportHeight, designWidth, designHeight) {
  const vw = Math.max(0, number(viewportWidth));
  const vh = Math.max(0, number(viewportHeight));
  const dw = Math.max(1, number(designWidth, 1));
  const dh = Math.max(1, number(designHeight, 1));
  if (vw === 0 || vh === 0) return { scale: 0, width: 0, height: 0, left: 0, top: 0 };

  const scale = Math.min(vw / dw, vh / dh);
  const width = dw * scale;
  const height = dh * scale;
  return {
    scale,
    width,
    height,
    left: (vw - width) / 2,
    top: (vh - height) / 2,
  };
}

export function clampPosition(position, bounds, size) {
  const width = Math.max(0, number(bounds?.width));
  const height = Math.max(0, number(bounds?.height));
  const itemWidth = Math.max(0, number(size?.width));
  const itemHeight = Math.max(0, number(size?.height));
  return {
    x: Math.min(Math.max(0, number(position?.x)), Math.max(0, width - itemWidth)),
    y: Math.min(Math.max(0, number(position?.y)), Math.max(0, height - itemHeight)),
  };
}

export function positionFromPointer(pointer, stageRect, grabOffset, scale) {
  const safeScale = number(scale) > 0 ? number(scale) : 1;
  return {
    x: (number(pointer?.x) - number(stageRect?.left)) / safeScale - number(grabOffset?.x),
    y: (number(pointer?.y) - number(stageRect?.top)) / safeScale - number(grabOffset?.y),
  };
}
