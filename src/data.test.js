import test from "node:test";
import assert from "node:assert/strict";
import { recommend, languages } from "./data.js";
const base = {
  language: "ca",
  region: "Barcelona, ES",
  level: 0,
  diet: "all",
  quick: false,
};

test("Catalan progression starts with a short dish, then recommends panellets", () => {
  const beginner = recommend(base)[0];
  const advanced = recommend({ ...base, level: 3 })[0];
  assert.equal(beginner.id, "tomato-bread");
  assert.equal(advanced.id, "panellets");
  assert.ok(advanced.minutes > beginner.minutes);
  assert.ok(advanced.steps.length > beginner.steps.length);
});
test("every offered region has a beginner path", () => {
  for (const l of languages)
    for (const region of l.regions) {
      const first = recommend({ ...base, language: l.id, region })[0];
      assert.ok(first, region);
      assert.equal(first.minLevel, 0, region);
      assert.ok(first.minutes <= 15, region);
    }
});
test("diet and time constraints are applied together with a useful empty state", () => {
  assert.deepEqual(
    recommend({ ...base, diet: "gluten-free", quick: true }),
    [],
  );
  const vegan = recommend({ ...base, diet: "vegan" });
  assert.ok(vegan.every((r) => r.tags.includes("vegan")));
  assert.ok(!vegan.some((r) => r.id === "panellets"));
});
test("Rio gets Brazilian sample dishes, not the Portugal-only recipes", () => {
  const ids = recommend({
    ...base,
    language: "pt",
    region: "Rio, BR",
    level: 3,
  }).map((r) => r.id);
  assert.equal(ids[0], "moqueca");
  assert.ok(ids.includes("vinagrete"));
  assert.ok(!ids.includes("caldo"));
});
