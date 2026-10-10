import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFamilyCare } from '../context/FamilyCareContext';

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

const ROLES = [
  { key: 'student', label: 'Student' },
  { key: 'parent', label: 'Parent' },
  { key: 'member', label: 'Member' },
];
const SEXES = [
  { key: 'female', label: 'Female' },
  { key: 'male', label: 'Male' },
  { key: 'other', label: 'Other' },
];
const ACTIVITIES = [
  { key: 'sedentary', label: 'Sedentary' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'active', label: 'Active' },
  { key: 'athlete', label: 'Athlete' },
];

export default function AuthView({ onClose }) {
  const {
    mode,
    status,
    error,
    user,
    family,
    signIn,
    signUp,
    signOut,
    createFamily,
    joinFamily,
    refresh,
  } = useFamilyCare();

  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [sex, setSex] = useState('female');
  const [age, setAge] = useState('20');
  const [activity, setActivity] = useState('moderate');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState(null);

  const busy = status === 'loading';

  const submit = async () => {
    setMessage(null);
    if (tab === 'signin') {
      const res = await signIn(email.trim(), password);
      if (!res.ok) setMessage(res.error);
      return;
    }
    const res = await signUp({
      email: email.trim(),
      password,
      full_name: fullName.trim(),
      role,
      age: parseInt(age, 10) || 0,
      sex,
      activity_level: activity,
      dietary_flags: [],
    });
    if (!res.ok) setMessage(res.error);
  };

  const makeFamily = async () => {
    setMessage(null);
    const res = await createFamily(familyName.trim() || `${user?.full_name || 'My'}'s family`);
    if (!res.ok) setMessage(res.error);
  };

  const join = async () => {
    setMessage(null);
    const res = await joinFamily(inviteCode.trim());
    if (!res.ok) setMessage(res.error);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>
          {mode === 'live' ? 'Account' : 'Connect'}
        </Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {mode !== 'live' ? (
          <>
            <Text style={styles.lead}>
              Sign in to sync your family table across devices, or keep enjoying the offline demo.
            </Text>

            <View style={styles.segment}>
              {[
                { key: 'signin', label: 'Sign in' },
                { key: 'signup', label: 'Create account' },
              ].map((option) => {
                const active = tab === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.segmentItem, active && styles.segmentItemActive]}
                    onPress={() => {
                      setTab(option.key);
                      setMessage(null);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {tab === 'signup' && (
              <>
                <Field label="Full name">
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Sarah Miller"
                    placeholderTextColor={C.muted}
                    autoCapitalize="words"
                  />
                </Field>
                <Text style={styles.fieldLabel}>Role</Text>
                <Choice row options={ROLES} value={role} onChange={setRole} />
              </>
            )}

            <Field label="Email">
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={C.muted}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </Field>
            <Field label="Password">
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={C.muted}
                secureTextEntry
              />
            </Field>

            {tab === 'signup' && (
              <>
                <View style={styles.inlineRow}>
                  <View style={styles.inlineField}>
                    <Field label="Age">
                      <TextInput
                        style={styles.input}
                        value={age}
                        onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="20"
                        placeholderTextColor={C.muted}
                      />
                    </Field>
                  </View>
                </View>
                <Text style={styles.fieldLabel}>Sex</Text>
                <Choice row options={SEXES} value={sex} onChange={setSex} />
                <Text style={styles.fieldLabel}>Activity</Text>
                <Choice options={ACTIVITIES} value={activity} onChange={setActivity} />
              </>
            )}

            {(message || error) && <Text style={styles.error}>{message || error}</Text>}

            <TouchableOpacity
              style={[styles.primary, busy && styles.primaryBusy]}
              onPress={submit}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryText}>
                  {tab === 'signin' ? 'Sign in' : 'Create account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghost} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.ghostText}>Keep using the offline demo</Text>
            </TouchableOpacity>
          </>
        ) : !family ? (
          <>
            <Text style={styles.lead}>
              Welcome, {user?.full_name}. Start a family circle or join one with an invite code.
            </Text>

            <Field label="New family circle name">
              <TextInput
                style={styles.input}
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="The Miller Family"
                placeholderTextColor={C.muted}
              />
            </Field>
            <TouchableOpacity style={styles.primary} onPress={makeFamily} disabled={busy} activeOpacity={0.85}>
              <Text style={styles.primaryText}>Start a family circle</Text>
            </TouchableOpacity>

            <Text style={styles.or}>or</Text>

            <Field label="Invite code">
              <TextInput
                style={styles.input}
                value={inviteCode}
                onChangeText={(t) => setInviteCode(t.toUpperCase())}
                placeholder="MILLER48"
                placeholderTextColor={C.muted}
                autoCapitalize="characters"
              />
            </Field>
            <TouchableOpacity style={styles.ghostSolid} onPress={join} disabled={busy} activeOpacity={0.85}>
              <Text style={styles.ghostSolidText}>Join with a code</Text>
            </TouchableOpacity>

            {(message || error) && <Text style={styles.error}>{message || error}</Text>}
            <SignOut onPress={signOut} />
          </>
        ) : (
          <>
            <Text style={styles.lead}>Signed in as {user?.full_name}.</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Family circle </Text>
                {family.name}
              </Text>
              {!!family.invite_code && (
                <Text style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Invite code </Text>
                  {family.invite_code}
                </Text>
              )}
              <Text style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Email </Text>
                {user?.email}
              </Text>
            </View>

            <TouchableOpacity style={styles.ghostSolid} onPress={refresh} disabled={busy} activeOpacity={0.85}>
              <Text style={styles.ghostSolidText}>Refresh the table</Text>
            </TouchableOpacity>
            <SignOut onPress={signOut} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SignOut({ onPress }) {
  return (
    <TouchableOpacity style={styles.ghost} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.signOutText}>Sign out</Text>
    </TouchableOpacity>
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

function Choice({ options, value, onChange, row }) {
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
  overlay: { flex: 1, backgroundColor: C.canvas },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  topTitle: { fontFamily: SERIF, fontSize: 22, color: C.text },
  close: { fontSize: 14, color: C.matcha, fontWeight: '700' },

  body: { paddingHorizontal: 20, paddingBottom: 48, gap: 14 },

  lead: { fontSize: 14, color: C.muted, lineHeight: 21, marginBottom: 2 },

  segment: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    padding: 4,
    gap: 4,
  },
  segmentItem: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 999 },
  segmentItemActive: { backgroundColor: C.matcha },
  segmentText: { fontSize: 13, color: C.muted, fontWeight: '600' },
  segmentTextActive: { color: '#FFFFFF' },

  field: { flex: 1 },
  fieldLabel: { fontSize: 12, color: C.muted, marginBottom: 6, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    backgroundColor: C.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
  },
  inlineRow: { flexDirection: 'row', gap: 10 },
  inlineField: { flex: 1 },

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

  primary: {
    backgroundColor: C.matcha,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBusy: { opacity: 0.8 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  ghost: { alignItems: 'center', paddingVertical: 12 },
  ghostText: { fontSize: 13, color: C.muted, fontWeight: '600' },
  ghostSolid: {
    borderWidth: 1,
    borderColor: C.matcha,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostSolidText: { color: C.matcha, fontSize: 15, fontWeight: '700' },
  signOutText: { fontSize: 13, color: C.terracotta, fontWeight: '700' },

  or: { textAlign: 'center', color: C.muted, fontSize: 13, marginVertical: 2 },

  error: {
    color: C.terracotta,
    fontSize: 13,
    lineHeight: 19,
    backgroundColor: C.terracottaLight,
    borderRadius: 12,
    padding: 12,
  },

  summaryCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    gap: 8,
  },
  summaryRow: { fontSize: 14, color: C.text },
  summaryKey: { color: C.muted },
});
