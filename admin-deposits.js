const BRIDGE_URL='https://sfimuvisljmezpajxxpf.supabase.co/functions/v1/admin-users-bridge';
const $=id=>document.getElementById(id);let deposits=[];let actionState=null;
const money=v=>'UGX '+Number(v||0).toLocaleString(undefined,{maximumFractionDigits:2});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function showNotice(msg,error=true){const n=$('notice');n.hidden=false;n.textContent=msg;n.className='notice '+(error?'error':'ok');clearTimeout(showNotice.t);showNotice.t=setTimeout(()=>n.hidden=true,5000)}
async function bridge(action,extra={}){
 const token=localStorage.getItem('admin_bridge_token')||'';
 if(!token){location.replace('admin-login.html');throw Error('Admin session expired. Please sign in again.')}
 const r=await fetch(BRIDGE_URL,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache','Pragma':'no-cache'},body:JSON.stringify({action,adminToken:token,...extra})});
 const text=await r.text();let d={};try{d=text?JSON.parse(text):{}}catch(_){d={}}
 if(r.status===401){localStorage.removeItem('admin_bridge_token');localStorage.removeItem('admin_logged_in');location.replace('admin-login.html');throw Error('Admin session expired. Please sign in again.')}
 if(!r.ok||!d.ok)throw Error(d.error||`Request failed (${r.status})`);return d
}
async function load(){
 try{
  $('refreshBtn').disabled=true;
  const d=await bridge('deposits');
  deposits=Array.isArray(d.deposits)?d.deposits:[];
  const s=d.summary||{};
  ['pending','approved','rejected','cancelled','total'].forEach(k=>{const el=$(k+'Count');if(el)el.textContent=s[k]??0;const a=$(k+'Amount');if(a)a.textContent=money(s[k+'Amount']??0)});
  const ta=$('totalAmount');if(ta)ta.textContent=money(s.totalAmount??0);
  const ra=$('resultCount');if(ra)ra.textContent=`${deposits.length} request${deposits.length===1?'':'s'}`;
  const status=document.querySelector('.section-head>span');if(status){status.textContent='● LIVE SUPABASE DATA';status.className='live'}
  render();
 }catch(e){showNotice(e.message,true)}finally{$('refreshBtn').disabled=false}
}
function render(){
 const q=$('searchInput').value.trim().toLowerCase(),f=$('statusFilter').value;
 const rows=deposits.filter(d=>{const p=d.profiles||{};const text=[d.id,d.transaction_id,d.phone_number,p.fullname,p.email,p.phone,d.method,d.status].join(' ').toLowerCase();return(!q||text.includes(q))&&(f==='all'||String(d.status||'').toLowerCase()===f)});
 $('resultCount').textContent=`${rows.length} request${rows.length===1?'':'s'}`;$('emptyState').hidden=rows.length!==0;$('depositsContainer').innerHTML=rows.map(card).join('')
}
function card(d){
 const p=d.profiles||{},status=String(d.status||'pending').toLowerCase(),amount=Number(d.amount||0);let inline='';
 if(status==='pending'&&actionState?.id===d.id){if(actionState.type==='approve')inline=`<div class="inline-action"><label>Amount to credit (UGX)<input id="approveAmount" type="number" min="1" step="1" value="${amount}"></label><div><button class="ghost" onclick="cancelAction()">Cancel</button><button class="approve" onclick="confirmApprove('${esc(d.id)}')">Confirm approval</button></div></div>`;else inline=`<div class="inline-action"><label>Rejection reason <textarea id="rejectReason" rows="3" placeholder="Optional reason for the user"></textarea></label><div><button class="ghost" onclick="cancelAction()">Cancel</button><button class="reject" onclick="confirmReject('${esc(d.id)}')">Confirm rejection</button></div></div>`}
 return `<article class="deposit-card ${esc(status)}"><div class="top"><div><small>DP-${esc(String(d.id||'').slice(0,8).toUpperCase())}</small><span class="status">${esc(status.toUpperCase())}</span></div><time>${esc(new Date(d.created_at).toLocaleString())}</time></div><div class="user"><div class="avatar">${esc((p.fullname||p.email||'U').charAt(0).toUpperCase())}</div><div><h3>${esc(p.fullname||'Unknown user')}</h3><p>${esc(p.email||'No email')}</p><p>${esc(p.phone||d.phone_number||'No phone')}</p></div></div><div class="facts"><div><span>Deposit</span><strong>${money(amount)}</strong></div><div><span>Wallet balance</span><strong>${money(p.wallet_balance)}</strong></div><div><span>Network</span><strong>${esc(d.method||'—')}</strong></div><div><span>Transaction</span><strong>${esc(d.transaction_id||'—')}</strong></div></div>${d.payment_message?`<div class="message"><small>Payment message</small><p>${esc(d.payment_message)}</p></div>`:''}${d.rejection_reason?`<div class="message"><small>Review note</small><p>${esc(d.rejection_reason)}</p></div>`:''}${status==='pending'?`<div class="actions"><button class="approve" onclick="openAction('${esc(d.id)}','approve')">Approve</button><button class="edit" onclick="openAction('${esc(d.id)}','approve')">Edit amount</button><button class="reject" onclick="openAction('${esc(d.id)}','reject')">Reject</button></div>${inline}`:''}</article>`
}
function openAction(id,type){actionState={id,type};render()}function cancelAction(){actionState=null;render()}
async function confirmApprove(id){const n=Number($('approveAmount')?.value);if(!Number.isFinite(n)||n<=0)return showNotice('Enter a valid deposit amount');try{await bridge('deposit_decide',{id,decision:'approved',amount:n});actionState=null;showNotice('Deposit approved and credited.',false);await load()}catch(e){showNotice(e.message)}}
async function confirmReject(id){const reason=$('rejectReason')?.value.trim()||'';try{await bridge('deposit_decide',{id,decision:'rejected',reason});actionState=null;showNotice('Deposit rejected.',false);await load()}catch(e){showNotice(e.message)}}
$('searchInput').addEventListener('input',render);$('statusFilter').addEventListener('change',render);$('refreshBtn').addEventListener('click',load);window.openAction=openAction;window.cancelAction=cancelAction;window.confirmApprove=confirmApprove;window.confirmReject=confirmReject;load();