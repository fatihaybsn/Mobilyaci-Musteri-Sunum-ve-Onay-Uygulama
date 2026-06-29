import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { CanvasRect, CornerKey, Point } from '../types/editor';

const TOUCH_SIZE = 64;
const VISIBLE_SIZE = 30;

type CornerHandleProps = {
  corner: CornerKey;
  point: Point;
  bounds: CanvasRect;
  onMove: (corner: CornerKey, point: Point) => void;
};

const CORNER_LABELS: Record<CornerKey, string> = {
  topLeft: 'Sol üst köşe',
  topRight: 'Sağ üst köşe',
  bottomRight: 'Sağ alt köşe',
  bottomLeft: 'Sol alt köşe',
};

export function CornerHandle({ corner, point, bounds, onMove }: CornerHandleProps) {
  const x = useSharedValue(point.x);
  const y = useSharedValue(point.y);
  const startX = useSharedValue(point.x);
  const startY = useSharedValue(point.y);
  const scale = useSharedValue(1);

  useEffect(() => {
    x.value = point.x;
    y.value = point.y;
  }, [point.x, point.y, x, y]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin(() => {
          startX.value = x.value;
          startY.value = y.value;
          scale.value = withTiming(1.14, { duration: 100 });
        })
        .onUpdate((event) => {
          const nextX = Math.min(
            Math.max(startX.value + event.translationX, bounds.x),
            bounds.x + bounds.width,
          );
          const nextY = Math.min(
            Math.max(startY.value + event.translationY, bounds.y),
            bounds.y + bounds.height,
          );

          x.value = nextX;
          y.value = nextY;
          runOnJS(onMove)(corner, { x: nextX, y: nextY });
        })
        .onFinalize(() => {
          scale.value = withTiming(1, { duration: 120 });
        }),
    [
      bounds.height,
      bounds.width,
      bounds.x,
      bounds.y,
      corner,
      onMove,
      scale,
      startX,
      startY,
      x,
      y,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - TOUCH_SIZE / 2 },
      { translateY: y.value - TOUCH_SIZE / 2 },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.touchTarget, animatedStyle]}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={CORNER_LABELS[corner]}
        accessibilityHint="Kapak köşesini taşımak için sürükleyin"
      >
        <View style={styles.outerRing}>
          <View style={styles.innerDot} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TOUCH_SIZE,
    height: TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  outerRing: {
    width: VISIBLE_SIZE,
    height: VISIBLE_SIZE,
    borderRadius: VISIBLE_SIZE / 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#F2C14E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#252728',
  },
});
