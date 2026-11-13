import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../autotest.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../autotest.js', import.meta.url), 'utf8');

test('autotest runs without camera, microphone, or external relay services', () => {
  assert.match(js, /canvas\.captureStream\(target\)/);
  assert.match(js, /new RTCPeerConnection\(\{iceServers:\[\]\}\)/);
  assert.doesNotMatch(js, /getUserMedia|ntfy\.sh|turn:/i);
});

test('autotest exposes duration, resolution, FPS and a stop control', () => {
  assert.match(html, /id="duration"/);
  assert.match(html, /id="resolution"/);
  assert.match(html, /id="fps"/);
  assert.match(html, /id="stop"/);
});
