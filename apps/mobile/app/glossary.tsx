import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { getGlossaryByLetter, recordView, type Word } from '../src/utils/db';
import { useFavourites } from '../src/hooks/useFavourites';
import WordCard from '../src/components/WordCard';
import { COLORS, SPACING, RADIUS, useTheme } from '../src/utils/theme';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PAGE_SIZE = 50;

export default function GlossaryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { favIds, toggle } = useFavourites();

  const [letter, setLetter] = useState('A');
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const activeLetterRef = useRef('A');

  const loadPage = useCallback(async (l: string, offset: number, append: boolean) => {
    try {
      const page = await getGlossaryByLetter(l, PAGE_SIZE, offset);
      if (activeLetterRef.current !== l) return;
      setWords(prev => append ? [...prev, ...page] : page);
      setHasMore(page.length === PAGE_SIZE);
      offsetRef.current = offset + page.length;
    } catch {
      // leave current list intact on error
    }
  }, []);

  const selectLetter = useCallback(async (l: string) => {
    setLetter(l);
    activeLetterRef.current = l;
    offsetRef.current = 0;
    setHasMore(true);
    setLoading(true);
    await loadPage(l, 0, false);
    setLoading(false);
  }, [loadPage]);

  useEffect(() => {
    selectLetter('A');
  }, []);

  const onEndReached = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadPage(letter, offsetRef.current, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, letter, loadPage]);

  const openWord = (word: Word) => {
    recordView(word.id);
    router.push({ pathname: '/word/[id]', params: { id: word.id } });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bgTertiary }]}>
      <Stack.Screen options={{ title: 'Glossary' }} />

      {/* A–Z letter picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.pickerBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        contentContainerStyle={styles.pickerRow}
      >
        {ALPHABET.map(l => (
          <TouchableOpacity
            key={l}
            style={[styles.pickerBtn, l === letter && styles.pickerBtnActive]}
            onPress={() => selectLetter(l)}
          >
            <Text style={[styles.pickerText, { color: l === letter ? '#fff' : COLORS.primary }]}>
              {l}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={words}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <WordCard
              word={item}
              isFavourite={favIds.has(item.id)}
              onPress={openWord}
              onFavouriteToggle={toggle}
              reverse
            />
          )}
          contentContainerStyle={styles.list}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            words.length > 0 ? (
              <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
                {words.length}{hasMore ? '+' : ''} entr{words.length !== 1 ? 'ies' : 'y'} starting with "{letter}"
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No glossary entries starting with "{letter}"
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={COLORS.primary} style={styles.footer} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pickerBar: { flexGrow: 0, borderBottomWidth: 0.5 },
  pickerRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  pickerBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerBtnActive: { backgroundColor: COLORS.primary },
  pickerText: { fontSize: 15, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: SPACING.lg },
  countLabel: { fontSize: 12, marginBottom: SPACING.sm },
  empty: { alignItems: 'center', paddingTop: SPACING.xxl * 2 },
  emptyIcon: { fontSize: 40, marginBottom: SPACING.md },
  emptyText: { fontSize: 15, textAlign: 'center' },
  footer: { paddingVertical: SPACING.lg },
});
