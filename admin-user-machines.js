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

/*=========================================
RENDER MACHINES
=========================================*/

function renderMachines(){

const machinesList =
document.getElementById("machinesList");

machinesList.innerHTML = "";

if(userMachines.length === 0){

machinesList.innerHTML = `
<div class="emptyCard">
<h3>No Purchased Machines</h3>
<p>This user has no machines.</p>
</div>
`;

return;

}

userMachines.forEach(machine=>{

const card = document.createElement("div");

card.className = "machineCard";

card.innerHTML = `

<img
class="machineImage"
src="${machine.machine_image || 'images/default-machine.png'}">

<div class="machineInfo">

<h3>${machine.machine_name}</h3>

<p>

Amount Paid

<b>

UGX ${Number(machine.amount_paid||0).toLocaleString()}

</b>

</p>

<p>

Earned

<b>

UGX ${Number(machine.earned_amount||0).toLocaleString()}

</b>

</p>

<p>

Purchase

<b>

${formatDate(machine.purchase_date)}

</b>

</p>

<p>

Expiry

<b>

${formatDate(machine.expiry_date)}

</b>

</p>

<div class="machineBadges">

<span class="badge">

${machine.status}

</span>

${machine.is_vip ?

'<span class="badge membershipBadge">VIP</span>'

:

''}

</div>

<div class="machineButtons">

<button
class="primaryBtn"
onclick="editMachine('${machine.id}')">

✏ Edit

</button>

<button
class="secondaryBtn"
onclick="toggleMachine('${machine.id}')">

${machine.status==="paused"

? "▶ Resume"

: "⏸ Pause"}

</button>

<button
class="dangerBtn"
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
FORMAT DATE
=========================================*/

function formatDate(date){

if(!date) return "--";

return new Date(date)

.toLocaleDateString();

}

/*=========================================
REFRESH MACHINES
=========================================*/

document

.getElementById("refreshMachinesBtn")

.addEventListener("click",()=>{

loadUserMachines();

});

/*=========================================
EDIT MACHINE
=========================================*/

let editingMachine = null;

function editMachine(machineId){

editingMachine = userMachines.find(
m => m.id === machineId
);

if(!editingMachine) return;

document.getElementById("machineModal").classList.remove("hidden");

document.getElementById("machineModalTitle").textContent =
"Edit Machine";

document.getElementById("machineSelect").value =
editingMachine.machine_id || "";

document.getElementById("machineAmountPaid").value =
editingMachine.amount_paid || 0;

document.getElementById("machinePurchaseDate").value =
editingMachine.purchase_date ?
editingMachine.purchase_date.substring(0,10) : "";

document.getElementById("machineExpiryDate").value =
editingMachine.expiry_date ?
editingMachine.expiry_date.substring(0,10) : "";

document.getElementById("machineStatus").value =
editingMachine.status || "active";

document.getElementById("machineVip").value =
editingMachine.is_vip ? "true" : "false";

}

/*=========================================
ASSIGN MACHINE
=========================================*/

document.getElementById("assignMachineBtn")
.addEventListener("click",()=>{

editingMachine = null;

document.getElementById("machineModalTitle").textContent =
"Assign Machine";

document.getElementById("machineModal").classList.remove("hidden");

document.getElementById("machineSelect").value = "";
document.getElementById("machineAmountPaid").value = "";
document.getElementById("machinePurchaseDate").value = "";
document.getElementById("machineExpiryDate").value = "";
document.getElementById("machineStatus").value = "active";
document.getElementById("machineVip").value = "false";

});

/*=========================================
SAVE MACHINE
=========================================*/

document.getElementById("saveMachineBtn")
.addEventListener("click",saveMachine);

async function saveMachine(){

const data = {

machine_id:
document.getElementById("machineSelect").value,

amount_paid:Number(
document.getElementById("machineAmountPaid").value
),

purchase_date:
document.getElementById("machinePurchaseDate").value,

expiry_date:
document.getElementById("machineExpiryDate").value,

status:
document.getElementById("machineStatus").value,

is_vip:
document.getElementById("machineVip").value==="true"

};

let error;

if(editingMachine){

({error} = await db

.from("user_machines")

.update(data)

.eq("id",editingMachine.id));

}else{

data.user_id = selectedUser.id;

const plan = machinePlans.find(

m=>m.id===data.machine_id

);

if(plan){

data.machine_name = plan.name;
data.machine_image = plan.image_url;

}

({error} = await db

.from("user_machines")

.insert(data));

}

if(error){

alert(error.message);

return;

}

document.getElementById("machineModal")
.classList.add("hidden");

await loadUserMachines();

}

/*=========================================
DELETE MACHINE
=========================================*/

async function deleteMachine(machineId){

if(!confirm("Delete this machine?")) return;

const {error} = await db

.from("user_machines")

.delete()

.eq("id",machineId);

if(error){

alert(error.message);

return;

}

await loadUserMachines();

}

/*=========================================
PAUSE / RESUME
=========================================*/

async function toggleMachine(machineId){

const machine = userMachines.find(

m=>m.id===machineId

);

if(!machine) return;

const newStatus =

machine.status==="paused"

? "active"

: "paused";

const {error} = await db

.from("user_machines")

.update({

status:newStatus

})

.eq("id",machineId);

if(error){

alert(error.message);

return;

}

await loadUserMachines();

  }

/*=========================================
EDIT USER
=========================================*/

document.getElementById("editUserBtn")
.addEventListener("click", openEditUser);

function openEditUser(){

if(!selectedUser) return;

document.getElementById("editUserModal")
.classList.remove("hidden");

document.getElementById("editFullname").value =
selectedUser.fullname || "";

document.getElementById("editPhone").value =
selectedUser.phone || "";

document.getElementById("editEmail").value =
selectedUser.email || "";

document.getElementById("editCountry").value =
selectedUser.country || "";

document.getElementById("editMembership").value =
selectedUser.membership || "Standard";

document.getElementById("editKycStatus").value =
selectedUser.kyc_status || "Not Verified";

document.getElementById("editAccountStatus").value =
selectedUser.account_status || "active";

document.getElementById("editLevel").value =
selectedUser.level || 1;

document.getElementById("editReferralCode").value =
selectedUser.referral_code || "";

}

/*=========================================
SAVE USER
=========================================*/

document.getElementById("saveUserBtn")
.addEventListener("click", saveUser);

async function saveUser(){

const updates = {

fullname:
document.getElementById("editFullname").value,

phone:
document.getElementById("editPhone").value,

email:
document.getElementById("editEmail").value,

country:
document.getElementById("editCountry").value,

membership:
document.getElementById("editMembership").value,

kyc_status:
document.getElementById("editKycStatus").value,

account_status:
document.getElementById("editAccountStatus").value,

level:Number(
document.getElementById("editLevel").value
),

referral_code:
document.getElementById("editReferralCode").value

};

const { error } = await db

.from("profiles")

.update(updates)

.eq("id", selectedUser.id);

if(error){

alert(error.message);

return;

}

document.getElementById("editUserModal")
.classList.add("hidden");

await loadUsers();

selectedUser = users.find(
u => u.id === selectedUser.id
);

loadUserProfile();

}

/*=========================================
FREEZE / UNFREEZE USER
=========================================*/

document.getElementById("freezeAccountBtn")
.addEventListener("click", freezeUser);

async function freezeUser(){

const frozen = !selectedUser.is_frozen;

const { error } = await db

.from("profiles")

.update({

is_frozen: frozen

})

.eq("id", selectedUser.id);

if(error){

alert(error.message);

return;

}

selectedUser.is_frozen = frozen;

await loadUsers();

loadUserProfile();

alert(

frozen

? "Account Frozen"

: "Account Activated"

);

}

/*=========================================
LOGOUT
=========================================*/

document.getElementById("logoutBtn")
.addEventListener("click", async()=>{

if(!confirm("Logout?")) return;

await db.auth.signOut();

window.location.href = "admin-login.html";

});

/*=========================================
RESET PASSWORD
=========================================*/

document.getElementById("resetPasswordBtn")
.addEventListener("click",()=>{

document.getElementById("resetPasswordModal")
.classList.remove("hidden");

});

document.getElementById("confirmResetPasswordBtn")
.addEventListener("click",()=>{

const password =
document.getElementById("newPassword").value.trim();

const confirm =
document.getElementById("confirmPassword").value.trim();

if(password.length < 6){

alert("Password must be at least 6 characters.");

return;

}

if(password !== confirm){

alert("Passwords do not match.");

return;

}

alert(
"Supabase Auth passwords cannot be changed from JavaScript.\n\nUse a secure Admin API or Supabase Edge Function."
);

});

/*=========================================
CLOSE MODALS
=========================================*/

document.getElementById("closeMachineModal")
.onclick=()=>{

document.getElementById("machineModal")
.classList.add("hidden");

};

document.getElementById("closeEditUserModal")
.onclick=()=>{

document.getElementById("editUserModal")
.classList.add("hidden");

};

document.getElementById("closeResetPasswordModal")
.onclick=()=>{

document.getElementById("resetPasswordModal")
.classList.add("hidden");

};

/*=========================================
REFRESH BUTTONS
=========================================*/

document.getElementById("refreshBtn")
.addEventListener("click",async()=>{

showLoading();

await loadUsers();

hideLoading();

});

document.getElementById("refreshMachinesBtn")
.addEventListener("click",async()=>{

if(selectedUser){

showLoading();

await loadUserMachines();

hideLoading();

}

});

/*=========================================
TOAST
=========================================*/

function showToast(message){

const toast =
document.getElementById("toast");

const text =
document.getElementById("toastText");

text.textContent = message;

toast.classList.add("show");

setTimeout(()=>{

toast.classList.remove("show");

},3000);

}

/*=========================================
WINDOW FUNCTIONS
=========================================*/

window.editMachine = editMachine;
window.deleteMachine = deleteMachine;
window.toggleMachine = toggleMachine;

/*=========================================
READY
=========================================*/

console.log("================================");
console.log("ADMIN USER MACHINES LOADED");
console.log("Version 1.0");
console.log("Supabase Connected");
console.log("================================");
