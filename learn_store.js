/* 原前舊老 · 學而時習 — shared learner store (local-first; works offline, no server)
   Every page loads this file so the games can record answers into the same progress / 錯題本. */
(function(){
'use strict';
const M=['原','前','舊','老'];
const LS={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const today=(d=new Date())=>{const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());};
const dayDiff=(a,b)=>Math.round((new Date(b+'T00:00')-new Date(a+'T00:00'))/864e5);
const BOX_DAYS=[0,0,1,3,7,16];

function profiles(){ let p=[]; try{p=JSON.parse(LS.get('yq-profiles')||'[]')}catch(e){} if(!p.length){ p=[{id:'p1',name:''}]; LS.set('yq-profiles',JSON.stringify(p)); LS.set('yq-profile','p1'); } return p; }
function curId(){ const p=profiles(); const c=LS.get('yq-profile'); return p.some(x=>x.id===c)?c:p[0].id; }
function blank(){ return {v:1,created:Date.now(),xp:0,att:[],cards:{},streak:{last:'',n:0,best:0},daily:{},dailyDone:0,reviews:0,beatBert:0,adv:0,badges:{},remind:{on:false,time:'20:00'},level:'L1',src:{}}; }
function load(id){ id=id||curId(); let s=null; try{s=JSON.parse(LS.get('yq-learn-'+id)||'null')}catch(e){} return Object.assign(blank(),s||{}); }
function save(s,id){ id=id||curId(); s.att=s.att.slice(-800); LS.set('yq-learn-'+id,JSON.stringify(s)); try{ if('caches' in window) caches.open('yq-state').then(c=>c.put('/__yq_state',new Response(JSON.stringify({last:s.streak.last,remind:s.remind})))); }catch(e){} window.dispatchEvent(new CustomEvent('yq-learn-change')); }

function touchStreak(s){ const t=today(); if(s.streak.last===t) return; const gap=s.streak.last?dayDiff(s.streak.last,t):99; s.streak.n=gap===1?s.streak.n+1:1; s.streak.last=t; s.streak.best=Math.max(s.streak.best,s.streak.n); }
function schedule(s,id,ok){ const c=s.cards[id]||{box:0,due:today(),seen:0}; c.seen++; if(ok){ c.box=Math.min(5,(c.box||1)+1); } else { c.box=1; } const d=new Date(); d.setDate(d.getDate()+BOX_DAYS[c.box]); c.due=today(d); s.cards[id]=c; }
/* record one answer. q={id, gold, pick, lv, src, bertPick} */
function record(q){
  const s=load(); const ok=q.ok!=null?q.ok:q.gold===q.pick;
  s.att.push([q.id,M.indexOf(q.gold),M.indexOf(q.pick),ok?1:0,Math.round(Date.now()/1000),q.lv||'',q.src||'app']);
  s.xp+=ok?({L1:5,L2:10,L3:15}[q.lv]||8):1;
  if(ok&&q.bertPick&&q.bertPick!==q.gold) s.beatBert++;
  if(ok&&q.lv==='L3') s.adv++;
  if(!ok) schedule(s,q.id,false); else if(s.cards[q.id]) schedule(s,q.id,true);
  s.src[q.src||'app']=(s.src[q.src||'app']||0)+1;
  touchStreak(s); save(s); return {ok,state:s};
}
function activity(src,xp){ const s=load(); s.xp+=xp||0; s.src[src]=(s.src[src]||0)+1; touchStreak(s); save(s); }
window.YQL={M,LS,today,dayDiff,BOX_DAYS,profiles,curId,load,save,record,activity,schedule,touchStreak,blank};
})();
