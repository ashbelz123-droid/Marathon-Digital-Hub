/*==================================================
ADMIN USER MACHINES
PART 1
==================================================*/

const db = window.supabase;

/*==================================================
GLOBAL VARIABLES
==================================================*/

let users = [];
let selectedUser = null;

let userMachines = [];
let userReferrals = [];
let userActivities = [];
let selectedMachine = null;

/*==================================================
ELEMENTS
==================================================*/

const usersContainer = document.getElementById("usersContainer");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const totalMachines = document.getElementById("totalMachines");
const vipUsers = document.getElementById("vipUsers");
const userCount = document.getElementById("userCount");

const emptyState = document.getElementById("emptyState");
const userDashboard = document.getElementById("userDashboard");

/* Profile */

const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userPhone = document.getElementById("userPhone");

const membershipBadge = document.getElementById("membershipBadge");
const statusBadge = document.getElementById("statusBadge");
const kycBadge = document.getElementById("kycBadge");

/* Overview */

const walletBalance = document.getElementById("walletBalance");
const totalInvested = document.getElementById("totalInvested");
const totalProfit = document.getElementById("totalProfit");
const ownedMachines = document.getElementById("ownedMachines");

/* Containers */

const machineList = document.getElementById("machineList");
const referralsList = document.getElementById("referralsList");
const activityList = document.getElementById("activityList");

/*==================================================
START
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    initializePage();

});

/*==================================================
INITIALIZE
==================================================*/

async function initializePage() {

    await loadUsers();

    registerEvents();

}

/*==================================================
LOAD USERS
==================================================*/

async function loadUsers() {

    try {

        const { data, error } = await db
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        users = data || [];

        updateStatistics();

        renderUsers(users);

    } catch (err) {

        console.error(err);

        showToast("Failed to load users", "error");

    }

}

/*==================================================
UPDATE STATISTICS
==================================================*/

function updateStatistics() {

    totalUsers.textContent = users.length;

    activeUsers.textContent =
        users.filter(u => u.account_status === "active").length;

    vipUsers.textContent =
        users.filter(u => u.membership === "VIP").length;

    userCount.textContent =
        `${users.length} Members`;

}

/*==================================================
PART 2

- Render users
- Search users
- Select user
- Fill profile automatically
==================================================*/

/*==================================================
RENDER USERS
==================================================*/

function renderUsers(list) {

    usersContainer.innerHTML = "";

    if (list.length === 0) {

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

        if (selectedUser && selectedUser.id === user.id) {
            card.classList.add("active");
        }

        card.innerHTML = `

            <img
                src="${user.avatar_url || 'images/default-avatar.png'}"
                alt="Avatar">

            <div class="userInfo">

                <h3>${user.fullname || "Unknown User"}</h3>

                <p>${user.phone || user.email || "-"}</p>

                <div class="userTags">

                    <span class="userTag">
                        ${user.membership || "Standard"}
                    </span>

                    <span class="userTag">
                        ${user.account_status || "Active"}
                    </span>

                </div>

            </div>

            <div class="userArrow">›</div>

        `;

        card.onclick = () => selectUser(user);

        usersContainer.appendChild(card);

    });

}

/*==================================================
SEARCH USERS
==================================================*/

function registerEvents() {

    searchBtn.onclick = searchUsers;

    searchInput.addEventListener("keyup", e => {

        if (e.key === "Enter") {

            searchUsers();

        }

    });

}

function searchUsers() {

    const keyword = searchInput.value.trim().toLowerCase();

    if (!keyword) {

        renderUsers(users);

        return;

    }

    const filtered = users.filter(user =>

        (user.fullname || "").toLowerCase().includes(keyword) ||

        (user.phone || "").toLowerCase().includes(keyword) ||

        (user.email || "").toLowerCase().includes(keyword)

    );

    renderUsers(filtered);

}

/*==================================================
SELECT USER
==================================================*/

async function selectUser(user) {

    selectedUser = user;

    renderUsers(users);

    emptyState.classList.add("hidden");

    userDashboard.classList.remove("hidden");

    fillUserProfile();

    await loadUserMachines();

    await loadUserReferrals();

    await loadUserActivity();

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
        selectedUser.membership || "Standard";

    statusBadge.textContent =
        selectedUser.account_status || "Active";

    kycBadge.textContent =
        selectedUser.kyc_status || "Not Verified";

    walletBalance.textContent =
        `UGX ${Number(selectedUser.wallet_balance || 0).toLocaleString()}`;

    totalInvested.textContent =
        `UGX ${Number(selectedUser.total_invested || 0).toLocaleString()}`;

    totalProfit.textContent =
        `UGX ${Number(selectedUser.total_profit || 0).toLocaleString()}`;

    ownedMachines.textContent = "0";

    /* Profile Tab */

    document.getElementById("profileEmail").textContent =
        selectedUser.email || "-";

    document.getElementById("profilePhone").textContent =
        selectedUser.phone || "-";

    document.getElementById("profileCountry").textContent =
        selectedUser.country || "-";

    document.getElementById("profileMembership").textContent =
        selectedUser.membership || "Standard";

    document.getElementById("profileKyc").textContent =
        selectedUser.kyc_status || "Not Verified";

    document.getElementById("profileLevel").textContent =
        selectedUser.level || 1;

    document.getElementById("profileStatus").textContent =
        selectedUser.account_status || "Active";

    document.getElementById("profileLastLogin").textContent =
        selectedUser.last_login || "-";

}

/*==================================================
PART 3

- Load user machines
- Render machine cards
- Machine filters
- Machine action menu
==================================================*/

/*==================================================
LOAD USER MACHINES
==================================================*/

async function loadUserMachines() {

    if (!selectedUser) return;

    try {

        const { data, error } = await db
            .from("user_machines")
            .select(`
                *,
                machines(*)
            `)
            .eq("user_id", selectedUser.id)
            .order("purchase_date", { ascending: false });

        if (error) throw error;

        userMachines = data || [];

        ownedMachines.textContent = userMachines.length;

        totalMachines.textContent = userMachines.length;

        renderMachines(userMachines);

    } catch (err) {

        console.error(err);

        showToast("Failed to load machines", "error");

    }

}

/*==================================================
RENDER MACHINES
==================================================*/

function renderMachines(list) {

    machineList.innerHTML = "";

    if (list.length === 0) {

        machineList.innerHTML = `
            <div class="emptyMessage">
                This user has not purchased any machine yet.
            </div>
        `;

        return;

    }

    list.forEach(machine => {

        const info = machine.machines || {};

        const progress = calculateProgress(
            machine.purchase_date,
            machine.expiry_date
        );

        const card = document.createElement("div");

        card.className = "machineCard";

        card.innerHTML = `

            <img
                class="machineImage"
                src="${machine.machine_image || info.image_url || 'images/default-machine.png'}">

            <div class="machineInfo">

                <h3>${machine.machine_name || info.name || "Machine"}</h3>

                <p>${info.series || "-"}</p>

                <div class="machineBadges">

                    <span class="machineBadge active">
                        ${machine.status || "Active"}
                    </span>

                    ${machine.is_vip ? `
                    <span class="machineBadge vip">
                        VIP
                    </span>` : ""}

                </div>

                <p>
                    Daily Income:
                    <strong>
                        UGX ${Number(info.daily_income || 0).toLocaleString()}
                    </strong>
                </p>

                <div class="machineProgress">

                    <span>${progress.remainingDays} Days Remaining</span>

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

        card.querySelector(".machineAction")
            .onclick = (e) => {

                e.stopPropagation();

                selectedMachine = machine;

                openMachineMenu();

            };

        card.onclick = () => {

            selectedMachine = machine;

            viewMachine();

        };

        machineList.appendChild(card);

    });

}

/*==================================================
FILTER MACHINES
==================================================*/

document.querySelectorAll(".filterButton").forEach(button => {

    button.onclick = () => {

        document.querySelectorAll(".filterButton")
            .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        const filter = button.dataset.filter;

        let filtered = [...userMachines];

        switch (filter) {

            case "active":
                filtered = filtered.filter(m => m.status === "active");
                break;

            case "vip":
                filtered = filtered.filter(m => m.is_vip === true);
                break;

            case "completed":
                filtered = filtered.filter(m => m.completed === true);
                break;

            case "expired":
                filtered = filtered.filter(m => m.status === "expired");
                break;

        }

        renderMachines(filtered);

    };

});

/*==================================================
PROGRESS
==================================================*/

function calculateProgress(start, end) {

    if (!start || !end) {

        return {
            percent: 0,
            remainingDays: 0
        };

    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();

    const total = endDate - startDate;
    const passed = today - startDate;

    let percent = (passed / total) * 100;

    percent = Math.max(0, Math.min(100, percent));

    const remaining = Math.max(
        0,
        Math.ceil((endDate - today) / 86400000)
    );

    return {

        percent,

        remainingDays: remaining

    };

}

/*==================================================
PART 4

- Machine menu
- Delete machine
- Toggle VIP
- Change status
- View machine
- Bottom sheets
- Toast notifications
==================================================*/

/*==================================================
MACHINE ACTIONS
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
VIEW MACHINE
==================================================*/

function viewMachine() {

    if (!selectedMachine) return;

    alert(
`Machine: ${selectedMachine.machine_name || selectedMachine.machines?.name}

Status: ${selectedMachine.status}

VIP: ${selectedMachine.is_vip ? "Yes" : "No"}

Earned:
UGX ${Number(selectedMachine.earned_amount || 0).toLocaleString()}

Purchase:
${selectedMachine.purchase_date}

Expiry:
${selectedMachine.expiry_date}`
    );

}

/*==================================================
DELETE MACHINE
==================================================*/

async function deleteMachine() {

    if (!selectedMachine) return;

    const confirmDelete = confirm(
        "Delete this machine permanently?"
    );

    if (!confirmDelete) return;

    try {

        const { error } = await db

            .from("user_machines")

            .delete()

            .eq("id", selectedMachine.id);

        if (error) throw error;

        closeSheets();

        showToast(
            "Machine deleted",
            "success"
        );

        loadUserMachines();

    } catch (err) {

        console.error(err);

        showToast(
            err.message,
            "error"
        );

    }

}

/*==================================================
TOGGLE VIP
==================================================*/

async function toggleVIP() {

    if (!selectedMachine) return;

    try {

        const { error } = await db

            .from("user_machines")

            .update({

                is_vip: !selectedMachine.is_vip

            })

            .eq("id", selectedMachine.id);

        if (error) throw error;

        closeSheets();

        showToast(
            "VIP updated",
            "success"
        );

        loadUserMachines();

    } catch (err) {

        showToast(
            err.message,
            "error"
        );

    }

}

/*==================================================
CHANGE STATUS
==================================================*/

async function toggleStatus() {

    if (!selectedMachine) return;

    const newStatus =

        selectedMachine.status === "active"

        ? "suspended"

        : "active";

    try {

        const { error } = await db

            .from("user_machines")

            .update({

                status: newStatus

            })

            .eq("id", selectedMachine.id);

        if (error) throw error;

        closeSheets();

        showToast(
            "Status updated",
            "success"
        );

        loadUserMachines();

    } catch (err) {

        showToast(
            err.message,
            "error"
        );

    }

}

/*==================================================
BOTTOM SHEETS
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
TOAST
==================================================*/

function showToast(message, type = "success") {

    const toast =
        document.getElementById("toast");

    toast.textContent = message;

    toast.className =
        `toast show ${type}`;

    setTimeout(() => {

        toast.className = "toast";

    }, 3000);

}

/*==================================================
BUTTON EVENTS
==================================================*/

document
.getElementById("deleteMachineBtn")
.onclick = deleteMachine;

document
.getElementById("toggleVipBtn")
.onclick = toggleVIP;

document
.getElementById("toggleStatusBtn")
.onclick = toggleStatus;

document
.querySelectorAll(".closeSheet")
.forEach(btn => {

    btn.onclick = closeSheets;

});

document
.getElementById("sheetOverlay")
.onclick = closeSheets;

document
.getElementById("fab")
.onclick = () => {

    document
        .getElementById("quickActionSheet")
        .classList.add("show");

    document
        .getElementById("sheetOverlay")
        .classList.add("show");

};

document
.getElementById("menuBtn")
.onclick = () => {

    document
        .getElementById("menuSheet")
        .classList.add("show");

    document
        .getElementById("sheetOverlay")
        .classList.add("show");

};

/*==================================================
END OF ADMIN USER MACHINES
VERSION 1
==================================================*/
