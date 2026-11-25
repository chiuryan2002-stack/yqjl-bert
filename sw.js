/* 原前舊老 service worker: offline cache + daily reminder */
const VERSION='yqweb-v3';
const CORE=['./','index.html','annotate.html','duel.html','story.html','site.css','site.js','i18n.js','learn_store.js','icons/icon-192.png','icons/icon-180.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('yqweb-')&&k!==VERSION)||k==='yq-v1').map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; const url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin) return;            // CDN / model downloads go straight to the network
  // network first for everything: online visitors always get the newest upload; the cache is only an offline fallback
  e.respondWith(fetch(req,{cache:'no-cache'}).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(VERSION).then(c=>c.put(req,cp)); } return r; })
    .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||(req.mode==='navigate'?caches.match('index.html'):Response.error()))));
});
