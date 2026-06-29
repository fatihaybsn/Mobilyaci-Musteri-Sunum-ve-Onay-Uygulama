export const SELECTION_SCHEMA_VERSION = 1 as const;

export type SelectionPoint = {
  x: number;
  y: number;
};

export type SelectionPayload = {
  schemaVersion: typeof SELECTION_SCHEMA_VERSION;
  clientRequestId: string;
  source: {
    width: number;
    height: number;
    orientationNormalized: true;
  };
  area: {
    type: 'quad';
    pointsNormalized: [SelectionPoint, SelectionPoint, SelectionPoint, SelectionPoint];
    pointsPixels: [SelectionPoint, SelectionPoint, SelectionPoint, SelectionPoint];
  };
  door: {
    typeId: 'single-flat-door';
    styleId: 'flat';
    patternId: 'solid-matte' | 'vertical-wood-grain';
    colorId: 'white' | 'anthracite' | 'walnut';
    colorHex: string;
    textureId: 'matte' | 'walnut-grain';
  };
  handle: {
    modelId: 'none';
    finishId: 'none';
    placement: 'none';
  };
  locale: 'tr-TR';
};
