// Conversation content lives in content/catalonia.json (recipes[panellets].conversation and glossary),
// the single source of truth shared with the Taula menu/lesson prototype (src/data.js).
// ALL CATALAN IS UNREVIEWED: a Catalan speaker must check every string before a public demo.
//
// Turn kinds: "ready" (any reply moves on), "word" (needs one of `accepts`),
// "photo" (optional photo, any reply moves on), "end" (summary).
import catalonia from "../../content/catalonia.json" with { type: "json" };

export const GLOSSARY = catalonia.glossary;
export const TURNS = catalonia.recipes.find((r) => r.id === catalonia.demo_dish).conversation;

export const READY_WORDS = ["si", "sí", "yes", "ok", "okay", "vinga", "ja", "fet", "done", "ready", "tinc", "yeah", "yep"];
export const REPEAT_WORDS = ["repeat", "repeteix", "again", "what", "que", "què", "otra", "huh"];
