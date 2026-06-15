import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AccessibilityFab } from '../components/AccessibilityFab';
import { useAccessibilitySettings } from '../context/AccessibilityContext';
import { listProperties } from '../database/db';
import * as SecureStore from 'expo-secure-store';

interface VisitItem {
  id: number;
  propertyId: number;
  propertyTitle: string;
  clientName: string;
  visitDate: string;
  visitTime: string;
  location: string;
  note: string;
}

export default function AgendaScreen() {
  const { theme, fontScale } = useAccessibilitySettings();
  const [properties, setProperties] = useState<Array<{ id: number; title: string; address: string }>>([]);
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [editingVisitId, setEditingVisitId] = useState<number | null>(null);
  const [draft, setDraft] = useState<VisitItem | null>(null);

  useEffect(() => {
    const loadVisits = async () => {
      const data = await listProperties();
      setProperties(data.map((property) => ({ id: property.id, title: property.title, address: property.address })));

      const sampleVisits = data.slice(0, 6).map((property, index) => ({
        id: property.id + index * 10,
        propertyId: property.id,
        propertyTitle: property.title,
        clientName: ['Ana Souza', 'Carlos Mendes', 'Lívia Prado'][index % 3],
        visitDate: ['2026-06-04', '2026-06-05', '2026-06-06'][index % 3],
        visitTime: ['14:30', '10:00', '16:15'][index % 3],
        location: property.address,
        note: 'Confirmar acesso e estacionamento.',
      }));
      setVisits(sampleVisits);
      SecureStore.setItemAsync('sos_imoveis_visits_count', String(sampleVisits.length)).catch(() => undefined);
    };

    loadVisits();
  }, []);

  const startEditing = (visit: VisitItem) => {
    setEditingVisitId(visit.id);
    setDraft({ ...visit });
  };

  const startCreating = () => {
    const firstProperty = properties[0];
    setEditingVisitId(null);
    setDraft({
      id: Date.now(),
      propertyId: firstProperty?.id ?? 0,
      propertyTitle: firstProperty?.title ?? 'Imóvel',
      clientName: '',
      visitDate: '',
      visitTime: '',
      location: firstProperty?.address ?? '',
      note: '',
    });
  };

  const updateDraft = (field: keyof VisitItem, value: string | number) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveDraft = () => {
    if (!draft) return;

    const property = properties.find((item) => item.id === draft.propertyId);
    setVisits((prev) => {
      const nextVisits = prev.some((visit) => visit.id === draft.id)
        ? prev.map((visit) => visit.id === draft.id
          ? { ...visit, ...draft, propertyTitle: property?.title || visit.propertyTitle, location: draft.location || property?.address || visit.location }
          : visit)
        : [...prev, { ...draft, propertyTitle: property?.title || draft.propertyTitle, location: draft.location || property?.address || draft.location }];
      SecureStore.setItemAsync('sos_imoveis_visits_count', String(nextVisits.length)).catch(() => undefined);
      return nextVisits;
    });
    setEditingVisitId(null);
    setDraft(null);
  };

  const cancelEditing = () => {
    setEditingVisitId(null);
    setDraft(null);
  };

  const formatGoogleDate = (date: string, time: string) => {
    const [year, month, day] = date.split('-').map(Number);
    const [hours = 0, minutes = 0] = time.split(':').map(Number);
    const start = new Date(year, month - 1, day, hours, minutes, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const toGoogle = (value: Date) => value.toISOString().replace(/[-:]/g, '').replace('.000', '');
    return `${toGoogle(start)}/${toGoogle(end)}`;
  };

  const openGoogleCalendar = async (visit: VisitItem) => {
    const dates = formatGoogleDate(visit.visitDate, visit.visitTime);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Visita - ${visit.propertyTitle}`)}&details=${encodeURIComponent(`${visit.note}\nCliente: ${visit.clientName}`)}&location=${encodeURIComponent(visit.location)}&dates=${dates}`;
    await Linking.openURL(url);
  };

  const shareVisit = async (visit: VisitItem) => {
    await Share.share({
      message: `Visita agendada: ${visit.propertyTitle}\nCliente: ${visit.clientName}\nData: ${visit.visitDate}\nHorário: ${visit.visitTime}\nLocal: ${visit.location}\nObservações: ${visit.note}`,
      title: 'Detalhes da visita',
    });
  };

  const deleteVisit = (visitId: number) => {
    setVisits((prev) => {
      const nextVisits = prev.filter((visit) => visit.id !== visitId);
      SecureStore.setItemAsync('sos_imoveis_visits_count', String(nextVisits.length)).catch(() => undefined);
      return nextVisits;
    });
  };

  const palette = theme === 'dark'
    ? { background: '#07111F', surface: '#12253C', input: '#0F1C2B', text: '#FFF', muted: '#C7D2E0', border: '#253A53', accent: '#5EEAD4' }
    : { background: '#F5F7FB', surface: '#FFFFFF', input: '#EEF4FF', text: '#111827', muted: '#4B5563', border: '#D1D5DB', accent: '#2563EB' };

  const totalVisits = useMemo(() => visits.length, [visits]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}> 
      <Text style={[styles.heading, { color: palette.text, fontSize: 24 * fontScale }]}>Agenda de visitas</Text>
      <Text style={[styles.description, { color: palette.muted, fontSize: 14 * fontScale }]}>Acompanhe os próximos encontros e detalhes dos imóveis.</Text>
      <View style={[styles.summaryBox, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <Text style={[styles.summaryLabel, { color: palette.accent }]}>Visitas no período</Text>
        <Text style={[styles.summaryValue, { color: palette.text }]}>{totalVisits}</Text>
      </View>
      <TouchableOpacity style={styles.createButton} onPress={startCreating}>
        <Text style={styles.createButtonText}>+ Criar agendamento</Text>
      </TouchableOpacity>

      {draft ? (
        <View style={[styles.editorBox, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <Text style={[styles.editorTitle, { color: palette.text }]}>Editar visita</Text>
          <TextInput value={draft.clientName} onChangeText={(value) => updateDraft('clientName', value)} placeholder="Cliente" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <TextInput value={draft.visitDate} onChangeText={(value) => updateDraft('visitDate', value)} placeholder="Data (AAAA-MM-DD)" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <TextInput value={draft.visitTime} onChangeText={(value) => updateDraft('visitTime', value)} placeholder="Horário" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <TextInput value={draft.location} onChangeText={(value) => updateDraft('location', value)} placeholder="Local" style={[styles.input, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <TextInput value={draft.note} onChangeText={(value) => updateDraft('note', value)} placeholder="Observações" multiline style={[styles.input, styles.textArea, { backgroundColor: palette.input, color: palette.text }]} placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <View style={styles.propertyRow}>
            {properties.map((property) => (
              <TouchableOpacity
                key={property.id}
                onPress={() => updateDraft('propertyId', property.id)}
                style={[styles.propertyChip, { borderColor: draft.propertyId === property.id ? palette.accent : palette.border, backgroundColor: draft.propertyId === property.id ? 'rgba(94,234,212,0.12)' : 'transparent' }]}
              >
                <Text style={[styles.propertyChipText, { color: draft.propertyId === property.id ? palette.accent : palette.muted }]}>{property.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryButton} onPress={saveDraft}><Text style={styles.primaryButtonText}>Salvar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={cancelEditing}><Text style={styles.secondaryButtonText}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      ) : null}

      <AccessibilityFab />
      <FlatList
        data={visits}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
            <Text style={[styles.cardTitle, { color: palette.text }]}>{item.propertyTitle}</Text>
            <Text style={[styles.cardText, { color: palette.muted }]}>Cliente: {item.clientName}</Text>
            <Text style={[styles.cardText, { color: palette.muted }]}>Data: {item.visitDate}</Text>
            <Text style={[styles.cardText, { color: palette.muted }]}>Horário: {item.visitTime}</Text>
            <Text style={[styles.cardText, { color: palette.muted }]}>Local: {item.location}</Text>
            <Text style={[styles.cardText, { color: palette.accent }]}>Observação: {item.note}</Text>
            <View style={styles.buttonGroup}> 
              <TouchableOpacity style={styles.editButton} onPress={() => startEditing(item)}>
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={() => openGoogleCalendar(item)}>
                <Text style={styles.shareButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={() => shareVisit(item)}>
                <Text style={styles.shareButtonText}>Compartilhar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteVisit(item.id)}>
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
  summaryBox: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 12 },
  createButton: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginBottom: 12 },
  createButtonText: { color: '#FFF', fontWeight: '800' },
  summaryLabel: { textTransform: 'uppercase', letterSpacing: 1.4, fontSize: 10, fontWeight: '700' },
  summaryValue: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 6 },
  list: { paddingBottom: 32 },
  editorBox: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 12 },
  editorTitle: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  input: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  propertyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  propertyChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginBottom: 6 },
  propertyChipText: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8 },
  buttonGroup: { flexDirection: 'row', flexWrap: 'nowrap', gap: 6, marginTop: 8, justifyContent: 'space-between', alignItems: 'center' },
  primaryButton: { flex: 1, backgroundColor: '#5EEAD4', borderRadius: 10, paddingVertical: 8 },
  primaryButtonText: { color: '#052E2A', textAlign: 'center', fontWeight: '700' },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: '#5EEAD4', borderRadius: 10, paddingVertical: 8 },
  secondaryButtonText: { color: '#5EEAD4', textAlign: 'center', fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 10 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cardText: { color: '#C7D2E0', marginTop: 4 },
  editButton: { minWidth: 72, flexShrink: 1, backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center' },
  editButtonText: { color: '#FFF', fontWeight: '700', fontSize: 11 },
  shareButton: { minWidth: 78, flexShrink: 1, backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center' },
  shareButtonText: { color: '#FFF', fontWeight: '700', fontSize: 11 },
  deleteButton: { minWidth: 72, flexShrink: 1, borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center', backgroundColor: 'rgba(220,38,38,0.08)' },
  deleteButtonText: { color: '#FCA5A5', fontWeight: '700', fontSize: 11 },
});
