# S.A.R.A.S Desktop

Aplicativo Windows independente da versão publicada no GitHub Pages. O desktop reutiliza o fluxo de salas, descoberta e transmissão P2P do site para manter compatibilidade entre quem usa o aplicativo e quem usa o navegador.

## Versão 0.3.0 — integração inicial

- Interface de salas e lista de transmissões do projeto web.
- Código de grupo compartilhado com o site.
- Descoberta de transmissões por ntfy.
- Conexão de mídia P2P via PeerJS/WebRTC.
- Fluxo de entrada pública ou privada com aprovação do transmissor.
- Controles de qualidade e reconexão herdados do projeto web.
- Captura de tela e microfone pela WebView2 do Windows.

## Dependências de rede

- PeerJS 1.5.4 é carregado do jsDelivr.
- ntfy.sh é usado para descoberta e sinalização leve das salas.
- A mídia é enviada diretamente entre os participantes por WebRTC quando a rede permite. Não há servidor de retransmissão TURN/SFU configurado nesta etapa; algumas redes restritivas podem impedir a conexão direta.

## Compilar automaticamente

1. Abra a aba **Actions** do repositório.
2. Selecione **S.A.R.A.S Desktop — Windows**.
3. Clique em **Run workflow** e escolha a branch `desktop/tauri-bootstrap`.
4. Quando a execução terminar, abra o resultado e baixe o artefato `saras-windows-installer`.

O instalador desta etapa é uma versão de teste. A integração ainda precisa ser validada em transmissões reais entre o desktop e o navegador, incluindo áudio, estabilidade, FPS e consumo de recursos. O site principal não foi alterado.
