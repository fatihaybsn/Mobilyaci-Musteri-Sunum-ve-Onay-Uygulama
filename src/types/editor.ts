export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type CanvasRect = Point & Size;

export type CornerKey = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

export type QuadCorners = Record<CornerKey, Point>;

export type FinishId = 'white' | 'anthracite' | 'walnut';

export type PhotoSource = {
  uri: string;
  width: number;
  height: number;
};

export type Matrix3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export const CORNER_KEYS: readonly CornerKey[] = [
  'topLeft',
  'topRight',
  'bottomRight',
  'bottomLeft',
];
