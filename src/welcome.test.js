import test from "node:test";
import assert from "node:assert/strict";
import { matchLanguage, greetingFor, isSupported, SUPPORTED, COMING_SOON } from "./welcome/catalogue.js";

test("matchLanguage hears a language name in a spoken answer", () => {
  assert.equal(matchLanguage("catalan").id, "ca");
  assert.equal(matchLanguage("I'd like to cook in Catalan please").id, "ca");
  assert.equal(matchLanguage("Català").id, "ca", "endonym with accents");
  assert.equal(matchLanguage("italian").id, "it");
  assert.equal(matchLanguage("portuguese").id, "pt");
  assert.equal(matchLanguage("Spanish").id, "es");
  assert.equal(matchLanguage("Español").id, "es", "endonym with accent");
});

test("Spanish is a taught language, not a coming-soon one", () => {
  assert.equal(isSupported("es"), true);
  assert.equal(COMING_SOON.some((l) => l.id === "es"), false);
});

test("matchLanguage also recognises languages we cannot teach yet", () => {
  // They must be recognised so we can say so honestly, rather than ignoring them.
  assert.equal(matchLanguage("japanese").id, "ja");
  assert.equal(isSupported("ja"), false);
});

test("matchLanguage returns null when no language was said", () => {
  assert.equal(matchLanguage("um what"), null);
  assert.equal(matchLanguage(""), null);
  assert.equal(matchLanguage(null), null);
});

test("greetingFor greets in the chosen language without needing a name", () => {
  // Nobody is asked for a name any more, so the bare greeting is the normal case.
  assert.equal(greetingFor("ca"), "Hola!");
  assert.equal(greetingFor("it"), "Ciao!");
  assert.equal(greetingFor("pt"), "Olá!");
  assert.equal(greetingFor("es"), "¡Hola!");
});

test("every catalogue entry is complete and unambiguous", () => {
  const ids = new Set();
  for (const lang of [...SUPPORTED, ...COMING_SOON]) {
    assert.ok(lang.id && lang.name && lang.endonym && lang.mark, `${lang.id} has display fields`);
    assert.ok(lang.aliases.length, `${lang.id} has aliases`);
    assert.equal(ids.has(lang.id), false, `${lang.id} appears once`);
    ids.add(lang.id);
  }
  for (const lang of SUPPORTED) {
    assert.ok(lang.greeting(), `${lang.id} has a greeting that stands alone`);
    assert.ok(lang.speech, `${lang.id} has a speech-recognition locale`);
  }
});
