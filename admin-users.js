/*=========================================
MARATHON DIGITAL HUB - ADMIN USERS
Page-based professional user control.
=========================================*/
const db=window.supabaseClient;
let users=[],machines=[],deposits=[],withdrawals=[];
const $=id=>document.getElementById(id);
if(localStorage.getItem("admin_logged_in")!=="true") location.href="admin-login.html";
document.addEventListener("DOMContentLoaded",loadDashboard);
function showLoading(){const x=$("loadingOverlay");if(x)x.classList.add("hidden")}
function hideLoading(){showLoading()}
async function loadDashboard(){await Promise.all([loadUsers(),loadDeposits(),loadWithdrawals(),loadMachines()]);updateCards();renderUsers(users)}
async function loadUsers(){const r=await db.from("profiles").select("*").order("created_at",{ascending:false});if(r.error){console.error(r.error);users=[]}else users=r.data||[]}
async function loadDeposits(){const r=await db.from("deposits").select("*");deposits=r.data||[]}
async function loadWithdrawals(){const r=await db.from("withdrawals").select("*");withdrawals=r.data||[]}
async function loadMachines(){const r=await db.from("user_machines").select("*");machines=r.data||[]}
function updateCards(){
 if($("totalUsers"))$("totalUsers").textContent=users.length;
 if($("activeUsers"))$("activeUsers").textContent=users.filter(x=>x.account_status==="active").length;
 if($("suspendedUsers"))$("suspendedUsers").textContent=users.filter(x=>x.account_status==="suspended").length;
 const today=new Date().toDateString();if($("newUsers"))$("newUsers").textContent=users.filter(x=>new Date(x.created_at).toDateString()===today).length;
 if($("walletTotal"))$("walletTotal").textContent="UGX "+users.reduce((a,x)=>a+Number(x.wallet_balance||0),0).toLocaleString();
 if($("machineOwners"))$("machineOwners").textContent=new Set(machines.map(x=>x.user_id)).size;
 if($("pendingDeposits"))$("pendingDeposits").textContent=deposits.filter(x=>x.status==="pending").length;
 if($("pendingWithdrawals"))$("pendingWithdrawals").textContent=withdrawals.filter(x=>x.status==="pending").length;
 if($("userCount"))$("userCount").textContent=users.length+" Users";
}
function renderUsers(list){
 const box=$("usersContainer");if(!box)return;
 if(!list.length){box.innerHTML='<div class="emptyState"><h2>No Users Found</h2><p>There are currently no registered users.</p></div>';return}
 box.innerHTML=list.map(u=>{const ms=machines.filter(m=>m.user_id===u.id),inv=ms.reduce((a,m)=>a+Number(m.amount_paid||0),0);return `<div class="userCard" data-user-id="${u.id}"><div class="userHeader"><div class="userProfile"><div class="avatar">${(u.fullname||"U")[0].toUpperCase()}</div><div><div class="userName">${u.fullname||"Unnamed user"}</div><div class="userEmail">${u.email||"-"}</div></div></div><div class="status ${u.account_status||"active"}">${u.account_status||"active"}</div></div><div class="userDetails"><div class="detailItem"><span>Phone</span><strong>${u.phone||"-"}</strong></div><div class="detailItem"><span>Wallet</span><strong>UGX ${Number(u.wallet_balance||0).toLocaleString()}</strong></div><div class="detailItem"><span>Machines</span><strong>${ms.length}</strong></div><div class="detailItem"><span>Invested</span><strong>UGX ${inv.toLocaleString()}</strong></div></div>${u.financial_review_required?'<div style="color:#ffc857;font-size:10px;margin:8px 0">⚠ Financial review required</div>':''}<div class="actions"><button class="viewBtn" onclick="viewUser('${u.id}')">Open User</button><button class="editBtn" onclick="editUser('${u.id}')">Manage</button></div></div>`}).join("")
}
/* Existing user cards now navigate to the full user page instead of popups. */
window.viewUser=id=>location.href=`admin-user-details.html?id=${encodeURIComponent(id)}`;
window.editUser=id=>location.href=`admin-user-details.html?id=${encodeURIComponent(id)}&edit=1`;
function filterUsers(){const q=($("searchInput")?.value||"").toLowerCase(),s=$("statusFilter")?.value||"all";renderUsers(users.filter(u=>`${u.fullname||""} ${u.phone||""} ${u.email||""} ${u.referral_code||""}`.toLowerCase().includes(q)&&(s==="all"||u.account_status===s)))}
$("searchInput")?.addEventListener("input",filterUsers);$("statusFilter")?.addEventListener("change",filterUsers);
console.log("Admin Users: page-based control enabled");