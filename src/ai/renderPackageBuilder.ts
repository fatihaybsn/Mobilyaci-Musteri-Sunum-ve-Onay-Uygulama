import { Directory, File, Paths } from 'expo-file-system';

import {
  canvasQuadToSourcePixels,
  createContainMapping,
  validateSourceQuad,
} from '../canvas/engine/coordinateMapping';
import { exportMaskPng } from '../export/maskExporter';
import {
  decodeLocalPhoto,
  exportOriginalJpeg,
  exportPreviewJpeg,
} from '../export/previewExporter';
import type { FinishId, PhotoSource, QuadCorners, Size } from '../types/editor';
import { buildSelectionPayload } from './buildSelectionPayload';
import type { SelectionPayload } from './selectionSchema';

type BuildRenderPackageInput = {
  photo: PhotoSource;
  canvasSize: Size;
  canvasCorners: QuadCorners;
  finishId: FinishId;
};

export type RenderPackageResult = {
  directoryUri: string;
  originalUri: string;
  maskUri: string;
  previewUri: string;
  selectionUri: string;
  selection: SelectionPayload;
};

function makeClientRequestId(timestamp: number): string {
  return `render-${timestamp}-${Math.random().toString(36).slice(2, 10)}`;
}

function assertWrittenFile(file: File, label: string): void {
  if (!file.exists || file.size <= 0) {
    throw new Error(`${label} dosyası cihaz cache dizinine yazılamadı.`);
  }
}

export async function buildRenderPackage({
  photo,
  canvasSize,
  canvasCorners,
  finishId,
}: BuildRenderPackageInput): Promise<RenderPackageResult> {
  const sourceSize = {
    width: Math.round(photo.width),
    height: Math.round(photo.height),
  };
  const mapping = createContainMapping(sourceSize, canvasSize);
  const sourceCorners = canvasQuadToSourcePixels(canvasCorners, mapping);
  validateSourceQuad(sourceCorners, sourceSize);

  const sourceImage = await decodeLocalPhoto(photo);
  const timestamp = Date.now();
  const clientRequestId = makeClientRequestId(timestamp);
  const outputDirectory = new Directory(Paths.cache, `render-package-${timestamp}`);

  try {
    outputDirectory.create({ intermediates: true, idempotent: false });

    const originalFile = new File(outputDirectory, 'original.jpg');
    const maskFile = new File(outputDirectory, 'mask.png');
    const previewFile = new File(outputDirectory, 'preview.jpg');
    const selectionFile = new File(outputDirectory, 'selection.json');

    exportOriginalJpeg({
      destination: originalFile,
      sourceImage,
      sourceSize,
    });
    exportMaskPng({
      destination: maskFile,
      sourceSize,
      sourceCorners,
    });
    exportPreviewJpeg({
      destination: previewFile,
      sourceImage,
      sourceSize,
      sourceCorners,
      finishId,
    });

    const selection = buildSelectionPayload({
      clientRequestId,
      source: sourceSize,
      sourceCorners,
      finishId,
    });
    selectionFile.create({ overwrite: true, intermediates: true });
    selectionFile.write(`${JSON.stringify(selection, null, 2)}\n`);

    assertWrittenFile(originalFile, 'original.jpg');
    assertWrittenFile(maskFile, 'mask.png');
    assertWrittenFile(previewFile, 'preview.jpg');
    assertWrittenFile(selectionFile, 'selection.json');

    return {
      directoryUri: outputDirectory.uri,
      originalUri: originalFile.uri,
      maskUri: maskFile.uri,
      previewUri: previewFile.uri,
      selectionUri: selectionFile.uri,
      selection,
    };
  } catch (error) {
    if (outputDirectory.exists) {
      outputDirectory.delete();
    }
    const detail = error instanceof Error ? error.message : 'Bilinmeyen dosya hatası.';
    throw new Error(`AI render paketi yazılamadı: ${detail}`);
  } finally {
    sourceImage.dispose();
  }
}
