import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import * as api from '../api/endpoints';
import { setAuthToken } from '../api/client';
import {
  feedItemToMeal,
  uploadResultToMeal,
  weeklyToRows,
  profileFromMe,
  emojiForType,
} from '../api/adapters';
import {
  seedMeals,
  familyMembers,
  defaultUserProfile,
  computeStandings,
  baselineLabel,
} from '../data/mockFamily';

const FamilyCareContext = createContext(null);

const NAMES = { mom: 'Mom', sis: 'Sister', me: 'You' };

export function FamilyCareProvider({ children }) {
  const [mode, setMode] = useState('offline');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [meals, setMeals] = useState(seedMeals);
  const [weekly, setWeekly] = useState(null);

  const offlineStandings = useMemo(() => {
    const resolved = familyMembers.map((member) =>
      member.id === 'me' ? { ...member, demographics: userProfile } : member
    );
    return computeStandings(meals, resolved).map((row) => ({
      id: row.id,
      name: NAMES[row.id] || row.name,
      location: row.location,
      index: row.index,
      mealsLogged: row.mealsLogged,
      greens: meals.filter((m) => m.memberId === row.id && (m.plants || 0) >= 3).length,
      baseline: baselineLabel(row.demographics),
      highlight: '',
    }));
  }, [meals, userProfile]);

  const liveStandings = useMemo(() => (weekly ? weeklyToRows(weekly) : []), [weekly]);

  const standings =
    mode === 'live' && liveStandings.length ? liveStandings : offlineStandings;

  const loadFamilyData = useCallback(async (familyId, currentUserName) => {
    const [feed, digest] = await Promise.all([
      api.getFamilyFeed(familyId, { limit: 50 }).catch(() => null),
      api.getWeeklyDigest(familyId).catch(() => null),
    ]);
    if (Array.isArray(feed)) {
      setMeals(feed.map((item) => feedItemToMeal(item, { currentUserName })));
    }
    if (digest) setWeekly(digest);
  }, []);

  const applySession = useCallback(
    async (session) => {
      setAuthToken(session.access_token);
      const me = await api.getMe().catch(() => null);
      const merged = me ? { ...session.user, ...me, profile: me.profile } : session.user;
      setUser(merged);
      setUserProfile(profileFromMe(merged, defaultUserProfile));
      setMode('live');
      if (merged.family_id) {
        setFamily({ id: merged.family_id, name: 'Your family', invite_code: '' });
        await loadFamilyData(merged.family_id, merged.full_name);
      } else {
        setFamily(null);
      }
    },
    [loadFamilyData]
  );

  const signIn = useCallback(
    async (email, password) => {
      setStatus('loading');
      setError(null);
      try {
        await applySession(await api.login(email, password));
        setStatus('idle');
        return { ok: true };
      } catch (e) {
        const message = e.detail || e.message || 'Could not sign in.';
        setStatus('error');
        setError(message);
        return { ok: false, error: message };
      }
    },
    [applySession]
  );

  const signUp = useCallback(
    async (payload) => {
      setStatus('loading');
      setError(null);
      try {
        await applySession(await api.register(payload));
        setStatus('idle');
        return { ok: true };
      } catch (e) {
        const message = e.detail || e.message || 'Could not create the account.';
        setStatus('error');
        setError(message);
        return { ok: false, error: message };
      }
    },
    [applySession]
  );

  const signOut = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setFamily(null);
    setWeekly(null);
    setMeals(seedMeals);
    setUserProfile(defaultUserProfile);
    setMode('offline');
    setStatus('idle');
    setError(null);
  }, []);

  const createFamily = useCallback(
    async (name) => {
      try {
        const fam = await api.createFamily(name);
        setFamily(fam);
        await loadFamilyData(fam.id, user?.full_name);
        return { ok: true, family: fam };
      } catch (e) {
        return { ok: false, error: e.detail || e.message };
      }
    },
    [user, loadFamilyData]
  );

  const joinFamily = useCallback(
    async (inviteCode) => {
      try {
        const fam = await api.joinFamily(inviteCode);
        setFamily(fam);
        await loadFamilyData(fam.id, user?.full_name);
        return { ok: true, family: fam };
      } catch (e) {
        return { ok: false, error: e.detail || e.message };
      }
    },
    [user, loadFamilyData]
  );

  const refresh = useCallback(async () => {
    if (mode !== 'live' || !family) return;
    setStatus('loading');
    await loadFamilyData(family.id, user?.full_name);
    setStatus('idle');
  }, [mode, family, user, loadFamilyData]);

  const uploadMealPhoto = useCallback(
    async (uri, preparationContext = 'home_cooked') => {
      const result = await api.uploadMeal({
        uri,
        preparationContext,
        familyId: family?.id,
      });
      return uploadResultToMeal(result, { image: uri, currentUserName: user?.full_name });
    },
    [family, user]
  );

  const transmit = useCallback(
    (meal) => {
      setMeals((prev) => [meal, ...prev.filter((m) => m.id !== meal.id)]);
      if (mode === 'live' && family) {
        loadFamilyData(family.id, user?.full_name).catch(() => {});
      }
    },
    [mode, family, user, loadFamilyData]
  );

  const react = useCallback(
    (mealId, type) => {
      const emoji = emojiForType(type);
      const target = meals.find((meal) => meal.id === mealId);
      setMeals((prev) =>
        prev.map((meal) => {
          if (meal.id !== mealId) return meal;
          const emojis = meal.reactionEmojis || [];
          const active = emojis.includes(emoji);
          const reactionEmojis = active
            ? emojis.filter((e) => e !== emoji)
            : [...emojis, emoji];
          return {
            ...meal,
            reactionEmojis,
            reactions: {
              ...meal.reactions,
              [type]: Math.max(0, (meal.reactions?.[type] || 0) + (active ? -1 : 1)),
            },
          };
        })
      );
      if (mode === 'live' && target?.source === 'api') {
        api.reactToMeal(mealId, emoji).catch(() => {});
      }
    },
    [meals, mode]
  );

  const updateProfile = useCallback((next) => setUserProfile(next), []);

  const value = {
    mode,
    status,
    error,
    user,
    family,
    userProfile,
    meals,
    standings,
    weekly,
    signIn,
    signUp,
    signOut,
    createFamily,
    joinFamily,
    refresh,
    uploadMealPhoto,
    transmit,
    react,
    updateProfile,
  };

  return <FamilyCareContext.Provider value={value}>{children}</FamilyCareContext.Provider>;
}

export const useFamilyCare = () => {
  const ctx = useContext(FamilyCareContext);
  if (!ctx) throw new Error('useFamilyCare must be used inside FamilyCareProvider');
  return ctx;
};
