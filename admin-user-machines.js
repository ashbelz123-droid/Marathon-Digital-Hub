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

/*=========================================
START
=========================================*/

document.addEventListener("DOMContentLoaded", () => {

    initialize();

});

async function initialize() {

    try {

        showLoading();

        await loadUsers();

        hideLoading();

    } catch (err) {

        hideLoading();

        console.error(err);

        alert(err.message);

    }

}

/*=========================================
LOAD USERS
=========================================*/

async function loadUsers() {

    const { data, error } = await supabase

        .from("profiles")

        .select("*")

        .order("created_at", { ascending: false });

    if (error) {

        console.error(error);

        alert(error.message);

        return;

    }

    users = data || [];

    renderUsers();

    updateStats();

}

/*=========================================
UPDATE STATS
=========================================*/

function updateStats() {

    totalUsers.textContent = users.length;

    activeUsers.textContent = users.filter(

        user => !user.is_frozen

    ).length;

}
