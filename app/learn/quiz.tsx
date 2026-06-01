import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, RADIUS, useTheme } from '../../src/utils/theme';
import { getRandomWords, Word } from '../../src/utils/db';

const QUESTION_COUNT = 10;
const CHOICES = 4;

type Question = {
  word: Word;
  options: string[];
  correctIndex: number;
};

function buildQuestions(pool: Word[]): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < Math.min(QUESTION_COUNT, pool.length); i++) {
    const word = pool[i];
    const distractors = pool
      .filter((_, j) => j !== i)
      .sort(() => Math.random() - 0.5)
      .slice(0, CHOICES - 1)
      .map(w => w.english);
    const options = [...distractors, word.english].sort(() => Math.random() - 0.5);
    questions.push({ word, options, correctIndex: options.indexOf(word.english) });
  }
  return questions;
}

export default function QuizScreen() {
  const { theme } = useTheme();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pool = await getRandomWords(40);
      if (pool.length < CHOICES + 1) throw new Error('Not enough words in the database');
      setQuestions(buildQuestions(pool));
      setCurrent(0);
      setSelected(null);
      setCorrect(0);
      setDone(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const answer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[current].correctIndex) setCorrect(c => c + 1);
  };

  const next = () => {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bgTertiary }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bgTertiary }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>{error}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={load}>
          <Text style={styles.primaryBtnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (done) {
    const pct = Math.round((correct / questions.length) * 100);
    const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚';
    const message = pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good effort!' : 'Keep practising!';
    return (
      <View style={[styles.center, { backgroundColor: theme.bgTertiary }]}>
        <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.resultEmoji}>{emoji}</Text>
          <Text style={[styles.resultTitle, { color: theme.text }]}>
            {correct} / {questions.length}
          </Text>
          <Text style={[styles.resultSub, { color: theme.textSecondary }]}>{message}</Text>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: SPACING.lg }]} onPress={load}>
            <Text style={styles.primaryBtnText}>Play again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const q = questions[current];
  const progress = (current + 1) / questions.length;

  return (
    <View style={[styles.root, { backgroundColor: theme.bgTertiary }]}>
      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>
      <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
        {current + 1} / {questions.length}
      </Text>

      {/* Question */}
      <View style={styles.questionArea}>
        <Text style={[styles.prompt, { color: theme.textSecondary }]}>What does this mean?</Text>
        <Text style={[styles.bodoWord, { color: theme.text }]}>{q.word.bodo}</Text>
        {q.word.roman ? (
          <Text style={[styles.romanWord, { color: theme.textSecondary }]}>{q.word.roman}</Text>
        ) : null}
      </View>

      {/* Options */}
      <View style={styles.options}>
        {q.options.map((opt, i) => {
          let bg = theme.card;
          let borderColor = theme.border;
          let textColor = theme.text;
          if (selected !== null) {
            if (i === q.correctIndex) {
              bg = COLORS.primaryLight;
              borderColor = COLORS.primary;
              textColor = COLORS.primaryDark;
            } else if (i === selected) {
              bg = '#FECDD3';
              borderColor = '#DC2626';
              textColor = '#991B1B';
            }
          }
          return (
            <TouchableOpacity
              key={i}
              style={[styles.option, { backgroundColor: bg, borderColor }]}
              onPress={() => answer(i)}
              activeOpacity={selected !== null ? 1 : 0.7}
            >
              <Text style={[styles.optionText, { color: textColor }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selected !== null && (
        <TouchableOpacity style={styles.nextBtn} onPress={next}>
          <Text style={styles.nextBtnText}>
            {current + 1 >= questions.length ? 'See results' : 'Next →'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  progressTrack: { height: 4, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: COLORS.primary },
  progressLabel: { fontSize: 12, marginTop: SPACING.sm, textAlign: 'right' },
  questionArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  prompt: { fontSize: 14, marginBottom: SPACING.sm },
  bodoWord: { fontSize: 48, fontWeight: '700', lineHeight: 68, textAlign: 'center' },
  romanWord: { fontSize: 18, marginTop: SPACING.xs, textAlign: 'center' },
  options: { gap: SPACING.sm, marginBottom: SPACING.md },
  option: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  optionText: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
  nextBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  resultEmoji: { fontSize: 48, marginBottom: SPACING.md },
  resultTitle: { fontSize: 32, fontWeight: '700', marginBottom: SPACING.xs },
  resultSub: { fontSize: 15, textAlign: 'center' },
  errorText: { fontSize: 15, textAlign: 'center', marginBottom: SPACING.lg },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
