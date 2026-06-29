import type { RefObject } from 'react';
import type { CanvasRef } from '@shopify/react-native-skia';
import { ImageFormat } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportAndShareCanvas(
  canvasRef: RefObject<CanvasRef | null>,
): Promise<string> {
  const canvas = canvasRef.current;
  if (!canvas) {
    throw new Error('Sunum alanı henüz hazır değil.');
  }

  const snapshot = await canvas.makeImageSnapshotAsync();
  const jpegBytes = snapshot.encodeToBytes(ImageFormat.JPEG, 92);
  if (jpegBytes.byteLength === 0) {
    throw new Error('JPG görüntüsü oluşturulamadı.');
  }

  const output = new File(Paths.cache, `mobilyaci-sunum-${Date.now()}.jpg`);
  output.create({ overwrite: true, intermediates: true });
  output.write(jpegBytes);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error(`Paylaşım bu cihazda kullanılamıyor. Dosya şurada hazır: ${output.uri}`);
  }

  await Sharing.shareAsync(output.uri, {
    mimeType: 'image/jpeg',
    UTI: 'public.jpeg',
    dialogTitle: 'Mobilyacı sunumunu paylaş',
  });

  return output.uri;
}
