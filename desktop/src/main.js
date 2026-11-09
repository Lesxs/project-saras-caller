import "./styles.css";

const pages = {
  home: { title: "Painel principal", element: document.querySelector("#page-home") },
  stream: { title: "Transmissão", element: document.querySelector("#page-stream") },
  settings: { title: "Configurações", element: document.querySelector("#page-settings") }
};
const crumb = document.querySelector("#crumb");
const frame = document.querySelector("#stream-frame");
const frameLoading = document.querySelector("#frame-loading");
let streamPageRequested = false;

function showPage(name) {
  const selected = pages[name];
  if (!selected) return;

  for (const [key, page] of Object.entries(pages)) {
    page.element.classList.toggle("active", key === name);
  }
  document.querySelectorAll(".nav-item").forEach((button) => {
    const active = button.dataset.page === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  crumb.textContent = selected.title;

  if (name === "stream" && !streamPageRequested) {
    frameLoading.classList.remove("hidden");
    frame.src = new URL("stream.html", window.location.href).href;
    streamPageRequested = true;
  }
}

document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    showPage(button.dataset.page);
  });
});
document.querySelectorAll("[data-open-stream]").forEach((button) => {
  button.addEventListener("click", () => showPage("stream"));
});
frame.addEventListener("load", () => frameLoading.classList.add("hidden"));
frame.addEventListener("error", () => {
  frameLoading.classList.add("hidden");
  streamPageRequested = false;
});

const effectsToggle = document.querySelector("#effects-toggle");
const savedEffects = localStorage.getItem("saras-effects");
if (savedEffects !== null) effectsToggle.checked = savedEffects === "true";
document.body.classList.toggle("effects-off", !effectsToggle.checked);
effectsToggle.addEventListener("change", () => {
  localStorage.setItem("saras-effects", String(effectsToggle.checked));
  document.body.classList.toggle("effects-off", !effectsToggle.checked);
});

document.body.classList.toggle("tauri-runtime", Boolean(window.__TAURI_INTERNALS__));
