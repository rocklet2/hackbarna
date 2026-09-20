import test from "node:test";
import assert from "node:assert/strict";
import { recipes } from "./data.js";
import {
  placesFor, matchPlace, matchPlan, PLANS, placeById, planById,
  placeQuestionFor, dishQuestionFor,
} from "./welcome/places.js";
import { regionalVoice } from "./agent-instructions.js";

test("a place is only offered as ready when recipes exist for its cities", () => {
  for (const id of ["ca", "it", "pt", "es"]) {
    for (const place of placesFor(id)) {
      const count = recipes.filter(
        (r) => r.language === id && (r.regions || []).some((c) => place.cities.includes(c)),
      ).length;
      if (place.ready) {
        assert.ok(count > 0, `${place.name} is offered but has no dishes`);
      } else {
        assert.equal(place.cities.length, 0, `${place.name} is not ready, so it claims no cities`);
      }
    }
  }
});

test("Catalan places are Catalan towns with their own dishes, and France is not offered", () => {
  const ids = placesFor("ca").map((p) => p.id);
  assert.deepEqual(ids, ["barcelona", "girona", "tarragona"]);
  assert.equal(placeById("ca", "pays-catalan"), null, "we have no recipes for the French side");
  for (const p of placesFor("ca")) assert.equal(p.country, "Spain");
});

test("every Catalan town offers at least two dishes", () => {
  for (const place of placesFor("ca")) {
    const dishes = recipes.filter((r) => r.language === "ca" &&
      (!r.regions?.length || r.regions.some((c) => place.cities.includes(c))));
    assert.ok(dishes.length >= 2, `${place.name} has ${dishes.length} dishes`);
  }
});

test("matchPlace hears a place in a spoken answer", () => {
  assert.equal(matchPlace("Girona", "ca").id, "girona");
  assert.equal(matchPlace("I'd like to cook in Barcelona", "ca").id, "barcelona");
  assert.equal(matchPlace("calcots", "ca").id, "tarragona");
  assert.equal(matchPlace("bologna", "it").id, "emilia-romagna");
  assert.equal(matchPlace("brazil", "pt").id, "brazil");
});

test("matchPlace returns null when no place was named", () => {
  assert.equal(matchPlace("um I don't know", "ca"), null);
  assert.equal(matchPlace("", "ca"), null);
});

test("matchPlan recognizes cooking today", () => {
  assert.equal(matchPlan("today").id, "today");
  assert.equal(matchPlan("just tonight").id, "today");
  assert.equal(matchPlan("nothing relevant"), null);
});

test("matchPlan hears the answer in the target language", () => {
  assert.equal(matchPlan("avui").id, "today");
  assert.equal(matchPlan("hoje").id, "today");
});

test("today plan asks for one dish", () => {
  assert.equal(planById("today").dishes, 1);
  assert.equal(PLANS.length, 1);
});

test("place questions are asked in both languages", () => {
  for (const id of ["ca", "it", "pt", "es"]) {
    const q = placeQuestionFor(id);
    assert.ok(q.target && q.en, `${id} question has both languages`);
  }
});

test("the dish screen opens with a leading question in every language", () => {
  for (const id of ["ca", "it", "pt", "es"]) {
    const q = dishQuestionFor(id);
    assert.ok(q.target && q.en, `${id} asks in both languages`);
    assert.equal(q.en, "What would you like to cook today?");
  }
});

test("Spanish is taught from four countries, each with its own dishes and its own voice", () => {
  const places = placesFor("es");
  assert.deepEqual(places.map((p) => p.name), ["Spain", "Mexico", "Peru", "Argentina"]);
  for (const place of places) {
    assert.ok(place.ready, `${place.name} is offered`);
    const dishes = recipes.filter((r) => r.language === "es" && r.regions.some((c) => place.cities.includes(c)));
    assert.ok(dishes.length >= 4, `${place.name} has ${dishes.length} dishes`);
    // A Spanish dish belongs to one country, never to all of them.
    for (const dish of dishes) assert.ok(dish.regions.length, `${dish.name} claims a place`);
    // The guide is told how that country speaks.
    assert.ok(regionalVoice(place.cities[0]), `${place.name} has a way of speaking`);
  }
  assert.equal(matchPlace("quiero cocinar en México", "es").id, "mexico");
  assert.equal(matchPlace("Buenos Aires", "es").id, "argentina");
});

test("a country's culture note comes from that country's own source", () => {
  const sourceFor = (id) => recipes.find((r) => r.id === id).story.source.url;
  assert.match(sourceFor("guacamole"), /unesco\.org/);
  assert.match(sourceFor("causa-limena"), /peru\.travel/);
  assert.match(sourceFor("humita"), /cancilleria\.gob\.ar/);
  // Every Spanish dish has a sourced note, whichever country it comes from.
  for (const r of recipes.filter((x) => x.language === "es")) {
    assert.ok(r.story?.source?.url, `${r.name} has a source`);
  }
});
