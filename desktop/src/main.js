import "./styles.css";

const pages = {
  home: { title: "Painel principal", element: document.querySelector("#page-home") },
  stream: { title: "Transmissão", element: document.querySelector("#page-stream") },
  settings: { title: "Configurações", element: document.querySelector("#page-settings") }
};
const crumb = document.querySelector("#crumb");
const frame = document.querySelector("#stream-frame");
const frameLoading = document.querySelector("#frame-loading");
let frameLoaded = false;

function showPage(name) {
  if (!pages[name]) return;
  Object.entries(pages).forEach(([key, page]) => {
    page.element.classList.toggle("active", key === name);
  });
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === name);
  });
  crumb.textContent = pages[name].title;
  if (name === "stream" && !frameLoaded) {
    frame.src = "./stream.html";
    frameLoaded = true;
  }
}

document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});
document.querySelectorAll("[data-open-stream]").forEach((button) => {
  button.addEventListener("click", () => showPage("stream"));
});
frame.addEventListener("load", () => {
  frameLoading.classList.add("hidden");
});

const effectsToggle = document.querySelector("#effects-toggle");
const savedEffects = localStorage.getItem("saras-effects");
if (savedEffects !== null) effectsToggle.checked = savedEffects === "true";
document.body.classList.toggle("effects-off", !effectsToggle.checked);
effectsToggle.addEventListener("change", () => {
  localStorage.setItem("saras-effects", String(effectsToggle.checked));
  document.body.classList.toggle("effects-off", !effectsToggle.checked);
});

const isTauri = Boolean(window.__TAURI_INTERNALS__);
document.body.classList.toggle("tauri-runtime", isTauri);
