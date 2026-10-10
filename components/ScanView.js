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
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { DEMO_MEALS, pickLocalAnalysis } from '../data/mockFamily';
import { PLANT_COLOR_HEX, UPF_TIER_LABELS } from '../api/adapters';
import IngredientEditor from './IngredientEditor';
import PrepDropdown from './PrepDropdown';

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

const SAMPLE_PLATES = {
  salmon: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  ramen: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
};

export default function ScanView({ onUpload, onEditMeal, onTransmit, onDone }) {
  const [image, setImage] = useState(null);
  const [prepContext, setPrepContext] = useState('home_cooked');
  const [analysis, setAnalysis] = useState(null);

  const [uploadedMeal, setUploadedMeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [transmitted, setTransmitted] = useState(false);

  const reset = () => {
    setImage(null);
    setAnalysis(null);
    setUploadedMeal(null);
    setTransmitted(false);
    setLoading(false);
  };

  const processImageUri = async (uri, base64 = null) => {
    let finalUri = uri;
    let finalBase64 = base64;

    // Always convert taken/chosen plate image to JPEG before uploading
    try {
      const manip = await manipulateAsync(
        uri,
        [],
        { compress: 0.85, format: SaveFormat.JPEG, base64: true }
      );
      if (manip?.uri) {
        finalUri = manip.uri;
        finalBase64 = manip.base64 || finalBase64;
      }
    } catch (e) {
      console.warn('JPEG conversion warning in ScanView:', e?.message || e);
    }

    setImage(finalUri);
    setTransmitted(false);
    setAnalysis(null);
    setUploadedMeal(null);
    setLoading(true);

    if (onUpload) {
      try {
        const meal = await onUpload(finalUri, prepContext, { base64: finalBase64 });
        setUploadedMeal(meal);
        setAnalysis({
          source: 'api',
          mealId: meal.id,
          dishName: meal.dishName,
          healthScore: meal.healthScore,
          rawScore: meal.rawScore,
          scores: meal.scores,
          feedback: meal.feedback,
          plantColors: meal.plantColors || [],
          detectedIngredients: meal.detectedIngredients || [],
          upfTier: meal.upfTier || 'unprocessed',
          confidence: meal.confidence,
          requiresManualTags: meal.requiresManualTags,
        });
        setLoading(false);
        return;
      } catch (e) {
        Alert.alert(
          'API Notice',
          `${e.message || 'Could not connect to backend'}. Using offline sample preview.`
        );
      }
    }

    // Local analysis fallback only if backend completely unreachable
    const local = pickLocalAnalysis();
    setUploadedMeal(null);
    setAnalysis({
      source: 'local',
      mealId: `local-${Date.now()}`,
      dishName: local.dishName,
      healthScore: local.healthScore,
      feedback: local.feedback,
      plantColors: ['green', 'orange'],
      detectedIngredients: ['greens', 'quinoa', 'olive oil'],
      upfTier: 'unprocessed',
      requiresManualTags: false,
    });
    setLoading(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera required', 'nurtrition needs camera access to snap your plate.');
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (res.canceled || !res.assets || !res.assets[0]) return;
    processImageUri(res.assets[0].uri, res.assets[0].base64);
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (res.canceled || !res.assets || !res.assets[0]) return;
    processImageUri(res.assets[0].uri, res.assets[0].base64);
  };

  const loadDemo = (key) => {
    if (SAMPLE_PLATES[key]) {
      processImageUri(SAMPLE_PLATES[key]);
      return;
    }
    const demo = DEMO_MEALS[key];
    setAnalysis({
      source: 'local',
      mealId: `demo-${key}`,
      dishName: demo.dishName,
      healthScore: demo.healthScore,
      feedback: demo.feedback,
      plantColors: key === 'salmon' ? ['green', 'orange', 'red'] : ['yellow_white'],
      detectedIngredients: key === 'salmon' ? ['salmon', 'leafy greens', 'edamame'] : ['ramen noodles', 'egg'],
      upfTier: key === 'salmon' ? 'unprocessed' : 'ultra_processed',
      requiresManualTags: false,
    });
  };

  const handleUpdateIngredients = (updatedList) => {
    setAnalysis((prev) => (prev ? { ...prev, detectedIngredients: updatedList } : prev));
  };

  const handleRecalculate = async () => {
    if (!analysis || !analysis.mealId) return;
    setRecalculating(true);
    try {
      if (onEditMeal && analysis.source === 'api') {
        const res = await onEditMeal(analysis.mealId, {
          meal_name: analysis.dishName,
          detected_ingredients: analysis.detectedIngredients,
          plant_colors: analysis.plantColors,
          upf_tier: analysis.upfTier,
        });
        if (res.ok && res.meal) {
          setUploadedMeal(res.meal);
          setAnalysis((prev) => ({
            ...prev,
            healthScore: res.meal.healthScore,
            rawScore: res.meal.rawScore,
            scores: res.meal.scores,
            feedback: res.meal.feedback,
            requiresManualTags: false,
          }));
        }
      } else {
        const count = analysis.detectedIngredients?.length || 0;
        const newScore = Math.min(100, Math.max(30, 60 + count * 6));
        setAnalysis((prev) => ({
          ...prev,
          healthScore: newScore,
          requiresManualTags: false,
          feedback: `Recalculated with ${count} foods recognized on your plate.`,
        }));
      }
    } finally {
      setRecalculating(false);
    }
  };

  const transmit = () => {
    if (!analysis || !onTransmit) return;
    const meal =
      uploadedMeal ||
      {
        id: analysis.mealId || `scan-${Date.now()}`,
        source: analysis.source,
        memberId: 'me',
        authorName: 'You',
        dishName: analysis.dishName,
        placeholderEmoji: '🍽️',
        image,
        postedLabel: 'Just now',
        healthScore: analysis.healthScore,
        rawScore: analysis.rawScore,
        scores: analysis.scores,
        plantColors: analysis.plantColors,
        detectedIngredients: analysis.detectedIngredients,
        upfTier: analysis.upfTier,
        feedback: analysis.feedback,
        reactions: { acknowledge: 0, nurture: 0 },
      };
    onTransmit(meal);
    setTransmitted(true);
    if (onDone) setTimeout(onDone, 250);
  };

  const upfLabel = UPF_TIER_LABELS[analysis?.upfTier] || String(analysis?.upfTier || '').replace('_', ' ');

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Share a Meal</Text>
        <Text style={styles.subtitle}>Snap your plate and send some care home.</Text>
      </View>

      <PrepDropdown value={prepContext} onChange={setPrepContext} />

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

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.snapBtn} onPress={takePhoto} activeOpacity={0.85}>
          <Text style={styles.snapText}>📷 Snap Plate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryBtn} onPress={pickImage} activeOpacity={0.85}>
          <Text style={styles.galleryText}>🖼️ Choose Photo</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.demoLabel}>or send a live sample plate</Text>
      <View style={styles.demoRow}>
        <TouchableOpacity style={styles.demoTag} onPress={() => loadDemo('salmon')} activeOpacity={0.85}>
          <Text style={styles.demoTagText}>Live Salmon Bowl 🐟</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.demoTag} onPress={() => loadDemo('ramen')} activeOpacity={0.85}>
          <Text style={styles.demoTagText}>Live Ramen 🍜</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={C.matcha} />
          <Text style={styles.loadingText}>Analyzing meal with backend AI…</Text>
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

          <Text style={styles.note}>"{analysis.feedback}"</Text>

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

          {!!upfLabel && (
            <View style={styles.novaTag}>
              <Text style={styles.novaText}>{upfLabel}</Text>
            </View>
          )}

          <IngredientEditor
            dishName={analysis.dishName}
            ingredients={analysis.detectedIngredients}
            requiresManualTags={analysis.requiresManualTags}
            confidence={analysis.confidence}
            onUpdateIngredients={handleUpdateIngredients}
            onRecalculate={handleRecalculate}
            saving={recalculating}
          />

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

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: C.canvas, gap: 14 },

  header: { marginBottom: 2 },
  title: { fontFamily: SERIF, fontSize: 28, color: C.text, letterSpacing: 0.2 },
  subtitle: { fontSize: 14, color: C.muted, marginTop: 4, lineHeight: 20 },


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

  btnRow: { flexDirection: 'row', gap: 10 },
  snapBtn: {
    flex: 1,
    backgroundColor: C.matcha,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  snapText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  galleryBtn: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  galleryText: { color: C.text, fontSize: 15, fontWeight: '600' },

  demoLabel: { fontSize: 12, color: C.muted, textAlign: 'center' },
  demoRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  demoTag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  demoTagText: { fontSize: 12, color: C.text, fontWeight: '600' },

  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', paddingVertical: 12 },
  loadingText: { fontSize: 13, color: C.muted },

  card: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    gap: 14,
    marginTop: 4,
  },
  dishName: { fontFamily: SERIF, fontSize: 24, color: C.text, letterSpacing: 0.2 },

  scoreWrap: { alignItems: 'center', gap: 8 },
  scoreCircle: {
    width: 110,
    height: 110,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: C.matcha,
    backgroundColor: C.matchaLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scoreNum: { fontFamily: SERIF, fontSize: 38, color: C.matcha },
  scoreDen: { fontSize: 14, color: C.matcha, marginLeft: 2, marginBottom: 8 },
  scoreLabel: { fontSize: 13, color: C.muted },

  note: { fontSize: 13, color: C.muted, lineHeight: 20, textAlign: 'center', fontStyle: 'italic' },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  colorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.canvas,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  colorDot: { width: 10, height: 10, borderRadius: 999 },
  colorText: { fontSize: 12, color: C.text, fontWeight: '600', textTransform: 'capitalize' },

  novaTag: {
    alignSelf: 'center',
    backgroundColor: C.matchaLight,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  novaText: { fontSize: 12, color: C.matcha, fontWeight: '600' },

  shareBtn: {
    backgroundColor: C.terracotta,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  shareBtnDone: { backgroundColor: C.muted },
  shareText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  clearBtn: { alignItems: 'center', paddingVertical: 4 },
  clearText: { fontSize: 13, color: C.muted, fontWeight: '600' },
});
