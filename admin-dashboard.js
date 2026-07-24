/* ==========================================
MARATHON DIGITAL HUB
ADMIN DASHBOARD
JS PART 1
========================================== */

const db = window.supabaseClient;

/* ==========================================
ADMIN PROTECTION
========================================== */

if (localStorage.getItem("admin_logged_in") !== "true") {
    window.location.href = "admin-login.html";
}

/* ==========================================
ADMIN INFO
========================================== */

const adminName =
localStorage.getItem("admin_name") || "Administrator";

document.getElementById("adminName").textContent =
adminName;

const avatar =
document.querySelector(".admin-avatar");

if (avatar) {
    avatar.textContent =
    adminName.charAt(0).toUpperCase();
}

/* ==========================================
PAGE START
========================================== */

document.addEventListener("DOMContentLoaded", async () => {

    await loadDashboard();

    setInterval(loadDashboard,30000);

    setTimeout(()=>{
        const loader=document.getElementById("loader");
        if(loader){
            loader.style.display="none";
        }
    },600);

});

/* ==========================================
LOAD DASHBOARD
========================================== */

async function loadDashboard(){

    await Promise.all([

        loadUsers(),

        loadMachines(),

        loadDeposits(),

        loadWithdrawals(),

        loadSupport(),

        loadNotifications(),

        loadWalletStatistics()

    ]);

}

/* ==========================================
TOTAL USERS
========================================== */

async function loadUsers(){

const {count}=await db

.from("profiles")

.select("*",{

count:"exact",

head:true

});

document.getElementById("totalUsers").textContent=

count || 0;

}

/* ==========================================
ACTIVE USERS
========================================== */

async function loadActiveUsers(){

const {count}=await db

.from("profiles")

.select("*",{

count:"exact",

head:true

})

.eq("account_status","active")

.eq("is_frozen",false);

document.getElementById("activeUsers").textContent=

count || 0;

}

/* ==========================================
FROZEN USERS
========================================== */

async function loadFrozenUsers(){

const {count}=await db

.from("profiles")

.select("*",{

count:"exact",

head:true

})

.eq("is_frozen",true);

document.getElementById("frozenUsers").textContent=

count || 0;

}

/* ==========================================
SUSPENDED USERS
========================================== */

async function loadSuspendedUsers(){

const {count}=await db

.from("profiles")

.select("*",{

count:"exact",

head:true

})

.neq("account_status","active");

document.getElementById("suspendedUsers").textContent=

count || 0;

    }

/* ==========================================
TOTAL MACHINES
========================================== */

async function loadMachines(){

const {count}=await db

.from("machines")

.select("*",{

count:"exact",

head:true

});

document.getElementById("totalMachines").textContent=

count || 0;

/* Active User Machines */

const {count:activeMachineCount}=await db

.from("user_machines")

.select("*",{

count:"exact",

head:true

})

.eq("status","active");

document.getElementById("activeMachineCount").textContent=

activeMachineCount || 0;

}

/* ==========================================
TOTAL WALLET & INVESTMENT
========================================== */

async function loadWalletStatistics(){

const {data}=await db

.from("profiles")

.select("wallet_balance,total_invested");

let wallet=0;

let invested=0;

if(data){

data.forEach(user=>{

wallet+=Number(user.wallet_balance||0);

invested+=Number(user.total_invested||0);

});

}

document.getElementById("totalWallet").textContent=

"UGX "+wallet.toLocaleString();

document.getElementById("totalInvestment").textContent=

"UGX "+invested.toLocaleString();

}

/* ==========================================
PENDING DEPOSITS
========================================== */

async function loadDeposits(){

const {count}=await db

.from("deposits")

.select("*",{

count:"exact",

head:true

})

.eq("status","pending");

document.getElementById("pendingDeposits").textContent=

count || 0;

}

/* ==========================================
PENDING WITHDRAWALS
========================================== */

async function loadWithdrawals(){

const {count}=await db

.from("withdrawals")

.select("*",{

count:"exact",

head:true

})

.eq("status","pending");

document.getElementById("pendingWithdrawals").textContent=

count || 0;

}

/* ==========================================
OPEN SUPPORT
========================================== */

async function loadSupport(){

const {count}=await db

.from("support_messages")

.select("*",{

count:"exact",

head:true

})

.eq("status","open");

document.getElementById("openSupport").textContent=

count || 0;

}

/* ==========================================
ADMIN NOTIFICATIONS
========================================== */

async function loadNotifications(){

const {count}=await db

.from("admin_notifications")

.select("*",{

count:"exact",

head:true

})

.eq("is_read",false);

document.getElementById("notificationCount").textContent=

count || 0;

document.getElementById("adminNotifications").textContent=

count || 0;

}

/* ==========================================
REFRESH BUTTON
========================================== */

document.getElementById("refreshBtn")

.addEventListener("click",async()=>{

await loadDashboard();

});

/* ==========================================
LOGOUT
========================================== */

document.getElementById("logoutBtn")

.addEventListener("click",()=>{

localStorage.removeItem("admin_logged_in");

localStorage.removeItem("admin_id");

localStorage.removeItem("admin_name");

localStorage.removeItem("admin_role");

window.location.href="admin-login.html";

});

/* ==========================================
LATEST USERS
========================================== */

async function loadRecentUsers(){

const {data,error}=await db

.from("profiles")

.select("fullname,email,wallet_balance,created_at")

.order("created_at",{ascending:false})

.limit(5);

const container=document.getElementById("recentUsers");

if(error){

container.innerHTML="<div class='loading-row'>Unable to load users.</div>";

return;

}

container.innerHTML="";

data.forEach(user=>{

container.innerHTML+=`

<div class="list-item">

<div class="user-info">

<div class="user-avatar">

${(user.fullname||"U").charAt(0).toUpperCase()}

</div>

<div class="user-details">

<h4>${user.fullname}</h4>

<p>${user.email||"No Email"}</p>

</div>

</div>

<div class="item-right">

<h4>UGX ${Number(user.wallet_balance||0).toLocaleString()}</h4>

<span>${new Date(user.created_at).toLocaleDateString()}</span>

</div>

</div>

`;

});

}

/* ==========================================
LATEST MACHINE PURCHASES
========================================== */

async function loadRecentMachines(){

const {data,error}=await db

.from("user_machines")

.select("machine_name,amount_paid,purchase_date,status")

.order("purchase_date",{ascending:false})

.limit(5);

const container=document.getElementById("recentMachines");

if(error){

container.innerHTML="<div class='loading-row'>Unable to load machines.</div>";

return;

}

container.innerHTML="";

data.forEach(item=>{

container.innerHTML+=`

<div class="list-item">

<div>

<h4>${item.machine_name}</h4>

<p>UGX ${Number(item.amount_paid||0).toLocaleString()}</p>

</div>

<div class="item-right">

<span>${item.status}</span>

<br>

<span>${new Date(item.purchase_date).toLocaleDateString()}</span>

</div>

</div>

`;

});

}

/* ==========================================
LATEST DEPOSITS
========================================== */

async function loadRecentDeposits(){

const {data,error}=await db

.from("deposits")

.select("amount,status,created_at,phone_number")

.order("created_at",{ascending:false})

.limit(5);

const container=document.getElementById("recentDeposits");

if(error){

container.innerHTML="<div class='loading-row'>Unable to load deposits.</div>";

return;

}

container.innerHTML="";

data.forEach(item=>{

container.innerHTML+=`

<div class="list-item">

<div>

<h4>${item.phone_number||"User Deposit"}</h4>

<p>UGX ${Number(item.amount).toLocaleString()}</p>

</div>

<div class="item-right">

<span>${item.status}</span>

<br>

<span>${new Date(item.created_at).toLocaleDateString()}</span>

</div>

</div>

`;

});

}

/* ==========================================
LATEST WITHDRAWALS
========================================== */

async function loadRecentWithdrawals(){

const {data,error}=await db

.from("withdrawals")

.select("amount,status,created_at,phone_number")

.order("created_at",{ascending:false})

.limit(5);

const container=document.getElementById("recentWithdrawals");

if(error){

container.innerHTML="<div class='loading-row'>Unable to load withdrawals.</div>";

return;

}

container.innerHTML="";

data.forEach(item=>{

container.innerHTML+=`

<div class="list-item">

<div>

<h4>${item.phone_number||"User Withdrawal"}</h4>

<p>UGX ${Number(item.amount).toLocaleString()}</p>

</div>

<div class="item-right">

<span>${item.status}</span>

<br>

<span>${new Date(item.created_at).toLocaleDateString()}</span>

</div>

</div>

`;

});

}

/* ==========================================
LATEST SUPPORT
========================================== */

async function loadRecentSupport(){

const {data,error}=await db

.from("support_messages")

.select("subject,message,status,created_at")

.order("created_at",{ascending:false})

.limit(5);

const container=document.getElementById("recentSupport");

if(error){

container.innerHTML="<div class='loading-row'>Unable to load support.</div>";

return;

}

container.innerHTML="";

data.forEach(item=>{

container.innerHTML+=`

<div class="list-item">

<div>

<h4>${item.subject||"Support Message"}</h4>

<p>${(item.message||"").substring(0,45)}...</p>

</div>

<div class="item-right">

<span>${item.status}</span>

<br>

<span>${new Date(item.created_at).toLocaleDateString()}</span>

</div>

</div>

`;

});

}

/* ==========================================
LOAD ALL ACTIVITY
========================================== */

async function loadActivity(){

await Promise.all([

loadRecentUsers(),

loadRecentMachines(),

loadRecentDeposits(),

loadRecentWithdrawals(),

loadRecentSupport()

]);

}

/* ==========================================
UPDATE DASHBOARD
========================================== */

const oldDashboard=loadDashboard;

loadDashboard=async function(){

await oldDashboard();

await loadActiveUsers();

await loadFrozenUsers();

await loadSuspendedUsers();

await loadActivity();

};

/* ==========================================
AUTO REFRESH
========================================== */

setInterval(loadDashboard,30000);

console.log("Marathon Admin Dashboard Loaded Successfully");
