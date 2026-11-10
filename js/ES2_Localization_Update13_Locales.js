const D=[["Update13Title", "Harmonic Memories", 0], ["Update13Description", "More than 6 years have passed since the release of the first Endless Space game... FlybyNo, decided to delve into the archives and remaster classic songs from the game that made what Amplitude Studios is today! Harmonic Memories also features the arrival of a new Harmony Hero, FES2 Reflects.", 0]];
const E=[[0, "Update13", "Update13", [["Title", 0], ["Description", 1]]]];
const C=[["Update", 2]];
const B=[["Harmonic Memories","More than 6 years have passed since the release of the first Endless Space game... FlybyNo, decided to delve into the archives and remaster classic songs from the game that made what Amplitude Studios is today! Harmonic Memories also features the arrival of a new Harmony Hero, FES2 Reflects."]];



const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const cap=w=>{w=String(w).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/([A-Za-z])(\d)/g,'$1 $2').replace(/(\d)([A-Za-z])/g,'$1 $2').replace(/[_-]+/g,' ').trim();return w?w[0].toUpperCase()+w.slice(1):w};
function pretty(s){
return esc(String(s||'').replace(/\\n/g,'\n'))
.replace(/#[0-9a-fA-F]{6}#([\s\S]*?)#REVERT#/g,'$1').replace(/#[0-9a-fA-F]{6}#/g,'').replace(/#REVERT#/g,'')
.replace(/\$Amount0?(\d+)Name/g,'<i class="tok">N<sub>$1</sub></i>').replace(/\$Timer/g,'<i class="tok">T</i>')
.replace(/\$([A-Za-z]\w*)/g,(m,w)=>'<i class="tok">'+esc(cap(w.replace(/Name$/,'')||w))+'</i>')
.replace(/\[turn\]/g,'turns')
.replace(/\[(?:Strat\d+)?([\w-]+?)(?:Colored)?\]/g,(m,w)=>'<b class="kw">'+esc(cap(w))+'</b>')}
const FLAB={Description:'Description',ShortTitle:'Short title',ShortDescription:'Short description',Tooltip:'Tooltip',TooltipTitle:'Tooltip title',TooltipDescription:'Tooltip',TooltipEffect:'Effect',TooltipEffectBis:'Effect (2)',Effect:'Effect',EffectOverride:'Effect override',Objective:'Objective',ObjectiveTooltip:'Hint',ObjectiveTitle:'Objective title',ObjectiveDescription:'Objective details',Outcome:'If completed',OutcomeFailed:'If failed',Failed:'If failed',Completed:'Completed',IntroTitle:'Intro title',IntroDescription:'Intro',RewardTitle:'Consequence',Text:'Text'};
const FCLS={Outcome:'ok',Completed:'ok',OutcomeFailed:'bad',Failed:'bad'};
const PREF=['IntroDescription','Description','ShortDescription','Objective','ObjectiveTitle','ObjectiveDescription','ObjectiveTooltip','Outcome','OutcomeFailed','Tooltip','TooltipDescription','TooltipEffect','TooltipEffectBis','Effect'];
const BYCAT={};E.forEach(e=>(BYCAT[e[0]]=BYCAT[e[0]]||[]).push(e));
const val=x=>D[x[1]][1];
function head(e){const f=e[3];for(const k of ['Title','IntroTitle','ShortTitle']){const x=f.find(y=>y[0]===k&&val(y));if(x)return x}
return f.find(y=>/Title$/.test(y[0])&&val(y))||null}
function entryCard(e){const h=head(e),f=e[3].filter(x=>x!==h).map((x,i)=>[x,i]);
f.sort((a,b)=>{const pa=PREF.indexOf(a[0][0]),pb=PREF.indexOf(b[0][0]);return (pa<0?100:pa)-(pb<0?100:pb)||a[1]-b[1]});
let len=0,rows=f.map(([x])=>{const v=val(x);len+=v.length;const c=FCLS[x[0]]||'';
return '<div class="row '+c+'"><span title="%'+esc(D[x[1]][0])+'">'+esc(FLAB[x[0]]||cap(x[0]))+'</span>'+(v.trim()?pretty(v):'<span class="empty">(empty)</span>')+'</div>'}).join('');
return '<div class="card'+(f.length>8||len>1400?' big':'')+'"><h3>'+(h?pretty(val(h)):esc(cap(e[2])))+'</h3><div class="tag">%'+esc(e[2])+'</div>'+rows+'</div>'}
const rawRow=(i,link)=>{const d=D[i];return '<div class="rw"><code>%'+esc(d[0])+'</code>'+(link&&C[d[2]]?' <a href="#c-'+d[2]+'">'+esc(C[d[2]][0])+'</a>':'')+'<div>'+esc(String(d[1]).replace(/\\n/g,'\n'))+'</div></div>'};
const singleRow=x=>{const d=D[x[1]];return '<div class="rw"><code>%'+esc(d[0])+'</code><div>'+(d[1].trim()?pretty(d[1]):'<span class="empty">(empty)</span>')+'</div></div>'};
let cur=0;const LIM=120,lim={};
function renderCat(){const i=cur,es=BYCAT[i]||[],n=lim[i]||LIM,part=es.slice(0,n);
const subs=new Map();part.forEach(e=>{if(!subs.has(e[1]))subs.set(e[1],[]);subs.get(e[1]).push(e)});
let h='<h2 class="sec">'+esc(C[i][0])+' <small>– '+C[i][1]+' strings in '+es.length+' entries</small></h2>';
subs.forEach((list,s)=>{const cards=list.filter(e=>e[3].length>1||head(e)&&false),singles=list.filter(e=>e[3].length===1);
if(subs.size>1)h+='<h4>'+esc(s)+' ('+list.length+')</h4>';
if(cards.length)h+='<div class="cols">'+cards.map(entryCard).join('')+'</div>';
if(singles.length)h+='<div>'+singles.map(e=>singleRow(e[3][0])).join('')+'</div>'});
if(es.length>n)h+='<button class="more" data-more="1">Show '+Math.min(LIM,es.length-n)+' more ('+(es.length-n)+' left)</button>';
$('#catview').innerHTML=h}
function showCat(i){cur=i;document.querySelectorAll('#cats a').forEach(a=>a.classList.toggle('on',+a.dataset.i===i));renderCat();}
$('#catview').onclick=e=>{if(e.target.closest('.more')){lim[cur]=(lim[cur]||LIM)+LIM;renderCat();return}const r=e.target.closest('.rw');if(r&&!e.target.closest('a'))r.classList.toggle('open')};
$('#cats').innerHTML=C.map((c,i)=>'<a href="#c-'+i+'" data-i="'+i+'">'+esc(c[0])+'<small>'+c[1]+'</small></a>').join('');
function overview(){let h='';
if(B.length){h+='<h2 class="sec">What this file announces</h2><div class="cols one">'+B.map(b=>'<div class="card"><h3>'+pretty(b[0])+'</h3>'+(b[1]?'<p>'+pretty(b[1])+'</p>':'')+'</div>').join('')+'</div>'}
h+='<h2 class="sec">Topics</h2><div class="cols">'+C.map((c,i)=>{const es=BYCAT[i]||[];const ex=[];
for(const e of es){const t=head(e);if(t){ex.push(pretty(val(t)).replace(/<[^>]+>/g,''));if(ex.length>=4)break}}
return '<div class="card"><h3><a href="#c-'+i+'">'+esc(c[0])+'</a></h3><span class="stat">'+c[1]+' strings · '+es.length+' entries</span>'+(ex.length?'<p>'+ex.join(' · ')+'</p>':'')+'<a class="chip" href="#c-'+i+'">Open</a></div>'}).join('')+'</div>';
$('#t-overview').insertAdjacentHTML('beforeend',h)}
let rawLim=300;
function raw(){const q=$('#q').value.trim().toLowerCase(),r=[];
for(let i=0;i<D.length;i++){if(!q||(D[i][0]+' '+D[i][1]).toLowerCase().includes(q))r.push(i)}
$('#rawn').textContent=r.length+' of '+D.length+' strings'+(q?' match “'+q+'”':'')+(r.length>rawLim?' (showing the first '+rawLim+')':'')+'. Click a string to expand it.';
$('#rawl').innerHTML=r.slice(0,rawLim).map(i=>rawRow(i,true)).join('')+(r.length>rawLim?'<button class="more" data-more="1">Show 300 more</button>':'')}
$('#rawl').onclick=e=>{if(e.target.closest('.more')){rawLim+=300;raw();return}if(e.target.closest('a'))return;const r=e.target.closest('.rw');if(r)r.classList.toggle('open')};
$('#q').oninput=()=>{rawLim=300;raw();if(location.hash!=='#raw')location.hash='raw'};
const TB=[['overview','Overview'],['browse','Browse by topic'],['raw','All strings']];
$('#tabs').innerHTML=TB.map(t=>'<a href="#'+t[0]+'" data-t="'+t[0]+'">'+t[1]+'</a>').join('');
function tab(t){TB.forEach(x=>$('#t-'+x[0]).hidden=x[0]!==t);document.querySelectorAll('#tabs a').forEach(a=>a.classList.toggle('on',a.dataset.t===t))}
function route(){const h=location.hash.slice(1);
if(h.startsWith('c-')&&C[+h.slice(2)]){tab('browse');showCat(+h.slice(2));window.scrollTo(0,0)}
else if(h==='browse'){tab('browse');showCat(cur)}
else if(TB.some(t=>t[0]===h))tab(h);else tab('overview')}
overview();raw();addEventListener('hashchange',route);route();
