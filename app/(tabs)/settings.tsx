import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { clearHistory, getStats } from '../../src/utils/db';
import { COLORS, SPACING, RADIUS, useTheme } from '../../src/utils/theme';

type RowProps = {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
};

function Row({ icon, label, value, onPress, danger }: RowProps) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, { color: danger ? COLORS.primary : theme.text }]}>{label}</Text>
      {value && <Text style={[styles.rowValue, { color: theme.textSecondary }]}>{value}</Text>}
      {onPress && <Text style={[styles.chevron, { color: theme.textTertiary }]}>›</Text>}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getStats>> | null>(null);

  React.useEffect(() => {
    getStats().then(setStats);
  }, []);

  const handleClearHistory = () => {
    Alert.alert('Clear history', 'Remove all recently viewed words?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          Alert.alert('Done', 'History cleared.');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bgTertiary }}
      contentContainerStyle={styles.container}
    >
      {/* Database info */}
      <View style={[styles.infoCard, { backgroundColor: COLORS.primaryLight }]}>
        <Text style={[styles.infoIcon]}>📦</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, { color: COLORS.primaryText }]}>
            {stats ? `${stats.total.toLocaleString()} words stored offline` : 'Loading…'}
          </Text>
          <Text style={[styles.infoSub, { color: COLORS.primaryDark }]}>
            {stats
              ? `${stats.dictionary.toLocaleString()} dictionary · ${stats.glossary.toLocaleString()} glossary`
              : ''}
          </Text>
        </View>
      </View>

      <Section title="Data">
        <Row icon="📖" label="Source" value="bihung.org · CC BY-SA 4.0" />
        <Row icon="🏛️" label="Publisher" value="Bodo Sahitya Sabha" />
        <Row
          icon="🔗"
          label="Open on GitHub"
          onPress={() => Linking.openURL('https://github.com/bihungorg/bihung')}
        />
        <Row
          icon="🌐"
          label="Open bihung.org"
          onPress={() => Linking.openURL('https://bihung.org')}
        />
      </Section>

      <Section title="History">
        <Row icon="🗑️" label="Clear viewing history" onPress={handleClearHistory} danger />
      </Section>

      <Section title="About">
        <Row icon="ℹ️" label="App version" value="1.0.0" />
        <Row icon="📜" label="License" value="MIT (code) · CC BY-SA 4.0 (data)" />
        <Row icon="🗣️" label="Language" value="Bodo (ISO 639-3: brx)" />
      </Section>

      <Text style={[styles.footer, { color: theme.textTertiary }]}>
        Thunlai — open-source Bodo language app{'\n'}
        Data © Bodo Sahitya Sabha · bihung.org
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  infoIcon: { fontSize: 28 },
  infoTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  infoSub: { fontSize: 13 },
  section: { marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 0.5,
  },
  rowIcon: { fontSize: 18, marginRight: SPACING.md, width: 28 },
  rowLabel: { flex: 1, fontSize: 15 },
  rowValue: { fontSize: 13, marginLeft: SPACING.sm },
  chevron: { fontSize: 20, marginLeft: SPACING.xs },
  footer: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: SPACING.sm },
});
