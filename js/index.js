const q=document.getElementById('q'),n=document.getElementById('n'),cs=[...document.querySelectorAll('#list .card')];
function f(){const t=q.value.trim().toLowerCase();let k=0;cs.forEach(c=>{const s=!t||c.dataset.h.includes(t);c.hidden=!s;if(s)k++});
n.textContent=k+' of '+cs.length+' files'+(t?' match “'+t+'”':'')+'. Topic chips open that topic on the file’s Browse tab.'}
q.oninput=f;f();
