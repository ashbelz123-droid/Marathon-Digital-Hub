const db = window.supabaseClient;

let currentUser = null;
let profile = null;
let selectedMethod = "MTN";

/* ===========================
START
=========================== */

document.addEventListener("DOMContentLoaded", async()=>{

const { data:{ user } } = await db.auth.getUser();

if(!user){

window.location.href="login.html";
return;

}

currentUser = user;

await loadProfile();

await loadPaymentAccounts();

});

/* ===========================
LOAD PROFILE
=========================== */

async function loadProfile(){

const { data,error } = await db

.from("profiles")

.select("*")

.eq("id",currentUser.id)

.single();

if(error){

console.log(error);
return;

}

profile=data;

document.getElementById("walletBalance").innerHTML=

"UGX "+Number(profile.wallet_balance||0)

.toLocaleString();

}

/* ===========================
LOAD PAYMENT ACCOUNTS
=========================== */

async function loadPaymentAccounts(){

const { data,error } = await db

.from("payment_settings")

.select("*")

.eq("is_active",true);

if(error){

console.log(error);
return;

}

data.forEach(item=>{

if(item.method.toLowerCase()=="mtn"){

document.getElementById("mtnName").innerHTML=

item.account_name;

document.getElementById("mtnNumber").innerHTML=

item.phone_number;

}

if(item.method.toLowerCase()=="airtel"){

document.getElementById("airtelName").innerHTML=

item.account_name;

document.getElementById("airtelNumber").innerHTML=

item.phone_number;

}

});

}

/* ===========================
COPY BUTTONS
=========================== */

document.getElementById("copyMTN")

.onclick=()=>{

navigator.clipboard.writeText(

document.getElementById("mtnNumber").innerText

);

alert("MTN number copied.");

};

document.getElementById("copyAirtel")

.onclick=()=>{

navigator.clipboard.writeText(

document.getElementById("airtelNumber").innerText

);

alert("Airtel number copied.");

};

/* ===========================
SELECT PAYMENT METHOD
=========================== */

const mtnCard=document.getElementById("mtnCard");
const airtelCard=document.getElementById("airtelCard");

mtnCard.onclick=()=>{

selectedMethod="MTN";

mtnCard.classList.add("active");
airtelCard.classList.remove("active");

document.getElementById("instructionTitle").innerHTML=
"🟡 MTN Mobile Money";

document.getElementById("instructionList").innerHTML=`

<li>Dial *165#</li>

<li>Select <b>Send Money</b>.</li>

<li>Enter the MTN number above.</li>

<li>Enter the deposit amount.</li>

<li>Confirm using your PIN.</li>

<li>Wait for the confirmation SMS.</li>

<li>Copy the Transaction ID.</li>

<li>Return here and submit your deposit request.</li>

`;

};

airtelCard.onclick=()=>{

selectedMethod="Airtel";

airtelCard.classList.add("active");
mtnCard.classList.remove("active");

document.getElementById("instructionTitle").innerHTML=
"🔴 Airtel Money";

document.getElementById("instructionList").innerHTML=`

<li>Dial *185#</li>

<li>Select <b>Send Money</b>.</li>

<li>Enter the Airtel number above.</li>

<li>Enter the deposit amount.</li>

<li>Confirm using your PIN.</li>

<li>Wait for the confirmation SMS.</li>

<li>Copy the Transaction ID.</li>

<li>Return here and submit your deposit request.</li>

`;

};

/* ===========================
LIVE DEPOSIT CALCULATION
=========================== */

document.getElementById("depositAmount")

.addEventListener("input",updateSummary);

function updateSummary(){

const amount=

Number(document.getElementById("depositAmount").value)||0;

const fee=amount*0.095;

const credit=amount-fee;

document.getElementById("feeAmount").innerHTML=

"UGX "+fee.toLocaleString();

document.getElementById("creditAmount").innerHTML=

"UGX "+credit.toLocaleString();

  }

/* ===========================
SUBMIT DEPOSIT
=========================== */

document.getElementById("submitDeposit")

.onclick=async()=>{

const amount=

Number(document.getElementById("depositAmount").value);

const transactionId=

document.getElementById("transactionId")

.value.trim();

if(!amount||amount<=0){

alert("Enter a valid deposit amount.");

return;

}

if(transactionId==""){

alert("Transaction ID is required.");

return;

}

const fee=amount*0.095;

const credit=amount-fee;

const btn=document.getElementById("submitDeposit");

btn.disabled=true;

btn.innerHTML="Submitting...";

/* Save Deposit */

const { error }=await db

.from("deposits")

.insert({

user_id:currentUser.id,

amount:amount,

method:selectedMethod,

transaction_id:transactionId,

payment_message:

"Deposit submitted by "+profile.fullname,

status:"pending"

});

btn.disabled=false;

btn.innerHTML="Submit Deposit Request";

if(error){

alert(error.message);

return;

}

/* User Notification */

await db

.from("user_notifications")

.insert({

user_id:currentUser.id,

title:"Deposit Request Received",

message:

"Your deposit request of UGX "+

amount.toLocaleString()+

" has been received and is awaiting verification.",

type:"info"

});

/* Update Latest Request Card */

document.getElementById("latestStatusBadge")

.className="pendingBadge";

document.getElementById("latestStatusBadge")

.innerHTML="🟡 Pending";

document.getElementById("latestAmount")

.innerHTML="UGX "+amount.toLocaleString();

document.getElementById("latestMethod")

.innerHTML=selectedMethod;

document.getElementById("latestTransaction")

.innerHTML=transactionId;

document.getElementById("latestRequestTime")

.innerHTML=new Date().toLocaleString();

document.getElementById("latestMessage")

.innerHTML=

"Your deposit request has been sent successfully. Please wait while our finance team verifies your payment.";

/* Clear Form */

document.getElementById("depositAmount").value="";

document.getElementById("transactionId").value="";

updateSummary();

loadDepositHistory();

alert(

"Deposit request submitted successfully."

);

};

/* ===========================
LOAD LATEST REQUEST
=========================== */

async function loadLatestRequest(){

const {data,error}=await db

.from("deposits")

.select("*")

.eq("user_id",currentUser.id)

.order("created_at",{ascending:false})

.limit(1)

.single();

if(error||!data)return;

const badge=document.getElementById("latestStatusBadge");

badge.className="";

if(data.status=="approved"){

badge.classList.add("approvedBadge");

badge.innerHTML="🟢 Approved";

}else if(data.status=="rejected"){

badge.classList.add("rejectedBadge");

badge.innerHTML="🔴 Rejected";

}else{

badge.classList.add("pendingBadge");

badge.innerHTML="🟡 Pending";

}

document.getElementById("latestAmount").innerHTML=

"UGX "+Number(data.amount).toLocaleString();

document.getElementById("latestMethod").innerHTML=

data.method;

document.getElementById("latestTransaction").innerHTML=

data.transaction_id;

document.getElementById("latestRequestTime").innerHTML=

new Date(data.created_at).toLocaleString();

document.getElementById("latestMessage").innerHTML=

data.payment_message||"No message";

}

/* ===========================
LOAD DEPOSIT HISTORY
=========================== */

async function loadDepositHistory(){

const history=document.getElementById("depositHistory");

history.innerHTML="Loading...";

const {data,error}=await db

.from("deposits")

.select("*")

.eq("user_id",currentUser.id)

.order("created_at",{ascending:false});

if(error){

history.innerHTML="Failed to load history.";

return;

}

if(data.length===0){

history.innerHTML="

<div class='historyCard'>

No deposits found.

</div>";

return;

}

history.innerHTML="";

data.forEach(item=>{

let badge="pendingBadge";
let text="🟡 Pending";

if(item.status=="approved"){

badge="approvedBadge";
text="🟢 Approved";

}

if(item.status=="rejected"){

badge="rejectedBadge";
text="🔴 Rejected";

}

history.innerHTML+=`

<div class="historyCard">

<div class="historyTop">

<div class="historyAmount">

UGX ${Number(item.amount).toLocaleString()}

</div>

<div class="${badge}">

${text}

</div>

</div>

<div class="historyGrid">

<div>

<span>Method</span>

<b>${item.method}</b>

</div>

<div>

<span>Transaction ID</span>

<b>${item.transaction_id}</b>

</div>

</div>

<div class="historyDate">

${new Date(item.created_at).toLocaleString()}

</div>

</div>

`;

});

}

/* ===========================
AUTO REFRESH
=========================== */

setInterval(async()=>{

await loadProfile();

await loadLatestRequest();

await loadDepositHistory();

},10000);

/* ===========================
INITIAL LOAD
=========================== */

loadLatestRequest();

loadDepositHistory();

console.log("Deposit page ready.");
