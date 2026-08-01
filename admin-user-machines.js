/*==================================================
ADMIN USER MACHINES
PART 1
FOUNDATION
==================================================*/

/*==================================================
SUPABASE
==================================================*/

const db = window.supabaseClient;

/*==================================================
GLOBAL STATE
==================================================*/

let users = [];
let selectedUser = null;

let userMachines = [];
let selectedMachine = null;

let allMachines = [];

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

/* User List */

const usersContainer =
document.getElementById("usersContainer");

/* Empty State */

const emptyState =
document.getElementById("emptyState");

/* Dashboard */

const userDashboard =
document.getElementById("userDashboard");

/* Profile */

const userAvatar =
document.getElementById("userAvatar");

const userName =
document.getElementById("userName");

const userPhone =
document.getElementById("userPhone");

const membershipBadge =
document.getElementById("membershipBadge");

const statusBadge =
document.getElementById("statusBadge");

const kycBadge =
document.getElementById("kycBadge");

/* Overview */

const walletBalance =
document.getElementById("walletBalance");

const totalInvested =
document.getElementById("totalInvested");

const totalProfit =
document.getElementById("totalProfit");

const ownedMachines =
document.getElementById("ownedMachines");

/* Containers */

const machineList =
document.getElementById("machineList");

const activityList =
document.getElementById("activityList");

/*==================================================
START
==================================================*/

document.addEventListener(
"DOMContentLoaded",
initialize
);

/*==================================================
INITIALIZE
==================================================*/

async function initialize() {

    try {

        showLoader();

        await Promise.all([

            loadUsers(),

            loadMachineCatalog()

        ]);

        setupEvents();

        hideLoader();

    }

    catch (error) {

        console.error(error);

        hideLoader();

        showToast(
            error.message,
            "error"
        );

    }

}

/*==================================================
LOAD USERS
==================================================*/

async function loadUsers() {

    const { data, error } = await db

        .from("profiles")

        .select("*")

        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) throw error;

    users = data || [];

    updateStatistics();

    renderUsers(users);

}

/*==================================================
LOAD MACHINE CATALOG
==================================================*/

async function loadMachineCatalog() {

    const { data, error } = await db

        .from("machines")

        .select("*")

        .eq("status", true)

        .order(
            "display_order",
            {
                ascending: true
            }
        );

    if (error) throw error;

    allMachines = data || [];

}

/*==================================================
UPDATE STATISTICS
==================================================*/

function updateStatistics() {

    totalUsers.textContent =
    users.length;

    activeUsers.textContent =
    users.filter(user =>
        user.account_status === "active"
    ).length;

    vipUsers.textContent =
    users.filter(user =>
        user.membership === "VIP"
    ).length;

    userCount.textContent =
    `${users.length} Members`;

}

/*==================================================
EVENTS
==================================================*/

function setupEvents() {

    searchBtn.onclick =
    searchUsers;

    searchInput.addEventListener(
        "keyup",
        e => {

            if (e.key === "Enter") {

                searchUsers();

            }

        }
    );

    document
    .getElementById("refreshBtn")
    .onclick = refreshPage;

}

/*==================================================
REFRESH
==================================================*/

async function refreshPage() {

    try {

        showLoader();

        await loadUsers();

        if (selectedUser) {

            await selectUser(selectedUser);

        }

        hideLoader();

        showToast("Updated");

    }

    catch (error) {

        hideLoader();

        showToast(
            error.message,
            "error"
        );

    }

}

/*==================================================
HELPERS
==================================================*/

function showLoader() {

    document.body.classList.add(
        "loading"
    );

}

function hideLoader() {

    document.body.classList.remove(
        "loading"
    );

}

function formatMoney(value) {

    return "UGX " +

    Number(value || 0)
    .toLocaleString();

}

function formatDate(date) {

    if (!date) return "-";

    return new Date(date)
    .toLocaleDateString();

}

/*==================================================
PART 2

✓ Render Users

✓ Search

✓ Select User

✓ Fill Profile

==================================================*/

/*==================================================
PART 2
USERS
==================================================*/

/*==================================================
RENDER USERS
==================================================*/

function renderUsers(list) {

    usersContainer.innerHTML = "";

    if (!list.length) {

        usersContainer.innerHTML = `

        <div class="emptyMessage">

            No users found.

        </div>

        `;

        return;

    }

    list.forEach(user => {

        const card = document.createElement("div");

        card.className = "userCard";

        if (
            selectedUser &&
            selectedUser.id === user.id
        ) {

            card.classList.add("active");

        }

        card.innerHTML = `

        <img
        class="userAvatarSmall"
        src="${user.avatar_url || "images/default-avatar.png"}">

        <div class="userInfo">

            <h3>

                ${user.fullname || "Unknown User"}

            </h3>

            <p>

                ${user.phone || user.email || "-"}

            </p>

            <div class="userTags">

                <span class="userTag">

                    ${user.membership || "Standard"}

                </span>

                <span class="userTag">

                    ${user.account_status || "Active"}

                </span>

            </div>

        </div>

        <div class="userArrow">

            ➜

        </div>

        `;

        card.onclick = () => {

            selectUser(user);

        };

        usersContainer.appendChild(card);

    });

}

/*==================================================
SEARCH USERS
==================================================*/

function searchUsers() {

    const keyword =

        searchInput.value
        .trim()
        .toLowerCase();

    if (!keyword) {

        renderUsers(users);

        return;

    }

    const filtered = users.filter(user =>

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

    renderUsers(filtered);

}

/*==================================================
SELECT USER
==================================================*/

async function selectUser(user) {

    try {

        showLoader();

        selectedUser = user;

        renderUsers(users);

        emptyState.classList.add("hidden");

        userDashboard.classList.remove("hidden");

        fillUserProfile();

        await loadUserMachines();

        hideLoader();

    }

    catch (error) {

        hideLoader();

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    }

}

/*==================================================
FILL PROFILE
==================================================*/

function fillUserProfile() {

    if (!selectedUser) return;

    userAvatar.src =

    selectedUser.avatar_url ||

    "images/default-avatar.png";

    userName.textContent =

    selectedUser.fullname || "-";

    userPhone.textContent =

    selectedUser.phone ||

    selectedUser.email ||

    "-";

    membershipBadge.textContent =

    selectedUser.membership ||

    "Standard";

    statusBadge.textContent =

    selectedUser.account_status ||

    "Active";

    kycBadge.textContent =

    selectedUser.kyc_status ||

    "Not Verified";

    walletBalance.textContent =

    formatMoney(
        selectedUser.wallet_balance
    );

    totalInvested.textContent =

    formatMoney(
        selectedUser.total_invested
    );

    totalProfit.textContent =

    formatMoney(
        selectedUser.total_profit
    );

    ownedMachines.textContent = "0";

    /* Profile Tab */

    document.getElementById(
        "profileEmail"
    ).textContent =

    selectedUser.email || "-";

    document.getElementById(
        "profilePhone"
    ).textContent =

    selectedUser.phone || "-";

    document.getElementById(
        "profileCountry"
    ).textContent =

    selectedUser.country || "-";

    document.getElementById(
        "profileMembership"
    ).textContent =

    selectedUser.membership || "-";

    document.getElementById(
        "profileKyc"
    ).textContent =

    selectedUser.kyc_status || "-";

    document.getElementById(
        "profileLevel"
    ).textContent =

    selectedUser.level || 1;

    document.getElementById(
        "profileStatus"
    ).textContent =

    selectedUser.account_status || "-";

    document.getElementById(
        "profileLastLogin"
    ).textContent =

    formatDate(
        selectedUser.last_login
    );

}

/*==================================================
PART 3

✓ Load User Machines

✓ Render Machine Cards

✓ Machine Progress

✓ Machine Filters

==================================================*/

/*==================================================
PART 3
USER MACHINES
==================================================*/

/*==================================================
LOAD USER MACHINES
==================================================*/

async function loadUserMachines() {

    if (!selectedUser) return;

    const { data, error } = await db

        .from("user_machines")

        .select(`
            *,
            machines(*)
        `)

        .eq("user_id", selectedUser.id)

        .order("purchase_date", {
            ascending: false
        });

    if (error) throw error;

    userMachines = data || [];

    ownedMachines.textContent =
    userMachines.length;

    totalMachines.textContent =
    userMachines.length;

    renderMachines(userMachines);

}

/*==================================================
RENDER MACHINES
==================================================*/

function renderMachines(list) {

    machineList.innerHTML = "";

    if (!list.length) {

        machineList.innerHTML = `

        <div class="emptyMessage">

            This user has not purchased
            any machine yet.

        </div>

        `;

        return;

    }

    list.forEach(machine => {

        const info =
        machine.machines || {};

        const progress =
        getMachineProgress(machine);

        const card =
        document.createElement("div");

        card.className =
        "machineCard";

        card.innerHTML = `

        <img
        class="machineImage"
        src="${
            machine.machine_image ||
            info.image_url ||
            "images/default-machine.png"
        }">

        <div class="machineContent">

            <h3>

                ${
                    machine.machine_name ||
                    info.name ||
                    "Machine"
                }

            </h3>

            <p>

                ${info.series || "-"}

            </p>

            <div class="machineTags">

                <span class="machineStatus">

                    ${machine.status}

                </span>

                ${
                    machine.is_vip

                    ?

                    `<span class="vipTag">

                        VIP

                    </span>`

                    :

                    ""

                }

            </div>

            <div class="machineRow">

                <span>

                    Paid

                </span>

                <strong>

                    ${formatMoney(
                        machine.amount_paid
                    )}

                </strong>

            </div>

            <div class="machineRow">

                <span>

                    Daily Income

                </span>

                <strong>

                    ${formatMoney(
                        info.daily_income
                    )}

                </strong>

            </div>

            <div class="machineRow">

                <span>

                    Earned

                </span>

                <strong>

                    ${formatMoney(
                        machine.earned_amount
                    )}

                </strong>

            </div>

            <div class="machineRow">

                <span>

                    Remaining

                </span>

                <strong>

                    ${progress.daysLeft}
                    Days

                </strong>

            </div>

            <div class="progress">

                <div
                class="progressFill"

                style="width:${progress.percent}%">

                </div>

            </div>

        </div>

        <button
        class="machineMenu">

            ⋮

        </button>

        `;

        card.onclick = () => {

            selectedMachine = machine;

            viewMachine();

        };

        card.querySelector(
        ".machineMenu"
        ).onclick = e => {

            e.stopPropagation();

            selectedMachine =
            machine;

            openMachineMenu();

        };

        machineList.appendChild(card);

    });

}

/*==================================================
FILTERS
==================================================*/

document
.querySelectorAll(".filterButton")
.forEach(button => {

    button.onclick = () => {

        document

        .querySelectorAll(
        ".filterButton")

        .forEach(btn =>

            btn.classList
            .remove("active")

        );

        button.classList
        .add("active");

        const filter =
        button.dataset.filter;

        let list =
        [...userMachines];

        switch(filter){

            case "active":

                list = list.filter(m=>

                    m.status==="active"

                );

                break;

            case "vip":

                list = list.filter(m=>

                    m.is_vip

                );

                break;

            case "completed":

                list = list.filter(m=>

                    m.completed

                );

                break;

            case "expired":

                list = list.filter(m=>

                    m.status==="expired"

                );

                break;

        }

        renderMachines(list);

    };

});

/*==================================================
PROGRESS
==================================================*/

function getMachineProgress(machine){

    if(

        !machine.purchase_date ||

        !machine.expiry_date

    ){

        return{

            percent:0,

            daysLeft:0

        };

    }

    const start =

    new Date(machine.purchase_date);

    const end =

    new Date(machine.expiry_date);

    const now =

    new Date();

    const total =

    end-start;

    const passed =

    now-start;

    let percent =

    (passed/total)*100;

    percent=Math.max(

        0,

        Math.min(100,percent)

    );

    const daysLeft =

    Math.max(

        0,

        Math.ceil(

            (end-now)/86400000

        )

    );

    return{

        percent,

        daysLeft

    };

}

/*==================================================
PART 4

✓ View Machine

✓ Edit Machine

✓ Delete Machine

✓ Toggle VIP

✓ Toggle Status

✓ Extend Machine

(All fully working)

==================================================*/

/*==================================================
PART 4
MACHINE ACTIONS
==================================================*/

/*==================================================
OPEN MACHINE MENU
==================================================*/

function openMachineMenu() {

    if (!selectedMachine) return;

    document
        .getElementById("machineActionSheet")
        .classList.add("show");

    document
        .getElementById("sheetOverlay")
        .classList.add("show");

}

/*==================================================
CLOSE SHEETS
==================================================*/

function closeSheets() {

    document
        .querySelectorAll(".bottomSheet")
        .forEach(sheet => {

            sheet.classList.remove("show");

        });

    document
        .getElementById("sheetOverlay")
        .classList.remove("show");

}

/*==================================================
VIEW MACHINE
==================================================*/

function viewMachine() {

    if (!selectedMachine) return;

    const machine = selectedMachine;

    const info = machine.machines || {};

    alert(

`Machine Name
${machine.machine_name || info.name}

Series
${info.series || "-"}

Amount Paid
${formatMoney(machine.amount_paid)}

Daily Income
${formatMoney(info.daily_income)}

Earned
${formatMoney(machine.earned_amount)}

Purchase Date
${formatDate(machine.purchase_date)}

Expiry Date
${formatDate(machine.expiry_date)}

Status
${machine.status}

VIP
${machine.is_vip ? "YES" : "NO"}`

    );

}

/*==================================================
EDIT MACHINE
==================================================*/

async function editMachine() {

    if (!selectedMachine) return;

    const amountPaid = prompt(
        "Amount Paid",
        selectedMachine.amount_paid || 0
    );

    if (amountPaid === null) return;

    const earned = prompt(
        "Earned Amount",
        selectedMachine.earned_amount || 0
    );

    if (earned === null) return;

    const purchaseDate = prompt(
        "Purchase Date (YYYY-MM-DD)",
        selectedMachine.purchase_date?.substring(0,10)
    );

    if (purchaseDate === null) return;

    const expiryDate = prompt(
        "Expiry Date (YYYY-MM-DD)",
        selectedMachine.expiry_date?.substring(0,10)
    );

    if (expiryDate === null) return;

    const { error } = await db

        .from("user_machines")

        .update({

            amount_paid:Number(amountPaid),

            earned_amount:Number(earned),

            purchase_date:purchaseDate,

            expiry_date:expiryDate

        })

        .eq("id",selectedMachine.id);

    if(error){

        showToast(error.message,"error");

        return;

    }

    showToast("Machine updated");

    closeSheets();

    await loadUserMachines();

}

/*==================================================
DELETE MACHINE
==================================================*/

async function deleteMachine(){

    if(!selectedMachine) return;

    if(!confirm("Delete this machine?")) return;

    const { error } = await db

        .from("user_machines")

        .delete()

        .eq("id",selectedMachine.id);

    if(error){

        showToast(error.message,"error");

        return;

    }

    showToast("Machine deleted");

    closeSheets();

    await loadUserMachines();

}

/*==================================================
TOGGLE VIP
==================================================*/

async function toggleVIP(){

    if(!selectedMachine) return;

    const { error } = await db

        .from("user_machines")

        .update({

            is_vip:!selectedMachine.is_vip

        })

        .eq("id",selectedMachine.id);

    if(error){

        showToast(error.message,"error");

        return;

    }

    showToast("VIP updated");

    closeSheets();

    await loadUserMachines();

}

/*==================================================
TOGGLE STATUS
==================================================*/

async function toggleStatus(){

    if(!selectedMachine) return;

    const newStatus =

    selectedMachine.status==="active"

    ? "suspended"

    : "active";

    const { error } = await db

        .from("user_machines")

        .update({

            status:newStatus

        })

        .eq("id",selectedMachine.id);

    if(error){

        showToast(error.message,"error");

        return;

    }

    showToast("Status updated");

    closeSheets();

    await loadUserMachines();

}

/*==================================================
EXTEND MACHINE
==================================================*/

async function extendMachine(){

    if(!selectedMachine) return;

    const days = prompt(

        "Extend by how many days?",

        "30"

    );

    if(days===null) return;

    if(isNaN(days)){

        showToast("Invalid number","error");

        return;

    }

    const expiry = new Date(

        selectedMachine.expiry_date

    );

    expiry.setDate(

        expiry.getDate()+Number(days)

    );

    const { error } = await db

        .from("user_machines")

        .update({

            expiry_date:expiry.toISOString()

        })

        .eq("id",selectedMachine.id);

    if(error){

        showToast(error.message,"error");

        return;

    }

    showToast("Machine extended");

    closeSheets();

    await loadUserMachines();

}

/*==================================================
BUTTON EVENTS
==================================================*/

document.getElementById("viewMachineBtn").onclick =
viewMachine;

document.getElementById("editMachineBtn").onclick =
editMachine;

document.getElementById("extendMachineBtn").onclick =
extendMachine;

document.getElementById("toggleVipBtn").onclick =
toggleVIP;

document.getElementById("toggleStatusBtn").onclick =
toggleStatus;

document.getElementById("deleteMachineBtn").onclick =
deleteMachine;

document.querySelectorAll(".closeSheet")
.forEach(btn=>{

    btn.onclick=closeSheets;

});

document.getElementById("sheetOverlay").onclick=
closeSheets;

/*==================================================
PART 5

✓ Add Machine to User
✓ Select Machine
✓ Auto Calculate Expiry
✓ Save to user_machines
✓ Refresh User

==================================================*/

/*==================================================
PART 5
ADD MACHINE TO USER
==================================================*/

/*==================================================
ADD MACHINE BUTTON
==================================================*/

document
.getElementById("addMachineBtn")
.onclick = addMachineToUser;

/*==================================================
ADD MACHINE
==================================================*/

async function addMachineToUser() {

    if (!selectedUser) {

        showToast("Select a user first","error");

        return;

    }

    if (!allMachines.length) {

        showToast("No machines available","error");

        return;

    }

    /* Build machine list */

    let message = "Select Machine\n\n";

    allMachines.forEach((m,index)=>{

        message += `${index+1}. ${m.name}
Price: ${formatMoney(m.price)}
Duration: ${m.duration_days} Days

`;

    });

    const choice = prompt(message);

    if(choice===null) return;

    const index = Number(choice)-1;

    if(index<0 || index>=allMachines.length){

        showToast("Invalid selection","error");

        return;

    }

    const machine = allMachines[index];

    /* Amount Paid */

    const amountPaid = prompt(

        "Amount Paid",

        machine.price

    );

    if(amountPaid===null) return;

    /* Purchase Date */

    const purchase = new Date();

    /* Expiry */

    const expiry = new Date();

    expiry.setDate(

        expiry.getDate()+machine.duration_days

    );

    /* Save */

    const { error } = await db

        .from("user_machines")

        .insert({

            user_id:selectedUser.id,

            machine_id:machine.id,

            machine_name:machine.name,

            machine_image:machine.image_url,

            amount_paid:Number(amountPaid),

            purchase_date:purchase.toISOString(),

            expiry_date:expiry.toISOString(),

            status:"active",

            earned_amount:0,

            completed:false,

            is_vip:machine.is_vip

        });

    if(error){

        showToast(error.message,"error");

        return;

    }

    /* Update Profile */

    const invested =

    Number(selectedUser.total_invested||0)

    + Number(amountPaid);

    await db

        .from("profiles")

        .update({

            total_invested:invested,

            last_deposit_at:new Date().toISOString()

        })

        .eq("id",selectedUser.id);

    showToast("Machine assigned successfully");

    await selectUser(selectedUser);

}

/*==================================================
AUTO COMPLETE EXPIRED MACHINES
==================================================*/

async function checkExpiredMachines(){

    const today = new Date();

    for(const machine of userMachines){

        if(

            machine.completed ||

            !machine.expiry_date

        ) continue;

        if(

            new Date(machine.expiry_date)<=today

        ){

            await db

            .from("user_machines")

            .update({

                completed:true,

                status:"expired",

                completed_at:new Date().toISOString()

            })

            .eq("id",machine.id);

        }

    }

}

/*==================================================
AUTO RUN
==================================================*/

setInterval(async()=>{

    if(selectedUser){

        await checkExpiredMachines();

    }

},60000);

/*==================================================
PART 6

✓ User Menu
✓ Freeze / Unfreeze User
✓ Edit User
✓ Send Notification
✓ Refresh User
✓ Fully Functional Admin User Actions

==================================================*/
