import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Colors, BorderRadius, Typography, Shadows } from '../constants/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary', // primary | secondary | outline | ghost | danger
  size = 'md',         // sm | md | lg
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) {
  const variantStyle = styles[`variant_${variant}`] || styles.variant_primary;
  const sizeStyle = styles[`size_${size}`] || styles.size_md;
  const textVariantStyle = textStyles[`text_${variant}`] || textStyles.text_primary;
  const textSizeStyle = textStyles[`textSize_${size}`] || textStyles.textSize_md;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyle,
        variantStyle,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.78}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.text, textVariantStyle, textSizeStyle, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    marginRight: 2,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  // Sizes
  size_sm: { paddingHorizontal: 14, paddingVertical: 8 },
  size_md: { paddingHorizontal: 20, paddingVertical: 13 },
  size_lg: { paddingHorizontal: 28, paddingVertical: 16 },
  // Variants
  variant_primary: { backgroundColor: Colors.primary },
  variant_secondary: { backgroundColor: Colors.accent },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  variant_danger: { backgroundColor: Colors.error },
  text: {
    fontWeight: Typography.weights.semibold,
  },
});

const textStyles = StyleSheet.create({
  text_primary: { color: Colors.white },
  text_secondary: { color: Colors.white },
  text_outline: { color: Colors.primary },
  text_ghost: { color: Colors.primary },
  text_danger: { color: Colors.white },
  textSize_sm: { fontSize: Typography.sizes.sm },
  textSize_md: { fontSize: Typography.sizes.md },
  textSize_lg: { fontSize: Typography.sizes.lg },
});
