import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SlidersHorizontal } from 'lucide-react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { AccessibilityFab } from '../components/AccessibilityFab';
import { useAccessibilitySettings } from '../context/AccessibilityContext';
import { addBroker, deleteBroker, listBrokers, updateBroker } from '../database/db';
import type { Broker, RootStackParamList } from '../types';

export default function BrokersScreen() {
  const { theme, fontScale } = useAccessibilitySettings();
  const searchInputRef = useRef<TextInput>(null);
  const route = useRoute<RouteProp<RootStackParamList, 'Brokers'>>();
  const selectedBrokerName = route.params?.selectedBrokerName || '';
  const userRole = route.params?.userRole ?? 'corretor';
  const isClientUser = userRole === 'cliente';
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadBrokers = async () => {
    const data = await listBrokers();
    setBrokers(data);
  };

  useEffect(() => {
    loadBrokers();
  }, []);

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setSpecialty('');
    setRegistrationNumber('');
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do corretor.');
      return;
    }

    if (!registrationNumber.trim()) {
      Alert.alert('Atenção', 'Informe o número de registro do corretor.');
      return;
    }

    if (editingId !== null) {
      await updateBroker({ id: editingId, name, phone, email, specialty, registrationNumber });
    } else {
      await addBroker({ name, phone, email, specialty, registrationNumber });
    }

    resetForm();
    await loadBrokers();
  };

  const handleEdit = (item: Broker) => {
    setEditingId(item.id);
    setName(item.name);
    setPhone(item.phone);
    setEmail(item.email);
    setSpecialty(item.specialty);
    setRegistrationNumber(item.registrationNumber || '');
  };

  const handleDelete = async (id: number) => {
    await deleteBroker(id);
    await loadBrokers();
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}`);
  };

  const handleEmail = (email?: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`);
  };

  const handleCopyRegistration = async (registrationNumber?: string) => {
    if (!registrationNumber?.trim()) {
      Alert.alert('Atenção', 'Informe o número de registro antes de copiar.');
      return;
    }

    await Clipboard.setStringAsync(registrationNumber.trim());
    Alert.alert('Copiado', 'Número de registro copiado para a área de transferência.');
  };

  const handleOpenCreciSite = () => {
    Linking.openURL('https://creci-al.gov.br/portal/consultar-corretor-imobiliaria/');
  };

  const applyFilter = () => {
    setFilterQuery(searchInput.trim().toLowerCase());
  };

  const palette = theme === 'dark'
    ? { background: '#07111F', surface: '#12253C', input: '#0F1C2B', text: '#FFF', muted: '#C7D2E0', border: '#253A53' }
    : { background: '#F5F7FB', surface: '#FFFFFF', input: '#EEF4FF', text: '#111827', muted: '#4B5563', border: '#D1D5DB' };

  const filteredBrokers = brokers.filter((item) => {
    const term = filterQuery;
    return [item.name, item.email, item.phone, item.specialty, item.registrationNumber].join(' ').toLowerCase().includes(term);
  });

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.heading, { color: palette.text, fontSize: 24 * fontScale }]}>Corretores</Text>
      <Text style={[styles.description, { color: palette.muted, fontSize: 14 * fontScale }]}>
        {isClientUser ? 'Visualize os corretores cadastrados sem opções de edição.' : 'Cadastre e edite informações dos corretores.'}
      </Text>
      <AccessibilityFab />

      {!isClientUser ? (
        <View style={[styles.formBox, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <View style={styles.searchRow}>
          <TextInput
            ref={searchInputRef}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={applyFilter}
            returnKeyType="search"
            placeholder="Filtrar corretores"
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
        <TextInput value={specialty} onChangeText={setSpecialty} placeholder="Especialidade" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <TextInput value={registrationNumber} onChangeText={setRegistrationNumber} placeholder="Número de Registro" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>{editingId ? 'Salvar alterações' : 'Adicionar corretor'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
            <Text style={styles.secondaryButtonText}>Limpar</Text>
          </TouchableOpacity>
        </View>
      </View>
      ) : null}

      <FlatList
        data={filteredBrokers}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, item.name === selectedBrokerName && styles.cardSelected]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: palette.text, fontSize: 16 * fontScale }]}>{item.name}</Text>
              <Text style={[styles.cardText, { color: palette.muted, fontSize: 13 * fontScale }]}>{item.phone}</Text>
              <Text style={[styles.cardText, { color: palette.muted, fontSize: 13 * fontScale }]}>{item.email}</Text>
              <Text style={[styles.cardText, { color: palette.muted, fontSize: 13 * fontScale }]}>Especialidade: {item.specialty || 'Não informado'}</Text>
              <Text style={[styles.cardText, { color: palette.muted, fontSize: 13 * fontScale }]}>Registro: {item.registrationNumber || 'Não informado'}</Text>
              <View style={styles.cardActionRow}>
                <TouchableOpacity style={styles.copyButton} onPress={() => handleCopyRegistration(item.registrationNumber)}>
                  <Text style={styles.copyButtonText}>Copiar matrícula</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.creciButton} onPress={handleOpenCreciSite}>
                  <Text style={styles.creciButtonText}>CRECI GOV</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.smallButton} onPress={() => handleWhatsApp(item.phone)}>
                <Text style={styles.smallButtonText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={() => handleEmail(item.email)}>
                <Text style={styles.smallButtonText}>E-mail</Text>
              </TouchableOpacity>
              {!isClientUser ? (
                <>
                  <TouchableOpacity style={styles.smallButton} onPress={() => handleEdit(item)}>
                    <Text style={styles.smallButtonText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                    <Text style={styles.deleteButtonText}>Excluir</Text>
                  </TouchableOpacity>
                </>
              ) : null}
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
  copyButton: { flex: 1, backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  copyButtonText: { color: '#FFF', fontWeight: '700', fontSize: 11 },
  creciButton: { flex: 1, backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  creciButtonText: { color: '#FFF', fontWeight: '700', fontSize: 11 },
  cardActionRow: { flexDirection: 'row', gap: 8, marginTop: 6, width: '100%' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  primaryButton: { backgroundColor: '#14B8A6', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flex: 1 },
  primaryButtonText: { color: '#052E2A', fontWeight: '700', textAlign: 'center' },
  secondaryButton: { borderWidth: 1, borderColor: '#2DD4BF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flex: 1 },
  secondaryButtonText: { color: '#5EEAD4', textAlign: 'center', fontWeight: '700' },
  list: { paddingBottom: 24 },
  card: { backgroundColor: '#12253C', borderRadius: 18, padding: 12, marginBottom: 10, borderColor: '#253A53', borderWidth: 1, flexDirection: 'column' },
  cardSelected: { borderColor: '#5EEAD4', shadowColor: '#5EEAD4', shadowOpacity: 0.35, shadowRadius: 8 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cardText: { color: '#C7D2E0', marginTop: 2 },
  verifyLink: { color: '#5EEAD4', fontWeight: '700', marginTop: 4 },
  cardActions: { marginTop: 8, flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'stretch', width: '100%', columnGap: 8, rowGap: 8 },
  smallButton: { flex: 1, minWidth: 0, backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  smallButtonText: { color: '#FFF', fontWeight: '700', fontSize: 11, textAlign: 'center' },
  deleteButton: { flex: 1, minWidth: 0, marginRight: 2, backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#FFF', fontWeight: '700' },
});
