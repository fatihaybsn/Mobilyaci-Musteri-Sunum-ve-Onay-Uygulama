import {
  BlendMode,
  ClipOp,
  ImageFormat,
  PaintStyle,
  Skia,
} from '@shopify/react-native-skia';
import type { SkImage, SkSurface } from '@shopify/react-native-skia';
import type { File } from 'expo-file-system';

import { FINISH_BY_ID } from '../config/finishes';
import type { FinishId, PhotoSource, QuadCorners, Size } from '../types/editor';

type ExportJpegInput = {
  destination: File;
  sourceImage: SkImage;
  sourceSize: Size;
};

type ExportPreviewInput = ExportJpegInput & {
  sourceCorners: QuadCorners;
  finishId: FinishId;
};

function createSurface(sourceSize: Size): SkSurface {
  const surface = Skia.Surface.MakeOffscreen(
    Math.round(sourceSize.width),
    Math.round(sourceSize.height),
  );
  if (!surface) {
    throw new Error('Orijinal fotoğraf boyutunda export yüzeyi oluşturulamadı.');
  }
  return surface;
}

function drawSourceImage(surface: SkSurface, sourceImage: SkImage, sourceSize: Size): void {
  const canvas = surface.getCanvas();
  const paint = Skia.Paint();
  paint.setAntiAlias(true);

  try {
    canvas.clear(Skia.Color('#000000'));
    canvas.drawImageRect(
      sourceImage,
      Skia.XYWHRect(0, 0, sourceImage.width(), sourceImage.height()),
      Skia.XYWHRect(0, 0, sourceSize.width, sourceSize.height),
      paint,
    );
  } finally {
    paint.dispose();
  }
}

function makeQuadPath(corners: QuadCorners) {
  const path = Skia.Path.Make();
  path.moveTo(corners.topLeft.x, corners.topLeft.y);
  path.lineTo(corners.topRight.x, corners.topRight.y);
  path.lineTo(corners.bottomRight.x, corners.bottomRight.y);
  path.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
  path.close();
  return path;
}

function drawDoorPreview(
  surface: SkSurface,
  corners: QuadCorners,
  finishId: FinishId,
): void {
  const canvas = surface.getCanvas();
  const finish = FINISH_BY_ID[finishId];
  const path = makeQuadPath(corners);
  const basePaint = Skia.Paint();
  const colorPaint = Skia.Paint();
  const grainPaint = Skia.Paint();
  const highlightPaint = Skia.Paint();

  const minX = Math.min(
    corners.topLeft.x,
    corners.topRight.x,
    corners.bottomRight.x,
    corners.bottomLeft.x,
  );
  const maxX = Math.max(
    corners.topLeft.x,
    corners.topRight.x,
    corners.bottomRight.x,
    corners.bottomLeft.x,
  );
  const minY = Math.min(
    corners.topLeft.y,
    corners.topRight.y,
    corners.bottomRight.y,
    corners.bottomLeft.y,
  );
  const maxY = Math.max(
    corners.topLeft.y,
    corners.topRight.y,
    corners.bottomRight.y,
    corners.bottomLeft.y,
  );
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  try {
    basePaint.setColor(Skia.Color('#C7C4BC'));
    basePaint.setAntiAlias(true);
    canvas.drawPath(path, basePaint);

    colorPaint.setColor(Skia.Color(finish.color));
    colorPaint.setAlphaf(0.96);
    colorPaint.setBlendMode(BlendMode.Multiply);
    colorPaint.setAntiAlias(true);
    canvas.drawPath(path, colorPaint);

    const saveCount = canvas.save();
    canvas.clipPath(path, ClipOp.Intersect, true);
    grainPaint.setColor(Skia.Color(finish.grainColor));
    grainPaint.setAlphaf(finishId === 'white' ? 0.24 : 0.42);
    grainPaint.setBlendMode(BlendMode.Multiply);
    grainPaint.setStyle(PaintStyle.Stroke);
    grainPaint.setAntiAlias(true);

    for (let index = 0; index < 13; index += 1) {
      const ratio = index / 12;
      const x = minX + width * ratio;
      const wave = (index % 3 - 1) * Math.max(width * 0.012, 2);
      const grainPath = Skia.Path.Make();
      grainPath.moveTo(x, minY - 4);
      grainPath.cubicTo(
        x + wave,
        minY + height * 0.28,
        x - wave * 1.5,
        minY + height * 0.68,
        x + wave * 0.5,
        maxY + 4,
      );
      grainPaint.setStrokeWidth(index % 4 === 0 ? Math.max(width * 0.006, 2) : Math.max(width * 0.003, 1));
      canvas.drawPath(grainPath, grainPaint);
      grainPath.dispose();
    }
    canvas.restoreToCount(saveCount);

    highlightPaint.setColor(Skia.Color(finish.highlightColor));
    highlightPaint.setAlphaf(0.22);
    highlightPaint.setBlendMode(BlendMode.Screen);
    highlightPaint.setStyle(PaintStyle.Stroke);
    highlightPaint.setStrokeWidth(Math.max(width * 0.018, 3));
    highlightPaint.setAntiAlias(true);
    canvas.drawPath(path, highlightPaint);
  } finally {
    highlightPaint.dispose();
    grainPaint.dispose();
    colorPaint.dispose();
    basePaint.dispose();
    path.dispose();
  }
}

function writeSurfaceAsJpeg(surface: SkSurface, destination: File, quality: number): void {
  surface.flush();
  const snapshot = surface.makeImageSnapshot();
  try {
    const bytes = snapshot.encodeToBytes(ImageFormat.JPEG, quality);
    if (bytes.byteLength === 0) {
      throw new Error('JPG dosyası üretilemedi.');
    }
    destination.create({ overwrite: true, intermediates: true });
    destination.write(bytes);
  } finally {
    snapshot.dispose();
  }
}

export async function decodeLocalPhoto(photo: PhotoSource): Promise<SkImage> {
  if (/^https?:\/\//i.test(photo.uri)) {
    throw new Error('AI render paketi yalnızca cihazdaki yerel fotoğraflardan üretilebilir.');
  }

  const data = await Skia.Data.fromURI(photo.uri);
  try {
    const image = Skia.Image.MakeImageFromEncoded(data);
    if (!image) {
      throw new Error('Orijinal fotoğraf export için çözümlenemedi.');
    }

    const expectedWidth = Math.round(photo.width);
    const expectedHeight = Math.round(photo.height);
    if (image.width() !== expectedWidth || image.height() !== expectedHeight) {
      image.dispose();
      throw new Error(
        'Kaynak fotoğraf ölçüsü galeri bilgisiyle uyuşmuyor. Fotoğrafı yeniden seçin.',
      );
    }

    return image;
  } finally {
    data.dispose();
  }
}

export function exportOriginalJpeg({
  destination,
  sourceImage,
  sourceSize,
}: ExportJpegInput): void {
  const surface = createSurface(sourceSize);
  try {
    drawSourceImage(surface, sourceImage, sourceSize);
    writeSurfaceAsJpeg(surface, destination, 95);
  } finally {
    surface.dispose();
  }
}

export function exportPreviewJpeg({
  destination,
  sourceImage,
  sourceSize,
  sourceCorners,
  finishId,
}: ExportPreviewInput): void {
  const surface = createSurface(sourceSize);
  try {
    drawSourceImage(surface, sourceImage, sourceSize);
    drawDoorPreview(surface, sourceCorners, finishId);
    writeSurfaceAsJpeg(surface, destination, 92);
  } finally {
    surface.dispose();
  }
}
