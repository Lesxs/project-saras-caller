import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../adaptive-policy.js', import.meta.url), 'utf8');
const sandbox = {};
vm.runInNewContext(source, sandbox);
const evaluate = sandbox.SARASAdaptivePolicy.evaluate;

const healthy = {
  profileF: 60, sourceF: 60, encodedF: 60, receivedF: 60, decodedF: 60,
  lossRate: 0, dropRate: 0, rtt: 35, jitter: 0.006, freezes: 0, limitation: 'none'
};

test('não reduz qualidade quando a própria captura entrega 45 FPS estáveis', () => {
  const result = evaluate({ ...healthy, sourceF: 45, encodedF: 45, receivedF: 45, decodedF: 45 });
  assert.equal(result.weak, false);
  assert.equal(result.strong, true);
  assert.equal(result.effectiveTargetF, 45);
});

test('identifica gargalo quando o recebimento fica muito abaixo da codificação', () => {
  const result = evaluate({ ...healthy, receivedF: 40, decodedF: 40 });
  assert.equal(result.weak, true);
  assert.equal(result.networkLimited, true);
});

test('identifica gargalo de decodificação no espectador', () => {
  const result = evaluate({ ...healthy, decodedF: 35 });
  assert.equal(result.weak, true);
  assert.equal(result.decoderLimited, true);
});

test('identifica limitação de codificação quando o encoder fica atrás da captura', () => {
  const result = evaluate({ ...healthy, encodedF: 45, receivedF: 45, decodedF: 45 });
  assert.equal(result.weak, true);
  assert.equal(result.cpuLimited, true);
});

test('reconhece uma conexão saudável a 60 FPS', () => {
  const result = evaluate(healthy);
  assert.equal(result.weak, false);
  assert.equal(result.strong, true);
});
