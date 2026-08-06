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
