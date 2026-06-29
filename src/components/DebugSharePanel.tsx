import { Pressable, StyleSheet, Text, View } from 'react-native';

export type DebugArtifact = 'preview' | 'mask' | 'selection' | 'original';

type DebugSharePanelProps = {
  disabled: boolean;
  onShare: (artifact: DebugArtifact) => void;
};

const ACTIONS: readonly { artifact: DebugArtifact; label: string }[] = [
  { artifact: 'preview', label: 'Preview Paylaş' },
  { artifact: 'mask', label: 'Maskeyi Paylaş' },
  { artifact: 'selection', label: 'Selection JSON Paylaş' },
  { artifact: 'original', label: 'Orijinali Paylaş' },
];

export function DebugSharePanel({ disabled, onShare }: DebugSharePanelProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>DEBUG DOSYALARI</Text>
      <View style={styles.grid}>
        {ACTIONS.map(({ artifact, label }) => (
          <Pressable
            key={artifact}
            accessibilityRole="button"
            accessibilityLabel={label}
            disabled={disabled}
            onPress={() => onShare(artifact)}
            style={({ pressed }) => [
              styles.button,
              disabled && styles.disabled,
              pressed && !disabled && styles.pressed,
            ]}
          >
            <Text style={styles.buttonLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#D8D2C4',
    borderRadius: 13,
    backgroundColor: '#FFFDF7',
  },
  title: {
    color: '#817E76',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  button: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 40,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#ECE8DE',
  },
  buttonLabel: {
    color: '#373832',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.72,
  },
});
