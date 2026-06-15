import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AccessibilityFab } from '../components/AccessibilityFab';
import { AppLogo } from '../components/AppLogo';
import { StatCard } from '../components/StatCard';
import { FloatingRefreshButton } from '../components/FloatingRefreshButton';
import { listBrokers, listClients, listProperties } from '../database/db';
import { useAccessibilitySettings } from '../context/AccessibilityContext';
import type { RootStackParamList } from '../types';
import * as SecureStore from 'expo-secure-store';

const CAROUSEL_CARD_WIDTH = 280;
const CAROUSEL_CARD_MARGIN = 8;
const CAROUSEL_STEP = CAROUSEL_CARD_WIDTH + CAROUSEL_CARD_MARGIN * 2;

const menuItems = [
  { key: 'Brokers', title: 'Corretores', description: 'Cadastre e gerencie corretores.', screen: 'Brokers' as const },
  { key: 'Clients', title: 'Clientes', description: 'Acompanhe interessados e contatos.', screen: 'Clients' as const },
  { key: 'Properties', title: 'Imóveis', description: 'Organize sua carteira de imóveis.', screen: 'Properties' as const },
  { key: 'Chatbot', title: 'Assistente Imobiliário Offline', description: 'Chatbot imobiliário offline com dicas práticas.', screen: 'Chatbot' as const },
  { key: 'Calculator', title: 'Calculadora', description: 'Simulações de financiamento e comissões.', screen: 'Calculator' as const },
  { key: 'Contracts', title: 'Contratos', description: 'Gerencie contratos com senha.', screen: 'Contracts' as const },
];

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const flatListRef = useRef<FlatList<{ propertyId: number; title: string; price: string; photo: string }>>(null);
  const [counts, setCounts] = useState({ brokers: 0, clients: 0, properties: 0 });
  const [summary, setSummary] = useState({ visits: 0, commission: 0 });
  const [featured, setFeatured] = useState<Array<{ propertyId: number; title: string; price: string; photo: string }>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userRole, setUserRole] = useState<'corretor' | 'cliente'>((route.params as { userRole?: 'corretor' | 'cliente' } | undefined)?.userRole ?? 'corretor');
  const { theme, fontScale } = useAccessibilitySettings();
  const isClientUser = userRole === 'cliente';

  const loadData = async () => {
    const [brokers, clients, properties] = await Promise.all([listBrokers(), listClients(), listProperties()]);
    const totalValue = properties.reduce((sum, property) => sum + (Number(String(property.price).replace(/[^0-9.-]+/g, '')) || 0), 0);
    const storedVisits = await SecureStore.getItemAsync('sos_imoveis_visits_count');
    const storedCommission = await SecureStore.getItemAsync('sos_imoveis_last_commission');
    const visitsCount = storedVisits ? Number(storedVisits) : Math.max(2, Math.floor(properties.length * 1.4));
    const lastCommission = storedCommission ? Number(storedCommission) : totalValue * 0.05;

    setCounts({ brokers: brokers.length, clients: clients.length, properties: properties.length });
    setSummary({
      visits: visitsCount,
      commission: Number.isFinite(lastCommission) ? lastCommission : totalValue * 0.05,
    });

    const photos: Array<{ propertyId: number; title: string; price: string; photo: string }> = [];
    properties.forEach((property) => {
      if (property.photos) {
        try {
          const parsed = JSON.parse(property.photos);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // ONLY the first image of each registered property
            photos.push({ propertyId: property.id, title: property.title, price: property.price, photo: parsed[0] });
          }
        } catch(e) {
          // fallback if it's not json
          const split = property.photos.split(',').filter(Boolean);
          if (split.length > 0) {
            photos.push({ propertyId: property.id, title: property.title, price: property.price, photo: split[0].trim() });
          }
        }
      }
    });

    setFeatured(photos.slice(0, 8));
  };

  useFocusEffect(
    useCallback(() => {
      const restoreRole = async () => {
        const routeRole = (route.params as { userRole?: 'corretor' | 'cliente' } | undefined)?.userRole;
        if (routeRole) {
          setUserRole(routeRole);
          return;
        }

        try {
          const stored = await SecureStore.getItemAsync('sos_imoveis_last_login');
          if (stored) {
            const parsed = JSON.parse(stored) as { role?: 'corretor' | 'cliente' };
            if (parsed.role) {
              setUserRole(parsed.role);
            }
          }
        } catch {
          setUserRole('corretor');
        }
      };

      restoreRole();
      loadData();
    }, [route.params])
  );

  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featured.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [featured]);

  useEffect(() => {
    if (featured.length > 0 && flatListRef.current) {
      try {
        flatListRef.current?.scrollToIndex({ index: activeIndex, animated: true, viewPosition: 0.5 });
      } catch(e) {}
    }
  }, [activeIndex, featured]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: true,
      headerBackTitle: 'Voltar',
      title: 'SOS Imóveis',
    });
  }, [navigation]);

  const isLight = theme === 'light';
  const handleNavigate = (screen: 'Brokers' | 'Clients' | 'Properties' | 'Contracts' | 'Chatbot' | 'Calculator') => {
    if (screen === 'Brokers' || screen === 'Clients' || screen === 'Properties' || screen === 'Contracts' || screen === 'Chatbot') {
      navigation.navigate(screen, { userRole });
      return;
    }

    navigation.navigate(screen);
  };
  const palette = {
    background: isLight ? '#F4F8FF' : '#07111F',
    panel: isLight ? '#FFFFFF' : '#12253C',
    border: isLight ? '#D8E3F2' : '#253A53',
    text: isLight ? '#0F172A' : '#FFF',
    muted: isLight ? '#334155' : '#C7D2E0',
    accent: isLight ? '#2563EB' : '#5EEAD4',
    button: isLight ? '#2563EB' : '#1D4ED8',
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <AppLogo theme={theme} />
        <Text style={[styles.eyebrow, { color: palette.accent, fontSize: 12 * fontScale }]}>Gestão completa em um só app</Text>
        <Text style={[styles.subtitle, { color: palette.muted, fontSize: 14 * fontScale }]}>Controle de corretores, clientes e imóveis com banco local.</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Corretores" value={counts.brokers} accent="#5EEAD4" fontScale={fontScale} theme={theme} onPress={() => navigation.navigate('Brokers', { userRole })} />
        {!isClientUser ? (
          <StatCard label="Clientes" value={counts.clients} accent="#93C5FD" fontScale={fontScale} theme={theme} onPress={() => navigation.navigate('Clients', { userRole })} />
        ) : null}
        <StatCard label="Imóveis" value={counts.properties} accent="#F9A8D4" fontScale={fontScale} theme={theme} onPress={() => navigation.navigate('Properties', { userRole })} />
      </View>

      {!isClientUser ? (
        <View style={styles.summaryGrid}>
          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: palette.panel, borderColor: palette.border }]}
            onPress={() => navigation.navigate('Agenda', { userRole })}
          >
            <Text style={[styles.summaryLabel, { color: palette.accent }]}>Visitas agendadas</Text>
            <Text style={[styles.summaryValue, { color: palette.text }]}>{summary.visits}</Text>
            <Text style={[styles.summaryHint, { color: palette.muted }]}>Toque para abrir a agenda</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: palette.panel, borderColor: palette.border }]}
            onPress={() => navigation.navigate('Commission', { userRole })}
          >
            <Text style={[styles.summaryLabel, { color: palette.accent }]}>Comissão estimada</Text>
            <Text style={[styles.summaryValue, { color: palette.text }]}>R$ {summary.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            <Text style={[styles.summaryHint, { color: palette.muted }]}>Toque para somar imóveis e comissões</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {featured.length > 0 ? (
        <View style={styles.carouselBox}>
          <Text style={[styles.carouselLabel, { color: palette.accent }]}>Galeria de imóveis</Text>
          <FlatList
            ref={flatListRef}
            data={featured}
            keyExtractor={(item) => String(item.propertyId)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToAlignment="center"
            snapToInterval={CAROUSEL_STEP}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / CAROUSEL_STEP);
              setActiveIndex(index);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.carouselCard, { width: CAROUSEL_CARD_WIDTH, backgroundColor: palette.panel, borderColor: palette.border }]}
                onPress={() => navigation.navigate('Properties', { selectedPropertyId: item.propertyId, userRole })}
              >
                <Image source={{ uri: item.photo }} style={styles.carouselImage} />
                <View style={styles.carouselTextBox}>
                  <Text style={[styles.carouselTitle, { color: palette.text }]}>{item.title}</Text>
                  <Text style={[styles.carouselPrice, { color: palette.muted }]}>R$ {item.price}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : null}

      <AccessibilityFab />

      <FlatList
        data={menuItems.filter((item) => !(isClientUser && item.screen === 'Clients'))}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: palette.panel, borderColor: palette.border }]}
            onPress={() => handleNavigate(item.screen)}
          >
            <Text style={[styles.cardTitle, { color: palette.text, fontSize: 18 * fontScale }]}>{item.title}</Text>
            <Text style={[styles.cardText, { color: palette.muted, fontSize: 14 * fontScale }]}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F', paddingHorizontal: 18, paddingTop: 24 },
  header: { marginBottom: 18 },
  eyebrow: { color: '#5EEAD4', textTransform: 'uppercase', letterSpacing: 2, fontSize: 12 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '800', marginTop: 6 },
  subtitle: { color: '#C7D2E0', fontSize: 14, marginTop: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, gap: 10 },
  summaryGrid: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  summaryCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12 },
  summaryLabel: { textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 10, fontWeight: '700' },
  summaryValue: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  summaryHint: { fontSize: 11, marginTop: 4 },
  carouselBox: { marginBottom: 18 },
  carouselLabel: { color: '#5EEAD4', textTransform: 'uppercase', letterSpacing: 2, fontSize: 11, marginBottom: 8 },
  carouselContent: { alignItems: 'center', paddingHorizontal: 18, paddingVertical: 4 },
  carouselCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#12253C', borderWidth: 1, borderColor: '#253A53', marginHorizontal: CAROUSEL_CARD_MARGIN },
  carouselImage: { width: '100%', height: 150 },
  carouselTextBox: { padding: 10 },
  carouselTitle: { color: '#FFF', fontWeight: '700' },
  carouselPrice: { color: '#C7D2E0', marginTop: 4 },
  headerButton: { marginRight: 10, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.18)' },
  headerButtonText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  list: { paddingBottom: 80 },
  fabColumn: { position: 'absolute', right: 18, bottom: 88, zIndex: 10, gap: 8 },
  fabButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6 },
  fabIcon: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  card: { backgroundColor: '#12253C', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#253A53', minHeight: 92 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  cardText: { color: '#C7D2E0', marginTop: 6 },
});
