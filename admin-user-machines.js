/*==================================================
ADMIN USER MACHINES V6
PART 1 - FOUNDATION
==================================================*/

const db = window.supabaseClient;

/*==================================================
GLOBAL STATE
==================================================*/

let users = [];
let selectedUser = null;
let userMachines = [];
let walletTransactions = [];
let referrals = [];
let activities = [];
let currentMachine = null;

/*==================================================
DOM ELEMENTS
==================================================*/

// Search
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// Header
const refreshBtn = document.getElementById("refreshBtn");
const notificationBtn = document.getElementById("notificationBtn");
const menuBtn = document.getElementById("menuBtn");

// Statistics
const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const totalMachines = document.getElementById("totalMachines");
const vipUsers = document.getElementById("vipUsers");
const userCount = document.getElementById("userCount");

// User List
const usersContainer = document.getElementById("usersContainer");

// Dashboard
const emptyState = document.getElementById("emptyState");
const userDashboard = document.getElementById("userDashboard");

// Profile
const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userPhone = document.getElementById("userPhone");

const membershipBadge = document.getElementById("membershipBadge");
const statusBadge = document.getElementById("statusBadge");
const kycBadge = document.getElementById("kycBadge");

// Overview
const walletBalance = document.getElementById("walletBalance");
const totalInvested = document.getElementById("totalInvested");
const totalProfit = document.getElementById("totalProfit");
const ownedMachines = document.getElementById("ownedMachines");

// Wallet Tab
const walletTabBalance = document.getElementById("walletTabBalance");
const walletTabInvested = document.getElementById("walletTabInvested");
const walletTabProfit = document.getElementById("walletTabProfit");
const walletTabReferral = document.getElementById("walletTabReferral");

// Lists
const machineList = document.getElementById("machineList");
const walletTransactionsBox = document.getElementById("walletTransactions");
const referralsList = document.getElementById("referralsList");
const activityList = document.getElementById("activityList");

// Profile Tab
const profileEmail = document.getElementById("profileEmail");
const profileCountry = document.getElementById("profileCountry");
const profileMembership = document.getElementById("profileMembership");
const profileKyc = document.getElementById("profileKyc");
const profileLevel = document.getElementById("profileLevel");
const profileLastLogin = document.getElementById("profileLastLogin");

// Bottom Sheets
const menuSheet = document.getElementById("menuSheet");
const quickActionSheet = document.getElementById("quickActionSheet");
const machineActionSheet = document.getElementById("machineActionSheet");
const sheetOverlay = document.getElementById("sheetOverlay");

// FAB
const fab = document.getElementById("fab");

// Toast
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

/*==================================================
START APPLICATION
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    initialiseEvents();

    loadUsers();

});

/*==================================================
INITIALISE EVENTS
==================================================*/

function initialiseEvents() {

    searchBtn.addEventListener("click", searchUsers);

    searchInput.addEventListener("keyup", e => {

        if (e.key === "Enter") {

            searchUsers();

        }

    });

    refreshBtn.addEventListener("click", () => {

        loadUsers();

        showToast("Refreshing users...");

    });

}

/*==================================================
HELPERS
==================================================*/

function formatMoney(amount) {

    return `UGX ${Number(amount || 0).toLocaleString()}`;

}

function formatDate(date) {

    if (!date) return "-";

    return new Date(date).toLocaleDateString();

}

/*==================================================
TOAST
==================================================*/

function showToast(message, type = "success") {

    toast.className = "toast";

    toast.classList.add(type);

    toast.classList.add("show");

    toastMessage.textContent = message;

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}

/*==================================================
PART 2 STARTS BELOW
==================================================*/

/*==================================================
PART 2
LOAD USERS • SEARCH • STATISTICS
==================================================*/

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

    } catch (error) {

        console.error(error);

        showToast("Failed to load users", "error");

    }

}

/*==================================================
UPDATE DASHBOARD STATISTICS
==================================================*/

async function updateStatistics() {

    totalUsers.textContent = users.length;

    activeUsers.textContent =
        users.filter(user =>
            (user.account_status || "").toLowerCase() === "active"
        ).length;

    vipUsers.textContent =
        users.filter(user =>
            (user.membership || "").toLowerCase() === "vip"
        ).length;

    userCount.textContent =
        `${users.length} Members`;

    try {

        const { count, error } = await db
            .from("user_machines")
            .select("*", {
                head: true,
                count: "exact"
            });

        if (!error) {

            totalMachines.textContent = count || 0;

        }

    } catch {

        totalMachines.textContent = "0";

    }

}

/*==================================================
RENDER USER LIST
==================================================*/

function renderUsers(list) {

    usersContainer.innerHTML = "";

    if (!list.length) {

        usersContainer.innerHTML = `

            <div class="emptyMessage">

                <h3>No Users Found</h3>

                <p>Try another search.</p>

            </div>

        `;

        return;

    }

    list.forEach(user => {

        const card = document.createElement("div");

        card.className = "userCard";

        card.innerHTML = `

            <img
                src="${user.avatar_url || "images/default-avatar.png"}"
                alt="${user.fullname}"
            >

            <div class="userInfo">

                <h3>${user.fullname}</h3>

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

        card.addEventListener("click", () => {

            openUser(user);

        });

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

    const filtered = users.filter(user => {

        return (

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

            ||

            (user.referral_code || "")
                .toLowerCase()
                .includes(keyword)

        );

    });

    renderUsers(filtered);

}

/*==================================================
OPEN USER
==================================================*/

function openUser(user) {

    selectedUser = user;

    emptyState.classList.add("hidden");

    userDashboard.classList.remove("hidden");

    loadUserProfile();

            }

/*==================================================
PART 3
LOAD USER PROFILE & OVERVIEW
==================================================*/

async function loadUserProfile() {

    if (!selectedUser) return;

    try {

        /*==============================
        PROFILE CARD
        ==============================*/

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

        /*==============================
        OVERVIEW CARDS
        ==============================*/

        walletBalance.textContent =
            formatMoney(selectedUser.wallet_balance);

        totalInvested.textContent =
            formatMoney(selectedUser.total_invested);

        totalProfit.textContent =
            formatMoney(selectedUser.total_profit);

        /*==============================
        WALLET TAB
        ==============================*/

        walletTabBalance.textContent =
            formatMoney(selectedUser.wallet_balance);

        walletTabInvested.textContent =
            formatMoney(selectedUser.total_invested);

        walletTabProfit.textContent =
            formatMoney(selectedUser.total_profit);

        walletTabReferral.textContent =
            formatMoney(selectedUser.total_referral_bonus);

        /*==============================
        PROFILE TAB
        ==============================*/

        profileEmail.textContent =
            selectedUser.email || "-";

        profileCountry.textContent =
            selectedUser.country || "-";

        profileMembership.textContent =
            selectedUser.membership || "Standard";

        profileKyc.textContent =
            selectedUser.kyc_status || "Not Verified";

        profileLevel.textContent =
            selectedUser.level || 1;

        profileLastLogin.textContent =
            formatDate(selectedUser.last_login);

        /*==============================
        LOAD USER DATA
        ==============================*/

        await loadUserMachines();

        await loadWalletTransactions();

        await loadReferrals();

        await loadActivity();

    }

    catch (error) {

        console.error(error);

        showToast("Failed to load profile", "error");

    }

}

/*==================================================
LOAD USER MACHINES
==================================================*/

async function loadUserMachines() {

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

    if (error) {

        console.error(error);

        return;

    }

    userMachines = data || [];

    ownedMachines.textContent =
        userMachines.length;

    renderMachineList(userMachines);

}

/*==================================================
PLACEHOLDER FUNCTIONS
(Completed in Part 4)
==================================================*/

async function loadWalletTransactions() {

    walletTransactionsBox.innerHTML = "";

}

async function loadReferrals() {

    referralsList.innerHTML = "";

}

async function loadActivity() {

    activityList.innerHTML = "";

            }

/*==================================================
PART 4
RENDER MACHINES + FILTERS + TABS
==================================================*/

/*==================================================
RENDER MACHINE LIST
==================================================*/

function renderMachineList(list) {

    machineList.innerHTML = "";

    if (!list.length) {

        machineList.innerHTML = `

            <div class="emptyMessage">

                <h3>No Machines</h3>

                <p>This user has not purchased any machine.</p>

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
                src="${machine.machine_image || info.image_url || "images/default-machine.png"}"
            >

            <div class="machineInfo">

                <h3>

                    ${machine.machine_name || info.name || "Machine"}

                </h3>

                <p>

                    ${info.series || "-"}

                </p>

                <div class="machineBadges">

                    <span class="machineBadge active">

                        ${machine.status}

                    </span>

                    ${machine.is_vip ?

                        `<span class="machineBadge vip">

                            VIP

                        </span>`

                    : ""}

                </div>

                <p>

                    Daily Income:
                    <b>${formatMoney(info.daily_income)}</b>

                </p>

                <p>

                    Earned:
                    <b>${formatMoney(machine.earned_amount)}</b>

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

        card.querySelector(".machineAction")
            .addEventListener("click", e => {

                e.stopPropagation();

                currentMachine = machine;

                openSheet(machineActionSheet);

            });

        machineList.appendChild(card);

    });

}

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

    percent = Math.max(
        0,
        Math.min(100, percent)
    );

    const remainingDays = Math.max(
        0,
        Math.ceil(
            (endDate - today) / 86400000
        )
    );

    return {

        percent,

        remainingDays

    };

}

/*==================================================
FILTER BUTTONS
==================================================*/

document
.querySelectorAll(".filterButton")
.forEach(button => {

    button.onclick = () => {

        document
        .querySelectorAll(".filterButton")
        .forEach(btn => {

            btn.classList.remove("active");

        });

        button.classList.add("active");

        const filter = button.dataset.filter;

        let list = userMachines;

        if (filter === "active") {

            list = userMachines.filter(
                m => m.status === "active"
            );

        }

        if (filter === "vip") {

            list = userMachines.filter(
                m => m.is_vip
            );

        }

        if (filter === "completed") {

            list = userMachines.filter(
                m => m.completed
            );

        }

        if (filter === "expired") {

            list = userMachines.filter(m => {

                return new Date(m.expiry_date)
                    < new Date();

            });

        }

        renderMachineList(list);

    };

});

/*==================================================
TAB SWITCHING
==================================================*/

document
.querySelectorAll(".tabButton")
.forEach(button => {

    button.onclick = () => {

        document
        .querySelectorAll(".tabButton")
        .forEach(btn => {

            btn.classList.remove("active");

        });

        document
        .querySelectorAll(".tabContent")
        .forEach(tab => {

            tab.classList.remove("active");

        });

        button.classList.add("active");

        document
        .getElementById(button.dataset.tab)
        .classList.add("active");

    };

});

/*==================================================
PART 5 STARTS BELOW
==================================================*/
