/* =========================================================
   原前舊老 · shared site layer
   theme (dark / light) · language (中文 / English + pinyin)
   sound (Web Audio, synthesised) · opening film · two-minds
   ========================================================= */
(function(){
"use strict";
const doc=document.documentElement;
const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const SS={get:k=>{try{return sessionStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch(e){}}};
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAGE=doc.dataset.page||'index';
const LANG=doc.dataset.lang||'zh';
const EN=LANG==='en';
const CJK=/[㐀-鿿＀-￯　-〿]/;

/* ---------------------------------------------------------
   1. SOUND — everything synthesised with Web Audio
   --------------------------------------------------------- */
const SFX=(()=>{
  let ac=null, master=null, on=LS.get('yq-sound')!=='off';
  function ctx(){
    if(!ac){ const A=window.AudioContext||window.webkitAudioContext; if(!A) return null; ac=new A(); master=ac.createGain(); master.gain.value=.55; master.connect(ac.destination); }
    if(ac.state==='suspended') ac.resume();
    return ac;
  }
  const noiseBuf=()=>{ const c=ctx(); const b=c.createBuffer(1,c.sampleRate*2,c.sampleRate); const d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b; };
  let NB=null; const nb=()=>NB||(NB=noiseBuf());
  function tone({f=440,f2=null,type='sine',t=0,d=.15,v=.2,a=.005,q=null}={}){
    const c=ctx(); if(!c||!on) return; const t0=c.currentTime+t;
    const o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.setValueAtTime(f,t0); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t0+d);
    g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(v,t0+a); g.gain.exponentialRampToValueAtTime(.0001,t0+d);
    let n=o; if(q){ const fl=c.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value=q; o.connect(fl); n=fl; }
    n.connect(g); g.connect(master); o.start(t0); o.stop(t0+d+.05);
  }
  function noise({t=0,d=.05,v=.2,bp=3000,Q=1,type='bandpass',sweep=null}={}){
    const c=ctx(); if(!c||!on) return; const t0=c.currentTime+t;
    const s=c.createBufferSource(); s.buffer=nb(); const fl=c.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(bp,t0); fl.Q.value=Q;
    if(sweep) fl.frequency.exponentialRampToValueAtTime(sweep,t0+d);
    const g=c.createGain(); g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(v,t0+Math.min(.01,d/3)); g.gain.exponentialRampToValueAtTime(.0001,t0+d);
    s.connect(fl); fl.connect(g); g.connect(master); s.start(t0,Math.random()); s.stop(t0+d+.05);
  }
  const api={
    get on(){return on}, set(v){on=v; LS.set('yq-sound',v?'on':'off'); if(v){ctx(); api.click();}},
    unlock(){ctx()},
    // typewriter key: mechanical click + low thock
    type(){ noise({d:.035,v:.35,bp:2600+Math.random()*1400,Q:2.5}); tone({f:140+Math.random()*30,type:'triangle',d:.06,v:.12}); },
    carriage(){ noise({d:.18,v:.12,bp:5000,Q:.7}); tone({f:1760,d:.5,v:.06}); },
    click(){ tone({f:900,f2:600,type:'sine',d:.05,v:.07}); },
    hover(){ tone({f:1400,d:.03,v:.025}); },
    pop(){ tone({f:520,f2:880,type:'sine',d:.12,v:.12}); },
    blip(i=0){ tone({f:[880,1175,1318,1568,1760][i%5],type:'square',d:.07,v:.045,q:3000}); },
    tech(){ [0,1,2,3,4].forEach(i=>tone({f:[523,784,1046,1568,2093][i],type:'square',t:i*.055,d:.09,v:.05,q:3500})); noise({d:.4,v:.05,bp:8000,Q:.5,type:'highpass'}); },
    compute(n=14){ for(let i=0;i<n;i++) tone({f:600+Math.random()*1800,type:'square',t:i*.065,d:.045,v:.035,q:4000}); },
    whoosh(){ noise({d:.7,v:.22,bp:400,Q:.8,sweep:3800}); },
    swell(){ tone({f:110,f2:220,type:'sawtooth',d:1.6,v:.06,a:.6,q:900}); tone({f:165,f2:330,type:'sawtooth',d:1.6,v:.05,a:.6,q:900}); },
    impact(){ tone({f:90,f2:38,type:'sine',d:1.1,v:.5}); noise({d:.5,v:.25,bp:180,Q:.6,type:'lowpass'}); tone({f:1318,d:1.4,v:.05,t:.05}); },
    tick(v=.5){ tone({f:1200+v*1600,type:'triangle',d:.025,v:.05}); },
    lever(){ noise({d:.12,v:.15,bp:1200,Q:3}); tone({f:220,f2:330,type:'triangle',d:.12,v:.08}); },
    // wrong answer: two-step buzzer
    wrong(){ tone({f:196,type:'sawtooth',d:.22,v:.12,q:1200}); tone({f:147,type:'sawtooth',t:.2,d:.38,v:.12,q:1000}); },
    // half-right
    meh(){ tone({f:440,type:'triangle',d:.15,v:.1}); tone({f:392,type:'triangle',t:.13,d:.25,v:.1}); },
    // correct: bright chord + applause + crowd cheer
    correct(big=false){
      [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone({f,type:'triangle',t:i*.06,d:.6,v:.11}));
      const n=big?120:55, D=big?2.4:1.4;
      for(let i=0;i<n;i++){ const t=.12+Math.pow(Math.random(),1.3)*D; noise({t,d:.012+Math.random()*.02,v:.18+Math.random()*.22,bp:900+Math.random()*2600,Q:1.4}); }
      // "yay" — formant-filtered voices
      const c=ctx(); if(!c||!on) return; const voices=big?7:4;
      for(let k=0;k<voices;k++){
        const t0=c.currentTime+.1+Math.random()*.15, d=(big?1.5:.9)+Math.random()*.3;
        const o=c.createOscillator(); o.type='sawtooth'; const f0=230+Math.random()*180; o.frequency.setValueAtTime(f0,t0); o.frequency.linearRampToValueAtTime(f0*1.35,t0+d*.35); o.frequency.linearRampToValueAtTime(f0*1.1,t0+d);
        const vib=c.createOscillator(), vg=c.createGain(); vib.frequency.value=5+Math.random()*2; vg.gain.value=f0*.03; vib.connect(vg); vg.connect(o.frequency);
        const f1=c.createBiquadFilter(); f1.type='bandpass'; f1.frequency.value=800; f1.Q.value=6;
        const f2=c.createBiquadFilter(); f2.type='bandpass'; f2.frequency.value=1300; f2.Q.value=6;
        const g=c.createGain(); g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(.05,t0+.12); g.gain.exponentialRampToValueAtTime(.0001,t0+d);
        o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(master); o.start(t0); vib.start(t0); o.stop(t0+d+.1); vib.stop(t0+d+.1);
      }
    }
  };
  return api;
})();
window.SFX=SFX;

/* generic UI sounds: buttons, sliders, section arrivals */
document.addEventListener('pointerdown',()=>SFX.unlock(),{once:true,capture:true});
document.addEventListener('click',e=>{
  const b=e.target.closest('button,.btn,.cta a,.opt,.lv.open,.lv.done,#fxNav a');
  if(b && !b.closest('.yq-ctrl') && !b.dataset.nosfx) SFX.click();
},true);
let lastTick=0;
document.addEventListener('input',e=>{
  const r=e.target; if(r.type!=='range') return; const now=performance.now(); if(now-lastTick<45) return; lastTick=now;
  const v=(r.value-(r.min||0))/((r.max||100)-(r.min||0)); SFX.tick(v);
},true);
document.addEventListener('change',e=>{ if(e.target.type==='range') SFX.lever(); },true);

/* ---------------------------------------------------------
   2. THEME
   --------------------------------------------------------- */
function setTheme(t){ doc.dataset.theme=t; LS.set('yq-theme',t); window.dispatchEvent(new CustomEvent('yq-theme',{detail:t})); }

/* ---------------------------------------------------------
   3. LANGUAGE — runtime translation + pinyin
   --------------------------------------------------------- */
const PY={原:'yuán',前:'qián',舊:'jiù',老:'lǎo',
 同事:'tóngshì',校長:'xiàozhǎng',員工:'yuángōng',長官:'zhǎngguān',董事長:'dǒngshìzhǎng',主席:'zhǔxí',領導:'lǐngdǎo',部屬:'bùshǔ',上司:'shàngsi',執行長:'zhíxíngzhǎng',夥伴:'huǒbàn',老闆:'lǎobǎn',搭檔:'dādàng',社長:'shèzhǎng',主任:'zhǔrèn',總經理:'zǒngjīnglǐ',成員:'chéngyuán',主管:'zhǔguǎn',秘書:'mìshū',下屬:'xiàshǔ',會長:'huìzhǎng',院長:'yuànzhǎng',伙伴:'huǒbàn',秘書長:'mìshūzhǎng',雇主:'gùzhǔ',職員:'zhíyuán',同僚:'tóngliáo',助理:'zhùlǐ',廠長:'chǎngzhǎng',所長:'suǒzhǎng',委員:'wěiyuán',理事長:'lǐshìzhǎng',領班:'lǐngbān',系主任:'xì zhǔrèn',經理:'jīnglǐ',董事:'dǒngshì',負責人:'fùzérén',同學:'tóngxué',僱主:'gùzhǔ',幕僚:'mùliáo',前輩:'qiánbèi',處長:'chùzhǎng',雇員:'gùyuán',合夥人:'héhuǒrén',顧問:'gùwèn',戰友:'zhànyǒu',郵差:'yóuchāi',組長:'zǔzhǎng',副院長:'fù yuànzhǎng',監事:'jiānshì',同仁:'tóngrén',部下:'bùxià',副署長:'fù shǔzhǎng',副校長:'fù xiàozhǎng',副主任:'fù zhǔrèn',總經濟師:'zǒng jīngjìshī',發言人:'fāyánrén',副主席:'fù zhǔxí',大使:'dàshǐ',總裁:'zǒngcái',行長:'hángzhǎng',副行長:'fù hángzhǎng',班底:'bāndǐ',幹部:'gànbù',老師:'lǎoshī',老朋友:'lǎo péngyou',老兵:'lǎobīng',
 認知:'rènzhī',偏見:'piānjiàn',交情:'jiāoqing',資歷:'zīlì',離職:'lízhí',尊敬:'zūnjìng',懷念:'huáiniàn',經驗:'jīngyàn',退休:'tuìxiū',卸任:'xièrèn',倚老賣老:'yǐ lǎo mài lǎo',念舊:'niànjiù',共事:'gòngshì'};
function pyOf(w){
  if(PY[w]) return PY[w];
  // modifier + noun compounds (舊同事, 原董事長 …)
  if(w.length>1 && PY[w[0]] && '原前舊老'.includes(w[0]) && PY[w.slice(1)]) return PY[w[0]]+' '+PY[w.slice(1)];
  return null;
}
function ruby(w){ const p=pyOf(w); return p?`<ruby class="yq-ruby" data-i18n-done>${w}<rt>${p}</rt></ruby>`:null; }
window.YQ_PY=pyOf;

const DICT=(window.YQ_I18N&&EN)?Object.assign({},window.YQ_I18N.common||{},window.YQ_I18N[PAGE]||{}):null;
const RULES=(window.YQ_I18N&&EN)?[...(window.YQ_I18N.rules_common||[]),...(window.YQ_I18N['rules_'+PAGE]||[])].map(([a,b])=>[new RegExp('^'+a+'$'),b]):[];
const EL=(window.YQ_I18N&&EN)?Object.assign({},window.YQ_I18N['el_'+PAGE]||{}):{};
const norm=s=>s.replace(/\s+/g,' ').trim();
const ELKEYS=new Map(Object.entries(EL).map(([k,v])=>[norm(k),v]));
function trText(t){
  const k=norm(t); if(!k) return null;
  if(DICT[k]!=null) return {html:DICT[k]};
  const r=ruby(k); if(r) return {html:r};
  for(const [re,rep] of RULES){ if(re.test(k)) return {html:k.replace(re,rep)}; }
  return null;
}
const DONE=new WeakSet(), WROTE=new WeakMap();
function translate(root){
  if(!DICT) return;
  root=root||document.body;
  // element level (blocks containing inline markup)
  if(ELKEYS.size && root.querySelectorAll){
    const els=[root,...root.querySelectorAll('p,li,h1,h2,h3,h4,div,span,label,small,td,th,figcaption,button,a,b')];
    for(const e of els){ if(!e.innerHTML||e.closest('[data-i18n-done]')) continue; const k=norm(e.innerHTML); const v=ELKEYS.get(k); if(v!=null){ e.innerHTML=v; e.setAttribute('data-i18n-done',''); } }
  }
  // attributes
  if(root.querySelectorAll) root.querySelectorAll('[aria-label],[title],[placeholder]').forEach(e=>{ for(const a of ['aria-label','title','placeholder']){ const v=e.getAttribute(a); if(v&&CJK.test(v)){ const r=trText(v); if(r) e.setAttribute(a,r.html.replace(/<rt>.*?<\/rt>/g,'').replace(/<[^>]+>/g,'')); } } });
  // text nodes
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
    if(!CJK.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
    const p=n.parentElement; if(!p||p.closest('script,style,textarea,[data-i18n-done],[data-noi18n]')) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT; }});
  const list=[]; while(w.nextNode()) list.push(w.currentNode);
  for(const n of list){
    if(WROTE.get(n)===n.nodeValue) continue;
    let r=trText(n.nodeValue); if(!r||r.html===norm(n.nodeValue)) continue;
    if(n.parentElement.namespaceURI==='http://www.w3.org/2000/svg'){ const plain=r.html.replace(/<rt>.*?<\/rt>/g,'').replace(/<[^>]+>/g,''); if(plain!==n.nodeValue){ n.nodeValue=plain; WROTE.set(n,plain);} continue; }
    const lead=/^\s/.test(n.nodeValue)?' ':'', trail=/\s$/.test(n.nodeValue)?' ':'';
    if(!/[<&]/.test(r.html)){ n.nodeValue=lead+r.html+trail; WROTE.set(n,n.nodeValue); continue; }
    const span=document.createElement('span'); span.setAttribute('data-i18n-done',''); span.innerHTML=lead+r.html+trail;
    n.replaceWith(span);
  }
}
window.YQ_translate=translate;
if(DICT){
  doc.lang='en';
  const go=()=>{ translate(document.body); doc.classList.remove('i18n-pending');
    new MutationObserver(ms=>{ for(const m of ms){ if(m.type==='characterData'){ const n=m.target; if(WROTE.get(n)===n.nodeValue) continue; if(n.parentElement&&n.parentElement.namespaceURI!=='http://www.w3.org/2000/svg'&&!n.parentElement.closest('[data-i18n-done]')&&CJK.test(n.nodeValue)){ const r=trText(n.nodeValue); if(r&&r.html!==norm(n.nodeValue)){ if(!/[<&]/.test(r.html)){ n.nodeValue=r.html; WROTE.set(n,r.html); } else { const s=document.createElement('span'); s.setAttribute('data-i18n-done',''); s.innerHTML=r.html; n.replaceWith(s);} } } }
      else m.addedNodes.forEach(n=>{ if(n.nodeType===1) translate(n); else if(n.nodeType===3&&n.parentElement) translate(n.parentElement); }); } })
      .observe(document.body,{subtree:true,childList:true,characterData:true});
    document.title=(window.YQ_I18N.titles||{})[PAGE]||document.title;
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',go); else go();
} else doc.classList.remove('i18n-pending');

function switchLang(){
  const to=EN?'zh':'en'; LS.set('yq-lang',to);
  SS.set('yq-scroll',JSON.stringify({p:location.pathname,y:scrollY/Math.max(1,document.documentElement.scrollHeight)}));
  location.reload();
}
(function restoreScroll(){ try{ const s=JSON.parse(SS.get('yq-scroll')||'null'); if(s&&s.p===location.pathname){ SS.set('yq-scroll',''); SS.set('yq-intro','seen'); addEventListener('load',()=>setTimeout(()=>scrollTo(0,s.y*document.documentElement.scrollHeight),60)); } }catch(e){} })();

/* ---------------------------------------------------------
   4. CONTROL BAR
   --------------------------------------------------------- */
const ICON={
 sun:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
 moon:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
 snd:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/></svg>',
 mute:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
 play:'<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>'
};
function buildControls(){
  const bar=document.createElement('div'); bar.className='yq-ctrl'; bar.setAttribute('data-i18n-done',''); bar.setAttribute('role','toolbar'); bar.setAttribute('aria-label',EN?'Display settings':'顯示設定');
  const th=doc.dataset.theme;
  bar.innerHTML=`
    <button class="yq-b" id="yqTheme" title="${EN?'Light / dark':'亮版／暗版'}" aria-label="${EN?'Toggle light or dark theme':'切換亮版或暗版'}">${th==='light'?ICON.moon:ICON.sun}<span>${th==='light'?(EN?'Dark':'暗版'):(EN?'Light':'亮版')}</span></button>
    <button class="yq-b yq-lang" id="yqLang" title="${EN?'切換為中文':'Switch to English'}" aria-label="${EN?'Switch to Chinese':'Switch to English'}"><b class="${EN?'':'on'}">中</b><i>/</i><b class="${EN?'on':''}">EN</b></button>
    <button class="yq-b" id="yqSnd" aria-pressed="${SFX.on}" title="${EN?'Sound on / off':'音效開／關'}" aria-label="${EN?'Toggle sound':'切換音效'}">${SFX.on?ICON.snd:ICON.mute}</button>
    ${PAGE==='index'?`<button class="yq-b" id="yqReplay" title="${EN?'Replay opening':'重播開場'}">${ICON.play}<span>${EN?'Opening':'開場'}</span></button>`:''}`;
  document.body.appendChild(bar);
  bar.querySelector('#yqTheme').onclick=()=>{ const t=doc.dataset.theme==='light'?'dark':'light'; setTheme(t); SFX.pop(); const b=bar.querySelector('#yqTheme'); b.innerHTML=(t==='light'?ICON.moon:ICON.sun)+`<span>${t==='light'?(EN?'Dark':'暗版'):(EN?'Light':'亮版')}</span>`; };
  bar.querySelector('#yqLang').onclick=()=>{ SFX.pop(); setTimeout(switchLang,120); };
  bar.querySelector('#yqSnd').onclick=e=>{ SFX.set(!SFX.on); const b=e.currentTarget; b.innerHTML=SFX.on?ICON.snd:ICON.mute; b.setAttribute('aria-pressed',SFX.on); };
  const rp=bar.querySelector('#yqReplay'); if(rp) rp.onclick=()=>playIntro(true);
}

/* ---------------------------------------------------------
   5. TWO MINDS — human brain vs machine (component)
   --------------------------------------------------------- */
const T2=EN?{
  kicker:'Two ways of reading', h:'A human brain and a machine read the same word',
  sub:'Before you play, notice the difference: you will be guessing with one of these, BERT with the other.',
  hT:'Human brain', hS:'reads with experience', hL:['context & situation','relationships over time','feelings and respect','what the speaker means'],
  mT:'Machine (BERT)', mS:'reads with statistics', mL:['co-occurrence counts','13 layers of vectors','probabilities for 原 前 舊 老','what usually comes next'],
  q:'Both read selectively. <b>Is cognition a kind of bias?</b>', word:'舊同事', wordPy:'jiù tóngshì · former colleague'
}:{
  kicker:'兩種讀法', h:'同一個詞，人腦和機器怎麼讀？',
  sub:'開始遊戲前，先看看兩種「認知」的差別：你用左邊那一種在猜，BERT 用右邊那一種。',
  hT:'人腦', hS:'用經驗理解', hL:['語境與情境','關係是否延續','情感與尊敬','說話者的意圖'],
  mT:'機器（BERT）', mS:'用統計預測', mL:['詞語共現次數','13 層向量表徵','原前舊老的機率','最常接在後面的字'],
  q:'兩者都只看見自己習慣看見的。<b>認知，是不是一種偏見？</b>', word:'舊同事', wordPy:''
};
const BRAIN_SVG=`<svg class="tm-brain" viewBox="0 0 220 170" aria-hidden="true">
  <defs><radialGradient id="bg-g" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="var(--qian)" stop-opacity=".35"/><stop offset="1" stop-color="var(--qian)" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="110" cy="82" rx="100" ry="78" fill="url(#bg-g)"/>
  <path class="tm-lobe" d="M108 22c-14-12-40-10-50 4-16-2-30 10-30 26-14 6-20 24-12 38-6 14 2 32 18 36 4 14 20 22 34 18 10 10 28 10 40 2V22z"/>
  <path class="tm-lobe" d="M112 22c14-12 40-10 50 4 16-2 30 10 30 26 14 6 20 24 12 38 6 14-2 32-18 36-4 14-20 22-34 18-10 10-28 10-40 2V22z"/>
  <path class="tm-gyri" d="M58 26c4 12 18 14 22 4M28 52c12 2 18 14 12 24M16 90c14-4 26 4 26 16M34 126c8-8 22-8 28 2M72 144c0-12 10-18 22-16M80 52c10 6 10 20 0 26s-6 22 6 24M96 30c-6 12 2 22 12 24M162 26c-4 12-18 14-22 4M192 52c-12 2-18 14-12 24M204 90c-14-4-26 4-26 16M186 126c-8-8-22-8-28 2M148 144c0-12-10-18-22-16M140 52c-10 6-10 20 0 26s6 22-6 24M124 30c6 12-2 22-12 24"/>
  ${[[60,60],[90,100],[150,64],[132,110],[44,104],[176,100],[110,70]].map(([x,y],i)=>`<circle class="tm-spark" style="animation-delay:${i*.35}s" cx="${x}" cy="${y}" r="3.2"/>`).join('')}
</svg>`;
function twoMinds(el){
  if(el.classList.contains('tm')) return;
  const full=el.dataset.twominds==='full';
  el.classList.add('tm');
  el.innerHTML=`
   <div class="tm-stage">
     <div class="tm-side tm-human">
       <div class="tm-vis">${BRAIN_SVG}<div class="tm-bubbles">${(EN?['交情 · bond','資歷 · seniority','離職 · left the job','尊敬 · respect','懷念 · nostalgia']:['交情','資歷','離職了嗎？','尊敬','懷念']).map((b,i)=>`<span style="--i:${i}">${b}</span>`).join('')}</div></div>
       <h3>${T2.hT}<small>${T2.hS}</small></h3>
       <ul>${T2.hL.map(x=>`<li>${x}</li>`).join('')}</ul>
     </div>
     <div class="tm-mid"><div class="tm-word">${T2.word}${T2.wordPy?`<small>${T2.wordPy}</small>`:''}</div><div class="tm-arrows"><i></i><i></i></div></div>
     <div class="tm-side tm-machine">
       <div class="tm-vis"><canvas class="tm-net" width="300" height="220"></canvas><div class="tm-nums"></div></div>
       <h3>${T2.mT}<small>${T2.mS}</small></h3>
       <ul>${T2.mL.map(x=>`<li>${x}</li>`).join('')}</ul>
     </div>
   </div>
   <p class="tm-q">${T2.q}</p>`;
  el.setAttribute('data-i18n-done','');
  const cv=el.querySelector('.tm-net'); const stop=net3d(cv,{small:!full});
  const nums=el.querySelector('.tm-nums');
  let k=0; const iv=setInterval(()=>{ if(!el.isConnected){clearInterval(iv);stop();return;} if(!nums.offsetParent) return;
    const p=[Math.random()*.08,Math.random()*.2,.15+Math.random()*.2,.5+Math.random()*.3]; const s=p.reduce((a,b)=>a+b);
    nums.innerHTML=['原','前','舊','老'].map((m,i)=>`<span class="m ${m}">${m} ${(p[i]/s).toFixed(2)}</span>`).join(''); k++; },420);
  const io=new IntersectionObserver(es=>{ if(es[0].isIntersecting){ el.classList.add('tm-on'); if(full){ SFX.compute(8); } io.disconnect(); } },{threshold:.35}); io.observe(el);
}

window.YQ_mount=()=>document.querySelectorAll('[data-twominds]').forEach(twoMinds);
/* 3D neural lattice (shared by intro + two-minds) */
function net3d(cv,{small=false,color=null}={}){
  const ctx=cv.getContext('2d'); let W,H,dpr; const L=5,G=small?3:4;
  const nodes=[]; for(let l=0;l<L;l++) for(let i=0;i<G;i++) for(let j=0;j<G;j++) nodes.push({l,x:(i-(G-1)/2)*.55,y:(j-(G-1)/2)*.55,z:(l-(L-1)/2)*.7});
  const edges=[]; nodes.forEach((a,ia)=>nodes.forEach((b,ib)=>{ if(b.l===a.l+1 && Math.random()<(small?.45:.32)) edges.push([ia,ib]); }));
  const pulses=[]; let raf, yaw=.6, alive=true;
  function size(){ dpr=Math.min(2,devicePixelRatio||1); const r=cv.getBoundingClientRect(); W=r.width||cv.width; H=r.height||cv.height; cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
  size(); const ro=new ResizeObserver(size); ro.observe(cv);
  const P=(n)=>{ const c=Math.cos(yaw),s=Math.sin(yaw); let X=n.x*c-n.z*s, Z=n.x*s+n.z*c; const pc=Math.cos(.42),ps=Math.sin(.42); let Y=n.y*pc-Z*ps; Z=n.y*ps+Z*pc; const f=4.2/(4.2+Z), sc=Math.min(W,H)*.34; return [W/2+X*sc*f,H/2+Y*sc*f,f]; };
  function frame(){
    if(!alive) return;
    const light=doc.dataset.theme==='light';
    const base=color||(light?'22,35,58':'170,200,245');
    yaw+=RM?0:.006; ctx.clearRect(0,0,W,H);
    const pr=nodes.map(P);
    ctx.lineWidth=.7;
    for(const [a,b] of edges){ ctx.strokeStyle=`rgba(${base},${.08+.08*pr[a][2]})`; ctx.beginPath(); ctx.moveTo(pr[a][0],pr[a][1]); ctx.lineTo(pr[b][0],pr[b][1]); ctx.stroke(); }
    if(!RM && Math.random()<.35) pulses.push({e:edges[Math.floor(Math.random()*edges.length)],t:0,c:['#6f9be0','#f0a04b','#7fc06a','#e8676b'][Math.floor(Math.random()*4)]});
    for(let i=pulses.length-1;i>=0;i--){ const p=pulses[i]; p.t+=.035; if(p.t>=1){pulses.splice(i,1);continue;} const [a,b]=p.e; const x=pr[a][0]+(pr[b][0]-pr[a][0])*p.t, y=pr[a][1]+(pr[b][1]-pr[a][1])*p.t;
      ctx.fillStyle=p.c; ctx.shadowColor=p.c; ctx.shadowBlur=10; ctx.beginPath(); ctx.arc(x,y,2.4,0,6.283); ctx.fill(); ctx.shadowBlur=0; }
    pr.forEach(([x,y,f],i)=>{ ctx.fillStyle=`rgba(${base},${.35+.4*f})`; ctx.beginPath(); ctx.arc(x,y,(small?2:2.6)*f,0,6.283); ctx.fill(); });
    raf=requestAnimationFrame(frame);
  }
  frame();
  return ()=>{ alive=false; cancelAnimationFrame(raf); ro.disconnect(); };
}

/* ---------------------------------------------------------
   6. OPENING FILM (index only)
   --------------------------------------------------------- */
const NOUNS=[['同事',3],['校長',2.4],['員工',2.4],['長官',1.8],['董事長',1.8],['主席',1.5],['部屬',1.4],['上司',1.3],['老闆',1.3],['主任',1.2],['總經理',1.1],['夥伴',1.1],['秘書',1],['經理',1],['戰友',.9],['顧問',.9],['同學',.9],['幹部',.8],['前輩',.8],['助理',.8],['院長',.9],['社長',.9],['部下',.7],['大使',.7]];
const NOUN_EN={同事:'colleague',校長:'principal',員工:'employee',長官:'superior',董事長:'chairman',主席:'chair',部屬:'subordinate',上司:'boss',老闆:'boss',主任:'director',總經理:'general manager',夥伴:'partner',秘書:'secretary',經理:'manager',戰友:'comrade',顧問:'adviser',同學:'classmate',幹部:'cadre',前輩:'senior',助理:'assistant',院長:'dean',社長:'president',部下:'subordinate',大使:'ambassador'};
let introOn=false;
function playIntro(force){
  if(introOn) return; introOn=true;
  const ov=document.createElement('div'); ov.className='yq-intro'; ov.setAttribute('data-i18n-done',''); ov.setAttribute('role','dialog'); ov.setAttribute('aria-label',EN?'Opening sequence':'開場動畫');
  ov.innerHTML=`
   <canvas class="yi-bg"></canvas>
   <div class="yi-gate">
     <div class="yi-gate-k">${EN?'An interactive study of Chinese near-synonyms':'華語近義詞 × 語言模型 · 互動研究'}</div>
     <button class="yi-start" data-nosfx>${ICON.play}<span>${EN?'Start':'開始'}</span></button>
     <div class="yi-gate-h">${EN?'Press Enter or click · best with sound on':'按 Enter 或點擊開始 · 建議開啟聲音'}</div>
   </div>
   <div class="yi-type"><div class="yi-chars"></div></div>
   <div class="yi-cloud"></div>
   <div class="yi-split">
     <div class="yi-h"><div class="yi-eye"><svg viewBox="0 0 120 70"><path class="yi-lid" d="M6 35C26 8 94 8 114 35C94 62 26 62 6 35Z"/><circle class="yi-iris" cx="60" cy="35" r="17"/><circle cx="60" cy="35" r="7" class="yi-pupil"/><circle cx="66" cy="29" r="3" fill="#fff"/></svg></div>
       <div class="yi-brain">${BRAIN_SVG}<div class="yi-storm"></div></div>
       <div class="yi-lab">${EN?'Human brain · <i>brainstorming</i>':'人腦 · 腦力激盪'}</div></div>
     <div class="yi-m"><canvas class="yi-net"></canvas><div class="yi-code"></div>
       <div class="yi-lab">${EN?'Machine · <i>computing</i>':'機器 · 運算中'}</div></div>
   </div>
   <div class="yi-q"><div class="yi-lens"><i></i><i></i><b>${EN?'bias?':'偏見？'}</b></div>
     <h1 class="yi-qt"></h1><p class="yi-qs"></p></div>
   <button class="yi-skip" data-nosfx>${EN?'Skip intro →':'略過開場 →'}</button>`;
  document.body.appendChild(ov); doc.classList.add('yq-intro-open');
  let dead=false; const timers=[]; const stops=[];
  const wait=ms=>new Promise(r=>{ const id=setTimeout(r,ms); timers.push(id); });
  const $=s=>ov.querySelector(s);
  function end(){ if(dead) return; dead=true; timers.forEach(clearTimeout); stops.forEach(f=>f()); ov.classList.add('yi-out'); SS.set('yq-intro','seen'); window.dispatchEvent(new Event('yq-intro-done')); setTimeout(()=>{ ov.remove(); doc.classList.remove('yq-intro-open'); introOn=false; },900); removeEventListener('keydown',key); }
  function key(e){ if(e.key==='Escape') end(); if(e.key==='Enter'&&!started) start(); }
  addEventListener('keydown',key);
  $('.yi-skip').onclick=end;
  // ambient star field
  stops.push(starfield($('.yi-bg')));
  let started=false;
  $('.yi-start').onclick=start; $('.yi-start').focus();
  async function start(){
    if(started) return; started=true; SFX.unlock(); SFX.whoosh();
    $('.yi-gate').classList.add('gone'); await wait(500);
    /* 1. typewriter */
    const box=$('.yi-chars'); ov.classList.add('s1');
    const chars=['原','前','舊','老'];
    for(let i=0;i<chars.length;i++){ if(dead) return;
      const c=document.createElement('span'); c.className='yi-c m '+chars[i]; c.innerHTML=chars[i]+(EN?`<small>${PY[chars[i]]}</small>`:''); box.appendChild(c);
      SFX.type(); await wait(120); if(i<3){ const sep=document.createElement('span'); sep.className='yi-sep'; sep.textContent='、'; box.appendChild(sep); SFX.type(); }
      await wait(330);
    }
    SFX.carriage(); await wait(350);
    /* 2. word cloud of workplace identities */
    ov.classList.add('s2'); const cloud=$('.yi-cloud'); const W=innerWidth,H=innerHeight;
    const placed=[];
    NOUNS.forEach(([w,s],i)=>{ const el=document.createElement('span'); el.className='yi-w';
      let x,y,tries=0; do{ x=.06+Math.random()*.88; y=.1+Math.random()*.8; tries++; }while(tries<80 && ((Math.abs(x-.5)<.3&&Math.abs(y-.5)<.16) || placed.some(([px,py])=>Math.abs(px-x)<.1&&Math.abs(py-y)<.075)));
      placed.push([x,y]);
      el.style.left=(x*100)+'%'; el.style.top=(y*100)+'%'; el.style.fontSize=(15+s*11)+'px'; el.style.setProperty('--d',(i*55)+'ms');
      el.innerHTML=w+(EN?`<small>${PY[w]||''} · ${NOUN_EN[w]||''}</small>`:''); el.dataset.side=i%2?'m':'h'; cloud.appendChild(el); });
    for(let i=0;i<NOUNS.length;i+=3){ if(dead) return; SFX.blip(i); await wait(70); }
    await wait(1500);
    /* 3. human eye / brain vs machine */
    ov.classList.add('s3'); SFX.whoosh();
    stops.push(net3d($('.yi-net'),{}));
    cloud.querySelectorAll('.yi-w').forEach((el,i)=>{ el.style.setProperty('--d',(i*35)+'ms'); el.classList.add(el.dataset.side==='h'?'to-h':'to-m'); });
    await wait(900); if(dead) return;
    ov.classList.add('s3b'); // eye -> brain
    const storm=$('.yi-storm'); const ideas=EN?['交情 bond','資歷 seniority','離職? left?','尊敬 respect','懷念 nostalgia','倚老賣老 ?','還在嗎? still there?']:['交情','資歷','離職了？','尊敬','懷念','倚老賣老','還在共事嗎？'];
    const code=$('.yi-code');
    for(let i=0;i<ideas.length;i++){ if(dead) return;
      const b=document.createElement('span'); b.textContent=ideas[i]; b.style.setProperty('--a',(i/ideas.length*360)+'deg'); storm.appendChild(b); SFX.pop();
      const p=[Math.random()*.1,Math.random()*.2,Math.random()*.3,.4+Math.random()*.4]; const s=p.reduce((a,c)=>a+c);
      code.innerHTML+=`<div>L${String(i*2).padStart(2,'0')} → P(${['原','前','舊','老'].map((m,k)=>m+'='+(p[k]/s).toFixed(2)).join(' ')})</div>`; code.scrollTop=1e6; SFX.compute(4);
      await wait(380);
    }
    await wait(700);
    /* 4. the question */
    ov.classList.add('s4'); SFX.swell(); await wait(500); if(dead) return;
    const q=EN?'Is cognition a kind of bias?':'認知，是不是一種偏見？';
    const qt=$('.yi-qt');
    for(const ch of q){ if(dead) return; qt.textContent+=ch; if(ch.trim()) SFX.type(); await wait(EN?45:110); }
    SFX.impact(); qt.classList.add('hit');
    $('.yi-qs').innerHTML=EN?'認知是不是一種偏見？ <i>Rènzhī shì bu shì yì zhǒng piānjiàn?</i><br>Humans read words through experience; machines read them through statistics. Each sees what it is used to seeing.':'人用經驗聯想，機器用統計預測；兩者都只看見自己習慣看見的。<br>接下來，看看 BERT 怎麼讀「原、前、舊、老」。';
    await wait(3600); end();
  }
  if(RM && !force){ end(); }
}
function starfield(cv){
  const ctx=cv.getContext('2d'); let W,H,alive=true; const st=[];
  function size(){ const d=Math.min(2,devicePixelRatio||1); W=innerWidth; H=innerHeight; cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0); }
  size(); addEventListener('resize',size);
  for(let i=0;i<160;i++) st.push({x:Math.random(),y:Math.random(),z:Math.random(),c:['111,155,224','240,160,75','127,192,106','232,103,107','220,232,250'][i%5]});
  (function f(){ if(!alive) return; ctx.clearRect(0,0,W,H); for(const s of st){ s.z-=.0016; if(s.z<=0){s.z=1;s.x=Math.random();s.y=Math.random();} const k=1/(s.z*2+.2); const x=W/2+(s.x-.5)*W*k*.6, y=H/2+(s.y-.5)*H*k*.6; ctx.fillStyle=`rgba(${s.c},${Math.min(.9,(1-s.z)*1.1)})`; ctx.fillRect(x,y,1.2+1.6*(1-s.z),1.2+1.6*(1-s.z)); } requestAnimationFrame(f); })();
  return ()=>{alive=false};
}

/* ---------------------------------------------------------
   7. BOOT
   --------------------------------------------------------- */
function boot(){
  buildControls();
  document.querySelectorAll('[data-twominds]').forEach(twoMinds);
  if(PAGE==='index' && !SS.get('yq-intro') && !location.hash) playIntro(false);
  // section arrival whoosh (index)
  if(PAGE==='index'){ const seen=new Set(); const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting&&!seen.has(e.target)){ seen.add(e.target); if(seen.size>1) SFX.hover(); } }),{threshold:.3}); document.querySelectorAll('section[id]').forEach(s=>io.observe(s)); }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
