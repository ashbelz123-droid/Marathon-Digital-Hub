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
