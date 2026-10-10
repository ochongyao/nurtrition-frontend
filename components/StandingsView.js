import React from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import { WEEKLY_QUOTA } from '../data/mockFamily';
import InsightsView from './InsightsView';

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

export default function StandingsView({ standings, meals, weekly, userProfile, onUpdateProfile }) {
  const rows = standings || [];
  const totalGreens = rows.reduce((sum, row) => sum + (row.greens || 0), 0);
  const harmony = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + (row.index || 0), 0) / rows.length)
    : 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Family Rhythm</Text>
        <Text style={styles.subtitle}>How everyone has been eating, side by side.</Text>
      </View>

      <View style={styles.gardenCard}>
        <Text style={styles.gardenLabel}>Family Harmony</Text>
        <Text style={styles.gardenValue}>{harmony}%</Text>
        <Text style={styles.gardenText}>
          of meals this week were wholesome & home-cooked 🌱
        </Text>
        <View style={styles.gaugeTrack}>
          <View style={[styles.gaugeFill, { width: `${Math.min(100, harmony)}%` }]} />
        </View>
        <Text style={styles.gardenFootnote}>
          {totalGreens} of {WEEKLY_QUOTA.goal} green meals shared together
        </Text>
      </View>

      <View style={styles.memberList}>
        {rows.map((row) => {
          const person = DISPLAY[row.id];
          const name = row.name || person?.name || 'Family';
          const initial = name.charAt(0).toUpperCase();
          return (
            <View key={row.id} style={styles.memberCard}>
              <View style={styles.avatar}>
                {person?.emoji ? (
                  <Text style={styles.avatarEmoji}>{person.emoji}</Text>
                ) : (
                  <Text style={styles.avatarInitial}>{initial}</Text>
                )}
              </View>
              <View style={styles.memberText}>
                <Text style={styles.memberName}>{name}</Text>
                <Text style={styles.memberStreak}>
                  {row.mealsLogged} meals shared · {row.greens || 0} with greens
                </Text>
                {!!row.highlight && <Text style={styles.memberHighlight}>{row.highlight}</Text>}
              </View>
              <View style={styles.indexTag}>
                <Text style={styles.indexValue}>{Math.round(row.index || 0)}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.reminder}>
        Scores are gently balanced for everyone's routine.
      </Text>

      <InsightsView
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        meals={meals}
        weekly={weekly}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: C.canvas, gap: 16 },

  header: { marginBottom: 4 },
  title: { fontFamily: SERIF, fontSize: 28, color: C.text, letterSpacing: 0.2 },
  subtitle: { fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 20 },

  gardenCard: {
    backgroundColor: C.matchaLight,
    borderRadius: 24,
    padding: 22,
    gap: 6,
  },
  gardenLabel: { fontSize: 13, color: C.matcha, fontWeight: '700', letterSpacing: 0.3 },
  gardenValue: { fontFamily: SERIF, fontSize: 44, color: C.matcha, marginTop: 2 },
  gardenText: { fontSize: 14, color: C.matcha, lineHeight: 20 },
  gaugeTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    marginTop: 14,
    overflow: 'hidden',
  },
  gaugeFill: { height: '100%', borderRadius: 999, backgroundColor: C.matcha },
  gardenFootnote: { fontSize: 12, color: C.matcha, marginTop: 10 },

  memberList: { gap: 12 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: C.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  avatarInitial: { fontFamily: SERIF, fontSize: 20, color: C.matcha },
  memberText: { flex: 1 },
  memberName: { fontSize: 16, color: C.text, fontWeight: '700' },
  memberStreak: { fontSize: 13, color: C.muted, marginTop: 3 },
  memberHighlight: { fontSize: 12, color: C.muted, marginTop: 3, fontStyle: 'italic' },
  indexTag: {
    minWidth: 48,
    borderRadius: 999,
    backgroundColor: C.matchaLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  indexValue: { fontFamily: SERIF, fontSize: 18, color: C.matcha },

  reminder: {
    textAlign: 'center',
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
});
