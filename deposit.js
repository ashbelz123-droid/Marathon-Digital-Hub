/* ==========================================
   MARATHON DIGITAL HUB
   DEPOSIT.JS
========================================== */

const db = window.supabaseClient;

let currentUser = null;
let profile = null;
let selectedMethod = "MTN";

/* ==========================================
   START
========================================== */

document.addEventListener("DOMContentLoaded", async()=>{

const { data:{ user }, error } = await db.auth.getUser();

if(error){

console.log(error);
return;

}

if(!user){

window.location.replace("login.html");
return;

}

currentUser = user;

await loadProfile();
await loadPaymentAccounts();
await loadLatestDeposit();
await loadDepositHistory();

});

/* ==========================================
   LOAD USER PROFILE
========================================== */

async function loadProfile(){

const { data,error } = await db

.from("profiles")

.select("fullname,phone,wallet_balance")

.eq("id",currentUser.id)

.single();

if(error){

console.log(error);
return;

}

profile=data;

document.getElementById("walletBalance").innerHTML=

"UGX "+Number(profile.wallet_balance||0).toLocaleString();

}

/* ==========================================
   LOAD PAYMENT SETTINGS
========================================== */

async function loadPaymentAccounts(){

const { data,error } = await db

.from("payment_settings")

.select("*")

.eq("is_active",true);

if(error){

console.log(error);
return;

}

data.forEach(account=>{

if(account.method==="MTN"){

document.getElementById("mtnName").textContent=

account.account_name;

document.getElementById("mtnNumber").textContent=

account.phone_number;

}

if(account.method==="Airtel"){

document.getElementById("airtelName").textContent=

account.account_name;

document.getElementById("airtelNumber").textContent=

account.phone_number;

}

});

}

/* ==========================================
   COPY ACCOUNT NUMBERS
========================================== */

document.getElementById("copyMTN").onclick = async () => {

const number = document.getElementById("mtnNumber").textContent;

await navigator.clipboard.writeText(number);

alert("MTN number copied successfully.");

};

document.getElementById("copyAirtel").onclick = async () => {

const number = document.getElementById("airtelNumber").textContent;

await navigator.clipboard.writeText(number);

alert("Airtel number copied successfully.");

};

/* ==========================================
   PAYMENT METHOD
========================================== */

document.getElementById("mtnMethod").onclick = () => {

selectedMethod = "MTN";

document.getElementById("mtnMethod").classList.add("active");
document.getElementById("airtelMethod").classList.remove("active");

};

document.getElementById("airtelMethod").onclick = () => {

selectedMethod = "Airtel";

document.getElementById("airtelMethod").classList.add("active");
document.getElementById("mtnMethod").classList.remove("active");

};

/* ==========================================
   SUBMIT DEPOSIT
========================================== */

document.getElementById("submitDeposit").onclick = async () => {

const amount = Number(document.getElementById("depositAmount").value);

const transactionId = document.getElementById("transactionId").value.trim();

if(!amount || amount <= 0){

alert("Enter a valid deposit amount.");

return;

}

if(transactionId === ""){

alert("Enter the Transaction ID from the SMS.");

return;

}

const btn = document.getElementById("submitDeposit");

btn.disabled = true;

btn.innerHTML = "Submitting...";

/* Save Deposit */

const { data: deposit, error } = await db

.from("deposits")

.insert({

user_id: currentUser.id,

amount: amount,

method: selectedMethod,

transaction_id: transactionId,

status: "pending",

payment_message: transactionId,

user_message: "Deposit request submitted."

})

.select()

.single();

if(error){

btn.disabled = false;

btn.innerHTML = "Submit Deposit Request";

alert(error.message);

return;

}

/* Notify Admin */

await db

.from("admin_notifications")

.insert({

title: "New Deposit Request",

message: `${profile.fullname} submitted a ${selectedMethod} deposit of UGX ${amount.toLocaleString()}.`,

type: "deposit",

is_read: false,

created_at: new Date().toISOString()

});

btn.disabled = false;

btn.innerHTML = "Submit Deposit Request";

document.getElementById("depositAmount").value = "";

document.getElementById("transactionId").value = "";

await loadLatestDeposit();

await loadDepositHistory();

alert("Deposit request submitted successfully. It will be reviewed by the admin.");

};

/* ==========================================
   LOAD LATEST DEPOSIT
========================================== */

async function loadLatestDeposit(){

const { data, error } = await db
.from("deposits")
.select("*")
.eq("user_id", currentUser.id)
.order("created_at", { ascending:false })
.limit(1);

if(error){

console.log(error);
return;

}

if(!data || data.length===0){

document.getElementById("latestStatus").innerHTML="🟡 No Request";
document.getElementById("latestAmount").innerHTML="UGX 0";
document.getElementById("latestMethod").innerHTML="-";
document.getElementById("latestTransaction").innerHTML="-";
document.getElementById("latestTime").innerHTML="-";

return;

}

const deposit=data[0];

let badge="🟡 Pending";

if(deposit.status==="approved"){

badge="🟢 Approved";

}

if(deposit.status==="rejected"){

badge="🔴 Rejected";

}

document.getElementById("latestStatus").innerHTML=badge;

document.getElementById("latestAmount").innerHTML=
"UGX "+Number(deposit.amount).toLocaleString();

document.getElementById("latestMethod").innerHTML=
deposit.method || "-";

document.getElementById("latestTransaction").innerHTML=
deposit.transaction_id || "-";

document.getElementById("latestTime").innerHTML=
new Date(deposit.created_at).toLocaleString();

}

/* ==========================================
   LOAD DEPOSIT HISTORY
========================================== */

async function loadDepositHistory(){

const { data, error } = await db
.from("deposits")
.select("*")
.eq("user_id", currentUser.id)
.order("created_at",{ascending:false});

if(error){

console.log(error);
return;

}

const history=document.getElementById("depositHistory");

history.innerHTML="";

if(!data || data.length===0){

history.innerHTML=`

<div class="history-empty">

No deposit requests yet.

</div>

`;

return;

}

data.forEach(item=>{

let color="#ffcc00";
let status="🟡 Pending";

if(item.status==="approved"){

color="#00ff88";
status="🟢 Approved";

}

if(item.status==="rejected"){

color="#ff4444";
status="🔴 Rejected";

}

history.innerHTML+=`

<div class="history-item" style="border-left:4px solid ${color};">

<h4>UGX ${Number(item.amount).toLocaleString()}</h4>

<p><b>Status:</b> ${status}</p>

<p><b>Method:</b> ${item.method}</p>

<p><b>Transaction ID:</b> ${item.transaction_id || "-"}</p>

<p><b>Date:</b> ${new Date(item.created_at).toLocaleString()}</p>

</div>

`;

});

}
