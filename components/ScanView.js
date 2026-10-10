import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { DEMO_MEALS, pickLocalAnalysis } from '../data/mockFamily';
import { PLANT_COLOR_HEX } from '../api/adapters';

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

const NOVA_LABELS = {
  1: 'Whole & unprocessed',
  2: 'Simple culinary',
  3: 'Processed',
  4: 'Ultra-processed',
};

const pad = (n) => String(n).padStart(2, '0');
const nowClock = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function ScanView({ live, onUpload, onTransmit, onDone }) {
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [uploadedMeal, setUploadedMeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transmitted, setTransmitted] = useState(false);

  const reset = () => {
    setImage(null);
    setAnalysis(null);
    setUploadedMeal(null);
    setTransmitted(false);
    setLoading(false);
  };

  const analyzeLocally = () => {
    setUploadedMeal(null);
    setAnalysis({ ...pickLocalAnalysis(), source: 'local' });
    setLoading(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera required', 'FamBite needs camera access to snap your plate.');
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], // SDK 57: MediaTypeOptions is deprecated
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (res.canceled) return;
    const uri = res.assets[0].uri;
    setImage(uri);
    setTransmitted(false);
    setAnalysis(null);
    setUploadedMeal(null);
    setLoading(true);

    if (live && onUpload) {
      try {
        const meal = await onUpload(uri);
        setUploadedMeal(meal);
        setAnalysis({
          source: 'api',
          dishName: meal.dishName,
          healthScore: meal.healthScore,
          feedback: meal.feedback,
          plantColors: meal.plantColors || [],
        });
        setLoading(false);
        return;
      } catch (e) {
        // Network or AI outage: fall back to the on-device sample analysis.
      }
    }
    analyzeLocally();
  };

  const loadDemo = (key) => {
    setImage(null);
    setUploadedMeal(null);
    setTransmitted(false);
    setLoading(false);
    setAnalysis({ ...DEMO_MEALS[key], source: 'local' });
  };

  const transmit = () => {
    if (!analysis || !onTransmit) return;
    const meal =
      uploadedMeal ||
      {
        id: `scan-${Date.now()}`,
        source: 'local',
        memberId: 'me',
        authorName: 'You',
        dishName: analysis.dishName,
        placeholderEmoji: analysis.placeholderEmoji,
        image,
        localTime: nowClock(),
        postedLabel: 'Just now',
        healthScore: analysis.healthScore,
        calories: analysis.calories,
        protein_g: analysis.protein_g,
        fiber_g: analysis.fiber_g,
        plants: analysis.plants,
        novaGroup: analysis.novaGroup,
        feedback: analysis.feedback,
        reactions: { acknowledge: 0, nurture: 0 },
      };
    onTransmit(meal);
    setTransmitted(true);
    if (onDone) setTimeout(onDone, 250);
  };

  const hasMacros =
    analysis &&
    (analysis.calories != null || analysis.protein_g != null || analysis.fiber_g != null);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Share a Meal</Text>
        <Text style={styles.subtitle}>Snap your plate and send some love home.</Text>
      </View>

      <View style={styles.viewfinder}>
        {image ? (
          <Image source={{ uri: image }} style={styles.viewfinderImage} />
        ) : (
          <View style={styles.viewfinderEmpty}>
            <Text style={styles.viewfinderEmoji}>🍽️</Text>
            <Text style={styles.viewfinderText}>Your plate will appear here</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.snapBtn} onPress={takePhoto} activeOpacity={0.85}>
        <Text style={styles.snapText}>📷  Snap Today's Plate</Text>
      </TouchableOpacity>

      <Text style={styles.demoLabel}>or try a sample</Text>
      <View style={styles.demoRow}>
        <TouchableOpacity style={styles.demoTag} onPress={() => loadDemo('salmon')} activeOpacity={0.85}>
          <Text style={styles.demoTagText}>Salmon Bowl (88)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.demoTag} onPress={() => loadDemo('ramen')} activeOpacity={0.85}>
          <Text style={styles.demoTagText}>Late Ramen (44)</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={C.matcha} />
          <Text style={styles.loadingText}>Looking at your meal…</Text>
        </View>
      )}

      {analysis && !loading && (
        <View style={styles.card}>
          <Text style={styles.dishName}>{analysis.dishName}</Text>

          <View style={styles.scoreWrap}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNum}>{analysis.healthScore}</Text>
              <Text style={styles.scoreDen}>/100</Text>
            </View>
            <Text style={styles.scoreLabel}>Nourishment Score</Text>
          </View>

          <Text style={styles.note}>{analysis.feedback}</Text>

          {analysis.plantColors?.length > 0 && (
            <View style={styles.colorRow}>
              {analysis.plantColors.map((color) => (
                <View key={color} style={styles.colorTag}>
                  <View
                    style={[styles.colorDot, { backgroundColor: PLANT_COLOR_HEX[color] || C.matcha }]}
                  />
                  <Text style={styles.colorText}>{String(color).replace('_', ' ')}</Text>
                </View>
              ))}
            </View>
          )}

          {hasMacros && (
            <View style={styles.statRow}>
              {analysis.calories != null && <Stat value={`${analysis.calories} kcal`} />}
              {analysis.protein_g != null && <Stat value={`${analysis.protein_g}g protein`} />}
              {analysis.fiber_g != null && <Stat value={`${analysis.fiber_g}g fiber`} />}
              {analysis.plants != null && <Stat value={`${analysis.plants} plants`} />}
            </View>
          )}

          {analysis.novaGroup != null && (
            <View style={styles.novaTag}>
              <Text style={styles.novaText}>
                NOVA {analysis.novaGroup} · {NOVA_LABELS[analysis.novaGroup] || 'Unknown'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.shareBtn, transmitted && styles.shareBtnDone]}
            onPress={transmit}
            disabled={transmitted}
            activeOpacity={0.85}
          >
            <Text style={styles.shareText}>
              {transmitted ? 'Shared with Family ❤️' : 'Share with Family ❤️'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearBtn} onPress={reset} activeOpacity={0.7}>
            <Text style={styles.clearText}>Start over</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Stat({ value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: C.canvas, gap: 16 },

  header: { marginBottom: 4 },
  title: { fontFamily: SERIF, fontSize: 28, color: C.text, letterSpacing: 0.2 },
  subtitle: { fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 20 },

  viewfinder: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    aspectRatio: 4 / 3,
  },
  viewfinderImage: { width: '100%', height: '100%' },
  viewfinderEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  viewfinderEmoji: { fontSize: 46 },
  viewfinderText: { fontSize: 13, color: C.muted },

  snapBtn: {
    backgroundColor: C.matcha,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  snapText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  demoLabel: { fontSize: 13, color: C.muted, textAlign: 'center' },
  demoRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  demoTag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  demoTagText: { fontSize: 13, color: C.text, fontWeight: '600' },

  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', paddingVertical: 12 },
  loadingText: { fontSize: 13, color: C.muted },

  card: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    gap: 16,
    marginTop: 4,
  },
  dishName: { fontFamily: SERIF, fontSize: 24, color: C.text, letterSpacing: 0.2 },

  scoreWrap: { alignItems: 'center', gap: 10 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: C.matcha,
    backgroundColor: C.matchaLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scoreNum: { fontFamily: SERIF, fontSize: 40, color: C.matcha },
  scoreDen: { fontSize: 14, color: C.matcha, marginLeft: 2, marginBottom: 8 },
  scoreLabel: { fontSize: 13, color: C.muted, letterSpacing: 0.4 },

  note: { fontSize: 14, color: C.muted, lineHeight: 21, textAlign: 'center', fontStyle: 'italic' },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  colorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.canvas,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  colorDot: { width: 10, height: 10, borderRadius: 999 },
  colorText: { fontSize: 12, color: C.text, fontWeight: '600', textTransform: 'capitalize' },

  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.canvas,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statValue: { fontSize: 12, color: C.text, fontWeight: '600' },

  novaTag: {
    alignSelf: 'center',
    backgroundColor: C.matchaLight,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  novaText: { fontSize: 12, color: C.matcha, fontWeight: '600' },

  shareBtn: {
    backgroundColor: C.terracotta,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
  },
  shareBtnDone: { backgroundColor: C.muted },
  shareText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  clearBtn: { alignItems: 'center', paddingVertical: 4 },
  clearText: { fontSize: 13, color: C.muted, fontWeight: '600' },
});
