import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { searchWords, recordView, type Word } from '../../src/utils/db';
import { useFavourites } from '../../src/hooks/useFavourites';
import WordCard from '../../src/components/WordCard';
import { COLORS, SPACING, RADIUS, useTheme } from '../../src/utils/theme';

const MODES = [
  { key: 'all', label: 'All' },
  { key: 'dictionary', label: 'Dictionary' },
  { key: 'glossary', label: 'Glossary' },
] as const;

type Mode = (typeof MODES)[number]['key'];

export default function SearchScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { favIds, toggle } = useFavourites();

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('all');
  const [results, setResults] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doSearch = useCallback(
    async (q: string, m: Mode) => {
      if (!q.trim()) { setResults([]); return; }
      setLoading(true);
      try {
        let res = await searchWords(q, 100);
        if (m !== 'all') res = res.filter((w) => w.source === m);
        setResults(res);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const onChangeText = (text: string) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text, mode), 200);
  };

  const onModeChange = (m: Mode) => {
    setMode(m);
    doSearch(query, m);
  };

  const openWord = (word: Word) => {
    recordView(word.id);
    Keyboard.dismiss();
    router.push({ pathname: '/word/[id]', params: { id: word.id } });
  };

  const renderItem = ({ item }: { item: Word }) => (
    <WordCard
      word={item}
      isFavourite={favIds.has(item.id)}
      onPress={openWord}
      onFavouriteToggle={toggle}
      showSource={mode === 'all'}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgTertiary }}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <View style={[styles.inputRow, { backgroundColor: theme.bgSecondary, borderColor: theme.border }]}>
          <Text style={{ fontSize: 18, marginRight: SPACING.sm }}>🔍</Text>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={query}
            onChangeText={onChangeText}
            placeholder="Search Bodo, Roman, or English…"
            placeholderTextColor={theme.textTertiary}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <Text style={{ fontSize: 18, color: theme.textTertiary }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Mode pills */}
        <View style={styles.pills}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.pill,
                { borderColor: theme.border },
                mode === m.key && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
              ]}
              onPress={() => onModeChange(m.key)}
            >
              <Text style={[styles.pillText, { color: mode === m.key ? '#fff' : theme.textSecondary }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
                {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </Text>
            ) : null
          }
          ListEmptyComponent={
            query.length > 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyIcon]}>📭</Text>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No results</Text>
                <Text style={[styles.emptyMsg, { color: theme.textSecondary }]}>
                  Try different spelling or switch the search mode above.
                </Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔤</Text>
                <Text style={[styles.emptyMsg, { color: theme.textSecondary }]}>
                  Type a Bodo word, its romanisation, or an English translation to search 31,000+ entries.
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  pills: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  list: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  countLabel: {
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptyMsg: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
