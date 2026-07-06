/* ==========================================
   MARATHON DIGITAL HUB
   DEPOSIT PAGE
========================================== */

const db = window.supabaseClient;

let currentUser = null;
let profile = null;
let selectedMethod = "MTN";

/* ==========================================
   PAGE START
========================================== */

document.addEventListener("DOMContentLoaded", async()=>{

const { data:{ user } } = await db.auth.getUser();

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
   LOAD PROFILE
========================================== */

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

"UGX "+Number(profile.wallet_balance||0).toLocaleString();

}

/* ==========================================
   LOAD PAYMENT ACCOUNTS
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

data.forEach(item=>{

if(item.method.toLowerCase()=="mtn"){

document.getElementById("mtnName").innerHTML=item.account_name;

document.getElementById("mtnNumber").innerHTML=item.phone_number;

}

if(item.method.toLowerCase()=="airtel"){

document.getElementById("airtelName").innerHTML=item.account_name;

document.getElementById("airtelNumber").innerHTML=item.phone_number;

}

});

}

/* ==========================================
   COPY PAYMENT NUMBERS
========================================== */

document.getElementById("copyMTN").onclick=()=>{

navigator.clipboard.writeText(

document.getElementById("mtnNumber").innerText

);

alert("MTN number copied successfully.");

};

document.getElementById("copyAirtel").onclick=()=>{

navigator.clipboard.writeText(

document.getElementById("airtelNumber").innerText

);

alert("Airtel number copied successfully.");

};

/* ==========================================
   PAYMENT METHOD
========================================== */

document.getElementById("mtnMethod").onclick=()=>{

selectedMethod="MTN";

document.getElementById("mtnMethod").classList.add("active");

document.getElementById("airtelMethod").classList.remove("active");

};

document.getElementById("airtelMethod").onclick=()=>{

selectedMethod="Airtel";

document.getElementById("airtelMethod").classList.add("active");

document.getElementById("mtnMethod").classList.remove("active");

};

/* ==========================================
   SUBMIT DEPOSIT REQUEST
========================================== */

document.getElementById("submitDeposit").onclick=async()=>{

const amount=document.getElementById("depositAmount").value.trim();

const transactionId=document.getElementById("transactionId").value.trim();

if(amount===""){

alert("Please enter the deposit amount.");

return;

}

if(Number(amount)<=0){

alert("Please enter a valid amount.");

return;

}

if(transactionId===""){

alert("Please enter the Transaction ID from the SMS.");

return;

}

const btn=document.getElementById("submitDeposit");

btn.disabled=true;

btn.innerHTML="Submitting...";

const { error }=await db

.from("deposits")

.insert({

user_id:currentUser.id,

amount:Number(amount),

method:selectedMethod,

transaction_id:transactionId,

status:"pending"

});

btn.disabled=false;

btn.innerHTML="Submit Deposit Request";

if(error){

alert(error.message);

return;

}

document.getElementById("depositAmount").value="";

document.getElementById("transactionId").value="";

await loadLatestDeposit();

await loadDepositHistory();

alert("Your deposit request has been submitted successfully. Please wait while our team verifies your payment.");

};

/* ==========================================
   LOAD LATEST DEPOSIT
========================================== */

async function loadLatestDeposit(){

const { data,error } = await db

.from("deposits")

.select("*")

.eq("user_id",currentUser.id)

.order("created_at",{ascending:false})

.limit(1);

if(error){

console.log(error);
return;

}

if(data.length==0){

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

deposit.method;

document.getElementById("latestTransaction").innerHTML=

deposit.transaction_id;

document.getElementById("latestTime").innerHTML=

new Date(deposit.created_at).toLocaleString();

}

/* ==========================================
   LOAD DEPOSIT HISTORY
========================================== */

async function loadDepositHistory(){

const { data,error } = await db

.from("deposits")

.select("*")

.eq("user_id",currentUser.id)

.order("created_at",{ascending:false});

if(error){

console.log(error);

return;

}

const history=document.getElementById("depositHistory");

history.innerHTML="";

if(data.length===0){

history.innerHTML=`

<div class="history-empty">

No deposit requests found.

</div>

`;

return;

}

data.forEach(item=>{

let status="🟡 Pending";

if(item.status==="approved"){

status="🟢 Approved";

}

if(item.status==="rejected"){

status="🔴 Rejected";

}

history.innerHTML+=`

<div class="history-item">

<h4>

UGX ${Number(item.amount).toLocaleString()}

</h4>

<p><b>Status:</b> ${status}</p>

<p><b>Method:</b> ${item.method}</p>

<p><b>Transaction ID:</b> ${item.transaction_id}</p>

<p><b>Date:</b> ${new Date(item.created_at).toLocaleString()}</p>

</div>

`;

});

  }
