/* Service Worker: всё приложение кешируется при установке и открывается без сети.
   Стратегия: файлы приложения — из кеша, в фоне обновляются из сети (stale-while-revalidate).
   Чужие домены (видео, ФИПИ) не кешируются. Прогресс хранится в localStorage, не здесь.
   При изменении файлов увеличь версию V. */
const V='fiz10-v6';
const F=['./','index.html','app.css','learn.js','learn2.js','app.js','check.js','views1.js','views2.js','views3.js','manifest.webmanifest','icon.svg'];
const OPT=['icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F).then(()=>Promise.all(OPT.map(u=>c.add(u).catch(()=>{}))))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 const key=r.mode==='navigate'?'index.html':r;
 const p=caches.open(V).then(c=>c.match(key,{ignoreSearch:true}).then(hit=>{
  const net=fetch(r).then(res=>{if(res&&res.ok&&res.type==='basic')return c.put(key,res.clone()).then(()=>res);return res}).catch(()=>null);
  return {c,hit,net};
 }));
 e.respondWith(p.then(({c,hit,net})=>hit||net.then(res=>res||c.match('index.html').then(m=>m||new Response('Нет сети',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})))));
 e.waitUntil(p.then(x=>x.net));
});
