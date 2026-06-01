import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getWordOfTheDay,
  getRandomWords,
  getHistory,
  getStats,
  recordView,
  type Word,
} from '../../src/utils/db';
import { useFavourites } from '../../src/hooks/useFavourites';
import WordCard from '../../src/components/WordCard';
import { COLORS, SPACING, RADIUS, useTheme } from '../../src/utils/theme';

const BODO_ALPHABET = [
  'अ','आ','इ','ई','उ','ऊ','ए','ओ',
  'क','ख','ग','घ','च','ज','ट','ड',
  'थ','द','ध','न','फ','ब','भ','म',
  'र','ल','स','ह',
];

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { favIds, toggle } = useFavourites();

  const [wotd, setWotd] = useState<Word | null>(null);
  const [recent, setRecent] = useState<Word[]>([]);
  const [stats, setStats] = useState({ total: 0, dictionary: 0, glossary: 0, favourites: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [w, h, s] = await Promise.all([
      getWordOfTheDay(),
      getHistory(5),
      getStats(),
    ]);
    setWotd(w);
    setRecent(h);
    setStats(s);
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openWord = (word: Word) => {
    recordView(word.id);
    router.push({ pathname: '/word/[id]', params: { id: word.id } });
  };

  const openLetter = (letter: string) => {
    router.push({ pathname: '/browse/[letter]', params: { letter } });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bgTertiary }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Word of the Day */}
      {wotd && (
        <TouchableOpacity
          style={styles.wotd}
          onPress={() => openWord(wotd)}
          activeOpacity={0.85}
        >
          <Text style={styles.wotdTag}>✦ Word of the Day</Text>
          <Text style={styles.wotdBodo}>{wotd.bodo}</Text>
          {wotd.roman ? (
            <Text style={styles.wotdRoman}>/{wotd.roman}/</Text>
          ) : null}
          <Text style={styles.wotdEnglish} numberOfLines={3}>
            {wotd.english}
          </Text>
          <Text style={styles.wotdTap}>Tap for details →</Text>
        </TouchableOpacity>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total words', value: stats.total.toLocaleString() },
          { label: 'Dictionary', value: stats.dictionary.toLocaleString() },
          { label: 'Glossary', value: stats.glossary.toLocaleString() },
          { label: 'Saved', value: stats.favourites.toLocaleString() },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statVal, { color: theme.text }]}>{s.value}</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Alphabet browser */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Browse by letter</Text>
      <View style={[styles.alphaGrid, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {BODO_ALPHABET.map((letter) => (
          <TouchableOpacity
            key={letter}
            style={styles.alphaBtn}
            onPress={() => openLetter(letter)}
          >
            <Text style={[styles.alphaBtnText, { color: COLORS.primary }]}>{letter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent history */}
      {recent.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Recently viewed</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={[styles.sectionLink, { color: COLORS.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {recent.map((w) => (
            <WordCard
              key={w.id}
              word={w}
              isFavourite={favIds.has(w.id)}
              onPress={openWord}
              onFavouriteToggle={toggle}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  wotd: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  wotdTag: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  wotdBodo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 36,
  },
  wotdRoman: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  wotdEnglish: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  wotdTap: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: RADIUS.sm,
    borderWidth: 0.5,
    padding: SPACING.md,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLbl: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '500',
  },
  alphaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    padding: SPACING.sm,
    marginBottom: SPACING.lg,
    gap: 2,
  },
  alphaBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  alphaBtnText: {
    fontSize: 17,
    fontWeight: '500',
  },
});
