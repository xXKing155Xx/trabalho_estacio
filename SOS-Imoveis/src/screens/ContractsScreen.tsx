import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Linking, Modal, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { AccessibilityFab } from '../components/AccessibilityFab';
import { useAccessibilitySettings } from '../context/AccessibilityContext';
import { addContract, deleteContract, listContracts, updateContract } from '../database/db';
import type { Contract, RootStackParamList } from '../types';

export default function ContractsScreen() {
  const { theme, fontScale } = useAccessibilitySettings();
  const route = useRoute<RouteProp<RootStackParamList, 'Contracts'>>();
  const userRole = route.params?.userRole ?? 'cliente';
  const isClientUser = userRole === 'cliente';
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [name, setName] = useState('');
  const [pdfUri, setPdfUri] = useState('');
  const [password, setPassword] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [passwordPromptContract, setPasswordPromptContract] = useState<Contract | null>(null);
  const [actionMode, setActionMode] = useState<'open' | 'download'>('open');
  const [enteredPassword, setEnteredPassword] = useState('');

  const loadContracts = async () => {
    setContracts(await listContracts());
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handlePickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled) {
      setPdfUri(result.assets[0].uri);
    }
  };

  const resetForm = () => {
    setName('');
    setPdfUri('');
    setPassword('');
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !pdfUri || !password.trim()) {
      Alert.alert('Atenção', 'Informe nome, arquivo PDF e senha para continuar.');
      return;
    }

    if (editingId !== null) {
      await updateContract({ id: editingId, name, pdfUri, password });
    } else {
      await addContract({ name, pdfUri, password });
    }

    resetForm();
    await loadContracts();
  };

  const openPdf = async (item: Contract) => {
    try {
      await Linking.openURL(item.pdfUri);
      return;
    } catch (error) {
      // fallback abaixo
    }

    try {
      await Share.share({ url: item.pdfUri, message: `Abrir contrato: ${item.name}` });
      return;
    } catch (error) {
      // ignore
    }

    Alert.alert('Erro', 'Não foi possível abrir o PDF neste dispositivo.');
  };

  const downloadPdf = async (item: Contract) => {
    try {
      await Share.share({ url: item.pdfUri, message: `Baixar contrato: ${item.name}` });
      return;
    } catch (error) {
      // ignore
    }

    Alert.alert('Erro', 'Não foi possível iniciar o download do PDF.');
  };

  const handleAction = (item: Contract, mode: 'open' | 'download') => {
    setActionMode(mode);
    setPasswordPromptContract(item);
    setEnteredPassword('');
  };

  const handleEdit = (item: Contract) => {
    setEditingId(item.id);
    setName(item.name);
    setPdfUri(item.pdfUri);
    setPassword(item.password);
  };

  const confirmAction = async (action: 'open' | 'download') => {
    if (!passwordPromptContract) return;

    if (enteredPassword !== passwordPromptContract.password) {
      Alert.alert('Acesso negado', 'Senha incorreta.');
      return;
    }

    if (action === 'download') {
      await downloadPdf(passwordPromptContract);
    } else {
      await openPdf(passwordPromptContract);
    }

    setPasswordPromptContract(null);
    setEnteredPassword('');
  };

  const palette = theme === 'dark'
    ? { background: '#07111F', surface: '#12253C', input: '#0F1C2B', text: '#FFF', muted: '#C7D2E0', border: '#253A53' }
    : { background: '#F5F7FB', surface: '#FFFFFF', input: '#EEF4FF', text: '#111827', muted: '#4B5563', border: '#D1D5DB' };

  const backgroundStyle = theme === 'dark' ? { backgroundColor: '#07111F' } : { backgroundColor: '#F5F7FB' };

  return (
    <View style={[styles.container, backgroundStyle]}>
      <Text style={[styles.heading, { color: palette.text, fontSize: 24 * fontScale }]}>Contratos com proteção</Text>
      <Text style={[styles.description, { color: palette.muted, fontSize: 14 * fontScale }]}>
        {isClientUser ? 'Visualize os contratos disponíveis e abra ou baixe os PDFs cadastrados.' : 'Anexe um PDF, defina uma senha e proteja o acesso.'}
      </Text>

      {!isClientUser ? (
        <View style={[styles.formBox, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <TextInput value={name} onChangeText={setName} placeholder="Nome do contrato" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Senha" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} secureTextEntry />
          <TouchableOpacity style={styles.pickButton} onPress={handlePickPdf}>
            <Text style={styles.pickButtonText}>{pdfUri ? 'PDF selecionado' : 'Selecionar PDF'}</Text>
          </TouchableOpacity>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>{editingId ? 'Salvar alterações' : 'Adicionar contrato'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
              <Text style={styles.secondaryButtonText}>Limpar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <Modal visible={!!passwordPromptContract} transparent animationType="fade" onRequestClose={() => setPasswordPromptContract(null)}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme === 'dark' ? 'rgba(7,17,31,0.92)' : 'rgba(15,23,42,0.35)' }]}>
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1 }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Senha do contrato</Text>
            <Text style={[styles.modalText, { color: palette.muted }]}>{actionMode === 'download' ? 'Digite a senha cadastrada para baixar o PDF.' : 'Digite a senha cadastrada para abrir o PDF.'}</Text>
            <TextInput
              value={enteredPassword}
              onChangeText={setEnteredPassword}
              placeholder="Senha"
              style={[styles.input, { backgroundColor: palette.input, color: palette.text }]}
              placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.secondaryButton, { borderColor: palette.border }]} onPress={() => setPasswordPromptContract(null)}>
                <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Cancelar</Text>
              </TouchableOpacity>
              {actionMode === 'download' ? (
                <TouchableOpacity style={styles.primaryButton} onPress={() => confirmAction('download')}>
                  <Text style={styles.primaryButtonText}>Baixar PDF</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={() => confirmAction('open')}>
                  <Text style={styles.primaryButtonText}>Abrir PDF</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <AccessibilityFab />

      <FlatList
        data={contracts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: palette.text, fontSize: 16 * fontScale }]}>{item.name}</Text>
              <Text style={[styles.cardText, { color: palette.muted, fontSize: 13 * fontScale }]}>PDF: {item.pdfUri}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.smallButton} onPress={() => handleAction(item, 'open')}>
                  <Text style={styles.smallButtonText}>Abrir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => handleAction(item, 'download')}>
                  <Text style={styles.smallButtonText}>Baixar</Text>
                </TouchableOpacity>
                {!isClientUser ? (
                  <>
                    <TouchableOpacity style={styles.smallButton} onPress={() => handleEdit(item)}>
                      <Text style={styles.smallButtonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={async () => { await deleteContract(item.id); await loadContracts(); }}>
                      <Text style={styles.deleteButtonText}>Excluir</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
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
  formBox: { backgroundColor: '#12253C', borderRadius: 18, padding: 12, marginBottom: 12 },
  input: { backgroundColor: '#0F1C2B', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF', marginBottom: 8 },
  pickButton: { backgroundColor: '#1D4ED8', borderRadius: 12, paddingVertical: 10, marginBottom: 8 },
  pickButtonText: { color: '#FFF', textAlign: 'center', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  primaryButton: { backgroundColor: '#F9A8D4', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flex: 1 },
  primaryButtonText: { color: '#4A044E', fontWeight: '700', textAlign: 'center' },
  secondaryButton: { borderWidth: 1, borderColor: '#F9A8D4', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flex: 1 },
  secondaryButtonText: { color: '#F5D0FE', textAlign: 'center', fontWeight: '700' },
  list: { paddingBottom: 24 },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(7,17,31,0.92)' },
  modalCard: { width: '92%', backgroundColor: '#12253C', borderRadius: 18, padding: 14 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  modalText: { color: '#C7D2E0', marginTop: 4, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 8, justifyContent: 'flex-end' },
  card: { backgroundColor: '#12253C', borderRadius: 18, padding: 12, marginBottom: 10, borderColor: '#253A53', borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cardText: { color: '#C7D2E0', marginTop: 2 },
  cardActions: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  smallButton: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6 },
  smallButtonText: { color: '#FFF', fontWeight: '700' },
  deleteButton: { backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6 },
  deleteButtonText: { color: '#FFF', fontWeight: '700' },
});
