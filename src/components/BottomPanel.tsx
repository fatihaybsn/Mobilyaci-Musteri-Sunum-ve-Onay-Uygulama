import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FINISH_OPTIONS } from '../config/finishes';
import type { FinishId } from '../types/editor';
import { PrimaryButton } from './PrimaryButton';

type BottomPanelProps = {
  selectedFinish: FinishId;
  onSelectFinish: (finish: FinishId) => void;
  colorsDisabled: boolean;
  exportDisabled: boolean;
  isExporting: boolean;
  onExport: () => void;
};

export function BottomPanel({
  selectedFinish,
  onSelectFinish,
  colorsDisabled,
  exportDisabled,
  isExporting,
  onExport,
}: BottomPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.paletteBlock}>
        <Text style={styles.label}>KAPAK RENGİ</Text>
        <View style={styles.palette}>
          {FINISH_OPTIONS.map((finish) => {
            const selected = finish.id === selectedFinish;
            return (
              <Pressable
                key={finish.id}
                accessibilityRole="radio"
                accessibilityLabel={`${finish.label} kapak rengi`}
                accessibilityState={{ checked: selected, disabled: colorsDisabled }}
                disabled={colorsDisabled}
                onPress={() => onSelectFinish(finish.id)}
                style={({ pressed }) => [
                  styles.swatchButton,
                  selected && styles.swatchButtonSelected,
                  colorsDisabled && styles.swatchDisabled,
                  pressed && !colorsDisabled && styles.swatchPressed,
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: finish.color }]} />
                <Text style={styles.swatchLabel}>{finish.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <PrimaryButton
        label={isExporting ? 'Hazırlanıyor…' : 'Dışa Aktar'}
        onPress={onExport}
        disabled={exportDisabled || isExporting}
        variant="dark"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 14,
    gap: 13,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 6,
  },
  paletteBlock: {
    gap: 8,
  },
  label: {
    color: '#817E76',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  palette: {
    flexDirection: 'row',
    gap: 9,
  },
  swatchButton: {
    flex: 1,
    minHeight: 58,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F5F3EE',
  },
  swatchButtonSelected: {
    borderColor: '#E0AB2D',
    backgroundColor: '#FFF8E6',
  },
  swatchDisabled: {
    opacity: 0.42,
  },
  swatchPressed: {
    opacity: 0.75,
  },
  swatch: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
  },
  swatchLabel: {
    color: '#393A37',
    fontSize: 11,
    fontWeight: '700',
  },
});
