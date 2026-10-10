// Seed data and local computation for the offline demo. Every score, index
// and audit point is derived here, so the app needs no backend.

export const CURRENT_USER_ID = 'me';

// `demographics` feeds the baseline column and the weekly audit. The current
// user's own profile overrides the 'me' record at runtime.
export const familyMembers = [
  {
    id: 'mom',
    identity: 'MOTHER',
    name: 'Mei',
    region: 'HOME',
    location: 'Kuala Lumpur',
    timezoneLabel: 'GMT+8',
    demographics: { age: 52, sex: 'F', heightCm: 158, weightKg: 60, activity: 'ACTIVE' },
  },
  {
    id: 'sis',
    identity: 'SISTER',
    name: 'Ling',
    region: 'LDN',
    location: 'London',
    timezoneLabel: 'GMT+1',
    demographics: { age: 21, sex: 'F', heightCm: 165, weightKg: 55, activity: 'LIGHT' },
  },
  {
    id: 'me',
    identity: 'USER',
    name: 'You',
    region: 'CAMPUS',
    location: 'Davis, CA',
    timezoneLabel: 'GMT-7',
    demographics: { age: 20, sex: 'M', heightCm: 178, weightKg: 72, activity: 'SEDENTARY' },
  },
];

export const defaultUserProfile = { ...familyMembers.find((m) => m.id === 'me').demographics };

export const getMemberById = (id) =>
  familyMembers.find((m) => m.id === id) || familyMembers[familyMembers.length - 1];

// Meal stream, newest first. healthScore 0-100; novaGroup 1 (whole) to 4 (ultra-processed).
export const seedMeals = [
  {
    id: 'm1',
    memberId: 'mom',
    dishName: 'Steamed Fish, Ginger & Bok Choy',
    placeholderEmoji: '🐟',
    image: null,
    localTime: '19:12',
    postedLabel: '38m ago',
    healthScore: 92,
    calories: 380,
    protein_g: 34,
    fiber_g: 6,
    plants: 4,
    novaGroup: 1,
    feedback: 'Clean, whole and steamed. This is how you feed a family.',
    reactions: { acknowledge: 3, nurture: 2 },
  },
  {
    id: 'm2',
    memberId: 'sis',
    dishName: 'Meal-Deal Tuna Sandwich + Crisps',
    placeholderEmoji: '🥪',
    image: null,
    localTime: '13:40',
    postedLabel: '2h ago',
    healthScore: 41,
    calories: 610,
    protein_g: 21,
    fiber_g: 3,
    plants: 1,
    novaGroup: 4,
    feedback: 'We see you, Ling. Add a piece of fruit tomorrow?',
    reactions: { acknowledge: 1, nurture: 4 },
  },
  {
    id: 'm3',
    memberId: 'me',
    dishName: 'Salmon Poke Bowl with Edamame',
    placeholderEmoji: '🍣',
    image: null,
    localTime: '09:05',
    postedLabel: '5h ago',
    healthScore: 84,
    calories: 520,
    protein_g: 38,
    fiber_g: 7,
    plants: 5,
    novaGroup: 2,
    feedback: 'Omega-3 and five plants before your 10am lecture. Respect.',
    reactions: { acknowledge: 2, nurture: 1 },
  },
  {
    id: 'm4',
    memberId: 'mom',
    dishName: 'Lotus Root & Pork Rib Soup',
    placeholderEmoji: '🍲',
    image: null,
    localTime: '18:30',
    postedLabel: 'Yesterday',
    healthScore: 88,
    calories: 340,
    protein_g: 27,
    fiber_g: 5,
    plants: 3,
    novaGroup: 1,
    feedback: 'Three hours of simmering in one bowl. Eat while hot.',
    reactions: { acknowledge: 5, nurture: 3 },
  },
  {
    id: 'm5',
    memberId: 'sis',
    dishName: 'Homemade Red Lentil Curry',
    placeholderEmoji: '🍛',
    image: null,
    localTime: '20:15',
    postedLabel: 'Yesterday',
    healthScore: 86,
    calories: 450,
    protein_g: 19,
    fiber_g: 12,
    plants: 6,
    novaGroup: 1,
    feedback: 'Cooked from scratch in a dorm kitchen. Fiber queen.',
    reactions: { acknowledge: 4, nurture: 2 },
  },
  {
    id: 'm6',
    memberId: 'me',
    dishName: 'Instant Ramen + Soft Egg',
    placeholderEmoji: '🍜',
    image: null,
    localTime: '23:48',
    postedLabel: '2 days ago',
    healthScore: 33,
    calories: 540,
    protein_g: 14,
    fiber_g: 2,
    plants: 1,
    novaGroup: 4,
    feedback: 'Late-night ramen again? Balance it with greens tomorrow.',
    reactions: { acknowledge: 1, nurture: 2 },
  },
  {
    id: 'm7',
    memberId: 'mom',
    dishName: 'Brown Rice & Stir-Fried Kangkung',
    placeholderEmoji: '🥬',
    image: null,
    localTime: '12:20',
    postedLabel: '3 days ago',
    healthScore: 90,
    calories: 410,
    protein_g: 16,
    fiber_g: 9,
    plants: 4,
    novaGroup: 1,
    feedback: 'Simple, green and full of iron. That is the standard.',
    reactions: { acknowledge: 3, nurture: 1 },
  },
  {
    id: 'm8',
    memberId: 'sis',
    dishName: 'Avocado Toast + Poached Eggs',
    placeholderEmoji: '🥑',
    image: null,
    localTime: '09:30',
    postedLabel: '3 days ago',
    healthScore: 79,
    calories: 420,
    protein_g: 18,
    fiber_g: 10,
    plants: 3,
    novaGroup: 1,
    feedback: 'Brunch energy with real fiber. Proud of you.',
    reactions: { acknowledge: 2, nurture: 3 },
  },
];

// Preset analyses for the Scan view's two sample buttons.
export const DEMO_MEALS = {
  salmon: {
    dishName: 'Warm Salmon Bowl',
    placeholderEmoji: '🐟',
    healthScore: 88,
    calories: 480,
    protein_g: 36,
    fiber_g: 7,
    plants: 5,
    novaGroup: 1,
    feedback: 'Rich in leafy greens and healthy fats. A lovely one for today.',
    tags: ['OMEGA-3', 'WHOLE FOOD'],
  },
  ramen: {
    dishName: 'Late Ramen',
    placeholderEmoji: '🍜',
    healthScore: 44,
    calories: 560,
    protein_g: 13,
    fiber_g: 2,
    plants: 1,
    novaGroup: 4,
    feedback: 'We all have late nights. Add an egg and some greens tomorrow.',
    tags: ['ULTRA-PROCESSED', 'QUICK'],
  },
};

// Local analysis pool for camera captures (simulated on-device analysis).
export const localAnalysisPool = [
  {
    dishName: 'Grilled Chicken & Quinoa Bowl',
    placeholderEmoji: '🍗',
    healthScore: 85,
    calories: 520,
    protein_g: 41,
    fiber_g: 8,
    plants: 5,
    novaGroup: 2,
    feedback: 'Lean protein plus whole grains. The family approves.',
    tags: ['HIGH PROTEIN', 'WHOLE GRAIN'],
  },
  {
    dishName: 'Garden Veggie Omelette',
    placeholderEmoji: '🍳',
    healthScore: 82,
    calories: 340,
    protein_g: 24,
    fiber_g: 5,
    plants: 4,
    novaGroup: 1,
    feedback: 'Eggs and vegetables. Simple, fresh and filling.',
    tags: ['VEGETARIAN', 'FRESH'],
  },
  {
    dishName: 'Roasted Salmon & Asparagus',
    placeholderEmoji: '🐟',
    healthScore: 90,
    calories: 480,
    protein_g: 39,
    fiber_g: 6,
    plants: 3,
    novaGroup: 1,
    feedback: 'Omega-3s and greens. A standings topper.',
    tags: ['OMEGA-3', 'LOW CARB'],
  },
  {
    dishName: 'Double Cheeseburger & Fries',
    placeholderEmoji: '🍔',
    healthScore: 28,
    calories: 980,
    protein_g: 32,
    fiber_g: 4,
    plants: 1,
    novaGroup: 4,
    feedback: 'No judgment. Pair it with a salad next time.',
    tags: ['ULTRA-PROCESSED', 'TREAT'],
  },
];

export const pickLocalAnalysis = () =>
  localAnalysisPool[Math.floor(Math.random() * localAnalysisPool.length)];

// Cooperative quota, computed live from the meal stream.
export const WEEKLY_QUOTA = { goal: 25, unit: 'GREEN MEALS', endsIn: '3 DAYS' };

export const computeGreens = (meals) => meals.filter((m) => m.plants >= 3).length;

// Index blends mean meal quality with logging consistency, so volume alone
// cannot be gamed. Weekly target is 5 meals per member.
const WEEKLY_LOG_TARGET = 5;

export const computeIndex = (memberMeals) => {
  if (!memberMeals || memberMeals.length === 0) return 0;
  const avg = memberMeals.reduce((sum, m) => sum + m.healthScore, 0) / memberMeals.length;
  const consistency = Math.min(1, memberMeals.length / WEEKLY_LOG_TARGET);
  const index = avg * 0.8 + consistency * 100 * 0.2;
  return Math.round(index * 10) / 10;
};

export const computeStandings = (meals, members) => {
  const rows = members.map((member) => {
    const memberMeals = meals.filter((m) => m.memberId === member.id);
    return {
      ...member,
      index: computeIndex(memberMeals),
      mealsLogged: memberMeals.length,
    };
  });
  return rows.sort((a, b) => b.index - a.index);
};

// Mifflin-St Jeor BMR, activity-scaled TDEE, and BMI.
export const ACTIVITY_LEVELS = [
  { key: 'SEDENTARY', label: 'SEDENTARY', factor: 1.2 },
  { key: 'LIGHT', label: 'LIGHT', factor: 1.375 },
  { key: 'ACTIVE', label: 'ACTIVE', factor: 1.55 },
];

export const SEX_OPTIONS = [
  { key: 'M', label: 'MALE' },
  { key: 'F', label: 'FEMALE' },
];

const activityFactor = (activity) =>
  (ACTIVITY_LEVELS.find((a) => a.key === activity) || ACTIVITY_LEVELS[0]).factor;

export const calcBMI = ({ heightCm, weightKg }) => {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
};

export const calcBMR = ({ age, sex, heightCm, weightKg }) => {
  if (!age || !heightCm || !weightKg) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'F' ? base - 161 : base + 5);
};

export const calcTDEE = (profile) => {
  const bmr = calcBMR(profile);
  if (bmr == null) return null;
  return Math.round(bmr * activityFactor(profile.activity));
};

export const baselineLabel = (demographics) => {
  if (!demographics) return 'NO BASELINE';
  const sex = demographics.sex === 'F' ? 'FEMALE' : 'MALE';
  return `${sex} · ${demographics.age} · ${demographics.activity}`;
};

// Weekly audit built from the user's own meals and profile, for InsightsView.
export const buildWeeklyAudit = (meals, profile) => {
  const userMeals = meals.filter((m) => m.memberId === CURRENT_USER_ID);
  const count = userMeals.length;

  const avg = (key) =>
    count ? Math.round(userMeals.reduce((s, m) => s + m[key], 0) / count) : 0;

  const avgHealth = avg('healthScore');
  const avgProtein = avg('protein_g');
  const avgFiber = avg('fiber_g');
  const greens = computeGreens(userMeals);
  const ultraProcessed = userMeals.filter((m) => m.novaGroup >= 4).length;
  const tdee = calcTDEE(profile);
  const bmi = calcBMI(profile);

  const points = [];

  if (avgFiber >= 7) {
    points.push({
      status: 'PASS',
      title: 'FIBER INTAKE',
      detail: `Averaging ${avgFiber}g fiber per meal. Meets the household benchmark of 7g+.`,
    });
  } else {
    points.push({
      status: 'FLAG',
      title: 'FIBER INTAKE',
      detail: `Averaging ${avgFiber}g fiber per meal. Add legumes, oats or whole grains.`,
    });
  }

  if (avgProtein >= 25) {
    points.push({
      status: 'PASS',
      title: 'PROTEIN SUFFICIENCY',
      detail: `Averaging ${avgProtein}g protein per meal. Adequate for recovery.`,
    });
  } else {
    points.push({
      status: 'FLAG',
      title: 'PROTEIN SUFFICIENCY',
      detail: `Averaging ${avgProtein}g protein per meal. Target 25g+ per sitting.`,
    });
  }

  if (ultraProcessed === 0) {
    points.push({
      status: 'PASS',
      title: 'PROCESSING LOAD',
      detail: 'No NOVA group 4 meals logged this week. Excellent restraint.',
    });
  } else {
    points.push({
      status: 'FLAG',
      title: 'PROCESSING LOAD',
      detail: `${ultraProcessed} ultra-processed (NOVA 4) meal${ultraProcessed > 1 ? 's' : ''} logged. Reduce frequency.`,
    });
  }

  points.push({
    status: greens >= 3 ? 'PASS' : 'FLAG',
    title: 'PLANT DIVERSITY',
    detail: `${greens} green meal${greens === 1 ? '' : 's'} (3+ plants) logged toward the family quota.`,
  });

  return {
    count,
    avgHealth,
    avgProtein,
    avgFiber,
    greens,
    ultraProcessed,
    bmi,
    tdee,
    points,
  };
};
