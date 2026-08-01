/*==================================================
ADMIN USER MACHINES
PART 1
==================================================*/

/*==================================================
SUPABASE
==================================================*/

const db = window.supabaseClient;

/*==================================================
GLOBAL DATA
==================================================*/

let users = [];
let machines = [];
let userMachines = [];
let activities = [];

let selectedUser = null;
let selectedMachine = null;

/*==================================================
ELEMENTS
==================================================*/

/* Search */

const searchInput =
document.getElementById("searchInput");

const searchBtn =
document.getElementById("searchBtn");

/* Statistics */

const totalUsers =
document.getElementById("totalUsers");

const activeUsers =
document.getElementById("activeUsers");

const totalMachines =
document.getElementById("totalMachines");

const vipUsers =
document.getElementById("vipUsers");

const userCount =
document.getElementById("userCount");

/* Containers */

const usersContainer =
document.getElementById("usersContainer");

const emptyState =
document.getElementById("emptyState");

const userDashboard =
document.getElementById("userDashboard");

const machineList =
document.getElementById("machineList");

const activityList =
document.getElementById("activityList");

/*==================================================
START
==================================================*/

document.addEventListener(

"DOMContentLoaded",

async()=>{

await initialize();

}

);

/*==================================================
INITIALIZE
==================================================*/

async function initialize(){

try{

await loadUsers();

await loadMachines();

setupEvents();

showToast(

"Admin loaded"

);

}

catch(error){

console.error(error);

showToast(

error.message,

"error"

);

}

}

/*==================================================
LOAD USERS
==================================================*/

async function loadUsers(){

const {data,error}=await db

.from("profiles")

.select("*")

.order(

"created_at",

{

ascending:false

}

);

if(error) throw error;

users=data||[];

renderUsers(users);

updateStatistics();

}

/*==================================================
LOAD MACHINES
==================================================*/

async function loadMachines(){

const {data,error}=await db

.from("machines")

.select("*")

.eq(

"status",

true

)

.order(

"display_order",

{

ascending:true

}

);

if(error) throw error;

machines=data||[];

}

/*==================================================
STATISTICS
==================================================*/

function updateStatistics(){

totalUsers.textContent=

users.length;

activeUsers.textContent=

users.filter(

u=>u.account_status==="active"

).length;

vipUsers.textContent=

users.filter(

u=>u.membership==="VIP"

).length;

userCount.textContent=

`${users.length} Members`;

}

/*==================================================
PLACEHOLDERS

PART 2
==================================================*/

function renderUsers(){}

function setupEvents(){}

function showToast(){}

function selectUser(){}

/*==================================================
PART 2
USERS
==================================================*/

/*==================================================
SETUP EVENTS
==================================================*/

function setupEvents(){

searchBtn.onclick=searchUsers;

searchInput.addEventListener(

"keyup",

e=>{

if(e.key==="Enter"){

searchUsers();

}

}

);

}

/*==================================================
RENDER USERS
==================================================*/

function renderUsers(list){

usersContainer.innerHTML="";

if(!list.length){

usersContainer.innerHTML=`

<div class="emptyStateSmall">

<div class="emptyIcon">

👤

</div>

<h3>No Users Found</h3>

<p>

No users match your search.

</p>

</div>

`;

return;

}

list.forEach(user=>{

const card=document.createElement("div");

card.className="userCard";

if(

selectedUser &&

selectedUser.id===user.id

){

card.classList.add("active");

}

card.innerHTML=`

<img

src="${
user.avatar_url ||

"images/default-avatar.png"
}"

class="userAvatar"

alt="User">

<div class="userInfo">

<h3>

${user.fullname||"Unknown User"}

</h3>

<p>

${user.phone||

user.email||

"No Contact"}

</p>

<div class="userTags">

<span class="userTag">

${user.membership||

"Standard"}

</span>

<span class="userTag">

${user.account_status||

"Active"}

</span>

</div>

</div>

<div class="userArrow">

›

</div>

`;

card.onclick=()=>{

selectUser(user);

};

usersContainer.appendChild(card);

});

}

/*==================================================
SEARCH
==================================================*/

function searchUsers(){

const keyword=

searchInput.value

.trim()

.toLowerCase();

if(!keyword){

renderUsers(users);

return;

}

const filtered=

users.filter(user=>

(user.fullname||"")

.toLowerCase()

.includes(keyword)

||

(user.phone||"")

.toLowerCase()

.includes(keyword)

||

(user.email||"")

.toLowerCase()

.includes(keyword)

||

(user.referral_code||"")

.toLowerCase()

.includes(keyword)

);

renderUsers(filtered);

}

/*==================================================
SELECT USER
==================================================*/

async function selectUser(user){

selectedUser=user;

renderUsers(users);

emptyState.classList.add("hidden");

userDashboard.classList.remove("hidden");

fillUserProfile();

await loadUserMachines();

await loadUserActivity();

}

/*==================================================
FILL PROFILE
==================================================*/

function fillUserProfile(){

document.getElementById("userAvatar").src=

selectedUser.avatar_url||

"images/default-avatar.png";

document.getElementById("userName").textContent=

selectedUser.fullname||

"-";

document.getElementById("userPhone").textContent=

selectedUser.phone||

selectedUser.email||

"-";

document.getElementById("membershipBadge").textContent=

selectedUser.membership||

"Standard";

document.getElementById("statusBadge").textContent=

selectedUser.account_status||

"Active";

document.getElementById("kycBadge").textContent=

selectedUser.kyc_status||

"Not Verified";

document.getElementById("walletBalance").textContent=

formatMoney(

selectedUser.wallet_balance

);

document.getElementById("totalInvested").textContent=

formatMoney(

selectedUser.total_invested

);

document.getElementById("totalProfit").textContent=

formatMoney(

selectedUser.total_profit

);

document.getElementById("ownedMachines").textContent=

"0";

}

/*==================================================
FORMAT MONEY
==================================================*/

function formatMoney(amount){

return "UGX "+

Number(

amount||0

).toLocaleString();

}

/*==================================================
PART 3
LOAD USER MACHINES
==================================================*/

/*==================================================
LOAD USER MACHINES
==================================================*/

async function loadUserMachines(){

if(!selectedUser) return;

try{

const {data,error}=await db

.from("user_machines")

.select(`
*,
machines(*)
`)

.eq("user_id",selectedUser.id)

.order("purchase_date",{

ascending:false

});

if(error) throw error;

userMachines=data||[];

document.getElementById(

"ownedMachines"

).textContent=userMachines.length;

updateMachineSummary();

renderMachines(userMachines);

}

catch(error){

console.error(error);

showToast(

"Failed to load machines",

"error"

);

}

}

/*==================================================
UPDATE MACHINE SUMMARY
==================================================*/

function updateMachineSummary(){

const total=userMachines.length;

const running=userMachines.filter(

m=>m.status==="active"

).length;

const completed=userMachines.filter(

m=>m.completed===true

).length;

let paid=0;

userMachines.forEach(machine=>{

paid+=Number(

machine.amount_paid||0

);

});

document.getElementById(

"summaryMachines"

).textContent=total;

document.getElementById(

"summaryRunning"

).textContent=running;

document.getElementById(

"summaryCompleted"

).textContent=completed;

document.getElementById(

"summaryPaid"

).textContent=

formatMoney(paid);

}

/*==================================================
RENDER MACHINES
==================================================*/

function renderMachines(list){

machineList.innerHTML="";

const empty=document.getElementById(

"machineEmpty"

);

if(!list.length){

empty.classList.remove("hidden");

return;

}

empty.classList.add("hidden");

list.forEach(machine=>{

const info=machine.machines||{};

const progress=getProgress(

machine.purchase_date,

machine.expiry_date

);

const card=document.createElement("div");

card.className="machineCard";

card.innerHTML=`

<img

class="machineImage"

src="${
machine.machine_image||

info.image_url||

"images/default-machine.png"
}">

<div class="machineInfo">

<h3>

${machine.machine_name||

info.name||

"Machine"}

</h3>

<p>

${info.series||"-"}

</p>

<div class="machineBadges">

<span class="machineBadge active">

${machine.status}

</span>

${
machine.is_vip?

'<span class="machineBadge vip">VIP</span>'

:""
}

</div>

<p>

Amount Paid

<strong>

${formatMoney(

machine.amount_paid

)}

</strong>

</p>

<p>

Daily Income

<strong>

${formatMoney(

info.daily_income

)}

</strong>

</p>

<p>

Earned

<strong>

${formatMoney(

machine.earned_amount

)}

</strong>

</p>

<div class="machineProgress">

<span>

${progress.remainingDays}

Days Remaining

</span>

<div class="progressBar">

<div

class="progressFill"

style="width:${progress.percent}%">

</div>

</div>

</div>

</div>

<button

class="machineAction">

⋮

</button>

`;

card.onclick=()=>{

selectedMachine=machine;

viewMachine();

};

card.querySelector(

".machineAction"

).onclick=(e)=>{

e.stopPropagation();

selectedMachine=machine;

editMachine();

};

machineList.appendChild(card);

});

}

/*==================================================
PROGRESS
==================================================*/

function getProgress(

start,

end

){

if(!start||!end){

return{

percent:0,

remainingDays:0

};

}

const startDate=new Date(start);

const endDate=new Date(end);

const today=new Date();

const total=endDate-startDate;

const passed=today-startDate;

let percent=

(passed/total)*100;

percent=Math.max(

0,

Math.min(100,percent)

);

const remaining=Math.max(

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

/*==================================================
FILTERS
==================================================*/

document.querySelectorAll(

".filterButton"

).forEach(btn=>{

btn.onclick=()=>{

document

.querySelectorAll(

".filterButton"

)

.forEach(b=>

b.classList.remove(

"active"

)

);

btn.classList.add(

"active"

);

const filter=

btn.dataset.filter;

if(filter==="all"){

renderMachines(

userMachines

);

return;

}

renderMachines(

userMachines.filter(

machine=>{

if(filter==="vip")

return machine.is_vip;

if(filter==="completed")

return machine.completed;

return machine.status===filter;

}

)

);

};

});

/*==================================================
PART 4
REAL MACHINE MANAGEMENT
==================================================*/

/*==================================================
VIEW MACHINE
==================================================*/

function viewMachine(){

if(!selectedMachine) return;

const info=selectedMachine.machines||{};

alert(`

Machine:
${selectedMachine.machine_name||info.name}

Series:
${info.series||"-"}

Purchase Price:
${formatMoney(selectedMachine.amount_paid)}

Daily Income:
${formatMoney(info.daily_income)}

Total Earned:
${formatMoney(selectedMachine.earned_amount)}

Purchase Date:
${selectedMachine.purchase_date}

Expiry Date:
${selectedMachine.expiry_date}

Status:
${selectedMachine.status}

VIP:
${selectedMachine.is_vip?"YES":"NO"}

`);

}

/*==================================================
EDIT MACHINE
==================================================*/

async function editMachine(){

if(!selectedMachine) return;

const amount=prompt(

"Purchase Amount",

selectedMachine.amount_paid||0

);

if(amount===null) return;

const earned=prompt(

"Earned Amount",

selectedMachine.earned_amount||0

);

if(earned===null) return;

const expiry=prompt(

"Expiry Date (YYYY-MM-DD)",

selectedMachine.expiry_date

);

if(expiry===null) return;

try{

const{error}=await db

.from("user_machines")

.update({

amount_paid:Number(amount),

earned_amount:Number(earned),

expiry_date:expiry

})

.eq("id",selectedMachine.id);

if(error) throw error;

showToast("Machine updated");

await loadUserMachines();

}

catch(error){

showToast(error.message,"error");

}

}

/*==================================================
CHANGE STATUS
==================================================*/

async function toggleStatus(){

if(!selectedMachine) return;

const newStatus=

selectedMachine.status==="active"

?

"suspended"

:

"active";

try{

const{error}=await db

.from("user_machines")

.update({

status:newStatus

})

.eq("id",selectedMachine.id);

if(error) throw error;

showToast("Status updated");

await loadUserMachines();

}

catch(error){

showToast(error.message,"error");

}

}

/*==================================================
TOGGLE VIP
==================================================*/

async function toggleVIP(){

if(!selectedMachine) return;

try{

const{error}=await db

.from("user_machines")

.update({

is_vip:!selectedMachine.is_vip

})

.eq("id",selectedMachine.id);

if(error) throw error;

showToast("VIP updated");

await loadUserMachines();

}

catch(error){

showToast(error.message,"error");

}

}

/*==================================================
EXTEND MACHINE
==================================================*/

async function extendMachine(){

if(!selectedMachine) return;

const days=prompt(

"Extend by how many days?",

30

);

if(days===null) return;

const expiry=new Date(

selectedMachine.expiry_date

);

expiry.setDate(

expiry.getDate()+Number(days)

);

try{

const{error}=await db

.from("user_machines")

.update({

expiry_date:expiry

.toISOString()

.slice(0,10)

})

.eq("id",selectedMachine.id);

if(error) throw error;

showToast("Machine extended");

await loadUserMachines();

}

catch(error){

showToast(error.message,"error");

}

}

/*==================================================
DELETE MACHINE
==================================================*/

async function deleteMachine(){

if(!selectedMachine) return;

if(!confirm(

"Delete this machine permanently?"

)) return;

try{

const{error}=await db

.from("user_machines")

.delete()

.eq("id",selectedMachine.id);

if(error) throw error;

showToast("Machine deleted");

await loadUserMachines();

}

catch(error){

showToast(error.message,"error");

}

}

/*==================================================
BUTTON EVENTS
==================================================*/

document.getElementById(

"viewMachineBtn"

).onclick=viewMachine;

document.getElementById(

"editMachineBtn"

).onclick=editMachine;

document.getElementById(

"toggleStatusBtn"

).onclick=toggleStatus;

document.getElementById(

"toggleVipBtn"

).onclick=toggleVIP;

document.getElementById(

"extendMachineBtn"

).onclick=extendMachine;

document.getElementById(

"deleteMachineBtn"

).onclick=deleteMachine;

/*==================================================
PART 5
ADD MACHINE TO USER
==================================================*/

/*==================================================
ADD MACHINE BUTTON
==================================================*/

document.getElementById("addMachineBtn").onclick=()=>{

if(!selectedUser){

showToast("Select a user first","error");

return;

}

openAddMachine();

};

/*==================================================
OPEN ADD MACHINE
==================================================*/

function openAddMachine(){

const list=machines.map((m,index)=>

`${index+1}. ${m.name}
UGX ${Number(m.price).toLocaleString()}

`

).join("\n");

const choice=prompt(

`Select Machine\n\n${list}\n\nEnter machine number`

);

if(choice===null) return;

const machine=machines[Number(choice)-1];

if(!machine){

showToast("Invalid machine","error");

return;

}

assignMachine(machine);

}

/*==================================================
ASSIGN MACHINE
==================================================*/

async function assignMachine(machine){

const paid=prompt(

"Purchase Amount",

machine.price||0

);

if(paid===null) return;

const purchaseDate=new Date();

const expiryDate=new Date();

expiryDate.setDate(

expiryDate.getDate()+

Number(machine.duration_days||0)

);

try{

const {error}=await db

.from("user_machines")

.insert({

user_id:selectedUser.id,

machine_id:machine.id,

machine_name:machine.name,

machine_image:machine.image_url,

amount_paid:Number(paid),

earned_amount:0,

status:"active",

completed:false,

is_vip:machine.is_vip||false,

purchase_date:

purchaseDate.toISOString(),

expiry_date:

expiryDate.toISOString(),

daily_income:

machine.daily_income,

total_return:

machine.total_return

});

if(error) throw error;

/*====================================
UPDATE USER TOTAL INVESTMENT
====================================*/

await db

.from("profiles")

.update({

total_invested:

Number(selectedUser.total_invested||0)+

Number(paid)

})

.eq("id",selectedUser.id);

showToast(

"Machine assigned successfully"

);

await selectUser(selectedUser);

}

catch(error){

console.error(error);

showToast(error.message,"error");

}

}

/*==================================================
REFRESH
==================================================*/

document.getElementById("refreshBtn").onclick=

async()=>{

await loadUsers();

await loadMachines();

if(selectedUser){

await selectUser(selectedUser);

}

showToast("Data refreshed");

};

/*==================================================
TOAST
==================================================*/

function showToast(

message,

type="success"

){

const toast=

document.getElementById("toast");

document.getElementById(

"toastMessage"

).textContent=message;

toast.className="toast";

toast.classList.add(type);

toast.classList.add("show");

setTimeout(()=>{

toast.classList.remove("show");

},3000);

}

/*==================================================
LOGOUT
==================================================*/

document.getElementById("logoutBtn").onclick=

async()=>{

if(!confirm("Logout?")) return;

await db.auth.signOut();

location.href="login.html";

};

/*==================================================
END
==================================================*/
