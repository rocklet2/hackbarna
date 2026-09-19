import test from "node:test";
import assert from "node:assert/strict";
import { matchLanguage, extractName, greetingFor, isSupported, SUPPORTED, COMING_SOON } from "./welcome/catalogue.js";

test("matchLanguage hears a language name in a spoken answer", () => {
  assert.equal(matchLanguage("catalan").id, "ca");
  assert.equal(matchLanguage("I'd like to cook in Catalan please").id, "ca");
  assert.equal(matchLanguage("Català").id, "ca", "endonym with accents");
  assert.equal(matchLanguage("italian").id, "it");
  assert.equal(matchLanguage("portuguese").id, "pt");
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

test("extractName strips the lead-in speech-to-text gives us", () => {
  assert.equal(extractName("Romina"), "Romina");
  assert.equal(extractName("my name is romina"), "Romina");
  assert.equal(extractName("i'm romina"), "Romina");
  assert.equal(extractName("call me romina"), "Romina");
  assert.equal(extractName("em dic romina"), "Romina");
});

test("extractName keeps accents and existing capitals", () => {
  assert.equal(extractName("José"), "José");
  assert.equal(extractName("my name is josé"), "José");
  assert.equal(extractName("McDonald"), "McDonald", "mixed case is left alone");
});

test("extractName rejects things that are not names", () => {
  assert.equal(extractName(""), null);
  assert.equal(extractName("   "), null);
  assert.equal(extractName("actually I would rather not say my name today"), null);
  assert.equal(extractName("?!"), null);
});

test("greetingFor uses the chosen language", () => {
  assert.equal(greetingFor("ca", "Romina"), "Hola, Romina!");
  assert.equal(greetingFor("it", "Romina"), "Ciao, Romina!");
  assert.equal(greetingFor("pt", "Romina"), "Olá, Romina!");
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
    assert.ok(lang.askName.target && lang.askName.en, `${lang.id} asks for a name`);
    assert.match(lang.greeting("Romina"), /Romina/, `${lang.id} greets by name`);
  }
});
