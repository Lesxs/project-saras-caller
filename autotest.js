(() => {
'use strict';
const $ = id => document.getElementById(id);
const state = { running:false, pcs:[], streams:[], raf:0, timer:0, statsTimer:0, started:0, samples:[], pings:[], frames:0, lastFrame:0, drawFrames:0, lastDraw:0, channel:null, pingTimer:0, pending:new Map(), pingId:0, logs:[] };
function log(message){const stamp=new Date().toLocaleTimeString();state.logs.push('['+stamp+'] '+message);$('log').textContent=state.logs.slice(-100).join('\n');}
function status(message,kind=''){ $('status').textContent=message; $('status').className='status '+kind; }
function waitIce(pc){if(pc.iceGatheringState==='complete')return Promise.resolve();return new Promise(resolve=>{const done=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',done);resolve();}};pc.addEventListener('icegatheringstatechange',done);setTimeout(resolve,8000);});}
function draw(ctx,w,h,ts){const t=ts/1000;ctx.fillStyle='#080d24';ctx.fillRect(0,0,w,h);const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#5865f2');g.addColorStop(1,'#20b7d5');ctx.fillStyle=g;const x=(Math.sin(t*1.7)+1)*.5*(w-170),y=(Math.cos(t*1.2)+1)*.5*(h-170);ctx.beginPath();ctx.arc(x+85,y+85,75,0,Math.PI*2);ctx.fill();ctx.fillStyle='white';ctx.font='bold '+Math.max(24,Math.round(w/22))+'px system-ui';ctx.fillText('S.A.R.A.S  •  '+Math.round(state.drawFrames)+' FPS',w*.06,h*.16);ctx.font=Math.max(16,Math.round(w/55))+'px system-ui';ctx.fillText(new Date().toLocaleTimeString(),w*.06,h*.23);}
function stopDrawing(){if(state.raf)cancelAnimationFrame(state.raf);state.raf=0;}
function cleanup(){stopDrawing();clearInterval(state.timer);clearInterval(state.statsTimer);clearInterval(state.pingTimer);state.pending.clear();for(const pc of state.pcs){try{pc.close();}catch{}}for(const stream of state.streams)for(const track of stream.getTracks())track.stop();state.pcs=[];state.streams=[];state.channel=null;$('preview').srcObject=null;state.running=false;$('start').disabled=false;$('stop').disabled=true;}
function average(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0;}
function percentile(a,p){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor((s.length-1)*p))];}
async function run(){
 if(state.running)return;
 if(!('RTCPeerConnection'in window)||!HTMLCanvasElement.prototype.captureStream){status('Este navegador não oferece os recursos necessários para o autotest. Use Chrome ou Edge atualizado.','bad');return;}
 state.running=true;state.started=Date.now();state.samples=[];state.pings=[];state.logs=[];state.frames=0;state.lastFrame=0;state.drawFrames=0;state.lastDraw=performance.now();state.pending.clear();
 $('start').disabled=true;$('stop').disabled=false;$('summary').textContent='Teste em andamento…';$('log').textContent='';['capture','decode','rtt','frames','drops','resolutionOut'].forEach(id=>$(id).textContent='—');
 let [w,h]=$('resolution').value.split('x').map(Number),target=Number($('fps').value),duration=Number($('duration').value)*60;
 try{
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});
  const drawLoop=ts=>{if(!state.running)return;draw(ctx,w,h,ts);state.drawFrames++;state.raf=requestAnimationFrame(drawLoop);};state.raf=requestAnimationFrame(drawLoop);
  const source=canvas.captureStream(target);state.streams.push(source);log('Fonte sintética iniciada: '+w+'x'+h+' a '+target+' FPS solicitados.');
  const a=new RTCPeerConnection({iceServers:[]}),b=new RTCPeerConnection({iceServers:[]});state.pcs=[a,b];
  a.oniceconnectionstatechange=()=>log('ICE transmissor: '+a.iceConnectionState);b.oniceconnectionstatechange=()=>log('ICE receptor: '+b.iceConnectionState);
  b.ontrack=e=>{const received=e.streams[0]||new MediaStream([e.track]);$('preview').srcObject=received;$('preview').play().catch(()=>{});log('Faixa de vídeo recebida pelo espectador local.');};
  const channel=a.createDataChannel('saras-autotest');state.channel=channel;
  channel.onopen=()=>{log('Canal de dados WebRTC conectado.');state.pingTimer=setInterval(()=>{if(channel.readyState!=='open')return;const id=++state.pingId;state.pending.set(id,performance.now());channel.send(String(id));},1000);};
  channel.onmessage=e=>{const id=Number(e.data),sent=state.pending.get(id);if(sent!==undefined){state.pings.push(performance.now()-sent);state.pending.delete(id);}};
  b.ondatachannel=e=>{e.channel.onmessage=m=>{if(e.channel.readyState==='open')e.channel.send(m.data);};};
  for(const track of source.getTracks())a.addTrack(track,source);
  const offer=await a.createOffer();await a.setLocalDescription(offer);await waitIce(a);await b.setRemoteDescription(a.localDescription);
  const answer=await b.createAnswer();await b.setLocalDescription(answer);await waitIce(b);await a.setRemoteDescription(b.localDescription);
  log('Negociação WebRTC local concluída.');status('Conexão local estabelecida. Medindo por '+duration/60+' minuto(s)…','good');
  const video=$('preview');
  const measure=async()=>{
   if(!state.running)return;
   const now=performance.now(),elapsed=(Date.now()-state.started)/1000;
   let decoded=0,dropped=0,received=0,rxWidth=0,rxHeight=0;
   try{const reports=await b.getStats();reports.forEach(r=>{if(r.type==='inbound-rtp'&&r.kind==='video'&&!r.isRemote){decoded=r.framesPerSecond||0;received=r.framesDecoded||0;dropped=r.framesDropped||0;rxWidth=r.frameWidth||0;rxHeight=r.frameHeight||0;}});}catch{}
   const capture=source.getVideoTracks()[0].getSettings().frameRate||0;
   const item={elapsed,capture,decoded,dropped,received,rtt:average(state.pings.slice(-5))};state.samples.push(item);
   $('capture').textContent=capture.toFixed(1);$('decode').textContent=decoded?decoded.toFixed(1):'…';$('rtt').textContent=state.pings.length?item.rtt.toFixed(1):'…';$('frames').textContent=received.toLocaleString();$('drops').textContent=dropped.toLocaleString();$('resolutionOut').textContent=rxWidth&&rxHeight?rxWidth+'×'+rxHeight:'…';
   if(elapsed>=duration)finish();
  };
  state.statsTimer=setInterval(measure,1000);state.timer=setInterval(()=>{const elapsed=Math.floor((Date.now()-state.started)/1000);status('Teste em andamento: '+Math.min(elapsed,duration)+'s / '+duration+'s','good');},1000);
  if('requestVideoFrameCallback'in video){const onFrame=()=>{if(!state.running)return;state.frames++;video.requestVideoFrameCallback(onFrame);};video.requestVideoFrameCallback(onFrame);}
 }catch(error){log('Falha: '+(error.message||error));status('O autotest encontrou uma falha: '+(error.message||error),'bad');$('summary').textContent='Teste não concluído. Consulte o registro de eventos.';cleanup();}
}
function finish(){
 if(!state.running)return;
 const samples=state.samples.slice(2),capture=average(samples.map(x=>x.capture)),decode=average(samples.map(x=>x.decoded).filter(x=>x>0)),rtt=average(state.pings),drop=samples.length?samples[samples.length-1].dropped:0,frames=samples.length?samples[samples.length-1].received:0;
 const stable=decode>=Number($('fps').value)*.85,connected=state.pcs.every(pc=>pc.connectionState==='connected'||pc.iceConnectionState==='connected');
 const result=stable&&connected?'Resultado: fluxo local estável durante a janela medida.':'Resultado: foram observadas limitações; consulte as métricas e o registro.';
 $('summary').textContent=result+' Média de captura: '+capture.toFixed(1)+' FPS; decodificação: '+decode.toFixed(1)+' FPS; RTT do canal local: '+rtt.toFixed(1)+' ms; quadros decodificados: '+frames.toLocaleString()+'.';
 status('Autotest concluído.','good');log('Fim do teste. Captura média '+capture.toFixed(1)+' FPS; decodificação média '+decode.toFixed(1)+' FPS; RTT médio '+rtt.toFixed(1)+' ms; quadros perdidos reportados '+drop+'.');
 cleanup();
}
$('start').addEventListener('click',run);$('stop').addEventListener('click',()=>{if(!state.running)return;log('Teste interrompido manualmente.');status('Teste interrompido.');$('summary').textContent='Teste interrompido antes do tempo previsto.';cleanup();});
window.addEventListener('pagehide',cleanup);
})();