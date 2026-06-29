import { create } from 'zustand';

import type {
  CanvasRect,
  CornerKey,
  FinishId,
  PhotoSource,
  Point,
  QuadCorners,
  Size,
} from '../types/editor';
import { CORNER_KEYS } from '../types/editor';

type EditorState = {
  photo: PhotoSource | null;
  canvasSize: Size;
  photoRect: CanvasRect | null;
  overlayVisible: boolean;
  corners: QuadCorners | null;
  selectedFinish: FinishId;
  setPhoto: (photo: PhotoSource) => void;
  setCanvasSize: (size: Size) => void;
  addDoor: () => void;
  setCorner: (corner: CornerKey, point: Point) => void;
  setFinish: (finish: FinishId) => void;
};

const EMPTY_SIZE: Size = { width: 0, height: 0 };
const EPSILON = 0.5;

function calculateContainRect(photo: PhotoSource, canvas: Size): CanvasRect | null {
  if (photo.width <= 0 || photo.height <= 0 || canvas.width <= 0 || canvas.height <= 0) {
    return null;
  }

  const scale = Math.min(canvas.width / photo.width, canvas.height / photo.height);
  const width = photo.width * scale;
  const height = photo.height * scale;

  return {
    x: (canvas.width - width) / 2,
    y: (canvas.height - height) / 2,
    width,
    height,
  };
}

function createInitialCorners(rect: CanvasRect): QuadCorners {
  const left = rect.x + rect.width * 0.2;
  const right = rect.x + rect.width * 0.8;
  const top = rect.y + rect.height * 0.24;
  const bottom = rect.y + rect.height * 0.76;
  const perspectiveInset = rect.width * 0.035;

  return {
    topLeft: { x: left + perspectiveInset, y: top },
    topRight: { x: right - perspectiveInset, y: top },
    bottomRight: { x: right, y: bottom },
    bottomLeft: { x: left, y: bottom },
  };
}

function clampPoint(point: Point, rect: CanvasRect): Point {
  return {
    x: Math.min(Math.max(point.x, rect.x), rect.x + rect.width),
    y: Math.min(Math.max(point.y, rect.y), rect.y + rect.height),
  };
}

function remapCorners(
  corners: QuadCorners,
  previousRect: CanvasRect,
  nextRect: CanvasRect,
): QuadCorners {
  return Object.fromEntries(
    CORNER_KEYS.map((key) => {
      const point = corners[key];
      const normalizedX = previousRect.width > 0 ? (point.x - previousRect.x) / previousRect.width : 0.5;
      const normalizedY = previousRect.height > 0 ? (point.y - previousRect.y) / previousRect.height : 0.5;

      return [
        key,
        {
          x: nextRect.x + normalizedX * nextRect.width,
          y: nextRect.y + normalizedY * nextRect.height,
        },
      ];
    }),
  ) as QuadCorners;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  photo: null,
  canvasSize: EMPTY_SIZE,
  photoRect: null,
  overlayVisible: false,
  corners: null,
  selectedFinish: 'white',

  setPhoto: (photo) => {
    const photoRect = calculateContainRect(photo, get().canvasSize);
    set({
      photo,
      photoRect,
      overlayVisible: false,
      corners: null,
      selectedFinish: 'white',
    });
  },

  setCanvasSize: (canvasSize) => {
    const state = get();
    if (
      Math.abs(state.canvasSize.width - canvasSize.width) < 0.5 &&
      Math.abs(state.canvasSize.height - canvasSize.height) < 0.5
    ) {
      return;
    }

    const nextRect = state.photo ? calculateContainRect(state.photo, canvasSize) : null;
    const nextCorners =
      state.corners && state.photoRect && nextRect
        ? remapCorners(state.corners, state.photoRect, nextRect)
        : state.corners;

    set({ canvasSize, photoRect: nextRect, corners: nextCorners });
  },

  addDoor: () => {
    const rect = get().photoRect;
    if (!rect) {
      return;
    }

    set({
      overlayVisible: true,
      corners: createInitialCorners(rect),
    });
  },

  setCorner: (corner, point) => {
    const state = get();
    if (!state.corners || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return;
    }

    const bounds = state.photoRect ?? {
      x: 0,
      y: 0,
      width: state.canvasSize.width,
      height: state.canvasSize.height,
    };

    const nextPoint = clampPoint(point, bounds);
    const currentPoint = state.corners[corner];
    if (
      Math.abs(nextPoint.x - currentPoint.x) <= EPSILON &&
      Math.abs(nextPoint.y - currentPoint.y) <= EPSILON
    ) {
      return;
    }

    set({
      corners: {
        ...state.corners,
        [corner]: nextPoint,
      },
    });
  },

  setFinish: (selectedFinish) => {
    if (get().selectedFinish === selectedFinish) {
      return;
    }
    set({ selectedFinish });
  },
}));
