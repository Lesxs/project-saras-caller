# S.A.R.A.S Desktop

Aplicativo Windows independente da versão publicada no GitHub Pages.

## Estrutura inicial

- Vite: servidor local e compilação da interface.
- Tauri 2: janela desktop e integração nativa.
- Rust: inicialização do aplicativo.
- GitHub Actions: compilação do instalador Windows.

## Compilar automaticamente

1. Abra a aba **Actions** do repositório.
2. Selecione **S.A.R.A.S Desktop — Windows**.
3. Clique em **Run workflow** e escolha a branch `desktop/tauri-bootstrap`.
4. Quando a execução terminar, abra o resultado e baixe o artefato `saras-windows-installer`.

Esta primeira versão é apenas a estrutura visual de inicialização. A transmissão ainda será integrada em etapas posteriores.
