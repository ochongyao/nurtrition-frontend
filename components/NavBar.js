import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

const C = {
  canvas: '#FAF7F2',
  card: '#FFFFFF',
  border: '#EFEAE2',
  text: '#2B2826',
  muted: '#756D65',
  matcha: '#4F7059',
  terracotta: '#B25A3E',
  matchaLight: '#E8EFE9',
};

const TABS = [
  { key: 'table', emoji: '🍲', label: 'Table' },
  { key: 'share', emoji: '📸', label: 'Share Meal' },
  { key: 'rhythm', emoji: '🌿', label: 'Rhythm' },
];

export default function NavBar({ activeTab, onChange }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => onChange(tab.key)}
              activeOpacity={0.85}
            >
              <Text style={styles.emoji}>{tab.emoji}</Text>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: C.canvas,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    padding: 5,
    gap: 4,
    shadowColor: '#2B2826',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
  },
  itemActive: { backgroundColor: C.matcha },
  emoji: { fontSize: 15 },
  label: { fontSize: 12, color: C.muted, fontWeight: '600' },
  labelActive: { color: '#FFFFFF' },
});
