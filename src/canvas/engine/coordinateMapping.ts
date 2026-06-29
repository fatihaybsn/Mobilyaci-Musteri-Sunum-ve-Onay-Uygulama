import type { Point, QuadCorners, Size } from '../../types/editor';

export type ContainMapping = {
  scale: number;
  offsetX: number;
  offsetY: number;
  displayedWidth: number;
  displayedHeight: number;
  sourceWidth: number;
  sourceHeight: number;
};

const EPSILON = 0.0001;

function assertValidSize(size: Size, label: string): void {
  if (
    !Number.isFinite(size.width) ||
    !Number.isFinite(size.height) ||
    size.width <= 0 ||
    size.height <= 0
  ) {
    throw new Error(`${label} ölçüleri geçersiz.`);
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

/** Kaynak görselin canvas'a `contain` ile yerleştirilme dönüşümünü hesaplar. */
export function createContainMapping(source: Size, canvas: Size): ContainMapping {
  assertValidSize(source, 'Kaynak fotoğraf');
  assertValidSize(canvas, 'Canvas');

  const scale = Math.min(canvas.width / source.width, canvas.height / source.height);
  const displayedWidth = source.width * scale;
  const displayedHeight = source.height * scale;

  return {
    scale,
    offsetX: (canvas.width - displayedWidth) / 2,
    offsetY: (canvas.height - displayedHeight) / 2,
    displayedWidth,
    displayedHeight,
    sourceWidth: source.width,
    sourceHeight: source.height,
  };
}

/** Canvas koordinatını orijinal fotoğrafın piksel koordinatına taşır. */
export function canvasPointToSourcePixel(point: Point, mapping: ContainMapping): Point {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new Error('Köşe koordinatı geçersiz.');
  }

  return {
    x: clamp((point.x - mapping.offsetX) / mapping.scale, 0, mapping.sourceWidth),
    y: clamp((point.y - mapping.offsetY) / mapping.scale, 0, mapping.sourceHeight),
  };
}

export function canvasQuadToSourcePixels(
  corners: QuadCorners,
  mapping: ContainMapping,
): QuadCorners {
  return {
    topLeft: canvasPointToSourcePixel(corners.topLeft, mapping),
    topRight: canvasPointToSourcePixel(corners.topRight, mapping),
    bottomRight: canvasPointToSourcePixel(corners.bottomRight, mapping),
    bottomLeft: canvasPointToSourcePixel(corners.bottomLeft, mapping),
  };
}

export function sourceQuadToNormalized(
  corners: QuadCorners,
  source: Size,
): QuadCorners {
  assertValidSize(source, 'Kaynak fotoğraf');

  const normalize = (point: Point): Point => ({
    x: clamp(point.x / source.width, 0, 1),
    y: clamp(point.y / source.height, 0, 1),
  });

  return {
    topLeft: normalize(corners.topLeft),
    topRight: normalize(corners.topRight),
    bottomRight: normalize(corners.bottomRight),
    bottomLeft: normalize(corners.bottomLeft),
  };
}

/** Shoelace formülüyle dörtgenin piksel alanını hesaplar. */
export function calculateQuadArea(corners: QuadCorners): number {
  const { topLeft, topRight, bottomRight, bottomLeft } = corners;
  const forward =
    topLeft.x * topRight.y +
    topRight.x * bottomRight.y +
    bottomRight.x * bottomLeft.y +
    bottomLeft.x * topLeft.y;
  const backward =
    topLeft.y * topRight.x +
    topRight.y * bottomRight.x +
    bottomRight.y * bottomLeft.x +
    bottomLeft.y * topLeft.x;

  return Math.abs(forward - backward) / 2;
}

function orientation(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function pointsOnOppositeSides(a: Point, b: Point, c: Point, d: Point): boolean {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  return first * second < -EPSILON;
}

function segmentsProperlyIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  return pointsOnOppositeSides(a, b, c, d) && pointsOnOppositeSides(c, d, a, b);
}

export function isSelfIntersectingQuad(corners: QuadCorners): boolean {
  return (
    segmentsProperlyIntersect(
      corners.topLeft,
      corners.topRight,
      corners.bottomRight,
      corners.bottomLeft,
    ) ||
    segmentsProperlyIntersect(
      corners.topRight,
      corners.bottomRight,
      corners.bottomLeft,
      corners.topLeft,
    )
  );
}

export function validateSourceQuad(corners: QuadCorners, source: Size): void {
  assertValidSize(source, 'Kaynak fotoğraf');

  if (isSelfIntersectingQuad(corners)) {
    throw new Error('Seçili dörtgen kendi üzerine kesişiyor. Köşeleri düzeltin.');
  }

  const area = calculateQuadArea(corners);
  const minimumArea = Math.max(256, source.width * source.height * 0.0005);
  if (!Number.isFinite(area) || area < minimumArea) {
    throw new Error('Seçili dörtgen alan boş veya AI render için çok küçük.');
  }
}
