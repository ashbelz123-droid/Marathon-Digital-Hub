/*=========================================
ADMIN DEPOSITS
PART 1
=========================================*/

const db = supabaseClient;

let deposits = [];
let selectedDeposit = null;

/*==============================
LOAD DEPOSITS
==============================*/

async function loadDeposits(){

const { data, error } = await db

.from("deposits")

.select(`
*,
profiles(
fullname,
email,
phone,
wallet_balance
)
`)

.order("created_at",{ascending:false});

if(error){

console.error(error);

return;

}

deposits = data || [];

renderSummary();

renderDeposits(deposits);

}

/*==============================
SUMMARY
==============================*/

function renderSummary(){

const pending = deposits.filter(d=>d.status==="pending");

const approved = deposits.filter(d=>d.status==="approved");

const rejected = deposits.filter(d=>d.status==="rejected");

document.getElementById("pendingCount").innerHTML =
pending.length;

document.getElementById("approvedCount").innerHTML =
approved.length;

document.getElementById("rejectedCount").innerHTML =
rejected.length;

document.getElementById("totalCount").innerHTML =
deposits.length;

document.getElementById("pendingAmount").innerHTML =
"UGX " + pending.reduce((a,b)=>a+Number(b.amount),0).toLocaleString();

document.getElementById("approvedAmount").innerHTML =
"UGX " + approved.reduce((a,b)=>a+Number(b.amount),0).toLocaleString();

document.getElementById("rejectedAmount").innerHTML =
"UGX " + rejected.reduce((a,b)=>a+Number(b.amount),0).toLocaleString();

document.getElementById("totalAmount").innerHTML =
"UGX " + deposits.reduce((a,b)=>a+Number(b.amount),0).toLocaleString();

}

/*==============================
SEARCH
==============================*/

document.getElementById("searchInput")

.addEventListener("input",filterDeposits);

document.getElementById("statusFilter")

.addEventListener("change",filterDeposits);

function filterDeposits(){

const search =
document.getElementById("searchInput")
.value.toLowerCase();

const status =
document.getElementById("statusFilter")
.value;

const filtered = deposits.filter(d=>{

const profile = d.profiles || {};

const matchSearch =

(profile.fullname||"")
.toLowerCase()
.includes(search)

||

(profile.email||"")
.toLowerCase()
.includes(search)

||

(profile.phone||"")
.toLowerCase()
.includes(search);

const matchStatus =
status==="all" || d.status===status;

return matchSearch && matchStatus;

});

renderDeposits(filtered);

}

/*=========================================
ADMIN DEPOSITS
PART 2
=========================================*/

function renderDeposits(list){

const container =
document.getElementById("depositsContainer");

const empty =
document.getElementById("emptyState");

container.innerHTML = "";

if(list.length===0){

empty.style.display="block";

return;

}

empty.style.display="none";

list.forEach(item=>{

const profile = item.profiles || {};

const initials =
(profile.fullname || "U")
.charAt(0)
.toUpperCase();

const amount =
Number(item.amount || 0);

const network =
(item.method || "").toLowerCase();

const networkClass =
network.includes("airtel")
? "airtel"
: "mtn";

const networkName =
network.includes("airtel")
? "Airtel Money"
: "MTN Mobile Money";

const status =
(item.status || "pending");

container.innerHTML += `

<div class="deposit-card">

<div class="card-header">

<div class="deposit-id">

<h3>

#DP-${item.id.substring(0,6).toUpperCase()}

</h3>

<span class="status ${status}">

${status.toUpperCase()}

</span>

</div>

<div class="request-time">

<i class="fas fa-clock"></i>

${new Date(item.created_at)
.toLocaleString()}

</div>

</div>

<div class="user-section">

<div class="avatar">

${initials}

</div>

<div class="user-info">

<h3>

${profile.fullname || "Unknown User"}

</h3>

<p>

${profile.email || "-"}

</p>

<p>

${profile.phone || "-"}

</p>

</div>

</div>

<div class="finance-box">

<div class="finance-row amount">

<span>

Deposit Amount

</span>

<strong>

UGX ${amount.toLocaleString()}

</strong>

</div>

<div class="finance-row">

<span>

Wallet Balance

</span>

<strong>

UGX ${Number(profile.wallet_balance||0).toLocaleString()}

</strong>

</div>

</div>

<div class="payment-box">

<div>

<i class="fas fa-mobile-screen"></i>

<span class="network ${networkClass}">

${networkName}

</span>

</div>

<div>

<i class="fas fa-hashtag"></i>

${item.transaction_id || "N/A"}

</div>

</div>

<div class="message-box">

<h4>

Payment Message

</h4>

<p>

${item.payment_message || "No message provided."}

</p>

</div>

${
status==="pending"

?

`<div class="action-buttons">

<button

class="approve-btn"

onclick="openApprove('${item.id}')">

<i class="fas fa-circle-check"></i>

Approve

</button>

<button

class="edit-btn"

onclick="openApprove('${item.id}')">

<i class="fas fa-pen"></i>

Edit Amount

</button>

<button

class="reject-btn"

onclick="openReject('${item.id}')">

<i class="fas fa-circle-xmark"></i>

Reject

</button>

</div>`

:

""

}

</div>

`;

});

}

/*=========================================
ADMIN DEPOSITS
PART 3
=========================================*/

function openApprove(id){

selectedDeposit =
deposits.find(d=>d.id===id);

if(!selectedDeposit) return;

const profile =
selectedDeposit.profiles || {};

document.getElementById("popupUser").innerHTML =
profile.fullname || "-";

document.getElementById("popupNetwork").innerHTML =
selectedDeposit.method || "MTN Mobile Money";

document.getElementById("popupPhone").innerHTML =
profile.phone || "-";

document.getElementById("popupTransaction").innerHTML =
selectedDeposit.transaction_id || "-";

document.getElementById("popupMessage").innerHTML =
selectedDeposit.payment_message || "No message";

document.getElementById("editAmount").value =
selectedDeposit.amount;

document.getElementById("approvePopup").style.display =
"flex";

}

function openReject(id){

selectedDeposit =
deposits.find(d=>d.id===id);

document.getElementById("rejectReason").value = "";

document.getElementById("rejectPopup").style.display =
"flex";

}

document.getElementById("closeApprove").onclick=()=>{
document.getElementById("approvePopup").style.display="none";
};

document.getElementById("closeReject").onclick=()=>{
document.getElementById("rejectPopup").style.display="none";
};

document.getElementById("closeSuccess").onclick=()=>{
document.getElementById("successPopup").style.display="none";
};

/*==============================
APPROVE
==============================*/

document.getElementById("confirmApprove").onclick =
async ()=>{

if(!selectedDeposit) return;

const amount =
Number(document.getElementById("editAmount").value);

const profile =
selectedDeposit.profiles;

const newBalance =
Number(profile.wallet_balance||0)+amount;

/* Update Deposit */

await db.from("deposits")

.update({
status:"approved",
amount:amount,
approved_at:new Date()
})

.eq("id",selectedDeposit.id);

/* Update Wallet */

await db.from("profiles")

.update({
wallet_balance:newBalance
})

.eq("id",selectedDeposit.user_id);

/* Wallet Transaction */

await db.from("wallet_transactions")

.insert({

user_id:selectedDeposit.user_id,

type:"deposit",

amount:amount,

description:"Deposit Approved",

balance_after:newBalance,

status:"completed"

});

/* User Notification */

await db.from("user_notifications")

.insert({

user_id:selectedDeposit.user_id,

title:"Deposit Approved",

message:
`Your deposit of UGX ${amount.toLocaleString()} has been approved and credited successfully. Current Wallet Balance: UGX ${newBalance.toLocaleString()}.`

});

document.getElementById("approvePopup").style.display="none";

document.getElementById("successMessage").innerHTML=
"Deposit approved successfully.";

document.getElementById("successPopup").style.display=
"flex";

loadDeposits();

};

/*==============================
REJECT
==============================*/

document.getElementById("confirmReject").onclick =
async ()=>{

if(!selectedDeposit) return;

const reason =
document.getElementById("rejectReason").value.trim();

await db.from("deposits")

.update({

status:"rejected"

})

.eq("id",selectedDeposit.id);

/* Notification */

await db.from("user_notifications")

.insert({

user_id:selectedDeposit.user_id,

title:"Deposit Rejected",

message:
reason ||

"Unfortunately your deposit request has been rejected. Please contact support if you need assistance."

});

document.getElementById("rejectPopup").style.display=
"none";

document.getElementById("successMessage").innerHTML=
"Deposit rejected successfully.";

document.getElementById("successPopup").style.display=
"flex";

loadDeposits();

};

/*==============================
REFRESH
==============================*/

document.getElementById("refreshBtn").onclick =
loadDeposits;

/*==============================
START
==============================*/

loadDeposits();
