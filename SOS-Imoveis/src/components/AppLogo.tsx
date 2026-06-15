import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface AppLogoProps {
  theme?: 'dark' | 'light';
}

export function AppLogo({ theme = 'dark' }: AppLogoProps) {
  const isLight = theme === 'light';

  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: isLight ? '#EEF4FF' : '#11253F' }]}>
        <Image
          source={require('../../assets/android-icon-foreground.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <View>
        <Text style={[styles.brand, { color: isLight ? '#0F172A' : '#FFF' }]}>SOS Imóveis</Text>
        <Text style={[styles.sub, { color: isLight ? '#475569' : '#BFDBFE' }]}>Gestão imobiliária moderna</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  iconBox: { width: 52, height: 52, borderRadius: 16, marginRight: 10, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  icon: { width: 38, height: 38 },
  brand: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  sub: { color: '#BFDBFE', fontSize: 12 },
});
