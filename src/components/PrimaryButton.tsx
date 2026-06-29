import { Pressable, StyleSheet, Text } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  variant?: 'primary' | 'dark';
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  compact = false,
  variant = 'primary',
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        variant === 'dark' && styles.dark,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.label, variant === 'dark' && styles.darkLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2C14E',
  },
  compact: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  dark: {
    backgroundColor: '#252827',
  },
  disabled: {
    opacity: 0.38,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  label: {
    color: '#29230F',
    fontSize: 14,
    fontWeight: '800',
  },
  darkLabel: {
    color: '#FFFFFF',
  },
});
