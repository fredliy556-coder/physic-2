/* Проверка ответов: разбор чисел и единиц, допуск, перевод приставок, диагностика типичных ошибок, ЕГЭ. */
(()=>{
'use strict';
const P=window.PH,strip=P.strip;
const SUP={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+'};
const sup=s=>String(s).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g,c=>SUP[c]);
const NUMRE=/[−-]?\d+(?:[.,]\d+)?(?:\s*·\s*10[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?/g;
function toNum(t){t=sup(t).replace('−','-').replace(',','.');const m=t.match(/^([+-]?\d+(?:\.\d+)?)(?:\s*·\s*10([+-]?\d+))?$/);return m?parseFloat(m[1])*(m[2]?Math.pow(10,+m[2]):1):NaN}

/* Ожидаемый ответ проверяем автоматически, только если в нём одно число и, возможно, подпись «x =» и единица.
   Ответы со словами («увеличится в 2 раза») и с несколькими числами — самопроверка. */
function spec(a){
 a=strip(a).trim();
 const m=[...a.matchAll(NUMRE)];
 if(m.length!==1)return null;
 const x=m[0],pre=a.slice(0,x.index),post=a.slice(x.index+x[0].length).trim();
 if(!/^[\s≈~]*(?:[A-Za-zα-ωΔ_ₓᵧ₀₁₂₃()′]{1,8}\s*[=≈]\s*)?[≈~\s]*$/.test(pre))return null;
 const pu=post.replace(/\s/g,'');
 if(pu.length>14||!/^[A-Za-zА-Яа-яЁёα-ωΩ°%⁻⁰¹²³⁴⁵⁶⁷⁸⁹·\/()]*$/.test(pu))return null;
 const v=toNum(x[0]);if(isNaN(v))return null;
 return {v,u:post};
}
function parseUser(s){
 s=sup(String(s)).trim().replace(/−/g,'-').replace(/(\d)\s+(?=\d{3}(\D|$))/g,'$1').replace(/,/g,'.');
 const m=s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(?:e([+-]?\d+))?(?:\s*[*·×xх]\s*10\s*\^?\s*\(?([+-]?\d+)\)?)?\s*(.*)$/i);
 if(!m)return null;
 return {v:parseFloat(m[1])*Math.pow(10,(+m[2]||0)+(+m[3]||0)),u:m[4].trim()};
}
const LAT={s:'с',a:'а',A:'А',B:'В',K:'К',k:'к',M:'М',m:'м',H:'Н',O:'О',o:'о',P:'Р',p:'р',c:'с',C:'С',x:'х',X:'Х',T:'Т',y:'у',e:'е',E:'Е'};
const nu=u=>sup(u).replace(/\s+/g,'').replace(/[*.]/g,'·').replace(/\^/g,'').replace(/2$/,'²').replace(/3$/,'³').replace(/[saABKkMmHOoPpcCxXTyeE]/g,c=>LAT[c]);
const ueq=(a,b)=>a===b||a.toLowerCase()===b.toLowerCase()&&!/^[мМ]/.test(a)&&!/^[мМ]/.test(b);
const PFX={'':1,'к':1e3,'М':1e6,'Г':1e9,'м':1e-3,'мк':1e-6,'н':1e-9,'п':1e-12,'с':1e-2,'д':1e-1};
const BASES=[['м/с²',1],['м/с',1],['м²',2],['м³',3],['Дж',1],['Вт',1],['Па',1],['Кл',1],['Ом',1],['Гц',1],['Тл',1],['Гн',1],['Н',1],['В',1],['А',1],['Ф',1],['г',1],['м',1],['с',1]];
const SPEC={'км/ч':['м/с',1/3.6],'мин':['с',60],'ч':['с',3600],'т':['кг',1000],'л':['м³',1e-3],'мл':['м³',1e-6]};
function split(u){
 let k=1;if(SPEC[u]){k=SPEC[u][1];u=SPEC[u][0]}
 for(const [b,p] of BASES){if(u.endsWith(b)){const pr=u.slice(0,-b.length);if(pr in PFX)return {b,f:k*Math.pow(PFX[pr],p)}}}
 return null;
}
function factor(uu,eu){if(ueq(uu,eu))return 1;const a=split(uu),b=split(eu);return a&&b&&a.b===b.b?a.f/b.f:null}
const sp10=k=>String(k).replace(/-/g,'⁻').replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
function diagnose(v,ev){
 const near=(x,y)=>Math.abs(x-y)<=Math.abs(y)*0.03;
 if(Math.abs(v-ev)<=Math.abs(ev)*0.06)return 'Очень близко. Похоже на ошибку округления: считай точнее, до 2–3 значащих цифр, и не округляй промежуточные результаты.';
 if(ev!==0&&v!==0){const r=v/ev,a=Math.abs(r);
  if(near(r,-1))return 'Неверный знак. Проверь направление оси и знаки проекций.';
  if(near(a,3.6)||near(a,1/3.6))return 'Ответ отличается в 3,6 раза: похоже, не переведены км/ч в м/с (или наоборот).';
  if([60,1/60,3600,1/3600].some(x=>near(a,x)))return 'Проверь перевод времени: минуты и часы переводим в секунды.';
  const k=Math.round(Math.log10(a));if(k!==0&&Math.abs(a/Math.pow(10,k)-1)<0.03)return `Ответ отличается в 10${sp10(k)} раз. Проверь приставки (к, м, мк, н), перевод в СИ и единицы, в которых нужен ответ.`;
  if(near(a,2)||near(a,.5))return 'Ответ отличается в 2 раза. Частые причины: забытая ½ (at²/2, mv²/2, CU²/2), путь «туда и обратно», половина пути.';
  if(near(a,4)||near(a,.25))return 'Ответ отличается в 4 раза: возможно, величина не возведена в квадрат или возведена лишний раз.';
  if(near(a,Math.SQRT2)||near(a,Math.SQRT1_2))return 'Ответ отличается в √2 раз: проверь, извлечён ли корень.';
  if([Math.PI,1/Math.PI,2*Math.PI,1/(2*Math.PI)].some(x=>near(a,x)))return 'Ответ отличается в π или 2π раз: проверь связи ω = 2π/T и ν = 1/T.';
  if(near(a,10)||near(a,.1))return 'Ответ отличается в 10 раз: проверь приставки и запятую.';
 }
 if(Math.abs(Math.abs(v-ev)-273)<3)return 'Разница около 273: перепутаны градусы Цельсия и кельвины.';
 return 'Ответ не совпадает. Сверь закон и вычисления по шагам: открой подсказки.';
}
/* Итог проверки расчётного ответа: {st:'ok'|'bad'|'parse'|'unit', msg} */
function checkNum(a,s){
 const e=spec(a);if(!e)return null;
 if(!String(s).trim())return {st:'parse',msg:'Введи ответ числом.'};
 const u=parseUser(s);if(!u||isNaN(u.v))return {st:'parse',msg:'Не получилось прочитать число. Пример записи: 2,5 или 2,5·10^-4 или 2.5e-4.'};
 let v=u.v;
 if(u.u&&e.u){const f=factor(nu(u.u),nu(e.u));if(f==null)return {st:'unit',msg:`Единица «${u.u}» не подходит. Ответ нужен в «${e.u}» (или с приставкой к ней).`};v*=f}
 if(Math.abs(v-e.v)<=Math.abs(e.v)*0.02+1e-12)return {st:'ok',msg:e.u&&u.u&&!ueq(nu(u.u),nu(e.u))?`В «${e.u}» это ${strip(a).replace(/^.*?[=≈]\s*/,'')}.`:''};
 return {st:'bad',msg:diagnose(v,e.v)};
}

/* Подсказки к задаче: данные и СИ → закон → единица ответа. */
const CONV=[['мм рт. ст.','×133 → Па',''],['кВт·ч','×3,6·10⁶ → Дж',''],['км/ч','делим на 3,6 → м/с','(?![А-Яа-яЁёA-Za-z])'],['км','×10³ → м','(?![А-Яа-яЁёA-Za-z/²³])'],['см²','×10⁻⁴ → м²',''],['см³','×10⁻⁶ → м³',''],['см','×10⁻² → м','(?![А-Яа-яЁёA-Za-z²³])'],['мм²','×10⁻⁶ → м²',''],['мм','×10⁻³ → м','(?![А-Яа-яЁёA-Za-z²])'],['мин','×60 → с',''],['ч','×3600 → с','(?![А-Яа-яЁёA-Za-z])'],['г','×10⁻³ → кг','(?![А-Яа-яЁёA-Za-z/])'],['мг','×10⁻⁶ → кг','(?![А-Яа-яЁё])'],['т','×10³ → кг','(?![А-Яа-яЁёA-Za-z])'],['л','×10⁻³ → м³','(?![А-Яа-яЁёA-Za-z])'],['°C','T = t + 273, если это газ или КПД Карно',''],['кПа','×10³ → Па',''],['МПа','×10⁶ → Па',''],['кДж','×10³ → Дж',''],['МДж','×10⁶ → Дж',''],['кВт','×10³ → Вт','(?!·)'],['мкКл','×10⁻⁶ → Кл',''],['нКл','×10⁻⁹ → Кл',''],['мкФ','×10⁻⁶ → Ф',''],['пФ','×10⁻¹² → Ф',''],['мА','×10⁻³ → А','']];
const rx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function siHint(q){q=strip(q);const f=[];CONV.forEach(([u,t,la])=>{if(new RegExp('\\d\\s*'+rx(u)+la).test(q)&&!f.some(x=>x[0].includes(u)))f.push([u,t])});return f}
function hints(it){
 const si=siHint(it.q),e=spec(it.a),out=[];
 out.push(['Дано и СИ','Выпиши, что известно и что нужно найти. '+(si.length?'Переведи в СИ: '+si.map(x=>`<b>${x[0]}</b> ${x[1]}`).join('; ')+'.':'Перевод единиц, похоже, не нужен, но проверь ещё раз.')]);
 out.push(['Закон',it.h?it.h:`Определи, какой процесс описан, и найди подходящую формулу в теме «${P.TOP[it.ch].short}». <a href="#topic/${it.ch}/1">Открыть формулы</a>`]);
 out.push(['Выразить и проверить',(e&&e.u?`Ответ должен получиться в <b>${e.u}</b>. `:'')+'Вырази неизвестное буквами, подставь числа в конце и проверь размерность.']);
 return out;
}

/* ЕГЭ: тип задания по номеру и начисление учебных баллов. */
const egeType=n=>n>=21?'self':n===19?'pm':[5,9,14,18,20].includes(n)?'set':[6,10,15,17].includes(n)?'seq':'num';
const digits=s=>String(s).replace(/\D/g,'');
function egeScore(n,exp,user,mx){
 const t=egeType(n);user=String(user||'').trim();if(!user)return 0;
 if(t==='num'){const u=parseUser(user),e=toNum(strip(exp).replace(/\s/g,''));return u&&Math.abs(u.v-e)<=Math.abs(e)*1e-9+1e-12?mx:0}
 if(t==='pm'){const e=[...strip(exp).matchAll(/\d+(?:,\d+)?/g)].map(m=>toNum(m[0])),u=[...user.replace(/−/g,'-').matchAll(/\d+(?:[.,]\d+)?/g)].map(m=>parseFloat(m[0].replace(',','.')));return u.length===2&&Math.abs(u[0]-e[0])<1e-9&&Math.abs(u[1]-e[1])<1e-9?mx:0}
 const E=digits(exp),U=digits(user);
 if(t==='seq'){if(U.length!==E.length)return 0;const w=[...E].filter((c,i)=>U[i]!==c).length;return w===0?mx:w===1&&mx===2?1:0}
 const es=new Set(E),us=new Set(U);if(U.length!==us.size)return 0;
 const miss=[...es].filter(c=>!us.has(c)).length,extra=[...us].filter(c=>!es.has(c)).length;
 if(!miss&&!extra)return mx;
 return mx===2&&miss+extra<=2&&miss<=1&&extra<=1&&us.size<=3?1:0;
}
const egeHint={num:'Ответ — число в единицах, указанных в условии.',set:'Ответ — номера верных утверждений, например 25.',seq:'Ответ — последовательность цифр для А и Б, например 21.',pm:'Ответ — значение и погрешность через пробел, например 3,4 0,2.',self:'Развёрнутый ответ: реши на бумаге, затем открой решение и оцени себя по критериям.'};

Object.assign(P,{spec,parseUser,checkNum,diagnose,hints,egeType,egeScore,egeHint});
})();
