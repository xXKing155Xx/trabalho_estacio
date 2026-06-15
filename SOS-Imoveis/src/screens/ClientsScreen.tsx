import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SlidersHorizontal } from 'lucide-react-native';

import { AccessibilityFab } from '../components/AccessibilityFab';
import { useAccessibilitySettings } from '../context/AccessibilityContext';
import { FloatingRefreshButton } from '../components/FloatingRefreshButton';
import { addClient, deleteClient, listClients, updateClient } from '../database/db';
import type { Client } from '../types';

export default function ClientsScreen() {
  const { theme, fontScale } = useAccessibilitySettings();
  const searchInputRef = useRef<TextInput>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [budget, setBudget] = useState('');
  const [financingMethod, setFinancingMethod] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadClients = async () => {
    const data = await listClients();
    setClients(data);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setBudget('');
    setFinancingMethod('');
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!financingMethod.trim()) {
      Alert.alert('Atenção', 'Selecione a forma de financiamento.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do cliente.');
      return;
    }

    if (editingId !== null) {
      await updateClient({ id: editingId, name, phone, email, budget, financingMethod });
    } else {
      await addClient({ name, phone, email, budget, financingMethod });
    }

    resetForm();
    await loadClients();
  };

  const handleEdit = (item: Client) => {
    setEditingId(item.id);
    setName(item.name);
    setPhone(item.phone);
    setEmail(item.email);
    setBudget(item.budget);
    setFinancingMethod(item.financingMethod || '');
  };

  const handleDelete = async (id: number) => {
    await deleteClient(id);
    await loadClients();
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^\d]/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}`);
  };

  const applyFilter = () => {
    setFilterQuery(searchInput.trim().toLowerCase());
  };

  const palette = theme === 'dark'
    ? { background: '#07111F', surface: '#12253C', input: '#0F1C2B', text: '#FFF', muted: '#C7D2E0', border: '#253A53' }
    : { background: '#F5F7FB', surface: '#FFFFFF', input: '#EEF4FF', text: '#111827', muted: '#4B5563', border: '#D1D5DB' };

  const filteredClients = clients.filter((item) => {
    const term = filterQuery;
    return [item.name, item.email, item.phone, item.budget, item.financingMethod].join(' ').toLowerCase().includes(term);
  });

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.heading, { color: palette.text, fontSize: 24 * fontScale }]}>Clientes</Text>
      <Text style={[styles.description, { color: palette.muted, fontSize: 14 * fontScale }]}>Gerencie clientes com informações de contato e orçamento.</Text>
      <AccessibilityFab />

      <View style={[styles.formBox, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <View style={styles.searchRow}>
          <TextInput
            ref={searchInputRef}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={applyFilter}
            returnKeyType="search"
            placeholder="Filtrar clientes"
            style={[styles.searchInput, { backgroundColor: palette.input, color: palette.text }]}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.filterButton} onPress={applyFilter}>
            <SlidersHorizontal size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        <TextInput value={name} onChangeText={setName} placeholder="Nome" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <TextInput value={phone} onChangeText={setPhone} placeholder="Telefone" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <TextInput value={budget} onChangeText={setBudget} placeholder="Orçamento" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <Text style={styles.label}>Forma de financiamento</Text>
        <View style={[styles.pickerBox, { backgroundColor: palette.input, borderColor: palette.border }]}> 
          <Picker selectedValue={financingMethod} onValueChange={setFinancingMethod} style={[styles.picker, { color: palette.text }]} dropdownIconColor={theme === 'dark' ? '#FFF' : '#111827'}>
            <Picker.Item label="Selecione" value="" />
            <Picker.Item label="Financiamento bancário" value="Financiamento bancário" />
            <Picker.Item label="Programa habitacional do governo" value="Programa habitacional do governo" />
            <Picker.Item label="Consórcio" value="Consórcio" />
            <Picker.Item label="Pagamento à vista" value="Pagamento à vista" />
            <Picker.Item label="Outros" value="Outros" />
          </Picker>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>{editingId ? 'Salvar alterações' : 'Adicionar cliente'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
            <Text style={styles.secondaryButtonText}>Limpar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: palette.text, fontSize: 16 * fontScale }]}>{item.name}</Text>
              <Text style={[styles.cardText, { color: palette.muted, fontSize: 13 * fontScale }]}>{item.phone}</Text>
              <Text style={[styles.cardText, { color: palette.muted, fontSize: 13 * fontScale }]}>{item.email}</Text>
              <Text style={[styles.cardText, { color: palette.muted }]}>Orçamento: {item.budget || 'Não informado'}</Text>
              <Text style={[styles.cardText, { color: palette.muted }]}>Financiamento: {item.financingMethod || 'Não informado'}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.smallButton} onPress={() => handleWhatsApp(item.phone)}>
                <Text style={styles.smallButtonText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={() => handleEdit(item)}>
                <Text style={styles.smallButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F', padding: 18 },
  heading: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  description: { color: '#C7D2E0', marginTop: 4, marginBottom: 12 },
  formBox: { backgroundColor: '#12253C', borderRadius: 18, padding: 12, marginBottom: 14 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  searchInput: { flex: 1, backgroundColor: '#0F1C2B', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF' },
  filterButton: { marginLeft: 8, backgroundColor: '#1D4ED8', width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  input: { backgroundColor: '#0F1C2B', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF', marginBottom: 8 },
  label: { color: '#BFDBFE', fontWeight: '700', marginBottom: 6 },
  pickerBox: { backgroundColor: '#0F1C2B', borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  picker: { color: '#FFF' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  primaryButton: { backgroundColor: '#93C5FD', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flex: 1 },
  primaryButtonText: { color: '#082F49', fontWeight: '700', textAlign: 'center' },
  secondaryButton: { borderWidth: 1, borderColor: '#93C5FD', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flex: 1 },
  secondaryButtonText: { color: '#BFDBFE', textAlign: 'center', fontWeight: '700' },
  list: { paddingBottom: 24 },
  card: { backgroundColor: '#12253C', borderRadius: 18, padding: 12, marginBottom: 10, borderColor: '#253A53', borderWidth: 1, flexDirection: 'column' },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cardText: { color: '#C7D2E0', marginTop: 2 },
  cardActions: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 8 },
  smallButton: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6, minWidth: 96, alignItems: 'center' },
  smallButtonText: { color: '#FFF', fontWeight: '700' },
  deleteButton: { backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6, minWidth: 96, alignItems: 'center' },
  deleteButtonText: { color: '#FFF', fontWeight: '700' },
});
