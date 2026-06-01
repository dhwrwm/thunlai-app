import React, { useCallback, useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { getHistory, clearHistory, recordView, type Word } from '../src/utils/db';
import { useFavourites } from '../src/hooks/useFavourites';
import WordCard from '../src/components/WordCard';
import { COLORS, SPACING, useTheme } from '../src/utils/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { favIds, toggle } = useFavourites();
  const [words, setWords] = useState<Word[]>([]);

  const load = useCallback(async () => {
    setWords(await getHistory(50));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleClear = () => {
    Alert.alert('Clear history', 'Remove all recently viewed words?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await clearHistory(); load(); } },
    ]);
  };

  const openWord = (word: Word) => {
    recordView(word.id);
    router.push({ pathname: '/word/[id]', params: { id: word.id } });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'History',
          headerRight: () =>
            words.length > 0 ? (
              <TouchableOpacity onPress={handleClear}>
                <Text style={{ color: COLORS.primary, fontSize: 15 }}>Clear</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <FlatList
        data={words}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <WordCard
            word={item}
            isFavourite={favIds.has(item.id)}
            onPress={openWord}
            onFavouriteToggle={toggle}
          />
        )}
        style={{ backgroundColor: theme.bgTertiary }}
        contentContainerStyle={{ padding: SPACING.lg }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.icon}>🕐</Text>
            <Text style={[styles.emptyMsg, { color: theme.textSecondary }]}>
              Words you view will appear here.
            </Text>
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingTop: 80 },
  icon: { fontSize: 48, marginBottom: 16 },
  emptyMsg: { fontSize: 15 },
});
