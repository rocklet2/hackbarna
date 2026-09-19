// Welcome has three levels; the original recipe app has four (including Elementary).
export function welcomeLessonLevel(storage, language, fallback = 0) {
  try {
    const profile = JSON.parse(storage.getItem('taula-welcome-v2') || 'null');
    if (profile?.language === language && Number.isInteger(profile.level) && profile.level >= 0 && profile.level <= 2) return [0, 2, 3][profile.level];
  } catch { /* Keep the recipe preference when storage is unavailable. */ }
  return fallback;
}
export function recipeUrl(recipe) {
  const slug = recipe.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  // ?fresh=1 makes the recipe start at step 1 instead of resuming an earlier visit (see openRecipe).
  return `/recipes/${recipe.language}/${slug}?fresh=1`;
}
