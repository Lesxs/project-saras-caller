import "./styles.css";

const $ = (id) => document.getElementById(id);
const runtime = $("runtime");
const screenPreview = $("screen-preview");
const previewEmpty = $("preview-empty");
let screenStream = null;
let micStream = null;

const inDesktop = Boolean(window.__TAURI_INTERNALS__);
runtime.textContent = inDesktop ? "Executando como aplicativo Windows" : "Prévia de desenvolvimento no navegador";
runtime.classList.toggle("runtime-ok", inDesktop);

function showResult(id, message, kind = "") {
  const el = $(id);
  el.textContent = message;
  el.className = "result" + (kind ? " " + kind : "");
}

function stopTracks(stream) {
  if (stream) stream.getTracks().forEach((track) => track.stop());
}

function stopScreen() {
  stopTracks(screenStream);
  screenStream = null;
  screenPreview.srcObject = null;
  previewEmpty.hidden = false;
  $("screen-start").disabled = false;
  $("screen-stop").disabled = true;
  showResult("screen-result", "Captura encerrada.");
}

function stopMic() {
  stopTracks(micStream);
  micStream = null;
  $("mic-start").disabled = false;
  $("mic-stop").disabled = true;
  $("mic-state").textContent = "Microfone não está em uso";
  $("mic-detail").textContent = "Teste encerrado.";
  showResult("mic-result", "Microfone liberado.");
}

$("screen-start").addEventListener("click", async () => {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    showResult("screen-result", "A captura de tela não está disponível neste ambiente.", "error");
    return;
  }
  $("screen-start").disabled = true;
  showResult("screen-result", "Aguardando você escolher uma tela ou janela…");
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    screenPreview.srcObject = screenStream;
    previewEmpty.hidden = true;
    $("screen-stop").disabled = false;
    const videoTrack = screenStream.getVideoTracks()[0];
    const audioTracks = screenStream.getAudioTracks();
    const settings = videoTrack?.getSettings?.() || {};
    const dimensions = settings.width && settings.height ? `${settings.width} × ${settings.height}` : "resolução não informada";
    showResult("screen-result", `Captura ativa · ${dimensions} · ${audioTracks.length ? "áudio disponibilizado pela fonte" : "a fonte escolhida não disponibilizou áudio"}`, "success");
    screenStream.getTracks().forEach((track) => {
      track.addEventListener("ended", () => {
        if (screenStream) stopScreen();
      }, { once: true });
    });
  } catch (error) {
    $("screen-start").disabled = false;
    const message = error?.name === "NotAllowedError" ? "Captura cancelada ou permissão negada." : `Não foi possível capturar: ${error?.message || error?.name || "erro desconhecido"}`;
    showResult("screen-result", message, "error");
  }
});

$("screen-stop").addEventListener("click", stopScreen);

$("mic-start").addEventListener("click", async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    showResult("mic-result", "O acesso ao microfone não está disponível neste ambiente.", "error");
    return;
  }
  $("mic-start").disabled = true;
  showResult("mic-result", "Solicitando permissão para acessar o microfone…");
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false
    });
    const track = micStream.getAudioTracks()[0];
    $("mic-stop").disabled = false;
    $("mic-state").textContent = "Microfone acessado com sucesso";
    $("mic-detail").textContent = track?.label || "Dispositivo de áudio autorizado.";
    showResult("mic-result", "Permissão concedida. O áudio não está sendo transmitido.", "success");
    track?.addEventListener("ended", () => {
      if (micStream) stopMic();
    }, { once: true });
  } catch (error) {
    $("mic-start").disabled = false;
    const message = error?.name === "NotAllowedError" ? "Permissão negada. Verifique as permissões de microfone do Windows." : `Não foi possível acessar o microfone: ${error?.message || error?.name || "erro desconhecido"}`;
    $("mic-state").textContent = "Falha ao acessar o microfone";
    $("mic-detail").textContent = error?.name || "Erro";
    showResult("mic-result", message, "error");
  }
});

$("mic-stop").addEventListener("click", stopMic);
window.addEventListener("beforeunload", () => {
  stopTracks(screenStream);
  stopTracks(micStream);
});
