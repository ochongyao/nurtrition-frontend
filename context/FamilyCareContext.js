import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../api/endpoints';
import { setAuthToken } from '../api/client';
import {
  feedItemToMeal,
  uploadResultToMeal,
  auditResponseToMeal,
  weeklyToRows,
  profileFromMe,
  emojiForType,
} from '../api/adapters';
import {
  getStoredToken,
  setStoredToken,
  getStoredUser,
  setStoredUser,
  getStoredFamily,
  setStoredFamily,
  getStoredProfile,
  setStoredProfile,
  clearStoredSession,
} from '../api/storage';
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
  const [mode, setMode] = useState('live');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [meals, setMeals] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [subscription, setSubscription] = useState({
    isSubscriber: false,
    tier: 'Family Explorer (Free)',
    expiresAt: null,
  });

  const refreshSubscription = useCallback(async () => {
    try {
      const res = await api.getSubscriptionStatus();
      if (res) {
        setSubscription({
          isSubscriber: !!res.is_subscriber,
          tier: res.tier || 'Family Explorer (Free)',
          expiresAt: res.expires_at || null,
        });
      }
    } catch {
      // Keep existing state
    }
  }, []);

  const loadFamilyData = useCallback(async (familyId, currentUserName, forceWeekly = false) => {
    const [feed, digest] = await Promise.all([
      api.getFamilyFeed(familyId, { limit: 50 }).catch(() => null),
      api.getWeeklyDigest(familyId, forceWeekly).catch(() => null),
    ]);
    if (Array.isArray(feed)) {
      setMeals(feed.map((item) => feedItemToMeal(item, { currentUserName })));
    }
    if (digest) setWeekly(digest);
  }, []);

  // 1. Initialize session on app start from backend API
  useEffect(() => {
    let mounted = true;
    async function initSession() {
      try {
        const [savedToken, savedUser, savedFamily, savedProfile] = await Promise.all([
          getStoredToken(),
          getStoredUser(),
          getStoredFamily(),
          getStoredProfile(),
        ]);

        if (!mounted) return;

        if (savedProfile) {
          setUserProfile(savedProfile);
        }

        if (savedToken) {
          setAuthToken(savedToken);
        }

        // Always attempt connection to backend API
        try {
          const me = await api.getMe();
          if (!mounted) return;
          const merged = { ...(savedUser || {}), ...me, profile: me.profile };
          setUser(merged);
          setMode('live');
          if (merged.family_id) {
            const activeFamily = savedFamily || { id: merged.family_id, name: 'Family Table' };
            setFamily(activeFamily);
            await loadFamilyData(merged.family_id, merged.full_name);
          }
        } catch (err) {
          if (err?.status === 401 && savedToken) {
            await clearStoredSession();
            setAuthToken(null);
          }
          // If backend offline or unreachable, fall back to seed data
          if (!savedUser) {
            setMeals(seedMeals);
            setMode('offline');
          }
        }
      } catch {
        setMeals(seedMeals);
        setMode('offline');
      } finally {
        if (mounted) setIsReady(true);
      }
    }

    initSession();
    return () => {
      mounted = false;
    };
  }, [loadFamilyData]);

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

  const applySession = useCallback(
    async (session) => {
      setAuthToken(session.access_token);
      await setStoredToken(session.access_token);
      const me = await api.getMe().catch(() => null);
      const merged = me ? { ...session.user, ...me, profile: me.profile } : session.user;
      setUser(merged);
      await setStoredUser(merged);

      const resolvedProfile = profileFromMe(merged, defaultUserProfile);
      setUserProfile(resolvedProfile);
      await setStoredProfile(resolvedProfile);

      setMode('live');
      if (merged.family_id) {
        const fam = { id: merged.family_id, name: 'Family Table', invite_code: '' };
        setFamily(fam);
        await setStoredFamily(fam);
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

  const signOut = useCallback(async () => {
    await clearStoredSession();
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
        await setStoredFamily(fam);
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
        await setStoredFamily(fam);
        await loadFamilyData(fam.id, user?.full_name);
        return { ok: true, family: fam };
      } catch (e) {
        return { ok: false, error: e.detail || e.message };
      }
    },
    [user, loadFamilyData]
  );

  const refresh = useCallback(
    async (forceWeekly = false) => {
      setStatus('loading');
      if (family) {
        await loadFamilyData(family.id, user?.full_name, forceWeekly);
      } else {
        const me = await api.getMe().catch(() => null);
        if (me && me.family_id) {
          await loadFamilyData(me.family_id, me.full_name, forceWeekly);
        }
      }
      setStatus('idle');
    },
    [family, user, loadFamilyData]
  );

  const uploadMealPhoto = useCallback(
    async (uri, preparationContext = 'home_cooked', options = {}) => {
      const result = await api.uploadMeal({
        uri,
        preparationContext,
        familyId: family?.id,
        base64: options?.base64,
      });
      return uploadResultToMeal(result, { image: uri, currentUserName: user?.full_name || 'You' });
    },
    [family, user]
  );

  const editMealIngredients = useCallback(
    async (mealId, payload) => {
      try {
        const updatedAudit = await api.editMeal(mealId, payload);
        const updatedMeal = auditResponseToMeal(updatedAudit, { currentUserName: user?.full_name || 'You' });
        setMeals((prev) =>
          prev.map((m) => (m.id === mealId ? { ...m, ...updatedMeal } : m))
        );
        return { ok: true, meal: updatedMeal };
      } catch (e) {
        return { ok: false, error: e.detail || e.message };
      }
    },
    [user]
  );

  const getMealAudit = useCallback(
    async (mealId) => {
      try {
        return await api.getMeal(mealId);
      } catch {
        return meals.find((m) => m.id === mealId) || null;
      }
    },
    [meals]
  );

  const transmit = useCallback(
    (meal) => {
      setMeals((prev) => [meal, ...prev.filter((m) => m.id !== meal.id)]);
      if (family) {
        loadFamilyData(family.id, user?.full_name).catch(() => {});
      }
    },
    [family, user, loadFamilyData]
  );

  const react = useCallback(
    (mealId, type) => {
      const emoji = emojiForType(type);
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
      api.reactToMeal(mealId, emoji).catch(() => {});
    },
    []
  );

  const updateProfile = useCallback(async (next) => {
    setUserProfile(next);
    await setStoredProfile(next);
  }, []);

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
    isReady,
    signIn,
    signUp,
    signOut,
    createFamily,
    joinFamily,
    refresh,
    uploadMealPhoto,
    editMealIngredients,
    getMealAudit,
    transmit,
    react,
    updateProfile,
    subscription,
    refreshSubscription,
    setSubscription,
    setMode,
  };

  return <FamilyCareContext.Provider value={value}>{children}</FamilyCareContext.Provider>;
}

export const useFamilyCare = () => {
  const ctx = useContext(FamilyCareContext);
  if (!ctx) throw new Error('useFamilyCare must be used inside FamilyCareProvider');
  return ctx;
};
