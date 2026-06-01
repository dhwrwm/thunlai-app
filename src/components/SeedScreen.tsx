import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING } from '../utils/theme';

type Props = {
  progress: number;
  message: string;
};

export default function SeedScreen({ progress, message }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Thunlai</Text>
      <Text style={styles.subtitle}>Bodo ↔ English Dictionary</Text>
      <Text style={styles.hint}>Setting up offline database…</Text>

      <View style={styles.barBg}>
        <Animated.View style={[styles.barFill, { width }]} />
      </View>

      <Text style={styles.msg}>{message}</Text>
      <Text style={styles.pct}>{Math.round(progress)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  logo: {
    fontSize: 64,
    color: '#fff',
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: SPACING.xxl * 2,
  },
  hint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: SPACING.lg,
  },
  barBg: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  msg: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.xs,
  },
  pct: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
});
