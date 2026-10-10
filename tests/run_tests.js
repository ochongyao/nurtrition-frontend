// Comprehensive unit tests for FamilyCareEats frontend adapters and data logic.
// Executed via `node tests/run_tests.js`.

const assert = require('assert');

async function runAll() {
  console.log('--- Running FamilyCare Frontend Unit Tests ---');

  // Dynamically import ES module adapters.js
  const adapters = await import('../api/adapters.js');

  // 1. Test relativeTime
  const now = new Date();
  const isoJustNow = now.toISOString();
  const past5m = new Date(Date.now() - 5 * 60000).toISOString();
  const past3h = new Date(Date.now() - 3 * 3600000).toISOString();
  const past2d = new Date(Date.now() - 2 * 86400000).toISOString();

  assert.strictEqual(adapters.relativeTime(isoJustNow), 'Just now');
  assert.strictEqual(adapters.relativeTime(past5m), '5m ago');
  assert.strictEqual(adapters.relativeTime(past3h), '3h ago');
  assert.strictEqual(adapters.relativeTime(past2d), '2 days ago');
  console.log('✓ relativeTime passed');

  // 2. Test feedItemToMeal
  const sampleFeedItem = {
    meal_id: '8d3e2304-4b51-4043-982f-897b5e408ec9',
    user_name: 'Sarah Miller',
    user_role: 'student',
    image_url: 'https://storage.supabase.co/meal.jpg',
    meal_name: 'Stir-fried Tofu with Broccoli',
    normalized_score: 86,
    plant_colors: ['green', 'orange'],
    detected_ingredients: ['tofu', 'broccoli', 'carrots'],
    upf_tier: 'unprocessed',
    reassurance_note: 'Nutrient-dense dinner rich in plant protein.',
    reactions: ['❤️', '🍵'],
    created_at: new Date().toISOString(),
  };

  const feedMeal = adapters.feedItemToMeal(sampleFeedItem, { currentUserName: 'Sarah Miller' });
  assert.strictEqual(feedMeal.id, '8d3e2304-4b51-4043-982f-897b5e408ec9');
  assert.strictEqual(feedMeal.memberId, 'me'); // current user
  assert.strictEqual(feedMeal.dishName, 'Stir-fried Tofu with Broccoli');
  assert.strictEqual(feedMeal.healthScore, 86);
  assert.strictEqual(feedMeal.plants, 2);
  assert.deepStrictEqual(feedMeal.detectedIngredients, ['tofu', 'broccoli', 'carrots']);
  assert.strictEqual(feedMeal.upfTier, 'unprocessed');
  assert.strictEqual(feedMeal.reactions.acknowledge, 1);
  assert.strictEqual(feedMeal.reactions.nurture, 1);
  console.log('✓ feedItemToMeal passed');

  // 3. Test uploadResultToMeal
  const sampleUploadResult = {
    meal_id: 'meal-uuid-1234',
    image_url: 'https://storage.supabase.co/photo.jpg',
    meal_name: 'Quinoa Garden Bowl',
    detected_ingredients: ['quinoa', 'kale', 'avocado'],
    plant_colors: ['green'],
    upf_tier: 'unprocessed',
    confidence: 0.95,
    requires_manual_tags: false,
    scores: {
      plant_points: 30,
      whole_food_points: 25,
      protein_points: 20,
      upf_penalty: 0,
      raw_total: 75,
    },
    normalized_score: 88,
    reassurance_note: 'Wholesome balanced dinner.',
    created_at: new Date().toISOString(),
  };

  const uploadMeal = adapters.uploadResultToMeal(sampleUploadResult, { currentUserName: 'You' });
  assert.strictEqual(uploadMeal.id, 'meal-uuid-1234');
  assert.strictEqual(uploadMeal.healthScore, 88);
  assert.strictEqual(uploadMeal.rawScore, 75);
  assert.strictEqual(uploadMeal.upfTier, 'unprocessed');
  assert.strictEqual(uploadMeal.requiresManualTags, false);
  assert.strictEqual(uploadMeal.confidence, 0.95);
  assert.deepStrictEqual(uploadMeal.detectedIngredients, ['quinoa', 'kale', 'avocado']);
  assert.strictEqual(uploadMeal.scores.plant_points, 30);
  console.log('✓ uploadResultToMeal passed');

  // 4. Test weeklyToRows
  const sampleWeekly = {
    id: 'digest-1',
    family_id: 'fam-1',
    week_start: '2026-10-05',
    week_end: '2026-10-11',
    leaderboard_payload: {
      total_meals: 14,
      rankings: [
        {
          user_id: 'user-1',
          full_name: 'Sarah Miller',
          role: 'student',
          meal_count: 8,
          total_score: 672,
          avg_score: 84.0,
          plant_diversity_count: 4,
          top_meal: 'Tofu with Broccoli',
        },
      ],
    },
    collective_plant_count: 4,
    ai_family_narrative: 'A vibrant week!',
    recommended_grocery_swap: 'Try chickpea pasta',
  };

  const rows = adapters.weeklyToRows(sampleWeekly);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].id, 'user-1');
  assert.strictEqual(rows[0].name, 'Sarah Miller');
  assert.strictEqual(rows[0].index, 84.0);
  assert.strictEqual(rows[0].mealsLogged, 8);
  assert.strictEqual(rows[0].greens, 4);
  assert.strictEqual(rows[0].highlight, 'Tofu with Broccoli');
  console.log('✓ weeklyToRows passed');

  // 5. Test profileFromMe
  const apiUser = {
    id: 'user-123',
    email: 'sarah@edu.com',
    full_name: 'Sarah Miller',
    profile: {
      age: 22,
      sex: 'female',
      activity_level: 'active',
      role: 'student',
    },
  };
  const fallback = { age: 20, sex: 'M', heightCm: 178, weightKg: 72, activity: 'SEDENTARY' };
  const userProfile = adapters.profileFromMe(apiUser, fallback);
  assert.strictEqual(userProfile.age, 22);
  assert.strictEqual(userProfile.sex, 'F');
  assert.strictEqual(userProfile.activity, 'ACTIVE');
  assert.strictEqual(userProfile.heightCm, 178);
  console.log('✓ profileFromMe passed');

  console.log('--- All unit tests passed cleanly! ---');
}

runAll().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
