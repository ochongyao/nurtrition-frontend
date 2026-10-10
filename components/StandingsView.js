import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
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

function formatDateRange(start, end) {
  if (!start || !end) return 'This Week';
  try {
    const s = new Date(start);
    const e = new Date(end);
    const sStr = s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const eStr = e.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${sStr} – ${eStr}`;
  } catch {
    return 'This Week';
  }
}

export default function StandingsView({
  standings,
  meals,
  weekly,
  userProfile,
  subscription,
  onOpenCheckout,
  onUpdateProfile,
  onRefresh,
  refreshing = false,
}) {
  const rows = standings || [];
  const collectivePlants = weekly?.collective_plant_count ?? rows.reduce((sum, row) => sum + (row.greens || 0), 0);
  const totalMeals = weekly?.leaderboard_payload?.total_meals ?? rows.reduce((sum, row) => sum + (row.mealsLogged || 0), 0);
  const harmony = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + (row.index || 0), 0) / rows.length)
    : 0;

  const dateRangeLabel = formatDateRange(weekly?.week_start, weekly?.week_end);

  return (
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
        <View style={styles.headerTop}>
          <Text style={styles.title}>Family Rhythm</Text>
          <View style={styles.dateTag}>
            <Text style={styles.dateText}>{dateRangeLabel}</Text>
          </View>
        </View>
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
        <View style={styles.statsRow}>
          <Text style={styles.gardenFootnote}>
            🌿 {collectivePlants} botanical plant colors reached
          </Text>
          <Text style={styles.gardenFootnote}>
            🍲 {totalMeals} plates shared
          </Text>
        </View>
      </View>

      {!!weekly?.ai_family_narrative && (
        <View style={styles.narrativeCard}>
          <Text style={styles.narrativeTitle}>This Week's Table Story</Text>
          <Text style={styles.narrativeBody}>"{weekly.ai_family_narrative}"</Text>
        </View>
      )}

      {!!weekly?.recommended_grocery_swap && (
        <View style={styles.swapCard}>
          <Text style={styles.swapTitle}>🥕 Gentle Grocery Swap</Text>
          <Text style={styles.swapBody}>{weekly.recommended_grocery_swap}</Text>
        </View>
      )}

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
                  {row.mealsLogged} meals shared · {row.greens || 0} plant variety
                </Text>
                {!!row.highlight && <Text style={styles.memberHighlight}>Top: {row.highlight}</Text>}
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

      {onOpenCheckout ? (
        <TouchableOpacity
          style={[styles.proCard, subscription?.isSubscriber && styles.proCardSubscribed]}
          onPress={onOpenCheckout}
          activeOpacity={0.88}
        >
          <View style={styles.proCardLeft}>
            <Text style={[styles.proCardTitle, subscription?.isSubscriber && styles.proCardTitleSubscribed]}>
              {subscription?.isSubscriber ? '⭐ Nurtrition Circle Pro' : '🌱 Nurtrition Circle Pass'}
            </Text>
            <Text style={styles.proCardSub}>
              {subscription?.isSubscriber
                ? 'Unlimited vision audits & family rhythm digests active.'
                : 'Unlock unlimited plate audits, family digests & grocery swaps.'}
            </Text>
          </View>
          <View style={[styles.proCardBtn, subscription?.isSubscriber && styles.proCardBtnSubscribed]}>
            <Text style={[styles.proCardBtnText, subscription?.isSubscriber && styles.proCardBtnTextSubscribed]}>
              {subscription?.isSubscriber ? 'Manage' : 'Upgrade'}
            </Text>
          </View>
        </TouchableOpacity>
      ) : null}

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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: SERIF, fontSize: 28, color: C.text, letterSpacing: 0.2 },
  dateTag: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dateText: { fontSize: 12, color: C.muted, fontWeight: '600' },
  subtitle: { fontSize: 14, color: C.muted, marginTop: 4, lineHeight: 20 },

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
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  gardenFootnote: { fontSize: 12, color: C.matcha, fontWeight: '600' },

  narrativeCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 6,
  },
  narrativeTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  narrativeBody: { fontSize: 13, color: C.muted, lineHeight: 20, fontStyle: 'italic' },

  swapCard: {
    backgroundColor: '#FBF5EE',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE2D4',
    padding: 16,
    gap: 6,
  },
  swapTitle: { fontSize: 13, fontWeight: '700', color: C.terracotta },
  swapBody: { fontSize: 13, color: C.text, lineHeight: 19 },

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

  proCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C2DBC6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  proCardSubscribed: {
    borderColor: '#E6D78C',
    backgroundColor: '#FFFDF5',
  },
  proCardLeft: { flex: 1 },
  proCardTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: C.matcha },
  proCardTitleSubscribed: { color: '#8B6508' },
  proCardSub: { fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 17 },
  proCardBtn: {
    backgroundColor: C.matcha,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  proCardBtnSubscribed: { backgroundColor: '#8B6508' },
  proCardBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  proCardBtnTextSubscribed: { color: '#FFFFFF' },
});
