// Design-preview content, independent from Romi's production Catalonia config.
// Target-language copy and cooking instructions require human review before public demo.
export const languages = [
  {
    id: "ca",
    name: "Catalan",
    hello: "Bon dia!",
    flag: "▰",
    regionLabel: "Catalonia",
    regions: ["Barcelona, ES", "Girona, ES", "Tarragona, ES"],
    words: [
      ["pa", "bread"],
      ["tomàquet", "tomato"],
      ["oli", "oil"],
      ["sal", "salt"],
    ],
    review: "unreviewed",
  },
  {
    id: "it",
    name: "Italian",
    hello: "Ciao!",
    flag: "▥",
    regionLabel: "Italy",
    regions: ["Milan, IT", "Roma, IT", "Bologna, IT"],
    words: [
      ["pane", "bread"],
      ["pomodoro", "tomato"],
      ["olio", "oil"],
      ["sale", "salt"],
    ],
    review: "unreviewed",
  },
  {
    id: "pt",
    name: "Portuguese",
    hello: "Olá!",
    flag: "◧",
    regionLabel: "Portugal & Brazil",
    regions: ["Porto, PT", "Lisbon, PT", "Rio, BR"],
    words: [
      ["tomate", "tomato"],
      ["azeite", "olive oil"],
      ["sal", "salt"],
      ["cebola", "onion"],
    ],
    review: "unreviewed",
  },
];
export const levels = [
  {
    name: "Beginner",
    detail: "A few words, a small plate.",
    label: "First words",
    goal: "Recognize ingredients and learn a few useful words.",
    minutes: "10–15",
    icon: "Ⅰ",
  },
  {
    name: "Elementary",
    detail: "Little phrases, more flavor.",
    label: "Simple phrases",
    goal: "Follow short instructions and build simple phrases.",
    minutes: "15–25",
    icon: "Ⅱ",
  },
  {
    name: "Intermediate",
    detail: "Keep the conversation cooking.",
    label: "Your own sentences",
    goal: "Describe each step and talk about what you are making.",
    minutes: "25–40",
    icon: "Ⅲ",
  },
  {
    name: "Advanced",
    detail: "Stories, subtleties, a feast.",
    label: "Culture & conversation",
    goal: "Explain techniques and discuss the stories behind a dish.",
    minutes: "40–60",
    icon: "Ⅳ",
  },
];
const barcelonaSource = {
  name: "Barcelona Tourism · Bread & traditions",
  url: "https://bid.barcelonaturisme.com/wv3/en/enjoy/101/bread-a-staple-food-to-tempt-your-palate-.html",
};
const vegetablesSource = {
  name: "Barcelona City Council · Catalan cuisine",
  url: "https://www.meet.barcelona/es/visitala-y-amala/gastronomia/la-cocina-catalana",
};
const portugalSource = {
  name: "Visit Portugal · Porto & the North",
  url: "https://www.visitportugal.com/en/node/73749",
};
// Each step: title, cooking guidance, short target-language phrase, English gloss.
const recipe = (
  id,
  language,
  name,
  description,
  minLevel,
  minutes,
  tags,
  ingredients,
  steps,
  words,
  story,
  extra = {},
) => ({
  id,
  language,
  name,
  description,
  minLevel,
  minutes,
  tags,
  ingredients,
  steps,
  words,
  story,
  image: "vegetables",
  regions: [],
  ...extra,
});
export const recipes = [
  recipe(
    "tomato-bread",
    "ca",
    "Pa amb tomàquet",
    "A ripe tomato. Good bread. Your first words in Catalan.",
    0,
    10,
    ["vegan"],
    [
      "2 slices of rustic bread",
      "1 ripe tomato",
      "1 tbsp extra-virgin olive oil",
      "A pinch of salt",
    ],
    [
      [
        "Meet your ingredients",
        "Put the bread, tomato, olive oil and salt on the counter. A good meal can start with just four ingredients.",
        "pa · tomàquet · oli · sal",
        "bread · tomato · oil · salt",
      ],
      [
        "Toast the bread",
        "Lightly toast two slices until the edges are crisp. Leave a little softness in the middle.",
        "El pa",
        "The bread",
      ],
      [
        "Let the tomato do the work",
        "Cut the tomato in half. Rub the cut side over the warm bread, letting the pulp sink into the surface.",
        "El tomàquet",
        "The tomato",
      ],
      [
        "A little oil, a little salt",
        "Drizzle with olive oil, add a pinch of salt, and serve straight away. Point to each ingredient and name it.",
        "Bon profit!",
        "Enjoy your meal!",
      ],
    ],
    [
      ["pa", "bread"],
      ["tomàquet", "tomato"],
      ["oli", "oil"],
      ["sal", "salt"],
    ],
    {
      title: "More than something on toast.",
      text: "In Catalonia, bread rubbed with tomato is an everyday culinary ritual. The tomato is rubbed directly into the bread, then finished with olive oil. Something so simple becomes a way to share a table.",
      source: barcelonaSource,
    },
    {
      image: "toast",
      regions: ["Barcelona, ES", "Girona, ES", "Tarragona, ES"],
    },
  ),
  recipe(
    "escalivada",
    "ca",
    "Escalivada",
    "Roasted vegetables, slow moments, and a few new phrases.",
    1,
    45,
    ["vegan", "gluten-free"],
    ["1 red pepper", "1 aubergine", "1 onion", "2 tbsp olive oil", "Salt"],
    [
      [
        "A colorful beginning",
        "Gather and wash your vegetables. Name their colors before you start.",
        "vermell · morat",
        "red · purple",
      ],
      [
        "Into the oven",
        "Heat the oven to 200°C. Put the vegetables on a tray and rub with a little oil.",
        "El forn",
        "The oven",
      ],
      [
        "Take your time",
        "Roast for about 35 minutes, turning halfway, until softened. Use this quiet moment to read the story.",
        "Les verdures",
        "The vegetables",
      ],
      [
        "Peel and share",
        "Allow to cool enough to handle. Peel and remove seeds, tear into strips, and dress with oil and salt.",
        "A taula!",
        "To the table!",
      ],
    ],
    [
      ["pebrot", "pepper"],
      ["albergínia", "aubergine"],
      ["ceba", "onion"],
      ["forn", "oven"],
    ],
    {
      title: "A classic made from vegetables.",
      text: "Barcelona’s traditional recipe repertoire includes escalivada: a salad of roasted peppers, aubergines and other vegetables. Here the vegetables themselves take the leading role.",
      source: vegetablesSource,
    },
  ),
  recipe(
    "panellets",
    "ca",
    "Panellets",
    "Little almond sweets with a whole season inside them.",
    2,
    50,
    ["vegetarian", "gluten-free"],
    [
      "200 g ground almonds",
      "150 g sugar",
      "1 egg, separated",
      "100 g pine nuts",
      "Lemon zest",
    ],
    [
      [
        "Meet the autumn table",
        "Measure the almonds and sugar. Set aside the pine nuts and separate the egg.",
        "ametlla · sucre · ou",
        "almond · sugar · egg",
      ],
      [
        "Make the dough",
        "Mix the almonds, sugar and lemon zest. Add egg white a little at a time to make a workable dough.",
        "Barrejar",
        "To mix",
      ],
      [
        "A moment to rest",
        "Rest the dough for 20 minutes. Read the Castanyada story while you wait.",
        "El bol",
        "The bowl",
      ],
      [
        "Roll, then coat",
        "Shape small balls. Press pine nuts onto the outside and brush lightly with beaten yolk.",
        "Els pinyons",
        "The pine nuts",
      ],
      [
        "Into the oven",
        "Bake on a lined tray at 200°C for about 10 minutes. Let the sweets cool before moving them.",
        "El forn",
        "The oven",
      ],
      [
        "Share the story",
        "Serve your panellets and describe the process in your own words. What makes a food feel festive?",
        "Bona Castanyada!",
        "Happy Castanyada!",
      ],
    ],
    [
      ["ametlla", "almond"],
      ["sucre", "sugar"],
      ["ou", "egg"],
      ["pinyons", "pine nuts"],
    ],
    {
      title: "A little taste of the Castanyada.",
      text: "Panellets are eaten during the Castanyada, the chestnut celebration that forms part of All Saints festivities. Seasonal sweets turn a bakery visit into a small encounter with Catalan tradition.",
      source: barcelonaSource,
    },
    {
      image: "bakery",
      regions: ["Barcelona, ES", "Girona, ES", "Tarragona, ES"],
    },
  ),
  recipe(
    "bruschetta",
    "it",
    "Bruschetta al pomodoro",
    "Crunchy bread and bright tomatoes. A delicious place to start.",
    0,
    12,
    ["vegan"],
    [
      "2 slices of bread",
      "2 ripe tomatoes",
      "Basil leaves",
      "Olive oil",
      "Salt",
    ],
    [
      [
        "Meet the ingredients",
        "Set out the tomatoes, bread, basil and olive oil. Name each one as you pick it up.",
        "pane · pomodoro",
        "bread · tomato",
      ],
      [
        "Chop and season",
        "Dice the tomatoes and toss with torn basil, a little oil and salt.",
        "Il pomodoro",
        "The tomato",
      ],
      [
        "Make it crisp",
        "Toast the bread until crisp and spoon the tomatoes on top.",
        "Il pane",
        "The bread",
      ],
      [
        "Bring it to the table",
        "Finish with basil and serve immediately. Try naming the ingredients without looking.",
        "Buon appetito!",
        "Enjoy your meal!",
      ],
    ],
    [
      ["pane", "bread"],
      ["pomodoro", "tomato"],
      ["basilico", "basil"],
      ["olio", "oil"],
    ],
    null,
    { image: "toast" },
  ),
  recipe(
    "pasta",
    "it",
    "Pasta al pomodoro",
    "Turn a handful of ingredients into a little conversation.",
    1,
    25,
    ["vegan"],
    [
      "180 g dry pasta",
      "400 g canned tomatoes",
      "1 garlic clove",
      "Olive oil",
      "Basil",
      "Salt",
    ],
    [
      [
        "Set the table",
        "Measure the pasta and gather the sauce ingredients.",
        "La pasta",
        "The pasta",
      ],
      [
        "Start the sauce",
        "Gently warm the garlic in oil. Add tomatoes and simmer for 15 minutes.",
        "Il pomodoro",
        "The tomato",
      ],
      [
        "Cook the pasta",
        "Boil salted water. Cook pasta following the packet timing and reserve a cup of its water.",
        "Acqua e sale",
        "Water and salt",
      ],
      [
        "Bring it together",
        "Toss the drained pasta in the sauce, adding a splash of cooking water. Finish with basil.",
        "Buon appetito!",
        "Enjoy your meal!",
      ],
    ],
    [
      ["acqua", "water"],
      ["sale", "salt"],
      ["aglio", "garlic"],
      ["basilico", "basil"],
    ],
    null,
  ),
  recipe(
    "risotto",
    "it",
    "Risotto ai funghi",
    "A slower rhythm. Stir, notice, and tell the story.",
    2,
    40,
    ["vegetarian", "gluten-free"],
    [
      "160 g risotto rice",
      "200 g mushrooms",
      "700 ml vegetable stock",
      "1 small onion",
      "Olive oil",
      "Vegetarian hard cheese",
    ],
    [
      [
        "Get everything ready",
        "Slice the mushrooms, finely chop the onion and heat the stock in a separate pan.",
        "I funghi",
        "The mushrooms",
      ],
      [
        "Build the flavor",
        "Soften the onion in oil, then add mushrooms and cook until their liquid evaporates.",
        "La cipolla",
        "The onion",
      ],
      [
        "Toast the rice",
        "Add the rice and stir for two minutes until the grains are coated.",
        "Il riso",
        "The rice",
      ],
      [
        "One ladle at a time",
        "Add hot stock gradually, stirring and allowing each addition to absorb. Continue for around 18–20 minutes.",
        "Mescolare",
        "To stir",
      ],
      [
        "Finish and describe",
        "When the rice is tender with a little bite, remove from heat and stir in the cheese. Describe how its texture changed.",
        "Buon appetito!",
        "Enjoy your meal!",
      ],
    ],
    [
      ["riso", "rice"],
      ["funghi", "mushrooms"],
      ["cipolla", "onion"],
      ["brodo", "stock"],
    ],
    null,
    { regions: ["Milan, IT"] },
  ),
  recipe(
    "salada",
    "pt",
    "Salada de tomate",
    "Fresh tomatoes and the first words for your Portuguese table.",
    0,
    10,
    ["vegan", "gluten-free"],
    [
      "3 ripe tomatoes",
      "½ onion",
      "1 tbsp olive oil",
      "A splash of vinegar",
      "Salt",
    ],
    [
      [
        "A fresh start",
        "Wash the tomatoes and gather your ingredients.",
        "O tomate",
        "The tomato",
      ],
      [
        "Slice and notice",
        "Slice the tomatoes and thinly slice the onion. Name their colors.",
        "A cebola",
        "The onion",
      ],
      [
        "Dress the salad",
        "Toss with olive oil, vinegar and a pinch of salt.",
        "Azeite e sal",
        "Olive oil and salt",
      ],
      [
        "Share your first plate",
        "Serve in a shallow bowl. Recall the words for tomato, oil and salt.",
        "Bom apetite!",
        "Enjoy your meal!",
      ],
    ],
    [
      ["tomate", "tomato"],
      ["cebola", "onion"],
      ["azeite", "olive oil"],
      ["sal", "salt"],
    ],
    null,
    { regions: ["Porto, PT", "Lisbon, PT", "Rio, BR"] },
  ),
  recipe(
    "caldo",
    "pt",
    "Caldo verde",
    "A comforting green soup, one little phrase at a time.",
    1,
    35,
    ["vegan", "gluten-free"],
    [
      "300 g potatoes",
      "100 g collard greens",
      "1 onion",
      "1 garlic clove",
      "750 ml water",
      "Olive oil and salt",
    ],
    [
      [
        "Meet the greens",
        "Peel and dice the potatoes. Finely chop the onion and garlic.",
        "A batata",
        "The potato",
      ],
      [
        "Build a gentle base",
        "Soften onion and garlic in olive oil. Add potatoes and water, and simmer until the potatoes are tender.",
        "A água",
        "The water",
      ],
      [
        "A silky soup",
        "Carefully blend the soup until smooth. Slice the greens into very thin ribbons.",
        "A couve",
        "The collard greens",
      ],
      [
        "A touch of green",
        "Add the greens, simmer until tender, and season. This is a plant-based interpretation without the usual sausage.",
        "Bom apetite!",
        "Enjoy your meal!",
      ],
    ],
    [
      ["batata", "potato"],
      ["couve", "collard greens"],
      ["água", "water"],
      ["alho", "garlic"],
    ],
    {
      title: "From the green fields of the north.",
      text: "Caldo verde originated in northern Portugal and is enjoyed across the country. The region’s green fields are reflected in this simple cabbage soup. Our lesson uses a plant-based interpretation.",
      source: portugalSource,
    },
    { regions: ["Porto, PT", "Lisbon, PT"] },
  ),
  recipe(
    "rice-pudding",
    "pt",
    "Arroz doce",
    "Slowly stirred rice and a story told in your own words.",
    2,
    45,
    ["vegetarian", "gluten-free"],
    [
      "100 g short-grain rice",
      "500 ml milk",
      "250 ml water",
      "60 g sugar",
      "Lemon peel",
      "Ground cinnamon",
    ],
    [
      [
        "Set out the ingredients",
        "Measure the rice, milk, water and sugar. Cut a strip of lemon peel.",
        "O arroz",
        "The rice",
      ],
      [
        "Start with water",
        "Simmer the rice in water with lemon peel until most of the water is absorbed.",
        "A água",
        "The water",
      ],
      [
        "Stir in the milk",
        "Add the milk gradually and simmer gently, stirring regularly until the rice is tender and creamy.",
        "O leite",
        "The milk",
      ],
      [
        "Sweeten and finish",
        "Stir in sugar, remove the lemon peel and spoon into small bowls. Finish with cinnamon.",
        "A canela",
        "The cinnamon",
      ],
      [
        "Tell a food memory",
        "As the bowls cool, describe a sweet that reminds you of home. Use your own sentences.",
        "Bom apetite!",
        "Enjoy your meal!",
      ],
    ],
    [
      ["arroz", "rice"],
      ["leite", "milk"],
      ["açúcar", "sugar"],
      ["canela", "cinnamon"],
    ],
    null,
    { image: "bakery", regions: ["Porto, PT", "Lisbon, PT"] },
  ),
  recipe(
    "vinagrete",
    "pt",
    "Vinagrete",
    "A bright, crunchy side for your Brazilian Portuguese lesson.",
    1,
    15,
    ["vegan", "gluten-free"],
    [
      "2 tomatoes",
      "½ onion",
      "½ green pepper",
      "2 tbsp vinegar",
      "1 tbsp olive oil",
      "Salt",
    ],
    [
      [
        "Name the colors",
        "Wash the tomatoes and pepper. Gather the onion and dressing ingredients.",
        "O tomate",
        "The tomato",
      ],
      [
        "Practice small cuts",
        "Finely dice the tomatoes, onion and pepper into similar-sized pieces.",
        "A cebola",
        "The onion",
      ],
      [
        "Mix the dressing",
        "Combine vinegar, oil and salt, then toss with the vegetables.",
        "Misturar",
        "To mix",
      ],
      [
        "Rest and describe",
        "Let stand for a few minutes. Describe its colors and textures before serving.",
        "Bom apetite!",
        "Enjoy your meal!",
      ],
    ],
    [
      ["tomate", "tomato"],
      ["cebola", "onion"],
      ["pimentão", "pepper"],
      ["vinagre", "vinegar"],
    ],
    null,
    { regions: ["Rio, BR"] },
  ),
  recipe(
    "moqueca",
    "pt",
    "Moqueca de banana",
    "Layered vegetables and plantain, with time to talk.",
    2,
    40,
    ["vegan", "gluten-free"],
    [
      "2 ripe plantains",
      "1 onion",
      "1 pepper",
      "2 tomatoes",
      "200 ml coconut milk",
      "1 tbsp olive oil",
      "Coriander and salt",
    ],
    [
      [
        "Gather and describe",
        "Peel the plantains and slice into thick rounds. Slice the onion, pepper and tomatoes.",
        "A banana-da-terra",
        "The plantain",
      ],
      [
        "Build your layers",
        "Soften onion in oil. Layer the pepper, tomatoes and plantain on top.",
        "O pimentão",
        "The pepper",
      ],
      [
        "A gentle simmer",
        "Add coconut milk and a splash of water. Cover and gently simmer for 20 minutes, until plantain is tender.",
        "O leite de coco",
        "The coconut milk",
      ],
      [
        "Make it yours",
        "Season to taste and add coriander. This vegetable adaptation is our prompt for a conversation about changing recipes.",
        "Os legumes",
        "The vegetables",
      ],
      [
        "Bring it to the table",
        "Describe the cooking process using your own words. What changed as the ingredients simmered?",
        "Bom apetite!",
        "Enjoy your meal!",
      ],
    ],
    [
      ["banana-da-terra", "plantain"],
      ["pimentão", "pepper"],
      ["leite de coco", "coconut milk"],
      ["coentro", "coriander"],
    ],
    null,
    { regions: ["Rio, BR"] },
  ),
];

const italianTable = {
  title: "A small beginning to the meal.",
  text: "Bruschetta is served as an antipasto: an appetizer that opens the meal. Bread at the beginning of a meal gives us a small, approachable place to start learning, too.",
  source: {
    name: "Italian Trade Agency · Italian recipes",
    url: "https://www.ice.it/it/sites/default/files/inline-files/ITALIANA%20-%20ITA%20Amman%20Office%20Newsletter%20-%20Issue%201_May-June_2020.pdf",
  },
};
const portugueseTable = {
  title: "An invitation to the table.",
  text: "Portuguese hospitality is part of the country’s food culture, in traditional taverns as well as award-winning restaurants. Imagine welcoming someone to your table: what would you offer them first?",
  source: {
    name: "Visit Portugal · An unwritten recipe",
    url: "https://www.visitportugal.com/en/content/portugal-unwritten-recipe",
  },
};
for (const r of recipes) {
  if (r.id === "risotto")
    r.story = {
      title: "Rice has a home in the north.",
      text: "Rice, cheese and butter are prominent in Lombardy’s cuisine, and risotto is among Milan’s traditional dishes. Our mushroom version explores the patient, gradual cooking technique through a new set of words.",
      source: {
        name: "Italia.it · The cuisine of Lombardy",
        url: "https://www.italia.it/en/lombardy/things-to-do/typical-food-and-dishes-in-lombardy-italy",
      },
    };
  else if (r.language === "it") r.story = italianTable;
  else if (r.id === "moqueca" || r.id === "vinagrete")
    r.story = {
      title: "A country with many tables.",
      text: "Brazil’s culinary landscape stretches from moqueca and acarajé in the northeast to barbecue traditions in the south. This is a journey through Brazilian flavors from your Rio starting point, rather than a claim that every dish originated in Rio.",
      source: {
        name: "Visit Brasil · Food experiences",
        url: "https://www.visitbrasil.com/en/experiences/",
      },
    };
  else if (r.language === "pt" && !r.story) r.story = portugueseTable;
}

export function recommend({ language, region, level, diet, quick }) {
  return recipes
    .filter(
      (r) =>
        r.language === language &&
        (!r.regions.length || r.regions.includes(region)),
    )
    .filter(
      (r) =>
        diet === "all" ||
        (diet === "vegetarian"
          ? r.tags.includes("vegetarian") || r.tags.includes("vegan")
          : r.tags.includes(diet)),
    )
    .filter((r) => !quick || r.minutes <= 20)
    .sort(
      (a, b) =>
        Math.abs(a.minLevel - Math.min(level, 2)) -
          Math.abs(b.minLevel - Math.min(level, 2)) || a.minutes - b.minutes,
    );
}
