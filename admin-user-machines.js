/*==================================
ADMIN USER MACHINES V2
PART 1
===================================*/

const db = window.supabaseClient;

let selectedUser = null;
let allUsers = [];
let allMachines = [];

/*==================================
ELEMENTS
===================================*/

const usersContainer = document.getElementById("usersContainer");
const searchInput = document.getElementById("searchInput");

const welcomeState = document.getElementById("welcomeState");
const userDashboard = document.getElementById("userDashboard");

const userName = document.getElementById("userName");
const userPhone = document.getElementById("userPhone");
const userAvatar = document.getElementById("userAvatar");

const membershipBadge = document.getElementById("membershipBadge");
const statusBadge = document.getElementById("statusBadge");
const kycBadge = document.getElementById("kycBadge");

const walletBalance = document.getElementById("walletBalance");
const machineCount = document.getElementById("machineCount");
const investedAmount = document.getElementById("investedAmount");
const profitAmount = document.getElementById("profitAmount");

const userCount = document.getElementById("userCount");

/*==================================
INIT
===================================*/

document.addEventListener("DOMContentLoaded", () => {

loadUsers();

});

/*==================================
LOAD USERS
===================================*/

async function loadUsers(){

const { data, error } = await db

.from("profiles")

.select("*")

.order("created_at",{ascending:false});

if(error){

console.error(error);

return;

}

allUsers = data || [];

userCount.textContent = `${allUsers.length} Users`;

renderUsers(allUsers);

}

/*==================================
RENDER USERS
===================================*/

function renderUsers(users){

usersContainer.innerHTML = "";

if(users.length===0){

usersContainer.innerHTML=`

<div class="emptyCard">

<h3>No Users Found</h3>

</div>

`;

return;

}

users.forEach(user=>{

const card=document.createElement("div");

card.className="userCard";

card.innerHTML=`

<img
class="userListAvatar"
src="${user.avatar_url || 'images/default-avatar.png'}">

<div class="userListInfo">

<h3>${user.fullname}</h3>

<p>${user.phone || user.email || "-"}</p>

</div>

<div class="userArrow">

›

</div>

`;

card.onclick=()=>selectUser(user);

usersContainer.appendChild(card);

});

}

/*==================================
SELECT USER
===================================*/

async function selectUser(user){

selectedUser=user;

welcomeState.style.display="none";

userDashboard.classList.remove("hidden");

userName.textContent=user.fullname;

userPhone.textContent=user.phone || user.email || "-";

userAvatar.src=user.avatar_url || "images/default-avatar.png";

membershipBadge.textContent=user.membership;

statusBadge.textContent=user.account_status;

kycBadge.textContent=user.kyc_status;

walletBalance.textContent=`UGX ${Number(user.wallet_balance||0).toLocaleString()}`;

investedAmount.textContent=`UGX ${Number(user.total_invested||0).toLocaleString()}`;

profitAmount.textContent=`UGX ${Number(user.total_profit||0).toLocaleString()}`;

await loadUserMachines(user.id);

}

/*==================================
SEARCH
===================================*/

searchInput.addEventListener("input",()=>{

const keyword=searchInput.value.toLowerCase();

const filtered=allUsers.filter(user=>{

return(

(user.fullname||"").toLowerCase().includes(keyword)

||

(user.phone||"").toLowerCase().includes(keyword)

||

(user.email||"").toLowerCase().includes(keyword)

);

});

renderUsers(filtered);

});

/*==================================
LOAD USER MACHINES
===================================*/

async function loadUserMachines(userId){

const { data, error } = await db

.from("user_machines")

.select(`
*,
machines(*)
`)

.eq("user_id", userId)

.order("purchase_date",{ascending:false});

if(error){

console.error(error);

return;

}

allMachines = data || [];

machineCount.textContent = allMachines.length;

renderMachines(allMachines);

}

/*==================================
RENDER MACHINES
===================================*/

function renderMachines(list){

const grid = document.getElementById("machinesGrid");

grid.innerHTML = "";

if(list.length===0){

grid.innerHTML=`

<div class="emptyCard">

<h3>No Machines Found</h3>

<p>This user has not purchased any machine yet.</p>

</div>

`;

return;

}

list.forEach(machine=>{

const m = machine.machines || {};

const progress = calculateProgress(
machine.purchase_date,
machine.expiry_date
);

const card = document.createElement("div");

card.className = "machineCard";

card.innerHTML = `

<img
class="machineImage"
src="${machine.machine_image || m.image_url || 'images/default-machine.png'}">

<div class="machineInfo">

<h3>

${machine.machine_name || m.name || "Machine"}

</h3>

<p class="machineSeries">

${m.series || ""}

</p>

<div class="machineBadges">

<span class="machineBadge active">

${machine.status}

</span>

${machine.is_vip ? `

<span class="machineBadge vip">

VIP

</span>

` : ""}

</div>

<div class="machineStats">

<div>

<label>Daily</label>

<span>

UGX ${Number(m.daily_income || 0).toLocaleString()}

</span>

</div>

<div>

<label>Earned</label>

<span>

UGX ${Number(machine.earned_amount || 0).toLocaleString()}

</span>

</div>

<div>

<label>Paid</label>

<span>

UGX ${Number(machine.amount_paid || 0).toLocaleString()}

</span>

</div>

<div>

<label>Remaining</label>

<span>

${progress.remainingDays} Days

</span>

</div>

</div>

<div class="progressTrack">

<div
class="progressFill"
style="width:${progress.percent}%">

</div>

</div>

</div>

<button
class="machineMenu"

data-id="${machine.id}">

⋮

</button>

`;

card.querySelector(".machineMenu")

.addEventListener("click",(e)=>{

e.stopPropagation();

openMachineMenu(machine);

});

card.addEventListener("click",()=>{

showMachineDetails(machine);

});

grid.appendChild(card);

});

}

/*==================================
PROGRESS
===================================*/

function calculateProgress(start,end){

if(!start || !end){

return{

percent:0,

remainingDays:0

};

}

const startDate = new Date(start);

const endDate = new Date(end);

const today = new Date();

const total = endDate-startDate;

const passed = today-startDate;

let percent = (passed/total)*100;

percent = Math.max(0,Math.min(100,percent));

const remaining = Math.max(

0,

Math.ceil(

(endDate-today)/86400000

)

);

return{

percent,

remainingDays:remaining

};

}

/*==================================
FILTERS
===================================*/

document

.querySelectorAll(".filterChip")

.forEach(button=>{

button.addEventListener("click",()=>{

document

.querySelectorAll(".filterChip")

.forEach(chip=>{

chip.classList.remove("active");

});

button.classList.add("active");

const filter = button.dataset.filter;

let filtered = allMachines;

if(filter==="active"){

filtered = allMachines.filter(

m=>m.status==="active"

);

}

if(filter==="vip"){

filtered = allMachines.filter(

m=>m.is_vip===true

);

}

if(filter==="completed"){

filtered = allMachines.filter(

m=>m.completed===true

);

}

if(filter==="suspended"){

filtered = allMachines.filter(

m=>m.status==="suspended"

);

}

renderMachines(filtered);

});

});

/*==================================
CURRENT MACHINE
===================================*/

let currentMachine = null;

/*==================================
MACHINE MENU
===================================*/

function openMachineMenu(machine){

currentMachine = machine;

document
.getElementById("machineMenuSheet")
.classList.add("show");

}

/*==================================
VIEW DETAILS
===================================*/

function showMachineDetails(machine){

currentMachine = machine;

const m = machine.machines || {};

document.getElementById("machineName").textContent =
machine.machine_name || m.name || "-";

document.getElementById("machineSeries").textContent =
m.series || "-";

document.getElementById("machineImage").src =
machine.machine_image ||
m.image_url ||
"images/default-machine.png";

document.getElementById("dailyIncome").textContent =
`UGX ${Number(m.daily_income || 0).toLocaleString()}`;

document.getElementById("earnedAmount").textContent =
`UGX ${Number(machine.earned_amount || 0).toLocaleString()}`;

document.getElementById("machineStatus").textContent =
machine.status;

document.getElementById("purchaseDate").textContent =
machine.purchase_date || "-";

document.getElementById("expiryDate").textContent =
machine.expiry_date || "-";

document.getElementById("vipStatus").textContent =
machine.is_vip ? "VIP" : "Standard";

document
.getElementById("machineDetailsSheet")
.classList.add("show");

}

/*==================================
DELETE MACHINE
===================================*/

async function deleteCurrentMachine(){

if(!currentMachine) return;

const ok = confirm("Delete this machine?");

if(!ok) return;

const { error } = await db

.from("user_machines")

.delete()

.eq("id", currentMachine.id);

if(error){

alert(error.message);

return;

}

closeSheets();

loadUserMachines(selectedUser.id);

}

/*==================================
VIP
===================================*/

async function toggleVIP(){

if(!currentMachine) return;

const { error } = await db

.from("user_machines")

.update({

is_vip: !currentMachine.is_vip

})

.eq("id", currentMachine.id);

if(error){

alert(error.message);

return;

}

closeSheets();

loadUserMachines(selectedUser.id);

}

/*==================================
STATUS
===================================*/

async function toggleStatus(){

if(!currentMachine) return;

const newStatus =

currentMachine.status==="active"

? "suspended"

: "active";

const { error } = await db

.from("user_machines")

.update({

status:newStatus

})

.eq("id",currentMachine.id);

if(error){

alert(error.message);

return;

}

closeSheets();

loadUserMachines(selectedUser.id);

}

/*==================================
BOTTOM SHEETS
===================================*/

function closeSheets(){

document

.querySelectorAll(".bottomSheet")

.forEach(sheet=>{

sheet.classList.remove("show");

});

}

/*==================================
BUTTON EVENTS
===================================*/

document

.querySelectorAll(".closeSheet")

.forEach(btn=>{

btn.onclick=closeSheets;

});

document

.getElementById("deleteMachine")

.onclick=deleteCurrentMachine;

document

.getElementById("vipMachine")

.onclick=toggleVIP;

document

.getElementById("changeStatus")

.onclick=toggleStatus;

document

.getElementById("manageMachineBtn")

.onclick=()=>{

document

.getElementById("manageMachineSheet")

.classList.add("show");

};

document

.getElementById("fab")

.onclick=()=>{

document

.getElementById("actionSheet")

.classList.add("show");

};
