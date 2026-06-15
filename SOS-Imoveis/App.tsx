import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';

import { initDatabase, clearLocalData } from './src/database/db';
import { AccessibilityProvider, useAccessibilitySettings } from './src/context/AccessibilityContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { theme } = useAccessibilitySettings();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

const INITIALIZED_KEY = 'sos_imoveis_initialized';

export default function App() {
  useEffect(() => {
    const initialize = async () => {
      await initDatabase().catch(() => undefined);

      try {
        const initialized = await SecureStore.getItemAsync(INITIALIZED_KEY);
        if (!initialized) {
          await clearLocalData();
          await SecureStore.deleteItemAsync('sos_imoveis_last_login');
          await SecureStore.deleteItemAsync('sos_imoveis_auto_login');
          await SecureStore.setItemAsync(INITIALIZED_KEY, 'true');
        }
      } catch {
        // ignore initialization failures
      }
    };

    initialize();
  }, []);

  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
}
