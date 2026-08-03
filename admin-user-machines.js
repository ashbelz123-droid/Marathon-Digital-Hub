/*====================================
ADMIN USER MACHINES
MARATHON DIGITAL HUB
====================================*/

/*====================================
SUPABASE
====================================*/

const supabase = window.supabaseClient;

/*====================================
GLOBAL VARIABLES
====================================*/

let users = [];
let selectedUser = null;
let machinePlans = [];
let userMachines = [];
let editingMachine = null;

/*====================================
ELEMENTS
====================================*/

const usersList = document.getElementById("usersList");
const searchInput = document.getElementById("searchInput");

const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const totalMachines = document.getElementById("totalMachines");
const vipMachines = document.getElementById("vipMachines");

const profileSection = document.getElementById("userProfileSection");
const machinesSection = document.getElementById("machinesSection");

/*====================================
START
====================================*/

document.addEventListener("DOMContentLoaded", () => {

    initializePage();

});

async function initializePage(){

    try{

        showLoading();

        await loadUsers();

        await loadMachinePlans();

        hideLoading();

    }catch(err){

        hideLoading();

        console.error(err);

        showToast(err.message,true);

    }

}

/*====================================
LOAD USERS
====================================*/

async function loadUsers(){

    const { data, error } = await supabase

    .from("profiles")

    .select("*")

    .order("created_at",{ascending:false});

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
LOAD MACHINE PLANS
====================================*/

async function loadMachinePlans(){

    const { data, error } = await supabase

    .from("machines")

    .select("*")

    .eq("status",true)

    .order("display_order");

    if(error){

        console.error(error);

        return;

    }

    machinePlans = data || [];

}

/*====================================
UPDATE STATS
====================================*/

function updateDashboardStats(){

    totalUsers.textContent = users.length;

    activeUsers.textContent = users.filter(

        user => !user.is_frozen

    ).length;

    vipMachines.textContent = users.filter(

        user => user.membership === "VIP"

    ).length;

}
