/*=========================================
MARATHON DIGITAL HUB
ADMIN USER MACHINES
=========================================*/

/*=========================================
SUPABASE
=========================================*/

const supabase = window.supabaseClient;

/*=========================================
GLOBAL VARIABLES
=========================================*/

let users = [];
let selectedUser = null;
let userMachines = [];
let machinePlans = [];

/*=========================================
ELEMENTS
=========================================*/

const usersList = document.getElementById("usersList");

const searchInput = document.getElementById("searchInput");

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
START PAGE
=========================================*/

document.addEventListener("DOMContentLoaded", async ()=>{

try{

showLoading();

await loadUsers();

await loadMachinePlans();

hideLoading();

}catch(error){

hideLoading();

console.error(error);

alert(error.message);

}

});

/*=========================================
LOAD USERS
=========================================*/

async function loadUsers(){

const { data, error } = await supabase

.from("profiles")

.select("*")

.order("created_at",{ascending:false});

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

const { data, error } = await supabase

.from("machines")

.select("*")

.eq("status",true)

.order("display_order");

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
