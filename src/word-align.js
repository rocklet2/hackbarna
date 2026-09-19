// Word/phrase-level alignment between the Catalan instruction shown on the lesson page and its
// English translation, so hovering (or, on a touchscreen, holding a finger on) a Catalan word
// highlights its English counterpart and vice versa.
//
// Each step is a list of [ca, en] pairs. The ca chunks concatenate (in order, no separator) to
// the exact Catalan instruction text in lesson-translations.js; the en chunks concatenate to the
// exact English text stepDirections() renders. word-align.test.js checks this against both files,
// so a change to either source text will fail the test until the alignment is updated to match.
//
// Word order differs between the two languages, so a pair is sometimes a short clause rather than
// a single word — that's a real translation, not a 1:1 gloss, and forcing single words would
// misrepresent it. Scoped to Catalan only: it's the language we can review for this demo.
// UNREVIEWED, same as the text it annotates — a Catalan speaker should check the groupings, not
// just the words.
export const wordAlign = {
  'tomato-bread': [
    [
      ["Posa ", "Put "], ["el pa, ", "the bread, "], ["el tomàquet, ", "tomato, "],
      ["l’oli d’oliva ", "olive oil "], ["i ", "and "], ["la sal ", "salt "],
      ["al taulell.", "on the counter."],
    ],
    [
      ["Torra lleugerament dues llesques", "Lightly toast two slices "],
      [": les vores cruixents ", "until the edges are crisp. "],
      ["i el centre una mica tou.", "Leave a little softness in the middle."],
    ],
    [
      ["Talla ", "Cut "], ["el tomàquet ", "the tomato "], ["per la meitat. ", "in half. "],
      ["Frega ", "Rub "], ["la part tallada ", "the cut side "],
      ["sobre el pa calent ", "over the warm bread, "],
      ["perquè la polpa hi penetri.", "letting the pulp sink into the surface."],
    ],
    [
      ["Afegeix un raig d’oli ", "Drizzle with olive oil, "],
      ["i un pessic de sal. ", "add a pinch of salt, "],
      ["Serveix de seguida.", "and serve straight away."],
    ],
  ],
  escalivada: [
    [["Prepara ", "Gather "], ["i ", "and "], ["renta ", "wash "], ["les verdures.", "your vegetables."]],
    [
      ["Escalfa ", "Heat "], ["el forn ", "the oven "], ["a 200°C. ", "to 200°C. "],
      ["Posa ", "Put "], ["les verdures ", "the vegetables "], ["en una safata ", "on a tray "],
      ["i ", "and "], ["unta-les ", "rub "], ["amb una mica d’oli.", "with a little oil."],
    ],
    [
      ["Rosteix-les ", "Roast "], ["uns 35 minuts, ", "for about 35 minutes, "],
      ["girant-les a mitja cocció, ", "turning halfway, "], ["fins que siguin tendres.", "until softened."],
    ],
    [
      ["Deixa-les refredar ", "Allow to cool "], ["fins que les puguis tocar. ", "enough to handle. "],
      ["Pela-les, ", "Peel "], ["treu-ne les llavors, ", "and remove seeds, "],
      ["fes-ne tires ", "tear into strips, "], ["i amaneix-les ", "and dress "],
      ["amb oli i sal.", "with oil and salt."],
    ],
  ],
  panellets: [
    [
      ["Mesura ", "Measure "], ["les ametlles ", "the almonds "], ["i el sucre. ", "and sugar. "],
      ["Reserva ", "Set aside "], ["els pinyons ", "the pine nuts "], ["i separa ", "and separate "],
      ["la clara del rovell.", "the egg."],
    ],
    [
      ["Barreja ", "Mix "], ["les ametlles, ", "the almonds, "], ["el sucre ", "sugar "],
      ["i la ratlladura de llimona. ", "and lemon zest. "], ["Afegeix ", "Add "],
      ["la clara ", "egg white "], ["a poc a poc ", "a little at a time "],
      ["fins a obtenir una massa que puguis treballar.", "to make a workable dough."],
    ],
    [
      ["Deixa reposar ", "Rest "], ["la massa ", "the dough "], ["durant 20 minuts.", "for 20 minutes."],
    ],
    [
      ["Fes ", "Shape "], ["boletes. ", "small balls. "], ["Cobreix-les ", "Press "],
      ["amb pinyons ", "pine nuts onto the outside "], ["i pinta-les ", "and brush "],
      ["amb una mica de rovell batut.", "lightly with beaten yolk."],
    ],
    [
      ["Cou-los ", "Bake "], ["sobre paper de forn ", "on a lined tray "], ["a 200°C ", "at 200°C "],
      ["durant uns 10 minuts. ", "for about 10 minutes. "], ["Deixa’ls refredar ", "Let the sweets cool "],
      ["abans de moure’ls.", "before moving them."],
    ],
    [
      ["Serveix ", "Serve "], ["els panellets un cop freds.", "the cooled panellets."],
    ],
  ],
  coca: [
    [
      ["Talla el pebrot, ", "Thinly slice the pepper, "], ["la ceba ", "onion "],
      ["i el carbassó a làmines fines. ", "and courgette. "], ["Escalfa ", "Heat "],
      ["el forn ", "the oven "], ["a 220°C.", "to 220°C."],
    ],
    [
      ["Estira ", "Stretch "], ["la massa ", "the dough "],
      ["en una safata untada amb oli. ", "onto an oiled baking tray. "], ["Deixa ", "Leave "],
      ["una vora petita.", "a small edge."],
    ],
    [
      ["Reparteix ", "Top "], ["les verdures sobre la massa ", "with the vegetables, "],
      ["i afegeix-hi oli ", "drizzle with oil "], ["i sal.", "and sprinkle with salt."],
    ],
    [
      ["Cou-la ", "Bake "], ["durant 20–25 minuts, ", "for 20–25 minutes "],
      ["fins que la base sigui cuita ", "until the base is cooked "],
      ["i les verdures tendres. ", "and the vegetables are tender. "], ["Talla-la ", "Cut "],
      ["en porcions.", "into portions."],
    ],
  ],
  mongetes: [
    [
      ["Escorre ", "Drain "], ["i esbandeix ", "and rinse "], ["les mongetes cuites. ", "the cooked beans. "],
      ["Pica ", "Finely chop "], ["l’all ", "the garlic "], ["i el julivert.", "and parsley."],
    ],
    [
      ["Escalfa l’all suaument ", "Gently warm garlic "], ["amb oli d’oliva ", "in olive oil "],
      ["durant un minut, ", "for a minute "], ["sense daurar-lo.", "without browning it."],
    ],
    [
      ["Afegeix ", "Stir in "], ["les mongetes ", "the beans "], ["i escalfa-les ", "and warm through "],
      ["durant 5 minuts. ", "for 5 minutes. "],
      ["Si cal, afegeix-hi una mica d’aigua.", "Add a splash of water if needed."],
    ],
    [
      ["Amaneix ", "Season "], ["i escampa-hi ", "and sprinkle "], ["el julivert.", "with parsley."],
    ],
  ],
  crema: [
    [
      ["Escalfa ", "Warm "], ["la llet ", "the milk "], ["amb pell de llimona ", "with lemon peel "],
      ["i canyella. ", "and cinnamon. "], ["Retira-la ", "Remove "], ["del foc ", "from heat "],
      ["i deixa-la infusionar ", "and infuse "], ["10 minuts.", "for 10 minutes."],
    ],
    [
      ["Bat ", "Whisk "], ["els rovells, ", "egg yolks, "], ["el sucre ", "sugar "],
      ["i el midó de blat de moro. ", "and cornflour. "], ["Incorpora-hi a poc a poc ", "Slowly whisk in "],
      ["la llet tèbia colada, sense deixar de batre.", "the strained warm milk."],
    ],
    [
      ["Torna-la ", "Return "], ["al foc baix ", "to low heat "], ["i remena contínuament ", "and stir continuously "],
      ["fins que espesseixi. ", "until thickened. "], ["No la deixis bullir.", "Do not let it boil."],
    ],
    [
      ["Reparteix-la ", "Pour "], ["en recipients resistents a la calor ", "into heatproof ramekins "],
      ["i refrigera-la ", "and refrigerate "], ["fins que sigui freda, ", "until cold, "],
      ["almenys 2 hores. ", "at least 2 hours. "],
      ["Aquest temps se suma al de la preparació activa.", "This is extra chilling time beyond the active lesson."],
    ],
    [
      ["Escampa ", "Sprinkle "], ["una capa fina de sucre ", "a thin layer of sugar "],
      ["sobre la crema freda. ", "on each chilled custard. "], ["Caramel·litza’l ", "Caramelize "],
      ["amb cura ", "carefully "], ["amb un bufador de cuina, ", "with a kitchen torch "],
      ["seguint-ne les instruccions.", "following its instructions."],
    ],
  ],
  espinacs: [
    [
      ["Renta ", "Wash "], ["els espinacs. ", "the spinach. "], ["Remulla ", "Soak "],
      ["les panses ", "the raisins "], ["en aigua tèbia ", "in warm water "],
      ["durant 10 minuts ", "for 10 minutes "], ["i talla l’all a làmines.", "and slice the garlic."],
    ],
    [
      ["Torra ", "Toast "], ["els pinyons ", "the pine nuts "], ["en una paella sense oli ", "in a dry pan "],
      ["durant un minut, ", "for a minute "], ["fins que siguin daurats. ", "until golden, "],
      ["Reserva’ls.", "then set them aside."],
    ],
    [
      ["Escalfa ", "Warm "], ["l’oli ", "the oil "], ["amb l’all, ", "with the garlic, "],
      ["afegeix ", "add "], ["els espinacs ", "the spinach "], ["i cou-los ", "and cook "],
      ["fins que perdin volum.", "until it has wilted."],
    ],
    [
      ["Incorpora ", "Stir in "], ["les panses escorregudes ", "the drained raisins "],
      ["i els pinyons. ", "and pine nuts, "], ["Sala ", "season with salt "],
      ["i serveix calent.", "and serve warm."],
    ],
  ],
  calcots: [
    [
      ["Escalfa ", "Heat "], ["el forn ", "the oven "], ["a 220°C. ", "to 220°C. "], ["Rosteix ", "Roast "],
      ["els tomàquets ", "the tomatoes "], ["i els alls ", "and garlic "],
      ["durant 20 minuts. ", "for 20 minutes. "], ["Torra ", "Toast "], ["les ametlles, ", "the almonds, "],
      ["les avellanes ", "hazelnuts "], ["i el pa ", "and bread "], ["en una paella sense oli.", "in a dry pan."],
    ],
    [
      ["Tritura ", "Blend "], ["els tomàquets i els alls rostits ", "the roasted tomatoes and garlic "],
      ["amb la fruita seca, ", "with the nuts, "], ["el pa, ", "bread, "], ["l’oli, ", "oil, "],
      ["el vinagre ", "vinegar "], ["i la sal ", "and salt "], ["fins que espesseixi. ", "until thick. "],
      ["Tasta ", "Taste "], ["i ajusta el condiment.", "and adjust."],
    ],
    [
      ["Rosteix ", "Roast "], ["els calçots ", "the calçots "], ["en una safata calenta ", "on a hot tray "],
      ["durant 15 a 20 minuts. Gira’ls ", "for 15 to 20 minutes, turning them, "],
      ["fins que siguin negres per fora ", "until the outsides are black "],
      ["i tous per dins.", "and the insides soft."],
    ],
    [
      ["Embolica ", "Wrap "], ["els calçots calents ", "the hot calçots "], ["amb paper ", "in paper "],
      ["durant 10 minuts. ", "for 10 minutes. "], ["Pela amb cura ", "Carefully peel off "],
      ["la capa negra ", "the black outer layer "], ["i suca’ls ", "and dip "],
      ["al romesco.", "in the romesco."],
    ],
  ],
  samfaina: [
    [
      ["Talla ", "Cut "], ["l’albergínia, ", "the aubergine, "], ["el carbassó, ", "courgette, "],
      ["el pebrot ", "pepper "], ["i la ceba ", "and onion "],
      ["en trossos regulars de la mida d’un mos.", "into even, bite-sized pieces."],
    ],
    [
      ["Cou ", "Soften "], ["la ceba ", "the onion "], ["i el pebrot ", "and pepper "],
      ["amb oli d’oliva ", "in olive oil "], ["a foc mitjà ", "over a medium heat "],
      ["durant uns 10 minuts, fins que s’estovin.", "for about 10 minutes."],
    ],
    [
      ["Afegeix ", "Add "], ["l’albergínia ", "the aubergine "], ["i el carbassó. ", "and courgette "],
      ["Cou-ho ", "and cook "], ["10 minuts, ", "for 10 minutes, "],
      ["remenant de tant en tant.", "stirring now and then."],
    ],
    [
      ["Ratlla-hi ", "Grate in "], ["els tomàquets, ", "the tomatoes, "], ["afegeix sal ", "add salt "],
      ["i cou-ho a foc baix ", "and simmer gently "], ["durant 15 minuts, ", "for 15 minutes "],
      ["fins que espesseixi ", "until thick "], ["i sigui lluent.", "and glossy."],
    ],
  ],
};

export function alignedInstruction(recipeId, index) {
  const steps = wordAlign[recipeId];
  return steps && steps[index] ? steps[index] : null;
}
