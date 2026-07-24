/* ==========================================
SUPABASE
========================================== */

const db = window.supabaseClient;

let allMachines = [];
let selectedMachine = null;

/* ==========================================
START PAGE
========================================== */

document.addEventListener("DOMContentLoaded", async () => {

    document.getElementById("loadingScreen").style.display = "flex";

    try{

        await loadUserMachines();

        registerEvents();

    }catch(error){

        console.error(error);

        alert("Failed to load user machines.");

    }

    document.getElementById("loadingScreen").style.display = "none";

});

/* ==========================================
LOAD USER MACHINES
========================================== */

async function loadUserMachines(){

    const { data, error } = await db

    .from("user_machines")

    .select(`
        *,
        profiles(
            fullname,
            email,
            phone,
            wallet_balance,
            membership,
            account_status,
            total_invested,
            total_profit
        ),
        machines(
            name,
            series,
            price,
            daily_income,
            total_return,
            duration_days
        )
    `)

    .order("purchase_date",{ascending:false});

    if(error){

        console.error(error);

        return;

    }

    allMachines = data || [];

    updateStatistics();

    renderMachines(allMachines);

}

/* ==========================================
STATISTICS
========================================== */

function updateStatistics(){

    document.getElementById("totalMachines").textContent =
    allMachines.length;

    document.getElementById("activeMachines").textContent =
    allMachines.filter(m=>m.status==="active").length;

    document.getElementById("vipMachines").textContent =
    allMachines.filter(m=>m.is_vip).length;

    const today = new Date();

    document.getElementById("expiredMachines").textContent =
    allMachines.filter(m=>{

        if(!m.expiry_date) return false;

        return new Date(m.expiry_date) < today;

    }).length;

}

/* ==========================================
RENDER MACHINE CARDS
========================================== */

function renderMachines(list){

    const container =
    document.getElementById("machineList");

    container.innerHTML="";

    if(list.length===0){

        document.getElementById("emptyState").style.display="block";

        return;

    }

    document.getElementById("emptyState").style.display="none";

    list.forEach(machine=>{

        container.innerHTML += createMachineCard(machine);

    });

}

/* ==========================================
CREATE MACHINE CARD
========================================== */

function createMachineCard(machine){

const profile = machine.profiles || {};
const info = machine.machines || {};

const wallet =
Number(profile.wallet_balance || 0).toLocaleString();

const earned =
Number(machine.earned_amount || 0).toLocaleString();

const vipBadge =
machine.is_vip
? `<span class="badge vip">VIP</span>`
: "";

let statusBadge="";

if(machine.status==="active"){

statusBadge =
`<span class="badge active">ACTIVE</span>`;

}else{

statusBadge =
`<span class="badge disabled">DISABLED</span>`;

}

return `

<div class="machine-card">

<div class="machine-top">

<div>

<div class="user-name">

${profile.fullname || "Unknown User"}

</div>

<div class="user-email">

${profile.email || ""}

</div>

</div>

<div class="wallet-balance">

UGX ${wallet}

</div>

</div>

<div class="machine-grid">

<div class="machine-item">

<span>Machine</span>

<strong>

${info.name || machine.machine_name || "-"}

</strong>

</div>

<div class="machine-item">

<span>Series</span>

<strong>

${info.series || "-"}

</strong>

</div>

<div class="machine-item">

<span>Daily Income</span>

<strong>

UGX ${Number(info.daily_income||0).toLocaleString()}

</strong>

</div>

<div class="machine-item">

<span>Earned</span>

<strong>

UGX ${earned}

</strong>

</div>

<div class="machine-item">

<span>Purchase Date</span>

<strong>

${formatDate(machine.purchase_date)}

</strong>

</div>

<div class="machine-item">

<span>Expiry Date</span>

<strong>

${formatDate(machine.expiry_date)}

</strong>

</div>

</div>

<div class="badges">

${statusBadge}

${vipBadge}

</div>

<button

class="view-btn"

onclick="openMachine('${machine.id}')">

View Details

</button>

</div>

`;

}

/* ==========================================
OPEN MACHINE
========================================== */

function openMachine(id){

selectedMachine =
allMachines.find(item=>item.id===id);

if(!selectedMachine) return;

const profile =
selectedMachine.profiles || {};

const info =
selectedMachine.machines || {};

/* USER */

document.getElementById("detailName").textContent =
profile.fullname || "-";

document.getElementById("detailEmail").textContent =
profile.email || "-";

document.getElementById("detailPhone").textContent =
profile.phone || "-";

document.getElementById("detailMembership").textContent =
profile.membership || "-";

document.getElementById("detailStatus").textContent =
profile.account_status || "-";

document.getElementById("detailWallet").textContent =
"UGX " +
Number(profile.wallet_balance||0).toLocaleString();

document.getElementById("detailInvested").textContent =
"UGX " +
Number(profile.total_invested||0).toLocaleString();

document.getElementById("detailProfit").textContent =
"UGX " +
Number(profile.total_profit||0).toLocaleString();

/* MACHINE */

document.getElementById("detailMachine").textContent =
info.name || selectedMachine.machine_name;

document.getElementById("detailSeries").textContent =
info.series || "-";

document.getElementById("detailPrice").textContent =
"UGX " +
Number(info.price||0).toLocaleString();

document.getElementById("detailDailyIncome").textContent =
"UGX " +
Number(info.daily_income||0).toLocaleString();

document.getElementById("detailReturn").textContent =
"UGX " +
Number(info.total_return||0).toLocaleString();

document.getElementById("detailEarned").textContent =
"UGX " +
Number(selectedMachine.earned_amount||0).toLocaleString();

document.getElementById("detailPurchaseDate").textContent =
formatDate(selectedMachine.purchase_date);

document.getElementById("detailExpiryDate").textContent =
formatDate(selectedMachine.expiry_date);

document.getElementById("detailVip").textContent =
selectedMachine.is_vip ? "VIP" : "No";

document.getElementById("detailMachineStatus").textContent =
selectedMachine.status;

document.getElementById("machineModal").style.display =
"flex";

loadFinanceHistory();

}

/* ==========================================
CLOSE MODAL
========================================== */

document.getElementById("closeModal").onclick=()=>{

document.getElementById("machineModal").style.display="none";

};

/* ==========================================
DATE FORMAT
========================================== */

function formatDate(date){

if(!date) return "-";

return new Date(date).toLocaleDateString();

}

/* ==========================================
LOAD FINANCIAL RECORD
========================================== */

async function loadFinanceHistory(){

if(!selectedMachine) return;

const container =
document.getElementById("financeHistory");

container.innerHTML =
"<div class='finance-row'><span colspan='4'>Loading...</span></div>";

let html = "";

/* Deposit Record */

const {data:deposits} = await db
.from("deposits")
.select("*")
.eq("user_id",selectedMachine.user_id)
.order("created_at",{ascending:false});

if(deposits){

deposits.forEach(item=>{

html += `
<div class="finance-row">

<span>${formatDate(item.created_at)}</span>

<span>Deposit</span>

<span>
UGX ${Number(item.amount).toLocaleString()}
</span>

<span>${item.status}</span>

</div>
`;

});

}

/* Wallet Transactions */

const {data:wallet} = await db
.from("wallet_transactions")
.select("*")
.eq("user_id",selectedMachine.user_id)
.order("created_at",{ascending:false});

if(wallet){

wallet.forEach(item=>{

html += `
<div class="finance-row">

<span>${formatDate(item.created_at)}</span>

<span>${item.type}</span>

<span>
UGX ${Number(item.amount).toLocaleString()}
</span>

<span>${item.status}</span>

</div>
`;

});

}

if(html===""){

html=`
<div class="finance-row">

<span>No Records</span>

<span>-</span>

<span>-</span>

<span>-</span>

</div>
`;

}

container.innerHTML = html;

}

/* ==========================================
SEARCH
========================================== */

document
.getElementById("searchInput")
.addEventListener("input",filterMachines);

document
.getElementById("statusFilter")
.addEventListener("change",filterMachines);

function filterMachines(){

const search =
document
.getElementById("searchInput")
.value
.toLowerCase();

const filter =
document
.getElementById("statusFilter")
.value;

const results =
allMachines.filter(machine=>{

const profile =
machine.profiles || {};

const info =
machine.machines || {};

const matchSearch =

(profile.fullname || "")
.toLowerCase()
.includes(search)

||

(profile.email || "")
.toLowerCase()
.includes(search)

||

(info.name || "")
.toLowerCase()
.includes(search);

let matchFilter = true;

if(filter==="active"){

matchFilter =
machine.status==="active";

}

if(filter==="disabled"){

matchFilter =
machine.status!=="active";

}

if(filter==="vip"){

matchFilter =
machine.is_vip;

}

if(filter==="expired"){

matchFilter =
new Date(machine.expiry_date)
<
new Date();

}

return matchSearch && matchFilter;

});

renderMachines(results);

}

/* ==========================================
REFRESH
========================================== */

document
.getElementById("refreshBtn")
.onclick = async ()=>{

document
.getElementById("loadingScreen")
.style.display="flex";

await loadUserMachines();

document
.getElementById("loadingScreen")
.style.display="none";

};

/* ==========================================
DELETE MACHINE
========================================== */

document
.getElementById("deleteBtn")
.onclick = async ()=>{

if(!selectedMachine) return;

if(!confirm("Delete this machine?"))
return;

const {error} = await db
.from("user_machines")
.delete()
.eq("id",selectedMachine.id);

if(error){

alert(error.message);

return;

}

document
.getElementById("machineModal")
.style.display="none";

await loadUserMachines();

};

/* ==========================================
ENABLE / DISABLE
========================================== */

document
.getElementById("toggleBtn")
.onclick = async ()=>{

if(!selectedMachine) return;

const newStatus =
selectedMachine.status==="active"
?
"disabled"
:
"active";

const {error} = await db
.from("user_machines")
.update({
status:newStatus
})
.eq("id",selectedMachine.id);

if(error){

alert(error.message);

return;

}

selectedMachine.status =
newStatus;

openMachine(selectedMachine.id);

await loadUserMachines();

};

/* ==========================================
PLACEHOLDER BUTTONS
========================================== */

document
.getElementById("editWalletBtn")
.onclick = ()=>{

alert("Wallet editor will be added.");

};

document
.getElementById("editMachineBtn")
.onclick = ()=>{

alert("Machine editor will be added.");

};

document
.getElementById("extendBtn")
.onclick = ()=>{

alert("Duration editor will be added.");

};

document
.getElementById("incomeBtn")
.onclick = ()=>{

alert("Daily income editor will be added.");

};

document
.getElementById("earnedBtn")
.onclick = ()=>{

alert("Earned amount editor will be added.");

};

/* ==========================================
CLICK OUTSIDE MODAL
========================================== */

window.onclick = (event)=>{

const modal =
document.getElementById("machineModal");

if(event.target===modal){

modal.style.display="none";

}

};

/* ==========================================
END
========================================== */
