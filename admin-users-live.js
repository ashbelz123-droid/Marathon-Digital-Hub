/* MDH Admin Users - stable admin bridge controller */
const MDH_DB = window.supabaseClient;
const BRIDGE_URL = `${SUPABASE_URL}/functions/v1/admin-users-bridge`;
let mdhUsers = [], mdhMachines = [], mdhRefreshTimer = null;
const mdh$ = id => document.getElementById(id);
const mdhEsc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mdhMoney = v => 'UGX ' + Number(v || 0).toLocaleString();

function mdhStatus(text, error = false) {
  const e = mdh$('adminStatus');
  if (e) { e.textContent = text; e.className = 'admin-status ' + (error ? 'error' : 'ok'); }
}

function adminToken() { return localStorage.getItem('admin_bridge_token') || ''; }

async function mdhRequest() {
  const token = adminToken();
  if (!token) throw Object.assign(new Error('Admin session expired. Please sign in again.'), {auth:true});

  const response = await fetch(BRIDGE_URL, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-store',
    headers: {'Content-Type':'text/plain;charset=UTF-8'},
    body: JSON.stringify({action:'users', page:1, perPage:1000, adminToken:token})
  });

  const data = await response.json().catch(() => ({}));
  if (response.status === 401) throw Object.assign(new Error('Admin session expired. Please sign in again.'), {auth:true});
  if (!response.ok || !data?.ok) throw new Error(data?.error || `Admin service error (${response.status})`);
  return data;
}

async function mdhLoad(silent=false) {
  if (!adminToken()) { location.replace('admin-login.html'); return; }
  const b=mdh$('refreshBtn');
  if(b){b.disabled=true;b.textContent=silent?'Updating…':'Loading…';}
  if(!silent) mdhStatus('Loading users…');
  try {
    const data=await mdhRequest();
    mdhUsers=Array.isArray(data.users)?data.users:[];
    mdhMachines=Array.isArray(data.machines)?data.machines:[];
    mdhCards(); mdhFilter();
    mdhStatus(`Live data loaded • ${mdhUsers.length} users • ${new Date().toLocaleTimeString()}`);
  } catch(e) {
    console.error('Admin users bridge:',e);
    if(e.auth){['admin_bridge_token','admin_logged_in','admin_name','admin_role','admin_id'].forEach(k=>localStorage.removeItem(k));location.replace('admin-login.html');return;}
    mdhStatus('Unable to load users: '+(e.message||'database error'),true);
    const box=mdh$('usersContainer');
    if(box)box.innerHTML='<div class="emptyState"><h2>User service unavailable</h2><p>'+mdhEsc(e.message||'Unable to connect to the admin database.')+'</p><button type="button" id="retryUsers">Retry</button></div>';
    mdhCards();
    mdh$('retryUsers')?.addEventListener('click',()=>mdhLoad(false));
  } finally { if(b){b.disabled=false;b.textContent='Refresh data';} }
}

function mdhCards(){
  const today=new Date().toDateString();
  const active=mdhUsers.filter(u=>(u.account_status||'active')==='active').length;
  const suspended=mdhUsers.filter(u=>u.account_status==='suspended').length;
  const fresh=mdhUsers.filter(u=>u.created_at&&new Date(u.created_at).toDateString()===today).length;
  const wallet=mdhUsers.reduce((a,u)=>a+Number(u.wallet_balance||0),0);
  const owners=new Set(mdhMachines.map(m=>m.user_id).filter(Boolean)).size;
  [['totalUsers',mdhUsers.length],['activeUsers',active],['suspendedUsers',suspended],['newUsers',fresh],['walletTotal',mdhMoney(wallet)],['machineOwners',owners],['userCount',mdhUsers.length+' users']].forEach(([id,v])=>{if(mdh$(id))mdh$(id).textContent=v});
}

function mdhRender(list){
  const box=mdh$('usersContainer');if(!box)return;
  if(!list.length){box.innerHTML='<div class="emptyState">No users found.</div>';return;}
  box.innerHTML=list.map(u=>{
    const machines=mdhMachines.filter(m=>m.user_id===u.id);
    const photo=u.avatar_url?'<img src="'+mdhEsc(u.avatar_url)+'" alt="User photo" class="avatar">':'<div class="avatar">'+mdhEsc((u.fullname||'U').charAt(0).toUpperCase())+'</div>';
    const st=mdhEsc(u.account_status||'active');
    return '<article class="userCard"><div class="userHeader"><div class="userProfile">'+photo+'<div><div class="userName">'+mdhEsc(u.fullname||'Unnamed user')+'</div><div class="userEmail">'+mdhEsc(u.email||u.phone||'-')+'</div></div></div><div class="status '+st+'">'+st+'</div></div><div class="userDetails"><div class="detailItem"><span>Phone</span><strong>'+mdhEsc(u.phone||'-')+'</strong></div><div class="detailItem"><span>Wallet</span><strong>'+mdhMoney(u.wallet_balance)+'</strong></div><div class="detailItem"><span>Machines</span><strong>'+machines.length+'</strong></div><div class="detailItem"><span>Membership</span><strong>'+mdhEsc(u.membership||'Standard')+'</strong></div></div>'+(u.financial_review_required?'<div class="financial-review-badge">⚠ Financial review required</div>':'')+'<div class="actions"><button class="viewBtn" onclick="location.href=\'admin-user-details.html?id='+encodeURIComponent(u.id)+'\'">Open User</button><button onclick="location.href=\'admin-user-details.html?id='+encodeURIComponent(u.id)+'&edit=1\'">Manage</button></div></article>';
  }).join('');
}

function mdhFilter(){
  const q=(mdh$('searchInput')?.value||'').toLowerCase(),s=mdh$('statusFilter')?.value||'all';
  mdhRender(mdhUsers.filter(u=>(`${u.fullname||''} ${u.phone||''} ${u.email||''} ${u.referral_code||''}`).toLowerCase().includes(q)&&(s==='all'||(u.account_status||'active')===s)));
}

document.addEventListener('DOMContentLoaded',()=>{
  if(!adminToken()){location.replace('admin-login.html');return;}
  mdh$('refreshBtn')?.addEventListener('click',()=>mdhLoad(false));
  mdh$('searchInput')?.addEventListener('input',mdhFilter);
  mdh$('statusFilter')?.addEventListener('change',mdhFilter);
  mdh$('adminLogout')?.addEventListener('click',()=>{clearInterval(mdhRefreshTimer);['admin_bridge_token','admin_logged_in','admin_name','admin_role','admin_id'].forEach(k=>localStorage.removeItem(k));location.replace('admin-login.html')});
  mdhLoad(false);
  mdhRefreshTimer=setInterval(()=>mdhLoad(true),30000);
});