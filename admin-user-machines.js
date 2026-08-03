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
