/* Экраны: главная, первый запуск, обучение (темы, справочник, поиск), настройки. */
(()=>{
'use strict';
const P=window.PH,{$,plural,pct,TOP,ORDER,SECS,LV,CARDS,views,ACT,go,page,save,toast}=P;
const st=P.st;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fxHTML=(ch,r)=>`<div class="fx"><div class="nm">${r[0]}</div><div class="fm">${r[1]}</div>${legend(ch,r[1])}${r[2]?`<div class="nt">${r[2]}</div>`:''}</div>`;
P.fxHTML=fxHTML;P.esc=esc;
const li=(a,ico,title,sub,cls='')=>`<button class="li" data-a="go" data-x="${a}"><span class="ico ${cls}">${ico}</span><span class="tx"><b>${title}</b>${sub?`<span>${sub}</span>`:''}</span><span class="ar" aria-hidden="true">›</span></button>`;
P.li=li;
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;

/* куда ведёт «Продолжить»: следующий шаг по текущей теме */
function contHref(){
 if(P.dueCount()>=10&&!P.pd().done.rev)return 'study/daily';
 const id=P.curTopic(),lv=P.nextStep(id);
 if(lv===1)return 'study/topic/'+id;
 if(lv===2){const ti=TASKS.findIndex((x,ti)=>x.ch===id&&x.items.some((_,i)=>!(st.tasks[ti+'.'+i]||{}).ok));return ti>=0?'run/sub/'+ti:'topic/'+id+'/2'}
 return 'topic/'+id+'/'+lv;
}
const planHref={rev:()=>'study/daily',new:()=>contHref().startsWith('study/daily')?'topic/'+P.curTopic()+'/'+P.nextStep(P.curTopic()):contHref(),prac:()=>'run/daily',test:()=>st.goal==='ege'?'run/egeweak':'run/mixquiz'};

/* ---------- главная ---------- */
views.home=()=>{
 if(!st.onb)return go('onb');
 const id=P.curTopic(),lv=P.nextStep(id),m=P.mastery(id),due=P.dueCount(),rec=P.recTopic();
 const pdn=P.pd().done,plan=P.dayPlan(),ndone=plan.filter(x=>pdn[x.k]).length;
 const all=CARDS.length,cs=P.cardStats(CARDS),solved=Object.values(st.tasks).filter(x=>x.ok).length;
 const ret=P.retention(),sk=P.streak(),ws=P.weakSpots();
 let h=`<div class="card hero sec"><p class="small muted" style="margin:0">Сейчас изучаю</p><h2 style="margin:2px 0 4px">${TOP[id].short}</h2>
 <p class="note" style="margin:0 0 10px">Шаг «${LV[lv]}» · освоено ${m}%</p>
 <div class="pb" style="background:rgba(255,255,255,.3)"><i style="width:${m}%;background:#fff"></i></div>
 <div class="row" style="margin-top:14px"><button class="btn" data-a="go" data-x="${contHref()}">Продолжить обучение</button></div></div>`;
 h+=`<div class="sec"><div class="sh"><h2>План на сегодня</h2><span class="note">${ndone} из ${plan.length}</span></div><div class="card plan">`;
 plan.forEach(x=>{const d=pdn[x.k];h+=`<div class="pi ${d?'dn':''}"><button class="ck" data-a="pdTog" data-x="${x.k}" aria-label="${d?'Снять отметку':'Отметить выполненным'}: ${x.t}">${d?'✓':''}</button><button class="tx lnk" style="color:inherit;text-align:left" data-a="go" data-x="${planHref[x.k]()}"><b>${x.t}</b><span>${x.s}</span></button></div>`});
 h+=`<p class="note" style="margin:8px 0 0">${ndone===plan.length?'План выполнен. Можно остановиться: регулярность важнее объёма.':'Нажми на пункт, чтобы начать. Длительность меняется в настройках.'}</p></div></div>`;
 h+=`<div class="sec kpis"><div class="kpi"><b>${due}</b><span>карточек ждут</span></div><div class="kpi"><b>${sk}</b><span>${sk===1?'день подряд':'дней подряд'}</span></div><div class="kpi"><b>${ret==null?'—':pct(ret)}</b><span>вспоминаю верно</span></div></div>`;
 h+=`<div class="sec"><div class="list">`;
 if(due)h+=li('study/daily','↻',`Повторить карточки: ${due}`,'Интервальное повторение, сначала трудные','t');
 if(rec!==id)h+=li('topic/'+rec+'/0','→','Следующая тема: '+TOP[rec].short,'Рекомендовано по программе');
 h+=li('prac','✎','Практика','Задачи с подсказками и проверкой ответа')+li('ege','Е','Подготовка к ЕГЭ','Тренировка по номерам и вариант с таймером','w')+`</div></div>`;
 if(ws.length){h+=`<div class="sec"><h2>Слабые места</h2><div class="list">`+ws.map(w=>li(w.a==='sub'?'run/sub/'+w.x:w.a==='cram'?'study/topic/'+w.x:'run/egen/'+w.x,'!',w.t,w.s,'w')).join('')+`</div></div>`}
 h+=`<div class="sec"><h2>Прогресс</h2><div class="card"><div class="row sp small"><span>Карточки: выучено ${cs.ms}, учу ${cs.lr}, новых ${cs.nw}</span><span class="muted">${all}</span></div>
 <div class="pb" style="margin-top:6px"><i class="ok" style="width:${cs.ms/all*100}%"></i><i class="t" style="width:${cs.lr/all*100}%"></i></div>
 <p class="small" style="margin-top:10px">Задачи решено верно: ${solved} из ${TASKS.reduce((a,t)=>a+t.items.length,0)}</p>
 <div style="display:grid;gap:6px;margin-top:8px">${ORDER.map(t=>{const mm=P.mastery(t);return `<div class="row small" style="gap:10px"><span style="flex:0 0 42%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${TOP[t].short}</span><span class="pb" style="flex:1"><i style="width:${mm}%"></i></span><span class="muted" style="width:34px;text-align:right">${mm}%</span></div>`}).join('')}</div>
 <p class="note" style="margin-top:8px">Освоение темы считается по тесту, решённым задачам и карточкам. Одно чтение его не повышает.</p></div></div>`;
 if(isIOS()&&!isStandalone()&&!st.hideInstall)h+=`<div class="sec card flat"><h3>Установить как приложение</h3><p class="note">В Safari нажми «Поделиться» → «На экран Домой». Приложение будет открываться без адресной строки и работать без интернета.</p><button class="lnk" data-a="hideInst">Скрыть</button></div>`;
 page('Физика',h);
};
ACT.pdTog=k=>{const d=P.pd().done;if(d[k])delete d[k];else d[k]=1;save();views.home()};
ACT.hideInst=()=>{st.hideInstall=true;save();views.home()};

/* ---------- первый запуск ---------- */
let onb={s:0};
views.onb=()=>{
 let h='';
 if(onb.s===0){h=`<div class="sec"><h2>Привет. Настроим обучение за минуту</h2><p class="muted">Здесь вся физика 10 класса: теория простым языком, формулы с расшифровкой, карточки с интервальным повторением, задачи с подсказками и тренировка заданий в формате ЕГЭ.</p></div>
 <div class="sec"><h3 style="margin-bottom:8px">Какая цель?</h3><div class="list">${li2('goal','school','Выучить школьную программу','Последовательно по темам 10 класса')}${li2('goal','ege','Готовиться к ЕГЭ','Больше тренировки по номерам')}</div></div>`}
 else if(onb.s===1){h=`<div class="sec"><h3 style="margin-bottom:8px">Сколько времени в день?</h3><div class="list">${[15,30,45,60].map(m=>li2('time',m,m+' минут',{15:'Минимум, чтобы не забывать',30:'Оптимально для старта',45:'Быстрый темп',60:'Интенсив'}[m])).join('')}</div><p class="note">Можно изменить в настройках.</p></div>`}
 else{h=`<div class="sec card"><h2>Короткая диагностика</h2><p>9 вопросов, по одному на каждую тему. Это не оценка: результат нужен, чтобы предложить, с чего начать и что можно пройти быстрее.</p><div class="row" style="margin-top:12px"><button class="btn" data-a="go" data-x="run/diag">Пройти (3 минуты)</button><button class="btn gh" data-a="onbSkip">Пропустить</button></div></div>`}
 page('Начало',h);
};
const li2=(k,v,t,s)=>`<button class="li" data-a="onb" data-x="${k}:${v}"><span class="tx"><b>${t}</b><span>${s}</span></span><span class="ar">›</span></button>`;
ACT.onb=x=>{const [k,v]=x.split(':');if(k==='goal')st.goal=v;else st.split=Object.assign({},P.PRESET[v]);onb.s++;save();views.onb()};
ACT.onbSkip=()=>{st.onb=true;save();go('home')};

/* ---------- обучение: список тем ---------- */
views.learn=()=>{
 let h=`<div class="sec"><input id="fq" class="inp" style="width:100%" type="search" placeholder="Поиск формулы: импульс, КПД, Ом…" aria-label="Поиск по формулам" autocomplete="off"></div><div id="fres"></div><div id="lmain">`;
 SECS.forEach(s=>{h+=`<div class="sec"><h2>${s[1]}</h2><div class="list">`+s[2].map(id=>{const [lb,cl]=P.mlabel(id),m=P.mastery(id);
  return `<button class="li" data-a="go" data-x="topic/${id}/${P.nextStep(id)}"><span class="ico ${cl==='m3'?'ok':''}">${TOP[id].i+1}</span><span class="tx"><b>${TOP[id].short}</b><span><span class="mst ${cl}">${lb}</span> ${m}%</span></span><span class="ar">›</span></button>`}).join('')+'</div></div>'});
 h+=`<div class="sec"><h2>Справочник</h2><div class="list">${li('ref/const','c','Константы и табличные данные','Работает без интернета','t')}${li('ref/plan','10','План на 10 недель','Порядок тем и темп')}${li('ref/video','▶','Видеоуроки и курсы','Нужен интернет','w')}</div></div>`;
 h+=`<p class="note sec">Пока в курсе 9 тем 10 класса (механика, МКТ и термодинамика, электростатика, постоянный ток). Карточки «База 7–9 класса» помогают закрыть пробелы.</p></div>`;
 page('Обучение',h);
 $('#fq').addEventListener('input',e=>search(e.target.value));
};
function search(q){
 q=q.trim().toLowerCase();const box=$('#fres');$('#lmain').hidden=!!q;
 if(!q){box.innerHTML='';return}
 let h='',n=0;
 S.forEach(c=>c.groups.forEach(g=>g.rows.forEach(r=>{if(n<30&&(P.strip(r[0]+' '+r[1]+' '+(r[2]||'')).toLowerCase().includes(q))){n++;h+=`<div class="small muted" style="margin:10px 2px 0"><a href="#topic/${c.id}/1">${TOP[c.id].short}</a> · ${g.t.replace('Дополнительные формулы: ','доп.: ')}</div>`+fxHTML(c.id,r)}})));
 box.innerHTML=n?h:'<div class="empty"><b>Ничего не найдено</b>Попробуй другое слово, например «сила» или «энергия».</div>';
}

/* ---------- тема: 4 уровня ---------- */
views.topic=(id,lv)=>{
 const c=TOP[id];if(!c)return go('learn');
 lv=Math.max(0,Math.min(3,+lv||0));st.cur=id;save();
 const x=L[id]||{},seg=`<div class="seg sec" role="tablist">${LV.map((n,i)=>`<button role="tab" aria-selected="${i===lv}" class="${i===lv?'on':''}" data-a="go" data-x="topic/${id}/${i}">${n}<b>${['объяснение','формулы','задачи','тест'][i]}</b></button>`).join('')}</div>`;
 let h=seg;
 if(lv===0){
  if(x.simple)h+=`<div class="sec"><p class="lead">${x.simple}</p></div>`;
  if(x.life&&x.life.length)h+=`<div class="sec"><h2>Из жизни</h2>${x.life.map(e=>`<div class="ex">${e}</div>`).join('')}</div>`;
  h+=`<div class="sec"><h2>Теория</h2><div class="card prose"><ul>${c.theory.map(t=>`<li>${t}</li>`).join('')}</ul></div>`;
  if(T2[id])h+=`<details class="cl"><summary>Разбор законов подробно</summary><div class="prose"><ul>${T2[id].map(t=>`<li>${t}</li>`).join('')}</ul></div></details>`;
  h+='</div>';
  if(DG[id])h+=`<div class="sec"><h2>Схемы и графики</h2>${DG[id].map(k=>`<figure class="dg">${FIG[k][0]}<figcaption>${FIG[k][1]}</figcaption></figure>`).join('')}</div>`;
  if(x.mis&&x.mis.length)h+=`<div class="sec"><h2>Типичные ошибки</h2>${x.mis.map(m=>`<div class="mis" style="margin-bottom:10px"><div class="w"><b>Заблуждение</b>${m[0]}</div><div class="r"><b>Как правильно</b>${m[1]}</div></div>`).join('')}</div>`;
  if(c.tips)h+=`<div class="sec card flat"><h3>${c.tips[0]}</h3><ul class="prose" style="padding-left:20px;margin:6px 0 0">${c.tips[1].map(t=>`<li>${t}</li>`).join('')}</ul></div>`;
  h+=`<div class="sec"><button class="btn wide" data-a="readDone" data-x="${id}">Понятно, дальше: формулы</button></div>`;
 }else if(lv===1){
  const tc=CARDS.filter(k=>k.top===id),cs=P.cardStats(tc);
  h+=`<div class="sec card flat"><div class="row sp"><div><b>Карточки темы: ${tc.length}</b><p class="note" style="margin:2px 0 0">Выучено ${cs.ms} · учу ${cs.lr} · новых ${cs.nw}</p></div><button class="btn sm" data-a="go" data-x="study/topic/${id}">Учить</button></div></div>`;
  if(Q[id])h+=`<details class="cl sec" open><summary>Обозначения и единицы (${Q[id].length})</summary><div>${Q[id].map(r=>`<div class="qt"><div class="qs">${r[0]}</div><div><b>${r[1]}</b>${r[2]?` <span class="qu">${r[2]}</span>`:''}${r[3]?`<div class="note">${r[3]}</div>`:''}</div></div>`).join('')}</div></details>`;
  const basic=c.groups.filter(g=>!g.adv),adv=c.groups.filter(g=>g.adv);
  basic.forEach(g=>{h+=`<div class="sec"><h2>${g.t}</h2>${g.rows.map(r=>fxHTML(id,r)).join('')}</div>`});
  if(adv.length)h+=`<details class="cl sec"><summary>Дополнительно: для сложных задач (${adv.reduce((a,g)=>a+g.rows.length,0)})</summary><div><p class="note">Не обязательно для базового курса, но встречается во второй части ЕГЭ.</p>${adv.map(g=>`<h3 style="margin:14px 0 4px">${g.t.replace('Дополнительные формулы: ','')}</h3>${g.rows.map(r=>fxHTML(id,r)).join('')}`).join('')}</div></details>`;
  h+=`<div class="sec"><button class="btn wide" data-a="go" data-x="topic/${id}/2">Дальше: применить</button></div>`;
 }else if(lv===2){
  if(x.ex)h+=`<div class="sec"><h2>Разбор задачи</h2><div class="card"><p class="task">${x.ex.q}</p><ol class="steps" id="exs"></ol><div class="row" style="margin-top:10px"><button class="btn sm" id="exb" data-a="exStep" data-x="${id}">Показать первый шаг</button><button class="btn sm gh" data-a="exAll" data-x="${id}">Всё решение</button></div><p class="note" style="margin-top:8px">Сначала попробуй решить сам, потом открывай по одному шагу.</p></div></div>`;
  if(x.which&&x.which.length)h+=`<div class="sec"><div class="list">${li('run/which/'+id,'?','Какую формулу применить?','Быстрая тренировка выбора закона','t')}</div></div>`;
  const subs=TASKS.map((t,ti)=>[t,ti]).filter(a=>a[0].ch===id);
  h+=`<div class="sec"><h2>Задачи по подтемам</h2><div class="list">${subs.map(([t,ti])=>{const ok=t.items.filter((_,i)=>(st.tasks[ti+'.'+i]||{}).ok).length;return li('run/sub/'+ti,ok+'/'+t.items.length,t.sub,'От простых к сложным',ok===t.items.length?'ok':'')}).join('')}</div></div>`;
  h+=`<div class="sec"><button class="btn wide" data-a="go" data-x="topic/${id}/3">Дальше: проверить себя</button></div>`;
 }else{
  const t=st.topics[id]||{},n=(x.quiz||[]).length;
  h+=`<div class="sec card"><h2>Тест по теме</h2><p>${plural(n,'вопрос','вопроса','вопросов')} без подсказок. Ответ и объяснение — после выбора. Тест влияет на освоение темы.</p>${t.qb!=null?`<p class="note">Лучший результат: ${pct(t.qb)}</p>`:''}<button class="btn" data-a="go" data-x="run/quiz/${id}">Начать тест</button></div>
  <div class="sec card flat"><h3>Тема освоена, когда</h3><p class="note">Тест решён на 80% и выше, решено 6+ задач без подсказки решения, карточки темы повторены хотя бы несколько раз. Сейчас: ${P.mastery(id)}%.</p></div>`;
  const nx=ORDER[ORDER.indexOf(id)+1];
  if(nx)h+=`<div class="sec"><div class="list">${li('topic/'+nx+'/0','→','Следующая тема: '+TOP[nx].short,'')}</div></div>`;
 }
 if(c.vid&&c.vid.length&&lv===0)h+=`<div class="sec"><h2>Видео по теме</h2><p class="note">Нужен интернет.</p>${c.vid.filter(v=>v[1]!=='#video').map(v=>`<p><a href="${v[1]}" target="_blank" rel="noopener">${v[0]}</a></p>`).join('')}</div>`;
 page(c.short,h,'learn');
};
ACT.readDone=id=>{const t=st.topics[id]||(st.topics[id]={});if(!t.read){t.read=P.now();P.act('read')}P.planDone('new');save();go('topic/'+id+'/1')};
ACT.exStep=id=>{const s=L[id].ex.steps,ol=$('#exs'),n=ol.children.length;if(n<s.length){ol.insertAdjacentHTML('beforeend',`<li>${s[n]}</li>`)}
 const b=$('#exb');if(n+1>=s.length){b.textContent='Ответ: '+L[id].ex.a;b.disabled=true}else b.textContent='Следующий шаг ('+(n+2)+' из '+s.length+')'};
ACT.exAll=id=>{const s=L[id].ex.steps;$('#exs').innerHTML=s.map(x=>`<li>${x}</li>`).join('');const b=$('#exb');b.textContent='Ответ: '+L[id].ex.a;b.disabled=true};

/* ---------- справочник ---------- */
views.ref=k=>{
 let h='',t='Справочник';
 if(k==='const'){t='Константы';h=`<div class="sec card"><table><thead><tr><th>Величина</th><th>Значение</th></tr></thead><tbody>${CONSTS.map(c=>`<tr><td>${c[0]} <span class="qu">${c[1]}</span></td><td class="v2">${c[2]}</td></tr>`).join('')}</tbody></table></div>`}
 else if(k==='plan'){t='План на 10 недель';h=`<p class="note sec">Ориентир: 6 занятий в неделю. Если неделя не получилась, сдвигай план, но не пропускай задачи. Ежедневный план на главной подстраивается под твой темп сам.</p><div class="list">${PLAN.map((w,i)=>`<div class="li" style="cursor:default"><span class="ico">${i+1}</span><span class="tx"><b>${w[0]}</b><span>${w[1]}</span></span></div>`).join('')}</div>`}
 else{t='Видео';h=`<p class="note sec">Для видео нужен интернет. Выбери одного основного преподавателя, остальные — для трудных тем.</p>`+VIDS.map(g=>`<div class="sec"><h2>${g.t}</h2><div class="list">${g.items.map(v=>`<a class="li" href="${v[1]}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><span class="tx"><b>${v[0]}</b><span>${v[2]}</span></span><span class="ar">↗</span></a>`).join('')}</div></div>`).join('')}
 page(t,h,'learn');
};

/* ---------- настройки ---------- */
views.settings=()=>{
 const sp=st.split,tot=sp.rev+sp.new+sp.prac+sp.test;
 const num=(k,l)=>`<div class="field"><label for="sp_${k}">${l}</label><select id="sp_${k}" data-sp="${k}">${[0,5,10,15,20,30].map(v=>`<option ${v===sp[k]?'selected':''} value="${v}">${v} мин</option>`).join('')}</select></div>`;
 const h=`<div class="sec"><h2>Цель и время</h2><div class="card">
 <div class="field"><label for="s_goal">Цель</label><select id="s_goal"><option value="school" ${st.goal==='school'?'selected':''}>Школьная программа</option><option value="ege" ${st.goal==='ege'?'selected':''}>Подготовка к ЕГЭ</option></select></div>
 ${num('rev','Повторение карточек')}${num('new','Новый материал')}${num('prac','Задачи')}${num('test','Мини-тест / ЕГЭ')}
 <div class="field"><label for="s_new">Новых карточек в день</label><select id="s_new">${[5,10,15,20,30].map(v=>`<option ${v===st.newLimit?'selected':''}>${v}</option>`).join('')}</select></div>
 <p class="note" style="margin:6px 0 0">Всего ${tot} минут в день.</p></div></div>
 <div class="sec"><h2>Оформление</h2><div class="card"><div class="field"><label for="s_th">Тема</label><select id="s_th"><option value="auto" ${st.theme==='auto'?'selected':''}>Как в системе</option><option value="light" ${st.theme==='light'?'selected':''}>Светлая</option><option value="dark" ${st.theme==='dark'?'selected':''}>Тёмная</option></select></div></div></div>
 <div class="sec"><h2>Данные</h2><div class="card"><p class="note" style="margin-top:0">Прогресс хранится только на этом устройстве, в браузере. Сохрани копию, если переходишь на другой телефон или чистишь данные Safari.</p>
 <div class="row"><button class="btn sm gh" data-a="exp">Сохранить копию</button><label class="btn sm gh" style="cursor:pointer">Загрузить копию<input id="imp" type="file" accept="application/json,.json" hidden></label><button class="btn sm gh" data-a="rediag">Пройти диагностику</button><button class="btn sm gh" style="color:var(--bad)" data-a="reset">Сбросить всё</button></div></div></div>
 <div class="sec card flat"><h3>Работа без интернета</h3><p class="note">После первого открытия приложение сохраняется на устройстве: теория, формулы, карточки, задачи и ЕГЭ работают офлайн. Нужен интернет только для видео и внешних ссылок. Напоминаний и синхронизации между устройствами нет.</p></div>`;
 page('Настройки',h,'home');
 document.querySelectorAll('[data-sp]').forEach(s=>s.addEventListener('change',()=>{st.split[s.dataset.sp]=+s.value;save();views.settings()}));
 $('#s_goal').addEventListener('change',e=>{st.goal=e.target.value;save()});
 $('#s_new').addEventListener('change',e=>{st.newLimit=+e.target.value;save()});
 $('#s_th').addEventListener('change',e=>{st.theme=e.target.value;save();P.applyTheme()});
 $('#imp').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d||d.v!==2||!d.cards)throw 0;localStorage.setItem(P.KEY,JSON.stringify(d));location.reload()}catch(x){toast('Файл не подходит')}};r.readAsText(f)});
};
ACT.exp=()=>{P.saveNow();const b=new Blob([JSON.stringify(st)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='fizika-progress-'+P.today()+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)};
ACT.reset=()=>{if(!confirm('Удалить весь прогресс: карточки, задачи, ЕГЭ, план? Отменить нельзя.'))return;localStorage.removeItem(P.KEY);['fiz10_fc','fiz10_tasks','fiz10_ege','fiz10_done','fiz10_plan','fiz10_theme'].forEach(k=>localStorage.removeItem(k));location.hash='';location.reload()};
ACT.rediag=()=>go('run/diag');
})();
