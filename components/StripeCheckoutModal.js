import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../api/endpoints';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const C = {
  canvas: '#FAF7F2',
  card: '#FFFFFF',
  border: '#EFEAE2',
  text: '#2B2826',
  muted: '#756D65',
  matcha: '#4F7059',
  matchaLight: '#E8EFE9',
  terracotta: '#B25A3E',
  gold: '#8B6508',
  goldLight: '#FFFDF5',
  goldBorder: '#E6D78C',
  stripeBlue: '#635BFF',
};

const DIRECT_STRIPE_LINK = 'https://buy.stripe.com/test_bJedR9dAJ5yJ1U6evi9Ve00';

const BENEFITS = [
  'Unlimited AI vision plate audits & plant point scores',
  'Real-time family stream with ❤️ & 🍵 care reactions',
  'Weekly family narrative digests & grocery swap advice',
  'Shared circle invites for up to 6 family members',
  'Zero calorie shaming or judgmental diet talk',
];

export default function StripeCheckoutModal({
  visible,
  onClose,
  subscription,
  onSubscriptionUpdated,
}) {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [testPaying, setTestPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    if (visible) setSuccessNotice(false);
  }, [visible]);

  const handleStripeCheckout = async () => {
    setLoading(true);
    let targetUrl = DIRECT_STRIPE_LINK;
    try {
      const res = await api.createCheckoutSession(selectedPlan);
      if (res && res.checkout_url) {
        targetUrl = res.checkout_url;
      }
    } catch (e) {
      console.warn('API checkout session notice, using direct Stripe link:', e?.message || e);
    } finally {
      setLoading(false);
    }

    try {
      const supported = await Linking.canOpenURL(targetUrl).catch(() => false);
      if (supported || targetUrl.startsWith('http')) {
        await Linking.openURL(targetUrl);
      } else {
        Alert.alert('Stripe Checkout', `Please visit: ${targetUrl}`);
      }
    } catch (err) {
      Alert.alert('Browser Notice', `Could not open link: ${err?.message || err}`);
    }
  };

  const handleInstantTestPayment = async () => {
    setTestPaying(true);
    try {
      const res = await api.confirmPayment(`cs_test_${Date.now()}`, selectedPlan);
      if (res && res.ok) {
        setSuccessNotice(true);
        if (onSubscriptionUpdated) {
          onSubscriptionUpdated({
            isSubscriber: true,
            tier: res.tier || 'Nurtrition Circle Pro',
            expiresAt: res.expires_at,
          });
        }
      }
    } catch (e) {
      Alert.alert('Payment Error', e.detail || e.message || 'Could not complete test payment.');
    } finally {
      setTestPaying(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to switch back to the free tier?',
      [
        { text: 'Keep Pro', style: 'cancel' },
        {
          text: 'Cancel Membership',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await api.cancelSubscription();
              if (onSubscriptionUpdated) {
                onSubscriptionUpdated({
                  isSubscriber: false,
                  tier: 'Family Explorer (Free)',
                  expiresAt: null,
                });
              }
              Alert.alert('Plan Updated', 'Your membership has been reverted to the free plan.');
            } catch (err) {
              Alert.alert('Error', err.detail || err.message || 'Could not cancel subscription.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const isPro = !!subscription?.isSubscriber;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isPro ? 'Your Membership' : 'nurtrition Circle Pass'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {isPro ? (
            /* Dedicated Active Member View (No purchase buttons) */
            <View style={styles.memberView}>
              <View style={styles.activeHeroBox}>
                <Text style={styles.activeHeroEmoji}>⭐</Text>
                <Text style={styles.activeHeroTitle}>Nurtrition Circle Pro</Text>
                <View style={styles.statusPill}>
                  <View style={styles.statusPillDot} />
                  <Text style={styles.statusPillText}>Active Subscription</Text>
                </View>
                <Text style={styles.activeHeroSub}>
                  Your family circle has full access to unlimited vision plate audits, weekly digests, and grocery swap coaching.
                </Text>
              </View>

              <View style={styles.benefitsCard}>
                <Text style={styles.benefitsTitle}>Active Benefits Unlocked</Text>
                {BENEFITS.map((b, i) => (
                  <View key={i} style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={17} color={C.matcha} />
                    <Text style={styles.benefitText}>{b}</Text>
                  </View>
                ))}
                {subscription?.expiresAt ? (
                  <Text style={styles.expiryNote}>
                    Renews: {new Date(subscription.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.88}>
                <Text style={styles.doneBtnText}>Back to Kitchen Table</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelLink}
                onPress={handleCancelSubscription}
                disabled={cancelling}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelLinkText}>
                  {cancelling ? 'Updating...' : 'Cancel Subscription (Switch back to Free)'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : successNotice ? (
            /* Celebration Screen immediately after checkout */
            <View style={styles.celebrationCard}>
              <Text style={styles.celebrationEmoji}>🎉</Text>
              <Text style={styles.celebrationTitle}>Welcome to Circle Pro!</Text>
              <Text style={styles.celebrationSub}>
                Your membership is now active. Enjoy unlimited AI plate audits, weekly digests, and grocery swap advice.
              </Text>
              <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>Return to Kitchen Table</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Purchase & Checkout View for Free Users */
            <>
              <View style={styles.heroSection}>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>🌱 Care Table Membership</Text>
                </View>
                <Text style={styles.heroHeadline}>Because nourishment is a family love language.</Text>
                <Text style={styles.heroSub}>
                  Keep everyone well-fed with private family scoring, weekly grocery swaps, and reassuring care notes.
                </Text>
              </View>

              <View style={styles.planSwitchContainer}>
                <TouchableOpacity
                  style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
                  onPress={() => setSelectedPlan('monthly')}
                  activeOpacity={0.88}
                >
                  <View style={styles.planCardHeader}>
                    <Text style={styles.planName}>Monthly</Text>
                    <View style={[styles.radioDot, selectedPlan === 'monthly' && styles.radioDotActive]} />
                  </View>
                  <Text style={styles.planPrice}>$6.99</Text>
                  <Text style={styles.planCadence}>per month</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.planCard, selectedPlan === 'annual' && styles.planCardActive]}
                  onPress={() => setSelectedPlan('annual')}
                  activeOpacity={0.88}
                >
                  <View style={styles.planSavingsTag}>
                    <Text style={styles.planSavingsText}>SAVE 30%</Text>
                  </View>
                  <View style={styles.planCardHeader}>
                    <Text style={styles.planName}>Annual</Text>
                    <View style={[styles.radioDot, selectedPlan === 'annual' && styles.radioDotActive]} />
                  </View>
                  <Text style={styles.planPrice}>$59.00</Text>
                  <Text style={styles.planCadence}>$4.91 / mo yearly</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.benefitsCard}>
                <Text style={styles.benefitsTitle}>What your circle unlocks</Text>
                {BENEFITS.map((b, i) => (
                  <View key={i} style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={17} color={C.matcha} />
                    <Text style={styles.benefitText}>{b}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.stripePayBtn, loading && styles.btnDisabled]}
                onPress={handleStripeCheckout}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.stripePayBtnText}>
                      Checkout with Stripe ({selectedPlan === 'annual' ? '$59/yr' : '$6.99/mo'})
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.directCardBox}>
                <View style={styles.cardPreviewRow}>
                  <Text style={styles.cardPreviewNum}>4242 •••• •••• 4242</Text>
                  <Text style={styles.cardPreviewExp}>12/28</Text>
                </View>
                <TouchableOpacity
                  style={[styles.instantPayBtn, testPaying && styles.btnDisabled]}
                  onPress={handleInstantTestPayment}
                  disabled={testPaying}
                  activeOpacity={0.88}
                >
                  {testPaying ? (
                    <ActivityIndicator color={C.matcha} size="small" />
                  ) : (
                    <Text style={styles.instantPayBtnText}>Instant Demo Activation (Free Trial)</Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.disclaimerText}>
                Encrypted payment processed through Stripe. Cancel anytime in account settings.
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, backgroundColor: C.canvas },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  closeBtn: { padding: 6, borderRadius: 20, backgroundColor: C.canvas },
  headerTitle: { fontFamily: SERIF, fontSize: 17, fontWeight: '600', color: C.text },
  scrollContent: { padding: 20, paddingBottom: 40 },
  memberView: { gap: 16 },
  activeHeroBox: {
    backgroundColor: C.goldLight,
    borderWidth: 1.5,
    borderColor: C.goldBorder,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  activeHeroEmoji: { fontSize: 40, marginBottom: 8 },
  activeHeroTitle: { fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: C.gold, marginBottom: 8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.goldBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  statusPillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2E7D32' },
  statusPillText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  activeHeroSub: { fontSize: 13, lineHeight: 19, color: C.muted, textAlign: 'center' },
  expiryNote: { fontSize: 12, color: C.muted, marginTop: 10, fontStyle: 'italic' },
  cancelLink: { alignSelf: 'center', paddingVertical: 10 },
  cancelLinkText: { fontSize: 12.5, color: C.terracotta, fontWeight: '600' },
  heroSection: { alignItems: 'center', marginBottom: 20 },
  pillBadge: {
    backgroundColor: C.matchaLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 8,
  },
  pillBadgeText: { fontSize: 12, fontWeight: '700', color: C.matcha },
  heroHeadline: {
    fontFamily: SERIF,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSub: { fontSize: 13, lineHeight: 19, color: C.muted, textAlign: 'center' },
  planSwitchContainer: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  planCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: C.border,
    position: 'relative',
  },
  planCardActive: { borderColor: C.matcha, backgroundColor: '#FAFCFA' },
  planSavingsTag: {
    position: 'absolute',
    top: -9,
    right: 10,
    backgroundColor: C.terracotta,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planSavingsText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  planCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  planName: { fontSize: 13, fontWeight: '700', color: C.text },
  radioDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: C.border },
  radioDotActive: { borderColor: C.matcha, backgroundColor: C.matcha },
  planPrice: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: C.text },
  planCadence: { fontSize: 11, color: C.muted, marginTop: 2 },
  benefitsCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 18,
  },
  benefitsTitle: { fontFamily: SERIF, fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  benefitText: { fontSize: 12.5, color: C.text, flex: 1 },
  stripePayBtn: {
    backgroundColor: C.stripeBlue,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stripePayBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  directCardBox: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 14,
  },
  cardPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.canvas,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 8,
  },
  cardPreviewNum: {
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontSize: 12.5,
    color: C.text,
    letterSpacing: 1,
  },
  cardPreviewExp: { fontSize: 11.5, color: C.muted },
  instantPayBtn: {
    backgroundColor: C.matchaLight,
    borderWidth: 1,
    borderColor: '#C2DBC6',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  instantPayBtnText: { fontSize: 12.5, fontWeight: '700', color: C.matcha },
  btnDisabled: { opacity: 0.6 },
  disclaimerText: { fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 16, paddingHorizontal: 16 },
  celebrationCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 20,
  },
  celebrationEmoji: { fontSize: 44, marginBottom: 10 },
  celebrationTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 6 },
  celebrationSub: { fontSize: 13, lineHeight: 19, color: C.muted, textAlign: 'center', marginBottom: 18 },
  doneBtn: { backgroundColor: C.matcha, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  doneBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
