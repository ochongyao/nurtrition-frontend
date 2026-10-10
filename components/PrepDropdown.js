import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

const C = {
  card: '#FFFFFF',
  border: '#EFEAE2',
  text: '#2B2826',
  muted: '#756D65',
  matcha: '#4F7059',
  matchaLight: '#E8EFE9',
};

export const PREP_CONTEXTS = [
  { key: 'home_cooked', label: 'Home-Cooked Meal' },
  { key: 'dining_hall', label: 'Campus Dining Hall' },
  { key: 'takeout', label: 'Restaurant / Takeout' },
  { key: 'packaged', label: 'Packaged / Ready-to-Eat' },
];

export default function PrepDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = PREP_CONTEXTS.find((c) => c.key === value) || PREP_CONTEXTS[0];

  return (
    <View style={styles.dropdownWrap}>
      <TouchableOpacity
        style={styles.dropdownBtn}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.85}
      >
        <View style={styles.dropdownBtnLeft}>
          <Text style={styles.dropdownLabel}>Context: </Text>
          <Text style={styles.dropdownValue}>{current.label}</Text>
        </View>
        <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownMenu}>
          {PREP_CONTEXTS.map((ctx) => {
            const active = value === ctx.key;
            return (
              <TouchableOpacity
                key={ctx.key}
                style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                onPress={() => {
                  onChange(ctx.key);
                  setOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>
                  {ctx.label}
                </Text>
                {active && <Text style={styles.dropdownCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownWrap: { position: 'relative', zIndex: 10 },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownBtnLeft: { flexDirection: 'row', alignItems: 'center' },
  dropdownLabel: { fontSize: 13, color: C.muted },
  dropdownValue: { fontSize: 13, color: C.text, fontWeight: '700' },
  dropdownArrow: { fontSize: 11, color: C.muted, marginLeft: 8 },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F3EC',
  },
  dropdownItemActive: { backgroundColor: C.matchaLight },
  dropdownItemText: { fontSize: 13, color: C.text },
  dropdownItemTextActive: { color: C.matcha, fontWeight: '700' },
  dropdownCheck: { fontSize: 13, color: C.matcha, fontWeight: '700' },
});
