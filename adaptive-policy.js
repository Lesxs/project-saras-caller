(function (root) {
  'use strict';

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function evaluate(input) {
    const profileF = Math.max(1, number(input.profileF) || 60);
    const sourceF = Math.max(0, number(input.sourceF));
    const encodedF = Math.max(0, number(input.encodedF));
    const receivedF = Math.max(0, number(input.receivedF));
    const decodedF = Math.max(0, number(input.decodedF));
    const lossRate = Math.max(0, number(input.lossRate));
    const dropRate = Math.max(0, number(input.dropRate));
    const rtt = Math.max(0, number(input.rtt));
    const jitter = Math.max(0, number(input.jitter));
    const freezes = Math.max(0, number(input.freezes));
    const limitation = input.limitation || 'none';

    // A captura é o teto real. Não reduza a qualidade só porque a fonte
    // entregou menos quadros que a meta solicitada ao navegador.
    const effectiveTargetF = sourceF > 0 ? Math.min(profileF, sourceF) : profileF;
    const cpuLimited = limitation === 'cpu' ||
      (sourceF > 0 && encodedF > 0 && encodedF < sourceF * 0.88);
    const receiverBehindEncoder = encodedF > 0 && receivedF > 0 &&
      receivedF < encodedF * 0.84;
    const decoderLimited = receivedF > 0 && decodedF > 0 &&
      decodedF < receivedF * 0.84;
    const networkLimited = limitation === 'bandwidth' || receiverBehindEncoder ||
      lossRate > 0.035 || rtt > 450 || jitter > 0.055;

    const weak = cpuLimited || decoderLimited || networkLimited ||
      dropRate > 0.12 || freezes > 0;
    const strong = receivedF >= effectiveTargetF * 0.94 &&
      decodedF >= effectiveTargetF * 0.94 &&
      lossRate < 0.012 && dropRate < 0.035 &&
      (!rtt || rtt < 280) && jitter < 0.03 && freezes === 0 &&
      !cpuLimited && !decoderLimited && !networkLimited;

    return {
      weak: weak,
      strong: strong,
      effectiveTargetF: effectiveTargetF,
      cpuLimited: cpuLimited,
      receiverBehindEncoder: receiverBehindEncoder,
      decoderLimited: decoderLimited,
      networkLimited: networkLimited
    };
  }

  root.SARASAdaptivePolicy = Object.freeze({ evaluate: evaluate });
})(typeof window !== 'undefined' ? window : globalThis);
