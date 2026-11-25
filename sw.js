/* 原前舊老 service worker: offline cache + daily reminder */
const VERSION='yq-v1';
const CORE=['./','index.html','annotate.html','duel.html','story.html','app.html','site.css','site.js','i18n.js','app.js','learn_store.js','learn_data.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/icon-180.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION&&k!=='yq-state').map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; const url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin) return;            // CDN / model downloads go straight to the network
  if(req.mode==='navigate'){                                               // pages: network first, offline fallback
    e.respondWith(fetch(req).then(r=>{ const cp=r.clone(); caches.open(VERSION).then(c=>c.put(req,cp)); return r; })
      .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('app.html'))));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>{        // assets: cache first, refresh in background
    const net=fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(VERSION).then(c=>c.put(req,cp)); } return r; }).catch(()=>hit);
    return hit||net;
  }));
});
const today=()=>{const d=new Date(),z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());};
async function maybeRemind(){
  try{ const c=await caches.open('yq-state'); const r=await c.match('/__yq_state'); if(!r) return; const s=await r.json();
    if(!s.remind||!s.remind.on||s.last===today()) return;
    const [h,m]=(s.remind.time||'20:00').split(':').map(Number); const now=new Date(); if(now.getHours()<h||(now.getHours()===h&&now.getMinutes()<m)) return;
    await self.registration.showNotification('今天練習了嗎？',{body:'花兩分鐘做一題「每日一題」，保持連續紀錄。',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'yq-daily',data:{url:'app.html#home'}});
  }catch(e){}
}
self.addEventListener('periodicsync',e=>{ if(e.tag==='yq-daily') e.waitUntil(maybeRemind()); });
self.addEventListener('push',e=>{ e.waitUntil(self.registration.showNotification('原前舊老',{body:(e.data&&e.data.text())||'今天練習了嗎？',icon:'icons/icon-192.png'})); });
self.addEventListener('notificationclick',e=>{ e.notification.close(); const url=(e.notification.data&&e.notification.data.url)||'app.html';
  e.waitUntil(self.clients.matchAll({type:'window'}).then(cs=>{ for(const c of cs){ if(c.url.includes('app.html')&&'focus' in c){ c.navigate(url); return c.focus(); } } return self.clients.openWindow(url); })); });
