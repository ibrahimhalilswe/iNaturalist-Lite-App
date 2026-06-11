import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Typography, Shadows } from '../constants/theme';

export default function StatCard({ icon, value, label, color = Colors.primary }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBg, { backgroundColor: `${color}18` }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value ?? '—'}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 18,
    alignItems: 'center',
    minWidth: 110,
    ...Shadows.sm,
  },
  iconBg: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 22,
  },
  value: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    marginBottom: 2,
  },
  label: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: Typography.weights.medium,
  },
});
