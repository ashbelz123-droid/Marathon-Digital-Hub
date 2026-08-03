/*=====================================
SUPABASE
=====================================*/

const supabase = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
);

/*=====================================
ELEMENTS
=====================================*/

const usersContainer = document.getElementById("usersContainer");
const searchInput = document.getElementById("searchInput");

const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const totalMachines = document.getElementById("totalMachines");
const vipUsers = document.getElementById("vipUsers");

let selectedUser = null;
let users = [];
let machines = [];

/*=====================================
INITIALIZE
=====================================*/

document.addEventListener("DOMContentLoaded", () => {

loadDashboard();

});

/*=====================================
LOAD DASHBOARD
=====================================*/

async function loadDashboard(){

await loadUsers();

await loadStatistics();

}

/*=====================================
LOAD USERS
=====================================*/

async function loadUsers(){

const { data, error } = await supabase

.from("profiles")

.select("*")

.order("created_at",{ascending:false});

if(error){

console.error(error);

return;

}

users = data || [];

renderUsers(users);

}

/*=====================================
RENDER USERS
=====================================*/

function renderUsers(list){

usersContainer.innerHTML = "";

if(list.length===0){

usersContainer.innerHTML=`

<div class="emptyState">

<h2>No Users Found</h2>

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

<p>${user.phone || "No Phone"}</p>

<p>${user.email || "No Email"}</p>

</div>

</div>

<div class="userRight">

<span class="badge membership">

${user.membership}

</span>

</div>

`;

card.onclick=()=>selectUser(user);

usersContainer.appendChild(card);

});

}

/*=====================================
STATISTICS
=====================================*/

async function loadStatistics(){

const {count:userCount}=await supabase

.from("profiles")

.select("*",{count:"exact",head:true});

const {count:machineCount}=await supabase

.from("user_machines")

.select("*",{count:"exact",head:true});

const active=users.filter(u=>!u.is_frozen).length;

const vip=users.filter(u=>u.membership==="VIP").length;

totalUsers.textContent=userCount || 0;

activeUsers.textContent=active;

totalMachines.textContent=machineCount || 0;

vipUsers.textContent=vip;

}

/*=====================================
SELECT USER
=====================================*/

async function selectUser(user){

selectedUser = user;

document
.querySelectorAll(".userCard")
.forEach(card=>card.classList.remove("active"));

event.currentTarget.classList.add("active");

document
.getElementById("emptyState")
.classList.add("hidden");

document
.getElementById("userDashboard")
.classList.remove("hidden");

loadUserProfile();

await loadUserMachines();

await loadMachineSummary();

await loadMachineHistory();

}

/*=====================================
LOAD PROFILE
=====================================*/

function loadUserProfile(){

document.getElementById("userAvatar").src =
selectedUser.avatar_url || "images/default-avatar.png";

document.getElementById("userName").textContent =
selectedUser.fullname;

document.getElementById("userPhone").textContent =
selectedUser.phone || "No Phone";

document.getElementById("userEmail").textContent =
selectedUser.email || "No Email";

document.getElementById("membershipBadge").textContent =
selectedUser.membership;

document.getElementById("kycBadge").textContent =
selectedUser.kyc_status;

const statusBadge =
document.getElementById("statusBadge");

if(selectedUser.is_frozen){

statusBadge.textContent = "Frozen";

statusBadge.className = "badge frozen";

}else{

statusBadge.textContent =
selectedUser.account_status;

statusBadge.className = "badge active";

}

}

/*=====================================
LOAD USER MACHINES
=====================================*/

async function loadUserMachines(){

const { data, error } = await supabase

.from("user_machines")

.select("*")

.eq("user_id", selectedUser.id)

.order("purchase_date",{
ascending:false
});

if(error){

console.error(error);

return;

}

machines = data || [];

renderMachines();

}

/*=====================================
RENDER USER MACHINES
=====================================*/

function renderMachines(){

const machineList =
document.getElementById("machineList");

const machineEmpty =
document.getElementById("machineEmpty");

machineList.innerHTML = "";

if(machines.length === 0){

machineEmpty.classList.remove("hidden");

return;

}

machineEmpty.classList.add("hidden");

machines.forEach(machine=>{

const status = machine.status || "active";

const badgeColor =
status === "active"
? "active"
: status === "completed"
? "membership"
: "frozen";

const card = document.createElement("div");

card.className = "machineCard";

card.innerHTML = `

<img
class="machineImage"
src="${machine.machine_image || 'images/default-machine.png'}">

<div class="machineContent">

<h3>${machine.machine_name}</h3>

<p>

Purchased:

<b>UGX ${Number(machine.amount_paid || 0).toLocaleString()}</b>

</p>

<p>

Earned:

<b>UGX ${Number(machine.earned_amount || 0).toLocaleString()}</b>

</p>

<p>

Expiry:

<b>${machine.expiry_date || "--"}</b>

</p>

<div class="machineBadges">

<span class="badge ${badgeColor}">

${status.toUpperCase()}

</span>

${machine.is_vip ? `

<span class="badge membership">

VIP

</span>

` : ""}

</div>

<div class="actionGrid">

<button
class="secondaryButton viewMachine"

data-id="${machine.id}">

👁 View

</button>

<button
class="primaryButton editMachine"

data-id="${machine.id}">

✏ Edit

</button>

<button
class="primaryButton changeDays"

data-id="${machine.id}">

📅 Days

</button>

<button
class="dangerButton deleteMachine"

data-id="${machine.id}">

🗑 Delete

</button>

</div>

</div>

`;

machineList.appendChild(card);

});

attachMachineEvents();

                        }

/*=====================================
ATTACH MACHINE EVENTS
=====================================*/

function attachMachineEvents(){

document.querySelectorAll(".viewMachine").forEach(btn=>{

btn.onclick=()=>{

const id=btn.dataset.id;

const machine=machines.find(m=>m.id===id);

if(machine){

openMachineView(machine);

}

};

});

document.querySelectorAll(".editMachine").forEach(btn=>{

btn.onclick=()=>{

const id=btn.dataset.id;

const machine=machines.find(m=>m.id===id);

if(machine){

openMachineEditor(machine);

}

};

});

document.querySelectorAll(".changeDays").forEach(btn=>{

btn.onclick=()=>{

const id=btn.dataset.id;

const machine=machines.find(m=>m.id===id);

if(machine){

openMachineEditor(machine);

document.getElementById("machineDuration").focus();

}

};

});

document.querySelectorAll(".deleteMachine").forEach(btn=>{

btn.onclick=()=>{

const id=btn.dataset.id;

deleteMachine(id);

};

});

}

/*=====================================
VIEW MACHINE
=====================================*/

function openMachineView(machine){

document.getElementById("viewMachineModal").classList.remove("hidden");

document.getElementById("viewMachineImage").src=
machine.machine_image || "images/default-machine.png";

document.getElementById("viewMachineName").textContent=
machine.machine_name;

document.getElementById("viewPurchaseAmount").textContent=
"UGX "+Number(machine.amount_paid||0).toLocaleString();

document.getElementById("viewEarnedAmount").textContent=
"UGX "+Number(machine.earned_amount||0).toLocaleString();

document.getElementById("viewPurchaseDate").textContent=
machine.purchase_date || "--";

document.getElementById("viewExpiryDate").textContent=
machine.expiry_date || "--";

document.getElementById("viewDuration").textContent=
machine.duration_days || 0;

document.getElementById("viewDailyIncome").textContent=
"UGX "+Number(machine.daily_income||0).toLocaleString();

document.getElementById("viewTotalReturn").textContent=
"UGX "+Number(machine.total_return||0).toLocaleString();

document.getElementById("viewVipStatus").textContent=
machine.is_vip ? "YES" : "NO";

}

/*=====================================
EDIT MACHINE
=====================================*/

function openMachineEditor(machine){

document.getElementById("machineModal").classList.remove("hidden");

document.getElementById("machineSelect").value=
machine.machine_id || "";

document.getElementById("machineAmountPaid").value=
machine.amount_paid || "";

document.getElementById("machinePurchaseDate").value=
machine.purchase_date || "";

document.getElementById("machineDuration").value=
machine.duration_days || "";

document.getElementById("machineExpiryDate").value=
machine.expiry_date || "";

document.getElementById("machineDailyIncome").value=
machine.daily_income || "";

document.getElementById("machineTotalReturn").value=
machine.total_return || "";

document.getElementById("machineEarnedAmount").value=
machine.earned_amount || "";

document.getElementById("machineStatus").value=
machine.status || "active";

document.getElementById("machineVip").value=
machine.is_vip.toString();

document.getElementById("saveMachineBtn").dataset.id=
machine.id;

}

/*=====================================
SAVE MACHINE
=====================================*/

document
.getElementById("saveMachineBtn")
.addEventListener("click", saveMachine);

async function saveMachine(){

const id =
document.getElementById("saveMachineBtn").dataset.id;

const purchaseDate =
document.getElementById("machinePurchaseDate").value;

const duration =
parseInt(
document.getElementById("machineDuration").value
) || 0;

const expiryDate =
calculateExpiryDate(purchaseDate,duration);

const updates={

amount_paid:Number(
document.getElementById("machineAmountPaid").value
),

purchase_date:purchaseDate,

duration_days:duration,

expiry_date:expiryDate,

daily_income:Number(
document.getElementById("machineDailyIncome").value
),

total_return:Number(
document.getElementById("machineTotalReturn").value
),

earned_amount:Number(
document.getElementById("machineEarnedAmount").value
),

status:
document.getElementById("machineStatus").value,

is_vip:
document.getElementById("machineVip").value==="true"

};

const {error}=await supabase

.from("user_machines")

.update(updates)

.eq("id",id);

if(error){

showToast(error.message,true);

return;

}

showToast("Machine updated successfully");

document
.getElementById("machineModal")
.classList.add("hidden");

await loadUserMachines();

await loadMachineSummary();

await loadMachineHistory();

}

/*=====================================
CALCULATE EXPIRY DATE
=====================================*/

function calculateExpiryDate(date,days){

if(!date) return null;

const d=new Date(date);

d.setDate(d.getDate()+days);

return d.toISOString().split("T")[0];

}

/*=====================================
AUTO UPDATE EXPIRY DATE
=====================================*/

document
.getElementById("machineDuration")
.addEventListener("input",()=>{

const purchaseDate=
document.getElementById("machinePurchaseDate").value;

const days=parseInt(
document.getElementById("machineDuration").value
)||0;

document.getElementById("machineExpiryDate").value=

calculateExpiryDate(purchaseDate,days);

});

/*=====================================
DELETE MACHINE
=====================================*/

async function deleteMachine(id){

const ok=confirm(

"Delete this machine from the user?"

);

if(!ok) return;

const {error}=await supabase

.from("user_machines")

.delete()

.eq("id",id);

if(error){

showToast(error.message,true);

return;

}

showToast("Machine deleted");

await loadUserMachines();

await loadMachineSummary();

await loadMachineHistory();

}

/*=====================================
LOAD MACHINE PLANS
=====================================*/

async function loadMachinePlans(){

const {data,error}=await supabase

.from("machines")

.select("*")

.eq("status",true)

.order("display_order",{ascending:true});

if(error){

console.error(error);

return;

}

const select=document.getElementById("machineSelect");

select.innerHTML="<option value=''>Select Machine</option>";

data.forEach(machine=>{

select.innerHTML+=`

<option value="${machine.id}"

data-name="${machine.name}"

data-image="${machine.image_url}"

data-price="${machine.price}"

data-daily="${machine.daily_income}"

data-return="${machine.total_return}"

data-days="${machine.duration_days}"

data-vip="${machine.is_vip}">

${machine.name}

</option>

`;

});

}

/*=====================================
AUTO FILL MACHINE DETAILS
=====================================*/

document

.getElementById("machineSelect")

.addEventListener("change",function(){

const option=this.options[this.selectedIndex];

if(!option.value) return;

document.getElementById("machineAmountPaid").value=

option.dataset.price;

document.getElementById("machineDailyIncome").value=

option.dataset.daily;

document.getElementById("machineTotalReturn").value=

option.dataset.return;

document.getElementById("machineDuration").value=

option.dataset.days;

document.getElementById("machineVip").value=

option.dataset.vip;

const today=new Date()

.toISOString()

.split("T")[0];

document.getElementById("machinePurchaseDate").value=today;

document.getElementById("machineExpiryDate").value=

calculateExpiryDate(today,

Number(option.dataset.days));

});

/*=====================================
ASSIGN MACHINE
=====================================*/

document

.getElementById("assignMachineBtn")

.addEventListener("click",()=>{

document.getElementById("machineModalTitle").textContent=

"Assign Machine";

document.getElementById("saveMachineBtn").dataset.id="";

loadMachinePlans();

document

.getElementById("machineModal")

.classList.remove("hidden");

});

/*=====================================
CREATE USER MACHINE
=====================================*/

async function createMachine(){

const option=document

.getElementById("machineSelect")

.selectedOptions[0];

const {error}=await supabase

.from("user_machines")

.insert({

user_id:selectedUser.id,

machine_id:option.value,

machine_name:option.dataset.name,

machine_image:option.dataset.image,

amount_paid:Number(

document.getElementById("machineAmountPaid").value

),

purchase_date:

document.getElementById("machinePurchaseDate").value,

expiry_date:

document.getElementById("machineExpiryDate").value,

duration_days:Number(

document.getElementById("machineDuration").value

),

daily_income:Number(

document.getElementById("machineDailyIncome").value

),

total_return:Number(

document.getElementById("machineTotalReturn").value

),

earned_amount:0,

status:"active",

is_vip:option.dataset.vip==="true"

});

if(error){

showToast(error.message,true);

return;

}

showToast("Machine assigned successfully");

document

.getElementById("machineModal")

.classList.add("hidden");

await loadUserMachines();

await loadMachineSummary();

await loadMachineHistory();

    }

    /*=====================================
EDIT USER
=====================================*/

document
.getElementById("editUserBtn")
.addEventListener("click",openEditUser);

function openEditUser(){

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

document.getElementById("editAccountStatus").value=
selectedUser.account_status || "active";

document.getElementById("editKycStatus").value=
selectedUser.kyc_status || "Not Verified";

document.getElementById("editLevel").value=
selectedUser.level || 1;

document
.getElementById("editUserModal")
.classList.remove("hidden");

}

/*=====================================
SAVE USER
=====================================*/

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

account_status:
document.getElementById("editAccountStatus").value,

kyc_status:
document.getElementById("editKycStatus").value,

level:Number(
document.getElementById("editLevel").value
)

};

const {error}=await supabase

.from("profiles")

.update(updates)

.eq("id",selectedUser.id);

if(error){

showToast(error.message,true);

return;

}

showToast("User updated successfully");

document
.getElementById("editUserModal")
.classList.add("hidden");

await loadUsers();

selectedUser={...selectedUser,...updates};

loadUserProfile();

}

/*=====================================
FREEZE / UNFREEZE USER
=====================================*/

document
.getElementById("confirmFreezeBtn")
.addEventListener("click",freezeUser);

document
.getElementById("confirmUnfreezeBtn")
.addEventListener("click",unfreezeUser);

async function freezeUser(){

const {error}=await supabase

.from("profiles")

.update({

is_frozen:true,

suspension_reason:
document.getElementById("freezeReason").value

})

.eq("id",selectedUser.id);

if(error){

showToast(error.message,true);

return;

}

showToast("Account frozen");

document
.getElementById("freezeModal")
.classList.add("hidden");

selectedUser.is_frozen=true;

loadUserProfile();

}

async function unfreezeUser(){

const {error}=await supabase

.from("profiles")

.update({

is_frozen:false,

suspension_reason:null

})

.eq("id",selectedUser.id);

if(error){

showToast(error.message,true);

return;

}

showToast("Account unfrozen");

document
.getElementById("freezeModal")
.classList.add("hidden");

selectedUser.is_frozen=false;

loadUserProfile();

    }

/*=====================================
SEARCH USERS
=====================================*/

searchInput.addEventListener("input",()=>{

const keyword=searchInput.value.toLowerCase();

const filtered=users.filter(user=>

(user.fullname||"").toLowerCase().includes(keyword) ||

(user.phone||"").toLowerCase().includes(keyword) ||

(user.email||"").toLowerCase().includes(keyword)

);

renderUsers(filtered);

});

/*=====================================
TOAST
=====================================*/

function showToast(message,error=false){

const toast=document.getElementById("toast");

const text=document.getElementById("toastMessage");

text.textContent=message;

toast.style.background=

error ? "#ff4d4f" : "#00d26a";

toast.classList.add("show");

setTimeout(()=>{

toast.classList.remove("show");

},3000);

}

/*=====================================
LOADING
=====================================*/

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

/*=====================================
CLOSE MODALS
=====================================*/

document.querySelectorAll(".iconButton").forEach(btn=>{

if(btn.id.startsWith("close")){

btn.onclick=()=>{

btn.closest(".modal").classList.add("hidden");

};

}

});

document

.getElementById("cancelMachineBtn")

.onclick=()=>{

document

.getElementById("machineModal")

.classList.add("hidden");

};

document

.getElementById("cancelEditUserBtn")

.onclick=()=>{

document

.getElementById("editUserModal")

.classList.add("hidden");

};

document

.getElementById("cancelResetPasswordBtn")

.onclick=()=>{

document

.getElementById("resetPasswordModal")

.classList.add("hidden");

};

/*=====================================
LOGOUT
=====================================*/

document

.getElementById("logoutBtn")

.addEventListener("click",async()=>{

const ok=confirm("Logout Admin?");

if(!ok) return;

await supabase.auth.signOut();

window.location.href="admin-login.html";

});

/*=====================================
REFRESH
=====================================*/

document

.getElementById("refreshBtn")

.addEventListener("click",loadDashboard);

document

.getElementById("refreshMachinesBtn")

.addEventListener("click",loadUserMachines);

document

.getElementById("refreshHistoryBtn")

.addEventListener("click",loadMachineHistory);

/*=====================================
INITIALIZATION
=====================================*/

(async()=>{

showLoading();

await loadDashboard();

await loadMachinePlans();

hideLoading();

})();
