/*=========================================
MARATHON DIGITAL HUB
ADMIN USERS
=========================================*/

const db = window.supabaseClient;
let users = [];
let selectedUser = null;
let deposits = [];
let withdrawals = [];
let machines = [];
let walletHistory = [];
let referrals = [];
let notifications = [];
let supportMessages = [];

const usersContainer = document.getElementById("usersContainer");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const loadingOverlay = document.getElementById("loadingOverlay");
const successPopup = document.getElementById("successPopup");
const successMessage = document.getElementById("successMessage");
const viewModal = document.getElementById("viewModal");
const editModal = document.getElementById("editModal");

if(localStorage.getItem("admin_logged_in")!=="true") location.href="admin-login.html";

document.addEventListener("DOMContentLoaded",()=>loadDashboard());

function showLoading(){ if(loadingOverlay) loadingOverlay.classList.add("hidden"); }
function hideLoading(){ if(loadingOverlay) loadingOverlay.classList.add("hidden"); }
function showSuccess(message){ if(successMessage) successMessage.textContent=message; if(successPopup) successPopup.classList.add("hidden"); }
if(document.getElementById("closeSuccessPopup")) document.getElementById("closeSuccessPopup").onclick=()=>successPopup.classList.add("hidden");

async function loadDashboard(){
  showLoading();
  await Promise.all([loadUsers(),loadDeposits(),loadWithdrawals(),loadUserMachines()]);
  hideLoading();
}

async function loadUsers(){
  const {data,error}=await db.from("profiles").select("*").order("created_at",{ascending:false});
  if(error){console.log(error);users=[];renderUsers([]);return;}
  users=data||[]; updateDashboardCards(); renderUsers(users);
}
async function loadDeposits(){const {data}=await db.from("deposits").select("*");deposits=data||[];}
async function loadWithdrawals(){const {data}=await db.from("withdrawals").select("*");withdrawals=data||[];}
async function loadUserMachines(){const {data}=await db.from("user_machines").select("*");machines=data||[];}

function updateDashboardCards(){
  document.getElementById("totalUsers").textContent=users.length;
  document.getElementById("activeUsers").textContent=users.filter(u=>u.account_status==="active").length;
  document.getElementById("suspendedUsers").textContent=users.filter(u=>u.account_status==="suspended").length;
  const today=new Date().toDateString();
  document.getElementById("newUsers").textContent=users.filter(u=>new Date(u.created_at).toDateString()===today).length;
  const walletTotal=users.reduce((sum,u)=>sum+Number(u.wallet_balance||0),0);
  document.getElementById("walletTotal").textContent="UGX "+walletTotal.toLocaleString();
  document.getElementById("machineOwners").textContent=new Set(machines.map(m=>m.user_id)).size;
  document.getElementById("pendingDeposits").textContent=deposits.filter(d=>d.status==="pending").length;
  document.getElementById("pendingWithdrawals").textContent=withdrawals.filter(w=>w.status==="pending").length;
  document.getElementById("userCount").textContent=users.length+" Users";
}

function renderUsers(list){
  if(list.length===0){usersContainer.innerHTML=`<div class="emptyState"><h2>No Users Found</h2><p>There are currently no registered users.</p></div>`;return;}
  usersContainer.innerHTML=list.map(user=>{
    const ownedMachines=machines.filter(m=>m.user_id===user.id);
    const totalInvested=ownedMachines.reduce((sum,m)=>sum+Number(m.amount_paid||0),0);
    const wallet=Number(user.wallet_balance||0);
    const review=user.financial_review_required===true;
    return `<div class="userCard" data-user-id="${user.id}">
      <div class="userHeader"><div class="userProfile"><div class="avatar">${(user.fullname||"U").charAt(0).toUpperCase()}</div><div><div class="userName">${user.fullname||"Unnamed user"}</div><div class="userEmail">${user.email||"-"}</div></div></div><div class="status ${user.account_status||"active"}">${user.account_status||"active"}</div></div>
      <div class="userDetails"><div class="detailItem"><span>Phone</span><strong>${user.phone||"-"}</strong></div><div class="detailItem"><span>Wallet</span><strong>UGX ${wallet.toLocaleString()}</strong></div><div class="detailItem"><span>Machines</span><strong>${ownedMachines.length}</strong></div><div class="detailItem"><span>Total Invested</span><strong>UGX ${totalInvested.toLocaleString()}</strong></div></div>
      ${review?'<div class="financial-review-badge">⚠ Financial review required</div>':''}
      <div class="actions"><button class="viewBtn" onclick="viewUser('${user.id}')">Open User</button><button class="editBtn" onclick="editUser('${user.id}')">Manage</button>${user.account_status==="active"?`<button class="suspendBtn" onclick="suspendUser('${user.id}')">Suspend</button>`:`<button class="activateBtn" onclick="activateUser('${user.id}')">Activate</button>`}</div>
    </div>`;
  }).join("");
}

/* Professional page-based user management. No view/edit popups. */
window.viewUser=function(userId){location.href=`admin-user-details.html?id=${encodeURIComponent(userId)}`;};
window.editUser=function(userId){location.href=`admin-user-details.html?id=${encodeURIComponent(userId)}&edit=1`;};

/* Keep legacy modal controls harmless if old markup remains in the page. */
if(document.getElementById("closeViewModal")) document.getElementById("closeViewModal").onclick=()=>viewModal?.classList.add("hidden");
if(document.getElementById("cancelEditBtn")) document.getElementById("cancelEditBtn").onclick=()=>editModal?.classList.add("hidden");
if(document.getElementById("closeEditModal")) document.getElementById("closeEditModal").onclick=()=>editModal?.classList.add("hidden");

searchInput?.addEventListener("input",filterUsers);
statusFilter?.addEventListener("change",filterUsers);
function filterUsers(){
  const search=(searchInput?.value||"").toLowerCase();
  const status=statusFilter?.value||"all";
  renderUsers(users.filter(u=>{
    const matchSearch=(u.fullname||"").toLowerCase().includes(search)||(u.phone||"").toLowerCase().includes(search)||(u.email||"").toLowerCase().includes(search)||(u.referral_code||"").toLowerCase().includes(search);
    return matchSearch&&(status==="all"||u.account_status===status);
  }));
}

console.log("✅ Admin Users Ready — page-based control enabled");
