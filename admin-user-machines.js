/*==================================================
ADMIN USER MACHINES V5
Part 1 - Setup & Initialisation
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

// User List
const usersContainer = document.getElementById("usersContainer");
const emptyState = document.getElementById("emptyState");
const userDashboard = document.getElementById("userDashboard");

// Statistics
const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const totalMachines = document.getElementById("totalMachines");
const vipUsers = document.getElementById("vipUsers");
const userCount = document.getElementById("userCount");

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

// Containers
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

// Toast
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

// Sheets
const sheetOverlay = document.getElementById("sheetOverlay");
const machineActionSheet = document.getElementById("machineActionSheet");
const quickActionSheet = document.getElementById("quickActionSheet");
const menuSheet = document.getElementById("menuSheet");

/*==================================================
APP START
==================================================*/

document.addEventListener("DOMContentLoaded", async () => {

    initialiseEvents();

    await loadUsers();

});

/*==================================================
INITIALISE EVENTS
==================================================*/

function initialiseEvents() {

    if (searchBtn) {

        searchBtn.addEventListener("click", searchUsers);

    }

    if (searchInput) {

        searchInput.addEventListener("keyup", e => {

            if (e.key === "Enter") {

                searchUsers();

            }

        });

    }

}

/*==================================================
HELPERS
==================================================*/

function formatMoney(value) {

    return `UGX ${Number(value || 0).toLocaleString()}`;

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
PLACEHOLDER
Part 2
==================================================*/

/*==================================================
PART 2 - LOAD USERS & USER LIST
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
UPDATE STATISTICS
==================================================*/

async function updateStatistics() {

    totalUsers.textContent = users.length;

    activeUsers.textContent =
        users.filter(user => user.account_status === "active").length;

    vipUsers.textContent =
        users.filter(user => user.membership === "VIP").length;

    userCount.textContent =
        `${users.length} Members`;

    try {

        const { count } = await db
            .from("user_machines")
            .select("*", {
                count: "exact",
                head: true
            });

        totalMachines.textContent = count || 0;

    } catch {

        totalMachines.textContent = "0";

    }

}

/*==================================================
RENDER USERS
==================================================*/

function renderUsers(list) {

    usersContainer.innerHTML = "";

    if (!list.length) {

        usersContainer.innerHTML = `
            <div class="emptyMessage">

                <h3>No users found</h3>

                <p>No member matches your search.</p>

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

