/*=========================================
MARATHON DIGITAL HUB
ADMIN USER MACHINES
=========================================*/

/*=========================================
SUPABASE
=========================================*/

const db = window.supabaseClient;

/*=========================================
GLOBAL DATA
=========================================*/

let users = [];
let selectedUser = null;
let machinePlans = [];
let userMachines = [];

/*=========================================
ELEMENTS
=========================================*/

const usersList = document.getElementById("usersList");

const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const totalMachines = document.getElementById("totalMachines");
const vipMachines = document.getElementById("vipMachines");

const loadingScreen =
document.getElementById("loadingScreen");

/*=========================================
LOADING
=========================================*/

function showLoading(){

if(loadingScreen){

loadingScreen.classList.remove("hidden");

}

}

function hideLoading(){

if(loadingScreen){

loadingScreen.classList.add("hidden");

}

}

/*=========================================
INITIALIZE
=========================================*/

document.addEventListener("DOMContentLoaded",initPage);

async function initPage(){

showLoading();

try{

await loadUsers();

await loadMachinePlans();

}catch(err){

console.error(err);

alert(err.message);

}

hideLoading();

}

/*=========================================
LOAD USERS
=========================================*/

async function loadUsers(){

const { data, error } = await db

.from("profiles")

.select("*");

if(error){

throw error;

}

users = data || [];

updateDashboard();

}

/*=========================================
LOAD MACHINE PLANS
=========================================*/

async function loadMachinePlans(){

const { data, error } = await db

.from("machines")

.select("*")

.eq("status",true);

if(error){

throw error;

}

machinePlans = data || [];

}

/*=========================================
UPDATE DASHBOARD
=========================================*/

function updateDashboard(){

totalUsers.textContent = users.length;

activeUsers.textContent = users.filter(

user=>!user.is_frozen

).length;

vipMachines.textContent = users.filter(

user=>user.membership==="VIP"

).length;

}

/*=========================================
RENDER USERS
=========================================*/

function renderUsers(list = users){

usersList.innerHTML = "";

if(list.length === 0){

usersList.innerHTML = `
<div class="emptyCard">
<h3>No Users Found</h3>
</div>
`;

return;

}

list.forEach(user=>{

const card = document.createElement("div");

card.className = "userCard";

card.innerHTML = `

<div class="userLeft">

<img
class="userAvatar"
src="${user.avatar_url || 'images/default-avatar.png'}">

<div class="userInfo">

<h3>${user.fullname}</h3>

<p>${user.phone || "No Phone"}</p>

<p>${user.email || "No Email"}</p>

</div>

</div>

<div class="userRight">

<span class="badge">

${user.membership}

</span>

</div>

`;

card.onclick = ()=>{

selectUser(user);

};

usersList.appendChild(card);

});

}

/*=========================================
SEARCH USERS
=========================================*/

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input",()=>{

const keyword = searchInput.value

.toLowerCase()

.trim();

const filtered = users.filter(user=>{

return (

(user.fullname || "")

.toLowerCase()

.includes(keyword)

||

(user.phone || "")

.toLowerCase()

.includes(keyword)

||

(user.email || "")

.toLowerCase()

.includes(keyword)

);

});

renderUsers(filtered);

});

/*=========================================
UPDATE DASHBOARD
=========================================*/

function updateDashboard(){

totalUsers.textContent = users.length;

activeUsers.textContent = users.filter(

user=>!user.is_frozen

).length;

vipMachines.textContent = users.filter(

user=>user.membership==="VIP"

).length;

renderUsers();

}

/*=========================================
SELECT USER
=========================================*/

function selectUser(user){

selectedUser = user;

document

.getElementById("userProfileSection")

.classList.remove("hidden");

document

.getElementById("machinesSection")

.classList.remove("hidden");

loadUserProfile();

loadUserMachines();

}

/*=========================================
LOAD USER PROFILE
=========================================*/

function loadUserProfile(){

if(!selectedUser) return;

document.getElementById("profileAvatar").src =
selectedUser.avatar_url || "images/default-avatar.png";

document.getElementById("profileName").textContent =
selectedUser.fullname || "Unknown User";

document.getElementById("profilePhone").textContent =
selectedUser.phone || "No Phone";

document.getElementById("profileEmail").textContent =
selectedUser.email || "No Email";

document.getElementById("membershipBadge").textContent =
selectedUser.membership || "Standard";

document.getElementById("statusBadge").textContent =
selectedUser.account_status || "Active";

document.getElementById("kycBadge").textContent =
selectedUser.kyc_status || "Not Verified";

document.getElementById("profileInvested").textContent =
"UGX " + Number(selectedUser.total_invested || 0).toLocaleString();

document.getElementById("profileProfit").textContent =
"UGX " + Number(selectedUser.total_profit || 0).toLocaleString();

document.getElementById("profileReferralBonus").textContent =
"UGX " + Number(selectedUser.total_referral_bonus || 0).toLocaleString();

}

/*=========================================
LOAD USER MACHINES
=========================================*/

async function loadUserMachines(){

if(!selectedUser) return;

const { data, error } = await db

.from("user_machines")

.select("*")

.eq("user_id", selectedUser.id)

.order("purchase_date",{ascending:false});

if(error){

console.error(error);

alert(error.message);

return;

}

userMachines = data || [];

document.getElementById("profileMachineCount").textContent =
userMachines.length;

updateMachineStats();

renderMachines();

}

/*=========================================
UPDATE MACHINE STATS
=========================================*/

function updateMachineStats(){

document.getElementById("activeMachineCount").textContent =
userMachines.filter(
m => m.status === "active"
).length;

document.getElementById("completedMachineCount").textContent =
userMachines.filter(
m => m.completed === true
).length;

document.getElementById("expiredMachineCount").textContent =
userMachines.filter(
m => new Date(m.expiry_date) < new Date()
).length;

document.getElementById("pausedMachineCount").textContent =
userMachines.filter(
m => m.status === "paused"
).length;

totalMachines.textContent = userMachines.length;

}
