import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AccessibilityFab } from '../components/AccessibilityFab';
import { useAccessibilitySettings } from '../context/AccessibilityContext';

export default function CalculatorScreen() {
  const { theme, fontScale } = useAccessibilitySettings();
  const [price, setPrice] = useState('');
  const [entry, setEntry] = useState('');
  const [rate, setRate] = useState('');
  const [months, setMonths] = useState('');
  const [commission, setCommission] = useState('');

  const normalizeNumber = (value: string) => {
    const normalized = value.replace(',', '.');
    return Number(normalized);
  };

  const result = useMemo(() => {
    const valor = normalizeNumber(price) || 0;
    const entrada = normalizeNumber(entry) || 0;
    const taxa = (normalizeNumber(rate) || 0) / 100 / 12;
    const prazo = Math.max(Math.trunc(normalizeNumber(months) || 1), 1);
    const comissao = (normalizeNumber(commission) || 0) / 100;

    const financed = Math.max(valor - entrada, 0);
    const installment = taxa > 0 ? financed * taxa / (1 - Math.pow(1 + taxa, -prazo)) : financed / prazo;
    const total = installment * prazo;
    const brokerCommission = total * comissao;

    return { financed, installment, total, brokerCommission, entryAmount: entrada };
  }, [commission, entry, months, price, rate]);

  const palette = theme === 'dark'
    ? { background: '#07111F', surface: '#12253C', input: '#0F1C2B', text: '#FFF', muted: '#C7D2E0', border: '#253A53' }
    : { background: '#F5F7FB', surface: '#FFFFFF', input: '#EEF4FF', text: '#111827', muted: '#4B5563', border: '#D1D5DB' };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.heading, { color: palette.text, fontSize: 24 * fontScale }]}>Calculadora Imobiliária</Text>
      <Text style={[styles.description, { color: palette.muted, fontSize: 14 * fontScale }]}>Simule financiamento, parcelas e comissão de corretor rapidamente.</Text>
      <AccessibilityFab />

      <View style={[styles.formBox, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <TextInput value={price} onChangeText={setPrice} style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholder="Valor do imóvel" placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} keyboardType="decimal-pad" />
        <TextInput value={entry} onChangeText={setEntry} style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholder="Entrada" placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} keyboardType="decimal-pad" />
        <TextInput value={rate} onChangeText={setRate} style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholder="Taxa anual (%)" placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} keyboardType="decimal-pad" />
        <TextInput value={months} onChangeText={setMonths} style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholder="Prazo em meses" placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} keyboardType="decimal-pad" />
        <TextInput value={commission} onChangeText={setCommission} style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholder="Comissão do corretor (%)" placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} keyboardType="decimal-pad" />

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Calcular</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.resultBox, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <Text style={[styles.resultLabel, { color: palette.muted }]}>Valor financiado</Text>
        <Text style={[styles.resultValue, { color: palette.text }]}>R$ {result.financed.toFixed(2)}</Text>
        <Text style={[styles.resultLabel, { color: palette.muted }]}>Parcela estimada</Text>
        <Text style={[styles.resultValue, { color: palette.text }]}>R$ {result.installment.toFixed(2)}</Text>
        <Text style={[styles.resultLabel, { color: palette.muted }]}>Total pago</Text>
        <Text style={[styles.resultValue, { color: palette.text }]}>R$ {result.total.toFixed(2)}</Text>
        <Text style={[styles.resultLabel, { color: palette.muted }]}>Comissão do corretor</Text>
        <Text style={[styles.resultValue, { color: palette.text }]}>R$ {result.brokerCommission.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F', padding: 18 },
  heading: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  description: { color: '#C7D2E0', marginTop: 4, marginBottom: 12 },
  formBox: { backgroundColor: '#12253C', borderRadius: 18, padding: 12 },
  input: { backgroundColor: '#0F1C2B', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF', marginBottom: 8 },
  button: { backgroundColor: '#5EEAD4', borderRadius: 12, paddingVertical: 10 },
  buttonText: { color: '#052E2A', textAlign: 'center', fontWeight: '700' },
  resultBox: { backgroundColor: '#12253C', borderRadius: 18, padding: 12, marginTop: 12 },
  resultLabel: { color: '#BFDBFE', marginTop: 4 },
  resultValue: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
