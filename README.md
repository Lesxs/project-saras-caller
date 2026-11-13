# Project S.A.R.A.S Caller

Aplicação web estática para transmissão de tela e áudio via WebRTC.

## Desenvolvimento e validação

Requer Node.js 22 ou superior. Não há dependências npm de terceiros.

Comandos: npm run check, npm test, npm run build e npm run check:dist.

A build final é gerada em dist/. O GitHub Actions executa automaticamente essas verificações em pushes e pull requests. Como este repositório é público, os runners padrão do GitHub Actions são gratuitos.

## Limites técnicos conhecidos

- A transmissão de vídeo usa WebRTC P2P e uma conexão por espectador.
- A configuração atual usa STUN, sem TURN. Algumas combinações de NAT/firewall podem impedir a conexão direta.
- A solicitação de 60 FPS não garante 60 FPS capturados; captura, codificação, rede e decodificação são medidas separadamente.
- O diretório de lives usa tópicos públicos ntfy.sh. O código do grupo deve ser tratado como segredo.
- A validação automatizada verifica estrutura, sintaxe, recursos locais, política adaptativa e build. Ela não substitui um teste real entre transmissor e espectador em redes distintas.
