/*========================================
ADMIN USER MACHINES
PART 1
========================================*/

const db = window.supabaseClient;

/*========================================
ADMIN PROTECTION
========================================*/

if (localStorage.getItem("admin_logged_in") !== "true") {
    window.location.href = "admin-login.html";
}

document.getElementById("adminName").textContent =
    localStorage.getItem("admin_name") || "Administrator";

document.getElementById("adminRole").textContent =
    localStorage.getItem("admin_role") || "Admin";

/*========================================
GLOBAL VARIABLES
========================================*/

let users = [];
let filteredUsers = [];

let selectedUser = null;
let selectedMachine = null;

let currentFilter = "all";

const USERS_PER_PAGE = 20;

let currentPage = 0;

/*========================================
PAGE LOAD
========================================*/

document.addEventListener("DOMContentLoaded", async () => {

    await loadDashboardStats();

    await loadUsers();

});

/*========================================
LOAD DASHBOARD STATS
========================================*/

async function loadDashboardStats() {

    /* Total Users */

    const { count: totalUsers } = await db
        .from("profiles")
        .select("*", { count: "exact", head: true });

    document.getElementById("totalUsers").textContent =
        totalUsers || 0;

    /* Purchased Machines */

    const { count: totalMachines } = await db
        .from("user_machines")
        .select("*", { count: "exact", head: true });

    document.getElementById("totalUserMachines").textContent =
        totalMachines || 0;

    /* Active Machines */

    const { count: activeMachines } = await db
        .from("user_machines")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

    document.getElementById("activeMachines").textContent =
        activeMachines || 0;

    /* VIP Machines */

    const { count: vipMachines } = await db
        .from("user_machines")
        .select("*", { count: "exact", head: true })
        .eq("is_vip", true);

    document.getElementById("vipMachines").textContent =
        vipMachines || 0;

    /* Pending Withdrawals */

    const { count: pending } = await db
        .from("withdrawals")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

    document.getElementById("pendingWithdrawals").textContent =
        pending || 0;

}

/*========================================
LOAD USERS
========================================*/

async function loadUsers() {

    const { data, error } = await db

        .from("profiles")

        .select("*")

        .order("created_at", { ascending: false });

    if (error) {

        console.error(error);

        return;

    }

    users = data || [];

    filteredUsers = [...users];

    renderUsers();

}

/*========================================
RENDER USERS
========================================*/

function renderUsers() {

    const container =
        document.getElementById("usersContainer");

    container.innerHTML = "";

    document.getElementById("loadedUsers").textContent =
        filteredUsers.length + " Users";

    const visibleUsers = filteredUsers.slice(
        0,
        (currentPage + 1) * USERS_PER_PAGE
    );

    visibleUsers.forEach(user => {

        const card = document.createElement("div");

        card.className = "userCard";

        card.dataset.id = user.id;

        card.innerHTML = `

<img src="${user.avatar_url || 'images/default-avatar.png'}">

<div class="userInfo">

<h3>${user.fullname}</h3>

<p>${user.phone || "No Phone"}</p>

</div>

<div class="userStatus">

<span>${user.membership || "Standard"}</span>

</div>

`;

        card.onclick = () => {

            document
                .querySelectorAll(".userCard")
                .forEach(c => c.classList.remove("active"));

            card.classList.add("active");

            selectedUser = user;

            loadUser(user.id);

        };

        container.appendChild(card);

    });

}

/*========================================
LOAD SELECTED USER
========================================*/

async function loadUser(userId){

/* PROFILE */

const { data: profile, error } = await db

.from("profiles")

.select("*")

.eq("id", userId)

.single();

if(error){

console.error(error);

return;

}

selectedUser = profile;

/* PROFILE */

document.getElementById("userAvatar").src =
profile.avatar_url || "images/default-avatar.png";

document.getElementById("userFullname").textContent =
profile.fullname || "-";

document.getElementById("userPhone").textContent =
profile.phone || "-";

document.getElementById("userEmail").textContent =
profile.email || "-";

document.getElementById("membershipBadge").textContent =
profile.membership || "Standard";

document.getElementById("kycBadge").textContent =
profile.kyc_status || "Not Verified";

document.getElementById("accountStatusBadge").textContent =
profile.account_status || "Active";

/* WALLET */

document.getElementById("walletBalance").textContent =
"UGX " + Number(profile.wallet_balance || 0).toLocaleString();

document.getElementById("totalInvested").textContent =
"UGX " + Number(profile.total_invested || 0).toLocaleString();

document.getElementById("userTotalProfit").textContent =
"UGX " + Number(profile.total_profit || 0).toLocaleString();

document.getElementById("userReferralBonus").textContent =
"UGX " + Number(profile.total_referral_bonus || 0).toLocaleString();

/* DETAILS */

document.getElementById("userCountry").textContent =
profile.country || "-";

document.getElementById("userMembership").textContent =
profile.membership || "-";

document.getElementById("userLevel").textContent =
profile.level || 1;

document.getElementById("userKyc").textContent =
profile.kyc_status || "-";

document.getElementById("referralCode").textContent =
profile.referral_code || "-";

document.getElementById("referredBy").textContent =
profile.referred_by || "-";

document.getElementById("joinedDate").textContent =
profile.created_at ?
new Date(profile.created_at).toLocaleDateString() : "-";

document.getElementById("lastLogin").textContent =
profile.last_login ?
new Date(profile.last_login).toLocaleString() : "Never";

/* LOAD OTHER DATA */

await loadUserMachines(userId);

await loadFinance(userId);

await loadReferrals(userId);

}

/*========================================
LOAD USER MACHINES
========================================*/

async function loadUserMachines(userId){

const { data, error } = await db

.from("user_machines")

.select("*")

.eq("user_id", userId)

.order("purchase_date",{ascending:false});

if(error){

console.error(error);

return;

}

renderMachines(data || []);

}

/*========================================
LOAD FINANCE
========================================*/

async function loadFinance(userId){

const { data: deposits } = await db

.from("deposits")

.select("amount")

.eq("user_id", userId)

.eq("status","approved");

const totalDeposits = (deposits || [])

.reduce((sum,item)=>sum + Number(item.amount),0);

document.getElementById("totalDeposits").textContent =
"UGX " + totalDeposits.toLocaleString();

const { data: withdrawals } = await db

.from("withdrawals")

.select("amount")

.eq("user_id", userId);

const totalWithdrawals = (withdrawals || [])

.reduce((sum,item)=>sum + Number(item.amount),0);

document.getElementById("totalWithdrawals").textContent =
"UGX " + totalWithdrawals.toLocaleString();

const { count } = await db

.from("wallet_transactions")

.select("*",{count:"exact",head:true})

.eq("user_id",userId);

document.getElementById("walletTransactionCount").textContent =
count || 0;

document.getElementById("walletAmount").textContent =
document.getElementById("walletBalance").textContent;

}

/*========================================
LOAD REFERRALS
========================================*/

async function loadReferrals(userId){

const { data } = await db

.from("referrals")

.select("*")

.eq("referrer_id",userId);

document.getElementById("profileReferralCode").textContent =
selectedUser.referral_code || "-";

document.getElementById("totalReferrals").textContent =
data ? data.length : 0;

document.getElementById("totalReferralBonus").textContent =
"UGX " +
Number(selectedUser.total_referral_bonus || 0).toLocaleString();

const paid = (data || [])

.filter(item=>item.reward_paid).length;

document.getElementById("rewardPaid").textContent =
paid;

        }

/*========================================
RENDER USER MACHINES
========================================*/

function renderMachines(machines){

const container=document.getElementById("ownedMachinesGrid");

container.innerHTML="";

document.getElementById("machineCountBadge").textContent=
machines.length+" Machines";

if(machines.length===0){

container.innerHTML=`
<div class="emptyState">
<h3>No Machines Found</h3>
<p>This user doesn't own any machines.</p>
</div>
`;

return;

}

machines.forEach(machine=>{

const card=document.createElement("div");

card.className="machineCard";

card.innerHTML=`

<img src="${machine.machine_image || 'images/default-machine.png'}">

<h3>${machine.machine_name}</h3>

<p>Status: ${machine.status}</p>

<p>Earned: UGX ${Number(machine.earned_amount||0).toLocaleString()}</p>

`;

card.onclick=()=>{

document.querySelectorAll(".machineCard")
.forEach(c=>c.classList.remove("active"));

card.classList.add("active");

selectedMachine=machine;

loadMachineDetails(machine);

};

container.appendChild(card);

});

}

/*========================================
LOAD MACHINE DETAILS
========================================*/

async function loadMachineDetails(machine){

const {data}=await db

.from("machines")

.select("*")

.eq("id",machine.machine_id)

.single();

if(!data)return;

document.getElementById("machineImage").src=
machine.machine_image || data.image_url || "images/default-machine.png";

document.getElementById("machineName").textContent=
data.name;

document.getElementById("machineSeries").textContent=
data.series || "-";

document.getElementById("machinePrice").textContent=
"UGX "+Number(data.price).toLocaleString();

document.getElementById("dailyIncome").textContent=
"UGX "+Number(data.daily_income).toLocaleString();

document.getElementById("totalReturn").textContent=
"UGX "+Number(data.total_return).toLocaleString();

document.getElementById("earnedAmount").textContent=
"UGX "+Number(machine.earned_amount||0).toLocaleString();

document.getElementById("purchaseDate").textContent=
new Date(machine.purchase_date).toLocaleDateString();

document.getElementById("expiryDate").textContent=
machine.expiry_date
?new Date(machine.expiry_date).toLocaleDateString()
:"-";

document.getElementById("remainingDays").textContent=
calculateRemainingDays(machine.expiry_date);

document.getElementById("machineVipStatus").textContent=
machine.is_vip ? "VIP":"Normal";

document.getElementById("selectedMachineStatus").textContent=
machine.status;

updateProgress(machine);

}

/*========================================
PROGRESS
========================================*/

function updateProgress(machine){

if(!machine.purchase_date || !machine.expiry_date){

document.getElementById("machineProgressBar").style.width="0%";

return;

}

const start=new Date(machine.purchase_date);

const end=new Date(machine.expiry_date);

const now=new Date();

const total=end-start;

const used=now-start;

let percent=(used/total)*100;

percent=Math.max(0,Math.min(100,percent));

document.getElementById("machineProgressBar").style.width=
percent+"%";

}

/*========================================
REMAINING DAYS
========================================*/

function calculateRemainingDays(expiry){

if(!expiry)return "-";

const today=new Date();

const end=new Date(expiry);

const diff=end-today;

return Math.max(0,Math.ceil(diff/86400000));

}

/*========================================
SEARCH
========================================*/

document.getElementById("searchInput").addEventListener("input",e=>{

const text=e.target.value.toLowerCase();

filteredUsers=users.filter(user=>{

return(

(user.fullname||"").toLowerCase().includes(text)||

(user.phone||"").toLowerCase().includes(text)||

(user.email||"").toLowerCase().includes(text)||

(user.referral_code||"").toLowerCase().includes(text)

);

});

currentPage=0;

renderUsers();

});

/*========================================
LOAD MORE
========================================*/

document.getElementById("loadMoreUsersBtn").onclick=()=>{

currentPage++;

renderUsers();

};

/*========================================
FILTERS
========================================*/

document.querySelectorAll(".filterBtn").forEach(btn=>{

btn.onclick=()=>{

document.querySelectorAll(".filterBtn")

.forEach(b=>b.classList.remove("active"));

btn.classList.add("active");

/* Filter logic can be expanded later */

};

});

/*========================================
MENU
========================================*/

document.getElementById("menuToggle").onclick=()=>{

document.getElementById("sidebar")

.classList.toggle("show");

};

/*========================================
LOGOUT
========================================*/

document.getElementById("logoutBtn").onclick=()=>{

localStorage.removeItem("admin_logged_in");

localStorage.removeItem("admin_name");

localStorage.removeItem("admin_role");

window.location.href="admin-login.html";

};

/*========================================
AUTO REFRESH
========================================*/

setInterval(async()=>{

if(selectedUser){

await loadUser(selectedUser.id);

}

await loadDashboardStats();

},10000);
