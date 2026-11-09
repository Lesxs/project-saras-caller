const runtime = document.querySelector("#runtime");

if (window.__TAURI_INTERNALS__) {
  runtime.textContent = "Executando como aplicativo Windows";
  runtime.classList.add("runtime-ok");
} else {
  runtime.textContent = "Prévia de desenvolvimento no navegador";
}
