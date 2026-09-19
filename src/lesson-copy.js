// Keep cooking directions intact; language practice lives in its own optional panel.
const extras = [
  'A good meal can start with just four ingredients.',
  'Point to each ingredient and name it.', 'Name their colors before you start.',
  'Use this quiet moment to read the story.', 'Read the Castanyada story while you wait.',
  'Name each one as you pick it up.', 'Try naming the ingredients without looking.',
  'Describe how its texture changed.', 'Name their colors.',
  'Recall the words for tomato, oil and salt.',
  'Describe its colors and textures before serving.',
  'This vegetable adaptation is our prompt for a conversation about changing recipes.',
  'Describe the ingredients on your plate.', 'Name each ingredient before serving.',
  'Describe the difference between the raw and cooked texture.',
];
const overrides = {
  'panellets:5': 'Serve the cooled panellets.',
  'rice-pudding:4': 'Let the bowls cool before serving.',
  'moqueca:4': 'Serve the stew warm.',
};
export function stepDirections(recipe, index) {
  let text = overrides[`${recipe.id}:${index}`] || recipe.steps[index][1];
  for (const extra of extras) text = text.replace(extra, '');
  return text.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
}
