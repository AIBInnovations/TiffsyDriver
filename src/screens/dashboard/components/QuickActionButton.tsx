import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

interface QuickActionButtonProps {
  label: string;
  icon?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export default function QuickActionButton({
  label,
  icon,
  onPress,
  variant = 'primary',
  style,
}: QuickActionButtonProps) {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.primaryButton,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'outline' && styles.outlineButton,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    variant === 'primary' && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    variant === 'outline' && styles.outlineText,
  ];

  return (
    <TouchableOpacity style={buttonStyles} onPress={onPress} activeOpacity={0.8}>
      {icon && <Text style={textStyles}>{icon} </Text>}
      <Text style={textStyles}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#F56B4C',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#F56B4C',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: '#374151',
  },
  outlineText: {
    color: '#F56B4C',
  },
});
