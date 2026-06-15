import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { initDatabase } from './src/database/db';
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

export default function App() {
  useEffect(() => {
    initDatabase().catch(() => undefined);
  }, []);

  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
}
