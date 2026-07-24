/* =====================================================
   USER MACHINES ADMIN
   Marathon Digital Hub
===================================================== */

const db = window.supabaseClient;

/* ===========================
PAGE SECURITY
=========================== */

if (localStorage.getItem("admin_logged_in") !== "true") {
    window.location.href = "admin-login.html";
}

/* ===========================
GLOBAL DATA
=========================== */

let allProfiles = [];
let allMachines = [];
let allUserMachines = [];

let filteredMachines = [];

let currentFilter = "all";
let selectedMachine = null;

/* ===========================
START PAGE
=========================== */

document.addEventListener("DOMContentLoaded", async () => {

    await loadEverything();

    registerEvents();

});

/* ===========================
LOAD EVERYTHING
=========================== */

async function loadEverything() {

    try {

        showLoading();

        await Promise.all([

            loadProfiles(),
            loadMachines(),
            loadUserMachines()

        ]);

        calculateStatistics();

        renderMachineTable();

        hideLoading();

    } catch (err) {

        console.error(err);

        hideLoading();

        alert("Failed to load dashboard.");

    }

}

/* ===========================
LOAD PROFILES
=========================== */

async function loadProfiles() {

    const { data, error } = await db

        .from("profiles")

        .select("*")

        .order("created_at", { ascending: false });

    if (error) throw error;

    allProfiles = data || [];

}

/* ===========================
LOAD MACHINES
=========================== */

async function loadMachines() {

    const { data, error } = await db

        .from("machines")

        .select("*")

        .order("created_at", { ascending: false });

    if (error) throw error;

    allMachines = data || [];

}

/* ===========================
LOAD USER MACHINES
=========================== */

async function loadUserMachines() {

    const { data, error } = await db

        .from("user_machines")

        .select("*")

        .order("purchase_date", { ascending: false });

    if (error) throw error;

    allUserMachines = data || [];

    filteredMachines = [...allUserMachines];

                }

/* ==========================================
CALCULATE DASHBOARD STATISTICS
========================================== */

function calculateStatistics(){

document.getElementById("totalMachines").textContent =
allUserMachines.length;

document.getElementById("activeMachines").textContent =
allUserMachines.filter(x=>x.status==="active").length;

document.getElementById("vipMachines").textContent =
allUserMachines.filter(x=>x.is_vip===true).length;

document.getElementById("expiredMachines").textContent =
allUserMachines.filter(x=>x.status==="expired").length;

document.getElementById("completedMachines").textContent =
allUserMachines.filter(x=>x.completed===true).length;

let invested=0;
let earned=0;
let todayProfit=0;

allUserMachines.forEach(machine=>{

invested+=Number(machine.amount_paid||0);

earned+=Number(machine.earned_amount||0);

todayProfit+=Number(machine.today_profit||0);

});

document.getElementById("totalInvestment").textContent=
"UGX "+invested.toLocaleString();

document.getElementById("totalEarned").textContent=
"UGX "+earned.toLocaleString();

document.getElementById("todayProfit").textContent=
"UGX "+todayProfit.toLocaleString();

}

/* ==========================================
RENDER TABLE
========================================== */

function renderMachineTable(){

const tbody=document.getElementById("machinesBody");

tbody.innerHTML="";

if(filteredMachines.length===0){

tbody.innerHTML=`
<tr>
<td colspan="12" class="loading">
No user machines found.
</td>
</tr>
`;

return;

}

filteredMachines.forEach(userMachine=>{

const user=allProfiles.find(
x=>x.id===userMachine.user_id
);

const machine=allMachines.find(
x=>x.id===userMachine.machine_id
);

tbody.innerHTML+=`

<tr>

<td>

<b>${user?.fullname||"Unknown User"}</b><br>

<small>${user?.phone||""}</small>

</td>

<td>

${machine?.name||"-"}

</td>

<td>

${machine?.series||"-"}

</td>

<td>

UGX ${(userMachine.amount_paid||0).toLocaleString()}

</td>

<td>

UGX ${(machine?.daily_income||0).toLocaleString()}

</td>

<td>

UGX ${(userMachine.earned_amount||0).toLocaleString()}

</td>

<td>

${machine?.duration_days||0} Days

</td>

<td>

${formatDate(userMachine.purchase_date)}

</td>

<td>

${formatDate(userMachine.expiry_date)}

</td>

<td>

${statusBadge(userMachine.status)}

</td>

<td>

${userMachine.is_vip
?'<span class="badge badge-vip">VIP</span>'
:'-'}

</td>

<td>

<button onclick="viewMachine('${userMachine.id}')">

View

</button>

</td>

</tr>

`;

});

}

/* ==========================================
DATE FORMAT
========================================== */

function formatDate(date){

if(!date) return "-";

return new Date(date).toLocaleDateString();

}

/* ==========================================
STATUS BADGE
========================================== */

function statusBadge(status){

if(status==="active"){

return `<span class="badge badge-active">
ACTIVE
</span>`;

}

if(status==="expired"){

return `<span class="badge badge-expired">
EXPIRED
</span>`;

}

return `<span class="badge">
${status||"-"}
</span>`;

                        }

/* ==========================================
REGISTER EVENTS
========================================== */

function registerEvents(){

document.getElementById("searchInput")
.addEventListener("input",searchMachines);

document.getElementById("refreshBtn")
.addEventListener("click",loadEverything);

document.querySelectorAll(".filter").forEach(btn=>{

btn.addEventListener("click",()=>{

document.querySelectorAll(".filter")
.forEach(x=>x.classList.remove("active"));

btn.classList.add("active");

currentFilter=btn.dataset.filter;

searchMachines();

});

});

document.getElementById("closeModal").onclick=()=>{

document.getElementById("machineModal").style.display="none";

};

}

/* ==========================================
SEARCH + FILTER
========================================== */

function searchMachines(){

const keyword=document
.getElementById("searchInput")
.value
.toLowerCase();

filteredMachines=allUserMachines.filter(machine=>{

const profile=allProfiles.find(
x=>x.id===machine.user_id
);

const plan=allMachines.find(
x=>x.id===machine.machine_id
);

const text=`

${profile?.fullname||""}
${profile?.phone||""}
${profile?.email||""}
${plan?.name||""}
${plan?.series||""}

`.toLowerCase();

let filterOk=true;

if(currentFilter==="active")
filterOk=machine.status==="active";

if(currentFilter==="expired")
filterOk=machine.status==="expired";

if(currentFilter==="vip")
filterOk=machine.is_vip===true;

if(currentFilter==="completed")
filterOk=machine.completed===true;

return text.includes(keyword) && filterOk;

});

renderMachineTable();

}

/* ==========================================
VIEW MACHINE
========================================== */

function viewMachine(id){

selectedMachine=allUserMachines.find(
x=>x.id===id
);

if(!selectedMachine)return;

const user=allProfiles.find(
x=>x.id===selectedMachine.user_id
);

const machine=allMachines.find(
x=>x.id===selectedMachine.machine_id
);

document.getElementById("viewFullname").textContent=user?.fullname||"-";
document.getElementById("viewPhone").textContent=user?.phone||"-";
document.getElementById("viewEmail").textContent=user?.email||"-";
document.getElementById("viewWallet").textContent="UGX "+Number(user?.wallet_balance||0).toLocaleString();

document.getElementById("viewMachineName").textContent=machine?.name||"-";
document.getElementById("viewSeries").textContent=machine?.series||"-";
document.getElementById("viewPrice").textContent="UGX "+Number(selectedMachine.amount_paid||0).toLocaleString();
document.getElementById("viewDailyIncome").textContent="UGX "+Number(machine?.daily_income||0).toLocaleString();
document.getElementById("viewEarned").textContent="UGX "+Number(selectedMachine.earned_amount||0).toLocaleString();

document.getElementById("machineModal").style.display="flex";

}

/* ==========================================
DELETE MACHINE
========================================== */

async function deleteMachine(){

if(!selectedMachine)return;

if(!confirm("Delete this machine?")) return;

const {error}=await db

.from("user_machines")

.delete()

.eq("id",selectedMachine.id);

if(error){

alert(error.message);

return;

}

document.getElementById("machineModal").style.display="none";

await loadEverything();

}

/* ==========================================
ACTIVATE
========================================== */

async function activateMachine(){

await db

.from("user_machines")

.update({status:"active"})

.eq("id",selectedMachine.id);

await loadEverything();

}

/* ==========================================
SUSPEND
========================================== */

async function suspendMachine(){

await db

.from("user_machines")

.update({status:"suspended"})

.eq("id",selectedMachine.id);

await loadEverything();

}

/* ==========================================
VIP
========================================== */

async function vipMachine(){

await db

.from("user_machines")

.update({

is_vip:!selectedMachine.is_vip

})

.eq("id",selectedMachine.id);

await loadEverything();

}

/* ==========================================
BUTTONS
========================================== */

document.getElementById("activateMachineBtn")
.onclick=activateMachine;

document.getElementById("suspendMachineBtn")
.onclick=suspendMachine;

document.getElementById("vipMachineBtn")
.onclick=vipMachine;

document.getElementById("deleteMachineBtn")
.onclick=deleteMachine;

/* ==========================================
AUTO REFRESH
========================================== */

setInterval(loadEverything,30000);

/* ==========================================
LOADING
========================================== */

function showLoading(){

document.getElementById("machinesBody").innerHTML=

`<tr>
<td colspan="12" class="loading">
Loading...
</td>
</tr>`;

}

function hideLoading(){}
