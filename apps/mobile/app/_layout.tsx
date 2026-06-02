import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { initDb, isSeeded, seedDatabase } from '../src/utils/db';
import SeedScreenComponent from '../src/components/SeedScreen';
import { useTheme, COLORS } from '../src/utils/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { theme, isDark } = useTheme();
  const [ready, setReady] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        const seeded = await isSeeded();
        if (!seeded) {
          setSeeding(true);
          await seedDatabase((pct, msg) => {
            setProgress(pct);
            setMessage(msg);
          });
          setSeeding(false);
        }
      } catch (err) {
        console.error('DB init error:', err);
        // Still let the user in — they just won't have data
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  if (seeding) {
    return <SeedScreenComponent progress={progress} message={message} />;
  }

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: COLORS.primary }} />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.bgTertiary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="word/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="browse/[letter]" options={{ presentation: 'card' }} />
        <Stack.Screen name="history" options={{ presentation: 'card' }} />
        <Stack.Screen name="learn/trace" options={{ title: 'Trace Letters', presentation: 'card' }} />
        <Stack.Screen name="learn/quiz" options={{ title: 'Vocabulary Quiz', presentation: 'card' }} />
        <Stack.Screen name="glossary" options={{ title: 'Glossary', presentation: 'card' }} />
      </Stack>
    </>
  );
}
