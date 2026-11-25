/* 原前舊老 service worker: offline cache + daily reminder */
const VERSION='yqweb-v2';
const CORE=['./','index.html','annotate.html','duel.html','story.html','site.css','site.js','i18n.js','learn_store.js','icons/icon-192.png','icons/icon-180.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('yqweb-')&&k!==VERSION)||k==='yq-v1').map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; const url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin) return;            // CDN / model downloads go straight to the network
  if(req.mode==='navigate'){                                               // pages: network first, offline fallback
    e.respondWith(fetch(req).then(r=>{ const cp=r.clone(); caches.open(VERSION).then(c=>c.put(req,cp)); return r; })
      .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>{        // assets: cache first, refresh in background
    const net=fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(VERSION).then(c=>c.put(req,cp)); } return r; }).catch(()=>hit);
    return hit||net;
  }));
});
