import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Audio } from 'expo-av';

interface AccessibilitySettings {
  theme: 'dark' | 'light';
  fontScale: number;
  soundEnabled: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  setFontScale: React.Dispatch<React.SetStateAction<number>>;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const AccessibilityContext = createContext<AccessibilitySettings | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [fontScale, setFontScale] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const manageSound = async () => {
      try {
        if (!soundEnabled) {
          await soundRef.current?.stopAsync();
          return;
        }

        if (!soundRef.current) {
          soundRef.current = new Audio.Sound();
        }

        const status = await soundRef.current.getStatusAsync();

        if (!('isLoaded' in status) || !status.isLoaded) {
          await soundRef.current.loadAsync(
            { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
            { shouldPlay: true, isLooping: true }
          );
          return;
        }

        if ('isPlaying' in status && !status.isPlaying) {
          await soundRef.current.playAsync();
        }
      } catch (error) {
        setSoundEnabled(false);
      }
    };

    manageSound();
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      soundRef.current?.stopAsync().catch(() => undefined);
      soundRef.current?.unloadAsync().catch(() => undefined);
      soundRef.current = null;
    };
  }, []);

  const value = useMemo(
    () => ({ theme, fontScale, soundEnabled, setTheme, setFontScale, setSoundEnabled }),
    [theme, fontScale, soundEnabled]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilitySettings() {
  const context = useContext(AccessibilityContext);

  if (!context) {
    throw new Error('useAccessibilitySettings must be used within AccessibilityProvider');
  }

  return context;
}
