import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { getMemberById } from '../data/mockFamily';
import { PLANT_COLOR_HEX } from '../api/adapters';
import MealDetailModal from './MealDetailModal';

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

const DISPLAY = {
  mom: { name: 'Mom', emoji: '👩‍🍳' },
  sis: { name: 'Sister', emoji: '🎓' },
  me: { name: 'You', emoji: '🎒' },
};

const KNOWN = ['mom', 'sis', 'me'];

const titleCase = (value) =>
  value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : '';

const present = (meal) => {
  const known = KNOWN.includes(meal.memberId) ? getMemberById(meal.memberId) : null;
  const person = DISPLAY[meal.memberId];
  const name = meal.authorName || person?.name || 'Family';
  const emoji = person?.emoji || '🍽️';
  const where = known ? known.location : titleCase(meal.authorRole);
  return { name, emoji, where };
};

export default function StreamView({ meals, onReact, onRefresh, onFetchAudit, refreshing = false }) {
  const [selectedMeal, setSelectedMeal] = useState(null);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.matcha}
              colors={[C.matcha]}
            />
          ) : undefined
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>The Kitchen Table</Text>
          <Text style={styles.subtitle}>What's on the table today?</Text>
        </View>

        {meals.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>The table is empty</Text>
            <Text style={styles.emptyText}>Share the first meal and it will show up here.</Text>
          </View>
        )}

        {meals.map((meal) => {
          const person = present(meal);
          const hasMacros = meal.calories != null || meal.protein_g != null;
          const reactedProud = meal.reactionEmojis?.includes('❤️');
          const reactedHydrate = meal.reactionEmojis?.includes('🍵');

          return (
            <TouchableOpacity
              key={meal.id}
              style={styles.card}
              activeOpacity={0.92}
              onPress={() => setSelectedMeal(meal)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarEmoji}>{person.emoji}</Text>
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>
                    {person.name}
                    {person.where ? ` · ${person.where}` : ''}
                  </Text>
                  <Text style={styles.headerMeta}>{meal.postedLabel}</Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeNum}>{meal.healthScore}</Text>
                  <Text style={styles.scoreBadgeDen}>/100</Text>
                </View>
              </View>

              <View style={styles.photo}>
                {meal.image ? (
                  <Image source={{ uri: meal.image }} style={styles.photoImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.photoEmoji}>{meal.placeholderEmoji || '🍽️'}</Text>
                )}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.dishNameRow}>
                  <Text style={styles.dishName}>{meal.dishName}</Text>
                </View>

                {hasMacros ? (
                  <Text style={styles.summary}>
                    {meal.calories} kcal · {meal.protein_g}g protein · {meal.fiber_g}g fiber ·{' '}
                    {meal.plants} plants
                  </Text>
                ) : (
                  <Text style={styles.summary}>
                    Nourishment score {meal.healthScore}/100 · {meal.plants || meal.plantColors?.length || 0} plant colors
                  </Text>
                )}

                {meal.plantColors?.length > 0 && (
                  <View style={styles.colorRow}>
                    {meal.plantColors.map((color) => (
                      <View key={color} style={styles.colorTag}>
                        <View
                          style={[styles.colorDot, { backgroundColor: PLANT_COLOR_HEX[color] || C.matcha }]}
                        />
                        <Text style={styles.colorText}>{String(color).replace('_', ' ')}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.feedback}>"{meal.feedback}"</Text>

                <View style={styles.reactionRow}>
                  <TouchableOpacity
                    style={[
                      styles.reaction,
                      styles.reactionProud,
                      reactedProud && styles.reactionProudActive,
                    ]}
                    onPress={() => onReact(meal.id, 'acknowledge')}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.reactionText, reactedProud && styles.reactionTextActive]}>
                      ❤️ Proud of you · {meal.reactions?.acknowledge ?? 0}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.reaction,
                      styles.reactionHydrate,
                      reactedHydrate && styles.reactionHydrateActive,
                    ]}
                    onPress={() => onReact(meal.id, 'nurture')}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.reactionText, reactedHydrate && styles.reactionTextActive]}>
                      🍵 Stay hydrated · {meal.reactions?.nurture ?? 0}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inspectHint}>Tap card to view plate audit breakdown 🔍</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {meals.length > 0 && <Text style={styles.footer}>That's everything for now.</Text>}
      </ScrollView>

      <MealDetailModal
        visible={Boolean(selectedMeal)}
        meal={selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onReact={onReact}
        onFetchAudit={onFetchAudit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: C.canvas, gap: 16 },

  header: { marginBottom: 4 },
  title: { fontFamily: SERIF, fontSize: 28, color: C.text, letterSpacing: 0.2 },
  subtitle: { fontSize: 14, color: C.muted, marginTop: 4, lineHeight: 20 },

  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: C.matchaLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 15, color: C.text, fontWeight: '700' },
  headerMeta: { fontSize: 12, color: C.muted, marginTop: 2 },

  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: C.matchaLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scoreBadgeNum: { fontFamily: SERIF, fontSize: 16, color: C.matcha, fontWeight: '700' },
  scoreBadgeDen: { fontSize: 11, color: C.matcha },

  photo: {
    height: 180,
    borderRadius: 20,
    backgroundColor: C.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  photoImage: { width: '100%', height: '100%' },
  photoEmoji: { fontSize: 64 },

  cardBody: { gap: 8 },
  dishNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dishName: { fontFamily: SERIF, fontSize: 20, color: C.text, letterSpacing: 0.2 },
  summary: { fontSize: 13, color: C.muted, lineHeight: 19 },
  feedback: { fontSize: 13, color: C.text, lineHeight: 20, fontStyle: 'italic' },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.canvas,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  colorDot: { width: 9, height: 9, borderRadius: 999 },
  colorText: { fontSize: 11, color: C.text, fontWeight: '600', textTransform: 'capitalize' },

  reactionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  reaction: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: 'transparent' },
  reactionProud: { backgroundColor: C.terracottaLight },
  reactionProudActive: { borderColor: C.terracotta, backgroundColor: '#F4D4C7' },
  reactionHydrate: { backgroundColor: C.matchaLight },
  reactionHydrateActive: { borderColor: C.matcha, backgroundColor: '#D6E5D8' },
  reactionText: { fontSize: 13, color: C.text, fontWeight: '600' },
  reactionTextActive: { fontWeight: '700' },

  inspectHint: { fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 2 },

  empty: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 28,
  },
  emptyTitle: { fontFamily: SERIF, fontSize: 18, color: C.text },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },

  footer: { textAlign: 'center', fontSize: 13, color: C.muted, paddingVertical: 8 },
});
