import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getFavourites, recordView, type Word } from '../../src/utils/db';
import { useFavourites } from '../../src/hooks/useFavourites';
import WordCard from '../../src/components/WordCard';
import { COLORS, SPACING, useTheme } from '../../src/utils/theme';

export default function FavouritesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { favIds, toggle, reload } = useFavourites();
  const [words, setWords] = useState<Word[]>([]);

  const load = useCallback(async () => {
    const favs = await getFavourites();
    setWords(favs);
    reload();
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  const openWord = (word: Word) => {
    recordView(word.id);
    router.push({ pathname: '/word/[id]', params: { id: word.id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgTertiary }}>
      <FlatList
        data={words}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <WordCard
            word={item}
            isFavourite={favIds.has(item.id)}
            onPress={openWord}
            onFavouriteToggle={async (id) => { await toggle(id); await load(); }}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>☆</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No saved words yet</Text>
            <Text style={[styles.emptyMsg, { color: theme.textSecondary }]}>
              Tap ☆ on any word to save it here for quick offline access.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  empty: { alignItems: 'center', paddingTop: SPACING.xxl * 2, paddingHorizontal: SPACING.xxl },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginBottom: SPACING.sm },
  emptyMsg: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
