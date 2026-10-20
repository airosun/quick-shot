const express=require('express'),http=require('http'),{Server}=require('socket.io'),XLSX=require('xlsx'),crypto=require('crypto'),fs=require('fs'),path=require('path');
const board=require('./board.json');const app=express(),server=http.createServer(app),io=new Server(server,{maxHttpBufferSize:5e6});app.use(express.static('public'));app.get('/health',(_,r)=>r.json({ok:true}));
const games=new Map(),COLORS=['Red','Orange','Yellow','Green','Light Blue','Blue','Purple','Pink','Black','White'],SHAPES=['Circle','Square','Triangle','Star','Heart','Octagon'];
// Usage is keyed by the uploaded workbook's filename and stored on disk.
// Set DATA_DIR to a persistent disk mount in production to survive redeploys.
const DATA_DIR=process.env.DATA_DIR||path.join(__dirname,'data');
fs.mkdirSync(DATA_DIR,{recursive:true});
const usagePath=path.join(DATA_DIR,'question-usage.json');
let usage={};try{const saved=JSON.parse(fs.readFileSync(usagePath,'utf8'));if(saved&&typeof saved==='object'&&!Array.isArray(saved))usage=saved;}catch{}
function saveUsage(){const tmp=usagePath+'.tmp';fs.writeFileSync(tmp,JSON.stringify(usage,null,2));fs.renameSync(tmp,usagePath);}
function setKey(name){return path.basename(String(name||'').replace(/\\/g,'/')).trim().toLowerCase().replace(/\.(xlsx|xls)$/,'');}
function unused(g){const seen=new Set(usage[g.setKey]||[]);return g.questions.filter(q=>!seen.has(q.id.toLowerCase()));}
function prepareNext(g){if(!g.questions.length)return false;let pool=unused(g);if(!pool.length){usage[g.setKey]=[];saveUsage();pool=g.questions.slice();g.notice='All questions in this set were used. Question history has refreshed.';}g.pending=pool[Math.floor(Math.random()*pool.length)];return true;}
// Persist active games alongside question history. Requires a persistent DATA_DIR on Render.
const gamesPath=path.join(DATA_DIR,'active-games.json');
try { const saved=JSON.parse(fs.readFileSync(gamesPath,'utf8')); for(const raw of saved){
 if(!raw||!raw.code||!raw.hostToken)continue;
 raw.hostSid=null; raw.players=(raw.players||[]).map(p=>({...p,sid:null}));
 games.set(raw.code,raw);
}}catch(e){if(e.code!=='ENOENT')console.warn('Could not restore active games:',e.message)}
function persistGames(){try{const tmp=gamesPath+'.tmp';fs.writeFileSync(tmp,JSON.stringify([...games.values()].map(g=>({...g,hostSid:null,players:g.players.map(p=>({...p,sid:null}))}))));fs.renameSync(tmp,gamesPath)}catch(e){console.error('Game persistence failed:',e.message)}}
const uid=()=>crypto.randomBytes(16).toString('hex'),code=()=>Math.random().toString(36).slice(2,7).toUpperCase();
function answerMonitorView(g){
 const q=g.currentQuestion;
 const visible=['question','reveal'].includes(g.phase)&&!!q;
 return {phase:g.phase,phaseId:g.phaseId,question:visible?q.question:null,
  id:visible?q.id:null,answer:visible?q.answer:null,image:visible?q.image:null};
}
function emit(g){persistGames();io.to(g.code).emit('state',view(g));io.to('answers:'+g.code).emit('answerMonitorState',answerMonitorView(g));}
function view(g){return {serverTime:Date.now(),code:g.code,phase:g.phase,players:g.players.map(p=>({id:p.id,name:p.name,color:p.color,shape:p.shape,pos:p.pos,connected:!!p.sid,effect:p.effect,hint:!!p.hint,pig:p.pig,locked:p.locked,solo:p.solo,head:p.head,overshootStreak:p.overshootStreak||0,buzzed:!!p.buzzed,wrong:!!p.wrong})),question:g.phase==='question'||g.phase==='reveal'?g.currentQuestion&&{question:g.currentQuestion.question,id:g.currentQuestion.id,image:g.currentQuestion.image||null}:null,answer:g.phase==='reveal'?g.currentQuestion?.answer:null,queue:g.queue,queueTimes:g.queueTimes||{},active:g.active,deadline:g.deadline,unlock:g.unlock,questionStart:g.questionStart,phaseId:g.phaseId,roller:g.roller,roll:g.roll,notice:g.notice,winner:g.winner,remaining:g.questions.length?unused(g).length:0,questionSet:g.setName||null,hasQuestions:!!g.questions.length,choiceType:g.choiceType||null,chooser:g.chooser||null,selectedTarget:g.selectedTarget||null,swapEvent:g.swapEvent||null};}
function get(socket){const g=games.get(socket.data.code);return g&&g.players.find(p=>p.id===socket.data.pid)||socket.data.host&&g?g:null;}
function auth(s){const g=games.get(s.data.code);return g&&g.hostToken===s.data.hostToken&&g.hostSid===s.id?g:null;}
function player(s){const g=games.get(s.data.code);return g?.players.find(p=>p.id===s.data.pid&&p.sid===s.id)?{g,p:g.players.find(p=>p.id===s.data.pid)}:null;}
function error(s,msg){s.emit('errorMsg',msg)}
function reset(g){g.players.forEach(p=>Object.assign(p,{pos:0,effect:null,hint:false,pig:null,locked:false,solo:false,head:false,overshootStreak:0}));Object.assign(g,{phase:'lobby',qi:0,queue:[],active:null,deadline:null,unlock:null,roller:null,roll:null,winner:null,notice:'',phaseId:g.phaseId+1});}
function question(g){if(!prepareNext(g)){g.phase='exhausted';g.notice='Upload a question sheet.';emit(g);return;}const q=g.pending;g.currentQuestion=q;const key=q.id.toLowerCase();usage[g.setKey]=[...(usage[g.setKey]||[]),key];saveUsage();g.phase='question';g.roller=null;g.roll=null;g.queue=[];g.queueTimes={};g.active=null;g.deadline=null;g.phaseId++;g.notice='';const delay=1000+Math.floor(Math.random()*5)*1000;g.questionStart=Date.now();g.unlock=g.questionStart+delay;g.players.forEach(p=>{p.buzzed=false;p.wrong=false});emit(g);}
function reveal(g){g.phase='reveal';g.deadline=null;g.unlock=null;g.players.forEach(p=>{p.locked=false;p.solo=false;p.head=false});emit(g);}
function afterMove(g,p){const cell=board[p.pos];g.notice=`${p.name} landed on ${cell.type}`;switch(cell.type){case 'Double':p.effect='Double';break;case 'Add 3':p.effect='Add 3';break;case 'Add 2':p.effect='Add 2';break;case 'Head Start':p.head=true;break;case 'Hint':p.hint=true;break;case 'Locked Out':p.locked=true;break;case 'Solo':p.solo=true;break;case 'Choose':p.effect='Choose';break;case 'Piggy Back':case 'Swap':g.phase='choice';g.choiceType=cell.type;g.chooser=p.id;g.selectedTarget=null;break;}}
function win(g,arr){if(arr.length===1){g.winner=arr[0].id;g.phase='winner';g.notice=`${arr[0].name} has reached the GOAL!`;}else if(arr.length>1){g.phase='tiebreak';g.tied=arr.map(p=>p.id);g.tieRolls={};g.notice='Goal tie! Roll-off: highest die wins.';}}
function move(g,p,amount){
 let winners=[];
 g.piggyEvent=null;
 function shift(who,steps){if(who.pos+steps<=50){who.pos+=steps;if(who.pos===50)winners.push(who);return true;}return false;}
 // Overshooting never counts as landing again and must never reactivate a space.
 const overshot=p.pos+amount>50;
 if(overshot){p.overshootStreak=(p.overshootStreak||0)+1;g.notice=`${p.name} Overshot the GOAL!`;return;}
 p.overshootStreak=0;
 shift(p,amount);
 for(const follower of g.players.filter(x=>x.pig===p.id&&x.id!==p.id)){
  follower.pig=null;
  if(shift(follower,amount)){follower.overshootStreak=0;g.piggyEvent={name:follower.name,spaces:amount};}
 }
 if(winners.length){win(g,winners);return;}
 if(g.phase!=='winner'&&g.phase!=='tiebreak')afterMove(g,p);
}
function effectiveRoll(die,effect){return effect==='Double'?die*2:effect==='Add 2'?die+2:effect==='Add 3'?die+3:die;}
function eligibleDice(p){
 const dice=[1,2,3,4,5,6];
 if((p.overshootStreak||0)<3)return dice;
 const overshooting=dice.filter(n=>p.pos+effectiveRoll(n,p.effect)>50);
 // Keep the smallest overshooting face, excluding the other overshooting faces.
 // If only one face overshoots, the odds remain unchanged.
 return dice.filter(n=>!overshooting.includes(n)||n===overshooting[0]);
}
io.on('connection',s=>{
 s.on('clockSync',(clientSent,cb)=>{if(typeof cb==='function')cb({clientSent,serverTime:Date.now()})});
 s.on('create',(_,cb)=>{let c;do{c=code()}while(games.has(c));const token=uid(),g={code:c,hostToken:token,hostSid:s.id,players:[],questions:[],qi:0,phase:'lobby',phaseId:0,queue:[],active:null,deadline:null,unlock:null,roller:null,roll:null,notice:'',winner:null};games.set(c,g);s.data={code:c,hostToken:token,host:true};s.join(c);cb?.({code:c,token});emit(g)});
 s.on('hostJoin',({code,token},cb)=>{const g=games.get(String(code||'').toUpperCase());
 if(!g)return cb?.({error:'Lobby unavailable on this server. If Render restarted, configure a persistent DATA_DIR to restore games.',retryable:true});
 if(g.hostToken!==token)return cb?.({error:'Invalid host credentials',retryable:false});
 // Take over atomically: never invalidate the saved host token when an old tab reconnects.
 const prior=g.hostSid;g.hostSid=s.id;s.data={code:g.code,hostToken:token,host:true};s.join(g.code);
 cb?.({ok:true});emit(g);
 if(prior&&prior!==s.id){const old=io.sockets.sockets.get(prior);if(old){old.data={};old.leave(g.code);old.disconnect(true)}}
 });
 // Read-only companion connection for the host's separate answer monitor.
 // This does not take over hostSid and never joins the public game room.
 s.on('answerMonitorJoin',({code,token},cb)=>{
  const g=games.get(String(code||'').toUpperCase());
  if(!g||!token||g.hostToken!==token)return cb?.({error:'Host authorization failed'});
  s.data.answerMonitorCode=g.code;
  s.data.answerMonitorToken=token;
  s.join('answers:'+g.code);
  cb?.({ok:true});
  s.emit('answerMonitorState',answerMonitorView(g));
 });
 s.on('join',({code,name,color,shape,token},cb)=>{const g=games.get(String(code).toUpperCase());if(!g)return cb?.({error:'Lobby not found'});name=String(name||'').trim().slice(0,24);if(!name)return cb?.({error:'Enter a name'});let p=g.players.find(x=>x.name.toLowerCase()===name.toLowerCase());if(p){if(!token||p.token!==token)return cb?.({error:'Name in use; reconnect on the same device'});if(p.sid&&p.sid!==s.id){const old=io.sockets.sockets.get(p.sid);if(old)old.disconnect(true)}p.sid=s.id;}else{if(g.phase!=='lobby')return cb?.({error:'Game already started'});if(g.players.length>=10)return cb?.({error:'Lobby full'});if(!COLORS.includes(color)||g.players.some(x=>x.color===color))return cb?.({error:'Color unavailable'});if(!SHAPES.includes(shape))return cb?.({error:'Invalid shape'});p={id:uid(),token:uid(),sid:s.id,name,color,shape,pos:0,effect:null,hint:false,pig:null,locked:false,solo:false,head:false,overshootStreak:0};g.players.push(p)}s.data={code:g.code,pid:p.id};s.join(g.code);cb?.({ok:true,token:p.token,id:p.id});emit(g)});
 s.on('remove',id=>{const g=auth(s);if(!g||g.phase!=='lobby')return;g.players=g.players.filter(p=>p.id!==id);emit(g)});
 s.on('upload',({data,name},cb)=>{const g=auth(s);if(!g)return cb?.({error:'Host only'});if(g.phase!=='lobby'&&g.phase!=='exhausted')return cb?.({error:'Questions can only be uploaded in the lobby or when exhausted'});try{if(typeof data!=='string'||data.length>6500000)throw Error('Invalid or oversized file (maximum 5 MB)');const wb=XLSX.read(data,{type:'base64'});if(!wb.SheetNames.length)throw Error('Workbook has no sheets');const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',blankrows:false});if(!rows.length)throw Error('Workbook is empty');const normalize=v=>String(v??'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');const headers=rows[0].slice(0,5).map(normalize);const expected=[['id','questionid'],['question','questions'],['answer','answers'],['hint','hints'],['image','images']];const errors=[];for(let i=0;i<5;i++)if(!expected[i].includes(headers[i]))errors.push(`Column ${'ABCDE'[i]} header must be ${['ID','Question','Answer','Hint','Images'][i]} (found "${rows[0][i]??''}")`);const qs=[],ids=new Set();for(let i=1;i<rows.length;i++){const row=rows[i];if(!row.some(v=>String(v??'').trim()))continue;const fields=row.slice(0,4).map(v=>String(v??'').trim());if(fields.slice(0,3).some(v=>!v))errors.push(`Row ${i+1}: ID, Question, and Answer are required`);if(fields[0]){if(ids.has(fields[0].toLowerCase()))errors.push(`Row ${i+1}: duplicate question ID "${fields[0]}"`);ids.add(fields[0].toLowerCase())}if(row.slice(5).some(v=>String(v??'').trim()))errors.push(`Row ${i+1}: unexpected data beyond column E`);const imageCell=wb.Sheets[wb.SheetNames[0]][`E${i+1}`];const imageValue=String(row[4]??'').trim();const imageLink=String(imageCell?.l?.Target||'').trim();const image=imageLink||imageValue;if(image){try{const url=new URL(image);if(!['https:','http:'].includes(url.protocol))throw Error('protocol');}catch{errors.push(`Row ${i+1}: Images must contain a valid http:// or https:// image URL`)}}qs.push({id:fields[0],question:fields[1],answer:fields[2],hint:fields[3],image:image||null})}if(!qs.length)errors.push('No questions found after header row');if(errors.length)return cb?.({error:errors.slice(0,30).join('\n')+(errors.length>30?`\n...and ${errors.length-30} more errors`:'' )});const key=setKey(name);if(!key)throw Error('A question set filename is required');g.questions=qs;g.setKey=key;g.setName=String(name);g.currentQuestion=null;g.qi=0;const remaining=unused(g).length;cb?.({ok:true,count:qs.length,remaining,used:qs.length-remaining,setName:g.setName});emit(g)}catch(e){cb?.({error:e.message})}});
 s.on('start',()=>{const g=auth(s);if(!g||g.phase!=='lobby'||!g.players.length||!g.questions.length)return;g.phase='ready';emit(g)});
 s.on('next',()=>{const g=auth(s);if(!g)return;if(g.phase==='ready'||g.phase==='reveal'&&!g.roller||g.phase==='moved'){question(g)}else if(g.phase==='reveal'&&g.roller){g.phase='roll';g.roll=null;emit(g)}else if(g.phase==='winner'){reset(g);g.phase='ready';emit(g)}});
 s.on('buzz',({phaseId})=>{const v=player(s);if(!v)return;const {g,p}=v;if(g.phase!=='question'||phaseId!==g.phaseId||p.buzzed||p.wrong)return;const solos=g.players.filter(x=>x.solo);if(solos.length&&!p.solo||p.locked)return;const unlock=p.solo?g.questionStart||g.unlock:g.unlock+(p.head?0:g.players.some(x=>x.head)?5000:0);if(Date.now()<unlock)return;p.buzzed=true;g.queue.push(p.id);g.queueTimes[p.id]=Date.now()-unlock;if(!g.active)g.active=p.id;emit(g)});
 s.on('judge',correct=>{const g=auth(s);if(!g||g.phase!=='question'||!g.active)return;const p=g.players.find(x=>x.id===g.active);if(correct){g.roller=p.id;reveal(g)}else{p.wrong=true;g.active=g.queue.find(id=>!g.players.find(x=>x.id===id).wrong)||null;emit(g)}});
 s.on('timer',action=>{const g=auth(s);if(!g||g.phase!=='question')return;if(action==='start')g.deadline=Date.now()+10000;if(action==='pause')g.deadline=null;emit(g)});
 s.on('reveal',()=>{const g=auth(s);if(!g||g.phase!=='question')return;g.roller=null;reveal(g)});
 s.on('hint',()=>{const v=player(s);if(!v)return;const {g,p}=v;if(g.phase!=='question'||g.active!==p.id||!p.hint)return;p.hint=false;s.emit('privateHint',g.currentQuestion?.hint||'No hint provided');emit(g)});
 s.on('roll',chosen=>{const v=player(s);if(!v)return;const {g,p}=v;if(g.phase!=='roll'||g.roller!==p.id)return;
 const allowed=eligibleDice(p);
 let die=allowed[Math.floor(Math.random()*allowed.length)];
 if(p.effect==='Choose'){if(!Number.isInteger(chosen)||chosen<1||chosen>6)return;die=chosen;}
 const effect=p.effect,amount=effectiveRoll(die,effect),overshot=p.pos+amount>50;
 p.effect=null;
 g.roll={die,amount,effect,player:p.id,landed:overshot?null:p.pos+amount,overshot};
 g.phase='moved';g.roller=null;move(g,p,amount);g.roll.piggyEvent=g.piggyEvent;emit(g);
 });
 s.on('chooseTarget',id=>{const v=player(s);if(!v)return;const {g,p}=v;if(g.phase!=='choice'||g.chooser!==p.id||id===p.id)return;const target=g.players.find(x=>x.id===id);if(!target)return;if(g.choiceType==='Swap'){g.selectedTarget=target.id;emit(g)}else{p.pig=target.id;g.phase='moved';g.notice=`${p.name} is piggybacking on ${target.name}`;g.choiceType=null;g.chooser=null;g.selectedTarget=null;emit(g)}});
 s.on('confirmSwap',()=>{const v=player(s);if(!v)return;const {g,p}=v;if(g.phase!=='choice'||g.choiceType!=='Swap'||g.chooser!==p.id||!g.selectedTarget)return;const target=g.players.find(x=>x.id===g.selectedTarget&&x.id!==p.id);if(!target)return;[p.pos,target.pos]=[target.pos,p.pos]; // Position only: never trigger landing effects on either token.
 g.swapEvent={id:uid(),a:p.id,b:target.id,fromA:target.pos,fromB:p.pos,toA:p.pos,toB:target.pos};g.phase='moved';g.notice=`${p.name} swapped spaces with ${target.name}`;g.roll=null;g.choiceType=null;g.chooser=null;g.selectedTarget=null;emit(g)});
 s.on('tieRoll',()=>{const v=player(s);if(!v)return;const {g,p}=v;if(g.phase!=='tiebreak'||!g.tied.includes(p.id)||g.tieRolls[p.id])return;g.tieRolls[p.id]=Math.floor(Math.random()*6)+1;if(g.tied.every(id=>g.tieRolls[id])){const high=Math.max(...Object.values(g.tieRolls));const leaders=g.tied.filter(id=>g.tieRolls[id]===high);if(leaders.length===1)win(g,[g.players.find(x=>x.id===leaders[0])]);else{g.tied=leaders;g.tieRolls={};g.notice='Roll-off tied! Roll again.'}}emit(g)});
 s.on('home',()=>{const g=auth(s);if(!g)return;io.to(g.code).emit('home');games.delete(g.code);persistGames()});
 s.on('disconnect',()=>{const g=games.get(s.data.code);if(!g)return;if(g.hostSid===s.id)g.hostSid=null;for(const p of g.players)if(p.sid===s.id)p.sid=null;emit(g)});
});
setInterval(()=>{for(const g of games.values())if(g.phase==='question'&&g.deadline&&Date.now()>=g.deadline){g.roller=null;reveal(g)}},150);server.listen(process.env.PORT||3000,()=>console.log('Quick Shot ready'));
