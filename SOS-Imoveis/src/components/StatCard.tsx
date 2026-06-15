import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StatCardProps {
  label: string;
  value: number;
  accent: string;
  fontScale?: number;
  theme?: 'dark' | 'light';
  onPress?: () => void;
}

export function StatCard({ label, value, accent, fontScale = 1, theme = 'dark', onPress }: StatCardProps) {
  const isLight = theme === 'light';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, { borderColor: accent, backgroundColor: isLight ? '#EEF4FF' : '#11253F' }]}>
      <Text style={[styles.value, { color: isLight ? '#0F172A' : '#FFF', fontSize: 26 * fontScale }]}>{value}</Text>
      <Text style={[styles.label, { color: isLight ? '#334155' : '#C7D2E0', fontSize: 12 * fontScale }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: '#11253F',
    padding: 14,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  label: {
    color: '#C7D2E0',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});
