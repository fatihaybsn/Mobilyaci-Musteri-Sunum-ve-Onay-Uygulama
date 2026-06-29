import { ImageFormat, Skia } from '@shopify/react-native-skia';
import type { File } from 'expo-file-system';

import type { QuadCorners, Size } from '../types/editor';

type ExportMaskInput = {
  destination: File;
  sourceSize: Size;
  sourceCorners: QuadCorners;
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

export function exportMaskPng({
  destination,
  sourceSize,
  sourceCorners,
}: ExportMaskInput): void {
  const width = Math.round(sourceSize.width);
  const height = Math.round(sourceSize.height);
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) {
    throw new Error('Orijinal fotoğraf boyutunda maske yüzeyi oluşturulamadı.');
  }

  const path = makeQuadPath(sourceCorners);
  const paint = Skia.Paint();
  let snapshot: ReturnType<typeof surface.makeImageSnapshot> | null = null;

  try {
    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color('#000000'));
    paint.setColor(Skia.Color('#FFFFFF'));
    paint.setAntiAlias(false);
    canvas.drawPath(path, paint);
    surface.flush();

    snapshot = surface.makeImageSnapshot();
    if (snapshot.width() !== width || snapshot.height() !== height) {
      throw new Error('Maske boyutu ile kaynak fotoğraf boyutu uyuşmuyor.');
    }

    const bytes = snapshot.encodeToBytes(ImageFormat.PNG, 100);
    if (bytes.byteLength === 0) {
      throw new Error('PNG maske üretilemedi.');
    }

    destination.create({ overwrite: true, intermediates: true });
    destination.write(bytes);
  } finally {
    snapshot?.dispose();
    paint.dispose();
    path.dispose();
    surface.dispose();
  }
}
