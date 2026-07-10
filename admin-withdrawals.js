/*=========================================
ADMIN WITHDRAWALS
PART 1
=========================================*/

const db = window.supabaseClient;

/*==============================
ELEMENTS
==============================*/

const withdrawalsContainer =
document.getElementById("withdrawalsContainer");

const searchInput =
document.getElementById("searchInput");

const statusFilter =
document.getElementById("statusFilter");

const pendingCount =
document.getElementById("pendingCount");

const approvedCount =
document.getElementById("approvedCount");

const rejectedCount =
document.getElementById("rejectedCount");

const totalCount =
document.getElementById("totalCount");

const pendingAmount =
document.getElementById("pendingAmount");

const approvedAmount =
document.getElementById("approvedAmount");

const rejectedAmount =
document.getElementById("rejectedAmount");

const totalAmount =
document.getElementById("totalAmount");

let withdrawals=[];

let selectedWithdrawal=null;

/*==============================
LOADING
==============================*/

function showLoading(){

document.getElementById("loadingScreen")
.style.display="flex";

}

function hideLoading(){

document.getElementById("loadingScreen")
.style.display="none";

}

/*==============================
LOAD WITHDRAWALS
==============================*/

async function loadWithdrawals(){

showLoading();

const {data,error}=await db

.from("withdrawals")

.select(`
*,
profiles(
fullname,
email,
phone,
wallet_balance
)
`)

.order("created_at",
{ascending:false});

hideLoading();

if(error){

alert(error.message);

return;

}

withdrawals=data||[];

updateSummary();

renderWithdrawals();

}

/*==============================
START
==============================*/

document.addEventListener(

"DOMContentLoaded",

()=>{

loadWithdrawals();

}

);

/*=========================================
ADMIN WITHDRAWALS
PART 2
=========================================*/

/*==============================
SUMMARY
==============================*/

function updateSummary(){

const pending=withdrawals.filter(w=>w.status==="pending");

const approved=withdrawals.filter(w=>w.status==="approved");

const rejected=withdrawals.filter(w=>w.status==="rejected");

pendingCount.innerHTML=pending.length;
approvedCount.innerHTML=approved.length;
rejectedCount.innerHTML=rejected.length;
totalCount.innerHTML=withdrawals.length;

pendingAmount.innerHTML=
"UGX "+pending.reduce((a,b)=>a+Number(b.amount),0).toLocaleString();

approvedAmount.innerHTML=
"UGX "+approved.reduce((a,b)=>a+Number(b.amount),0).toLocaleString();

rejectedAmount.innerHTML=
"UGX "+rejected.reduce((a,b)=>a+Number(b.amount),0).toLocaleString();

totalAmount.innerHTML=
"UGX "+withdrawals.reduce((a,b)=>a+Number(b.amount),0).toLocaleString();

}

/*==============================
SEARCH + FILTER
==============================*/

searchInput.addEventListener("input",renderWithdrawals);

statusFilter.addEventListener("change",renderWithdrawals);

/*==============================
RENDER
==============================*/

function renderWithdrawals(){

const keyword=searchInput.value.toLowerCase();

const filter=statusFilter.value;

withdrawalsContainer.innerHTML="";

const filtered=withdrawals.filter(item=>{

const profile=item.profiles||{};

const matchSearch=

(profile.fullname||"").toLowerCase().includes(keyword)||

(profile.email||"").toLowerCase().includes(keyword)||

(profile.phone||"").toLowerCase().includes(keyword);

const matchStatus=

filter==="all"||

item.status===filter;

return matchSearch && matchStatus;

});

if(filtered.length===0){

document.getElementById("emptyState").style.display="block";

return;

}

document.getElementById("emptyState").style.display="none";

filtered.forEach(item=>{

const fee=Number(item.amount)*0.095;

const receive=Number(item.amount)-fee;

const profile=item.profiles||{};

const avatar=(profile.fullname||"U").charAt(0).toUpperCase();

withdrawalsContainer.innerHTML+=`

<div class="withdraw-card">

<div class="card-header">

<div>

<h3>#WD-${item.id.substring(0,6).toUpperCase()}</h3>

<span class="status ${item.status}">

${item.status.toUpperCase()}

</span>

</div>

<div class="request-time">

${new Date(item.created_at).toLocaleString()}

</div>

</div>

<div class="user-section">

<div class="avatar">

${avatar}

</div>

<div class="user-info">

<h3>${profile.fullname||"Unknown User"}</h3>

<p>${profile.email||"-"}</p>

<p>${profile.phone||"-"}</p>

</div>

</div>

<div class="finance-box">

<div class="finance-row">

<span>Withdrawal</span>

<strong>

UGX ${Number(item.amount).toLocaleString()}

</strong>

</div>

<div class="finance-row">

<span>Fee (9.5%)</span>

<strong>

UGX ${fee.toLocaleString()}

</strong>

</div>

<div class="finance-row receive">

<span>Amount To Send</span>

<strong>

UGX ${receive.toLocaleString()}

</strong>

</div>

<div class="finance-row">

<span>Wallet Balance</span>

<strong>

UGX ${Number(profile.wallet_balance||0).toLocaleString()}

</strong>

</div>

</div>

<div class="payment-box">

<div>

<i class="fas fa-mobile-screen"></i>

${item.method}

</div>

<div>

<i class="fas fa-phone"></i>

${item.phone_number}

</div>

</div>

${
item.status==="pending"

?

`

<div class="action-buttons">

<button

class="approve-btn"

onclick="openApprove('${item.id}')">

Approve

</button>

<button

class="reject-btn"

onclick="openReject('${item.id}')">

Reject

</button>

</div>

`

:""

}

</div>

`;

});

  }

/*=========================================
ADMIN WITHDRAWALS
PART 3
=========================================*/

/*==============================
OPEN APPROVE
==============================*/

function openApprove(id){

selectedWithdrawal=

withdrawals.find(w=>w.id===id);

if(!selectedWithdrawal) return;

const fee=
Number(selectedWithdrawal.amount)*0.095;

const receive=
Number(selectedWithdrawal.amount)-fee;

document.getElementById("popupUser").innerHTML=
selectedWithdrawal.profiles.fullname;

document.getElementById("popupAmount").innerHTML=
"UGX "+Number(selectedWithdrawal.amount).toLocaleString();

document.getElementById("popupFee").innerHTML=
"UGX "+fee.toLocaleString();

document.getElementById("popupReceive").innerHTML=
"UGX "+receive.toLocaleString();

document.getElementById("approvePopup")
.style.display="flex";

}

/*==============================
CLOSE POPUPS
==============================*/

document.getElementById("closeApprove")
.onclick=()=>{

document.getElementById("approvePopup")
.style.display="none";

};

document.getElementById("closeReject")
.onclick=()=>{

document.getElementById("rejectPopup")
.style.display="none";

};

/*==============================
OPEN REJECT
==============================*/

function openReject(id){

selectedWithdrawal=

withdrawals.find(w=>w.id===id);

document.getElementById("rejectReason").value="";

document.getElementById("rejectPopup")
.style.display="flex";

}

/*==============================
APPROVE
==============================*/

document.getElementById("confirmApprove")

.addEventListener("click",async()=>{

if(!selectedWithdrawal) return;

showLoading();

const fee=
Number(selectedWithdrawal.amount)*0.095;

const receive=
Number(selectedWithdrawal.amount)-fee;

const balance=
Number(selectedWithdrawal.profiles.wallet_balance);

const newBalance=
balance-Number(selectedWithdrawal.amount);

/* Update withdrawal */

await db

.from("withdrawals")

.update({

status:"approved"

})

.eq("id",selectedWithdrawal.id);

/* Update wallet */

await db

.from("profiles")

.update({

wallet_balance:newBalance

})

.eq("id",selectedWithdrawal.user_id);

/* Wallet transaction */

await db

.from("wallet_transactions")

.insert({

user_id:selectedWithdrawal.user_id,

type:"withdrawal",

amount:selectedWithdrawal.amount,

balance_after:newBalance,

description:"Withdrawal Approved",

status:"completed",

reference_id:selectedWithdrawal.id

});

/* Notification */

await db

.from("user_notifications")

.insert({

user_id:selectedWithdrawal.user_id,

title:"Withdrawal Approved",

message:

`Your withdrawal of UGX ${Number(selectedWithdrawal.amount).toLocaleString()} has been approved.

Fee: UGX ${fee.toLocaleString()}

Amount Received: UGX ${receive.toLocaleString()}

Current Wallet: UGX ${newBalance.toLocaleString()}`,

type:"withdraw"

});

hideLoading();

document.getElementById("approvePopup")
.style.display="none";

document.getElementById("successMessage")
.innerHTML="Withdrawal approved successfully.";

document.getElementById("successPopup")
.style.display="flex";

loadWithdrawals();

});

/*==============================
REJECT
==============================*/

document.getElementById("confirmReject")

.addEventListener("click",async()=>{

if(!selectedWithdrawal) return;

showLoading();

const reason=

document.getElementById("rejectReason")
.value.trim()||

"No reason provided.";

/* Update */

await db

.from("withdrawals")

.update({

status:"rejected"

})

.eq("id",selectedWithdrawal.id);

/* Notify user */

await db

.from("user_notifications")

.insert({

user_id:selectedWithdrawal.user_id,

title:"Withdrawal Rejected",

message:

`Your withdrawal request was rejected.

Reason:

${reason}`,

type:"withdraw"

});

hideLoading();

document.getElementById("rejectPopup")
.style.display="none";

document.getElementById("successMessage")
.innerHTML="Withdrawal rejected.";

document.getElementById("successPopup")
.style.display="flex";

loadWithdrawals();

});

/*==============================
SUCCESS
==============================*/

document.getElementById("closeSuccess")
.onclick=()=>{

document.getElementById("successPopup")
.style.display="none";

};

/*==============================
REFRESH
==============================*/

document.getElementById("refreshBtn")
.onclick=loadWithdrawals;
