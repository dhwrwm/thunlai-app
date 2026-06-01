import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { browseByLetter, recordView, type Word } from '../../src/utils/db';
import { useFavourites } from '../../src/hooks/useFavourites';
import WordCard from '../../src/components/WordCard';
import { COLORS, SPACING, useTheme } from '../../src/utils/theme';

export default function BrowseScreen() {
  const { letter } = useLocalSearchParams<{ letter: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { favIds, toggle } = useFavourites();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!letter) return;
    browseByLetter(decodeURIComponent(letter), 200).then((w) => {
      setWords(w);
      setLoading(false);
    });
  }, [letter]);

  const openWord = (word: Word) => {
    recordView(word.id);
    router.push({ pathname: '/word/[id]', params: { id: word.id } });
  };

  return (
    <>
      <Stack.Screen options={{ title: `Words starting with ${letter}` }} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bgTertiary }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
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
          ListHeaderComponent={
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              {words.length} word{words.length !== 1 ? 's' : ''} starting with "{letter}"
            </Text>
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              No words found starting with "{letter}".
            </Text>
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, marginBottom: SPACING.sm },
  empty: { fontSize: 15, textAlign: 'center', marginTop: SPACING.xxl },
});
