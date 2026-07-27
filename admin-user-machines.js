/*==================================================
ADMIN USER MACHINES
PART 1
==================================================*/

/*==================================================
SUPABASE
==================================================*/

const db = window.supabaseClient;

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

/* Search */

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

/* User List */

const usersContainer = document.getElementById("usersContainer");

/* Empty State */

const emptyState = document.getElementById("emptyState");

/* Dashboard */

const userDashboard = document.getElementById("userDashboard");

/* Statistics */

const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const totalMachines = document.getElementById("totalMachines");
const vipUsers = document.getElementById("vipUsers");
const userCount = document.getElementById("userCount");

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

    initialize();

});

/*==================================================
INITIALIZE
==================================================*/

async function initialize() {

    try {

        await loadUsers();

        setupEvents();

    } catch (err) {

        console.error(err);

        showToast(err.message, "error");

    }

}

/*==================================================
LOAD USERS
==================================================*/

async function loadUsers() {

    const { data, error } = await db

        .from("profiles")

        .select("*")

        .order("created_at", {

            ascending: false

        });

    if (error) throw error;

    users = data || [];

    updateStatistics();

    renderUsers(users);

}

/*==================================================
UPDATE STATISTICS
==================================================*/

function updateStatistics() {

    totalUsers.textContent = users.length;

    activeUsers.textContent = users.filter(user =>
        user.account_status === "active"
    ).length;

    vipUsers.textContent = users.filter(user =>
        user.membership === "VIP"
    ).length;

    userCount.textContent = `${users.length} Members`;

}

/*==================================================
EVENTS
==================================================*/

function setupEvents() {

    searchBtn.onclick = searchUsers;

    searchInput.addEventListener("keyup", e => {

        if (e.key === "Enter") {

            searchUsers();

        }

    });

}

/*==================================================
PLACEHOLDERS
(PART 2)
==================================================*/

function renderUsers() {}

function searchUsers() {}

function selectUser() {}

function showToast(message, type = "success") {

    console.log(type.toUpperCase(), message);

}

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

        if (selectedUser && selectedUser.id === user.id) {
            card.classList.add("active");
        }

        card.innerHTML = `

            <img
                src="${user.avatar_url || "images/default-avatar.png"}"
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

            <div class="userArrow">
                ›
            </div>

        `;

        card.onclick = () => selectUser(user);

        usersContainer.appendChild(card);

    });

}

/*==================================================
SEARCH USERS
==================================================*/

function searchUsers() {

    const keyword = searchInput.value
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

    selectedUser = user;

    renderUsers(users);

    emptyState.classList.add("hidden");

    userDashboard.classList.remove("hidden");

    fillUserProfile();

    try {

        await loadUserMachines();

        await loadUserReferrals();

        await loadUserActivity();

    } catch (err) {

        console.error(err);

    }

}

/*==================================================
FILL USER PROFILE
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

    document.getElementById("profileCountry").textContent =
        selectedUser.country || "-";

    document.getElementById("profileMembership").textContent =
        selectedUser.membership || "Standard";

    document.getElementById("profileKyc").textContent =
        selectedUser.kyc_status || "Not Verified";

    document.getElementById("profileLevel").textContent =
        selectedUser.level || "1";

    document.getElementById("profileLastLogin").textContent =
        selectedUser.last_login || "-";

                                  }

/*==================================================
PART 3
LOAD & RENDER USER MACHINES
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

            .order("purchase_date", {
                ascending: false
            });

        if (error) throw error;

        userMachines = data || [];

        ownedMachines.textContent = userMachines.length;

        totalMachines.textContent = userMachines.length;

        renderMachines(userMachines);

    } catch (err) {

        console.error(err);

        showToast("Failed to load user machines", "error");

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

        const progress = getProgress(
            machine.purchase_date,
            machine.expiry_date
        );

        const card = document.createElement("div");

        card.className = "machineCard";

        card.innerHTML = `

            <img
                class="machineImage"
                src="${machine.machine_image || info.image_url || "images/default-machine.png"}">

            <div class="machineInfo">

                <h3>
                    ${machine.machine_name || info.name || "Machine"}
                </h3>

                <p>
                    ${info.series || "Series"}
                </p>

                <div class="machineBadges">

                    <span class="machineBadge active">

                        ${machine.status || "active"}

                    </span>

                    ${machine.is_vip ? `
                    <span class="machineBadge vip">

                        VIP

                    </span>
                    ` : ""}

                </div>

                <p>

                    Daily Income

                    <strong>

                        UGX ${Number(info.daily_income || 0).toLocaleString()}

                    </strong>

                </p>

                <div class="machineProgress">

                    <span>

                        ${progress.remainingDays} Days Remaining

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

        card.onclick = () => {

            selectedMachine = machine;

            viewMachine();

        };

        card.querySelector(".machineAction").onclick = (e) => {

            e.stopPropagation();

            selectedMachine = machine;

            openMachineMenu();

        };

        machineList.appendChild(card);

    });

}

/*==================================================
FILTER BUTTONS
==================================================*/

document.querySelectorAll(".filterButton").forEach(btn => {

    btn.onclick = () => {

        document.querySelectorAll(".filterButton")
            .forEach(button => button.classList.remove("active"));

        btn.classList.add("active");

        const filter = btn.dataset.filter;

        let filtered = [...userMachines];

        switch (filter) {

            case "active":

                filtered = filtered.filter(m =>
                    m.status === "active"
                );

                break;

            case "vip":

                filtered = filtered.filter(m =>
                    m.is_vip === true
                );

                break;

            case "completed":

                filtered = filtered.filter(m =>
                    m.completed === true
                );

                break;

            case "expired":

                filtered = filtered.filter(m =>
                    m.status === "expired"
                );

                break;

        }

        renderMachines(filtered);

    };

});

/*==================================================
PROGRESS
==================================================*/

function getProgress(start, end) {

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

Machine Menu

Delete Machine

VIP Toggle

Status Toggle

View Machine

Bottom Sheets

Toast
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
VIEW MACHINE
==================================================*/

function viewMachine() {

    if (!selectedMachine) return;

    const machine = selectedMachine;
    const info = machine.machines || {};

    alert(

`Machine:
${machine.machine_name || info.name}

Series:
${info.series || "-"}

Status:
${machine.status}

VIP:
${machine.is_vip ? "Yes" : "No"}

Daily Income:
UGX ${Number(info.daily_income || 0).toLocaleString()}

Earned:
UGX ${Number(machine.earned_amount || 0).toLocaleString()}

Purchase:
${machine.purchase_date || "-"}

Expiry:
${machine.expiry_date || "-"}`

    );

}

/*==================================================
DELETE MACHINE
==================================================*/

async function deleteMachine() {

    if (!selectedMachine) return;

    if (!confirm("Delete this machine?")) return;

    try {

        const { error } = await db

            .from("user_machines")

            .delete()

            .eq("id", selectedMachine.id);

        if (error) throw error;

        closeSheets();

        showToast("Machine deleted");

        await loadUserMachines();

    }

    catch (err) {

        console.error(err);

        showToast(err.message, "error");

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

        showToast("VIP updated");

        await loadUserMachines();

    }

    catch (err) {

        showToast(err.message, "error");

    }

}

/*==================================================
CHANGE STATUS
==================================================*/

async function toggleStatus() {

    if (!selectedMachine) return;

    const status =

        selectedMachine.status === "active"

        ? "suspended"

        : "active";

    try {

        const { error } = await db

            .from("user_machines")

            .update({

                status: status

            })

            .eq("id", selectedMachine.id);

        if (error) throw error;

        closeSheets();

        showToast("Status updated");

        await loadUserMachines();

    }

    catch (err) {

        showToast(err.message, "error");

    }

}

/*==================================================
EDIT MACHINE
==================================================*/

function editMachine() {

    showToast("Edit Machine screen coming next.");

}

/*==================================================
EXTEND MACHINE
==================================================*/

function extendMachine() {

    showToast("Extend Machine screen coming next.");

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
BUTTON EVENTS
==================================================*/

document
.getElementById("viewMachineBtn")
.onclick = viewMachine;

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
.getElementById("editMachineBtn")
.onclick = editMachine;

document
.getElementById("extendMachineBtn")
.onclick = extendMachine;

document
.querySelectorAll(".closeSheet")
.forEach(btn => {

    btn.onclick = closeSheets;

});

document
.getElementById("sheetOverlay")
.onclick = closeSheets;

/*==================================================
PART 5
REFERRALS
==================================================*/

async function loadUserReferrals() {

    if (!selectedUser) return;

    try {

        const { data, error } = await db

            .from("profiles")

            .select("*")

            .eq("referred_by", selectedUser.referral_code)

            .order("created_at", {
                ascending: false
            });

        if (error) throw error;

        userReferrals = data || [];

        document.getElementById("referralCount").textContent =
            `${userReferrals.length} Users`;

        renderReferrals(userReferrals);

    }

    catch (err) {

        console.error(err);

        showToast(err.message, "error");

    }

}

/*==================================================
RENDER REFERRALS
==================================================*/

function renderReferrals(list) {

    referralsList.innerHTML = "";

    if (!list.length) {

        referralsList.innerHTML = `

        <div class="emptyMessage">

            No referrals yet.

        </div>

        `;

        return;

    }

    list.forEach(ref => {

        const card = document.createElement("div");

        card.className = "referralCard";

        card.innerHTML = `

            <img
                class="referralAvatar"
                src="${ref.avatar_url || "images/default-avatar.png"}">

            <div class="referralInfo">

                <h4>

                    ${ref.fullname || "Unknown User"}

                </h4>

                <p>

                    ${ref.phone || ref.email || "-"}

                </p>

                <p>

                    Referral Bonus

                    <strong>

                        UGX ${Number(ref.referral_bonus || 0).toLocaleString()}

                    </strong>

                </p>

            </div>

            <div>

                <span class="referralStatus">

                    ${ref.kyc_status || "Not Verified"}

                </span>

                <br><br>

                <button
                    class="primaryButton editReferralBonus"
                    data-id="${ref.id}">

                    Edit Bonus

                </button>

            </div>

        `;

        referralsList.appendChild(card);

    });

    document

        .querySelectorAll(".editReferralBonus")

        .forEach(btn => {

            btn.onclick = () => {

                editReferralBonus(btn.dataset.id);

            };

        });

}

/*==================================================
EDIT REFERRAL BONUS
==================================================*/

async function editReferralBonus(userId) {

    const user = userReferrals.find(u => u.id === userId);

    if (!user) return;

    const amount = prompt(

        "Enter new referral bonus",

        user.referral_bonus || 0

    );

    if (amount === null) return;

    if (isNaN(amount)) {

        showToast("Invalid amount", "error");

        return;

    }

    try {

        const { error } = await db

            .from("profiles")

            .update({

                referral_bonus: Number(amount)

            })

            .eq("id", userId);

        if (error) throw error;

        showToast("Referral bonus updated");

        await loadUserReferrals();

    }

    catch (err) {

        console.error(err);

        showToast(err.message, "error");

    }

}

/*==================================================
PART 6
ACTIVITY + UI
==================================================*/

/*==================================================
LOAD USER ACTIVITY
==================================================*/

async function loadUserActivity() {

    if (!selectedUser) return;

    try {

        const { data, error } = await db

            .from("activity_logs")

            .select("*")

            .eq("user_id", selectedUser.id)

            .order("created_at", {

                ascending: false

            })

            .limit(50);

        if (error) throw error;

        userActivities = data || [];

        renderActivity(userActivities);

    }

    catch {

        activityList.innerHTML = `
        <div class="emptyMessage">
            No activity found.
        </div>
        `;
    }

}

/*==================================================
RENDER ACTIVITY
==================================================*/

function renderActivity(list) {

    activityList.innerHTML = "";

    if (!list.length) {

        activityList.innerHTML = `
        <div class="emptyMessage">
            No activity available.
        </div>
        `;

        return;

    }

    list.forEach(item => {

        activityList.innerHTML += `

        <div class="activityCard">

            <div class="activityIcon">
                📌
            </div>

            <div class="activityBody">

                <h4>${item.title || "Activity"}</h4>

                <p>${item.description || ""}</p>

                <div class="activityTime">

                    ${new Date(item.created_at)
                        .toLocaleString()}

                </div>

            </div>

        </div>

        `;

    });

}

/*==================================================
TABS
==================================================*/

document.querySelectorAll(".tabButton").forEach(btn => {

    btn.onclick = () => {

        document.querySelectorAll(".tabButton")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        document.querySelectorAll(".tabContent")
            .forEach(tab => tab.classList.remove("active"));

        document
            .getElementById(btn.dataset.tab)
            .classList.add("active");

    };

});

/*==================================================
TOAST
==================================================*/

function showToast(message, type = "success") {

    const toast = document.getElementById("toast");

    toast.className = "toast";

    toast.classList.add(type);

    toast.classList.add("show");

    document.getElementById("toastMessage").textContent = message;

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}

/*==================================================
REFRESH
==================================================*/

document.getElementById("refreshBtn").onclick = async () => {

    await loadUsers();

    if (selectedUser) {

        await selectUser(selectedUser);

    }

    showToast("Refreshed");

};

/*==================================================
FAB
==================================================*/

document.getElementById("fab").onclick = () => {

    document
        .getElementById("quickActionSheet")
        .classList.add("show");

    document
        .getElementById("sheetOverlay")
        .classList.add("show");

};

/*==================================================
MENU
==================================================*/

document.getElementById("menuBtn").onclick = () => {

    document
        .getElementById("menuSheet")
        .classList.add("show");

    document
        .getElementById("sheetOverlay")
        .classList.add("show");

};

/*==================================================
MENU LINKS
==================================================*/

document.querySelectorAll("[data-page]").forEach(btn => {

    btn.onclick = () => {

        location.href = btn.dataset.page;

    };

});

/*==================================================
LOGOUT
==================================================*/

document.getElementById("logoutBtn").onclick = async () => {

    const ok = confirm("Logout?");

    if (!ok) return;

    await db.auth.signOut();

    location.href = "login.html";

};

/*==================================================
QUICK ACTIONS
==================================================*/

document.getElementById("creditWalletBtn").onclick = () => {

    showToast("Wallet management removed.");

};

document.getElementById("debitWalletBtn").onclick = () => {

    showToast("Wallet management removed.");

};

document.getElementById("sendNotificationBtn").onclick = () => {

    showToast("Notification feature coming soon.");

};

document.getElementById("refreshUserBtn").onclick = async () => {

    if (!selectedUser) return;

    await selectUser(selectedUser);

    showToast("User refreshed");

};

/*==================================================
FINISHED
==================================================*/
