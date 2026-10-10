import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { PLANT_COLOR_HEX, UPF_TIER_LABELS } from '../api/adapters';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const C = {
  canvas: '#FAF7F2',
  card: '#FFFFFF',
  border: '#EFEAE2',
  text: '#2B2826',
  muted: '#756D65',
  matcha: '#4F7059',
  terracotta: '#B25A3E',
  matchaLight: '#E8EFE9',
  terracottaLight: '#F6E5DE',
};

export default function MealDetailModal({ visible, meal, onClose, onReact, onFetchAudit }) {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && meal) {
      setAudit(null);
      if (onFetchAudit) {
        setLoading(true);
        onFetchAudit(meal.id)
          .then((res) => {
            if (res) setAudit(res);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }
  }, [visible, meal, onFetchAudit]);

  if (!meal) return null;

  const displayMeal = audit || meal;
  const ingredients = displayMeal.detected_ingredients || displayMeal.detectedIngredients || [];
  const plantColors = displayMeal.plant_colors || displayMeal.plantColors || [];
  const upfTier = displayMeal.upf_tier || displayMeal.upfTier || 'unprocessed';
  const score = displayMeal.normalized_score ?? displayMeal.healthScore ?? 50;

  // Audit points breakdown if present
  const scores = displayMeal.scores || {
    plant_points: displayMeal.plant_score,
    whole_food_points: displayMeal.whole_food_score,
    protein_points: displayMeal.protein_score,
    upf_penalty: displayMeal.penalty_score,
    raw_total: displayMeal.raw_score,
  };
  const hasScores = scores.plant_points != null || scores.whole_food_points != null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.topBar}>
            <View style={styles.handle} />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12} activeOpacity={0.7}>
              <Text style={styles.closeText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.photoContainer}>
              {displayMeal.image || displayMeal.image_url ? (
                <Image
                  source={{ uri: displayMeal.image || displayMeal.image_url }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.placeholderEmoji}>{displayMeal.placeholderEmoji || '🍽️'}</Text>
                  <Text style={styles.placeholderText}>{displayMeal.dishName}</Text>
                </View>
              )}
            </View>

            <View style={styles.titleWrap}>
              <Text style={styles.dishName}>{displayMeal.dishName || displayMeal.meal_name}</Text>
              <Text style={styles.authorMeta}>
                {displayMeal.authorName || 'Family member'}
                {displayMeal.postedLabel ? ` · ${displayMeal.postedLabel}` : ''}
              </Text>
            </View>

            <View style={styles.scoreWrap}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNum}>{score}</Text>
                <Text style={styles.scoreDen}>/100</Text>
              </View>
              <Text style={styles.scoreLabel}>Nourishment Score</Text>
            </View>

            {!!(displayMeal.feedback || displayMeal.reassurance_note) && (
              <View style={styles.noteCard}>
                <Text style={styles.noteText}>
                  "{displayMeal.feedback || displayMeal.reassurance_note}"
                </Text>
              </View>
            )}

            {hasScores && (
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>Nutritional Audit Breakdown</Text>
                <View style={styles.breakdownGrid}>
                  <ScoreItem label="Plant Points" value={`+${scores.plant_points || 0}`} positive />
                  <ScoreItem label="Whole Foods" value={`+${scores.whole_food_points || 0}`} positive />
                  <ScoreItem label="Protein Points" value={`+${scores.protein_points || 0}`} positive />
                  <ScoreItem label="UPF Deduction" value={`-${scores.upf_penalty || 0}`} negative={Boolean(scores.upf_penalty)} />
                </View>
                {scores.raw_total != null && (
                  <Text style={styles.rawTotalText}>
                    Raw plate total: {scores.raw_total} pts · Balanced for age & activity to {score}/100
                  </Text>
                )}
              </View>
            )}

            <View style={styles.tagsSection}>
              <Text style={styles.sectionLabel}>Processing Level</Text>
              <View style={styles.tierPill}>
                <Text style={styles.tierText}>
                  {UPF_TIER_LABELS[upfTier] || String(upfTier).replace('_', ' ')}
                </Text>
              </View>
            </View>

            {plantColors.length > 0 && (
              <View style={styles.tagsSection}>
                <Text style={styles.sectionLabel}>Botanical Plant Colors</Text>
                <View style={styles.colorRow}>
                  {plantColors.map((color) => (
                    <View key={color} style={styles.colorPill}>
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: PLANT_COLOR_HEX[color] || C.matcha },
                        ]}
                      />
                      <Text style={styles.colorText}>{String(color).replace('_', ' ')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {ingredients.length > 0 && (
              <View style={styles.tagsSection}>
                <Text style={styles.sectionLabel}>Foods on the Plate</Text>
                <View style={styles.ingredientRow}>
                  {ingredients.map((ing, i) => (
                    <View key={`${ing}-${i}`} style={styles.ingredientPill}>
                      <Text style={styles.ingredientText}>{ing}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {onReact && (
              <View style={styles.reactionSection}>
                <Text style={styles.sectionLabel}>Care Reactions</Text>
                <View style={styles.reactionRow}>
                  <TouchableOpacity
                    style={[styles.reactionBtn, styles.reactionProud]}
                    onPress={() => onReact(displayMeal.id, 'acknowledge')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.reactionBtnText}>
                      ❤️ Proud of you · {displayMeal.reactions?.acknowledge ?? 0}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reactionBtn, styles.reactionHydrate]}
                    onPress={() => onReact(displayMeal.id, 'nurture')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.reactionBtnText}>
                      🍵 Stay hydrated · {displayMeal.reactions?.nurture ?? 0}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={C.matcha} />
                <Text style={styles.loadingText}>Loading full audit breakdown…</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ScoreItem({ label, value, positive, negative }) {
  return (
    <View style={styles.scoreItem}>
      <Text
        style={[
          styles.scoreItemValue,
          positive && styles.scoreItemPos,
          negative && styles.scoreItemNeg,
        ]}
      >
        {value}
      </Text>
      <Text style={styles.scoreItemLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 40, 38, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#DDD6CC',
    alignSelf: 'center',
    marginLeft: 32,
  },
  closeBtn: { paddingVertical: 4 },
  closeText: { fontSize: 14, color: C.matcha, fontWeight: '700' },

  body: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },

  photoContainer: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.border,
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderEmoji: { fontSize: 50 },
  placeholderText: { fontSize: 13, color: C.muted },

  titleWrap: { gap: 4 },
  dishName: { fontFamily: SERIF, fontSize: 24, color: C.text, letterSpacing: 0.2 },
  authorMeta: { fontSize: 13, color: C.muted },

  scoreWrap: { alignItems: 'center', gap: 8, marginTop: 4 },
  scoreCircle: {
    width: 104,
    height: 104,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: C.matcha,
    backgroundColor: C.matchaLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scoreNum: { fontFamily: SERIF, fontSize: 36, color: C.matcha },
  scoreDen: { fontSize: 13, color: C.matcha, marginLeft: 2, marginBottom: 6 },
  scoreLabel: { fontSize: 13, color: C.muted },

  noteCard: {
    backgroundColor: C.canvas,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  noteText: { fontSize: 13, color: C.text, fontStyle: 'italic', lineHeight: 20, textAlign: 'center' },

  breakdownCard: {
    backgroundColor: C.canvas,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  breakdownTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  breakdownGrid: { flexDirection: 'row', gap: 8 },
  scoreItem: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    gap: 2,
  },
  scoreItemValue: { fontSize: 15, fontWeight: '700', color: C.text },
  scoreItemPos: { color: C.matcha },
  scoreItemNeg: { color: C.terracotta },
  scoreItemLabel: { fontSize: 10, color: C.muted, textAlign: 'center' },
  rawTotalText: { fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 16 },

  tagsSection: { gap: 6 },
  sectionLabel: { fontSize: 12, color: C.muted, fontWeight: '600' },

  tierPill: {
    alignSelf: 'flex-start',
    backgroundColor: C.matchaLight,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tierText: { fontSize: 12, color: C.matcha, fontWeight: '700' },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  colorDot: { width: 9, height: 9, borderRadius: 999 },
  colorText: { fontSize: 12, color: C.text, fontWeight: '600', textTransform: 'capitalize' },

  ingredientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingredientPill: {
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ingredientText: { fontSize: 12, color: C.text, textTransform: 'capitalize' },

  reactionSection: { gap: 8, marginTop: 4 },
  reactionRow: { flexDirection: 'row', gap: 10 },
  reactionBtn: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  reactionProud: { backgroundColor: C.terracottaLight },
  reactionHydrate: { backgroundColor: C.matchaLight },
  reactionBtnText: { fontSize: 13, color: C.text, fontWeight: '600' },

  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 12, color: C.muted },
});
