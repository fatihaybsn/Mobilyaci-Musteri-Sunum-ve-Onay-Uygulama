import type { FinishId } from '../types/editor';

export type FinishOption = {
  id: FinishId;
  label: string;
  color: string;
  grainColor: string;
  highlightColor: string;
};

export const FINISH_OPTIONS: readonly FinishOption[] = [
  {
    id: 'white',
    label: 'Beyaz',
    color: '#F1EFE8',
    grainColor: '#A9AAA6',
    highlightColor: '#FFFFFF',
  },
  {
    id: 'anthracite',
    label: 'Antrasit',
    color: '#42474A',
    grainColor: '#151718',
    highlightColor: '#8E9598',
  },
  {
    id: 'walnut',
    label: 'Ceviz',
    color: '#9A633D',
    grainColor: '#4D2B1B',
    highlightColor: '#D49A6A',
  },
] as const;

export const FINISH_BY_ID: Record<FinishId, FinishOption> = Object.fromEntries(
  FINISH_OPTIONS.map((finish) => [finish.id, finish]),
) as Record<FinishId, FinishOption>;
