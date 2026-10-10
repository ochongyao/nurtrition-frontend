import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

const C = {
  canvas: '#FAF7F2',
  card: '#FFFFFF',
  border: '#EFEAE2',
  text: '#2B2826',
  muted: '#756D65',
  matcha: '#4F7059',
  matchaLight: '#E8EFE9',
  terracotta: '#B25A3E',
  terracottaLight: '#F6E5DE',
};

export default function IngredientEditor({
  dishName,
  ingredients = [],
  requiresManualTags,
  confidence,
  onChangeDishName,
  onUpdateIngredients,
  onRecalculate,
  saving,
}) {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const removeIngredient = (indexToRemove) => {
    const next = ingredients.filter((_, idx) => idx !== indexToRemove);
    onUpdateIngredients(next);
  };

  const addIngredient = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed) return;
    if (!ingredients.includes(trimmed)) {
      onUpdateIngredients([...ingredients, trimmed]);
    }
    setNewTag('');
    setIsAdding(false);
  };

  const confidencePct = confidence != null ? Math.round(confidence * 100) : null;

  return (
    <View style={styles.container}>
      {requiresManualTags && (
        <View style={styles.warningCard}>
          <Text style={styles.warningEmoji}>🌿</Text>
          <View style={styles.warningBody}>
            <Text style={styles.warningTitle}>Please review your plate</Text>
            <Text style={styles.warningText}>
              {confidencePct != null
                ? `AI confidence was ${confidencePct}%. Please double-check the detected foods below.`
                : 'Please check detected ingredients to make sure your nourishment score is accurate.'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Detected Foods & Ingredients</Text>
        <Text style={styles.sectionSubtitle}>
          Tap × to remove, or add missing items to refine your score.
        </Text>
      </View>

      <View style={styles.chipsContainer}>
        {ingredients.map((item, idx) => (
          <View key={`${item}-${idx}`} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
            <TouchableOpacity
              onPress={() => removeIngredient(idx)}
              style={styles.chipRemove}
              hitSlop={8}
              activeOpacity={0.7}
            >
              <Text style={styles.chipRemoveText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        {!isAdding && (
          <TouchableOpacity
            style={styles.addChipBtn}
            onPress={() => setIsAdding(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addChipText}>+ Add food</Text>
          </TouchableOpacity>
        )}
      </View>

      {isAdding && (
        <View style={styles.addInputRow}>
          <TextInput
            style={styles.addInput}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="e.g. broccoli, brown rice"
            placeholderTextColor={C.muted}
            autoFocus
            onSubmitEditing={addIngredient}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.saveAddBtn} onPress={addIngredient} activeOpacity={0.85}>
            <Text style={styles.saveAddText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelAddBtn}
            onPress={() => {
              setNewTag('');
              setIsAdding(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelAddText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {onRecalculate && (
        <TouchableOpacity
          style={styles.recalcBtn}
          onPress={onRecalculate}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color={C.matcha} />
          ) : (
            <Text style={styles.recalcText}>↺  Recalculate Score with Corrections</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, marginTop: 4 },

  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.terracottaLight,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECD1C6',
  },
  warningEmoji: { fontSize: 20 },
  warningBody: { flex: 1 },
  warningTitle: { fontSize: 13, fontWeight: '700', color: C.terracotta },
  warningText: { fontSize: 12, color: C.text, lineHeight: 17, marginTop: 2 },

  sectionHeader: { marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  sectionSubtitle: { fontSize: 12, color: C.muted, marginTop: 2 },

  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    gap: 6,
  },
  chipText: { fontSize: 13, color: C.text, fontWeight: '600', textTransform: 'capitalize' },
  chipRemove: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#EAE4DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemoveText: { fontSize: 12, color: C.muted, fontWeight: '700', lineHeight: 14 },

  addChipBtn: {
    borderWidth: 1,
    borderColor: C.matcha,
    borderStyle: 'dashed',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.matchaLight,
  },
  addChipText: { fontSize: 12, color: C.matcha, fontWeight: '700' },

  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: C.text,
  },
  saveAddBtn: {
    backgroundColor: C.matcha,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  saveAddText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  cancelAddBtn: { paddingHorizontal: 6 },
  cancelAddText: { color: C.muted, fontSize: 13 },

  recalcBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: C.matchaLight,
    marginTop: 4,
  },
  recalcText: { fontSize: 12, color: C.matcha, fontWeight: '700' },
});
