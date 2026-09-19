import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS, LEVEL_NAMES, matchLevel, levelById, levelQuestionFor,
} from "./welcome/levelcheck.js";

test("matchLevel hears a level in a spoken answer", () => {
  assert.equal(matchLevel("beginner").id, 0);
  assert.equal(matchLevel("I'm a complete beginner").id, 0);
  assert.equal(matchLevel("intermediate").id, 1);
  assert.equal(matchLevel("advanced").id, 2);
});

test("matchLevel understands how people actually answer", () => {
  assert.equal(matchLevel("nothing at all").id, 0);
  assert.equal(matchLevel("just a little").id, 0, "a few words still counts as a beginner");
  assert.equal(matchLevel("I'm okay").id, 1);
  assert.equal(matchLevel("pretty fluent").id, 2);
});

test("matchLevel returns null when no level was said", () => {
  assert.equal(matchLevel("what do you mean"), null);
  assert.equal(matchLevel(""), null);
  assert.equal(matchLevel(null), null);
});

test("the three levels line up with their names and are complete", () => {
  assert.equal(LEVELS.length, 3);
  assert.equal(LEVELS.length, LEVEL_NAMES.length);
  LEVELS.forEach((l, i) => {
    assert.equal(l.id, i, "id is the index, which the rest of the app relies on");
    assert.equal(l.name, LEVEL_NAMES[i]);
    assert.ok(l.detail, `${l.name} explains itself`);
    assert.ok(l.aliases.length, `${l.name} can be said out loud`);
    assert.equal(levelById(i).name, l.name);
  });
});

test("the level question is asked in both languages", () => {
  for (const id of ["ca", "it", "pt"]) {
    const q = levelQuestionFor(id);
    assert.ok(q.target && q.en, `${id} asks in both`);
  }
});

test("nothing claims this is a test or a CEFR level", () => {
  const copy = [...LEVELS.map((l) => `${l.name} ${l.detail}`),
    ...["ca", "it", "pt"].map((id) => levelQuestionFor(id).en)].join(" ");
  assert.doesNotMatch(copy, /CEFR|A1|B2|score|assessed|exam/i);
});
