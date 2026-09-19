import test from "node:test";
import assert from "node:assert/strict";
import { recipes } from "./data.js";
import {
  placesFor, matchPlace, matchPlan, PLANS, placeById, planById,
  placeQuestionFor,
} from "./welcome/places.js";

test("a place is only offered as ready when recipes exist for its cities", () => {
  for (const id of ["ca", "it", "pt"]) {
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

test("Pays Catalan is shown but honestly marked as not ready", () => {
  const pays = placeById("ca", "pays-catalan");
  assert.ok(pays, "it is still offered, because Catalan is spoken there");
  assert.equal(pays.ready, false, "we have no dishes for it yet");
  assert.equal(placeById("ca", "catalonia").ready, true);
});

test("matchPlace hears a place in a spoken answer", () => {
  assert.equal(matchPlace("Catalonia", "ca").id, "catalonia");
  assert.equal(matchPlace("I'd like to cook in Barcelona", "ca").id, "catalonia");
  assert.equal(matchPlace("Catalunya", "ca").id, "catalonia");
  assert.equal(matchPlace("bologna", "it").id, "emilia-romagna");
  assert.equal(matchPlace("brazil", "pt").id, "brazil");
});

test("matchPlace returns a place we cannot teach, so we can say so", () => {
  // Silently ignoring it would look broken; we need to answer honestly instead.
  const p = matchPlace("the french side", "ca") || matchPlace("perpignan", "ca");
  assert.equal(p.id, "pays-catalan");
  assert.equal(p.ready, false);
});

test("a longer place name beats a shorter one inside it", () => {
  assert.equal(matchPlace("northern catalonia", "ca").id, "pays-catalan");
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
  for (const id of ["ca", "it", "pt"]) {
    const q = placeQuestionFor(id);
    assert.ok(q.target && q.en, `${id} question has both languages`);
  }
});
