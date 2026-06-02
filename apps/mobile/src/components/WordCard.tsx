import React, { memo, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { COLORS, SPACING, RADIUS, useTheme } from "../utils/theme";
import type { Word } from "../utils/db";

type Props = {
  word: Word;
  isFavourite?: boolean;
  onPress?: (word: Word) => void;
  onFavouriteToggle?: (wordId: number) => void;
  showSource?: boolean;
  reverse?: boolean;
};

const WordCard = memo(
  ({
    word,
    isFavourite,
    onPress,
    onFavouriteToggle,
    showSource = false,
    reverse = false,
  }: Props) => {
    const { theme } = useTheme();

    const handleFav = useCallback(
      (e: any) => {
        e.stopPropagation?.();
        onFavouriteToggle?.(word.id);
      },
      [word.id, onFavouriteToggle],
    );

    const sourceStyle =
      word.source === "dictionary" ? COLORS.dictionary : COLORS.glossary;
    const sourceLabel =
      word.source === "dictionary" ? "Dictionary" : "Glossary";

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
        onPress={() => onPress?.(word)}
        activeOpacity={0.75}
      >
        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.wordInfo}>
            <Text style={[styles.bodo, { color: theme.text }]}>
              {reverse ? word.english : word.bodo}
            </Text>
            {!reverse && word.roman ? (
              <Text style={[styles.roman, { color: COLORS.primaryDark }]}>
                /{word.roman}/
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={handleFav}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.favBtn}
          >
            <Text style={{ fontSize: 20 }}>{isFavourite ? "★" : "☆"}</Text>
          </TouchableOpacity>
        </View>

        {/* Translation */}
        <Text
          style={[styles.english, { color: theme.textSecondary }]}
          numberOfLines={3}
        >
          {reverse ? word.bodo : word.english}
        </Text>
        {reverse && word.roman ? (
          <Text style={[styles.roman, { color: COLORS.primaryDark, marginTop: 2 }]}>
            /{word.roman}/
          </Text>
        ) : null}

        {/* Source badge */}
        {/* {showSource && (
        <View style={[styles.badge, { backgroundColor: sourceStyle.bg }]}>
          <Text style={[styles.badgeText, { color: sourceStyle.text }]}>
            {sourceLabel}
          </Text>
        </View>
      )} */}
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  wordInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  bodo: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 26,
  },
  roman: {
    fontSize: 13,
    marginTop: 2,
    fontStyle: "italic",
  },
  english: {
    fontSize: 14,
    lineHeight: 20,
  },
  favBtn: {
    marginTop: 2,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
});

export default WordCard;
