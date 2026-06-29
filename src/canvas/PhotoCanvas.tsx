import { useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  Fill,
  Image as SkiaImage,
  type CanvasRef,
  useImage,
} from '@shopify/react-native-skia';

import { CornerHandle } from '../components/CornerHandle';
import { useEditorStore } from '../store/editorStore';
import { CORNER_KEYS } from '../types/editor';
import { DoorLayer } from './layers/DoorLayer';

type PhotoCanvasProps = {
  canvasRef: RefObject<CanvasRef | null>;
  onImageReady: () => void;
  onImageError: (message: string) => void;
  onCornersChanged: () => void;
};

export function PhotoCanvas({
  canvasRef,
  onImageReady,
  onImageError,
  onCornersChanged,
}: PhotoCanvasProps) {
  const photo = useEditorStore((state) => state.photo);
  const photoRect = useEditorStore((state) => state.photoRect);
  const overlayVisible = useEditorStore((state) => state.overlayVisible);
  const corners = useEditorStore((state) => state.corners);
  const selectedFinish = useEditorStore((state) => state.selectedFinish);
  const setCanvasSize = useEditorStore((state) => state.setCanvasSize);
  const setCorner = useEditorStore((state) => state.setCorner);

  const image = useImage(photo?.uri, () => {
    onImageError('Seçilen fotoğraf Skia tarafından okunamadı. Başka bir fotoğraf deneyin.');
  });

  useEffect(() => {
    if (photo && image) {
      onImageReady();
    }
  }, [image, onImageReady, photo]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasSize({ width, height });
  };

  const handleCornerMove = useCallback(
    (corner: Parameters<typeof setCorner>[0], point: Parameters<typeof setCorner>[1]) => {
      setCorner(corner, point);
      onCornersChanged();
    },
    [onCornersChanged, setCorner],
  );

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Canvas ref={canvasRef} style={StyleSheet.absoluteFill} opaque>
        <Fill color="#181A1C" />
        {image && photoRect ? (
          <SkiaImage
            image={image}
            x={photoRect.x}
            y={photoRect.y}
            width={photoRect.width}
            height={photoRect.height}
            fit="fill"
          />
        ) : null}
        {image && overlayVisible && corners ? (
          <DoorLayer corners={corners} finishId={selectedFinish} />
        ) : null}
      </Canvas>

      {!photo ? (
        <View style={styles.emptyState} pointerEvents="none">
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>+</Text>
          </View>
          <Text style={styles.emptyTitle}>Sunum alanı boş</Text>
          <Text style={styles.emptyDescription}>Üstteki düğmeden bir mekân fotoğrafı seçin.</Text>
        </View>
      ) : null}

      {image && overlayVisible && corners && photoRect
        ? CORNER_KEYS.map((corner) => (
            <CornerHandle
              key={corner}
              corner={corner}
              point={corners[corner]}
              bounds={photoRect}
              onMove={handleCornerMove}
            />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A1C',
  },
  emptyState: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#55595D',
    backgroundColor: '#272A2D',
  },
  emptyIconText: {
    color: '#F2C14E',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '300',
  },
  emptyTitle: {
    color: '#F6F4EE',
    fontSize: 17,
    fontWeight: '800',
  },
  emptyDescription: {
    maxWidth: 260,
    marginTop: 6,
    color: '#AEB0B1',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
