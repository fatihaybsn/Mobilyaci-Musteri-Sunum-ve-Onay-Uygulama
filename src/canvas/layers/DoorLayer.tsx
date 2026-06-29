import { useMemo } from 'react';
import { Group, Path, Skia } from '@shopify/react-native-skia';

import { FINISH_BY_ID } from '../../config/finishes';
import type { FinishId, QuadCorners } from '../../types/editor';

type DoorLayerProps = {
  corners: QuadCorners;
  finishId: FinishId;
};

function makeQuadPath(corners: QuadCorners) {
  const path = Skia.Path.Make();
  path.moveTo(corners.topLeft.x, corners.topLeft.y);
  path.lineTo(corners.topRight.x, corners.topRight.y);
  path.lineTo(corners.bottomRight.x, corners.bottomRight.y);
  path.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
  path.close();
  return path;
}

function makeGrainPaths(corners: QuadCorners) {
  const xs = [corners.topLeft.x, corners.topRight.x, corners.bottomRight.x, corners.bottomLeft.x];
  const ys = [corners.topLeft.y, corners.topRight.y, corners.bottomRight.y, corners.bottomLeft.y];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const height = Math.max(maxY - minY, 1);

  return Array.from({ length: 13 }, (_, index) => {
    const ratio = index / 12;
    const x = minX + (maxX - minX) * ratio;
    const wave = (index % 3 - 1) * 5;
    const path = Skia.Path.Make();
    path.moveTo(x, minY - 4);
    path.cubicTo(
      x + wave,
      minY + height * 0.28,
      x - wave * 1.5,
      minY + height * 0.68,
      x + wave * 0.5,
      maxY + 4,
    );
    return path;
  });
}

export function DoorLayer({ corners, finishId }: DoorLayerProps) {
  const finish = FINISH_BY_ID[finishId];
  const quadPath = useMemo(() => makeQuadPath(corners), [corners]);
  const grainPaths = useMemo(() => makeGrainPaths(corners), [corners]);

  return (
    <>
      <Group clip={quadPath}>
        <Path path={quadPath} color="#C7C4BC" />
        <Path path={quadPath} color={finish.color} blendMode="multiply" opacity={0.96} />

        <Group blendMode="multiply" opacity={finishId === 'white' ? 0.24 : 0.42}>
          {grainPaths.map((path, index) => (
            <Path
              key={index}
              path={path}
              color={finish.grainColor}
              style="stroke"
              strokeWidth={index % 4 === 0 ? 2.2 : 1.1}
            />
          ))}
        </Group>

        <Path
          path={quadPath}
          color={finish.highlightColor}
          style="stroke"
          strokeWidth={7}
          opacity={0.22}
          blendMode="screen"
        />
      </Group>

      <Path
        path={quadPath}
        color="#F2C14E"
        style="stroke"
        strokeWidth={2.5}
      />
    </>
  );
}
