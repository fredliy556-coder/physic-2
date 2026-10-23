/* Экраны: практика (задачи, тесты, выбор и преобразование формул, контрольная), диагностика, ЕГЭ (тренировка, вариант с таймером, статистика). */
(()=>{
'use strict';
const P=window.PH,{$,plural,pct,TOP,ORDER,views,ACT,go,page,save,toast,shuffle,now}=P;
const st=P.st;
let R=null;

/* ---------- источники заданий ---------- */
const taskItem=(ti,i)=>{const t=TASKS[ti],x=t.items[i];return {k:'task',q:x[0],a:x[1],h:x[2],ch:t.ch,sub:t.sub,key:ti+'.'+i}};
const quizItem=(id,q)=>{const o=shuffle(q[1].map((t,i)=>i));return {k:'mcq',q:q[0],opts:o.map(i=>q[1][i]),c:o.indexOf(q[2]),ex:q[3],ch:id}};
const egeItem=(ti,i)=>{const t=EGE[ti],x=t.items[i];return {k:'ege',n:t.n,q:x[0],a:x[1],sol:x[2],mx:t.pts,topic:t.topic,key:ti+'.'+i}};
const studied=()=>{const r=ORDER.filter(id=>st.topics[id]&&st.topics[id].read||P.taskStat(id).att);const c=P.curTopic();if(!r.includes(c))r.push(c);return r};
const solved=k=>(st.tasks[k]||{}).ok;
function firstUnsolved(ti){const t=TASKS[ti];for(let i=0;i<t.items.length;i++)if(!solved(ti+'.'+i))return i;return -1}
function subsOf(ids){return TASKS.map((t,ti)=>ti).filter(ti=>ids.includes(TASKS[ti].ch))}
const TRANS=[
 ['kin','v = v₀ + at','t','t = (v − v₀)/a',['t = (v + v₀)/a','t = a(v − v₀)','t = v/a − v₀']],
 ['kin','s = at²/2','t','t = √(2s/a)',['t = 2s/a','t = √(s/(2a))','t = √(2a/s)']],
 ['kin','v² − v₀² = 2as','a','a = (v² − v₀²)/(2s)',['a = 2s/(v² − v₀²)','a = (v − v₀)²/(2s)','a = (v² + v₀²)/(2s)']],
 ['dyn','F = Gm₁m₂/r²','r','r = √(Gm₁m₂/F)',['r = Gm₁m₂/F','r = √(F/(Gm₁m₂))','r = F/(Gm₁m₂)']],
 ['dyn','T = 2π√(l/g)','l','l = gT²/(4π²)',['l = gT/(2π)','l = T²/(4π²g)','l = 4π²g/T²']],
 ['cons','Eк = mv²/2','v','v = √(2Eк/m)',['v = 2Eк/m','v = √(Eк/(2m))','v = √(mEк/2)']],
 ['cons','mgh = mv²/2','h','h = v²/(2g)',['h = 2g/v²','h = v/(2g)','h = gv²/2']],
 ['mkt','pV = νRT','T','T = pV/(νR)',['T = νR/(pV)','T = pνR/V','T = pVνR']],
 ['mkt','p₁V₁/T₁ = p₂V₂/T₂','T₂','T₂ = T₁p₂V₂/(p₁V₁)',['T₂ = T₁p₁V₁/(p₂V₂)','T₂ = p₂V₂/(T₁p₁V₁)','T₂ = T₁p₂/(p₁V₂)']],
 ['thermo','Q = cmΔt','Δt','Δt = Q/(cm)',['Δt = cm/Q','Δt = Qcm','Δt = Qc/m']],
 ['thermo','η = 1 − T₂/T₁','T₁','T₁ = T₂/(1 − η)',['T₁ = T₂(1 − η)','T₁ = (1 − η)/T₂','T₁ = T₂/η']],
 ['es','F = k|q₁q₂|/r²','q₂ (q₁ известен)','q₂ = Fr²/(k|q₁|)',['q₂ = k|q₁|/(Fr²)','q₂ = Fr/(k|q₁|)','q₂ = Fk/(r²|q₁|)']],
 ['es','W = CU²/2','U','U = √(2W/C)',['U = 2W/C','U = √(W/(2C))','U = √(2C/W)']],
 ['es','C = εε₀S/d','d','d = εε₀S/C',['d = C/(εε₀S)','d = Cεε₀S','d = εε₀/(CS)']],
 ['dc','I = ℰ/(R + r)','r','r = ℰ/I − R',['r = ℰ/I + R','r = I/ℰ − R','r = ℰ − IR']],
 ['dc','R = ρl/S','S','S = ρl/R',['S = R/(ρl)','S = Rρ/l','S = ρR/l']]];
const fm=s=>`<span class="fm">${s}</span>`;

function build(kind,arg){
 let items=[],title='Практика',back='prac',limit=0,noHints=false;
 if(kind==='sub'){const ti=+arg,t=TASKS[ti];if(!t)return null;items=t.items.map((_,i)=>taskItem(ti,i));title=t.sub;back='topic/'+t.ch+'/2';
  const r=build0(items,title,back);r.i=Math.max(0,firstUnsolved(ti));return r}
 if(kind==='daily'){const ids=studied(),cur=P.curTopic(),n=Math.max(3,Math.round(st.split.prac/2.5));
  let subs=shuffle(subsOf(ids)).sort((a,b)=>(TASKS[b].ch===cur)-(TASKS[a].ch===cur));
  const wrong=Object.keys(st.tasks).filter(k=>!st.tasks[k].ok&&ids.includes(TASKS[+k.split('.')[0]].ch));
  shuffle(wrong).slice(0,Math.ceil(n/3)).forEach(k=>{const [a,b]=k.split('.').map(Number);items.push(taskItem(a,b))});
  for(const ti of subs){if(items.length>=n)break;const i=firstUnsolved(ti);if(i>=0&&!items.some(x=>x.key===ti+'.'+i))items.push(taskItem(ti,i))}
  title='Ежедневная практика'}
 if(kind==='weak'){const ws=Object.keys(st.tasks).filter(k=>!st.tasks[k].ok);items=shuffle(ws).slice(0,10).map(k=>{const [a,b]=k.split('.').map(Number);return taskItem(a,b)});title='Работа над ошибками'}
 if(kind==='mix'||kind==='test'){const ids=studied(),n=kind==='test'?8:10,by={};
  shuffle(subsOf(ids)).forEach(ti=>{const i=firstUnsolved(ti);if(i>=0)(by[TASKS[ti].ch]=by[TASKS[ti].ch]||[]).push(taskItem(ti,i))});
  const ch=Object.keys(by);for(let r=0;items.length<n&&ch.some(c=>by[c].length);r++)ch.forEach(c=>{if(items.length<n&&by[c].length)items.push(by[c].shift())});
  title=kind==='test'?'Контрольная · 20 мин':'Смешанная практика';if(kind==='test'){limit=20*60e3;noHints=true}}
 if(kind==='quiz'){const x=L[arg];if(!x)return null;items=x.quiz.map(q=>quizItem(arg,q));title='Тест: '+TOP[arg].short;back='topic/'+arg+'/3';noHints=true}
 if(kind==='mixquiz'){const ids=studied();items=shuffle(ids.flatMap(id=>(L[id].quiz||[]).map(q=>[id,q]))).slice(0,8).map(a=>quizItem(a[0],a[1]));title='Мини-тест';noHints=true}
 if(kind==='diag'){items=ORDER.map(id=>quizItem(id,L[id].quiz[0]));title='Диагностика';back='home';noHints=true}
 if(kind==='which'){const pool=Object.keys(L).flatMap(id=>(L[id].which||[]).map(w=>[id,w])),own=arg&&arg!=='all'?pool.filter(p=>p[0]===arg):pool;
  items=shuffle(own).slice(0,10).map(([id,w])=>{const o=shuffle([w[1]].concat(shuffle([...new Set(pool.map(p=>p[1][1]))].filter(f=>f!==w[1])).slice(0,3)));return {k:'mcq',q:w[0]+'<br><span class="note">Какую формулу применить?</span>',opts:o.map(fm),c:o.indexOf(w[1]),ex:'',ch:id}});
  title='Какой закон применить';back=arg&&arg!=='all'?'topic/'+arg+'/2':'prac'}
 if(kind==='trans'){items=shuffle(TRANS).slice(0,10).map(r=>{const o=shuffle([r[3]].concat(r[4]));return {k:'mcq',q:`Вырази <b>${r[2]}</b> из формулы ${fm(r[1])}`,opts:o.map(fm),c:o.indexOf(r[3]),ex:'Проверь подстановкой: подставь ответ обратно в исходную формулу, она должна стать тождеством.',ch:r[0]}});title='Преобразование формул'}
 if(kind==='egen'){const ti=EGE.findIndex(t=>t.n===+arg);if(ti<0)return null;items=EGE[ti].items.map((_,i)=>egeItem(ti,i));title='ЕГЭ · задание '+arg;back='ege/'+arg}
 if(kind==='egeweak'||kind==='egemix'){const es=P.egeStats(),all=EGE.flatMap((t,ti)=>t.items.map((_,i)=>[ti,i]));
  let pool=kind==='egemix'?all.filter(a=>EGE[a[0]].n<=20):all.filter(a=>{const e=es[EGE[a[0]].n];return e.a&&e.acc<.75||!st.ege[a[0]+'.'+a[1]]});
  if(!pool.length)pool=all;items=shuffle(pool).slice(0,kind==='egemix'?10:8).sort((a,b)=>EGE[a[0]].n-EGE[b[0]].n).map(a=>egeItem(a[0],a[1]));
  title=kind==='egemix'?'ЕГЭ · смешанная тренировка':'ЕГЭ · слабые номера';back='ege'}
 if(kind==='exam'){const p1=arg==='p1';items=EGE.filter(t=>!p1||t.n<=20).map(t=>{const ti=EGE.indexOf(t);return egeItem(ti,Math.floor(Math.random()*t.items.length))});
  title=p1?'Вариант: часть 1':'Учебный вариант';back='ege';limit=(p1?90:235)*60e3;noHints=true}
 const r=build0(items,title,back);r.limit=limit;r.noHints=noHints;return r;
}
function build0(items,title,back){items.forEach(it=>it.s={tries:0,hints:0,t0:0});return {items,title,back,i:0,t0:now(),limit:0,noHints:false}}

/* ---------- раздел «Практика» ---------- */
views.prac=()=>{
 const wrong=Object.values(st.tasks).filter(x=>!x.ok).length,total=TASKS.reduce((a,t)=>a+t.items.length,0),ok=Object.values(st.tasks).filter(x=>x.ok).length;
 const graph=TASKS.findIndex(t=>/График/.test(t.sub));
 let h=`<div class="card hero sec"><h2>Ежедневная практика</h2><p class="note">${plural(Math.max(3,Math.round(st.split.prac/2.5)),'задача','задачи','задач')} по изученным темам: сначала ошибки, затем следующие по сложности.</p><div class="row" style="margin-top:12px"><button class="btn" data-a="go" data-x="run/daily">Начать</button></div></div>
 <div class="sec"><div class="list">
 ${P.li('run/weak','!',`Работа над ошибками: ${wrong}`,'Задачи, где ответ не сошёлся','w')}
 ${P.li('run/mix','≋','Смешанная практика','10 задач из разных тем')}
 ${P.li('run/test','⏱','Контрольная с таймером','8 задач, 20 минут, без подсказок','w')}
 ${P.li('run/which/all','?','Какой закон применить','Выбор формулы по ситуации','t')}
 ${P.li('run/trans','x=','Преобразование формул','Вырази неизвестную величину','t')}
 ${P.li('run/mixquiz','∴','Концептуальные вопросы','Мини-тест без вычислений')}
 ${graph>=0?P.li('run/sub/'+graph,'↗','Задачи с графиками','Графики x(t) и v(t)'):''}
 </div></div>
 <div class="sec"><h2>По темам</h2><div class="list">${ORDER.map(id=>{const s=P.taskStat(id),n=TASKS.filter(t=>t.ch===id).reduce((a,t)=>a+t.items.length,0);return P.li('topic/'+id+'/2',TOP[id].i+1,TOP[id].short,`Решено ${s.ok} из ${n}`,s.ok===n?'ok':'')}).join('')}</div></div>
 <p class="note sec">Всего решено верно ${ok} из ${total}. Ответ вводи числом с единицей: например «2,5 м/с», «4·10^-3 Кл» или «4e-3 Кл». Приставки и км/ч пересчитываются автоматически.</p>`;
 page('Практика',h);
};

/* ---------- сессия ---------- */
views.run=(kind,arg)=>{
 const key=kind+'/'+(arg||'');
 if(!R||R.key!==key||R.done){R=build(kind,arg);if(!R)return go('prac');R.key=key;R.kind=kind;R.arg=arg}
 if(!R.items.length){page(R.title,`<div class="empty"><b>Здесь пока пусто</b>${kind==='weak'?'Ошибок нет. Реши что-нибудь в ежедневной практике.':'Все задачи из изученных тем решены. Открой новую тему или выбери тему вручную.'}</div><div class="row" style="justify-content:center"><button class="btn gh" data-a="go" data-x="prac">К практике</button></div>`,R.back);return}
 if(kind==='exam')return rExam();
 rItem();
};
function left(){return R.limit-(now()-R.t0)}
function timer(){if(!R.limit)return;P.startTick(()=>{const t=$('#tmr');if(!t)return P.stopTick();const l=left();t.textContent=P.mmss(l);t.classList.toggle('lo',l<120e3);if(l<=0){P.stopTick();R.kind==='exam'?examEnd():finish(true)}})}
function head(){const n=R.items.length;return `<div class="prog"><span>${R.i+1} / ${n}</span><span class="pb"><i style="width:${R.i/n*100}%"></i></span>${R.limit?`<span class="timer" id="tmr">${P.mmss(left())}</span>`:''}</div>`}
function rItem(){
 if(R.limit&&left()<=0)return finish(true);
 const it=R.items[R.i];if(!it)return finish();
 if(!it.s.t0)it.s.t0=now();
 const h=head()+(it.k==='task'?rTask(it):it.k==='mcq'?rMcq(it):rEge(it));
 page(R.title,h,R.back);timer();
 const u=$('#ui');if(u&&!it.s.fin&&matchMedia('(min-width:900px)').matches)u.focus();
}
const nextBtn=()=>`<div class="row" style="margin-top:14px"><button class="btn" data-a="nx">${R.i+1<R.items.length?'Дальше':'Завершить'}</button></div>`;
function errNote(ch){const e=(st.errs[ch]||[]).slice(-5);if(e.filter(x=>!x).length<3)return '';
 return `<div class="fb inf"><b>Несколько ошибок подряд в теме «${TOP[ch].short}»</b>Вернись к формулам или повтори карточки темы, потом продолжай. <div class="row" style="margin-top:8px"><a class="btn sm gh" href="#topic/${ch}/1">Формулы</a><a class="btn sm gh" href="#study/topic/${ch}">Карточки</a></div></div>`}

function rTask(it){
 const s=it.s,e=P.spec(it.a);let h=`<div class="card"><p class="small muted" style="margin:0 0 6px">${TOP[it.ch].short} · ${it.sub}</p><p class="task">${it.q}</p>`;
 if(!s.fin){
  if(e)h+=`<form data-f="task" class="ans"><input id="ui" class="inp" autocomplete="off" enterkeyhint="done" placeholder="${e.u?'Например: 12,5 '+P.esc(e.u):'Число'}" aria-label="Ответ" value="${P.esc(s.user||'')}"><button class="btn" type="submit">Проверить</button></form>`;
  else h+=`<p class="note" style="margin-top:10px">Ответ здесь словами или несколькими величинами. Реши на бумаге, затем сверь.</p><div class="row" style="margin-top:8px"><button class="btn" data-a="tShow">Сверить с ответом</button></div>`;
 }
 if(s.fb)h+=`<div class="fb ${s.fb.c}">${s.fb.t?`<b>${s.fb.t}</b>`:''}${s.fb.m||''}</div>`;
 if(!R.noHints){const hs=P.hints(it);h+=hs.slice(0,s.hints).map(x=>`<div class="hint"><b>${x[0]}</b>${x[1]}</div>`).join('');
  if(!s.fin)h+=`<div class="row" style="margin-top:10px">${s.hints<hs.length?`<button class="btn sm gh" data-a="hint">Подсказка ${s.hints+1} из ${hs.length}</button>`:''}${s.tries||s.hints>=hs.length?`<button class="btn sm gh" data-a="tGive">Показать решение</button>`:''}</div>`}
 if(s.fin){
  h+=`<div class="fb inf"><b>Ответ: ${it.a}</b>${it.h?`<span class="note">${it.h}</span>`:''}</div>`;
  if(s.self)h+=`<div class="row" style="margin-top:10px"><button class="btn tl" data-a="self" data-x="1">Решил верно</button><button class="btn gh" data-a="self" data-x="0">Ошибся</button></div>`;
  else{if(!s.ok)h+=errNote(it.ch);h+=nextBtn()}
 }
 return h+'</div>';
}
function recTask(it,ok){
 const s=it.s;s.ok=ok;st.tasks[it.key]={ok:ok?1:0,a:s.tries,h:s.hints,t:now()};
 (st.errs[it.ch]=(st.errs[it.ch]||[])).push(ok?1:0);st.errs[it.ch]=st.errs[it.ch].slice(-8);
 P.act('tasks');save();
}
document.addEventListener('submit',e=>{
 const f=e.target.closest('form[data-f]');if(!f)return;e.preventDefault();
 const it=R&&R.items[R.i],v=$('#ui')?$('#ui').value:'';if(!it)return;
 if(f.dataset.f==='task'){
  const r=P.checkNum(it.a,v);if(!r)return;it.s.user=v;
  if(r.st==='parse'||r.st==='unit'){it.s.fb={c:'bad',t:r.st==='unit'?'Проверь единицы':'',m:r.msg};return rItem()}
  it.s.tries++;
  if(r.st==='ok'){it.s.fb={c:'ok',t:'Верно'+(it.s.hints?' (с подсказками)':''),m:r.msg};it.s.fin=1;recTask(it,true)}
  else{it.s.fb={c:'bad',t:'Не сходится',m:r.msg+(R.noHints?'':' Попробуй ещё раз.')};if(R.noHints||it.s.tries>=3){it.s.fin=1;recTask(it,false)}}
  rItem();
 }else if(f.dataset.f==='ege'){egeCheck(it,v)}
 else if(f.dataset.f==='exam'){it.s.user=v;examGo(R.i+1)}
});
ACT.hint=()=>{const it=R.items[R.i];it.s.hints++;rItem()};
ACT.tGive=()=>{const it=R.items[R.i];it.s.fin=1;it.s.fb=null;if(P.spec(it.a))recTask(it,false);else it.s.self=1;rItem()};
ACT.tShow=()=>{const it=R.items[R.i];it.s.fin=1;it.s.self=1;rItem()};
ACT.self=x=>{const it=R.items[R.i];it.s.self=0;it.s.tries=1;recTask(it,x==='1');rItem()};
ACT.nx=()=>{R.i++;if(R.i>=R.items.length)finish();else rItem()};

function rMcq(it){
 const s=it.s,ans=s.pick!=null;
 let h=`<div class="card"><p class="small muted" style="margin:0 0 6px">${TOP[it.ch].short}</p><p class="task">${it.q}</p><div class="opts">`;
 it.opts.forEach((o,i)=>{const cl=ans?(i===it.c?'ok':i===s.pick?'bad':''):'';h+=`<button class="opt ${cl}" data-a="pick" data-x="${i}" ${ans?'disabled':''}>${o}</button>`});
 h+='</div>';
 if(ans){h+=`<div class="fb ${s.ok?'ok':'bad'}"><b>${s.ok?'Верно':'Неверно'}</b>${it.ex||''}</div>`;if(!s.ok&&R.kind!=='diag')h+=errNote(it.ch);h+=nextBtn()}
 return h+'</div>';
}
ACT.pick=x=>{const it=R.items[R.i];if(it.s.pick!=null)return;it.s.pick=+x;it.s.ok=+x===it.c;
 if(R.kind!=='diag'){(st.errs[it.ch]=(st.errs[it.ch]||[])).push(it.s.ok?1:0);st.errs[it.ch]=st.errs[it.ch].slice(-8)}P.act('quiz');save();rItem()};

/* ---------- ЕГЭ: одно задание в тренировке ---------- */
function rEge(it){
 const s=it.s,t=P.egeType(it.n);
 let h=`<div class="card"><div class="row sp"><span class="tag">Задание ${it.n} · ${plural(it.mx,'балл','балла','баллов')}</span><span class="small muted">${it.topic}</span></div><p class="task">${it.q}</p>`;
 if(!s.fin){
  if(t==='self')h+=`<p class="note">${P.egeHint.self}</p><div class="row" style="margin-top:8px"><button class="btn" data-a="egeShow">Показать решение</button></div>`;
  else h+=`<form data-f="ege" class="ans"><input id="ui" class="inp" autocomplete="off" enterkeyhint="done" inputmode="${t==='num'?'decimal':t==='pm'?'text':'numeric'}" placeholder="Ответ" aria-label="Ответ" value="${P.esc(s.user||'')}"><button class="btn" type="submit">Проверить</button></form><p class="note" style="margin-top:6px">${P.egeHint[t]}</p>`;
 }
 if(s.fin){
  if(t!=='self')h+=`<div class="fb ${s.pt===it.mx?'ok':s.pt?'inf':'bad'}"><b>${s.pt===it.mx?'Верно':s.pt?'Частично верно':'Неверно'} · ${s.pt} из ${it.mx}</b>Твой ответ: ${P.esc(s.user)} · верный: ${it.a}</div>`;
  h+=`<div class="fb inf"><b>Ответ: ${it.a}</b><div style="margin-top:6px">${it.sol}</div></div>`;
  if(s.self)h+=`<p class="small" style="margin-top:10px">Оцени себя по разбору:</p><div class="row">${Array.from({length:it.mx+1},(_,i)=>`<button class="btn sm ${i===it.mx?'tl':'gh'}" data-a="egeSelf" data-x="${i}">${i}</button>`).join('')}</div>`;
  else{const tp=(EGE_TOPIC[it.n]||[])[0];if(s.pt<it.mx&&tp)h+=`<p class="note" style="margin-top:8px">Не получилось? <a href="#topic/${tp}/1">Формулы темы «${TOP[tp].short}»</a></p>`;h+=nextBtn()}
 }
 return h+'</div>';
}
function recEge(it,pt){const s=it.s;s.pt=pt;s.fin=1;st.ege[it.key]={ok:pt===it.mx?1:0,a:1,pt,mx:it.mx,tm:now()-s.t0,t:now()};P.act('ege');save()}
function egeCheck(it,v){if(!String(v).trim())return toast('Введи ответ');it.s.user=v;recEge(it,P.egeScore(it.n,it.a,v,it.mx));rItem()}
ACT.egeShow=()=>{const it=R.items[R.i];it.s.fin=1;it.s.self=1;rItem()};
ACT.egeSelf=x=>{const it=R.items[R.i];it.s.self=0;recEge(it,+x);rItem()};

/* ---------- итог сессии ---------- */
function finish(timeUp){
 P.stopTick();R.done=true;
 const its=R.items,att=its.filter(i=>i.s.fin||i.s.pick!=null),ok=its.filter(i=>i.s.ok||i.k==='ege'&&i.s.pt===i.mx).length,n=its.length;
 if(R.kind==='quiz'){const t=st.topics[R.arg]||(st.topics[R.arg]={});t.qb=Math.max(t.qb||0,ok/n);t.qt=now()}
 if(R.kind==='daily'||R.kind==='mix')P.planDone('prac');
 if(['mixquiz','egeweak','test','quiz'].includes(R.kind))P.planDone('test');
 if(R.kind==='diag'){const res={};its.forEach(i=>res[i.ch]=i.s.ok?1:0);st.diag={t:now(),res};st.onb=true}
 save();
 let h=`<div class="card res sec"><div class="big">${ok} / ${n}</div><p>${timeUp?'Время вышло. ':''}${R.kind==='diag'?'Диагностика завершена':'Верно решено'}${att.length<n?` · без ответа: ${n-att.length}`:''}</p></div>`;
 if(R.kind==='diag'){const k=ORDER.filter(id=>st.diag.res[id]),u=ORDER.filter(id=>!st.diag.res[id]);
  h+=`<div class="sec card"><h3>Начни с темы «${TOP[P.recTopic()].short}»</h3><p class="note">${u.length?'Нужно изучить: '+u.map(id=>TOP[id].short).join(', ')+'.':'Ты ответил на всё. Начни по порядку, чтобы закрепить.'}${k.length?' Знакомо: '+k.map(id=>TOP[id].short).join(', ')+' — эти темы можно пройти быстрее.':''}</p></div><div class="sec row"><button class="btn wide" data-a="go" data-x="home">К плану на сегодня</button></div>`}
 else{
  const bad=its.filter(i=>(i.s.fin||i.s.pick!=null)&&!(i.s.ok||i.k==='ege'&&i.s.pt===i.mx));
  if(bad.length){h+=`<div class="sec"><h2>Разбор ошибок</h2>${bad.map(i=>`<div class="card"><p class="small muted" style="margin:0">${i.k==='ege'?'Задание '+i.n:TOP[i.ch].short}</p><p>${i.q}</p><p><b>Ответ: ${i.k==='mcq'?i.opts[i.c]:i.a}</b></p>${i.k==='task'&&i.s.fb&&i.s.fb.c==='bad'?`<p class="note">${i.s.fb.m}</p>`:''}${i.k==='ege'?`<details class="cl"><summary>Решение</summary><div>${i.sol}</div></details>`:i.ex?`<p class="note">${i.ex}</p>`:''}</div>`).join('')}</div>`;
   const chs=[...new Set(bad.map(i=>i.ch||((EGE_TOPIC[i.n]||[])[0])).filter(Boolean))];
   if(chs.length)h+=`<div class="sec"><h2>Что повторить</h2><div class="list">${chs.map(c=>P.li('study/topic/'+c,'↻','Карточки: '+TOP[c].short,'Формулы и законы темы','t')).join('')}</div></div>`}
  h+=`<div class="sec row" style="justify-content:center"><button class="btn gh" data-a="again">Ещё раз</button><button class="btn" data-a="go" data-x="${R.back}">Готово</button></div>`;
 }
 page(R.title,h,R.back);
}
ACT.again=()=>{const k=R.kind,a=R.arg;R=null;views.run(k,a)};

/* ---------- вариант с таймером ---------- */
function rExam(){
 if(R.fin)return examRes();
 if(left()<=0)return examEnd();
 const it=R.items[R.i],t=P.egeType(it.n);
 let h=head()+`<div class="card"><div class="row sp"><span class="tag">Задание ${it.n} · ${plural(it.mx,'балл','балла','баллов')}</span></div><p class="task">${it.q}</p>`;
 if(t==='self')h+=`<p class="note">Реши на бланке. Решение и самооценка — после завершения варианта.</p><div class="row" style="margin-top:10px"><button class="btn" data-a="exGo" data-x="${R.i+1}">Дальше</button></div>`;
 else h+=`<form data-f="exam" class="ans"><input id="ui" class="inp" autocomplete="off" enterkeyhint="next" inputmode="${t==='num'?'decimal':t==='pm'?'text':'numeric'}" placeholder="Ответ" aria-label="Ответ на задание ${it.n}" value="${P.esc(it.s.user||'')}"><button class="btn" type="submit">Дальше</button></form><p class="note" style="margin-top:6px">${P.egeHint[t]}</p>`;
 h+=`</div><div class="dots" aria-label="Задания">${R.items.map((x,i)=>`<button class="${i===R.i?'on':''} ${x.s.user?'an':''}" data-a="exGo" data-x="${i}" aria-label="Задание ${x.n}">${x.n}</button>`).join('')}</div>
 <div class="row sp" style="margin-top:14px"><button class="btn sm gh" data-a="exGo" data-x="${R.i-1}" ${R.i?'':'disabled'}>Назад</button><button class="btn sm tl" data-a="exEnd">Завершить вариант</button></div>`;
 page(R.title,h,R.back);timer();
}
function saveCur(){const u=$('#ui');if(u&&R.items[R.i])R.items[R.i].s.user=u.value}
function examGo(i){if(i<0)return;if(i>=R.items.length)i=R.items.length-1;R.i=i;rExam()}
ACT.exGo=x=>{saveCur();examGo(+x)};
ACT.exEnd=()=>{saveCur();const n=R.items.filter(i=>!i.s.user&&P.egeType(i.n)!=='self').length;if(n&&!confirm(`Без ответа: ${plural(n,'задание','задания','заданий')}. Завершить?`))return;examEnd()};
function examEnd(){
 P.stopTick();R.fin=true;R.done=true;R.dur=Math.min(now()-R.t0,R.limit);
 R.items.forEach(it=>{if(P.egeType(it.n)==='self'){it.s.self=1;it.s.pt=0}else{it.s.pt=P.egeScore(it.n,it.a,it.s.user,it.mx);st.ege[it.key]={ok:it.s.pt===it.mx?1:0,a:1,pt:it.s.pt,mx:it.mx,tm:0,t:now()}}});
 R.rec={t:now(),kind:R.arg,dur:R.dur,mx:R.items.reduce((a,i)=>a+i.mx,0),per:{}};
 R.items.forEach(i=>R.rec.per[i.n]=i.s.pt);st.exams.push(R.rec);st.exams=st.exams.slice(-30);P.act('ege');save();examRes();
}
function examRes(){
 const pts=R.items.reduce((a,i)=>a+i.s.pt,0),mx=R.rec.mx,pend=R.items.filter(i=>i.s.self).length;
 R.rec.pts=pts;save();
 let h=`<div class="card res sec"><div class="big">${pts} / ${mx}</div><p>учебных первичных баллов${pend?` · ещё оцени ${plural(pend,'задание','задания','заданий')} части 2`:''}</p><p class="note">Время: ${P.mmss(R.dur)}. Это результат по авторским учебным заданиям, а не официальный балл ЕГЭ: перевод в тестовые баллы здесь не делается.</p></div>
 <div class="sec"><h2>По заданиям</h2><div class="dots">${R.items.map((x,i)=>`<button class="${x.s.self?'':x.s.pt===x.mx?'ok':'bad'}" data-a="exRv" data-x="${i}">${x.n}</button>`).join('')}</div></div><div id="exrv"></div>
 <div class="sec row" style="justify-content:center"><button class="btn gh" data-a="go" data-x="ege">К разделу ЕГЭ</button></div>`;
 page(R.title,h,R.back);
 const f=R.items.findIndex(i=>i.s.self||i.s.pt<i.mx);if(f>=0)review(f,false);
}
ACT.exRv=x=>review(+x,true);
function review(x,scroll){const it=R.items[x],t=P.egeType(it.n);
 $('#exrv').innerHTML=`<div class="card sec"><span class="tag">Задание ${it.n}</span><p>${it.q}</p>${t!=='self'?`<p>Твой ответ: <b>${P.esc(it.s.user||'—')}</b> · ${it.s.pt} из ${it.mx}</p>`:''}<div class="fb inf"><b>Ответ: ${it.a}</b><div style="margin-top:6px">${it.sol}</div></div>
 ${t==='self'?`<p class="small" style="margin-top:10px">Самооценка${it.s.self?'':' (можно изменить)'}:</p><div class="row">${Array.from({length:it.mx+1},(_,i)=>`<button class="btn sm ${i===it.s.pt&&!it.s.self?'':'gh'}" data-a="exSelf" data-x="${x}:${i}">${i}</button>`).join('')}</div>`:''}</div>`;
 if(scroll)$('#exrv').scrollIntoView({behavior:'smooth',block:'start'})}
ACT.exSelf=x=>{const [i,p]=x.split(':').map(Number),it=R.items[i];it.s.pt=p;it.s.self=0;R.rec.per[it.n]=p;st.ege[it.key]={ok:p===it.mx?1:0,a:1,pt:p,mx:it.mx,tm:0,t:now()};save();examRes();review(i,true)};

/* ---------- раздел ЕГЭ ---------- */
let ef={cat:'all',lvl:'all'};
views.ege=n=>{
 if(n)return egeOne(+n);
 const es=P.egeStats(),ex=st.exams.slice(-5).reverse();
 const chip=(k,v,l)=>`<button class="chip ${ef[k]===v?'on':''}" data-a="ef" data-x="${k}:${v}">${l}</button>`;
 const list=EGE.filter(t=>(ef.cat==='all'||EGE_CAT(t.n)===ef.cat)&&(ef.lvl==='all'||t.lvl===ef.lvl));
 let h=`<div class="card hero sec"><h2>Учебный вариант с таймером</h2><p class="note">26 заданий в формате ЕГЭ, 3 ч 55 мин. Ответы проверяются автоматически, часть 2 — самооценка по разбору.</p><div class="row" style="margin-top:12px"><button class="btn" data-a="go" data-x="run/exam/full">Полный вариант</button><button class="btn gh" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.6)" data-a="go" data-x="run/exam/p1">Только часть 1</button></div></div>
 <div class="sec"><div class="list">${P.li('run/egeweak','!','Слабые номера','Задания с низкой точностью и нерешённые','w')}${P.li('run/egemix','≋','Смешанная тренировка','10 заданий части 1')}</div></div>`;
 if(ex.length)h+=`<div class="sec"><h2>Результаты вариантов</h2><div class="card">${ex.map(e=>`<div class="row sp small" style="padding:6px 0;border-top:1px solid var(--line)"><span>${new Date(e.t).toLocaleDateString('ru-RU')} · ${e.kind==='p1'?'часть 1':'полный'} · ${P.mmss(e.dur)}</span><b>${e.pts==null?'—':e.pts} / ${e.mx}</b></div>`).join('')}
  ${ex.length>1?`<p class="note" style="margin:8px 0 0">Динамика: ${ex.slice().reverse().map(e=>pct((e.pts||0)/e.mx)).join(' → ')}</p>`:''}</div></div>`;
 h+=`<div class="sec"><h2>Задания по номерам</h2><div class="chips">${EGE_CATS.map(c=>chip('cat',c[0],c[1])).join('')}</div><div class="chips" style="margin-top:6px">${chip('lvl','all','Любая сложность')}${chip('lvl','Б','Базовый')}${chip('lvl','П','Повышенный')}${chip('lvl','В','Высокий')}</div>
 <div class="list" style="margin-top:10px">${list.map(t=>{const e=es[t.n];return `<button class="li" data-a="go" data-x="ege/${t.n}"><span class="ico ${e.a?e.acc>=.75?'ok':'w':''}">${t.n}</span><span class="tx"><b>${t.topic}</b><span>${t.fmt} · ${plural(t.pts,'балл','балла','баллов')}${e.a?` · точность ${pct(e.acc)}${e.tm?' · ~'+P.mmss(e.tm):''}`:''}</span></span><span class="ar">›</span></button>`}).join('')||'<div class="empty">Нет заданий с такими фильтрами</div>'}</div></div>
 <div class="sec card flat"><h3>Важно</h3><p class="note">Это авторские учебные задания в формате каждого номера (по 3 на номер), а не задания ФИПИ, и баллы здесь учебные. Структура, критерии и тематика номеров — по <a href="https://fipi.ru/ege/demoversii-specifikacii-kodifikatory" target="_blank" rel="noopener">демоверсии и спецификации ФИПИ</a>; реальные задания — в <a href="https://fipi.ru/ege/otkrytyy-bank-zadaniy-ege" target="_blank" rel="noopener">открытом банке</a>. Часть номеров (12, 13, 16, 17) относится к 11 классу. В расчётах g = 10 м/с².</p></div>`;
 page('ЕГЭ',h);
};
ACT.ef=x=>{const [k,v]=x.split(':');ef[k]=v;views.ege()};
function egeOne(n){
 const ti=EGE.findIndex(t=>t.n===n);if(ti<0)return go('ege');
 const t=EGE[ti],e=P.egeStats()[n],tps=EGE_TOPIC[n]||[];
 let h=`<div class="sec card"><span class="tag">${t.fmt}</span><span class="tag">${plural(t.pts,'балл','балла','баллов')}</span><span class="tag">уровень ${t.lvl}</span><h2 style="margin-top:6px">${t.topic}</h2>
 <p class="note">${P.egeHint[P.egeType(n)]}</p>${e.a?`<p class="small">Решено ${e.a} из ${t.items.length} · точность ${pct(e.acc)}${e.tm?' · среднее время '+P.mmss(e.tm):''}</p>`:''}
 <div class="row" style="margin-top:10px"><button class="btn" data-a="go" data-x="run/egen/${n}">Тренировать (${t.items.length})</button></div></div>`;
 if(tps.length)h+=`<div class="sec"><h2>Перед тренировкой</h2><div class="list">${tps.map(id=>P.li('study/topic/'+id,'↻','Повторить формулы: '+TOP[id].short,'Карточки темы','t')).join('')}${tps.map(id=>P.li('topic/'+id+'/1','ƒ','Конспект: '+TOP[id].short,'')).join('')}</div></div>`;
 else h+=`<p class="note sec">Это тема 11 класса или общие умения: в курсе 10 класса отдельного конспекта нет, разбор есть в решениях.</p>`;
 page('Задание '+n,h,'ege');
}
})();
