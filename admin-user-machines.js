/*=========================================
MARATHON DIGITAL HUB
ADMIN USER MACHINES
PART 1
SYSTEM INITIALIZATION
=========================================*/

/*=========================================
SUPABASE
=========================================*/

const db = window.supabaseClient;

if (!db) {
    alert("Supabase failed to initialize.");
    throw new Error("Supabase Client Missing");
}

/*=========================================
GLOBAL VARIABLES
=========================================*/

let users = [];
let machinePlans = [];
let userMachines = [];

let selectedUser = null;
let editingMachine = null;
let currentFilter = "all";

/*=========================================
DOM ELEMENTS
=========================================*/

const loadingScreen =
document.getElementById("loadingScreen");

const toast =
document.getElementById("toast");

const toastText =
document.getElementById("toastText");

const usersList =
document.getElementById("usersList");

const machinesList =
document.getElementById("machinesList");

const searchInput =
document.getElementById("searchInput");

const totalUsers =
document.getElementById("totalUsers");

const activeUsers =
document.getElementById("activeUsers");

const totalMachines =
document.getElementById("totalMachines");

const vipMachines =
document.getElementById("vipMachines");

/*=========================================
LOADING SCREEN
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
TOAST MESSAGE
=========================================*/

function showToast(message,type="success"){

if(!toast) return;

toastText.textContent = message;

toast.className="toast";

toast.classList.add("show");

if(type==="error"){

toast.style.background="#ff4d4f";

}else{

toast.style.background="#00d26a";

}

setTimeout(()=>{

toast.classList.remove("show");

},3000);

}

/*=========================================
RESET PAGE
=========================================*/

function resetPage(){

selectedUser=null;

userMachines=[];

if(usersList){

usersList.innerHTML="";

}

if(machinesList){

machinesList.innerHTML="";

}

document
.getElementById("userProfileSection")
.classList.add("hidden");

document
.getElementById("machinesSection")
.classList.add("hidden");

}

/*=========================================
INITIALIZE PAGE
=========================================*/

document.addEventListener(

"DOMContentLoaded",

initializePage

);

async function initializePage(){

showLoading();

try{

resetPage();

/* Part 2 will load
users and machine plans */

}
catch(error){

console.error(error);

showToast(error.message,"error");

}
finally{

hideLoading();

}

}

/*=========================================
END OF PART 1
=========================================*/

console.log("================================");
console.log("ADMIN USER MACHINES");
console.log("PART 1 INITIALIZED");
console.log("================================");

/*=========================================
PART 2
LOAD DATA
=========================================*/

/*=========================================
LOAD EVERYTHING
=========================================*/

async function loadSystem(){

await Promise.all([

loadUsers(),

loadMachinePlans()

]);

}

/*=========================================
LOAD USERS
=========================================*/

async function loadUsers(){

const { data, error } = await db

.from("profiles")

.select("*")

.order("created_at",{ascending:false});

if(error){

console.error(error);

showToast(error.message,"error");

return;

}

users = data || [];

updateDashboard();

renderUsers();

}

/*=========================================
LOAD MACHINE PLANS
=========================================*/

async function loadMachinePlans(){

const { data, error } = await db

.from("machines")

.select("*")

.order("display_order",{ascending:true});

if(error){

console.error(error);

showToast(error.message,"error");

return;

}

machinePlans = data || [];

}

/*=========================================
UPDATE DASHBOARD
=========================================*/

function updateDashboard(){

totalUsers.textContent =
users.length;

activeUsers.textContent =
users.filter(user=>

!user.is_frozen

).length;

vipMachines.textContent =
users.filter(user=>

user.membership==="VIP"

).length;

totalMachines.textContent =
machinePlans.length;

}

/*=========================================
REFRESH PAGE
=========================================*/

document

.getElementById("refreshBtn")

.addEventListener(

"click",

async()=>{

showLoading();

await loadSystem();

hideLoading();

showToast("Data refreshed.");

}

);

/*=========================================
INITIALIZE
=========================================*/

async function initializePage(){

showLoading();

try{

resetPage();

await loadSystem();

}
catch(error){

console.error(error);

showToast(error.message,"error");

}
finally{

hideLoading();

}

}

/*=========================================
PART 3
RENDER USERS
=========================================*/

function renderUsers(list = users){

usersList.innerHTML="";

if(list.length===0){

usersList.innerHTML=`

<div class="emptyCard">

<h3>No Users Found</h3>

<p>No matching users.</p>

</div>

`;

return;

}

list.forEach(user=>{

const card=document.createElement("div");

card.className="userCard";

if(selectedUser && selectedUser.id===user.id){

card.classList.add("active");

}

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

<span class="badge membershipBadge">

${user.membership || "Standard"}

</span>

</div>

`;

card.onclick=()=>{

selectUser(user);

};

usersList.appendChild(card);

});

}

/*=========================================
SEARCH USERS
=========================================*/

searchInput.addEventListener("input",()=>{

const keyword=

searchInput.value

.toLowerCase()

.trim();

const filtered=

users.filter(user=>{

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

});

/*=========================================
SELECT USER
=========================================*/

function selectUser(user){

selectedUser=user;

renderUsers();

document

.getElementById("userProfileSection")

.classList.remove("hidden");

document

.getElementById("machinesSection")

.classList.remove("hidden");

/* Part 4 */

loadUserProfile();

/* Part 5 */

loadUserMachines();

}

/*=========================================
PART 4
LOAD USER PROFILE
=========================================*/

function loadUserProfile(){

if(!selectedUser) return;

/* Avatar */

document.getElementById("profileAvatar").src=

selectedUser.avatar_url ||

"images/default-avatar.png";

/* Basic Info */

document.getElementById("profileName").textContent=

selectedUser.fullname ||

"Unknown User";

document.getElementById("profilePhone").textContent=

selectedUser.phone ||

"No Phone Number";

document.getElementById("profileEmail").textContent=

selectedUser.email ||

"No Email";

/* Membership */

const membershipBadge=

document.getElementById("membershipBadge");

membershipBadge.textContent=

selectedUser.membership ||

"Standard";

/* Account Status */

const statusBadge=

document.getElementById("statusBadge");

statusBadge.textContent=

selectedUser.account_status ||

"Active";

statusBadge.className="badge";

if(selectedUser.is_frozen){

statusBadge.classList.add("warningBadge");

statusBadge.textContent="Frozen";

}else{

statusBadge.classList.add("activeBadge");

}

/* KYC */

const kycBadge=

document.getElementById("kycBadge");

kycBadge.textContent=

selectedUser.kyc_status ||

"Not Verified";

/* Statistics */

document.getElementById("profileInvested").textContent=

"UGX "+

Number(

selectedUser.total_invested||0

).toLocaleString();

document.getElementById("profileProfit").textContent=

"UGX "+

Number(

selectedUser.total_profit||0

).toLocaleString();

document.getElementById("profileReferralBonus").textContent=

"UGX "+

Number(

selectedUser.total_referral_bonus||0

).toLocaleString();

document.getElementById("profileMachineCount").textContent="0";

}

/*=========================================
OPEN EDIT USER
=========================================*/

document

.getElementById("editUserBtn")

.addEventListener(

"click",

openEditUser

);

function openEditUser(){

if(!selectedUser){

showToast("Select a user first.","error");

return;

}

document

.getElementById("editUserModal")

.classList.remove("hidden");

/* Preview */

document.getElementById("editUserAvatar").src=

selectedUser.avatar_url ||

"images/default-avatar.png";

document.getElementById("editPreviewName").textContent=

selectedUser.fullname;

document.getElementById("editPreviewPhone").textContent=

selectedUser.phone || "";

/* Form */

document.getElementById("editFullname").value=

selectedUser.fullname || "";

document.getElementById("editPhone").value=

selectedUser.phone || "";

document.getElementById("editEmail").value=

selectedUser.email || "";

document.getElementById("editCountry").value=

selectedUser.country || "";

document.getElementById("editGender").value=

selectedUser.gender || "";

document.getElementById("editMembership").value=

selectedUser.membership || "Standard";

document.getElementById("editLevel").value=

selectedUser.level || 1;

document.getElementById("editAccountStatus").value=

selectedUser.account_status || "active";

document.getElementById("editKycStatus").value=

selectedUser.kyc_status || "Not Verified";

document.getElementById("editReferralCode").value=

selectedUser.referral_code || "";

    }

/*=========================================
PART 5
SAVE USER
=========================================*/

document

.getElementById("saveUserBtn")

.addEventListener("click",saveUser);

async function saveUser(){

if(!selectedUser){

showToast("No user selected.","error");

return;

}

const updates={

fullname:
document.getElementById("editFullname").value.trim(),

phone:
document.getElementById("editPhone").value.trim(),

email:
document.getElementById("editEmail").value.trim(),

country:
document.getElementById("editCountry").value.trim(),

gender:
document.getElementById("editGender").value,

membership:
document.getElementById("editMembership").value,

level:Number(
document.getElementById("editLevel").value
),

account_status:
document.getElementById("editAccountStatus").value,

kyc_status:
document.getElementById("editKycStatus").value,

referral_code:
document.getElementById("editReferralCode").value.trim(),

updated_at:
new Date().toISOString()

};

showLoading();

const {error}=await db

.from("profiles")

.update(updates)

.eq("id",selectedUser.id);

hideLoading();

if(error){

console.error(error);

showToast(error.message,"error");

return;

}

Object.assign(selectedUser,updates);

loadUserProfile();

renderUsers();

document

.getElementById("editUserModal")

.classList.add("hidden");

showToast("User updated successfully.");

}

/*=========================================
FREEZE / UNFREEZE USER
=========================================*/

document

.getElementById("freezeUserBtn")

.addEventListener("click",toggleFreezeUser);

async function toggleFreezeUser(){

if(!selectedUser){

showToast("Select a user.","error");

return;

}

const freeze=

!selectedUser.is_frozen;

showLoading();

const {error}=await db

.from("profiles")

.update({

is_frozen:freeze,

updated_at:
new Date().toISOString()

})

.eq("id",selectedUser.id);

hideLoading();

if(error){

console.error(error);

showToast(error.message,"error");

return;

}

selectedUser.is_frozen=freeze;

loadUserProfile();

updateDashboard();

renderUsers();

document

.getElementById("freezeUserBtn")

.innerHTML=

freeze

?

"✅ Unfreeze"

:

"❄ Freeze";

showToast(

freeze

?

"Account frozen."

:

"Account activated."

);

}

/*=========================================
CLOSE EDIT MODAL
=========================================*/

document

.getElementById("cancelEditUserBtn")

.onclick=()=>{

document

.getElementById("editUserModal")

.classList.add("hidden");

};

document

.getElementById("closeEditUserModal")

.onclick=()=>{

document

.getElementById("editUserModal")

.classList.add("hidden");

};
