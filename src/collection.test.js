import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, addEntry, normalizeEntries, streakInfo, milestoneStatus, setProgress, seedEntries, reminderIcs } from './collection/collection.js';
const T = '2026-09-19';
const e = (recipeId, day) => ({ recipeId, name: recipeId, language: 'ca', day, photo: null });
test('addDays crosses month and year ends', () => {
  assert.equal(addDays('2026-09-30', 1), '2026-10-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
});
test('consecutive days build a streak, and today counts', () => {
  const s = streakInfo(normalizeEntries([e('a', '2026-09-17'), e('b', '2026-09-18'), e('c', T)]), T);
  assert.equal(s.current, 3); assert.equal(s.cookedToday, true); assert.equal(s.atRisk, false);
  assert.deepEqual(s.week.map((d) => d.cooked), [false, false, false, false, true, true, true]);
});
test('a streak with nothing yet today is at risk, not lost; a missed day resets it', () => {
  const risk = streakInfo(normalizeEntries([e('a', '2026-09-17'), e('b', '2026-09-18')]), T);
  assert.equal(risk.current, 2); assert.equal(risk.atRisk, true);
  const lost = streakInfo(normalizeEntries([e('a', '2026-09-15'), e('b', '2026-09-16')]), T);
  assert.equal(lost.current, 0); assert.equal(lost.longest, 2); assert.equal(lost.atRisk, false);
});
test('two dishes on one day are one streak day, and the same dish twice replaces itself', () => {
  let list = addEntry([], e('a', T)); list = addEntry(list, e('b', T)); list = addEntry(list, { ...e('a', T), name: 'again' });
  assert.equal(list.length, 2);
  assert.equal(streakInfo(list, T).current, 1);
});
test('milestones are earned by the longest streak and point at the next one', () => {
  assert.equal(milestoneStatus(3).earned.length, 2);
  assert.deepEqual([milestoneStatus(3).next.days, milestoneStatus(3).toGo], [7, 4]);
  assert.equal(milestoneStatus(7).next, null);
});
test('set progress lists the dishes still to cook', () => {
  const p = setProgress([e('a', T)], [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  assert.deepEqual([p.have, p.total, p.missing.map((r) => r.id)], [1, 3, ['b', 'c']]);
});
test('seeded history is flagged, photo-less and ends yesterday', () => {
  const seeded = normalizeEntries(seedEntries([{ id: 'a', name: 'A', language: 'ca' }, { id: 'b', name: 'B', language: 'ca' }, { id: 'c', name: 'C', language: 'ca' }], T));
  assert.ok(seeded.every((x) => x.seeded && x.photo === null));
  assert.equal(seeded.at(-1).day, '2026-09-18');
  assert.equal(streakInfo(seeded, T).atRisk, true);
});
test('bad stored entries are dropped instead of crashing', () => {
  assert.deepEqual(normalizeEntries('nope'), []);
  assert.equal(normalizeEntries([{ recipeId: 'a', day: 'yesterday' }, null, e('b', T)]).length, 1);
});
test('the reminder is a valid daily calendar event', () => {
  const ics = reminderIcs({ start: new Date(2026, 8, 20, 18, 0), title: 'Cook', description: 'Two minutes', url: 'http://x' });
  assert.match(ics, /DTSTART:20260920T180000/); assert.match(ics, /RRULE:FREQ=DAILY;COUNT=7/); assert.match(ics, /^BEGIN:VCALENDAR/);
});
import { collectGate } from './collection/collection.js';
test('the photo check gates the collection, but only when it actually ran', () => {
  const base = { photo: 'data:x', checkable: true, added: false };
  assert.equal(collectGate({ ...base, photo: null }), 'need-photo');
  assert.equal(collectGate({ ...base, check: { status: 'loading' } }), 'checking');
  assert.equal(collectGate({ ...base, check: { status: 'ok', result: { overall: 'retake' } } }), 'blocked');
  assert.equal(collectGate({ ...base, check: { status: 'ok', result: { overall: 'fixable' } } }), 'ready');
  assert.equal(collectGate({ ...base, check: { status: 'error' } }), 'ready');
  assert.equal(collectGate({ ...base, checkable: false }), 'ready');
  assert.equal(collectGate({ ...base, added: true }), 'added');
});
