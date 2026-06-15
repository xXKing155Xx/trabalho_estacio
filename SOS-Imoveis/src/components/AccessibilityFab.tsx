import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Moon, Sun, Volume2, VolumeX } from 'lucide-react-native';

import type { RootStackParamList } from '../types';

import { useAccessibilitySettings } from '../context/AccessibilityContext';

export function AccessibilityFab() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const userRole = (route.params as { userRole?: 'corretor' | 'cliente' } | undefined)?.userRole ?? 'corretor';
  const { theme, setTheme, setFontScale, soundEnabled, setSoundEnabled } = useAccessibilitySettings();
  const [expanded, setExpanded] = useState(false);

  const palette = useMemo(() => ({
    button: theme === 'dark' ? '#2563EB' : '#1D4ED8',
    text: '#FFF',
    toggle: theme === 'dark' ? '#111827' : '#E5E7EB',
  }), [theme]);

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  return (
    <View style={styles.fabWrap}>
      {expanded ? (
        <View style={styles.fabColumn}>
          <TouchableOpacity
            style={[styles.fabButton, { backgroundColor: palette.button }]}
            onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            accessibilityLabel="Alternar tema"
          >
            {theme === 'dark' ? <Sun size={18} color="#FFF" /> : <Moon size={18} color="#FFF" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabButton, { backgroundColor: '#2563EB' }]}
            onPress={() => navigation.navigate('Acessibilidade', { userRole })}
            accessibilityLabel="Abrir acessibilidade em Libras"
          >
            <View style={styles.fabTextBox}><Text style={styles.fabIcon}>🤟</Text></View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabButton, { backgroundColor: palette.button }]}
            onPress={toggleSound}
            accessibilityLabel={soundEnabled ? 'Desativar música de espera' : 'Ativar música de espera'}
          >
            {soundEnabled ? <Volume2 size={18} color="#FFF" /> : <VolumeX size={18} color="#FFF" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabButton, { backgroundColor: palette.button }]}
            onPress={() => setFontScale((prev: number) => Math.min(1.25, Number((prev + 0.05).toFixed(2))))}
            accessibilityLabel="Aumentar fonte"
          >
            <View style={styles.fabTextBox}><Text style={styles.fabIcon}>A+</Text></View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabButton, { backgroundColor: palette.button }]}
            onPress={() => setFontScale((prev: number) => Math.max(0.9, Number((prev - 0.05).toFixed(2))))}
            accessibilityLabel="Diminuir fonte"
          >
            <View style={styles.fabTextBox}><Text style={styles.fabIcon}>A-</Text></View>
          </TouchableOpacity>
        </View>
      ) : null}
      <TouchableOpacity
        style={[styles.toggleButton, { backgroundColor: '#2563EB' }]}
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityLabel={expanded ? 'Ocultar controles' : 'Mostrar controles'}
      >
        <Text style={[styles.toggleText, { color: '#FFF' }]}>{expanded ? '‹' : '›'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fabWrap: { position: 'absolute', right: 18, bottom: 88, zIndex: 10, alignItems: 'flex-end' },
  fabColumn: { gap: 8, marginBottom: 8 },
  fabButton: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6 },
  fabTextBox: { justifyContent: 'center', alignItems: 'center' },
  fabIcon: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  toggleButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 5 },
  toggleText: { fontSize: 18, fontWeight: '800' },
});
