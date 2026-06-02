import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, useTheme } from '../../src/utils/theme';

const ACTIVITIES = [
  {
    id: 'trace',
    emoji: '✏️',
    title: 'Trace Letters',
    description: 'Practice writing Devanagari script letter by letter',
    route: '/learn/trace' as const,
    available: true,
  },
  {
    id: 'quiz',
    emoji: '🧠',
    title: 'Vocabulary Quiz',
    description: 'Test your Bodo–English vocabulary knowledge',
    route: '/learn/quiz' as const,
    available: true,
  },
  {
    id: 'flashcards',
    emoji: '🃏',
    title: 'Flashcards',
    description: 'Memorise words with spaced repetition',
    route: null,
    available: false,
  },
];

export default function LearnScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bgTertiary }}
      contentContainerStyle={styles.container}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Learning Hub</Text>
        <Text style={styles.heroSub}>Practice reading and writing Bodo</Text>
      </View>

      {/* Activities */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Activities</Text>

      {ACTIVITIES.map(activity => (
        <TouchableOpacity
          key={activity.id}
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
            !activity.available && styles.cardDisabled,
          ]}
          onPress={() => activity.available && activity.route && router.push(activity.route)}
          activeOpacity={activity.available ? 0.75 : 1}
        >
          <View style={[styles.iconBox, { backgroundColor: activity.available ? COLORS.primaryLight : theme.bgSecondary }]}>
            <Text style={styles.iconEmoji}>{activity.emoji}</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, { color: activity.available ? theme.text : theme.textTertiary }]}>
                {activity.title}
              </Text>
              {!activity.available && (
                <View style={[styles.soonBadge, { backgroundColor: theme.bgSecondary }]}>
                  <Text style={[styles.soonText, { color: theme.textTertiary }]}>Soon</Text>
                </View>
              )}
            </View>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
              {activity.description}
            </Text>
          </View>
          {activity.available && (
            <Text style={[styles.chevron, { color: theme.textTertiary }]}>›</Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  hero: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 24 },
  cardBody: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  soonBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  soonText: { fontSize: 11, fontWeight: '500' },
  chevron: { fontSize: 22, fontWeight: '300' },
});
