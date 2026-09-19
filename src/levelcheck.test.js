import test from "node:test";
import assert from "node:assert/strict";
import {
  turnsFor, gradeReply, estimateLevel, shouldStopEarly, LEVEL_NAMES, acknowledgementsFor,
} from "./welcome/levelcheck.js";

const ca = turnsFor("ca");
const grade = (text, turn = ca[0], lang = "ca") => gradeReply(text, turn, lang);

test("silence scores zero", () => {
  assert.equal(grade("").score, 0);
  assert.equal(grade("   ").score, 0);
  assert.equal(grade(null).responded, false);
});

test("answering in your own language counts as understood, not produced", () => {
  const g = grade("I'm good thanks");
  assert.equal(g.usedTarget, false);
  assert.equal(g.score, 1, "understood the question but produced no Catalan");
});

test("a short target-language answer scores above an English one", () => {
  const short = grade("molt bé");
  assert.equal(short.usedTarget, true);
  assert.ok(short.score >= 2);
  assert.ok(short.score > grade("I'm good thanks").score);
});

test("a full target-language sentence scores highest", () => {
  const g = gradeReply("ahir vaig menjar una amanida amb pa", ca[2], "ca");
  assert.equal(g.usedTarget, true);
  assert.equal(g.score, 3);
});

test("mixing languages still counts as reaching for the target", () => {
  // Ties go to the target language: a learner stretching should not be penalised.
  const g = grade("estic bé thanks");
  assert.equal(g.usedTarget, true);
  assert.ok(g.score >= 2);
});

test("grading works for every supported language", () => {
  const it = turnsFor("it");
  const pt = turnsFor("pt");
  assert.equal(gradeReply("sto bene", it[0], "it").usedTarget, true);
  assert.equal(gradeReply("estou bem", pt[0], "pt").usedTarget, true);
  // A Portuguese answer should not read as Italian.
  assert.equal(gradeReply("estou bem", it[0], "it").usedTarget, false);
});

test("estimateLevel puts an all-English learner at Beginner", () => {
  const grades = [grade("good"), grade("I like to cook pasta"), grade("I ate soup yesterday")];
  const { level } = estimateLevel(grades);
  assert.equal(level, 0, "understanding is not production");
  assert.equal(LEVEL_NAMES[level], "Beginner");
});

test("estimateLevel puts a fluent learner at Advanced", () => {
  const grades = [
    gradeReply("estic molt bé gràcies", ca[0], "ca"),
    gradeReply("m'agrada cuinar arròs i verdures", ca[1], "ca"),
    gradeReply("ahir vaig menjar una truita amb pa", ca[2], "ca"),
  ];
  const { level } = estimateLevel(grades);
  assert.equal(level, 3);
  assert.equal(LEVEL_NAMES[level], "Advanced");
});

test("estimateLevel lands in the middle for short target answers", () => {
  const grades = [grade("bé"), grade("peix"), grade("sopar")];
  const { level } = estimateLevel(grades);
  assert.ok(level >= 1 && level <= 2, `expected Elementary or Intermediate, got ${LEVEL_NAMES[level]}`);
});

test("the check stops early instead of asking two more it knows will fail", () => {
  assert.equal(shouldStopEarly([grade("")]), true);
  assert.equal(shouldStopEarly([grade("bé")]), false);
  assert.equal(shouldStopEarly([grade(""), grade("")]), false, "only applies to the first turn");
  const { level, reason } = estimateLevel([grade("")]);
  assert.equal(level, 0);
  assert.match(reason, /beginning/i);
});

test("every level estimate explains itself without claiming a score", () => {
  for (const grades of [[grade("")], [grade("good")], [grade("bé")], [gradeReply("ahir vaig menjar pa amb tomàquet", ca[2], "ca")]]) {
    const { reason } = estimateLevel(grades);
    assert.ok(reason && reason.length > 10, "has a human reason");
    assert.doesNotMatch(reason, /CEFR|A1|B2|score|assessed/i, "never claims a formal level");
  }
});

test("each language has three turns, easiest first, and warm acknowledgements", () => {
  for (const id of ["ca", "it", "pt"]) {
    const turns = turnsFor(id);
    assert.equal(turns.length, 3, `${id} has three turns`);
    for (const t of turns) {
      assert.ok(t.target && t.en, `${id} turn has both languages`);
      assert.ok(t.expects.length, `${id} turn has expected content words`);
    }
    const ack = acknowledgementsFor(id);
    assert.ok(ack.strong && ack.some && ack.none, `${id} acknowledges every outcome`);
  }
});
