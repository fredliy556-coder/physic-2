/* Приложение: состояние, карточки, интервальное повторение, освоение тем, навигация.
   Данные курса (S, Q, T2, FIG, DG, TASKS, EGE, FC, LAW, B79, CONSTS, VIDS) — в index.html,
   новый учебный контент (L, EGE_TOPIC, EGE_CAT) — в learn.js и learn2.js. */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const strip=h=>String(h).replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const DAY=864e5,now=()=>Date.now();
const today=(t=new Date())=>t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const plural=(n,a,b,c)=>{const m=n%10,h=n%100;return n+' '+(m===1&&h!==11?a:m>=2&&m<=4&&(h<10||h>=20)?b:c)};
const pct=x=>Math.round(x*100)+'%';

/* ---------- хранилище (localStorage, ключ phys_v2) ---------- */
const KEY='phys_v2';
const DEF=()=>({v:2,goal:'school',theme:'auto',newLimit:15,split:{rev:5,new:10,prac:10,test:5},
 cards:{},star:{},nd:{d:'',n:0},topics:{},tasks:{},ege:{},exams:[],days:{},diag:null,cur:null,
 pd:{d:'',done:{}},errs:{},onb:false,shuf:false,cf:{sec:'all',type:'all',cls:'all'},hideInstall:false});
function migrate(s){
 const g=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
 const fc=g('fiz10_fc');
 if(fc&&fc.c){Object.keys(fc.c).forEach(id=>{s.cards[id]=Object.assign({l:0,h:[]},fc.c[id])});s.star=fc.s||{}}
 (g('fiz10_tasks')||[]).forEach(k=>{s.tasks[k]={ok:1,a:1,t:now()}});
 (g('fiz10_ege')||[]).forEach(k=>{s.ege[k]={ok:1,a:1,pt:0,mx:0,tm:0,t:now()}});
 (g('fiz10_done')||[]).forEach(id=>{s.topics[id]={read:now()}});
 let th=null;try{th=localStorage.getItem('fiz10_theme')}catch(e){}
 if(th)s.theme=th;
 if(fc||g('fiz10_tasks')||g('fiz10_done'))s.onb=true;
}
function load(){
 let s=null;try{s=JSON.parse(localStorage.getItem(KEY))}catch(e){}
 if(!s||typeof s!=='object'){s=DEF();migrate(s)}
 const d=DEF();s=Object.assign(d,s);s.split=Object.assign(DEF().split,s.split);s.cf=Object.assign(DEF().cf,s.cf);
 return s;
}
let st=load(),saveT=0;
function saveNow(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){toast('Не удалось сохранить: память браузера заполнена')}}
function save(){clearTimeout(saveT);saveT=setTimeout(saveNow,200)}
addEventListener('pagehide',saveNow);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveNow()});
function act(k,n=1){const d=today(),x=st.days[d]||(st.days[d]={});x[k]=(x[k]||0)+n;save()}
function streak(){let n=0,t=new Date();if(!st.days[today(t)])t=new Date(t.getTime()-DAY);
 while(st.days[today(t)]){n++;t=new Date(t.getTime()-DAY)}return n}
function toast(m){const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}

/* ---------- структура курса ---------- */
const SECS=[['mech','Механика',['intro','kin','dyn','cons','stat']],['mol','МКТ и термодинамика',['mkt','thermo']],['el','Электродинамика',['es','dc']]];
const secOf=id=>{const s=SECS.find(x=>x[2].includes(id));return s?s[0]:null};
const TOP={};S.forEach((c,i)=>{TOP[c.id]=Object.assign({i,short:c.t.split(':')[0]},c)});
const ORDER=S.map(c=>c.id);
const LV=['Понять','Запомнить','Применить','Проверить'];

/* ---------- карточки всех типов ---------- */
const CT={f:'Формула',r:'Смысл формулы',l:'Закон и определение',s:'Обозначение и единица',u:'Перевод в СИ',g:'График и схема',c:'Условия применимости',w:'Почему? Что будет, если?',e:'Типичная ошибка',k:'Какой закон применить',b:'База 7–9 класса'};
const CARDS=[],CM={};
function addC(c){let id=c.id||c.t+hsh(c.q+'|'+(c.top||'')),b=id,n=1;while(CM[id])id=b+'_'+(++n);c.id=id;CM[id]=c;CARDS.push(c)}
const fx=(f,ch)=>`<div class="fm">${f}</div>${ch?legend(ch,f):''}`;
FC.forEach(c=>{
 if(c.deck==='f'){
  const adv=c.tag.includes('дополнительно'),nt=c.note?`<div class="nt">${c.note}</div>`:'';
  addC({id:c.id,t:'f',top:c.ch,sec:secOf(c.ch),cls:'10',q:`Запиши формулу:<br><b>${c.name}</b>`,a:fx(c.body,c.ch)+nt,sub:c.tag});
  if(!adv&&!/[А-Яа-я]{4,}/.test(strip(c.body)))addC({id:'r'+c.id,t:'r',top:c.ch,sec:secOf(c.ch),cls:'10',q:`<div class="fm">${c.body}</div>Что это за формула? Что означает каждая буква?`,a:`<b>${c.name}</b>${legend(c.ch,c.body)}${nt}`,sub:c.tag});
 }else if(c.deck==='l'){
  const sec={mech:'mech',mkt:'mol',el:'el'}[c.ch]||null;
  addC({id:c.id,t:'l',top:null,sec,cls:'10',q:`<b>${c.name}</b><br><span class="note">Сформулируй и запиши</span>`,a:c.body,sub:c.tag});
 }else{
  const sec=/Тепл/.test(c.tag)?'mol':/Электр/.test(c.tag)?'el':'mech';
  addC({id:c.id,t:'b',top:null,sec,cls:c.ch,q:`Запиши формулу:<br><b>${c.name}</b>`,a:`<div class="fm">${c.body}</div>${c.note?`<div class="nt">${c.note}</div>`:''}`,sub:c.tag});
 }
});
Object.keys(Q).forEach(k=>Q[k].forEach(r=>addC({t:'s',top:k,sec:secOf(k),cls:'10',q:`<div class="fm">${r[0]}</div>Тема «${TOP[k].short}»: что это за величина и в чём измеряется?`,a:`<b>${r[1]}</b>${r[2]&&r[2]!=='—'?', единица: <b>'+r[2]+'</b>':' (безразмерная)'}${r[3]?`<p class="note">${r[3]}</p>`:''}`})));
[['72 км/ч','20 м/с: делим на 3,6'],['15 м/с','54 км/ч: умножаем на 3,6'],['1 мкКл','10⁻⁶ Кл'],['1 нКл','10⁻⁹ Кл'],['1 пФ','10⁻¹² Ф'],['1 мкФ','10⁻⁶ Ф'],['1 л','10⁻³ м³'],['1 см³','10⁻⁶ м³'],['1 см²','10⁻⁴ м²'],['1 мм²','10⁻⁶ м²'],['1 г/см³','1000 кг/м³'],['1 атм','≈ 10⁵ Па'],['1 мм рт. ст.','≈ 133 Па'],['1 кВт·ч','3,6·10⁶ Дж'],['27 °C','300 К (T = t + 273)'],['1 эВ','1,6·10⁻¹⁹ Дж'],['1 т','10³ кг'],['1 ч','3600 с'],['1 мА','10⁻³ А'],['1 мг','10⁻⁶ кг']]
 .forEach(r=>addC({t:'u',top:'intro',sec:'mech',cls:'10',q:`Переведи в СИ:<br><b>${r[0]}</b>`,a:`<b>${r[1]}</b>`}));
Object.keys(DG).forEach(k=>DG[k].forEach(f=>addC({t:'g',top:k,sec:secOf(k),cls:'10',q:`<figure class="dg">${FIG[f][0]}</figure>Что показывает эта схема? Назови главные правила.`,a:FIG[f][1]})));
const CONDS=[
 ['kin',`s = v<sub>0</sub>t + ${fr('at<sup>2</sup>','2')}`,'Только при постоянном ускорении (a = const). Проекции берут со знаком.'],
 ['kin',`v<sub>ср</sub> = ${fr('v<sub>1</sub> + v<sub>2</sub>','2')}`,'Только для равных промежутков времени или для равноускоренного движения (тогда v₁, v₂ — начальная и конечная скорости).'],
 ['dyn','F<sub>тр</sub> = μN','Это трение скольжения: тело скользит. Если тело покоится, трение покоя равно приложенной силе и не больше μN.'],
 ['dyn',`F = G${fr('m<sub>1</sub>m<sub>2</sub>','r<sup>2</sup>')}`,'Для материальных точек и однородных шаров; r — расстояние между центрами.'],
 ['dyn','F = kx','Только малые упругие деформации (закон Гука).'],
 ['cons','m<sub>1</sub>v<sub>1</sub> + m<sub>2</sub>v<sub>2</sub> = const','Замкнутая система, очень короткое взаимодействие или проекция на ось, вдоль которой внешних сил нет.'],
 ['cons','E<sub>к</sub> + E<sub>п</sub> = const','Нет трения и неупругих ударов: работают только сила тяжести и сила упругости.'],
 ['cons','A = Fs cos α','Сила постоянна, перемещение прямолинейное.'],
 ['stat','p = ρgh','Покоящаяся жидкость; h — глубина от поверхности. Это давление без учёта атмосферного.'],
 ['mkt','pV = νRT','Идеальный (разреженный) газ, T только в кельвинах.'],
 ['mkt','pV = const','Изотермический процесс (T = const), масса газа не меняется.'],
 ['thermo',`U = ${fr('3','2')}νRT`,'Только для одноатомного идеального газа.'],
 ['thermo',`η = 1 − ${fr('T<sub>2</sub>','T<sub>1</sub>')}`,'Идеальная машина (цикл Карно). Для реальных машин это верхняя граница КПД.'],
 ['thermo','Q = cmΔt','Только без фазовых переходов (нет плавления и кипения).'],
 ['es',`F = k${fr('|q<sub>1</sub>||q<sub>2</sub>|','r<sup>2</sup>')}`,'Точечные неподвижные заряды. В среде делим ещё на ε.'],
 ['es','U = Ed','Только однородное поле; d — расстояние вдоль линий напряжённости.'],
 ['dc',`I = ${fr('U','R')}`,'Участок цепи без источника тока; металлический проводник при постоянной температуре.'],
 ['dc',`I = ${fr('ℰ','R + r')}`,'Замкнутая цепь с одним источником.']];
CONDS.forEach(r=>addC({t:'c',top:r[0],sec:secOf(r[0]),cls:'10',q:`<div class="fm">${r[1]}</div>Когда эту формулу можно применять?`,a:r[2]}));
Object.keys(L).forEach(k=>{const x=L[k],sc=secOf(k);
 (x.cards||[]).forEach(r=>addC({t:'w',top:k,sec:sc,cls:'10',q:r[0],a:r[1]}));
 (x.mis||[]).forEach(r=>addC({t:'e',top:k,sec:sc,cls:'10',q:`Найди ошибку в рассуждении:<br>«${r[0]}»`,a:r[1]}));
 (x.which||[]).forEach(r=>addC({t:'k',top:k,sec:sc,cls:'10',q:`${r[0]}<br><span class="note">Какую формулу применить?</span>`,a:`<div class="fm">${r[1]}</div>`}));
});

/* ---------- интервальное повторение (упрощённый SM-2) ---------- */
function srs(s0,g){
 const s=Object.assign({i:0,e:2.5,n:0,l:0,h:[]},s0||{});let i=s.i,e=s.e,n=s.n,d;
 if(g===0){e=Math.max(1.3,e-.2);n=0;i=0;d=now()+6e5;s.l=(s.l||0)+1}
 else{
  if(g===1){i=n===0?1:Math.max(1,Math.round(i*1.2));e=Math.max(1.3,e-.15)}
  else if(g===2){i=n===0?2:n===1?4:Math.max(i+1,Math.round(i*e))}
  else{i=n===0?4:Math.max(i+2,Math.round(Math.max(i,1)*e*1.3));e=Math.min(3,e+.15)}
  n++;d=now()+i*DAY;
 }
 return Object.assign(s,{i,e,n,d,g});
}
const ivl=r=>r.i===0?'10 мин':r.i<31?plural(r.i,'день','дня','дней'):Math.round(r.i/30)+' мес.';
const cst=id=>st.cards[id];
const isDue=id=>{const s=cst(id);return !!s&&s.d<=now()};
const isHard=id=>{const s=cst(id);return !!s&&((s.l||0)>0&&s.i<7||s.g===0||s.g===1)};
function cfilter(list){const f=st.cf;return list.filter(c=>(f.sec==='all'||c.sec===f.sec)&&(f.type==='all'||c.t===f.type)&&(f.cls==='all'||(f.cls==='79'?c.cls!=='10':c.cls==='10')))}
function newToday(){if(st.nd.d!==today())st.nd={d:today(),n:0};return Math.max(0,st.newLimit-st.nd.n)}
function dueList(list){return list.filter(c=>isDue(c.id)).sort((a,b)=>(cst(b.id).l||0)-(cst(a.id).l||0)||cst(a.id).d-cst(b.id).d)}
function dueCount(){return CARDS.filter(c=>isDue(c.id)).length}
function cardStats(list){let nw=0,lr=0,ms=0,du=0;list.forEach(c=>{const s=cst(c.id);if(!s)nw++;else{if(s.i>=21)ms++;else lr++;if(s.d<=now())du++}});return {nw,lr,ms,du,t:list.length}}
function retention(days=14){let ok=0,all=0;const from=now()-days*DAY;Object.values(st.cards).forEach(s=>(s.h||[]).forEach(h=>{if(h[0]>=from){all++;if(h[1]>=2)ok++}}));return all?ok/all:null}

/* ---------- освоение темы: тест, задачи, карточки (чтение не считается) ---------- */
function taskStat(id){let ok=0,att=0;TASKS.forEach((x,ti)=>{if(x.ch!==id)return;x.items.forEach((_,i)=>{const r=st.tasks[ti+'.'+i];if(r){att++;if(r.ok)ok++}})});return {ok,att}}
function mastery(id){
 const t=st.topics[id]||{},tc=CARDS.filter(c=>c.top===id);
 const q=t.qb||0,ts=taskStat(id),tk=Math.min(1,ts.ok/6);
 const good=tc.filter(c=>{const s=cst(c.id);return s&&s.i>=3}).length,cd=Math.min(1,good/Math.min(20,tc.length||1));
 const base=st.diag&&st.diag.res&&st.diag.res[id]!=null?st.diag.res[id]*0.25:0;
 return Math.round(100*Math.max(base,0.4*q+0.35*tk+0.25*cd));
}
function mlabel(id){const m=mastery(id),r=st.topics[id]&&st.topics[id].read;
 return m>=75?['Освоена','m3']:m>=40?['Закрепляю','m2']:m>0||r?['Знакомлюсь','m1']:['Не начата','']}
/* Рекомендация: идём по программе, но темы, верно решённые в диагностике и ещё не начатые, откладываем на потом. */
function recTopic(){
 const dg=st.diag&&st.diag.res||{},open=id=>mastery(id)<75;
 return ORDER.find(id=>open(id)&&!(dg[id]===1&&!(st.topics[id]&&st.topics[id].read)))||ORDER.find(open)||ORDER[ORDER.length-1];
}
function curTopic(){return st.cur&&TOP[st.cur]&&mastery(st.cur)<75?st.cur:recTopic()}
function nextStep(id){
 const t=st.topics[id]||{},tc=CARDS.filter(c=>c.top===id),seen=tc.filter(c=>cst(c.id)).length;
 if(!t.read)return 0;
 if(seen<Math.min(15,tc.length*0.5))return 1;
 if(taskStat(id).ok<6)return 2;
 return 3;
}
function weakSpots(){
 const out=[];
 TASKS.forEach((x,ti)=>{let ok=0,bad=0;x.items.forEach((_,i)=>{const r=st.tasks[ti+'.'+i];if(r){if(r.ok)ok++;else bad++}});
  if(bad)out.push({w:bad/(ok+bad)+bad*.05,t:x.sub,s:`Задачи: ${bad} с ошибкой`,a:'sub',x:ti})});
 ORDER.forEach(id=>{const h=CARDS.filter(c=>c.top===id&&isHard(c.id)).length;
  if(h>=2)out.push({w:.3+h*.04,t:TOP[id].short,s:`Карточки: ${plural(h,'трудная','трудные','трудных')}`,a:'cram',x:id})});
 const es=egeStats();Object.keys(es).forEach(n=>{const e=es[n];if(e.a>=1&&e.acc<.6)out.push({w:.6-e.acc+.2,t:'ЕГЭ, задание '+n,s:`Точность ${pct(e.acc)}`,a:'egeN',x:n})});
 return out.sort((a,b)=>b.w-a.w).slice(0,4);
}
function egeStats(){const r={};EGE.forEach((t,ti)=>{let a=0,pt=0,mx=0,tm=0,k=0;t.items.forEach((_,i)=>{const e=st.ege[ti+'.'+i];if(e&&e.a){a++;pt+=e.mx?e.pt:e.ok?1:0;mx+=e.mx||1;if(e.tm){tm+=e.tm;k++}}});
 r[t.n]={a,acc:mx?pt/mx:0,tm:k?tm/k:0}});return r}

/* ---------- план на день ---------- */
const PRESET={15:{rev:5,new:5,prac:5,test:0},30:{rev:5,new:10,prac:10,test:5},45:{rev:10,new:15,prac:15,test:5},60:{rev:10,new:20,prac:20,test:10}};
function pd(){if(st.pd.d!==today())st.pd={d:today(),done:{}};return st.pd}
function planDone(k){pd().done[k]=1;save()}
function dayPlan(){
 const sp=st.split,cur=curTopic(),lv=nextStep(cur),due=dueCount(),it=[];
 if(sp.rev)it.push({k:'rev',t:'Повторение карточек',s:`${sp.rev} мин · ждут повторения: ${due}`});
 if(sp.new)it.push({k:'new',t:`${LV[lv]}: ${TOP[cur].short}`,s:`${sp.new} мин · следующий шаг по теме`});
 if(sp.prac)it.push({k:'prac',t:'Задачи',s:`${sp.prac} мин · ${plural(Math.max(3,Math.round(sp.prac/2.5)),'задача','задачи','задач')} по изученным темам`});
 if(sp.test)it.push({k:'test',t:st.goal==='ege'?'ЕГЭ: слабые номера':'Мини-тест',s:`${sp.test} мин · проверка без подсказок`});
 return it;
}

/* ---------- навигация ---------- */
const views={},ACT={},TAB={home:'home',learn:'learn',topic:'learn',ref:'learn',cards:'cards',study:'cards',prac:'prac',run:'prac',ege:'ege',settings:'home',onb:'home'};
let backTo=null;
function go(h){if(location.hash.slice(1)===h)route();else location.hash=h}
function page(title,html,back){
 $('#title').textContent=title;backTo=back||null;$('#back').hidden=!back;
 const v=$('#view');v.innerHTML=html;v.classList.remove('view');void v.offsetWidth;v.classList.add('view');
}
function route(){
 const [v,...a]=(location.hash.slice(1)||'home').split('/').map(decodeURIComponent);
 stopTick();
 (views[v]||views.home)(...a);
 const tab=v==='run'&&/^(ege|exam)/.test(a[0]||'')?'ege':TAB[v]||'home';
 document.querySelectorAll('.tabbar button').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===tab?'page':'false'));
 scrollTo(0,0);badge();
}
function badge(){const b=$('#dueBadge');if(!b)return;const n=dueCount();b.textContent=n>99?'99+':n;b.hidden=!n}
let tick=null;
function startTick(fn){stopTick();tick=setInterval(fn,1000)}
function stopTick(){if(tick){clearInterval(tick);tick=null}}
const mmss=ms=>{ms=Math.max(0,ms);const s=Math.round(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')};

document.addEventListener('click',e=>{
 const t=e.target.closest('[data-a]');if(!t)return;
 const f=ACT[t.dataset.a];if(f){e.preventDefault();f(t.dataset.x,t,e)}
});
ACT.go=x=>go(x);
$('#back').addEventListener('click',()=>{if(backTo)go(backTo);else history.back()});
document.querySelectorAll('.tabbar button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.tab)));
addEventListener('scroll',()=>$('#top').classList.toggle('sc',scrollY>4),{passive:true});

/* ---------- тема оформления, офлайн ---------- */
function applyTheme(){
 const dark=st.theme==='dark'||st.theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches;
 document.documentElement.dataset.theme=dark?'dark':'light';
 const m=document.querySelector('meta[name=theme-color]');if(m)m.content=dark?'#0b1220':'#f4f7fb';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);
function net(){$('#offl').hidden=navigator.onLine!==false}
addEventListener('online',net);addEventListener('offline',net);

/* общий доступ для остальных частей приложения */
window.PH={$,strip,DAY,now,today,shuffle,plural,pct,get st(){return st},set st(v){st=v},save,saveNow,act,streak,toast,SECS,secOf,TOP,ORDER,LV,CT,CARDS,CM,srs,ivl,cst,isDue,isHard,cfilter,newToday,dueList,dueCount,cardStats,retention,taskStat,mastery,mlabel,recTopic,curTopic,nextStep,weakSpots,egeStats,PRESET,pd,planDone,dayPlan,views,ACT,go,page,route,startTick,stopTick,mmss,applyTheme,net,badge,KEY,DEF};
})();
