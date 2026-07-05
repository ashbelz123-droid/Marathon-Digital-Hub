/*=========================================
MARATHON DIGITAL HUB
ADMIN USERS
=========================================*/

const db = window.supabaseClient;

/*=========================================
GLOBAL VARIABLES
=========================================*/

let users = [];

let selectedUser = null;

let deposits = [];

let withdrawals = [];

let machines = [];

let walletHistory = [];

let referrals = [];

let notifications = [];

let supportMessages = [];

/*=========================================
ELEMENTS
=========================================*/

const usersContainer =
document.getElementById("usersContainer");

const searchInput =
document.getElementById("searchInput");

const statusFilter =
document.getElementById("statusFilter");

const loadingOverlay =
document.getElementById("loadingOverlay");

const successPopup =
document.getElementById("successPopup");

const successMessage =
document.getElementById("successMessage");

const viewModal =
document.getElementById("viewModal");

const editModal =
document.getElementById("editModal");

/*=========================================
PROTECT PAGE
=========================================*/

if(localStorage.getItem("admin_logged_in")!=="true"){

location.href="admin-login.html";

}

/*=========================================
START
=========================================*/

document.addEventListener("DOMContentLoaded",()=>{

loadDashboard();

});

/*=========================================
LOADING
=========================================*/

function showLoading(){

loadingOverlay.classList.remove("hidden");

}

function hideLoading(){

loadingOverlay.classList.add("hidden");

}

/*=========================================
SUCCESS
=========================================*/

function showSuccess(message){

successMessage.textContent=message;

successPopup.classList.remove("hidden");

}

document.getElementById("closeSuccessPopup")

.onclick=()=>{

successPopup.classList.add("hidden");

};

/*=========================================
LOAD DASHBOARD
=========================================*/

async function loadDashboard(){

showLoading();

await Promise.all([

loadUsers(),

loadDeposits(),

loadWithdrawals(),

loadUserMachines()

]);

hideLoading();

}

/*=========================================
LOAD USERS
=========================================*/

async function loadUsers(){

const {data,error}=await db

.from("profiles")

.select("*")

.order("created_at",{ascending:false});

if(error){

console.log(error);

users=[];

renderUsers([]);

return;

}

users=data||[];

updateDashboardCards();

renderUsers(users);

}

/*=========================================
LOAD DEPOSITS
=========================================*/

async function loadDeposits(){

const { data } = await db
.from("deposits")
.select("*");

deposits = data || [];

}

/*=========================================
LOAD WITHDRAWALS
=========================================*/

async function loadWithdrawals(){

const { data } = await db
.from("withdrawals")
.select("*");

withdrawals = data || [];

}

/*=========================================
LOAD USER MACHINES
=========================================*/

async function loadUserMachines(){

const { data } = await db
.from("user_machines")
.select("*");

machines = data || [];

}

/*=========================================
UPDATE DASHBOARD
=========================================*/

function updateDashboardCards(){

document.getElementById("totalUsers").textContent =
users.length;

document.getElementById("activeUsers").textContent =
users.filter(u=>u.account_status==="active").length;

document.getElementById("suspendedUsers").textContent =
users.filter(u=>u.account_status==="suspended").length;

const today = new Date().toDateString();

document.getElementById("newUsers").textContent =
users.filter(u=>
new Date(u.created_at).toDateString()===today
).length;

const walletTotal = users.reduce(
(sum,u)=>sum+Number(u.wallet_balance||0),
0
);

document.getElementById("walletTotal").textContent =
"UGX "+walletTotal.toLocaleString();

document.getElementById("machineOwners").textContent =
new Set(machines.map(m=>m.user_id)).size;

document.getElementById("pendingDeposits").textContent =
deposits.filter(d=>d.status==="pending").length;

document.getElementById("pendingWithdrawals").textContent =
withdrawals.filter(w=>w.status==="pending").length;

document.getElementById("userCount").textContent =
users.length+" Users";

}

/*=========================================
RENDER USERS
=========================================*/

function renderUsers(list){

if(list.length===0){

usersContainer.innerHTML=`

<div class="emptyState">

<h2>No Users Found</h2>

<p>There are currently no registered users.</p>

</div>

`;

return;

}

usersContainer.innerHTML = list.map(user=>{

const ownedMachines =
machines.filter(m=>m.user_id===user.id);

const totalInvested =
ownedMachines.reduce(
(sum,m)=>sum+Number(m.amount_paid||0),
0
);

const wallet =
Number(user.wallet_balance||0);

return `

<div class="userCard">

<div class="userHeader">

<div class="userProfile">

<div class="avatar">

${(user.fullname||"U").charAt(0).toUpperCase()}

</div>

<div>

<div class="userName">

${user.fullname}

</div>

<div class="userEmail">

${user.email||"-"}

</div>

</div>

</div>

<div class="status ${user.account_status}">

${user.account_status}

</div>

</div>

<div class="userDetails">

<div class="detailItem">

<span>Phone</span>

<strong>${user.phone||"-"}</strong>

</div>

<div class="detailItem">

<span>Wallet</span>

<strong>UGX ${wallet.toLocaleString()}</strong>

</div>

<div class="detailItem">

<span>Machines</span>

<strong>${ownedMachines.length}</strong>

</div>

<div class="detailItem">

<span>Total Invested</span>

<strong>UGX ${totalInvested.toLocaleString()}</strong>

</div>

</div>

<div class="actions">

<button
class="viewBtn"
onclick="viewUser('${user.id}')">

👁 View

</button>

<button
class="editBtn"
onclick="editUser('${user.id}')">

✏ Edit

</button>

<button
class="walletBtn"
onclick="creditWallet('${user.id}')">

💰 Wallet

</button>

${
user.account_status==="active"

?

`<button
class="suspendBtn"
onclick="suspendUser('${user.id}')">

⛔ Suspend

</button>`

:

`<button
class="activateBtn"
onclick="activateUser('${user.id}')">

✅ Activate

</button>`

}

</div>

</div>

`;

}).join("");

  }

/*=========================================
VIEW USER
=========================================*/

window.viewUser = async function(userId){

selectedUser = users.find(u=>u.id===userId);

if(!selectedUser) return;

showLoading();

/* Profile */

document.getElementById("viewAvatar").textContent =
(selectedUser.fullname||"U")
.charAt(0)
.toUpperCase();

document.getElementById("viewName").textContent =
selectedUser.fullname || "-";

document.getElementById("viewStatus").textContent =
selectedUser.account_status || "-";

document.getElementById("viewPhone").textContent =
selectedUser.phone || "-";

document.getElementById("viewEmail").textContent =
selectedUser.email || "-";

document.getElementById("viewWallet").textContent =
"UGX " +
Number(selectedUser.wallet_balance||0)
.toLocaleString();

document.getElementById("viewReferral").textContent =
selectedUser.referral_code || "-";

document.getElementById("viewReferredBy").textContent =
selectedUser.referred_by || "-";

document.getElementById("viewJoined").textContent =
new Date(selectedUser.created_at)
.toLocaleString();

/*=========================
LOAD USER DATA
=========================*/

const [

depositResult,

withdrawResult,

machineResult,

walletResult,

referralResult,

notificationResult,

supportResult

] = await Promise.all([

db
.from("deposits")
.select("*")
.eq("user_id",userId),

db
.from("withdrawals")
.select("*")
.eq("user_id",userId),

db
.from("user_machines")
.select("*")
.eq("user_id",userId),

db
.from("wallet_transactions")
.select("*")
.eq("user_id",userId)
.order("created_at",{ascending:false}),

db
.from("referrals")
.select("*")
.eq("referrer_id",userId),

db
.from("user_notifications")
.select("*")
.eq("user_id",userId)
.order("created_at",{ascending:false}),

db
.from("support_messages")
.select("*")
.eq("user_id",userId)
.order("created_at",{ascending:false})

]);

const userDeposits =
depositResult.data || [];

const userWithdrawals =
withdrawResult.data || [];

const userMachines =
machineResult.data || [];

const walletHistory =
walletResult.data || [];

const userReferrals =
referralResult.data || [];

const userNotifications =
notificationResult.data || [];

const supportHistory =
supportResult.data || [];

/*=========================
SUMMARY
=========================*/

const totalDeposits =
userDeposits.reduce(

(a,b)=>a+Number(b.amount||0),

0

);

const totalWithdrawals =
userWithdrawals.reduce(

(a,b)=>a+Number(b.amount||0),

0

);

const miningIncome =
walletHistory

.filter(x=>x.type==="mining")

.reduce(

(a,b)=>a+Number(b.amount||0),

0

);

const referralBonus =
walletHistory

.filter(x=>x.type==="referral")

.reduce(

(a,b)=>a+Number(b.amount||0),

0

);

document.getElementById("totalDeposits").textContent =
"UGX " + totalDeposits.toLocaleString();

document.getElementById("totalWithdrawals").textContent =
"UGX " + totalWithdrawals.toLocaleString();

document.getElementById("totalMining").textContent =
"UGX " + miningIncome.toLocaleString();

document.getElementById("totalBonus").textContent =
"UGX " + referralBonus.toLocaleString();

  /*=========================================
POPULATE HISTORY
=========================================*/

document.getElementById("machinesOwned").innerHTML =
userMachines.length
? userMachines.map(m=>`
<div class="historyItem">
<h4>${m.machine_name}</h4>
<p><b>Paid:</b> UGX ${Number(m.amount_paid||0).toLocaleString()}</p>
<p><b>Purchased:</b> ${new Date(m.purchase_date).toLocaleDateString()}</p>
<p><b>Expires:</b> ${m.expiry_date?new Date(m.expiry_date).toLocaleDateString():"-"}</p>
<p><b>Status:</b> ${m.status}</p>
</div>
`).join("")
:
"<div class='historyItem'>No machines owned.</div>";

document.getElementById("walletHistory").innerHTML =
walletHistory.length
? walletHistory.map(t=>`
<div class="historyItem">
<h4>${t.type||"Transaction"}</h4>
<p>UGX ${Number(t.amount||0).toLocaleString()}</p>
<p>${t.description||""}</p>
<p>${new Date(t.created_at).toLocaleString()}</p>
</div>
`).join("")
:
"<div class='historyItem'>No wallet history.</div>";

document.getElementById("depositHistory").innerHTML =
userDeposits.length
? userDeposits.map(d=>`
<div class="historyItem">
<h4>UGX ${Number(d.amount).toLocaleString()}</h4>
<p>${d.method||"-"}</p>
<p>Status: ${d.status}</p>
</div>
`).join("")
:
"<div class='historyItem'>No deposits.</div>";

document.getElementById("withdrawHistory").innerHTML =
userWithdrawals.length
? userWithdrawals.map(w=>`
<div class="historyItem">
<h4>UGX ${Number(w.amount).toLocaleString()}</h4>
<p>${w.phone_number||"-"}</p>
<p>Status: ${w.status}</p>
</div>
`).join("")
:
"<div class='historyItem'>No withdrawals.</div>";

document.getElementById("referralHistory").innerHTML =
userReferrals.length
? userReferrals.map(r=>`
<div class="historyItem">
<h4>Referral Bonus</h4>
<p>UGX ${Number(r.bonus||0).toLocaleString()}</p>
</div>
`).join("")
:
"<div class='historyItem'>No referrals.</div>";

document.getElementById("notificationHistory").innerHTML =
userNotifications.length
? userNotifications.map(n=>`
<div class="historyItem">
<h4>${n.title}</h4>
<p>${n.message}</p>
</div>
`).join("")
:
"<div class='historyItem'>No notifications.</div>";

document.getElementById("supportHistory").innerHTML =
supportHistory.length
? supportHistory.map(s=>`
<div class="historyItem">
<h4>${s.status}</h4>
<p><b>User:</b> ${s.message}</p>
<p><b>Reply:</b> ${s.admin_reply||"No reply yet."}</p>
</div>
`).join("")
:
"<div class='historyItem'>No support messages.</div>";

hideLoading();

viewModal.classList.remove("hidden");

};

/*=========================================
CLOSE VIEW
=========================================*/

document.getElementById("closeViewModal").onclick=()=>{

viewModal.classList.add("hidden");

};

/*=========================================
EDIT USER
=========================================*/

window.editUser=function(id){

const user=users.find(x=>x.id===id);

if(!user) return;

selectedUser=user;

document.getElementById("editFullname").value=user.fullname||"";
document.getElementById("editPhone").value=user.phone||"";
document.getElementById("editEmail").value=user.email||"";
document.getElementById("editWallet").value=user.wallet_balance||0;
document.getElementById("editReferralCode").value=user.referral_code||"";
document.getElementById("editStatus").value=user.account_status||"active";

editModal.classList.remove("hidden");

};

document.getElementById("cancelEditBtn").onclick=()=>{

editModal.classList.add("hidden");

};

document.getElementById("closeEditModal").onclick=()=>{

editModal.classList.add("hidden");

};

/*=========================================
SAVE EDIT
=========================================*/

document.getElementById("editUserForm")

.addEventListener("submit",async(e)=>{

e.preventDefault();

showLoading();

const {error}=await db

.from("profiles")

.update({

fullname:document.getElementById("editFullname").value,

phone:document.getElementById("editPhone").value,

email:document.getElementById("editEmail").value,

wallet_balance:Number(document.getElementById("editWallet").value),

referral_code:document.getElementById("editReferralCode").value,

account_status:document.getElementById("editStatus").value

})

.eq("id",selectedUser.id);

hideLoading();

if(error){

alert(error.message);

return;

}

editModal.classList.add("hidden");

showSuccess("User updated successfully.");

loadDashboard();

});

/*=========================================
SEARCH & FILTER
=========================================*/

searchInput.addEventListener("input",filterUsers);

statusFilter.addEventListener("change",filterUsers);

function filterUsers(){

const search=searchInput.value.toLowerCase();

const status=statusFilter.value;

const filtered=users.filter(u=>{

const matchSearch=

(u.fullname||"").toLowerCase().includes(search)||

(u.phone||"").toLowerCase().includes(search)||

(u.email||"").toLowerCase().includes(search)||

(u.referral_code||"").toLowerCase().includes(search);

const matchStatus=

status==="all"||

u.account_status===status;

return matchSearch&&matchStatus;

});

renderUsers(filtered);

}

console.log("✅ Admin Users Ready");
