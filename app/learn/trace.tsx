import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
} from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { COLORS, SPACING, RADIUS, useTheme } from '../../src/utils/theme';

const BODO_ALPHABET = [
  'अ','आ','इ','ई','उ','ऊ','ए','ओ',
  'क','ख','ग','घ','च','ज','ट','ड',
  'थ','द','ध','न','फ','ब','भ','म',
  'र','ल','स','ह',
];

type Point = { x: number; y: number };
type Stroke = Point[];

const CANVAS_SIZE = 280;

function buildPath(stroke: Stroke): string {
  if (stroke.length === 0) return '';
  if (stroke.length === 1) {
    const { x, y } = stroke[0];
    return `M ${x} ${y} L ${x + 0.1} ${y}`;
  }
  const [first, ...rest] = stroke;
  return `M ${first.x} ${first.y} ` + rest.map(p => `L ${p.x} ${p.y}`).join(' ');
}

export default function TraceScreen() {
  const { theme } = useTheme();
  const [letter, setLetter] = useState(BODO_ALPHABET[0]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const strokesRef = useRef<Stroke[]>([]);
  const activeIdx = useRef(-1);

  const updateStrokes = (fn: (prev: Stroke[]) => Stroke[]) => {
    setStrokes(prev => {
      const next = fn(prev);
      strokesRef.current = next;
      return next;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        updateStrokes(prev => {
          activeIdx.current = prev.length;
          return [...prev, [{ x: locationX, y: locationY }]];
        });
      },

      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        updateStrokes(prev => {
          const idx = activeIdx.current;
          if (idx < 0 || idx >= prev.length) return prev;
          const next = [...prev];
          next[idx] = [...next[idx], { x: locationX, y: locationY }];
          return next;
        });
      },

      onPanResponderRelease: () => {
        activeIdx.current = -1;
      },
    })
  ).current;

  const selectLetter = (l: string) => {
    setLetter(l);
    setStrokes([]);
    strokesRef.current = [];
    activeIdx.current = -1;
  };

  const clear = () => {
    setStrokes([]);
    strokesRef.current = [];
    activeIdx.current = -1;
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bgTertiary }]}>
      {/* Letter picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.pickerBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        contentContainerStyle={styles.pickerRow}
      >
        {BODO_ALPHABET.map(l => (
          <TouchableOpacity
            key={l}
            style={[styles.pickerBtn, l === letter && styles.pickerBtnActive]}
            onPress={() => selectLetter(l)}
          >
            <Text style={[styles.pickerBtnText, { color: l === letter ? '#fff' : COLORS.primary }]}>
              {l}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.body}>
        <Text style={[styles.hint, { color: theme.textTertiary }]}>
          Trace the letter with your finger
        </Text>

        {/* Canvas */}
        <View
          style={[styles.canvas, { backgroundColor: theme.card, borderColor: theme.border }]}
          {...panResponder.panHandlers}
        >
          <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={StyleSheet.absoluteFill}>
            <SvgText
              x={CANVAS_SIZE / 2}
              y={CANVAS_SIZE * 0.75}
              textAnchor="middle"
              fontSize={180}
              fill={COLORS.primaryLight}
            >
              {letter}
            </SvgText>
            {strokes.map((stroke, i) => (
              <Path
                key={i}
                d={buildPath(stroke)}
                stroke={COLORS.primary}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </Svg>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Text style={[styles.strokeCount, { color: theme.textSecondary }]}>
            {strokes.length} stroke{strokes.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            style={[styles.clearBtn, {
              borderColor: strokes.length === 0 ? theme.border : COLORS.primary,
            }]}
            onPress={clear}
            disabled={strokes.length === 0}
          >
            <Text style={[styles.clearBtnText, {
              color: strokes.length === 0 ? theme.textTertiary : COLORS.primary,
            }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pickerBar: { borderBottomWidth: 0.5, flexGrow: 0 },
  pickerRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  pickerBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerBtnActive: { backgroundColor: COLORS.primary },
  pickerBtnText: { fontSize: 18, lineHeight: 26 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  hint: { fontSize: 13, marginBottom: SPACING.lg },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: CANVAS_SIZE,
    marginTop: SPACING.md,
  },
  strokeCount: { fontSize: 13 },
  clearBtn: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  clearBtnText: { fontSize: 14, fontWeight: '500' },
});
