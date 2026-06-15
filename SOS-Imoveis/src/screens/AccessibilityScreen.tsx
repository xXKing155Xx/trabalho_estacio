import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AccessibilityFab } from '../components/AccessibilityFab';
import { LibrasVideoModal } from '../components/LibrasVideoModal';
import { listAccessibilityTerms, updateAccessibilityTerm } from '../database/db';
import { useAccessibilitySettings } from '../context/AccessibilityContext';

interface AccessibilityTerm {
  id: number;
  term: string;
  description: string;
  videoUri: string;
  category?: string;
}

export default function AccessibilityScreen() {
  const { theme, fontScale } = useAccessibilitySettings();
  const [terms, setTerms] = useState<AccessibilityTerm[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<AccessibilityTerm | null>(null);

  const loadTerms = async () => {
    const data = await listAccessibilityTerms();
    setTerms(data);
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const palette = useMemo(() => (theme === 'dark'
    ? { background: '#07111F', surface: '#12253C', text: '#FFF', muted: '#C7D2E0', border: '#253A53', input: '#0F1C2B', accent: '#5EEAD4' }
    : { background: '#F5F7FB', surface: '#FFFFFF', text: '#111827', muted: '#4B5563', border: '#D1D5DB', input: '#EEF4FF', accent: '#2563EB' }), [theme]);

  const filteredTerms = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return terms;
    return terms.filter((item) => `${item.term} ${item.description} ${item.category ?? ''}`.toLowerCase().includes(query));
  }, [search, terms]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}> 
      <Text style={[styles.heading, { color: palette.text, fontSize: 24 * fontScale }]}>Acessibilidade em Libras</Text>
      <Text style={[styles.description, { color: palette.muted, fontSize: 14 * fontScale }]}>Toque em um termo para ver a explicação em vídeo.</Text>

      <View style={[styles.searchBox, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar termo"
          style={[styles.searchInput, { backgroundColor: palette.input, color: palette.text }]}
          placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredTerms.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
            onPress={() => setSelectedTerm(item)}
            activeOpacity={0.9}
          >
            <Text style={[styles.cardTitle, { color: palette.text, fontSize: 18 * fontScale }]}>{item.term}</Text>
            <Text style={[styles.cardText, { color: palette.muted, fontSize: 14 * fontScale }]}>{item.description}</Text>
            {item.category ? <Text style={[styles.category, { color: palette.accent }]}>Categoria: {item.category}</Text> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <AccessibilityFab />

      {selectedTerm ? (
        <LibrasVideoModal
          visible={!!selectedTerm}
          title={selectedTerm.term}
          videoUri={selectedTerm.videoUri}
          caption={selectedTerm.description}
          onClose={() => setSelectedTerm(null)}
          onSave={async (videoUri) => {
            await updateAccessibilityTerm({ ...selectedTerm, videoUri });
            await loadTerms();
            setSelectedTerm((prev) => (prev ? { ...prev, videoUri } : prev));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  heading: { fontWeight: '800', marginBottom: 4 },
  description: { marginBottom: 12 },
  searchBox: { borderRadius: 16, borderWidth: 1, padding: 8, marginBottom: 10 },
  searchInput: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  list: { paddingBottom: 24 },
  card: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardTitle: { fontWeight: '800', marginBottom: 4 },
  cardText: { marginBottom: 4 },
  category: { fontWeight: '700', fontSize: 12 },
});
