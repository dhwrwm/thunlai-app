import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getWordById, isFavourite, toggleFavourite, type Word } from '../../src/utils/db';
import { COLORS, SPACING, RADIUS, useTheme } from '../../src/utils/theme';

export default function WordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [word, setWord] = useState<Word | null>(null);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!id) return;
    getWordById(Number(id)).then(setWord);
    isFavourite(Number(id)).then(setFav);
  }, [id]);

  const handleFav = async () => {
    if (!word) return;
    const now = await toggleFavourite(word.id);
    setFav(now);
  };

  const handleShare = async () => {
    if (!word) return;
    await Share.share({
      message: `${word.bodo}${word.roman ? ` (${word.roman})` : ''}\n${word.english}\n\nvia bihung.org`,
    });
  };

  const handleOpenWeb = () => {
    if (!word?.slug) return;
    Linking.openURL(`https://bihung.org/define/${word.id}`);
  };

  if (!word) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  const sourceStyle = word.source === 'dictionary' ? COLORS.dictionary : COLORS.glossary;

  return (
    <>
      <Stack.Screen
        options={{
          title: word.bodo,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16, marginRight: 4 }}>
              <TouchableOpacity onPress={handleShare}>
                <Text style={{ fontSize: 20 }}>↑</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFav}>
                <Text style={{ fontSize: 22, color: fav ? COLORS.primary : undefined }}>
                  {fav ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bgTertiary }}
        contentContainerStyle={styles.container}
      >
        {/* Main card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Bodo headword */}
          <Text style={[styles.bodo, { color: theme.text }]}>{word.bodo}</Text>

          {/* Romanisation */}
          {word.roman ? (
            <Text style={[styles.roman, { color: COLORS.primaryDark }]}>/{word.roman}/</Text>
          ) : null}

          {/* Source badge */}
          <View style={[styles.badge, { backgroundColor: sourceStyle.bg }]}>
            <Text style={[styles.badgeText, { color: sourceStyle.text }]}>
              {word.source === 'dictionary' ? '📖 Dictionary' : '📚 Glossary'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* English meaning */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>English</Text>
          <Text style={[styles.fieldValue, { color: theme.text }]}>{word.english}</Text>
        </View>

        {/* Open on web */}
        {word.slug && (
          <TouchableOpacity
            style={[styles.webBtn, { borderColor: COLORS.primary }]}
            onPress={handleOpenWeb}
          >
            <Text style={[styles.webBtnText, { color: COLORS.primary }]}>
              🌐  View on bihung.org
            </Text>
          </TouchableOpacity>
        )}

        {/* Attribution */}
        <Text style={[styles.attribution, { color: theme.textTertiary }]}>
          Data © Bodo Sahitya Sabha · bihung.org · CC BY-SA 4.0
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 0.5,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  bodo: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: 4,
  },
  roman: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 0.5,
    marginVertical: SPACING.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  fieldValue: {
    fontSize: 17,
    lineHeight: 26,
    marginBottom: SPACING.lg,
  },
  webBtn: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  webBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },
  attribution: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
