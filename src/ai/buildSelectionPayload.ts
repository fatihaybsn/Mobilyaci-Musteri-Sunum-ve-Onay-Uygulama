import { FINISH_BY_ID } from '../config/finishes';
import { sourceQuadToNormalized } from '../canvas/engine/coordinateMapping';
import type { FinishId, QuadCorners, Size } from '../types/editor';
import { SELECTION_SCHEMA_VERSION } from './selectionSchema';
import type { SelectionPayload, SelectionPoint } from './selectionSchema';

type BuildSelectionPayloadInput = {
  clientRequestId: string;
  source: Size;
  sourceCorners: QuadCorners;
  finishId: FinishId;
};

function orderedPoints(corners: QuadCorners): [
  SelectionPoint,
  SelectionPoint,
  SelectionPoint,
  SelectionPoint,
] {
  return [
    { ...corners.topLeft },
    { ...corners.topRight },
    { ...corners.bottomRight },
    { ...corners.bottomLeft },
  ];
}

export function buildSelectionPayload({
  clientRequestId,
  source,
  sourceCorners,
  finishId,
}: BuildSelectionPayloadInput): SelectionPayload {
  const normalizedCorners = sourceQuadToNormalized(sourceCorners, source);
  const finish = FINISH_BY_ID[finishId];
  const hasWoodGrain = finishId === 'walnut';

  return {
    schemaVersion: SELECTION_SCHEMA_VERSION,
    clientRequestId,
    source: {
      width: Math.round(source.width),
      height: Math.round(source.height),
      orientationNormalized: true,
    },
    area: {
      type: 'quad',
      pointsNormalized: orderedPoints(normalizedCorners),
      pointsPixels: orderedPoints(sourceCorners),
    },
    door: {
      typeId: 'single-flat-door',
      styleId: 'flat',
      patternId: hasWoodGrain ? 'vertical-wood-grain' : 'solid-matte',
      colorId: finishId,
      colorHex: finish.color,
      textureId: hasWoodGrain ? 'walnut-grain' : 'matte',
    },
    handle: {
      modelId: 'none',
      finishId: 'none',
      placement: 'none',
    },
    locale: 'tr-TR',
  };
}
