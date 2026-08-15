const BRIDGE_URL='https://sfimuvisljmezpajxxpf.supabase.co/functions/v1/admin-users-bridge';
const container=document.getElementById('withdrawalsContainer');
const search=document.getElementById('searchInput');
const filter=document.getElementById('statusFilter');
const notice=document.getElementById('notice');
let withdrawals=[];
let openAction=null;

const money=v=>'UGX '+Number(v||0).toLocaleString(undefined,{maximumFractionDigits:2});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function token(){return localStorage.getItem('admin_bridge_token')||''}
function showNotice(message,error=true){notice.hidden=false;notice.textContent=message;notice.style.borderColor=error?'#ff667733':'#19e88933';notice.style.color=error?'#ff9da8':'#19e889';clearTimeout(showNotice.t);showNotice.t=setTimeout(()=>notice.hidden=true,5000)}
async function bridge(body){
  const t=token();
  if(!t){location.replace('admin-login.html');throw new Error('Admin session expired')}
  const r=await fetch(BRIDGE_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({...body,adminToken:t})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok)throw new Error(d.error||`Request failed (${r.status})`);
  return d;
}
async function loadWithdrawals(){
  try{
    const d=await bridge({action:'withdrawals'}); withdrawals=d.withdrawals||[]; renderSummary(d.summary||{}); render();
  }catch(e){showNotice(e.message||'Unable to load withdrawals');}
}
function renderSummary(s){
  document.getElementById('pendingCount').textContent=s.pending||0;
  document.getElementById('approvedCount').textContent=s.approved||0;
  document.getElementById('rejectedCount').textContent=s.rejected||0;
  document.getElementById('totalCount').textContent=s.total||0;
  document.getElementById('pendingAmount').textContent=money(s.pendingAmount);
  document.getElementById('approvedAmount').textContent=money(s.approvedAmount);
  document.getElementById('rejectedAmount').textContent=money(s.rejectedAmount);
  document.getElementById('totalAmount').textContent=money(s.totalAmount);
}
function render(){
  const q=search.value.trim().toLowerCase(), f=filter.value;
  const rows=withdrawals.filter(w=>{
    const p=w.profiles||{}; const text=[w.id,p.fullname,p.email,p.phone,w.phone_number,w.method].join(' ').toLowerCase();
    return (!q||text.includes(q))&&(f==='all'||String(w.status||'').toLowerCase()===f);
  });
  document.getElementById('resultCount').textContent=`${rows.length} request${rows.length===1?'':'s'}`;
  document.getElementById('emptyState').hidden=rows.length!==0;
  container.innerHTML=rows.map(card).join('');
}
function card(w){
  const p=w.profiles||{}, status=String(w.status||'pending').toLowerCase(), amount=Number(w.amount||0), fee=Number(w.fee??amount*.095), net=Number(w.net_amount??amount-fee);
  const id=esc(w.id), name=esc(p.fullname||'Unknown user'), initial=esc((p.fullname||p.email||'U').charAt(0).toUpperCase());
  return `<article class="withdraw-card">
    <div class="card-top"><div><div class="request-id">WD-${esc(String(w.id||'').slice(0,8).toUpperCase())}</div><span class="status ${esc(status)}">${esc(status.toUpperCase())}</span></div><div class="time">${esc(new Date(w.created_at).toLocaleString())}</div></div>
    <div class="person"><div class="avatar">${initial}</div><div class="person-main"><b>${name}</b><small>${esc(p.email||'No email')} · ${esc(p.phone||w.phone_number||'No phone')}</small></div></div>
    <div class="amount-box"><div><span>Requested</span><strong>${money(amount)}</strong></div><div><span>Fee</span><strong>${money(fee)}</strong></div><div class="net"><span>Amount to send</span><strong>${money(net)}</strong></div><div><span>Wallet balance</span><strong>${money(p.wallet_balance)}</strong></div></div>
    <div class="payment"><span>Network: <b>${esc(w.method||'—')}</b></span><span>Recipient: <b>${esc(w.phone_number||'—')}</b></span></div>
    ${status==='pending'?`<div class="actions"><div class="action-row"><button class="approve" onclick="setAction('${id}','approve')">Approve</button><button class="reject" onclick="setAction('${id}','reject')">Reject</button></div>${openAction&&openAction.id===w.id?confirmBox(w,openAction.type):''}</div>`:''}
  </article>`;
}
function setAction(id,type){openAction={id,type};render()}
window.setAction=setAction;
function confirmBox(w,type){
  if(type==='approve')return `<div class="confirm-box"><p>Approve <b>${esc(w.profiles?.fullname||'this user')}</b> for ${money(w.net_amount??Number(w.amount)-Number(w.fee||0))}? The database transaction will update the wallet safely.</p><div class="confirm-controls"><button class="confirm-no" onclick="cancelAction()">Cancel</button><button class="confirm-yes" onclick="decide('${esc(w.id)}','approved')">Confirm approval</button></div></div>`;
  return `<div class="confirm-box"><p>Reject this withdrawal. The user's wallet is not deducted for a pending request. You can record a reason.</p><textarea id="rejectReason" placeholder="Reason (optional)"></textarea><div class="confirm-controls"><button class="confirm-no" onclick="cancelAction()">Cancel</button><button class="reject" onclick="decide('${esc(w.id)}','rejected')">Confirm rejection</button></div></div>`;
}
function cancelAction(){openAction=null;render()}
window.cancelAction=cancelAction;
async function decide(id,decision){
  try{
    let reason=''; if(decision==='rejected')reason=document.getElementById('rejectReason')?.value.trim()||'';
    const button=[...document.querySelectorAll('.confirm-controls button')].find(b=>b.textContent.toLowerCase().includes('confirm'));
    if(button){button.disabled=true;button.textContent='Processing...'}
    await bridge({action:'withdrawal_decide',id,decision,reason});
    openAction=null;showNotice(decision==='approved'?'Withdrawal approved successfully.':'Withdrawal rejected.',false);await loadWithdrawals();
  }catch(e){showNotice(e.message||'Unable to process withdrawal')}
}
window.decide=decide;
search.addEventListener('input',render);filter.addEventListener('change',render);document.getElementById('refreshBtn').addEventListener('click',loadWithdrawals);
loadWithdrawals();