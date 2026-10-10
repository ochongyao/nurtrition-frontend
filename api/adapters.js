export const PLANT_COLOR_HEX = {
  green: '#4F7059',
  orange: '#C87F3E',
  red: '#B25A3E',
  purple: '#7C6A9B',
  yellow_white: '#C9A227',
};

export const REACTION_EMOJI = { acknowledge: '❤️', nurture: '🍵' };

export const emojiForType = (type) => REACTION_EMOJI[type] || '❤️';

const asList = (value) => (Array.isArray(value) ? value : []);

export function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

const memberIdFor = (userName, currentUserName) =>
  currentUserName && userName === currentUserName ? 'me' : `u:${userName}`;

const countsFromEmojis = (emojis) => ({
  acknowledge: emojis.includes(REACTION_EMOJI.acknowledge) ? 1 : 0,
  nurture: emojis.includes(REACTION_EMOJI.nurture) ? 1 : 0,
});

export const UPF_TIER_LABELS = {
  unprocessed: 'Whole & unprocessed',
  minimally_processed: 'Minimally processed',
  processed: 'Lightly processed',
  ultra_processed: 'Ultra-processed treat',
};

export function feedItemToMeal(item, { currentUserName } = {}) {
  const reactionEmojis = asList(item.reactions);
  const plantColors = asList(item.plant_colors);
  return {
    id: item.meal_id,
    source: 'api',
    memberId: memberIdFor(item.user_name, currentUserName),
    authorName: item.user_name,
    authorRole: item.user_role,
    image: item.image_url || null,
    placeholderEmoji: '🍽️',
    dishName: item.meal_name,
    healthScore: item.normalized_score,
    plants: plantColors.length,
    plantColors,
    detectedIngredients: asList(item.detected_ingredients),
    upfTier: item.upf_tier || 'unprocessed',
    feedback: item.reassurance_note,
    postedLabel: relativeTime(item.created_at),
    createdAt: item.created_at,
    reactions: countsFromEmojis(reactionEmojis),
    reactionEmojis,
  };
}

export function uploadResultToMeal(result, { image, currentUserName } = {}) {
  const plantColors = asList(result.plant_colors);
  const detectedIngredients = asList(result.detected_ingredients);
  const scores = result.scores || {
    plant_points: result.plant_score || 0,
    whole_food_points: result.whole_food_score || 0,
    protein_points: result.protein_score || 0,
    upf_penalty: result.penalty_score || 0,
    raw_total: result.raw_score || 0,
  };

  return {
    id: result.meal_id || result.id,
    source: 'api',
    memberId: 'me',
    authorName: currentUserName || 'You',
    authorRole: 'member',
    image: result.image_url || image || null,
    placeholderEmoji: '🍽️',
    dishName: result.meal_name,
    healthScore: result.normalized_score,
    rawScore: scores.raw_total ?? result.raw_score,
    scores,
    plants: plantColors.length,
    plantColors,
    detectedIngredients,
    upfTier: result.upf_tier || 'unprocessed',
    confidence: result.confidence != null ? result.confidence : result.ai_confidence,
    requiresManualTags: Boolean(result.requires_manual_tags),
    feedback: result.reassurance_note,
    postedLabel: 'Just now',
    createdAt: result.created_at || new Date().toISOString(),
    reactions: { acknowledge: 0, nurture: 0 },
    reactionEmojis: [],
  };
}

export function auditResponseToMeal(audit, { currentUserName } = {}) {
  return uploadResultToMeal(audit, { image: audit.image_url, currentUserName });
}

export function weeklyToRows(weekly) {
  const rankings = asList(weekly?.leaderboard_payload?.rankings);
  return rankings.map((row) => ({
    id: row.user_id,
    name: row.full_name,
    location: row.role,
    index: row.avg_score,
    mealsLogged: row.meal_count,
    greens: row.plant_diversity_count,
    baseline: (row.role || '').toUpperCase(),
    highlight: row.top_meal,
  }));
}


const ACTIVITY_FROM_API = {
  sedentary: 'SEDENTARY',
  moderate: 'LIGHT',
  active: 'ACTIVE',
  athlete: 'ACTIVE',
};

export function profileFromMe(user, fallback) {
  if (!user) return fallback;
  const age = Number(user.profile?.age ?? user.age) || fallback.age;
  const sexRaw = String(user.profile?.sex ?? user.sex ?? '').toLowerCase();
  const activityRaw = String(user.profile?.activity_level ?? user.activity_level ?? '').toLowerCase();
  return {
    age,
    sex: sexRaw.startsWith('f') ? 'F' : 'M',
    heightCm: fallback.heightCm,
    weightKg: fallback.weightKg,
    activity: ACTIVITY_FROM_API[activityRaw] || fallback.activity,
  };
}
