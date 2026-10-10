import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FamilyCareProvider, useFamilyCare } from './context/FamilyCareContext';
import NavBar from './components/NavBar';
import ScanView from './components/ScanView';
import StreamView from './components/StreamView';
import StandingsView from './components/StandingsView';
import AuthView from './components/AuthView';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const C = {
  canvas: '#FAF7F2',
  card: '#FFFFFF',
  border: '#EFEAE2',
  text: '#2B2826',
  muted: '#756D65',
  matcha: '#4F7059',
  matchaLight: '#E8EFE9',
};

function AppShell() {
  // Android is edge-to-edge: offset the root so nothing sits under the status bar.
  const insets = useSafeAreaInsets();

  const {
    mode,
    user,
    family,
    meals,
    standings,
    weekly,
    userProfile,
    transmit,
    react,
    uploadMealPhoto,
    updateProfile,
  } = useFamilyCare();

  const [activeTab, setActiveTab] = useState('table');
  const [showAuth, setShowAuth] = useState(false);

  const goToTable = () => setActiveTab('table');

  const statusLabel =
    mode === 'live'
      ? (user?.full_name || 'Account').split(' ')[0]
      : 'Offline demo';

  if (showAuth) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar style="dark" />
        <AuthView onClose={() => setShowAuth(false)} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brand}>FamBite</Text>
          <Text style={styles.tagline}>
            {mode === 'live' && family ? family.name : 'A warm kitchen table, wherever you are.'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.statusChip}
          onPress={() => setShowAuth(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.statusDot, mode === 'live' && styles.statusDotLive]} />
          <Text style={styles.statusText}>{statusLabel}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.screen}>
        {activeTab === 'table' && <StreamView meals={meals} onReact={react} />}
        {activeTab === 'share' && (
          <ScanView
            live={mode === 'live'}
            onUpload={uploadMealPhoto}
            onTransmit={transmit}
            onDone={goToTable}
          />
        )}
        {activeTab === 'rhythm' && (
          <StandingsView
            standings={standings}
            meals={meals}
            weekly={weekly}
            userProfile={userProfile}
            onUpdateProfile={updateProfile}
          />
        )}
      </View>

      <NavBar activeTab={activeTab} onChange={setActiveTab} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FamilyCareProvider>
        <AppShell />
      </FamilyCareProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: C.canvas,
  },
  headerLeft: { flex: 1, paddingRight: 12 },
  brand: { fontFamily: SERIF, fontSize: 26, color: C.text, letterSpacing: 0.3 },
  tagline: { fontSize: 13, color: C.muted, marginTop: 3 },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: C.muted,
  },
  statusDotLive: { backgroundColor: C.matcha },
  statusText: { fontSize: 12, color: C.text, fontWeight: '700' },

  screen: { flex: 1, backgroundColor: C.canvas },
});
