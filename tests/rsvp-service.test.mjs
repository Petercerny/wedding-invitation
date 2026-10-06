import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRsvp, submitRsvp, STORAGE_KEY } from '../src/services/rsvp.ts';
const valid = { fullName: ' Alex Guest ', email: 'alex@example.com', attendance: 'accept', guests: 2, dietary: 'Vegetarian', message: 'Congratulations!' };
const values = new Map();
globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
test('required fields, email and guest boundaries', () => {
  assert.deepEqual(Object.keys(validateRsvp({ ...valid, fullName: '', email: 'broken', attendance: '' }, 6)).sort(), ['attendance', 'email', 'fullName']);
  assert.ok(validateRsvp({ ...valid, guests: 0 }, 6).guests);
  assert.ok(validateRsvp({ ...valid, guests: 7 }, 6).guests);
  assert.ok(validateRsvp({ ...valid, guests: 1.5 }, 6).guests);
  assert.deepEqual(validateRsvp(valid, 6), {});
});
test('successful response is stored with sanitized values and declines clear stale fields', async () => {
  values.clear();
  const result = await submitRsvp(valid, 6);
  let responses = JSON.parse(values.get(STORAGE_KEY));
  assert.equal(responses.length, 1);
  assert.equal(responses[0].id, result.id);
  assert.equal(responses[0].fullName, 'Alex Guest');
  assert.equal(responses[0].guests, 2);
  assert.ok(responses[0].submittedAt);
  await submitRsvp({ ...valid, attendance: 'decline', guests: 99 }, 6);
  responses = JSON.parse(values.get(STORAGE_KEY));
  assert.equal(responses.length, 2);
  assert.equal(responses[1].guests, 0);
  assert.equal(responses[1].dietary, '');
});
test('invalid submission and corrupted storage reject without claiming success', async () => {
  await assert.rejects(() => submitRsvp({ ...valid, email: '' }, 6), /check your response/);
  values.set(STORAGE_KEY, '{}');
  await assert.rejects(() => submitRsvp(valid, 6), /couldn’t save this demo response/);
  assert.equal(values.get(STORAGE_KEY), '{}');
});
