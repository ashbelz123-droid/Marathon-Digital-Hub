/*=========================================
MARATHON DIGITAL HUB
ADMIN USER MACHINES V2
PART 1
=========================================*/

/*=========================================
SUPABASE
=========================================*/

const db = window.supabaseClient;

/*=========================================
GLOBAL STATE
=========================================*/

let users = [];
let machinePlans = [];
let userMachines = [];

let selectedUser = null;
let editingMachine = null;

/*=========================================
DOM ELEMENTS
=========================================*/

// Dashboard

const totalUsers =
document.getElementById("totalUsers");

const activeUsers =
document.getElementById("activeUsers");

const totalMachines =
document.getElementById("totalMachines");

const vipMachines =
document.getElementById("vipMachines");

// Users

const usersList =
document.getElementById("usersList");

const searchInput =
document.getElementById("searchInput");

// Sections

const profileSection =
document.getElementById("userProfileSection");

const machinesSection =
document.getElementById("machinesSection");

// Loading

const loadingScreen =
document.getElementById("loadingScreen");

// Toast

const toast =
document.getElementById("toast");

const toastText =
document.getElementById("toastText");

/*=========================================
INITIALIZE
=========================================*/

document.addEventListener(
"DOMContentLoaded",
initializePage
);

async function initializePage(){

showLoading();

try{

await loadMachinePlans();

await loadUsers();

bindEvents();

showToast("Admin Panel Ready");

}catch(error){

console.error(error);

alert(error.message);

}

hideLoading();

}

/*=========================================
LOADING
=========================================*/

function showLoading(){

loadingScreen.classList.remove("hidden");

}

function hideLoading(){

loadingScreen.classList.add("hidden");

}

/*=========================================
TOAST
=========================================*/

function showToast(message){

toastText.textContent = message;

toast.classList.add("show");

setTimeout(()=>{

toast.classList.remove("show");

},3000);

}

/*=========================================
EVENTS
=========================================*/

function bindEvents(){

searchInput.addEventListener(
"input",
searchUsers
);

document
.getElementById("refreshBtn")
.addEventListener(
"click",
refreshPage
);

document
.getElementById("logoutBtn")
.addEventListener(
"click",
logoutAdmin
);

}

/*=========================================
READY
=========================================*/

console.log(
"MDH Admin User Machines V2 Loaded"
);

/*=========================================
LOAD MACHINE PLANS
=========================================*/

async function loadMachinePlans(){

const { data, error } = await db

.from("machines")

.select("*")

.eq("status", true)

.order("display_order",{
ascending:true
});

if(error) throw error;

machinePlans = data || [];

}

/*=========================================
LOAD USERS
=========================================*/

async function loadUsers(){

console.log("Loading users...");

const { data, error } = await db
.from("profiles")
.select("*");

if(error){

console.error("Profiles Error:", error);

showToast(error.message);

return;

}

console.log("Users:", data);

users = data || [];

updateDashboard();

renderUsers();

}

/*=========================================
UPDATE DASHBOARD
=========================================*/

function updateDashboard(){

totalUsers.textContent =
users.length;

activeUsers.textContent =
users.filter(user =>
!user.is_frozen
).length;

vipMachines.textContent =
users.filter(user =>
user.membership === "VIP"
).length;

totalMachines.textContent = 0;

}

/*=========================================
RENDER USERS
=========================================*/

function renderUsers(list = users){

usersList.innerHTML = "";

if(list.length === 0){

usersList.innerHTML = `

<div class="emptyCard">

<h3>

No Users Found

</h3>

<p>

There are no registered users.

</p>

</div>

`;

return;

}

list.forEach(user=>{

const card =
document.createElement("div");

card.className = "userCard";

if(
selectedUser &&
selectedUser.id === user.id
){

card.classList.add("active");

}

card.innerHTML = `

<div class="userLeft">

<img

class="userAvatar"

src="${
user.avatar_url ||
'images/default-avatar.png'
}"

alt="Avatar">

<div class="userInfo">

<h3>

${user.fullname || "Unknown User"}

</h3>

<p>

${user.phone || "No Phone"}

</p>

<p>

${user.email || "No Email"}

</p>

</div>

</div>

<div class="userRight">

<div class="userMembership">

${user.membership || "Standard"}

</div>

<div class="userStatus ${user.is_frozen ? "frozen" : ""}">

${user.is_frozen ? "Frozen" : "Active"}

</div>

</div>

`;

card.addEventListener("click",()=>{

selectUser(user);

});

usersList.appendChild(card);

});

}

/*=========================================
SEARCH USERS
=========================================*/

function searchUsers(){

const keyword =
searchInput.value
.toLowerCase()
.trim();

const filtered = users.filter(user=>{

return(

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

}

/*=========================================
REFRESH PAGE
=========================================*/

async function refreshPage(){

showLoading();

await loadUsers();

if(selectedUser){

await loadUserMachines();

}

hideLoading();

showToast("Data refreshed");

}

/*=========================================
SELECT USER
=========================================*/

async function selectUser(user){

selectedUser = user;

renderUsers();

profileSection.classList.remove("hidden");
machinesSection.classList.remove("hidden");

loadUserProfile();

await loadUserMachines();

}

/*=========================================
LOAD USER PROFILE
=========================================*/

function loadUserProfile(){

if(!selectedUser) return;

document.getElementById("profileAvatar").src =
selectedUser.avatar_url ||
"images/default-avatar.png";

document.getElementById("profileName").textContent =
selectedUser.fullname ||
"Unknown User";

document.getElementById("profilePhone").textContent =
selectedUser.phone ||
"No Phone Number";

document.getElementById("profileEmail").textContent =
selectedUser.email ||
"No Email";

document.getElementById("membershipBadge").textContent =
selectedUser.membership ||
"Standard";

document.getElementById("statusBadge").textContent =
selectedUser.is_frozen
? "Frozen"
: (selectedUser.account_status || "Active");

document.getElementById("kycBadge").textContent =
selectedUser.kyc_status ||
"Not Verified";

document.getElementById("profileInvested").textContent =
"UGX " +
Number(
selectedUser.total_invested || 0
).toLocaleString();

document.getElementById("profileProfit").textContent =
"UGX " +
Number(
selectedUser.total_profit || 0
).toLocaleString();

document.getElementById("profileReferralBonus").textContent =
"UGX " +
Number(
selectedUser.total_referral_bonus || 0
).toLocaleString();

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

.order("purchase_date",{
ascending:false
});

if(error){

console.error(error);

showToast(error.message);

return;

}

userMachines = data || [];

updateMachineSummary();

renderMachineCards();

}

/*=========================================
UPDATE MACHINE SUMMARY
=========================================*/

function updateMachineSummary(){

document.getElementById(
"profileMachineCount"
).textContent = userMachines.length;

document.getElementById(
"activeMachineCount"
).textContent =

userMachines.filter(
m => m.status === "active"
).length;

document.getElementById(
"completedMachineCount"
).textContent =

userMachines.filter(
m => m.completed
).length;

document.getElementById(
"pausedMachineCount"
).textContent =

userMachines.filter(
m => m.status === "paused"
).length;

document.getElementById(
"expiredMachineCount"
).textContent =

userMachines.filter(m=>{

if(!m.expiry_date) return false;

return new Date(m.expiry_date) < new Date();

}).length;

totalMachines.textContent =
userMachines.length;

}

/*=========================================
FORMAT DATE
=========================================*/

function formatDate(date){

if(!date) return "--";

return new Date(date)

.toLocaleDateString(

"en-UG",

{

day:"2-digit",

month:"short",

year:"numeric"

}

);

                        }

/*=========================================
RENDER MACHINE CARDS
=========================================*/

function renderMachineCards(list = userMachines){

const machinesList =
document.getElementById("machinesList");

machinesList.innerHTML = "";

if(list.length === 0){

machinesList.innerHTML = `

<div class="emptyCard">

<h3>

No Purchased Machines

</h3>

<p>

This user has not purchased any machines yet.

</p>

</div>

`;

return;

}

list.forEach(machine=>{

const expired =

machine.expiry_date &&
new Date(machine.expiry_date) < new Date();

const progress =

machine.duration_days > 0

?

Math.min(

100,

Math.round(

((machine.current_day || 0) /

machine.duration_days) * 100

)

)

:0;

const card = document.createElement("div");

card.className = "machineCard";

card.innerHTML = `

<img

class="machineImage"

src="${
machine.machine_image ||
"images/default-machine.png"
}"

alt="Machine">

<div class="machineContent">

<h3>

${machine.machine_name || "Machine"}

</h3>

<p>

Series :

<b>

${machine.machine_series || "--"}

</b>

</p>

<p>

Paid :

<b>

UGX ${Number(machine.amount_paid || 0).toLocaleString()}

</b>

</p>

<p>

Earned :

<b>

UGX ${Number(machine.earned_amount || 0).toLocaleString()}

</b>

</p>

<p>

Current Day :

<b>

${machine.current_day || 0}

/

${machine.duration_days || 0}

</b>

</p>

<p>

Remaining :

<b>

${machine.remaining_days || 0}

Days

</b>

</p>

<p>

Expiry :

<b>

${formatDate(machine.expiry_date)}

</b>

</p>

<progress

max="100"

value="${progress}">

</progress>

<div class="machineBadges">

<span class="badge">

${expired ? "Expired" : machine.status}

</span>

${machine.is_vip ?

'<span class="badge membershipBadge">VIP</span>'

:

''}

</div>

<div class="machineActions">

<button

class="editBtn"

onclick="editMachine('${machine.id}')">

✏ Edit

</button>

<button

class="daysBtn"

onclick="manageDays('${machine.id}')">

📅 Days

</button>

<button

class="pauseBtn"

onclick="toggleMachine('${machine.id}')">

${machine.status==="paused"

?

"▶ Resume"

:

"⏸ Pause"}

</button>

<button

class="deleteBtn"

onclick="deleteMachine('${machine.id}')">

🗑 Delete

</button>

</div>

</div>

`;

machinesList.appendChild(card);

});

}

/*=========================================
FILTER MACHINES
=========================================*/

document

.querySelectorAll(".filterBtn")

.forEach(button=>{

button.addEventListener("click",()=>{

document

.querySelectorAll(".filterBtn")

.forEach(btn=>

btn.classList.remove("active")

);

button.classList.add("active");

const filter = button.dataset.filter;

if(filter === "all"){

renderMachineCards();

return;

}

if(filter === "vip"){

renderMachineCards(

userMachines.filter(

m=>m.is_vip

)

);

return;

}

if(filter === "completed"){

renderMachineCards(

userMachines.filter(

m=>m.completed

)

);

return;

}

renderMachineCards(

userMachines.filter(

m=>m.status === filter

)

);

});

});

/*=========================================
WINDOW FUNCTIONS
=========================================*/

window.editMachine = editMachine;
window.toggleMachine = toggleMachine;
window.deleteMachine = deleteMachine;
window.manageDays = manageDays;

/*=========================================
MANAGE MACHINE DAYS
=========================================*/

let selectedMachine = null;

async function manageDays(machineId){

selectedMachine = userMachines.find(
m => m.id === machineId
);

if(!selectedMachine) return;

const action = prompt(

"Choose Action:\n\n+10\n+30\n+60\n-10\n-30\n-60"

);

if(!action) return;

const days = parseInt(action);

if(isNaN(days)){

showToast("Invalid number.");

return;

}

await updateMachineDays(days);

}

/*=========================================
UPDATE MACHINE DAYS
=========================================*/

async function updateMachineDays(days){

const duration =

Math.max(

1,

(selectedMachine.duration_days || 0) + days

);

const remaining =

Math.max(

0,

(selectedMachine.remaining_days || 0) + days

);

const purchaseDate =

new Date(selectedMachine.purchase_date);

const expiryDate =

new Date(purchaseDate);

expiryDate.setDate(

expiryDate.getDate() + duration

);

const { error } = await db

.from("user_machines")

.update({

duration_days: duration,

remaining_days: remaining,

expiry_date: expiryDate.toISOString(),

updated_at: new Date().toISOString(),

admin_notes:
(selectedMachine.admin_notes || "") +

`\nDays changed by ${days}.`

})

.eq("id", selectedMachine.id);

if(error){

showToast(error.message);

return;

}

showToast("Machine updated.");

await loadUserMachines();

}

/*=========================================
QUICK DAY BUTTONS
=========================================*/

window.add10Days = () =>
updateMachineDays(10);

window.add30Days = () =>
updateMachineDays(30);

window.add60Days = () =>
updateMachineDays(60);

window.remove10Days = () =>
updateMachineDays(-10);

window.remove30Days = () =>
updateMachineDays(-30);

window.remove60Days = () =>
updateMachineDays(-60);

/*=========================================
OPEN DAYS EDITOR
=========================================*/

let selectedMachine = null;

function manageDays(machineId){

selectedMachine = userMachines.find(
m => m.id === machineId
);

if(!selectedMachine) return;

document.getElementById("machineDurationDays").value =
selectedMachine.duration_days || 0;

document.getElementById("machineRemainingDays").value =
selectedMachine.remaining_days || 0;

document.getElementById("machineCurrentDay").value =
selectedMachine.current_day || 0;

document.getElementById("machineExpiryDate").value =
selectedMachine.expiry_date
? selectedMachine.expiry_date.substring(0,10)
: "";

document.getElementById("machineModalTitle").textContent =
"Manage Machine Days";

document.getElementById("machineModal")
.classList.remove("hidden");

}

/*=========================================
UPDATE DAYS
=========================================*/

async function saveMachineDays(){

if(!selectedMachine) return;

const duration =
Number(
document.getElementById("machineDurationDays").value
);

const remaining =
Number(
document.getElementById("machineRemainingDays").value
);

const current =
Number(
document.getElementById("machineCurrentDay").value
);

const expiry =
document.getElementById("machineExpiryDate").value;

const { error } = await db

.from("user_machines")

.update({

duration_days:duration,

remaining_days:remaining,

current_day:current,

expiry_date:expiry,

updated_at:new Date().toISOString()

})

.eq("id",selectedMachine.id);

if(error){

showToast(error.message);

return;

}

showToast("Machine updated");

document.getElementById("machineModal")
.classList.add("hidden");

await loadUserMachines();

}

/*=========================================
QUICK BUTTONS
=========================================*/

function addDays(days){

const duration =
document.getElementById("machineDurationDays");

const remaining =
document.getElementById("machineRemainingDays");

duration.value =
Number(duration.value)+days;

remaining.value =
Number(remaining.value)+days;

}

function removeDays(days){

const duration =
document.getElementById("machineDurationDays");

const remaining =
document.getElementById("machineRemainingDays");

duration.value =
Math.max(1,
Number(duration.value)-days);

remaining.value =
Math.max(0,
Number(remaining.value)-days);

}

/*=========================================
WINDOW
=========================================*/

window.manageDays = manageDays;
window.addDays = addDays;
window.removeDays = removeDays;
window.saveMachineDays = saveMachineDays;

/*=========================================
QUICK DAYS BUTTONS
=========================================*/

document.getElementById("machineDurationDays")
.addEventListener("input",calculateExpiry);

document.getElementById("machinePurchaseDate")
.addEventListener("change",calculateExpiry);

function calculateExpiry(){

const purchase =
document.getElementById("machinePurchaseDate").value;

const duration =
Number(document.getElementById("machineDurationDays").value);

if(!purchase || duration<=0) return;

const date = new Date(purchase);

date.setDate(date.getDate()+duration);

document.getElementById("machineExpiryDate").value =
date.toISOString().split("T")[0];

}

/*=========================================
ADD DAYS
=========================================*/

function addDays(days){

const duration =
document.getElementById("machineDurationDays");

const remaining =
document.getElementById("machineRemainingDays");

duration.value =
Number(duration.value)+days;

remaining.value =
Number(remaining.value)+days;

calculateExpiry();

}

/*=========================================
REMOVE DAYS
=========================================*/

function removeDays(days){

const duration =
document.getElementById("machineDurationDays");

const remaining =
document.getElementById("machineRemainingDays");

duration.value =
Math.max(
1,
Number(duration.value)-days
);

remaining.value =
Math.max(
0,
Number(remaining.value)-days
);

calculateExpiry();

}

/*=========================================
QUICK BUTTON EVENTS
=========================================*/

document.getElementById("plus10Btn")?.addEventListener(
"click",
()=>addDays(10)
);

document.getElementById("plus30Btn")?.addEventListener(
"click",
()=>addDays(30)
);

document.getElementById("plus60Btn")?.addEventListener(
"click",
()=>addDays(60)
);

document.getElementById("minus10Btn")?.addEventListener(
"click",
()=>removeDays(10)
);

document.getElementById("minus30Btn")?.addEventListener(
"click",
()=>removeDays(30)
);

document.getElementById("minus60Btn")?.addEventListener(
"click",
()=>removeDays(60)
);

/*=========================================
READY FOR SAVE
=========================================*/

window.addDays = addDays;
window.removeDays = removeDays;

/*=========================================
SAVE MACHINE
=========================================*/

document
.getElementById("saveMachineBtn")
.addEventListener("click", saveMachine);

async function saveMachine(){

if(!selectedUser){

showToast("Select a user first.");

return;

}

const machineId =
document.getElementById("machineSelect").value;

const plan =
machinePlans.find(
m=>m.id===machineId
);

const duration =
Number(
document.getElementById("machineDurationDays").value
);

const remaining =
Number(
document.getElementById("machineRemainingDays").value
);

const purchase =
document.getElementById("machinePurchaseDate").value;

const expiry =
document.getElementById("machineExpiryDate").value;

const status =
document.getElementById("machineStatus").value;

const vip =
document.getElementById("machineVip").value==="true";

const payload={

machine_id:machineId,

user_id:selectedUser.id,

machine_name:
plan ? plan.name : "",

machine_image:
plan ? plan.image_url : "",

machine_series:
plan ? plan.series : "",

amount_paid:Number(
document.getElementById("machineAmountPaid").value
),

purchase_date:purchase,

expiry_date:expiry,

duration_days:duration,

remaining_days:remaining,

current_day:Number(
document.getElementById("machineCurrentDay").value
),

daily_income:Number(
document.getElementById("machineDailyIncome").value
),

total_return:Number(
document.getElementById("machineTotalReturn").value
),

earned_amount:Number(
document.getElementById("machineEarnedAmount").value
),

status:status,

is_vip:vip,

completed:
status==="completed",

admin_notes:
document.getElementById("machineNotes").value,

updated_at:
new Date().toISOString()

};

let error;

if(editingMachine){

({error}=await db

.from("user_machines")

.update(payload)

.eq("id",editingMachine.id));

}else{

({error}=await db

.from("user_machines")

.insert(payload));

}

if(error){

showToast(error.message);

return;

}

document
.getElementById("machineModal")
.classList.add("hidden");

editingMachine=null;

await loadUserMachines();

showToast("Machine saved successfully.");

}

/*=========================================
DELETE MACHINE
=========================================*/

async function deleteMachine(machineId){

if(!confirm(
"Delete this machine permanently?"
)) return;

const {error}=await db

.from("user_machines")

.delete()

.eq("id",machineId);

if(error){

showToast(error.message);

return;

}

await loadUserMachines();

showToast("Machine deleted.");

}

/*=========================================
PAUSE / RESUME
=========================================*/

async function toggleMachine(machineId){

const machine =
userMachines.find(
m=>m.id===machineId
);

if(!machine) return;

const nextStatus =

machine.status==="paused"

? "active"

: "paused";

const {error}=await db

.from("user_machines")

.update({

status:nextStatus,

paused:
nextStatus==="paused",

updated_at:
new Date().toISOString()

})

.eq("id",machineId);

if(error){

showToast(error.message);

return;

}

await loadUserMachines();

showToast(

nextStatus==="paused"

?

"Machine paused."

:

"Machine resumed."

);

}

/*=========================================
CLOSE MACHINE MODAL
=========================================*/

document
.getElementById("closeMachineModal")
.addEventListener("click",()=>{

editingMachine=null;

document
.getElementById("machineModal")
.classList.add("hidden");

});

/*=========================================
READY
=========================================*/

console.log("================================");
console.log("ADMIN USER MACHINES V2 LOADED");
console.log("Professional Rebuild Complete");
console.log("Supabase Connected");
console.log("================================");
