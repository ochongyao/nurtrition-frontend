import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { ACTIVITY_LEVELS, SEX_OPTIONS, buildWeeklyAudit } from '../data/mockFamily';

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

export default function InsightsView({ userProfile, onUpdateProfile, meals, weekly }) {
  const [ageText, setAgeText] = useState(String(userProfile.age));
  const [heightText, setHeightText] = useState(String(userProfile.heightCm));
  const [weightText, setWeightText] = useState(String(userProfile.weightKg));

  const commit = (patch) => onUpdateProfile({ ...userProfile, ...patch });
  const audit = buildWeeklyAudit(meals, userProfile);

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Week, Gently</Text>
        <Text style={styles.sectionSubtitle}>A soft check-in, never a judgment.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About You</Text>
        <View style={styles.inputRow}>
          <Field label="Age">
            <TextInput
              style={styles.input}
              value={ageText}
              onChangeText={(t) => {
                const clean = t.replace(/[^0-9]/g, '');
                setAgeText(clean);
                commit({ age: parseInt(clean, 10) || 0 });
              }}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={C.muted}
            />
          </Field>
          <Field label="Height (cm)">
            <TextInput
              style={styles.input}
              value={heightText}
              onChangeText={(t) => {
                const clean = t.replace(/[^0-9]/g, '');
                setHeightText(clean);
                commit({ heightCm: parseInt(clean, 10) || 0 });
              }}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={C.muted}
            />
          </Field>
          <Field label="Weight (kg)">
            <TextInput
              style={styles.input}
              value={weightText}
              onChangeText={(t) => {
                const clean = t.replace(/[^0-9]/g, '');
                setWeightText(clean);
                commit({ weightKg: parseInt(clean, 10) || 0 });
              }}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={C.muted}
            />
          </Field>
        </View>

        <Text style={styles.fieldLabel}>Sex</Text>
        <View style={styles.toggleRow}>
          {SEX_OPTIONS.map((opt) => {
            const active = userProfile.sex === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.toggle, active && styles.toggleActive]}
                onPress={() => commit({ sex: opt.key })}
                activeOpacity={0.85}
              >
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Activity</Text>
        <View style={styles.toggleRow}>
          {ACTIVITY_LEVELS.map((opt) => {
            const active = userProfile.activity === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.toggle, active && styles.toggleActive]}
                onPress={() => commit({ activity: opt.key })}
                activeOpacity={0.85}
              >
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.metricRow}>
          <Metric label="BMI" value={audit.bmi != null ? audit.bmi.toFixed(1) : '--'} />
          <Metric label="Daily kcal" value={audit.tdee != null ? String(audit.tdee) : '--'} />
          <Metric label="Meals" value={String(audit.count)} />
          <Metric label="Nourish" value={String(audit.avgHealth)} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Little Notes</Text>
        {weekly?.ai_family_narrative ? (
          <>
            <View style={styles.noteRow}>
              <Text style={styles.noteEmoji}>🌿</Text>
              <View style={styles.noteText}>
                <Text style={styles.noteTitle}>This week together</Text>
                <Text style={styles.noteDetail}>{weekly.ai_family_narrative}</Text>
              </View>
            </View>
            {!!weekly.recommended_grocery_swap && (
              <View style={styles.noteRow}>
                <Text style={styles.noteEmoji}>🥕</Text>
                <View style={styles.noteText}>
                  <Text style={styles.noteTitle}>A small swap</Text>
                  <Text style={styles.noteDetail}>{weekly.recommended_grocery_swap}</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          audit.points.map((point) => (
            <View key={point.title} style={styles.noteRow}>
              <Text style={styles.noteEmoji}>{point.status === 'PASS' ? '🌿' : '🍂'}</Text>
              <View style={styles.noteText}>
                <Text style={styles.noteTitle}>{point.title}</Text>
                <Text style={styles.noteDetail}>{point.detail}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Text style={styles.footnote}>Everything stays on your device.</Text>
    </View>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },

  sectionHeader: { marginTop: 8 },
  sectionTitle: { fontFamily: SERIF, fontSize: 24, color: C.text, letterSpacing: 0.2 },
  sectionSubtitle: { fontSize: 13, color: C.muted, marginTop: 6 },

  card: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    gap: 4,
  },
  cardTitle: { fontFamily: SERIF, fontSize: 18, color: C.text, marginBottom: 10 },

  inputRow: { flexDirection: 'row', gap: 10 },
  field: { flex: 1 },
  fieldLabel: { fontSize: 12, color: C.muted, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    backgroundColor: C.canvas,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
  },

  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  toggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    backgroundColor: C.canvas,
    paddingVertical: 11,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: C.matcha, borderColor: C.matcha },
  toggleText: { fontSize: 12, color: C.muted, fontWeight: '600' },
  toggleTextActive: { color: '#FFFFFF' },

  metricRow: { flexDirection: 'row', marginTop: 18, gap: 8 },
  metric: {
    flex: 1,
    backgroundColor: C.matchaLight,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
  },
  metricValue: { fontFamily: SERIF, fontSize: 18, color: C.matcha },
  metricLabel: { fontSize: 10, color: C.matcha, letterSpacing: 0.3 },

  noteRow: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  noteEmoji: { fontSize: 18, marginTop: 1 },
  noteText: { flex: 1 },
  noteTitle: { fontSize: 14, color: C.text, fontWeight: '700' },
  noteDetail: { fontSize: 13, color: C.muted, lineHeight: 19, marginTop: 3 },

  footnote: { textAlign: 'center', fontSize: 12, color: C.muted, paddingVertical: 4 },
});
