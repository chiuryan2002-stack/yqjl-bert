/* 原前舊老 · 學而時習 — learner app (PWA). Requires learn_store.js + learn_data.js */
(function(){
'use strict';
const D=window.YQ_LEARN, Y=window.YQL, M=Y.M;
const EN=document.documentElement.dataset.lang==='en';
const T=(zh,en)=>EN?en:zh;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SFX=()=>window.SFX||{};
const COLOR={原:'var(--yuan)',前:'var(--qian)',舊:'var(--jiu)',老:'var(--lao)'};
const LV={L1:T('初級','Beginner'),L2:T('中級','Intermediate'),L3:T('高級','Advanced')};
const LVD={L1:T('自編短句，線索清楚，適合 A2–B1','Short made-up sentences with clear cues (A2–B1)'),
           L2:T('真實語料，用法典型，適合 B1–B2','Real corpus sentences, typical uses (B1–B2)'),
           L3:T('真實語料，含非典型用法與 BERT 也選錯的題，適合 C1','Real corpus, atypical uses and items BERT gets wrong (C1)')};
const BANK={}; ['L1','L2','L3'].forEach(l=>D[l].forEach(q=>{q.lv=l;BANK[q.id]=q;}));
const CONCEPT={}; M.forEach(m=>CONCEPT['n'+m]={kind:'note',m}); D.pairs.forEach((p,i)=>CONCEPT['p'+i]={kind:'pair',p});

/* ---------- helpers ---------- */
function sentenceHTML(q,fill,cls){
  const blank=`<span class="blank ${cls||''}">${fill?`<b style="color:${COLOR[fill]}">${fill}</b>`:'＿'}</span>`;
  if(q.s){ return esc(q.s).replace('＿',blank); }
  return esc(q.L)+blank+esc(q.n)+esc(q.R);
}
function bertPick(q){ if(!q.p) return null; let k=0; q.p.forEach((v,i)=>{ if(v>q.p[k]) k=i; }); return M[k]; }
function explain(q){
  if(q.lv==='L1') return `<p>${esc(EN?q.ce:q.cz)}</p>`+(EN&&q.g?`<p class="gloss">“${esc(q.g)}”</p>`:'');
  const bits=[];
  bits.push(q.t==='past'?T('時間參照指向<b>過去</b>：說話時已經不是這個身分','Time reference is <b>past</b>: no longer in that role'):T('時間參照是<b>延續</b>：身分延續到現在','Time reference is <b>continuing</b>: the identity lasts until now'));
  bits.push(q.l==='end'?T('身分鏈結<b>已中止</b>：這段工作關係結束了','The identity link has <b>ended</b>'):T('身分鏈結<b>仍持續</b>：關係還在','The identity link is <b>ongoing</b>'));
  bits.push({pos:T('後面接<b>職務角色</b>名詞（如校長、董事長）','Followed by a <b>position</b> noun (principal, chairman…)'),rel:T('後面接<b>關係角色</b>名詞（如同事、部屬）','Followed by a <b>relational</b> noun (colleague, subordinate…)'),org:T('後面接<b>組織成員</b>名詞（如員工、成員）','Followed by an <b>organisational</b> noun (employee, member…)')}[q.r]);
  if(q.e===1) bits.push(T('語氣帶有親切或敬重','The tone is warm or respectful'));
  if(q.e===-1) bits.push(T('語氣帶有貶意或疏離','The tone is negative or distant'));
  return `<ul class="why">${bits.map(b=>`<li>${b}</li>`).join('')}</ul>`;
}
function noteHTML(m){ const n=D.notes[m]; return `<div class="note"><div class="nh"><span class="big" style="color:${COLOR[m]}">${m}</span><b>${esc(EN?n.core_en:n.core)}</b></div><p>${esc(EN?n.en:n.zh)}</p><div class="exs">${n.ex.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>`; }
function pairTip(a,b){ const p=D.pairs.find(p=>(p.a===a&&p.b===b)||(p.a===b&&p.b===a)); return p?`<div class="pair"><b><span style="color:${COLOR[p.a]}">${p.a}</span> vs. <span style="color:${COLOR[p.b]}">${p.b}</span></b><p>${esc(EN?p.en:p.zh)}</p></div>`:''; }
function bertBars(q,pick){ if(!q.p) return ''; const tot=q.p.reduce((a,b)=>a+b,0)||1; const bp=bertPick(q);
  return `<div class="bert"><div class="bh">${T('BERT 的選擇（完整語境，四字機率）','BERT’s choice (full context, four-way probability)')}</div>${M.map((m,i)=>`<div class="br"><span style="color:${COLOR[m]}">${m}</span><i><em style="width:${(q.p[i]/tot*100).toFixed(1)}%;background:${COLOR[m]}"></em></i><small>${(q.p[i]/tot*100).toFixed(1)}%</small></div>`).join('')}
  <div class="bv">${bp===q.m?T('BERT 選對了。','BERT got it right.'):T(`BERT 選了「${bp}」，選錯了。`,`BERT picked “${bp}” — wrong.`)}${pick===q.m&&bp!==q.m?T(' 這題你贏過 BERT！',' You beat BERT on this one!'):''}</div></div>`; }
const fmtPct=x=>isFinite(x)?Math.round(x*100)+'%':'—';
function stats(s){ const by={}; M.forEach(m=>by[m]={n:0,ok:0}); const conf=M.map(()=>M.map(()=>0)); let n=0,ok=0;
  for(const a of s.att){ const g=M[a[1]],p=M[a[2]]; if(!g) continue; n++; ok+=a[3]; by[g].n++; by[g].ok+=a[3]; if(a[2]>=0) conf[a[1]][a[2]]++; }
  return {n,ok,acc:n?ok/n:NaN,by,conf}; }
const lvl=xp=>Math.floor(Math.sqrt(xp/40))+1, lvlXp=l=>40*(l-1)*(l-1);
function dueCards(s){ const t=Y.today(); return Object.entries(s.cards).filter(([id,c])=>c.due<=t&&(BANK[id]||CONCEPT[id])).map(([id])=>id); }

/* ---------- badges ---------- */
const BADGES=[
 ['始',T('起步','First step'),T('答對第一題','Answer your first question correctly'),(s,st)=>st.ok>=1],
 ['三',T('三日不輟','Three days'),T('連續 3 天練習','Practise 3 days in a row'),s=>s.streak.best>=3],
 ['七',T('七日之功','A full week'),T('連續 7 天練習','Practise 7 days in a row'),s=>s.streak.best>=7],
 ['百',T('百題斬','A hundred'),T('累計作答 100 題','Answer 100 questions'),(s,st)=>st.n>=100],
 ['日',T('日日新','Daily habit'),T('完成 10 次每日一題','Finish 10 daily questions'),s=>s.dailyDone>=10],
 ['勝',T('勝過機器','Beat the machine'),T('答對 5 題 BERT 選錯的題','Get 5 right that BERT got wrong'),s=>s.beatBert>=5],
 ['深',T('登堂入室','Advanced'),T('高級題答對 20 題','20 correct advanced answers'),s=>s.adv>=20],
 ['覆',T('溫故知新','Review'),T('完成 30 張複習卡','Review 30 cards'),s=>s.reviews>=30],
 ['原',T('識原','Master 原'),T('「原」正確率 80%（至少 10 題）','80% on 原 (10+ answers)'),(s,st)=>st.by['原'].n>=10&&st.by['原'].ok/st.by['原'].n>=.8],
 ['前',T('識前','Master 前'),T('「前」正確率 80%（至少 10 題）','80% on 前 (10+ answers)'),(s,st)=>st.by['前'].n>=10&&st.by['前'].ok/st.by['前'].n>=.8],
 ['舊',T('識舊','Master 舊'),T('「舊」正確率 80%（至少 10 題）','80% on 舊 (10+ answers)'),(s,st)=>st.by['舊'].n>=10&&st.by['舊'].ok/st.by['舊'].n>=.8],
 ['老',T('識老','Master 老'),T('「老」正確率 80%（至少 10 題）','80% on 老 (10+ answers)'),(s,st)=>st.by['老'].n>=10&&st.by['老'].ok/st.by['老'].n>=.8],
];
function checkBadges(s){ const st=stats(s), got=[]; BADGES.forEach(([k,,,f])=>{ if(!s.badges[k]&&f(s,st)){ s.badges[k]=Date.now(); got.push(k); } }); return got; }
function toast(html){ const t=document.createElement('div'); t.className='toast'; t.innerHTML=html; document.body.appendChild(t); requestAnimationFrame(()=>t.classList.add('on')); setTimeout(()=>{t.classList.remove('on');setTimeout(()=>t.remove(),400)},3200); }
function afterRecord(){ const s=Y.load(); const got=checkBadges(s); if(got.length){ Y.save(s); got.forEach(k=>{ const b=BADGES.find(x=>x[0]===k); toast(`<span class="bdg">${k}</span><div><b>${T('獲得徽章','Badge earned')}</b><br>${b[1]}</div>`); (SFX().bell||(()=>{}))(1047); }); } }

/* ---------- daily question ---------- */
function dailyQ(){ const t=Y.today(); let h=0; for(const c of t) h=(h*31+c.charCodeAt(0))>>>0; const pool=D.L2; return pool[h%pool.length]; }

/* ---------- routing ---------- */
const TABS=[['home',T('今日','Today')],['practice',T('練習','Practise')],['review',T('複習','Review')],['mistakes',T('錯題本','Mistakes')],['me',T('我的','Me')],['teacher',T('教師','Teacher')],['lab',T('實驗室','Lab')]];
let tab=(location.hash||'#home').slice(1); if(!TABS.some(t=>t[0]===tab)) tab='home';
function nav(){ $('#tabs').innerHTML=TABS.map(([k,l])=>`<a href="#${k}" class="${k===tab?'on':''}" data-k="${k}">${l}${k==='review'?`<i class="dot" id="dueDot"></i>`:''}</a>`).join(''); const n=dueCards(Y.load()).length; const d=$('#dueDot'); if(d){ d.textContent=n||''; d.style.display=n?'':'none'; } }
addEventListener('hashchange',()=>{ const k=location.hash.slice(1); if(TABS.some(t=>t[0]===k)){ tab=k; render(); scrollTo({top:0}); } });
addEventListener('yq-learn-change',()=>nav());
function render(){ nav(); ({home,practice,review,mistakes,me,teacher,lab})[tab](); (SFX().click||(()=>{}))(); }

/* ================= HOME ================= */
function home(){
  const s=Y.load(), st=stats(s), L=lvl(s.xp), dq=dailyQ(), done=s.daily[Y.today()], due=dueCards(s).length;
  const prog=(s.xp-lvlXp(L))/(lvlXp(L+1)-lvlXp(L));
  const name=(Y.profiles().find(p=>p.id===Y.curId())||{}).name;
  $('#view').innerHTML=`
  <div class="hello"><div><div class="eyebrow">${T('學而時習','Learn and practise')}</div><h1>${name?T(`${esc(name)}，歡迎回來`,`Welcome back, ${esc(name)}`):T('今天也來辨一辨原、前、舊、老','Tell 原, 前, 舊, 老 apart today')}</h1></div>
   <div class="ring" style="--p:${Math.max(.02,prog)}"><b>Lv ${L}</b><small>${s.xp} XP</small></div></div>
  <div class="grid3">
   <div class="stat"><div class="sv">${s.streak.last===Y.today()||Y.dayDiff(s.streak.last||'2000-01-01',Y.today())===1?s.streak.n:0}<small>${T(' 天',' d')}</small></div><div class="sl">${T('連續練習','Streak')}</div></div>
   <div class="stat"><div class="sv">${fmtPct(st.acc)}</div><div class="sl">${T('整體正確率','Accuracy')} · ${st.n} ${T('題','answers')}</div></div>
   <div class="stat"><div class="sv">${due}<small>${T(' 張',' cards')}</small></div><div class="sl">${T('今天待複習','Due for review')}</div></div>
  </div>
  <div class="card daily"><div class="ch"><span class="pill">${T('每日一題','Daily question')} · ${Y.today()}</span>${done?`<span class="pill ok">${T('已完成','Done')}</span>`:'<span class="pill">+20 XP</span>'}</div>
   <div class="sent" id="dSent">${sentenceHTML(dq,done?done.pick:null,done?(done.ok?'right':'wrong'):'')}</div>
   ${done?`<div class="fb ${done.ok?'right':'wrong'}"><b>${done.ok?T('答對了！','Correct!'):T(`答案是「${dq.m}」`,`The answer is “${dq.m}”`)}</b>${explain(dq)}</div>`:`<div class="opts" id="dOpts">${M.map(m=>`<button class="opt" data-m="${m}" style="--c:${COLOR[m]}">${m}</button>`).join('')}</div>`}
  </div>
  <div class="card"><div class="ch"><b>${T('四個字的掌握度','How well you know each word')}</b><a href="#mistakes" class="lnk">${T('看錯題本 →','Mistakes →')}</a></div>
   ${M.map(m=>{const b=st.by[m];const a=b.n?b.ok/b.n:0;return `<div class="mrow"><span class="big" style="color:${COLOR[m]}">${m}</span><i><em style="width:${a*100}%;background:${COLOR[m]}"></em></i><small>${b.n?fmtPct(a):'—'} <span class="mut">(${b.n})</span></small></div>`}).join('')}
  </div>
  <div class="row2">
   <a class="cta" href="#practice"><b>${T('開始練習','Start practising')}</b><span>${LV[s.level||'L1']} · 10 ${T('題','questions')}</span></a>
   <a class="cta alt" href="#review"><b>${T('複習卡片','Review cards')}</b><span>${due?T(`${due} 張到期`,`${due} due`):T('今天沒有到期的卡','Nothing due today')}</span></a>
  </div>
  <div class="card install" id="installCard" hidden><div><b>${T('把「學而時習」安裝到手機','Install the app on your phone')}</b><p class="mut" id="installHint"></p></div><button class="btn" id="installBtn">${T('安裝 App','Install app')}</button></div>`;
  if(!done) document.querySelectorAll('#dOpts .opt').forEach(b=>b.onclick=()=>{ const pick=b.dataset.m, ok=pick===dq.m; const r=Y.record({id:dq.id,gold:dq.m,pick,lv:'L2',src:'daily',bertPick:bertPick(dq)}); const s2=r.state; s2.daily[Y.today()]={pick,ok}; s2.dailyDone++; s2.xp+=20; Y.save(s2); (ok?(SFX().correct||(()=>{})):(SFX().wrong||(()=>{})))(); afterRecord(); home(); });
  setupInstall();
}

/* ================= PRACTICE ================= */
let sess=null;
function practice(){
  if(sess&&sess.i<sess.qs.length) return askQ();
  if(sess&&sess.i>=sess.qs.length) return summary();
  const s=Y.load(); const wrongIds=Object.keys(s.cards).filter(id=>BANK[id]);
  $('#view').innerHTML=`<h2>${T('選擇程度','Choose a level')}</h2><p class="mut">${T('每回 10 題。答完會看到為什麼，答錯的題會自動進入錯題本和複習卡。','10 questions per round. You see why after each answer; mistakes go to your Mistakes list and review cards.')}</p>
  <div class="levels">${['L1','L2','L3'].map(l=>`<button class="lvl ${s.level===l?'on':''}" data-l="${l}"><b>${LV[l]}</b><span>${LVD[l]}</span><small>${D[l].length} ${T('題','items')}</small></button>`).join('')}</div>
  <h3>${T('專項特訓','Focused drills')}</h3>
  <div class="levels small">${D.pairs.map((p,i)=>`<button class="lvl" data-pair="${i}"><b><span style="color:${COLOR[p.a]}">${p.a}</span> vs. <span style="color:${COLOR[p.b]}">${p.b}</span></b><span>${T('只練這兩個字','Only these two words')}</span></button>`).join('')}
   <button class="lvl" data-wrong="1" ${wrongIds.length?'':'disabled'}><b>${T('重練錯題','Redo mistakes')}</b><span>${wrongIds.length} ${T('題','items')}</span></button></div>
  <h3>${T('教學小卡','Teaching notes')}</h3><div class="notes">${M.map(noteHTML).join('')}</div>`;
  document.querySelectorAll('.lvl[data-l]').forEach(b=>b.onclick=()=>{ const s=Y.load(); s.level=b.dataset.l; Y.save(s); start(pickQs(D[b.dataset.l],10),b.dataset.l,LV[b.dataset.l]); });
  document.querySelectorAll('.lvl[data-pair]').forEach(b=>b.onclick=()=>{ const p=D.pairs[+b.dataset.pair]; const pool=[...D.L1,...D.L2].filter(q=>q.m===p.a||q.m===p.b); start(pickQs(pool,10),'pair',`${p.a} vs. ${p.b}`,[p.a,p.b]); });
  const w=document.querySelector('.lvl[data-wrong]'); if(w) w.onclick=()=>start(pickQs(wrongIds.map(id=>BANK[id]),10),'wrong',T('重練錯題','Redo mistakes'));
}
function pickQs(pool,n){ const s=Y.load(); const seen={}; s.att.forEach(a=>seen[a[0]]=(seen[a[0]]||0)+1); const arr=[...pool].sort(()=>Math.random()-.5).sort((a,b)=>(seen[a.id]||0)-(seen[b.id]||0)); return arr.slice(0,n); }
function start(qs,kind,title,only){ sess={qs,kind,title,only,i:0,res:[]}; askQ(); }
function askQ(){
  const q=sess.qs[sess.i], opts=sess.only||M;
  $('#view').innerHTML=`<div class="qtop"><button class="btn ghost sm" id="quit">← ${T('離開','Quit')}</button><span class="mut">${esc(sess.title)} · ${sess.i+1} / ${sess.qs.length}</span></div>
  <div class="pbar"><i style="width:${sess.i/sess.qs.length*100}%"></i></div>
  <div class="card q"><div class="ch"><span class="pill">${LV[q.lv]}</span><span class="mut">${T('哪一個字最合適？','Which word fits best?')}</span></div>
   <div class="sent big" id="qs">${sentenceHTML(q)}</div>
   <div class="opts" id="qo">${opts.map(m=>`<button class="opt" data-m="${m}" style="--c:${COLOR[m]}">${m}</button>`).join('')}</div>
   <div id="qf"></div></div>`;
  $('#quit').onclick=()=>{ sess=null; practice(); };
  document.querySelectorAll('#qo .opt').forEach(b=>b.onclick=()=>answer(q,b.dataset.m));
}
function answer(q,pick){
  const acc=q.acc||[]; const exact=pick===q.m, alt=!exact&&acc.includes(pick), ok=exact||alt;
  Y.record({id:q.id,gold:q.m,pick,ok,lv:q.lv,src:sess.kind,bertPick:bertPick(q)});
  sess.res.push({q,pick,ok,alt});
  (ok?(SFX().correct||(()=>{})):(SFX().wrong||(()=>{})))(false);
  document.querySelectorAll('#qo .opt').forEach(b=>{ b.disabled=true; if(b.dataset.m===q.m) b.classList.add('right'); else if(b.dataset.m===pick) b.classList.add(alt?'alt':'wrong'); });
  $('#qs').innerHTML=sentenceHTML(q,q.m,'right');
  $('#qf').innerHTML=`<div class="fb ${ok?'right':'wrong'}"><b>${exact?T('答對了！','Correct!'):alt?T(`「${pick}」也可以，但最自然的是「${q.m}」。`,`“${pick}” also works, but “${q.m}” is most natural.`):T(`答案是「${q.m}」，你選了「${pick}」。`,`The answer is “${q.m}”; you chose “${pick}”.`)}</b>
   ${explain(q)}${!exact?pairTip(q.m,pick):''}${q.lv!=='L1'?bertBars(q,pick):''}
   <details class="nt"><summary>${T(`「${q.m}」的用法小卡`,`Note on “${q.m}”`)}</summary>${noteHTML(q.m)}</details></div>
   <button class="btn" id="next">${sess.i+1<sess.qs.length?T('下一題 →','Next →'):T('看結果 →','See results →')}</button>`;
  $('#next').onclick=()=>{ sess.i++; practice(); };
  afterRecord();
}
function summary(){
  const r=sess.res, ok=r.filter(x=>x.ok).length;
  const conf={}; r.filter(x=>!x.ok).forEach(x=>{ const k=x.q.m+'→'+x.pick; conf[k]=(conf[k]||0)+1; });
  const top=Object.entries(conf).sort((a,b)=>b[1]-a[1])[0];
  $('#view').innerHTML=`<div class="card sum"><div class="eyebrow">${esc(sess.title)}</div><h2>${ok} / ${r.length}</h2>
   <p>${ok===r.length?T('全對，太厲害了！','Perfect round!'):ok>=r.length*.7?T('很不錯，再複習一下錯的題。','Nice work. Review the ones you missed.'):T('別灰心，錯的題已經放進複習卡。','Keep going — your mistakes are now review cards.')}</p>
   ${top?`<p class="mut">${T(`這回最常見的混淆：把「${top[0].split('→')[0]}」選成「${top[0].split('→')[1]}」`,`Most common mix-up this round: “${top[0].split('→')[0]}” answered as “${top[0].split('→')[1]}”`)}</p>${pairTip(...top[0].split('→'))}`:''}
   <div class="slist">${r.map(x=>`<div class="si ${x.ok?'right':'wrong'}"><span>${x.ok?'✓':'✗'}</span><div>${sentenceHTML(x.q,x.q.m,'right')}</div></div>`).join('')}</div>
   <div class="row2"><button class="btn" id="again">${T('再來一回','Another round')}</button><a class="btn ghost" href="#review">${T('去複習','Go review')}</a></div></div>`;
  $('#again').onclick=()=>{ const k=sess.kind, t=sess.title, only=sess.only; const pool=k==='L1'||k==='L2'||k==='L3'?D[k]:sess.qs; sess=null; start(pickQs(k==='pair'?[...D.L1,...D.L2].filter(q=>only.includes(q.m)):pool,10),k,t,only); };
  if(ok===r.length) (SFX().bell||(()=>{}))(1047);
  sess.i=sess.qs.length; sess.done=true;
}

/* ================= REVIEW (spaced repetition) ================= */
function review(){
  const s=Y.load();
  if(!Object.keys(CONCEPT).some(k=>s.cards[k])){ Object.keys(CONCEPT).forEach(k=>s.cards[k]={box:1,due:Y.today(),seen:0}); Y.save(s); }
  const due=dueCards(Y.load());
  const box=[0,0,0,0,0,0]; Object.values(Y.load().cards).forEach(c=>box[c.box||1]++);
  if(!due.length){ $('#view').innerHTML=`<h2>${T('複習卡片','Review cards')}</h2><div class="card empty"><p>${T('今天的卡都複習完了。','All caught up for today.')}</p><p class="mut">${T('答錯的題會自動變成卡片，依「萊特納盒」間隔再出現：1 天、3 天、7 天、16 天。','Wrong answers become cards and come back at growing intervals (Leitner boxes): 1, 3, 7, 16 days.')}</p></div>${boxes(box)}`; return; }
  const id=due[0]; let flipped=false;
  const front=()=>{ if(BANK[id]) return `<div class="mut">${T('填入最合適的字','Fill in the best word')}</div><div class="sent big">${sentenceHTML(BANK[id])}</div>`;
    const c=CONCEPT[id]; return c.kind==='note'?`<div class="mut">${T('說說看','Recall')}</div><div class="sent big">${T(`「<b style="color:${COLOR[c.m]}">${c.m}</b>」修飾職場身分名詞時，核心意思是什麼？`,`What is the core meaning of <b style="color:${COLOR[c.m]}">${c.m}</b> before a workplace noun?`)}</div>`
      :`<div class="mut">${T('說說看','Recall')}</div><div class="sent big">${T(`怎麼分辨「<b style="color:${COLOR[c.p.a]}">${c.p.a}</b>」和「<b style="color:${COLOR[c.p.b]}">${c.p.b}</b>」？`,`How do you tell <b style="color:${COLOR[c.p.a]}">${c.p.a}</b> from <b style="color:${COLOR[c.p.b]}">${c.p.b}</b>?`)}</div>`; };
  const back=()=>{ if(BANK[id]){ const q=BANK[id]; return `<div class="sent big">${sentenceHTML(q,q.m,'right')}</div>${explain(q)}`; } const c=CONCEPT[id]; return c.kind==='note'?noteHTML(c.m):pairTip(c.p.a,c.p.b); };
  const draw=()=>{ $('#view').innerHTML=`<div class="qtop"><h2>${T('複習卡片','Review cards')}</h2><span class="mut">${T(`還有 ${due.length} 張`,`${due.length} left`)}</span></div>
   <div class="card flash ${flipped?'flip':''}" id="fc">${flipped?back():front()}${flipped?'':`<p class="mut tap">${T('想好了就點一下翻面','Tap to reveal')}</p>`}</div>
   ${flipped?`<div class="row2"><button class="btn ghost" id="forgot">${T('忘了（明天再來）','Forgot (again soon)')}</button><button class="btn" id="knew">${T('記得 →','Got it →')}</button></div>`:''}${boxes(box)}`;
   $('#fc').onclick=()=>{ if(!flipped){ flipped=true; (SFX().whoosh||(()=>{}))(); draw(); } };
   if(flipped){ const go=ok=>{ const s=Y.load(); Y.schedule(s,id,ok); s.reviews++; Y.touchStreak(s); s.xp+=2; Y.save(s); afterRecord(); review(); }; $('#knew').onclick=()=>go(true); $('#forgot').onclick=()=>go(false); } };
  draw();
}
function boxes(b){ return `<div class="boxes">${[1,2,3,4,5].map(i=>`<div><b>${b[i]}</b><small>${T('盒','Box')} ${i}<br>${[0,T('當天','today'),T('1 天','1 d'),T('3 天','3 d'),T('7 天','7 d'),T('16 天','16 d')][i]}</small></div>`).join('')}</div>`; }

/* ================= MISTAKES ================= */
function mistakes(){
  const s=Y.load(), st=stats(s); const cnt={}; s.att.forEach(a=>{ if(!a[3]) cnt[a[0]]=(cnt[a[0]]||0)+1; });
  const list=Object.entries(cnt).filter(([id])=>BANK[id]).sort((a,b)=>b[1]-a[1]);
  let flt='all';
  const mx=Math.max(1,...st.conf.flatMap((r,i)=>r.filter((_,j)=>j!==i)));
  const draw=()=>{ const L=list.filter(([id])=>flt==='all'||BANK[id].m===flt);
   $('#view').innerHTML=`<h2>${T('錯題本','Mistakes')}</h2>
   <div class="card"><div class="ch"><b>${T('我的混淆矩陣','My confusion matrix')}</b><span class="mut">${T('列＝正確答案，欄＝你選的字','Rows = answer, columns = your pick')}</span></div>
    <table class="cm"><tr><th></th>${M.map(m=>`<th style="color:${COLOR[m]}">${m}</th>`).join('')}</tr>${M.map((g,i)=>`<tr><th style="color:${COLOR[g]}">${g}</th>${M.map((p,j)=>{const v=st.conf[i][j];return `<td class="${i===j?'diag':''}" style="${i!==j&&v?`background:color-mix(in srgb,var(--lao) ${Math.round(v/mx*70)+10}%,transparent)`:''}">${v||''}</td>`}).join('')}</tr>`).join('')}</table>
    ${(()=>{ let best=null; st.conf.forEach((r,i)=>r.forEach((v,j)=>{ if(i!==j&&v&&(!best||v>best[2])) best=[M[i],M[j],v]; })); return best?`<p>${T(`你最常把「${best[0]}」選成「${best[1]}」（${best[2]} 次）。`,`You most often answer “${best[0]}” as “${best[1]}” (${best[2]}×).`)}</p>${pairTip(best[0],best[1])}`:`<p class="mut">${T('還沒有錯題，繼續保持！','No mistakes yet — keep it up!')}</p>`; })()}
   </div>
   <div class="chips">${['all',...M].map(m=>`<button class="chip ${flt===m?'on':''}" data-f="${m}">${m==='all'?T('全部','All'):m}</button>`).join('')}<button class="btn sm" id="redo" ${list.length?'':'disabled'}>${T('重練這些錯題','Redo these')}</button></div>
   <div class="mlist">${L.length?L.map(([id,n])=>{const q=BANK[id];const c=s.cards[id];return `<details class="mi"><summary><span class="cnt">${n}×</span><span class="sent">${sentenceHTML(q,q.m,'right')}</span><small class="mut">${T('盒','Box')} ${c?c.box:'—'}</small></summary>${explain(q)}${q.lv!=='L1'?bertBars(q):''}</details>`}).join(''):`<p class="mut">${T('這裡會收集你答錯的題。','Your wrong answers will collect here.')}</p>`}</div>`;
   document.querySelectorAll('.chip[data-f]').forEach(b=>b.onclick=()=>{ flt=b.dataset.f; draw(); });
   const r=$('#redo'); if(r) r.onclick=()=>{ location.hash='#practice'; setTimeout(()=>start(pickQs(L.map(([id])=>BANK[id]),10),'wrong',T('重練錯題','Redo mistakes')),30); }; };
  draw();
}

/* ================= ME: profile, badges, leaderboard, sync, reminders ================= */
function exportRecord(id){ const s=Y.load(id); const p=Y.profiles().find(x=>x.id===(id||Y.curId()))||{}; return {kind:'yq-learn',v:1,name:p.name||T('未命名','Unnamed'),exported:Date.now(),state:s}; }
const toB64=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const fromB64=t=>JSON.parse(decodeURIComponent(escape(atob(t.trim().replace(/^YQ1:/,'')))));
function download(name,text,type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:type||'application/json'})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500); }
function me(){
  const s=Y.load(), st=stats(s), ps=Y.profiles(), cur=Y.curId();
  const board=ps.map(p=>{ const x=Y.load(p.id); const y=stats(x); return {p,xp:x.xp,acc:y.acc,n:y.n,best:x.streak.best}; }).sort((a,b)=>b.xp-a.xp);
  $('#view').innerHTML=`<h2>${T('我的','Me')}</h2>
  <div class="card"><div class="ch"><b>${T('學習者','Learner')}</b><span class="mut">${T('資料只存在這台裝置，不會上傳','Data stays on this device; nothing is uploaded')}</span></div>
   <div class="form"><input id="nm" maxlength="20" placeholder="${T('你的名字或暱稱','Your name or nickname')}" value="${esc((ps.find(p=>p.id===cur)||{}).name||'')}"><button class="btn sm" id="saveNm">${T('儲存','Save')}</button></div>
   <div class="profs">${ps.map(p=>`<button class="chip ${p.id===cur?'on':''}" data-p="${p.id}">${esc(p.name||T('未命名','Unnamed'))}</button>`).join('')}<button class="chip" id="addP">＋ ${T('新增學習者','Add learner')}</button></div>
   <p class="mut small">${T('同一台平板可以給好幾位學生輪流用，各自的進度分開記錄。','Several students can share one tablet; each keeps separate progress.')}</p></div>
  <div class="card"><div class="ch"><b>${T('成就徽章','Badges')}</b><span class="mut">${Object.keys(s.badges).length} / ${BADGES.length}</span></div>
   <div class="badges">${BADGES.map(([k,n,d])=>`<div class="badge ${s.badges[k]?'got':''}" title="${esc(d)}"><span class="bdg">${k}</span><b>${n}</b><small>${d}</small></div>`).join('')}</div></div>
  <div class="card"><div class="ch"><b>${T('本機排行榜','Leaderboard on this device')}</b><span class="mut">${T('全班排行請看「教師」頁','Class ranking: see Teacher tab')}</span></div>
   <ol class="board">${board.map((b,i)=>`<li class="${b.p.id===cur?'me':''}"><span class="rk">${i+1}</span><b>${esc(b.p.name||T('未命名','Unnamed'))}</b><span>${b.xp} XP</span><span class="mut">${fmtPct(b.acc)} · ${b.n} ${T('題','ans.')} · ${T('最長','best')} ${b.best}${T(' 天','d')}</span></li>`).join('')}</ol></div>
  <div class="card"><div class="ch"><b>${T('跨裝置同步・交給老師','Sync devices · hand in to teacher')}</b></div>
   <p class="mut">${T('把「學習代碼」貼到另一台裝置就能接續進度；也可以把檔案交給老師，老師在「教師」頁匯入全班。','Paste your learning code on another device to continue; or hand the file to your teacher, who imports the class on the Teacher tab.')}</p>
   <div class="row2"><button class="btn" id="exF">${T('下載學習紀錄檔','Download record file')}</button><button class="btn ghost" id="exC">${T('複製學習代碼','Copy learning code')}</button></div>
   <details class="imp"><summary>${T('在這台裝置匯入／接續進度','Import / continue on this device')}</summary>
    <textarea id="imT" rows="3" placeholder="YQ1:…"></textarea><div class="row2"><label class="btn ghost sm file">${T('選擇檔案','Choose file')}<input type="file" id="imF" accept=".json,application/json" hidden></label><button class="btn sm" id="imB">${T('匯入並取代目前進度','Import and replace progress')}</button></div><p id="imMsg" class="mut"></p></details></div>
  <div class="card"><div class="ch"><b>${T('每日提醒','Daily reminder')}</b></div>
   <div class="form"><label class="sw"><input type="checkbox" id="rmOn" ${s.remind.on?'checked':''}><span></span>${T('開啟通知提醒','Notifications')}</label><input type="time" id="rmT" value="${s.remind.time}"><button class="btn ghost sm" id="ics">${T('加入行事曆（.ics）','Add to calendar (.ics)')}</button></div>
   <p class="mut small" id="rmMsg">${T('通知需要允許權限；手機上建議先安裝 App。iPhone 需 iOS 16.4 以上且已加入主畫面。加入行事曆則所有手機都能用。','Notifications need permission; install the app first on phones (iPhone: iOS 16.4+ and added to Home Screen). The calendar option works on every phone.')}</p></div>
  <div class="card"><div class="ch"><b>${T('重設','Reset')}</b></div><button class="btn ghost sm danger" id="reset">${T('清除這位學習者的所有進度','Erase this learner’s progress')}</button></div>`;
  $('#saveNm').onclick=()=>{ const ps=Y.profiles(); ps.find(p=>p.id===Y.curId()).name=$('#nm').value.trim(); Y.LS.set('yq-profiles',JSON.stringify(ps)); toast(T('已儲存','Saved')); me(); };
  document.querySelectorAll('.chip[data-p]').forEach(b=>b.onclick=()=>{ Y.LS.set('yq-profile',b.dataset.p); me(); });
  $('#addP').onclick=()=>{ const n=prompt(T('新學習者的名字','Name of the new learner')); if(n==null) return; const ps=Y.profiles(); const id='p'+Date.now().toString(36); ps.push({id,name:n.trim()}); Y.LS.set('yq-profiles',JSON.stringify(ps)); Y.LS.set('yq-profile',id); me(); };
  $('#exF').onclick=()=>{ const r=exportRecord(); download(`學習紀錄_${r.name}_${Y.today()}.json`,JSON.stringify(r)); };
  $('#exC').onclick=async()=>{ const code='YQ1:'+toB64(exportRecord()); try{ await navigator.clipboard.writeText(code); toast(T('學習代碼已複製','Learning code copied')); }catch(e){ $('#imT').value=code; document.querySelector('.imp').open=true; toast(T('請手動複製下方代碼','Copy the code below manually')); } };
  const doImport=obj=>{ if(!obj||obj.kind!=='yq-learn'||!obj.state) throw 0; if(!confirm(T('這會取代目前這位學習者的進度，確定嗎？','This replaces the current learner’s progress. Continue?'))) return; Y.save(Object.assign(Y.blank(),obj.state)); const ps=Y.profiles(); const p=ps.find(p=>p.id===Y.curId()); if(!p.name) p.name=obj.name; Y.LS.set('yq-profiles',JSON.stringify(ps)); toast(T('匯入完成','Imported')); me(); };
  $('#imB').onclick=()=>{ try{ doImport(fromB64($('#imT').value)); }catch(e){ $('#imMsg').textContent=T('代碼格式不正確','That code is not valid'); } };
  $('#imF').onchange=e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ try{ doImport(JSON.parse(t)); }catch(err){ $('#imMsg').textContent=T('檔案格式不正確','That file is not valid'); } }); };
  $('#rmOn').onchange=async e=>{ const s=Y.load(); if(e.target.checked){ if(!('Notification' in window)){ $('#rmMsg').textContent=T('這個瀏覽器不支援通知，請改用「加入行事曆」。','This browser has no notifications; use the calendar option.'); e.target.checked=false; return; } const p=await Notification.requestPermission(); if(p!=='granted'){ e.target.checked=false; $('#rmMsg').textContent=T('沒有取得通知權限。','Permission was not granted.'); return; } s.remind.on=true; Y.save(s); registerPeriodic(); notify(T('提醒已開啟','Reminder on'),T(`每天 ${s.remind.time} 提醒你練習原、前、舊、老。`,`We’ll remind you at ${s.remind.time} each day.`)); } else { s.remind.on=false; Y.save(s); } };
  $('#rmT').onchange=e=>{ const s=Y.load(); s.remind.time=e.target.value||'20:00'; Y.save(s); };
  $('#ics').onclick=()=>{ const t=($('#rmT').value||'20:00').replace(':',''); const d=Y.today().replace(/-/g,''); const url=location.href.split('#')[0];
    download('原前舊老_每日提醒.ics',['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//yqjl//learn//ZH','BEGIN:VEVENT','UID:yqjl-daily-'+d+'@yqjl','DTSTAMP:'+d+'T000000Z','DTSTART:'+d+'T'+t+'00','DURATION:PT10M','RRULE:FREQ=DAILY',`SUMMARY:${T('練習原、前、舊、老（學而時習）','Practise 原前舊老 (daily)')}`,'DESCRIPTION:'+url+'#home','URL:'+url+'#home','BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:'+T('今天練習了嗎？','Practised today?'),'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n'),'text/calendar'); };
  $('#reset').onclick=()=>{ if(confirm(T('確定清除這位學習者的所有進度？無法復原。','Erase all progress for this learner? This cannot be undone.'))){ Y.LS.del('yq-learn-'+Y.curId()); me(); } };
}
async function notify(title,body){ try{ const r=await navigator.serviceWorker?.getRegistration(); if(r) r.showNotification(title,{body,icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'yq-daily',data:{url:'app.html#home'}}); else new Notification(title,{body}); }catch(e){} }
async function registerPeriodic(){ try{ const r=await navigator.serviceWorker.ready; if('periodicSync' in r) await r.periodicSync.register('yq-daily',{minInterval:12*3600e3}); }catch(e){} }
function reminderCheck(){ const s=Y.load(); if(!s.remind.on||!('Notification' in window)||Notification.permission!=='granted') return; const now=new Date(); const [h,m]=s.remind.time.split(':').map(Number); if(s.streak.last!==Y.today()&&(now.getHours()>h||(now.getHours()===h&&now.getMinutes()>=m))&&Y.LS.get('yq-notified')!==Y.today()){ Y.LS.set('yq-notified',Y.today()); notify(T('今天練習了嗎？','Practised today?'),T('花兩分鐘做一題每日一題，保持連續紀錄。','Two minutes for the daily question keeps your streak alive.')); } }

/* ================= TEACHER DASHBOARD ================= */
let cls=[]; try{ cls=JSON.parse(Y.LS.get('yq-class')||'[]'); }catch(e){}
function saveCls(){ Y.LS.set('yq-class',JSON.stringify(cls)); }
function demoClass(){ const names=['小林','Mika','阿哲','Nguyen','佳穎','Tom','Yuki','美惠']; const all=[...D.L1,...D.L2,...D.L3]; return names.map((nm,k)=>{ const s=Y.blank(); const skill=.45+k*.06; const n=25+k*9; for(let i=0;i<n;i++){ const q=all[(i*37+k*11)%all.length]; const bias={原:.05,前:0,舊:-.12,老:-.06}[q.m]; const ok=Math.random()<skill+bias+({L1:.15,L2:0,L3:-.12}[q.lv]); let pick=q.m; if(!ok){ const conf={原:'前',前:'原',舊:Math.random()<.6?'老':'前',老:'舊'}[q.m]; pick=conf; } s.att.push([q.id,M.indexOf(q.m),M.indexOf(pick),ok?1:0,Math.round(Date.now()/1e3)-i*3600,q.lv,'app']); s.xp+=ok?10:1; } s.streak={last:Y.today(),n:1+k%5,best:2+k}; return {kind:'yq-learn',v:1,name:nm,exported:Date.now(),state:s}; }); }
function teacher(){
  const rows=cls.map(r=>{ const st=stats(r.state); return {r,st}; });
  const tot=M.map(()=>M.map(()=>0)); const itemW={}, itemN={};
  rows.forEach(({r,st})=>{ st.conf.forEach((row,i)=>row.forEach((v,j)=>tot[i][j]+=v)); r.state.att.forEach(a=>{ itemN[a[0]]=(itemN[a[0]]||0)+1; if(!a[3]) itemW[a[0]]=(itemW[a[0]]||0)+1; }); });
  const hard=Object.keys(itemW).filter(id=>BANK[id]&&itemN[id]>=2).map(id=>[id,itemW[id]/itemN[id],itemN[id]]).sort((a,b)=>b[1]-a[1]||b[2]-a[2]).slice(0,8);
  const mx=Math.max(1,...tot.flatMap((r,i)=>r.filter((_,j)=>j!==i)));
  const pairs=[]; tot.forEach((r,i)=>r.forEach((v,j)=>{ if(i!==j&&v) pairs.push([M[i],M[j],v]); })); pairs.sort((a,b)=>b[2]-a[2]);
  $('#view').innerHTML=`<h2>${T('教師後台','Teacher dashboard')}</h2>
  <p class="mut">${T('請學生在「我的」頁下載學習紀錄檔或複製學習代碼交給你，在這裡一次匯入，就能看到全班的答題情況。資料只存在你的瀏覽器。','Students download their record file (or copy their code) on the Me tab; import them here to see the whole class. Data stays in your browser.')}</p>
  <div class="card"><div class="row2"><label class="btn file">${T('匯入學生檔案（可多選）','Import student files (multiple)')}<input type="file" id="tF" accept=".json,application/json" multiple hidden></label><button class="btn ghost" id="tDemo">${T('載入示範班級','Load demo class')}</button></div>
   <details class="imp"><summary>${T('貼上學習代碼（一行一位）','Paste learning codes (one per line)')}</summary><textarea id="tC" rows="4" placeholder="YQ1:…"></textarea><button class="btn sm" id="tCB">${T('匯入代碼','Import codes')}</button></details>
   <p class="mut small" id="tMsg">${cls.length?T(`目前 ${cls.length} 位學生`,`${cls.length} students loaded`):''}</p></div>
  ${cls.length?`
  <div class="grid3"><div class="stat"><div class="sv">${cls.length}</div><div class="sl">${T('學生','Students')}</div></div>
   <div class="stat"><div class="sv">${rows.reduce((a,b)=>a+b.st.n,0)}</div><div class="sl">${T('總作答數','Answers')}</div></div>
   <div class="stat"><div class="sv">${fmtPct(rows.reduce((a,b)=>a+b.st.ok,0)/Math.max(1,rows.reduce((a,b)=>a+b.st.n,0)))}</div><div class="sl">${T('全班正確率','Class accuracy')}</div></div></div>
  <div class="card"><div class="ch"><b>${T('全班排行與各字正確率','Class ranking and per-word accuracy')}</b><button class="btn ghost sm" id="csv">CSV</button></div>
   <div class="tw"><table class="tt"><tr><th>#</th><th>${T('學生','Student')}</th><th>XP</th><th>${T('作答','Answers')}</th><th>${T('正確率','Acc.')}</th>${M.map(m=>`<th style="color:${COLOR[m]}">${m}</th>`).join('')}<th>${T('最長連續','Best streak')}</th><th></th></tr>
   ${rows.sort((a,b)=>b.r.state.xp-a.r.state.xp).map(({r,st},i)=>`<tr><td>${i+1}</td><td><b>${esc(r.name)}</b></td><td>${r.state.xp}</td><td>${st.n}</td><td>${fmtPct(st.acc)}</td>${M.map(m=>{const b=st.by[m];const a=b.n?b.ok/b.n:NaN;return `<td class="${a<.6?'low':''}">${fmtPct(a)}</td>`}).join('')}<td>${r.state.streak.best||0}</td><td><button class="x" data-del="${esc(r.name)}" title="${T('移除','Remove')}">×</button></td></tr>`).join('')}</table></div></div>
  <div class="card"><div class="ch"><b>${T('全班混淆矩陣','Class confusion matrix')}</b><span class="mut">${T('列＝正確答案，欄＝學生選的字','Rows = answer, columns = picked')}</span></div>
   <table class="cm"><tr><th></th>${M.map(m=>`<th style="color:${COLOR[m]}">${m}</th>`).join('')}</tr>${M.map((g,i)=>`<tr><th style="color:${COLOR[g]}">${g}</th>${M.map((p,j)=>{const v=tot[i][j];return `<td class="${i===j?'diag':''}" style="${i!==j&&v?`background:color-mix(in srgb,var(--lao) ${Math.round(v/mx*70)+10}%,transparent)`:''}">${v||''}</td>`}).join('')}</tr>`).join('')}</table>
   ${pairs[0]?`<p>${T(`全班最常見的混淆：「${pairs[0][0]}」誤用成「${pairs[0][1]}」（${pairs[0][2]} 次）${pairs[1]?`，其次是「${pairs[1][0]}」→「${pairs[1][1]}」（${pairs[1][2]} 次）`:''}。`,`Most common class mix-up: “${pairs[0][0]}” → “${pairs[0][1]}” (${pairs[0][2]}×)${pairs[1]?`, then “${pairs[1][0]}” → “${pairs[1][1]}” (${pairs[1][2]}×)`:''}.`)}</p>${pairTip(pairs[0][0],pairs[0][1])}<p class="mut small">${T('教學建議：下一堂課可以用「練習 → 專項特訓」做這組對比。','Teaching tip: use Practise → Focused drills on this pair next lesson.')}</p>`:''}</div>
  <div class="card"><div class="ch"><b>${T('全班最常錯的題','Hardest items for the class')}</b></div>
   ${hard.length?hard.map(([id,r,n])=>`<div class="hi"><span class="cnt">${Math.round(r*100)}%</span><span class="sent">${sentenceHTML(BANK[id],BANK[id].m,'right')}</span><small class="mut">${T(`${n} 人次`,`${n} tries`)}</small></div>`).join(''):`<p class="mut">${T('資料還不夠。','Not enough data yet.')}</p>`}</div>
  <button class="btn ghost sm danger" id="tClr">${T('清除全班資料','Clear class data')}</button>`:''}`;
  const add=objs=>{ let k=0; objs.forEach(o=>{ if(o&&o.kind==='yq-learn'&&o.state){ cls=cls.filter(c=>c.name!==o.name); cls.push({name:o.name,state:Object.assign(Y.blank(),o.state)}); k++; } }); saveCls(); teacher(); $('#tMsg').textContent=T(`匯入 ${k} 位，目前共 ${cls.length} 位學生`,`Imported ${k}; ${cls.length} students in total`); };
  $('#tF').onchange=e=>Promise.all([...e.target.files].map(f=>f.text().then(t=>{try{return JSON.parse(t)}catch(_){return null}}))).then(add);
  $('#tCB').onclick=()=>add($('#tC').value.split(/\s+/).filter(Boolean).map(l=>{try{return fromB64(l)}catch(e){return null}}));
  $('#tDemo').onclick=()=>add(demoClass());
  const clr=$('#tClr'); if(clr) clr.onclick=()=>{ if(confirm(T('清除全班資料？','Clear all class data?'))){ cls=[]; saveCls(); teacher(); } };
  document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ cls=cls.filter(c=>c.name!==b.dataset.del); saveCls(); teacher(); });
  const csv=$('#csv'); if(csv) csv.onclick=()=>{ const lines=[['name','xp','answers','accuracy',...M.map(m=>'acc_'+m),'best_streak'].join(',')]; rows.forEach(({r,st})=>lines.push([`"${r.name.replace(/"/g,'""')}"`,r.state.xp,st.n,(st.acc||0).toFixed(3),...M.map(m=>st.by[m].n?(st.by[m].ok/st.by[m].n).toFixed(3):''),r.state.streak.best||0].join(','))); download(`全班學習紀錄_${Y.today()}.csv`,'﻿'+lines.join('\n'),'text/csv'); };
}

/* ================= LAB: BERT in the browser ================= */
const LAB={state:'idle',tok:null,model:null,ids:null};
const MODEL_ID='Xenova/bert-base-chinese';
const NOUNS=['同事','員工','部屬','上司','主管','董事長','校長','老闆','夥伴','客戶','搭檔','長官'];
function lab(){
  $('#view').innerHTML=`<h2>${T('造句實驗室','Sentence lab')}</h2>
  <p class="mut">${T('自己寫一句話，把要填的位置寫成「＿」，看看 BERT 會選原、前、舊、老哪一個。模型直接在你的瀏覽器裡跑，不會上傳句子。','Write your own sentence with “＿” where the word goes and see which of 原, 前, 舊, 老 BERT picks. The model runs in your browser; nothing is uploaded.')}</p>
  <div class="card"><textarea id="lS" rows="2">${T('我們在同一個部門二十年了，他是我的＿同事。','我們在同一個部門二十年了，他是我的＿同事。')}</textarea>
   <div class="chips">${NOUNS.map(n=>`<button class="chip" data-n="${n}">＿${n}</button>`).join('')}</div>
   <div class="row2"><button class="btn" id="lRun">${LAB.state==='ready'?T('讓 BERT 填空','Ask BERT'):T('下載模型並填空（約 100 MB）','Download model and ask (≈100 MB)')}</button><button class="btn ghost" id="lYou">${T('先自己猜','Guess first')}</button></div>
   <div id="lGuess"></div><div id="lOut"></div><p class="mut small" id="lMsg">${LAB.state==='ready'?T('模型已載入。','Model loaded.'):T('第一次需要下載 Chinese BERT-base 量化模型，之後會快取在瀏覽器裡。建議使用 Wi-Fi。','The first run downloads a quantised Chinese BERT-base; it is cached afterwards. Wi-Fi recommended.')}</p></div>
  <div class="card"><div class="ch"><b>${T('試試這些對比句','Try these contrasts')}</b></div><div class="ex">${['他三年前就離職了，是我們公司的＿員工。','換了工作以後，週末還是常跟＿同事吃飯。','新部長上任後，＿部長回到大學教書。','我們合作十幾年了，他是我的＿夥伴。','已經離職的＿同事寄了喜帖給我。','至今仍一起工作的＿同事幫我代班。'].map(x=>`<button class="exb">${x}</button>`).join('')}</div></div>`;
  let guess=null;
  document.querySelectorAll('.chip[data-n]').forEach(b=>b.onclick=()=>{ const t=$('#lS'); t.value=t.value.replace(/＿[一-鿿]{0,3}/,'＿'+b.dataset.n); });
  document.querySelectorAll('.exb').forEach(b=>b.onclick=()=>{ $('#lS').value=b.textContent; $('#lOut').innerHTML=''; guess=null; $('#lGuess').innerHTML=''; });
  $('#lYou').onclick=()=>{ $('#lGuess').innerHTML=`<div class="opts">${M.map(m=>`<button class="opt" data-m="${m}" style="--c:${COLOR[m]}">${m}</button>`).join('')}</div>`; document.querySelectorAll('#lGuess .opt').forEach(b=>b.onclick=()=>{ guess=b.dataset.m; document.querySelectorAll('#lGuess .opt').forEach(x=>x.classList.toggle('sel',x===b)); }); };
  $('#lRun').onclick=async()=>{ const txt=$('#lS').value.trim(); if((txt.match(/＿|_/g)||[]).length!==1){ $('#lMsg').textContent=T('句子裡要有一個「＿」。','The sentence needs exactly one “＿”.'); return; }
    try{ await loadBert(m=>$('#lMsg').textContent=m); const p=await fill(txt.replace(/_/,'＿')); showLab(p,guess); }
    catch(e){ console.error(e); LAB.state='error'; $('#lMsg').innerHTML=T('模型載入失敗（可能是離線、網路受限或瀏覽器記憶體不足）。可以先用「練習」裡的高級題，每題都附有 BERT 的預先計算結果。','Could not load the model (offline, blocked network or low memory). The advanced practice items include BERT’s precomputed answers.')+`<br><small>${esc(String(e&&e.message||e))}</small>`; } };
}
async function loadBert(msg){
  if(LAB.state==='ready') return;
  msg(T('正在載入 transformers.js…','Loading transformers.js…'));
  const mod=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2');
  mod.env.allowLocalModels=false;
  const prog=p=>{ if(p.status==='progress'&&p.total) msg(T(`下載模型中… ${Math.round(p.loaded/p.total*100)}%（${p.file}）`,`Downloading model… ${Math.round(p.loaded/p.total*100)}% (${p.file})`)); };
  LAB.tok=await mod.AutoTokenizer.from_pretrained(MODEL_ID,{progress_callback:prog});
  LAB.model=await mod.AutoModelForMaskedLM.from_pretrained(MODEL_ID,{dtype:'q8',progress_callback:prog});
  const v=LAB.tok.model.tokens_to_ids; LAB.ids=M.map(m=>v.get(m)); LAB.mask=v.get('[MASK]');
  LAB.state='ready'; msg(T('模型已載入。','Model loaded.'));
}
async function fill(txt){
  const enc=await LAB.tok(txt.replace('＿','[MASK]'));
  const out=await LAB.model(enc);
  const ids=Array.from(enc.input_ids.data,Number); const pos=ids.indexOf(LAB.mask);
  const V=out.logits.dims[2], data=out.logits.data, base=pos*V;
  const lg=LAB.ids.map(i=>data[base+i]); const mx=Math.max(...lg); const ex=lg.map(x=>Math.exp(x-mx)); const s=ex.reduce((a,b)=>a+b,0);
  return ex.map(x=>x/s);
}
function showLab(p,guess){
  let k=0; p.forEach((v,i)=>{ if(v>p[k]) k=i; }); const bp=M[k];
  $('#lOut').innerHTML=`<div class="bert"><div class="bh">${T('BERT 的四字機率','BERT’s four-way probability')}</div>${M.map((m,i)=>`<div class="br"><span style="color:${COLOR[m]}">${m}</span><i><em style="width:${(p[i]*100).toFixed(1)}%;background:${COLOR[m]}"></em></i><small>${(p[i]*100).toFixed(1)}%</small></div>`).join('')}
  <div class="bv">${T(`BERT 選「${bp}」。`,`BERT picks “${bp}”.`)}${guess?(guess===bp?T(' 你和 BERT 想的一樣。',' You agree with BERT.'):T(` 你選了「${guess}」，和 BERT 不同——想想看，語境裡哪個線索讓你這樣選？`,` You chose “${guess}”, unlike BERT — which cue in the sentence made you choose it?`)):''}</div></div>${pairTip(bp,guess&&guess!==bp?guess:M[(k+1)%4])}`;
  Y.activity('lab',3); (SFX().compute||(()=>{}))();
}

/* ================= INSTALL (PWA) ================= */
let deferred=null;
addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferred=e; setupInstall(); });
function setupInstall(){
  const card=$('#installCard'); if(!card) return;
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  if(standalone) return;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  card.hidden=false;
  $('#installHint').textContent=deferred?T('安裝後會像一般 App 一樣出現在主畫面，沒有網路也能練習。','It appears on your home screen like any app and works offline.'):ios?T('iPhone／iPad：點 Safari 下方的「分享」，再選「加入主畫面」。','iPhone/iPad: tap Share in Safari, then “Add to Home Screen”.'):T('用 Chrome 或 Edge 開啟，從網址列右側或選單選「安裝應用程式」。','In Chrome or Edge, choose “Install app” from the address bar or menu.');
  $('#installBtn').style.display=deferred?'':'none';
  $('#installBtn').onclick=async()=>{ if(!deferred) return; deferred.prompt(); await deferred.userChoice; deferred=null; card.hidden=true; };
}

/* ================= boot ================= */
function boot(){
  if('serviceWorker' in navigator && location.protocol!=='file:') navigator.serviceWorker.register('sw.js').catch(()=>{});
  render(); reminderCheck(); setInterval(reminderCheck,60e3);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
window.YQ_APP={stats,BANK,D};
})();
