import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AccessibilityFab } from '../components/AccessibilityFab';
import { useAccessibilitySettings } from '../context/AccessibilityContext';
import { listProperties } from '../database/db';
import * as SecureStore from 'expo-secure-store';

interface PropertyCommissionItem {
  id: number;
  title: string;
  price: string;
  address: string;
  selected: boolean;
}

export default function CommissionScreen() {
  const { theme, fontScale } = useAccessibilitySettings();
  const [properties, setProperties] = useState<PropertyCommissionItem[]>([]);
  const [commissionRate, setCommissionRate] = useState('5');

  const loadPropertiesData = useCallback(async () => {
    const data = await listProperties();
    setProperties((prev) => data.map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      address: item.address,
      selected: prev.find((entry) => entry.id === item.id)?.selected ?? false,
    })));
  }, []);

  useEffect(() => {
    loadPropertiesData();
  }, [loadPropertiesData]);

  useFocusEffect(
    useCallback(() => {
      loadPropertiesData();
    }, [loadPropertiesData])
  );

  const toggleProperty = (id: number) => {
    setProperties((prev) => prev.map((item) => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const parsePriceValue = (value: string) => {
    const normalized = String(value ?? '')
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const totalValue = useMemo(() => properties
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + parsePriceValue(item.price), 0), [properties]);

  const totalCommission = useMemo(() => {
    const rate = (Number(commissionRate.replace(',', '.')) || 0) / 100;
    return totalValue * rate;
  }, [commissionRate, totalValue]);

  useEffect(() => {
    SecureStore.setItemAsync('sos_imoveis_last_commission', String(totalCommission)).catch(() => undefined);
  }, [totalCommission]);

  const palette = theme === 'dark'
    ? { background: '#07111F', surface: '#12253C', text: '#FFF', muted: '#C7D2E0', border: '#253A53', accent: '#5EEAD4', input: '#0F1C2B' }
    : { background: '#F5F7FB', surface: '#FFFFFF', text: '#111827', muted: '#4B5563', border: '#D1D5DB', accent: '#2563EB', input: '#EEF4FF' };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}> 
      <Text style={[styles.heading, { color: palette.text, fontSize: 24 * fontScale }]}>Comissão estimada</Text>
      <Text style={[styles.description, { color: palette.muted, fontSize: 14 * fontScale }]}>Selecione imóveis para somar o valor total e ver a comissão estimada.</Text>
      <View style={[styles.summaryBox, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <Text style={[styles.summaryLabel, { color: palette.accent }]}>Taxa de comissão</Text>
        <TextInput
          value={commissionRate}
          onChangeText={setCommissionRate}
          keyboardType="decimal-pad"
          style={[styles.input, { backgroundColor: palette.input, color: palette.text }]}
          placeholder="Ex.: 5"
          placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
        />
        <Text style={[styles.summaryLabel, { color: palette.accent, marginTop: 8 }]}>Valor total dos imóveis</Text>
        <Text style={[styles.summaryValue, { color: palette.text }]}>R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        <Text style={[styles.summaryLabel, { color: palette.accent, marginTop: 8 }]}>Comissão total</Text>
        <Text style={[styles.summaryValue, { color: palette.text }]}>R$ {totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
      </View>
      <AccessibilityFab />
      <FlatList
        data={properties}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleProperty(item.id)}
            style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, item.selected && styles.cardSelected]}
          >
            <Text style={[styles.cardTitle, { color: palette.text }]}>{item.title}</Text>
            <Text style={[styles.cardText, { color: palette.muted }]}>{item.address}</Text>
            <Text style={[styles.cardText, { color: palette.accent }]}>Valor total do imóvel: R$ {item.price}</Text>
            <Text style={[styles.cardHint, { color: item.selected ? palette.accent : palette.muted }]}>{item.selected ? 'Selecionado para somar a comissão' : 'Toque para incluir no cálculo'}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F', padding: 18 },
  heading: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  description: { color: '#C7D2E0', marginTop: 4, marginBottom: 12 },
  summaryBox: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 12 },
  summaryLabel: { textTransform: 'uppercase', letterSpacing: 1.4, fontSize: 10, fontWeight: '700' },
  summaryValue: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 6 },
  input: { backgroundColor: '#0F1C2B', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF', marginTop: 6 },
  list: { paddingBottom: 32 },
  card: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 10 },
  cardSelected: { borderColor: '#5EEAD4', shadowColor: '#5EEAD4', shadowOpacity: 0.25, shadowRadius: 6 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cardText: { color: '#C7D2E0', marginTop: 4 },
  cardHint: { marginTop: 6, fontWeight: '700', fontSize: 12 },
});
