const socket=io(),$=id=>document.getElementById(id);let role='',state=null,pid='',hostToken='',playerToken='',hintText='',lastPhaseId=0,roomHidden=false,serverOffset=0,lastFollowKey="",resumePending=false;
$('openAnswerMonitorTop').onclick=()=>openAnswerMonitor();
$('toggleRoom').onclick=()=>{roomHidden=!roomHidden;$('setupPanel').classList.toggle('hidden',roomHidden);$('toggleRoom').textContent=roomHidden?'Show Room & Question Set':'Hide Room & Question Set'};
const colors=['Red','Orange','Yellow','Green','Light Blue','Blue','Purple','Pink','Black','White'],shapes=['Circle','Square','Triangle','Star','Heart','Hexagon','Diamond'];const hex={Red:'#ed4252',Orange:'#f48b37',Yellow:'#f5db43',Green:'#32ba78','Light Blue':'#7bcefc',Blue:'#3973f3',Purple:'#a371e7',Pink:'#f590bd',Black:'#191919',White:'#fff'};const bg={green:'#65b879',blue:'#5c91e8',burgundy:'#843c59',pink:'#f0a6ca',yellow:'#e7d97c','light green':'#b4e68a',white:'#fff',orange:'#eaa25e','light blue':'#8fc5ee',scarlet:'#ef6060',red:'#ef6060',purple:'#a37be0',black:'#222'};let board=[];let clockSamples=[],visualRollKey='',lastWinner='',rollAnimation=null,movementKey='',movementTimers=[],victoryTimer=null,victoryKey='',victoryShownKey='';
function syncClock(){if(!socket.connected)return;const start=Date.now();socket.emit('clockSync',start,r=>{if(!r)return;const end=Date.now();const rtt=end-start;clockSamples.push({offset:r.serverTime-(start+end)/2,rtt});clockSamples.sort((a,b)=>a.rtt-b.rtt);clockSamples=clockSamples.slice(0,12);serverOffset=clockSamples[0].offset})}
socket.on('connect',()=>{syncClock();setTimeout(syncClock,400)});setInterval(syncClock,4000);
function fanfare(){try{const ctx=new (window.AudioContext||window.webkitAudioContext)();[523,659,784,1046].forEach((hz,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.value=hz;gain.gain.setValueAtTime(0.0001,ctx.currentTime+i*.2);gain.gain.exponentialRampToValueAtTime(.25,ctx.currentTime+i*.2+.04);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+i*.2+.32);osc.connect(gain).connect(ctx.destination);osc.start(ctx.currentTime+i*.2);osc.stop(ctx.currentTime+i*.2+.35)});setTimeout(()=>ctx.close(),2000)}catch{}for(let i=0;i<110;i++){const el=document.createElement('span');el.className='confettiPiece';el.textContent=['◆','●','★','■'][i%4];el.style.left=Math.random()*100+'vw';el.style.color=['#ffe17a','#fff','#d0d0d0','#f2a747','#8b8b8b'][i%5];el.style.fontSize=(9+Math.random()*17)+'px';el.style.setProperty('--duration',(4+Math.random()*4)+'s');el.style.setProperty('--drift',(Math.random()-.5)*250+'px');el.style.setProperty('--spin',(Math.random()*1500-750)+'deg');document.body.appendChild(el);setTimeout(()=>el.remove(),8500)}}
const DICE_DURATION=1050,STEP_DURATION=260;
function centerSpace(n){const el=$('board'),cell=el.querySelector(`[data-space="${n}"]`);if(cell)el.scrollTo({left:Math.max(0,cell.offsetLeft-el.offsetLeft-(el.clientWidth-cell.clientWidth)/2),behavior:'smooth'});}
function animateMovement(s){if(role!=='host'||!s.roll||s.roll.overshot||s.roll.landed==null)return;const key=[s.phaseId,s.roll.player,s.roll.landed,s.roll.amount].join(':');if(key===movementKey)return;movementKey=key;movementTimers.forEach(clearTimeout);movementTimers=[];const dest=s.roll.landed,origin=Math.max(0,dest-s.roll.amount),steps=dest-origin;if(!steps)return;
 const mover=s.players.find(p=>p.id===s.roll.player);const movingToken=token(mover);const boardEl=$('board');
 // Hide the final token until the animation reaches its destination.
 const finalToken=boardEl.querySelector(`[data-space="${dest}"] .tokens`);if(finalToken)finalToken.classList.add('pendingMovement');
 for(let i=0;i<=steps;i++)movementTimers.push(setTimeout(()=>{boardEl.querySelectorAll('.movingTarget').forEach(e=>e.classList.remove('movingTarget'));boardEl.querySelectorAll('.motionGhost').forEach(e=>e.remove());const cell=boardEl.querySelector(`[data-space="${origin+i}"]`);if(cell){cell.classList.add('movingTarget');const ghost=document.createElement('span');ghost.className='motionGhost';ghost.innerHTML=movingToken;cell.appendChild(ghost);centerSpace(origin+i)}if(i===steps&&finalToken)finalToken.classList.remove('pendingMovement')},DICE_DURATION+200+i*STEP_DURATION));
 movementTimers.push(setTimeout(()=>{boardEl.querySelectorAll('.movingTarget').forEach(e=>e.classList.remove('movingTarget'));boardEl.querySelectorAll('.motionGhost').forEach(e=>e.remove());if(finalToken)finalToken.classList.remove('pendingMovement')},DICE_DURATION+550+steps*STEP_DURATION));}
function animateRoll(s){if(!s.roll||(role!=='host'&&!(role==='player'&&pid===s.roll.player)))return;const key=[s.phaseId,s.roll.player,s.roll.die,s.roll.amount,s.roll.overshot].join(':');if(key===visualRollKey)return;visualRollKey=key;const die=$('die');die.classList.add('rolling');let count=0;clearInterval(rollAnimation);rollAnimation=setInterval(()=>{die.textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][Math.floor(Math.random()*6)];if(++count>=14){clearInterval(rollAnimation);die.classList.remove('rolling');die.textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][s.roll.die-1]}},DICE_DURATION/14)}
let lastSwapId='';function animateSwap(s){if(role!=='host'||!s.swapEvent||s.swapEvent.id===lastSwapId)return;lastSwapId=s.swapEvent.id;const e=s.swapEvent,boardEl=$('board');const cells=[e.fromA,e.fromB,e.toA,e.toB].map(n=>boardEl.querySelector(`[data-space="${n}"]`));cells.forEach(c=>c?.classList.add('swapFlash'));const a=s.players.find(p=>p.id===e.a),b=s.players.find(p=>p.id===e.b);const banner=document.createElement('div');banner.className='swapAnnouncement';banner.textContent=`⇄ ${a?.name||'Player'} SWAPS WITH ${b?.name||'Player'} ⇄`;document.body.appendChild(banner);setTimeout(()=>{cells.forEach(c=>c?.classList.remove('swapFlash'));banner.remove()},2100);centerSpace(e.toA);setTimeout(()=>centerSpace(e.toB),900)}
let lastHintNoticeId='';socket.on('hintUsedNotice',e=>{if(role!=='host'||!e||e.id===lastHintNoticeId)return;lastHintNoticeId=e.id;const popup=document.createElement('div');popup.className='hintUsedPopup';popup.textContent=`${e.name} used a Hint!`;document.body.appendChild(popup);setTimeout(()=>popup.remove(),3600)});
let lastPiggySelectionId='';function showPiggySelection(s){const e=s.piggySelectionEvent;if(!e||e.id===lastPiggySelectionId)return;lastPiggySelectionId=e.id;if(role!=='host'&&!(role==='player'&&pid===e.carrier))return;const popup=document.createElement('div');popup.className='piggySelectionPopup';popup.textContent=role==='host'?`${e.riderName} hopped on ${e.carrierName}'s back!`:"You've got a Piggy on your back!";document.body.appendChild(popup);setTimeout(()=>popup.remove(),3800)}
function abilityBadge(type){const icons={'Add 3':'+3','Add 2':'+2','Double':'×2','Choose':'◎','Piggy Back':'🐽','Head Start':'⏱','Hint':'💡','Solo':'♟','Locked Out':'🔒'};const labels={'Add 3':'Add 3 to next roll','Add 2':'Add 2 to next roll','Double':'Double next roll','Choose':'Choose next roll','Piggy Back':'Piggy Back active','Head Start':'Head Start','Hint':'Hint available','Solo':'Solo question','Locked Out':'Locked out next question'};return `<span class="abilityIcon ability${type.replace(/[^a-z0-9]/gi,'')}" title="${labels[type]}" aria-label="${labels[type]}">${icons[type]||'?'}</span>`}

const spaceSymbols={'Double':'×2','Add 2':'+2','Add 3':'+3','Choose':'🎯','Piggy Back':'🐖','Head Start':'⏱','Hint':'💡','Swap':'🔄','Solo':'♟','Locked Out':'🔒'};
fetch('/board.json').then(r=>r.json()).then(x=>{board=x;render()});
colors.forEach(c=>$('color').add(new Option(c,c)));shapes.forEach(c=>$('shape').add(new Option(c,c)));
function err(s){$('error').textContent=s;setTimeout(()=>$('error').textContent='',6000)}socket.on('errorMsg',err);
function remember(o){sessionStorage.setItem('triviaRace',JSON.stringify(o));if(o.role==='host'||!localStorage.getItem('triviaRace'))localStorage.setItem('triviaRace',JSON.stringify(o))}function attachHost(code,token){role='host';hostToken=token;remember({role,code,token});$('entry').classList.add('hidden');$('game').classList.remove('hidden');$('hostSetup').classList.remove('hidden')}
function attachPlayer(code,token,id){role='player';playerToken=token;pid=id;remember({role,code,token,id,name:$('name').value});$('entry').classList.add('hidden');$('game').classList.remove('hidden')}
$('hostOption').onclick=()=>{$('hostEntry').classList.remove('hidden');$('playerEntry').classList.add('hidden')};$('playerOption').onclick=()=>{$('playerEntry').classList.remove('hidden');$('hostEntry').classList.add('hidden')};
$('create').onclick=()=>socket.emit('create',{},r=>r?.code?attachHost(r.code,r.token):err(r?.error||'Could not create lobby'));
$('code').addEventListener('input',()=>{const field=$('code');const start=field.selectionStart,end=field.selectionEnd;field.value=field.value.toUpperCase();if(start!==null&&end!==null)field.setSelectionRange(start,end)});
$('join').onclick=()=>socket.emit('join',{code:$('code').value.toUpperCase(),name:$('name').value,color:$('color').value,shape:$('shape').value},r=>r.error?err(r.error):attachPlayer($('code').value.toUpperCase(),r.token,r.id));
function resumeSession(){
 if(!socket.connected||resumePending)return;
 let o;try{o=JSON.parse(sessionStorage.getItem('triviaRace')||localStorage.getItem('triviaRace')||'null')}catch{return}
 if(!o?.code||!o?.token)return;
 resumePending=true;
 const done=r=>{
  resumePending=false;
  if(r?.ok){if(o.role==='host')attachHost(o.code,o.token);else attachPlayer(o.code,r.token,r.id);$('error').textContent='';return}
  // Never delete credentials on a temporary server outage or lost lobby.
  // Keep the game visible and let Socket.IO retry on reconnect.
  if(r?.retryable||String(r?.error||'').includes('Lobby not found')){
   err(r.error+' Your saved session is preserved. Reconnect after the server recovers.');return;
  }
  // Even on a credential mismatch, do not destroy the stored token automatically:
  // another tab may have briefly replaced the active session.
  err(r?.error||'Could not reconnect. Your saved session has been preserved.');
 };
 if(o.role==='host')socket.emit('hostJoin',{code:o.code,token:o.token},done);
 else socket.emit('join',{code:o.code,name:o.name,token:o.token},done);
}
socket.on('connect',resumeSession);socket.on('disconnect',()=>{if(role==='host')err('Connection interrupted — reconnecting automatically. Host credentials are saved.')});
socket.on('home',()=>{localStorage.removeItem('triviaRace');sessionStorage.removeItem('triviaRace');location.reload()});socket.on('privateHint',x=>{hintText=x;render()});socket.on('state',s=>{if(s.serverTime&&!clockSamples.length)serverOffset=s.serverTime-Date.now();if(s.phaseId!==lastPhaseId){hintText='';lastPhaseId=s.phaseId}state=s;render()});
$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;const bytes=new Uint8Array(await f.arrayBuffer());let str='';for(let i=0;i<bytes.length;i++)str+=String.fromCharCode(bytes[i]);socket.emit('upload',{data:btoa(str),name:f.name},r=>{const info=$('uploadInfo');if(r.error){info.style.color='#ff8998';info.textContent='UPLOAD REJECTED\n'+r.error;err('Question validation failed')}else{info.style.color='#7de5ae';info.textContent=`✓ Validated ${r.count} questions in ${r.setName}\n${r.used} previously used · ${r.remaining} currently unused`}})};
function token(p){const symbol={Circle:'●',Square:'■',Triangle:'▲',Star:'★',Heart:'♥',Hexagon:'⬣',Diamond:'◆'}[p.shape]||'●';return `<span class="token" title="${escapeHtml(p.name)}" style="color:${hex[p.color]};${p.color==='White'?'text-shadow:0 0 3px #000':''}">${symbol}</span>`}function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function btn(label,fn,cls=''){const b=document.createElement('button');b.textContent=label;b.className=cls;b.onclick=fn;return b}function add(parent,label,fn,cls){parent.appendChild(btn(label,fn,cls))}

const leaderboardColumns=[['place','🏆','Place'],['name','👤','Player'],['questions','❓','Questions'],['pos','🏁','Final Position'],['spacesMoved','🏃','Spaces Moved'],['blankSpaces','🟨','Blank Spaces'],['extraMovement','➕','Extra Movement'],['chooseSpaces','🎯','Choose Spaces'],['chosenMovement','🎯👣','Chosen Movement'],['hints','💡','Hints Used'],['swaps','🔄','Swaps'],['piggyBacks','🐖','Piggy Backs'],['piggyBackDistance','🐖👣','Piggy Back Distance'],['ridesGiven','🚕','Rides Given'],['rideDistance','🚕👣','Ride Distance'],['headStarts','⏱','Head Starts'],['solos','♟','Solos'],['lockOuts','🔒','Lock Outs'],['overshoots','⏩','Overshoots']];
let leaderboardKey='',leaderboardTimer=null,leaderboardVisible=false;let boardOverview=false,boardFocus=null,lastAutoZoomRoll='';
function applyBoardZoom(){const b=$('board');b.classList.toggle('boardOverview',role==='host'&&boardOverview);$('zoomOut').disabled=boardOverview;$('zoomIn').disabled=!boardOverview;}
function focusHostPlayer(id){if(role!=='host'||!state)return;const p=state.players.find(x=>x.id===id);if(!p)return;boardOverview=false;boardFocus=id;applyBoardZoom();requestAnimationFrame(()=>centerSpace(p.pos));}
$('zoomOut').onclick=()=>{if(role!=='host')return;boardOverview=true;boardFocus=null;applyBoardZoom();$('board').scrollLeft=0};
$('zoomIn').onclick=()=>{if(role!=='host')return;boardOverview=false;boardFocus=null;applyBoardZoom();requestAnimationFrame(()=>centerSpace(Math.max(0,...(state?.players||[]).map(p=>p.pos))))};
function showLeaderboard(){if(!state||state.phase!=='winner'||!state.leaderboard)return;leaderboardVisible=true;$('winner').classList.add('hidden');$('leaderboard').classList.remove('hidden');$('leaderReopen').classList.add('hidden');}
function renderLeaderboard(s){if(!s.leaderboard)return;const key=s.code+':'+s.phaseId+':'+s.winner;if(leaderboardKey===key)return;leaderboardKey=key;leaderboardVisible=false;$('leaderboard').classList.add('hidden');$('leaderHead').innerHTML='<tr>'+leaderboardColumns.map(([k,icon,label])=>`<th tabindex="0" title="${label}" aria-label="${label}"><span class="leaderIcon">${icon}</span><span class="leaderTooltip">${label}</span></th>`).join('')+'</tr>';$('leaderBody').innerHTML=s.leaderboard.map(p=>'<tr>'+leaderboardColumns.map(([key])=>'<td>'+(key==='place'?(['🥇','🥈','🥉'][p.place-1]||'🏅')+' '+p.place+(p.place===1?'st':p.place===2?'nd':p.place===3?'rd':'th'):key==='name'?token(p)+' '+escapeHtml(p.name):Number(p[key]||0))+'</td>').join('')+'</tr>').join('');}
$('leaderClose').onclick=()=>{$('leaderboard').classList.add('hidden');leaderboardVisible=false;if(state?.phase==='winner')$('leaderReopen').classList.remove('hidden');};
$('leaderReopen').onclick=showLeaderboard;

function render(){if(!state||!board.length)return;document.body.classList.toggle('playerMode',role==='player');document.body.classList.toggle('hostMode',role==='host');const s=state,me=s.players.find(p=>p.id===pid);showPiggySelection(s);updateQuestionStatus(s,me);$('room').textContent=`ROOM CODE: ${s.code}`;$('setupToggleWrap').classList.toggle('hidden',role!=='host');$('setupPanel').classList.toggle('hidden',role==='player'&&s.phase!=='lobby'||role==='host'&&roomHidden);$('hostSetup').classList.toggle('hidden',role!=='host'||s.phase!=='lobby'&&s.phase!=='exhausted');$('identity').innerHTML=role==='host'?'HOST':me?token(me)+' '+escapeHtml(me.name):'';$('status').textContent=s.phase.toUpperCase()+` · ${s.remaining} questions remaining`;$('players').innerHTML=[...s.players].sort((a,b)=>b.pos-a.pos).map(p=>`<div class="player" ${role==='host'?`data-focus-player="${p.id}" tabindex="0" title="Focus board on ${escapeHtml(p.name)}"`: ''}>${token(p)} ${escapeHtml(p.name)} · ${p.pos} spaces ${p.connected?'🟢':'⚪'} ${s.players.some(x=>x.pig===p.id)?'<span title="Being piggybacked on">🐷</span>':''} ${role==='host'&&s.phase==='lobby'?`<button class="danger" data-remove="${p.id}">Remove</button>`:''}</div>`).join('');document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=e=>{e.stopPropagation();socket.emit('remove',b.dataset.remove)});document.querySelectorAll('[data-focus-player]').forEach(el=>{el.onclick=()=>focusHostPlayer(el.dataset.focusPlayer);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();focusHostPlayer(el.dataset.focusPlayer)}}});
if(role==='host'&&s.phase==='roll'&&s.roller){const rollFocusKey=s.phaseId+':'+s.roller;if(rollFocusKey!==lastRollFocusKey){lastRollFocusKey=rollFocusKey;boardOverview=false;boardFocus=null;applyBoardZoom();requestAnimationFrame(()=>centerSpace(s.players.find(p=>p.id===s.roller)?.pos??0));}}$('board').innerHTML=board.map(c=>{const background=c.type==='Start'?'#85858a':c.type==='Hint'?'#50c878':c.color==='black & white checkered'?'repeating-conic-gradient(#fff 0% 25%,#333 0% 50%) 50% / 30px 30px':bg[c.color.toLowerCase()]||'#ddd';const ps=s.players.filter(p=>p.pos===c.n);return `<div data-space="${c.n}" data-type="${escapeHtml(c.type)}" class="space ${s.roll&&!s.roll.overshot&&s.roll.landed===c.n?'landing':''}" style="background:${background};${['black & white checkered','burgundy','blue'].includes(c.color)?'color:white;':''}"><small class="spaceNum">${c.n}</small><span class="spaceName">${c.type==='Start'?'START <span class="startArrow">➜</span>':spaceSymbols[c.type]?`<span class="spaceSymbol">${spaceSymbols[c.type]}</span>`:c.type==='Goal'?'GOAL':c.type==='Blank Space'?'':escapeHtml(c.type)}</span><div class="tokens">${ps.map(token).join('')}</div></div>`}).join('');
applyBoardZoom();if(role==='host'&&s.phase==='roll'&&s.roller)requestAnimationFrame(()=>centerSpace(s.players.find(p=>p.id===s.roller)?.pos??0));if(role==='host'&&s.roll&&['moved','choice','winner','tiebreak'].includes(s.phase)){const rk=[s.phaseId,s.roll.player,s.roll.die,s.roll.landed].join(':');if(rk!==lastAutoZoomRoll){lastAutoZoomRoll=rk;boardOverview=false;boardFocus=null;applyBoardZoom();}}$('piggyNotice').classList.toggle('hidden',!s.roll?.piggyEvent||!['moved','choice','winner','tiebreak'].includes(s.phase));$('piggyNotice').textContent=s.roll?.piggyEvent?`${s.roll.piggyEvent.name} piggybacked ${s.roll.piggyEvent.spaces} spaces!`:'';
$('landed').classList.toggle('hidden',!s.roll||!['moved','choice','winner','tiebreak'].includes(s.phase));$('landed').textContent=s.roll?.overshot?`${s.players.find(p=>p.id===s.roll.player)?.name||'Player'} Overshot the GOAL!`:s.roll?`${s.players.find(p=>p.id===s.roll.player)?.name||'Player'} landed on space ${s.roll.landed??'?'} — ${board[s.roll.landed]?.type||'Goal'}!`:'';
$('questionWrap').classList.toggle('hidden',!['question','reveal'].includes(s.phase));$('question').textContent=s.question?.question||'';$('qid').textContent=s.question?'Question '+s.questionNumber:'';const questionImage=$('questionImage');const imageUrl=s.question?.image||'';if(imageUrl&&/^https?:\/\//i.test(imageUrl)){if(questionImage.getAttribute('src')!==imageUrl)questionImage.src=imageUrl;questionImage.classList.remove('hidden')}else{questionImage.classList.add('hidden');questionImage.removeAttribute('src')}$('answer').classList.toggle('hidden',s.phase!=='reveal');$('answer').textContent=s.answer||'';$('queue').innerHTML=s.queue.map(id=>{const p=s.players.find(x=>x.id===id);return `<p class="${p?.wrong?'strike':''} ${s.active===id?'active':''}">${token(p)} ${escapeHtml(p.name)} <span class="buzzTime">${Number.isFinite(s.queueTimes?.[id])?Math.max(0,s.queueTimes[id])+' ms':''}</span> ${s.active===id?'← ANSWERING':''}</p>`}).join('')||'<span class="muted">No buzzes yet</span>';
const rollPhase=['roll','moved','choice','tiebreak','winner'].includes(s.phase);const canSeeDie=role==='host'||(role==='player'&&((s.phase==='roll'&&s.roller===pid)||(s.roll&&s.roll.player===pid&&['moved','choice','winner'].includes(s.phase))));$('rollWrap').classList.toggle('hidden',!rollPhase||!canSeeDie);if(!rollAnimation)$('die').textContent=s.roll?['⚀','⚁','⚂','⚃','⚄','⚅'][s.roll.die-1]:'🎲';if(s.roll&&['moved','choice','winner','tiebreak'].includes(s.phase)){animateRoll(s);animateMovement(s)}animateSwap(s);if(role==='player'&&me&&s.roll){const followKey=[s.phaseId,s.roll.player,s.roll.die,s.roll.landed,s.roll.overshot].join(':');if(followKey!==lastFollowKey){lastFollowKey=followKey;setTimeout(()=>centerSpace(me.pos),DICE_DURATION+350+Math.max(0,s.roll.amount||0)*STEP_DURATION)}}$('rollInfo').textContent=s.roll?`Rolled ${s.roll.die}${s.roll.effect?' · '+s.roll.effect:''} → move ${s.roll.amount}`:s.phase==='tiebreak'?'GOAL ROLL-OFF':'';
// A winning roll must complete its die and board movement before the victory overlay/audio.
const winKey=s.phase==='winner'?`${s.code}:${s.phaseId}:${s.winner}:${s.roll?.player||''}:${s.roll?.die||''}`:'';
if(s.phase!=='winner'){
  clearTimeout(leaderboardTimer);leaderboardTimer=null;leaderboardKey='';leaderboardVisible=false;$('leaderboard').classList.add('hidden');$('leaderReopen').classList.add('hidden');
  clearTimeout(victoryTimer);victoryTimer=null;victoryKey='';victoryShownKey='';lastWinner='';
  $('winner').classList.add('hidden');
}else if(winKey!==victoryKey){
  renderLeaderboard(s);
  clearTimeout(victoryTimer);victoryKey=winKey;
  $('winner').classList.add('hidden');
  // All clients wait for the same visual sequence. Host also animates each board step.
  const steps=s.roll&&!s.roll.overshot&&s.roll.landed!=null?Math.max(0,s.roll.amount||0):0;
  const wait=s.roll?DICE_DURATION+550+steps*STEP_DURATION:0;
  victoryTimer=setTimeout(()=>{
    if(!state||state.phase!=='winner'||victoryKey!==winKey)return;
    $('winner').textContent='🎉 '+(state.players.find(p=>p.id===state.winner)?.name||'Player')+' has reached the GOAL! 🎉';
    $('winner').classList.remove('hidden');victoryShownKey=winKey;
    if(role==='host'&&lastWinner!==winKey){lastWinner=winKey;fanfare()}
    clearTimeout(leaderboardTimer);leaderboardTimer=setTimeout(()=>{if(state?.phase==='winner'&&victoryKey===winKey)showLeaderboard()},2600);
  },wait);
}
$('notice').textContent=s.notice||'';
$('choiceWrap').classList.toggle('hidden',s.phase!=='choice');
const chooser=s.players.find(p=>p.id===s.chooser),selected=s.players.find(p=>p.id===s.selectedTarget);
$('choiceTitle').textContent=s.phase!=='choice'?'':s.choiceType==='Swap'?'Choose a Player to Swap with!': 'Choose a Player to Piggy Back with!';
const targets=$('targets');targets.innerHTML='';
if(s.phase==='choice'&&role==='player'&&pid===s.chooser){
 s.players.filter(p=>p.id!==pid).forEach(p=>{const b=btn('',()=>socket.emit('chooseTarget',p.id), 'targetChoice'+(s.selectedTarget===p.id?' selectedTarget':''));b.innerHTML=token(p)+' '+escapeHtml(p.name)+(s.selectedTarget===p.id?' ✓':'');targets.appendChild(b)});
 if(selected){const confirmation=document.createElement('div');confirmation.className='swapConfirm';confirmation.textContent=s.choiceType==='Swap'?'Swap spaces with '+selected.name+'?':'Piggyback on '+selected.name+'?';const confirm=btn('Confirm',()=>socket.emit(s.choiceType==='Swap'?'confirmSwap':'confirmPiggy'),'big');confirmation.appendChild(confirm);targets.appendChild(confirmation)}
}else if(s.phase==='choice'&&role==='host')targets.textContent=(chooser?.name||'Player')+' is choosing a player…';
const actions=$('actions');actions.innerHTML='';$('playerActions').classList.toggle('hidden',role!=='player'||s.phase==='lobby');$('abilityTray').innerHTML='';const showHint=!!hintText&&s.phase==='question';$('privateHint').classList.toggle('hidden',!showHint);$('privateHint').textContent=showHint?hintText:'';
if(role==='player'&&me){if(s.phase==='question'){const solo=s.players.some(p=>p.solo);const unlock=me.solo?(s.questionStart??s.unlock):s.unlock+(me.head?0:s.players.some(p=>p.head)?5000:0);const ready=!me.locked&&(!solo||me.solo)&&!me.buzzed&&!me.wrong&&Date.now()+serverOffset>=unlock;const buz=btn(ready?'BUZZ!':'LOCKED',()=>socket.emit('buzz',{phaseId:s.phaseId}),'big '+(ready?'buzzerReady':'buzzerLocked'));buz.id='buzzButton';buz.disabled=!ready;actions.appendChild(buz);if(me.hint&&s.active===pid)add(actions,'HINT',()=>socket.emit('hint'));}if(s.phase==='roll'&&s.roller===pid){if(me.effect==='Choose'){for(let n=1;n<=6;n++)add(actions,'Roll '+n,()=>socket.emit('roll',n))}else add(actions,'ROLL!',()=>socket.emit('roll'),'big')}if(s.phase==='tiebreak'&&s.players.find(p=>p.id===pid)?.pos===50)add(actions,'ROLL-OFF!',()=>socket.emit('tieRoll'),'big');const flags=[me.effect,me.hint?'Hint':null,me.head?'Head Start':null,me.locked?'Locked Out':null,me.solo?'Solo':null,me.pig?'Piggy Back':null].filter(Boolean);$('abilityTray').innerHTML=flags.map(abilityBadge).join('');}
const host=$('hostControls');host.classList.toggle('hidden',role!=='host');host.innerHTML='';if(role==='host'){if(s.phase==='lobby')add(host,'START GAME',()=>socket.emit('start'));if(['ready','reveal','moved','winner'].includes(s.phase))add(host,s.phase==='winner'?'RUN IT BACK':'NEXT',()=>socket.emit('next'));if(s.phase==='question'){if(s.active){add(host,'CORRECT',()=>socket.emit('judge',true));add(host,'INCORRECT',()=>socket.emit('judge',false),'danger')}add(host,'START TIMER',()=>socket.emit('timer','start'));add(host,'PAUSE TIMER',()=>socket.emit('timer','pause'),'alt');add(host,'REVEAL ANSWER',()=>socket.emit('reveal'),'alt')}if(s.phase==='winner')add(host,'HOME MENU',()=>socket.emit('home'),'danger')}
}
setInterval(()=>{if(!state)return;const me=state.players.find(p=>p.id===pid);const b=$('buzzButton');if(b&&me&&state.phase==='question'){const ready=!me.locked&&(!state.players.some(p=>p.solo)||me.solo)&&!me.buzzed&&!me.wrong&&Date.now()+serverOffset>=(me.solo?(state.questionStart??state.unlock):state.unlock+(me.head?0:state.players.some(p=>p.head)?5000:0));b.textContent=ready?'BUZZ!':'LOCKED';b.className='big '+(ready?'buzzerReady':'buzzerLocked');b.disabled=!ready;} updateQuestionStatus(state,me);const left=state.deadline?Math.max(0,Math.ceil((state.deadline-Date.now())/1000)):null;$('clock').textContent=left!==null?`⏱ ${left}s`:''},100);

// Open on a direct user click so popup blockers allow it. The host token is sent
// only to the same-origin child window via postMessage, never in the URL.
let answerMonitorWindow=null;
function openAnswerMonitor(){
 if(role!=='host'||!hostToken||!state)return err('Create or rejoin a host lobby first.');
 if(answerMonitorWindow&&!answerMonitorWindow.closed){answerMonitorWindow.focus();return;}
 answerMonitorWindow=window.open('/answer-monitor.html','quickShotAnswerMonitor','width=560,height=470,resizable=yes,scrollbars=yes');
 if(!answerMonitorWindow)err('Allow popups for Quick Shot to open the answer monitor.');
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==answerMonitorWindow)return;
 if(event.data?.type==='quickShotAnswerMonitorReady'&&role==='host'&&state&&hostToken){
  answerMonitorWindow.postMessage({type:'quickShotAnswerMonitorAuth',code:state.code,token:hostToken},location.origin);
 }
});

// Persistent, phase-aware player status messages.
let lastRollFocusKey='';
function updateQuestionStatus(s,me){
 const el=$('questionStatusNotice');if(!el)return;
 let kind='',message='';
 if(role==='player'&&me&&s.phase==='question'){
  const soloPlayer=s.players.find(p=>p.solo);const headPlayer=s.players.find(p=>p.head);
  const now=Date.now()+serverOffset;
  if(me.locked){kind='locked';message='YOU ARE LOCKED OUT';}
  else if(soloPlayer&&soloPlayer.id!==pid){kind='solo';message=`${soloPlayer.name} IS RUNNING THE ONES!`;}
  else if(headPlayer){const unlock= s.unlock+(me.head?0:5000);if(now<unlock){kind='head';message=me.head?'YOU HAVE A HEAD START':`${headPlayer.name} HAS A HEAD START SO HOLD TIGHT!`;}}
 }
 el.className='questionStatusNotice'+(kind?' '+kind:' hidden');el.textContent=message;
}
