/* Экраны: карточки (фильтры, режимы) и сессия повторения с активным воспроизведением. */
(()=>{
'use strict';
const P=window.PH,{$,plural,pct,TOP,ORDER,SECS,CT,CARDS,CM,views,ACT,go,page,save,toast}=P;
const st=P.st;
const TPRI='fswkceugrlb';

/* очередь новых карточек: сначала текущая тема, затем изученные темы, затем база 7–9 */
function newPool(list){
 const cur=P.curTopic(),read=id=>id===cur||(st.topics[id]&&st.topics[id].read);
 const secs=new Set(ORDER.filter(read).map(P.secOf));
 const ok=c=>c.top?read(c.top):c.t==='b'||c.sec==null||secs.has(c.sec);
 let pool=list.filter(c=>!P.cst(c.id)&&ok(c));
 const ti=c=>c.top===cur?-1:c.top?ORDER.indexOf(c.top):20;
 pool.sort((a,b)=>ti(a)-ti(b)||TPRI.indexOf(a.t)-TPRI.indexOf(b.t));
 return pool;
}
function buildQueue(mode,arg){
 const base=P.cfilter(CARDS);let q=[],title='Повторение',limit=0;
 if(mode==='daily'||mode==='quick'){
  q=P.dueList(base).map(c=>c.id).concat(newPool(base).slice(0,P.newToday()).map(c=>c.id));
  if(mode==='quick'){limit=(+arg||10)*60e3;title='Быстрая сессия · '+(+arg||10)+' мин'}
  else title='Ежедневное повторение';
 }else if(mode==='hard'){q=base.filter(c=>P.isHard(c.id)).map(c=>c.id);title='Только ошибки'}
 else if(mode==='star'){q=base.filter(c=>st.star[c.id]).map(c=>c.id);title='Избранные'}
 else if(mode==='topic'){q=CARDS.filter(c=>c.top===arg).sort((a,b)=>TPRI.indexOf(a.t)-TPRI.indexOf(b.t)).map(c=>c.id);title=TOP[arg]?TOP[arg].short:'Тема'}
 else if(mode==='all'){q=base.map(c=>c.id);title='Весь набор'}
 if(st.shuf||mode==='hard'||mode==='star')q=P.shuffle(q);
 return {mode,arg,q,title,limit,t0:P.now(),done:0,g:[0,0,0,0],seen:new Set(),newN:0,flip:false};
}
let S_=null;

/* ---------- список режимов ---------- */
views.cards=()=>{
 const f=st.cf,base=P.cfilter(CARDS),cs=P.cardStats(base),hard=base.filter(c=>P.isHard(c.id)).length,stars=base.filter(c=>st.star[c.id]).length;
 const nNew=Math.min(P.newToday(),newPool(base).length),ret=P.retention();
 const chip=(k,v,l)=>`<button class="chip ${f[k]===v?'on':''}" data-a="cf" data-x="${k}:${v}">${l}</button>`;
 const types=[...new Set(CARDS.map(c=>c.t))];
 let h=`<div class="card hero sec"><h2>Ежедневное повторение</h2><p class="note">К повторению: ${cs.du} · новых сегодня: ${nNew}</p>
 <div class="row" style="margin-top:12px"><button class="btn" data-a="go" data-x="study/daily" ${cs.du+nNew?'':'disabled'}>${cs.du+nNew?'Начать':'На сегодня всё'}</button></div></div>
 <div class="sec"><h2>Быстрая сессия</h2><div class="grid2" style="grid-template-columns:repeat(3,1fr)">${[5,10,20].map(m=>`<button class="btn gh" data-a="go" data-x="study/quick/${m}">${m} мин</button>`).join('')}</div></div>
 <div class="sec"><div class="list">${P.li('study/hard','!',`Только ошибки: ${hard}`,'Карточки, которые ты забывал или вспоминал с трудом','w')}${P.li('study/star','★',`Избранные: ${stars}`,'Отмечай звёздочкой во время повторения')}${P.li('study/all','∑','Весь набор по фильтру: '+base.length,'Без расписания, для повторения перед контрольной','t')}</div></div>
 <div class="sec"><h2>Тема целиком</h2><div class="chips">${ORDER.map(id=>`<button class="chip" data-a="go" data-x="study/topic/${id}">${TOP[id].short} <small>${CARDS.filter(c=>c.top===id).length}</small></button>`).join('')}</div></div>
 <div class="sec"><h2>Фильтр</h2><div class="card"><p class="small muted" style="margin:0 0 6px">Раздел</p><div class="chips">${chip('sec','all','Все')}${SECS.map(s=>chip('sec',s[0],s[1])).join('')}</div>
 <p class="small muted" style="margin:12px 0 6px">Класс</p><div class="chips">${chip('cls','all','Все')}${chip('cls','10','10 класс')}${chip('cls','79','7–9 класс')}</div>
 <p class="small muted" style="margin:12px 0 6px">Тип карточек</p><div class="chips">${chip('type','all','Все')}${types.map(t=>chip('type',t,CT[t]+' <small>'+CARDS.filter(c=>c.t===t).length+'</small>')).join('')}</div>
 <div class="field" style="margin-top:10px"><label for="shf">Перемешивать</label><input id="shf" type="checkbox" ${st.shuf?'checked':''} style="width:22px;height:22px;accent-color:var(--acc)"></div></div></div>
 <div class="sec"><h2>Статистика</h2><div class="card"><div class="kpis"><div class="kpi"><b>${cs.ms}</b><span>выучено (интервал 3+ нед.)</span></div><div class="kpi"><b>${cs.lr}</b><span>в процессе</span></div><div class="kpi"><b>${ret==null?'—':pct(ret)}</b><span>верно за 2 недели</span></div></div>
 <div class="pb" style="margin-top:12px"><i class="ok" style="width:${cs.ms/(cs.t||1)*100}%"></i><i class="t" style="width:${cs.lr/(cs.t||1)*100}%"></i></div>
 <p class="note" style="margin-top:8px">Карточка, которую ты вспомнил, вернётся через всё больший интервал. Забытая вернётся через 10 минут и попадёт в «Только ошибки».</p></div></div>`;
 page('Карточки',h);
 $('#shf').addEventListener('change',e=>{st.shuf=e.target.checked;save()});
};
ACT.cf=x=>{const [k,v]=x.split(':');st.cf[k]=v;save();views.cards()};

/* ---------- сессия ---------- */
views.study=(mode,arg)=>{
 if(!S_||S_.mode!==mode||S_.arg!==arg||S_.ended)S_=buildQueue(mode,arg);
 render();
};
function left(){return S_.limit?S_.limit-(P.now()-S_.t0):0}
function render(){
 const s=S_,id=s.q[0],timeUp=s.limit&&left()<=0;
 if(!id||timeUp)return finish(timeUp);
 const c=CM[id],cs=P.cst(id),isNew=!cs;
 const total=s.done+s.q.length;
 const grades=['Не помню','С трудом','Хорошо','Легко'].map((n,g)=>`<button class="gr g${g}" data-a="grade" data-x="${g}"><b>${n}</b><span>${P.ivl(P.srs(cs?JSON.parse(JSON.stringify(cs)):null,g))}</span></button>`).join('');
 const h=`<div class="prog"><span>${s.done} / ${total}</span><span class="pb"><i style="width:${s.done/total*100}%"></i></span>${s.limit?`<span class="timer" id="tmr">${P.mmss(left())}</span>`:''}</div>
 <div class="row sp"><span class="tag">${CT[c.t]}${c.top?' · '+TOP[c.top].short:''}${isNew?' · новая':''}</span><button class="star" data-a="star" aria-label="${st.star[id]?'Убрать из избранного':'В избранное'}">${st.star[id]?'★':'☆'}</button></div>
 <div class="fc ${s.flip?'fl':''}" id="fc" data-a="flip" role="button" tabindex="0" aria-label="Перевернуть карточку">
  <div class="fc-in"><div class="fc-f"><div class="fc-cap">Вспомни ответ</div><div class="fc-q">${c.q}</div></div>
  <div class="fc-f bk"><div class="fc-cap">Ответ</div><div class="fc-a">${c.a}</div>${c.sub?`<div class="fc-x">${c.sub}</div>`:''}</div></div></div>
 <div id="fcAct">${s.flip?`<div class="grades">${grades}</div><p class="note" style="text-align:center;margin-top:8px">Оцени честно: так расписание подстроится под тебя.</p>`:`<div class="row" style="justify-content:center;margin-top:14px"><button class="btn" data-a="flip" style="min-width:60%">Показать ответ</button></div><p class="note" style="text-align:center;margin-top:8px">Сначала вспомни сам, проговори ответ или запиши.</p>`}</div>`;
 page(s.title,h,'cards');
 if(s.limit)P.startTick(()=>{const t=$('#tmr');if(!t)return P.stopTick();t.textContent=P.mmss(left());t.classList.toggle('lo',left()<60e3)});
}
ACT.flip=()=>{if(!S_||!S_.q.length)return;
 /* после показа ответа нажатие на карточку только переворачивает её, оценки остаются на экране */
 if(S_.flip){const f=$('#fc');if(f)f.classList.toggle('fl');return}
 S_.flip=true;
 const f=$('#fc');if(f)f.classList.toggle('fl',S_.flip);
 if(S_.flip){const id=S_.q[0],cs=P.cst(id);$('#fcAct').innerHTML=`<div class="grades">${['Не помню','С трудом','Хорошо','Легко'].map((n,g)=>`<button class="gr g${g}" data-a="grade" data-x="${g}"><b>${n}</b><span>${P.ivl(P.srs(cs?JSON.parse(JSON.stringify(cs)):null,g))}</span></button>`).join('')}</div><p class="note" style="text-align:center;margin-top:8px">Оцени честно: так расписание подстроится под тебя.</p>`}
 else render()};
ACT.grade=g=>{
 g=+g;const s=S_,id=s.q.shift();if(!id)return;
 const prev=P.cst(id);
 if(!prev){if(P.st.nd.d!==P.today())P.st.nd={d:P.today(),n:0};P.st.nd.n++;s.newN++}
 const n=P.srs(prev,g);n.h=(prev&&prev.h||[]).concat([[P.now(),g]]).slice(-20);
 st.cards[id]=n;s.g[g]++;
 if(g===0){s.q.splice(Math.min(3,s.q.length),0,id)}else s.done++;
 s.flip=false;P.act('cards');save();P.badge();render();
};
ACT.star=()=>{const id=S_&&S_.q[0];if(!id)return;if(st.star[id])delete st.star[id];else st.star[id]=1;save();const b=document.querySelector('.star');if(b){b.textContent=st.star[id]?'★':'☆'}};
function finish(timeUp){
 const s=S_;s.ended=true;P.stopTick();
 const n=s.g.reduce((a,b)=>a+b,0),ok=s.g[2]+s.g[3];
 if(s.mode==='daily'||s.mode==='quick'){if(n)P.planDone('rev')}
 if(s.mode==='topic'&&n)P.planDone('new');
 const base=P.cfilter(CARDS),moreNew=s.mode==='daily'&&newPool(base).length>0;
 let h=`<div class="card res sec">${n?`<div class="big">${n}</div><p>${plural(n,'ответ','ответа','ответов')}${timeUp?' · время вышло':''}</p><p class="note">Хорошо и легко: ${ok} · с трудом: ${s.g[1]} · не помню: ${s.g[0]}</p>`:`<h2>Карточек нет</h2><p class="note">${s.mode==='hard'?'Трудных карточек нет. Отлично.':s.mode==='star'?'Отмечай карточки звёздочкой во время повторения.':'По расписанию сейчас ничего нет. Загляни позже или изучи новую тему.'}</p>`}</div>
 <div class="sec row" style="justify-content:center">${moreNew?`<button class="btn" data-a="moreNew">Ещё 10 новых</button>`:''}${s.g[0]+s.g[1]?`<button class="btn gh" data-a="go" data-x="study/hard">Повторить трудные</button>`:''}<button class="btn gh" data-a="go" data-x="home">На главную</button></div>`;
 page(s.title,h,'cards');
}
ACT.moreNew=()=>{st.nd.n=Math.max(0,st.nd.n-10);save();S_=null;go('study/daily')};

document.addEventListener('keydown',e=>{
 if(!S_||S_.ended||!location.hash.startsWith('#study')||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.target.closest&&e.target.closest('input,select,textarea'))return;
 if(e.key===' '||e.key==='Enter'){if(e.target.closest&&e.target.closest('button')&&e.target.id!=='fc')return;e.preventDefault();ACT.flip()}
 else if(S_.flip&&['1','2','3','4'].includes(e.key))ACT.grade(+e.key-1);
});
})();
