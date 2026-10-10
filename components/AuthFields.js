import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

const C = {
  card: '#FFFFFF',
  border: '#EFEAE2',
  muted: '#756D65',
  matcha: '#4F7059',
};

export const ROLES = [
  { key: 'student', label: 'Student' },
  { key: 'parent', label: 'Parent' },
  { key: 'member', label: 'Member' },
];

export const SEXES = [
  { key: 'female', label: 'Female' },
  { key: 'male', label: 'Male' },
  { key: 'other', label: 'Other' },
];

export const ACTIVITIES = [
  { key: 'sedentary', label: 'Sedentary' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'active', label: 'Active' },
  { key: 'athlete', label: 'Athlete' },
];

export const DIETARY_OPTIONS = [
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'halal', label: 'Halal' },
  { key: 'gluten_free', label: 'Gluten-Free' },
  { key: 'dairy_free', label: 'Dairy-Free' },
];

export function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function Choice({ options, value, onChange, row }) {
  return (
    <View style={[styles.choiceWrap, row && styles.choiceRow]}>
      {options.map((option) => {
        const active = value === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.choice, active && styles.choiceActive]}
            onPress={() => onChange(option.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1 },
  fieldLabel: { fontSize: 12, color: C.muted, marginBottom: 6, marginTop: 2 },
  choiceWrap: { gap: 8 },
  choiceRow: { flexDirection: 'row' },
  choice: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    backgroundColor: C.card,
    paddingVertical: 11,
    alignItems: 'center',
  },
  choiceActive: { backgroundColor: C.matcha, borderColor: C.matcha },
  choiceText: { fontSize: 12, color: C.muted, fontWeight: '600' },
  choiceTextActive: { color: '#FFFFFF' },
});
