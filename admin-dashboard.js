/* MDH ADMIN DASHBOARD - LIVE SUPABASE DATA
   Read-only dashboard. Financial mutations belong to dedicated admin actions. */
const db = window.supabaseClient;
const money = v => 'UGX ' + Number(v || 0).toLocaleString(undefined,{maximumFractionDigits:2});
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el = id => document.getElementById(id);

if(!db){ console.error('MDH Admin: Supabase client missing.'); }
if(localStorage.getItem('admin_logged_in') !== 'true') window.location.href='admin-login.html';

const adminName=localStorage.getItem('admin_name')||'Administrator';
if(el('adminName')) el('adminName').textContent=adminName;
const avatar=document.querySelector('.admin-avatar'); if(avatar) avatar.textContent=adminName.charAt(0).toUpperCase();

async function count(table, filters=[]){
  let q=db.from(table).select('id',{count:'exact',head:true});
  filters.forEach(([op,col,val])=>{q=op==='eq'?q.eq(col,val):op==='neq'?q.neq(col,val):q});
  const r=await q; if(r.error) throw r.error; return r.count||0;
}

async function loadUsersStats(){
  const [total,active,frozen]=await Promise.all([
    count('profiles'),
    count('profiles',[['eq','account_status','active'],['eq','is_frozen',false]]),
    count('profiles',[['eq','is_frozen',true]])
  ]);
  let suspended=0;
  try { suspended=await count('profiles',[['neq','account_status','active']]); } catch(e){ console.warn(e); }
  if(el('totalUsers')) el('totalUsers').textContent=total;
  if(el('activeUsers')) el('activeUsers').textContent=active;
  if(el('frozenUsers')) el('frozenUsers').textContent=frozen;
  if(el('suspendedUsers')) el('suspendedUsers').textContent=suspended;
}

async function loadMachineStats(){
  const [machines,active]=await Promise.all([
    count('machines'),
    count('user_machines',[['eq','status','active']])
  ]);
  if(el('totalMachines')) el('totalMachines').textContent=machines;
  if(el('activeMachineCount')) el('activeMachineCount').textContent=active;
}

async function loadFinancialStats(){
  const [{data:profiles,error:pErr},{data:ums,error:uErr}]=await Promise.all([
    db.from('profiles').select('wallet_balance'),
    db.from('user_machines').select('amount_paid')
  ]);
  if(pErr) throw pErr; if(uErr) throw uErr;
  const wallet=(profiles||[]).reduce((s,r)=>s+Number(r.wallet_balance||0),0);
  const invested=(ums||[]).reduce((s,r)=>s+Number(r.amount_paid||0),0);
  if(el('totalWallet')) el('totalWallet').textContent=money(wallet);
  if(el('totalInvestment')) el('totalInvestment').textContent=money(invested);
}

async function loadWorkflowCounts(){
  const [deposits,withdrawals,support,notifications]=await Promise.all([
    count('deposits',[['eq','status','pending']]),
    count('withdrawals',[['eq','status','pending']]),
    count('support_messages',[['eq','status','open']]),
    count('admin_notifications',[['eq','is_read',false]])
  ]);
  if(el('pendingDeposits')) el('pendingDeposits').textContent=deposits;
  if(el('pendingWithdrawals')) el('pendingWithdrawals').textContent=withdrawals;
  if(el('openSupport')) el('openSupport').textContent=support;
  if(el('adminNotifications')) el('adminNotifications').textContent=notifications;
  if(el('notificationCount')) el('notificationCount').textContent=notifications;
}

async function loadRecentUsers(){
  const box=el('recentUsers'); if(!box)return;
  const {data,error}=await db.from('profiles').select('fullname,email,wallet_balance,created_at,account_status,is_frozen').order('created_at',{ascending:false}).limit(5);
  if(error){box.innerHTML='<div class="loading-row">Unable to load users.</div>';return;}
  box.innerHTML=(data||[]).map(u=>`<div class="list-item"><div class="user-info"><div class="user-avatar">${esc((u.fullname||'U').charAt(0).toUpperCase())}</div><div class="user-details"><h4>${esc(u.fullname||'Unnamed User')}</h4><p>${esc(u.email||'No email')}</p></div></div><div class="item-right"><h4>${money(u.wallet_balance)}</h4><span>${esc(u.is_frozen?'Frozen':u.account_status||'active')} • ${u.created_at?new Date(u.created_at).toLocaleDateString():''}</span></div></div>`).join('')||'<div class="loading-row">No users yet.</div>';
}

async function loadRecentMachines(){
  const box=el('recentMachines'); if(!box)return;
  const {data,error}=await db.from('user_machines').select('machine_name,amount_paid,purchase_date,status,completed,is_vip').order('purchase_date',{ascending:false}).limit(5);
  if(error){box.innerHTML='<div class="loading-row">Unable to load machines.</div>';return;}
  box.innerHTML=(data||[]).map(m=>`<div class="list-item"><div><h4>${esc(m.machine_name||'Machine')}</h4><p>${money(m.amount_paid)} ${m.is_vip?'• VIP':''}</p></div><div class="item-right"><span>${esc(m.completed?'completed':m.status||'active')}</span><br><span>${m.purchase_date?new Date(m.purchase_date).toLocaleDateString():''}</span></div></div>`).join('')||'<div class="loading-row">No machine purchases yet.</div>';
}

async function loadRecentDeposits(){
  const box=el('recentDeposits'); if(!box)return;
  const {data,error}=await db.from('deposits').select('amount,status,created_at,phone_number,method').order('created_at',{ascending:false}).limit(5);
  if(error){box.innerHTML='<div class="loading-row">Unable to load deposits.</div>';return;}
  box.innerHTML=(data||[]).map(d=>`<div class="list-item"><div><h4>${esc(d.phone_number||d.method||'Deposit')}</h4><p>${money(d.amount)}</p></div><div class="item-right"><span>${esc(d.status||'pending')}</span><br><span>${d.created_at?new Date(d.created_at).toLocaleDateString():''}</span></div></div>`).join('')||'<div class="loading-row">No deposits yet.</div>';
}

async function loadRecentWithdrawals(){
  const box=el('recentWithdrawals'); if(!box)return;
  const {data,error}=await db.from('withdrawals').select('amount,status,created_at,phone_number,method,net_amount,fee').order('created_at',{ascending:false}).limit(5);
  if(error){box.innerHTML='<div class="loading-row">Unable to load withdrawals.</div>';return;}
  box.innerHTML=(data||[]).map(w=>`<div class="list-item"><div><h4>${esc(w.phone_number||w.method||'Withdrawal')}</h4><p>${money(w.amount)}${Number(w.fee||0)?' • fee '+money(w.fee):''}</p></div><div class="item-right"><span>${esc(w.status||'pending')}</span><br><span>${w.created_at?new Date(w.created_at).toLocaleDateString():''}</span></div></div>`).join('')||'<div class="loading-row">No withdrawals yet.</div>';
}

async function loadRecentSupport(){
  const box=el('recentSupport'); if(!box)return;
  const {data,error}=await db.from('support_messages').select('subject,message,status,created_at,priority').order('created_at',{ascending:false}).limit(5);
  if(error){box.innerHTML='<div class="loading-row">Unable to load support.</div>';return;}
  box.innerHTML=(data||[]).map(s=>`<div class="list-item"><div><h4>${esc(s.subject||'Support Message')}</h4><p>${esc((s.message||'').slice(0,60))}${(s.message||'').length>60?'…':''}</p></div><div class="item-right"><span>${esc(s.status||'open')}</span><br><span>${esc(s.priority||'normal')} • ${s.created_at?new Date(s.created_at).toLocaleDateString():''}</span></div></div>`).join('')||'<div class="loading-row">No support messages yet.</div>';
}

async function loadDashboard(){
  if(!db)return;
  const tasks=[loadUsersStats(),loadMachineStats(),loadFinancialStats(),loadWorkflowCounts(),loadRecentUsers(),loadRecentMachines(),loadRecentDeposits(),loadRecentWithdrawals(),loadRecentSupport()];
  const results=await Promise.allSettled(tasks);
  results.filter(r=>r.status==='rejected').forEach(r=>console.error('MDH admin dashboard data:',r.reason));
}

document.addEventListener('DOMContentLoaded',()=>{
  const loader=el('loader');
  loadDashboard().finally(()=>{if(loader)setTimeout(()=>loader.style.display='none',300)});
  setInterval(loadDashboard,30000);
});

el('refreshBtn')?.addEventListener('click',loadDashboard);
el('logoutBtn')?.addEventListener('click',async()=>{try{await db?.auth.signOut()}catch(e){} localStorage.removeItem('admin_logged_in');localStorage.removeItem('admin_id');localStorage.removeItem('admin_name');localStorage.removeItem('admin_role');location.href='admin-login.html';});
console.log('MDH Admin Dashboard: live Supabase mode');
