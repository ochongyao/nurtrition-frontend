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
import StripeCheckoutModal from './components/StripeCheckoutModal';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const C = {
  canvas: '#FAF7F2',
  card: '#FFFFFF',
  border: '#EFEAE2',
  text: '#2B2826',
  muted: '#756D65',
  matcha: '#4F7059',
  matchaLight: '#E8EFE9',
  gold: '#B8860B',
  goldLight: '#FFF8DC',
};

function AppShell() {
  const insets = useSafeAreaInsets();

  const {
    mode,
    status,
    user,
    family,
    meals,
    standings,
    weekly,
    userProfile,
    transmit,
    react,
    uploadMealPhoto,
    editMealIngredients,
    getMealAudit,
    refresh,
    updateProfile,
    subscription,
    setSubscription,
  } = useFamilyCare();

  const [activeTab, setActiveTab] = useState('table');
  const [showAuth, setShowAuth] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

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

  const isRefreshing = status === 'loading';

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brand}>nurtrition</Text>
          <Text style={styles.tagline}>
            {mode === 'live' && family ? family.name : 'A warm kitchen table, wherever you are.'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.proBadgeChip, subscription?.isSubscriber && styles.proBadgeActive]}
            onPress={() => setShowCheckout(true)}
            activeOpacity={0.85}
          >
            <Text style={[styles.proBadgeText, subscription?.isSubscriber && styles.proBadgeActiveText]}>
              {subscription?.isSubscriber ? '⭐ Pro' : '🌱 Circle Pass'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusChip}
            onPress={() => setShowAuth(true)}
            activeOpacity={0.85}
          >
            <View style={[styles.statusDot, mode === 'live' && styles.statusDotLive]} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.screen}>
        {activeTab === 'table' && (
          <StreamView
            meals={meals}
            onReact={react}
            onRefresh={() => refresh(false)}
            onFetchAudit={getMealAudit}
            refreshing={isRefreshing}
          />
        )}
        {activeTab === 'share' && (
          <ScanView
            onUpload={uploadMealPhoto}
            onEditMeal={editMealIngredients}
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
            subscription={subscription}
            onOpenCheckout={() => setShowCheckout(true)}
            onUpdateProfile={updateProfile}
            onRefresh={() => refresh(true)}
            refreshing={isRefreshing}
          />
        )}
      </View>

      <NavBar activeTab={activeTab} onChange={setActiveTab} />

      <StripeCheckoutModal
        visible={showCheckout}
        onClose={() => setShowCheckout(false)}
        subscription={subscription}
        onSubscriptionUpdated={setSubscription}
      />
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
  headerLeft: { flex: 1, paddingRight: 8 },
  brand: { fontFamily: SERIF, fontSize: 26, color: C.text, letterSpacing: 0.3 },
  tagline: { fontSize: 13, color: C.muted, marginTop: 3 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proBadgeChip: {
    backgroundColor: C.matchaLight,
    borderWidth: 1,
    borderColor: '#C2DBC6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  proBadgeActive: {
    backgroundColor: C.goldLight,
    borderColor: '#E6D78C',
  },
  proBadgeText: {
    fontSize: 12,
    color: C.matcha,
    fontWeight: '700',
  },
  proBadgeActiveText: {
    color: '#8B6508',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
