/*====================================
SUPABASE
====================================*/

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

/*====================================
GLOBAL VARIABLES
====================================*/

let users = [];
let selectedUser = null;
let userMachines = [];
let machinePlans = [];

/*====================================
ELEMENTS
====================================*/

const usersList = document.getElementById("usersList");

const searchInput = document.getElementById("searchInput");

const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const totalMachines = document.getElementById("totalMachines");
const vipMachines = document.getElementById("vipMachines");

const profileSection =
document.getElementById("userProfileSection");

const machinesSection =
document.getElementById("machinesSection");

/*====================================
INITIALIZE
====================================*/

document.addEventListener("DOMContentLoaded", async () => {

showLoading();

await loadDashboard();

hideLoading();

});

/*====================================
LOAD DASHBOARD
====================================*/

async function loadDashboard(){

await Promise.all([

loadUsers(),

loadMachinePlans()

]);

}

/*====================================
LOAD USERS
====================================*/

async function loadUsers(){

const { data, error } = await supabase

.from("profiles")

.select("*")

.order("created_at", { ascending:false });

if(error){

console.error(error);

showToast(error.message,true);

return;

}

users = data || [];

renderUsers();

updateDashboardStats();

}

/*====================================
UPDATE STATS
====================================*/

function updateDashboardStats(){

totalUsers.textContent = users.length;

activeUsers.textContent = users.filter(

u => !u.is_frozen

).length;

vipMachines.textContent = users.filter(

u => u.membership === "VIP"

).length;

}

/*====================================
LOAD MACHINE PLANS
====================================*/

async function loadMachinePlans(){

const { data } = await supabase

.from("machines")

.select("*")

.eq("status",true)

.order("display_order");

machinePlans = data || [];

}

/*====================================
RENDER USERS
====================================*/

function renderUsers(list = users){

usersList.innerHTML = "";

if(list.length === 0){

usersList.innerHTML = `
<div class="emptyCard">
<h3>No users found</h3>
</div>
`;

return;

}

list.forEach(user=>{

const card=document.createElement("div");

card.className="userCard";

card.innerHTML=`

<div class="userLeft">

<img
class="userAvatar"
src="${user.avatar_url || 'images/default-avatar.png'}">

<div class="userInfo">

<h3>${user.fullname}</h3>

<p>${user.phone || "No phone"}</p>

<p>${user.email || "No email"}</p>

</div>

</div>

<div class="userRight">

<span class="badge">

${user.membership}

</span>

</div>

`;

card.addEventListener("click",()=>{

selectUser(user);

});

usersList.appendChild(card);

});

}

/*====================================
SEARCH USERS
====================================*/

searchInput.addEventListener("input",()=>{

const keyword=searchInput.value.trim().toLowerCase();

const filtered=users.filter(user=>{

return(

(user.fullname || "").toLowerCase().includes(keyword) ||

(user.phone || "").toLowerCase().includes(keyword) ||

(user.email || "").toLowerCase().includes(keyword)

);

});

renderUsers(filtered);

});

/*====================================
SELECT USER
====================================*/

async function selectUser(user){

selectedUser=user;

profileSection.classList.remove("hidden");

machinesSection.classList.remove("hidden");

loadUserProfile();

await loadUserMachines();

}

/*====================================
LOAD USER PROFILE
====================================*/

function loadUserProfile(){

document.getElementById("profileAvatar").src =
selectedUser.avatar_url || "images/default-avatar.png";

document.getElementById("profileName").textContent =
selectedUser.fullname;

document.getElementById("profilePhone").textContent =
selectedUser.phone || "No phone";

document.getElementById("profileEmail").textContent =
selectedUser.email || "No email";

document.getElementById("membershipBadge").textContent =
selectedUser.membership;

document.getElementById("statusBadge").textContent =
selectedUser.account_status;

document.getElementById("kycBadge").textContent =
selectedUser.kyc_status;

document.getElementById("profileInvested").textContent =
"UGX " + Number(selectedUser.total_invested || 0).toLocaleString();

document.getElementById("profileProfit").textContent =
"UGX " + Number(selectedUser.total_profit || 0).toLocaleString();

document.getElementById("profileReferralBonus").textContent =
"UGX " + Number(selectedUser.total_referral_bonus || 0).toLocaleString();

}

/*====================================
LOAD USER MACHINES
====================================*/

async function loadUserMachines(){

const {data,error}=await supabase

.from("user_machines")

.select("*")

.eq("user_id",selectedUser.id)

.order("purchase_date",{ascending:false});

if(error){

showToast(error.message,true);

return;

}

userMachines=data || [];

document.getElementById("profileMachineCount").textContent =
userMachines.length;

renderMachines();

  }

/*====================================
RENDER MACHINES
====================================*/

function renderMachines(){

const container = document.getElementById("machinesList");

container.innerHTML = "";

if(userMachines.length===0){

container.innerHTML=`

<div class="emptyCard">

<h3>No purchased machines</h3>

<p>This user has not purchased any machines yet.</p>

</div>

`;

updateMachineStats();

return;

}

userMachines.forEach(machine=>{

const card=document.createElement("div");

card.className="machineCard";

card.innerHTML=`

<img
class="machineImage"
src="${machine.machine_image || 'images/default-machine.png'}">

<div class="machineContent">

<h3>${machine.machine_name}</h3>

<p>

Purchase:

<b>${formatDate(machine.purchase_date)}</b>

</p>

<p>

Expiry:

<b>${formatDate(machine.expiry_date)}</b>

</p>

<p>

Paid:

<b>UGX ${Number(machine.amount_paid||0).toLocaleString()}</b>

</p>

<p>

Earned:

<b>UGX ${Number(machine.earned_amount||0).toLocaleString()}</b>

</p>

<div class="machineBadges">

<span class="badge">

${machine.status}

</span>

${machine.is_vip ?

'<span class="badge membershipBadge">VIP</span>'

:

''

}

</div>

<div class="machineActions">

<button
class="editBtn"
onclick="editMachine('${machine.id}')">

✏ Edit

</button>

<button
class="daysBtn"
onclick="changeDays('${machine.id}')">

📅 Days

</button>

<button
class="pauseBtn"
onclick="toggleMachine('${machine.id}')">

${machine.status==="paused" ? "▶ Resume" : "⏸ Pause"}

</button>

<button
class="deleteBtn"
onclick="deleteMachine('${machine.id}')">

🗑 Delete

</button>

</div>

</div>

`;

container.appendChild(card);

});

updateMachineStats();

}

/*====================================
UPDATE MACHINE STATS
====================================*/

function updateMachineStats(){

document.getElementById("activeMachineCount").textContent=

userMachines.filter(

m=>m.status==="active"

).length;

document.getElementById("completedMachineCount").textContent=

userMachines.filter(

m=>m.completed===true

).length;

document.getElementById("expiredMachineCount").textContent=

userMachines.filter(

m=>new Date(m.expiry_date)<new Date()

).length;

document.getElementById("pausedMachineCount").textContent=

userMachines.filter(

m=>m.status==="paused"

).length;

totalMachines.textContent=userMachines.length;

}

/*====================================
FORMAT DATE
====================================*/

function formatDate(date){

if(!date) return "--";

return new Date(date).toLocaleDateString();

  }

/*====================================
EDIT MACHINE
====================================*/

let editingMachine = null;

function editMachine(machineId){

editingMachine = userMachines.find(
m => m.id === machineId
);

if(!editingMachine) return;

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

document.getElementById("machineDurationDays").value =
editingMachine.duration_days || 0;

document.getElementById("machineRemainingDays").value =
editingMachine.remaining_days || 0;

document.getElementById("machineDailyIncome").value =
editingMachine.daily_income || 0;

document.getElementById("machineTotalReturn").value =
editingMachine.total_return || 0;

document.getElementById("machineEarnedAmount").value =
editingMachine.earned_amount || 0;

document.getElementById("machineCurrentDay").value =
editingMachine.current_day || 0;

document.getElementById("machineStatus").value =
editingMachine.status || "active";

document.getElementById("machineVip").value =
editingMachine.is_vip ? "true" : "false";

document.getElementById("machineNotes").value =
editingMachine.notes || "";

document.getElementById("machineModal")
.classList.remove("hidden");

}

/*====================================
CHANGE DAYS
====================================*/

function changeDays(machineId){

editMachine(machineId);

document.getElementById("machineDurationDays").focus();

}

/*====================================
SAVE MACHINE
====================================*/

document.getElementById("saveMachineBtn")
.addEventListener("click", saveMachine);

async function saveMachine(){

if(!editingMachine) return;

const updates = {

amount_paid:Number(
document.getElementById("machineAmountPaid").value
),

purchase_date:
document.getElementById("machinePurchaseDate").value,

expiry_date:
document.getElementById("machineExpiryDate").value,

duration_days:Number(
document.getElementById("machineDurationDays").value
),

remaining_days:Number(
document.getElementById("machineRemainingDays").value
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

current_day:Number(
document.getElementById("machineCurrentDay").value
),

status:
document.getElementById("machineStatus").value,

is_vip:
document.getElementById("machineVip").value === "true",

notes:
document.getElementById("machineNotes").value,

updated_at:new Date()

};

const { error } = await supabase

.from("user_machines")

.update(updates)

.eq("id", editingMachine.id);

if(error){

showToast(error.message,true);

return;

}

showToast("Machine updated successfully");

document.getElementById("machineModal")
.classList.add("hidden");

editingMachine = null;

await loadUserMachines();

  }

/*====================================
DELETE MACHINE
====================================*/

async function deleteMachine(machineId){

const machine = userMachines.find(
m => m.id === machineId
);

if(!machine) return;

if(!confirm(
`Delete "${machine.machine_name}"?`
)) return;

const { error } = await supabase

.from("user_machines")

.delete()

.eq("id", machineId);

if(error){

showToast(error.message,true);

return;

}

showToast("Machine deleted");

await loadUserMachines();

}

/*====================================
PAUSE / RESUME MACHINE
====================================*/

async function toggleMachine(machineId){

const machine = userMachines.find(
m => m.id === machineId
);

if(!machine) return;

const newStatus =

machine.status === "paused"

? "active"

: "paused";

const { error } = await supabase

.from("user_machines")

.update({

status:newStatus,

paused:newStatus==="paused",

paused_at:newStatus==="paused"

? new Date()

: null,

updated_at:new Date()

})

.eq("id",machineId);

if(error){

showToast(error.message,true);

return;

}

showToast(

newStatus==="paused"

? "Machine paused"

: "Machine resumed"

);

await loadUserMachines();

}

/*====================================
ASSIGN MACHINE
====================================*/

document

.getElementById("assignMachineBtn")

.addEventListener("click",()=>{

editingMachine=null;

document.getElementById(

"machineModalTitle"

).textContent="Assign Machine";

document.getElementById(

"machineModal"

).classList.remove("hidden");

clearMachineForm();

});

/*====================================
CLEAR FORM
====================================*/

function clearMachineForm(){

document.getElementById("machineSelect").value="";

document.getElementById("machineAmountPaid").value="";

document.getElementById("machinePurchaseDate").value="";

document.getElementById("machineExpiryDate").value="";

document.getElementById("machineDurationDays").value="";

document.getElementById("machineRemainingDays").value="";

document.getElementById("machineDailyIncome").value="";

document.getElementById("machineTotalReturn").value="";

document.getElementById("machineEarnedAmount").value="0";

document.getElementById("machineCurrentDay").value="0";

document.getElementById("machineStatus").value="active";

document.getElementById("machineVip").value="false";

document.getElementById("machineNotes").value="";

}

/*====================================
AUTO FILL MACHINE PLAN
====================================*/

document

.getElementById("machineSelect")

.addEventListener("change",function(){

const plan=machinePlans.find(

m=>m.id===this.value

);

if(!plan) return;

document.getElementById(

"machineAmountPaid"

).value=plan.price;

document.getElementById(

"machineDurationDays"

).value=plan.duration_days;

document.getElementById(

"machineRemainingDays"

).value=plan.duration_days;

document.getElementById(

"machineDailyIncome"

).value=plan.daily_income;

document.getElementById(

"machineTotalReturn"

).value=plan.total_return;

document.getElementById(

"machineVip"

).value=String(plan.is_vip);

const today=new Date()

.toISOString()

.substring(0,10);

document.getElementById(

"machinePurchaseDate"

).value=today;

const expiry=new Date();

expiry.setDate(

expiry.getDate()+plan.duration_days

);

document.getElementById(

"machineExpiryDate"

).value=

expiry.toISOString().substring(0,10);

});

/*====================================
CREATE USER MACHINE
====================================*/

async function createMachine(){

const planId=document.getElementById("machineSelect").value;

if(!planId){

showToast("Select a machine plan",true);

return;

}

const plan=machinePlans.find(

m=>m.id===planId

);

if(!plan){

showToast("Invalid machine plan",true);

return;

}

const data={

user_id:selectedUser.id,

machine_id:plan.id,

machine_name:plan.name,

machine_image:plan.image_url,

amount_paid:Number(

document.getElementById("machineAmountPaid").value

),

purchase_date:

document.getElementById("machinePurchaseDate").value,

expiry_date:

document.getElementById("machineExpiryDate").value,

duration_days:Number(

document.getElementById("machineDurationDays").value

),

remaining_days:Number(

document.getElementById("machineRemainingDays").value

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

current_day:Number(

document.getElementById("machineCurrentDay").value

),

status:

document.getElementById("machineStatus").value,

is_vip:

document.getElementById("machineVip").value==="true",

notes:

document.getElementById("machineNotes").value

};

const {error}=await supabase

.from("user_machines")

.insert(data);

if(error){

showToast(error.message,true);

return;

}

showToast("Machine assigned successfully");

document

.getElementById("machineModal")

.classList.add("hidden");

await loadUserMachines();

}

/*====================================
SAVE BUTTON
====================================*/

document

.getElementById("saveMachineBtn")

.addEventListener("click",()=>{

if(editingMachine){

saveMachine();

}else{

createMachine();

}

});

/*====================================
EDIT USER
====================================*/

document

.getElementById("editUserBtn")

.addEventListener("click",()=>{

document.getElementById("editFullname").value=

selectedUser.fullname || "";

document.getElementById("editPhone").value=

selectedUser.phone || "";

document.getElementById("editEmail").value=

selectedUser.email || "";

document.getElementById("editCountry").value=

selectedUser.country || "";

document.getElementById("editMembership").value=

selectedUser.membership || "Standard";

document.getElementById("editKycStatus").value=

selectedUser.kyc_status || "Not Verified";

document.getElementById("editAccountStatus").value=

selectedUser.account_status || "active";

document.getElementById("editLevel").value=

selectedUser.level || 1;

document.getElementById("editReferralCode").value=

selectedUser.referral_code || "";

document

.getElementById("editUserModal")

.classList.remove("hidden");

});

/*====================================
SAVE USER
====================================*/

document

.getElementById("saveUserBtn")

.addEventListener("click",saveUser);

async function saveUser(){

const updates={

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

document.getElementById("editReferralCode").value,

updated_at:new Date()

};

const {error}=await supabase

.from("profiles")

.update(updates)

.eq("id",selectedUser.id);

if(error){

showToast(error.message,true);

return;

}

showToast("User updated");

document

.getElementById("editUserModal")

.classList.add("hidden");

await loadUsers();

loadUserProfile();

  }

/*====================================
FREEZE / UNFREEZE USER
====================================*/

document

.getElementById("freezeAccountBtn")

.addEventListener("click",freezeUser);

async function freezeUser(){

const frozen=!selectedUser.is_frozen;

const reason=frozen

? prompt("Reason for freezing this account?") || ""

: null;

const {error}=await supabase

.from("profiles")

.update({

is_frozen:frozen,

suspension_reason:reason,

updated_at:new Date()

})

.eq("id",selectedUser.id);

if(error){

showToast(error.message,true);

return;

}

selectedUser.is_frozen=frozen;

selectedUser.suspension_reason=reason;

showToast(

frozen

? "Account frozen"

: "Account activated"

);

await loadUsers();

loadUserProfile();

}

/*====================================
RESET PASSWORD
====================================*/

document

.getElementById("resetPasswordBtn")

.addEventListener("click",()=>{

document

.getElementById("resetPasswordModal")

.classList.remove("hidden");

});

document

.getElementById("confirmResetPasswordBtn")

.addEventListener("click",()=>{

alert(

"Supabase Auth passwords cannot be changed from the client.\n\nCreate a secure Admin API to reset user passwords."

);

});

/*====================================
MODAL CLOSE BUTTONS
====================================*/

document

.getElementById("closeMachineModal")

.onclick=()=>{

document

.getElementById("machineModal")

.classList.add("hidden");

};

document

.getElementById("closeEditUserModal")

.onclick=()=>{

document

.getElementById("editUserModal")

.classList.add("hidden");

};

document

.getElementById("closeResetPasswordModal")

.onclick=()=>{

document

.getElementById("resetPasswordModal")

.classList.add("hidden");

};

/*====================================
LOADING
====================================*/

function showLoading(){

document

.getElementById("loadingScreen")

.classList.remove("hidden");

}

function hideLoading(){

document

.getElementById("loadingScreen")

.classList.add("hidden");

}

/*====================================
TOAST
====================================*/

function showToast(message,error=false){

const toast=document.getElementById("toast");

document.getElementById("toastText").textContent=message;

toast.style.background=

error ? "#ff4d4f" : "#00d26a";

toast.classList.add("show");

setTimeout(()=>{

toast.classList.remove("show");

},3000);

}

/*====================================
LOGOUT
====================================*/

document

.getElementById("logoutBtn")

.addEventListener("click",async()=>{

if(!confirm("Logout?")) return;

await supabase.auth.signOut();

location.href="admin-login.html";

});

/*====================================
REFRESH
====================================*/

document

.getElementById("refreshBtn")

.addEventListener("click",loadDashboard);

document

.getElementById("refreshMachinesBtn")

.addEventListener("click",loadUserMachines);
