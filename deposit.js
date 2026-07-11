/*=========================================
MARATHON DIGITAL HUB
DEPOSIT PAGE
PART 1
=========================================*/

const db = supabaseClient;

let currentUser = null;
let selectedMethod = "MTN";

/*==============================
START
==============================*/

window.addEventListener("DOMContentLoaded", async ()=>{

await loadProfile();

await loadPaymentAccounts();

await loadLatestDeposit();

await loadDepositHistory();

});

/*==============================
LOAD PROFILE
==============================*/

async function loadProfile(){

const {

data:{user}

}=await db.auth.getUser();

if(!user){

location.href="login.html";

return;

}

currentUser=user;

const {data,error}=await db

.from("profiles")

.select("wallet_balance,fullname")

.eq("id",user.id)

.single();

if(error){

console.log(error);

return;

}

document.getElementById("walletBalance").innerHTML=

"UGX "+Number(data.wallet_balance||0).toLocaleString();

}

/*==============================
LOAD PAYMENT SETTINGS
==============================*/

async function loadPaymentAccounts(){

const {data,error}=await db

.from("payment_settings")

.select("*")

.eq("is_active",true);

if(error)return;

data.forEach(item=>{

if(item.method==="MTN"){

document.getElementById("mtnName").innerHTML=

item.account_name;

document.getElementById("mtnNumber").innerHTML=

item.phone_number;

}

if(item.method==="Airtel"){

document.getElementById("airtelName").innerHTML=

item.account_name;

document.getElementById("airtelNumber").innerHTML=

item.phone_number;

}

});

}

/*==============================
PAYMENT METHOD
==============================*/

document.getElementById("mtnMethod")

.onclick=()=>{

selectedMethod="MTN";

document.getElementById("mtnMethod")

.classList.add("active");

document.getElementById("airtelMethod")

.classList.remove("active");

};

document.getElementById("airtelMethod")

.onclick=()=>{

selectedMethod="Airtel";

document.getElementById("airtelMethod")

.classList.add("active");

document.getElementById("mtnMethod")

.classList.remove("active");

};

/*==============================
COPY BUTTONS
==============================*/

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

/*=========================================
SUBMIT DEPOSIT
PART 2
=========================================*/

document.getElementById("submitDeposit")

.onclick = submitDeposit;

async function submitDeposit(){

const btn =
document.getElementById("submitDeposit");

btn.disabled = true;

btn.innerHTML = "Submitting...";

const amount =
Number(document.getElementById("depositAmount").value);

const sender =
document.getElementById("senderNumber").value.trim();

const transaction =
document.getElementById("transactionId").value.trim().toUpperCase();

const message =
document.getElementById("depositMessage").value.trim();

/*==============================
VALIDATION
==============================*/

if(amount<=0){

alert("Enter a valid deposit amount.");

resetButton();

return;

}

if(amount<10000){

alert("Minimum deposit is UGX 10,000.");

resetButton();

return;

}

if(amount>50000000){

alert("Maximum deposit is UGX 50,000,000.");

resetButton();

return;

}

if(sender===""){

alert("Sender phone number is required.");

resetButton();

return;

}

if(!/^(\+256|0)7\d{8}$/.test(sender)){

alert("Enter a valid Uganda mobile number.");

resetButton();

return;

}

if(transaction===""){

alert("Transaction ID is required.");

resetButton();

return;

}

if(transaction.length<6){

alert("Transaction ID is too short.");

resetButton();

return;

}

/*==============================
CHECK PENDING REQUEST
==============================*/

const {data:pending}=await db

.from("deposits")

.select("id")

.eq("user_id",currentUser.id)

.eq("status","pending");

if(pending && pending.length){

alert("You already have a pending deposit request.");

resetButton();

return;

}

/*==============================
CHECK DUPLICATE
==============================*/

const {data:duplicate}=await db

.from("deposits")

.select("id")

.eq("transaction_id",transaction);

if(duplicate && duplicate.length){

alert("This Transaction ID has already been used.");

resetButton();

return;

}

/*==============================
SAVE REQUEST
==============================*/

const {error}=await db

.from("deposits")

.insert({

user_id:currentUser.id,

amount:amount,

method:selectedMethod,

phone_number:sender,

transaction_id:transaction,

payment_message:message,

status:"pending"

});

if(error){

alert(error.message);

resetButton();

return;

}

alert(

"Deposit request submitted successfully.\n\nPlease wait while our finance team reviews your payment."

);

document.getElementById("depositAmount").value="";

document.getElementById("senderNumber").value="";

document.getElementById("transactionId").value="";

document.getElementById("depositMessage").value="";

await loadLatestDeposit();

await loadDepositHistory();

resetButton();

}

/*==============================
RESET BUTTON
==============================*/

function resetButton(){

const btn=document.getElementById("submitDeposit");

btn.disabled=false;

btn.innerHTML="Submit Deposit Request";

   }

/*=========================================
LATEST DEPOSIT
=========================================*/

async function loadLatestDeposit(){

const {data,error}=await db

.from("deposits")

.select("*")

.eq("user_id",currentUser.id)

.order("created_at",{ascending:false})

.limit(1);

if(error)return;

if(!data.length){

document.getElementById("latestStatus").innerHTML="🟡 No Request";

document.getElementById("latestAmount").innerHTML="UGX 0";

document.getElementById("latestMethod").innerHTML="-";

document.getElementById("latestSender").innerHTML="-";

document.getElementById("latestTransaction").innerHTML="-";

document.getElementById("latestTime").innerHTML="-";

document.getElementById("cancelDeposit").style.display="none";

return;

}

const deposit=data[0];

const badge=document.getElementById("latestStatus");

badge.className="status "+deposit.status;

badge.innerHTML=

deposit.status.charAt(0).toUpperCase()+deposit.status.slice(1);

document.getElementById("latestAmount").innerHTML=

"UGX "+Number(deposit.amount).toLocaleString();

document.getElementById("latestMethod").innerHTML=

deposit.method||"-";

document.getElementById("latestSender").innerHTML=

deposit.phone_number||"-";

document.getElementById("latestTransaction").innerHTML=

deposit.transaction_id||"-";

document.getElementById("latestTime").innerHTML=

new Date(deposit.created_at).toLocaleString();

if(deposit.status==="pending"){

document.getElementById("cancelDeposit").style.display="block";

document.getElementById("cancelDeposit").dataset.id=deposit.id;

}else{

document.getElementById("cancelDeposit").style.display="none";

}

}

/*=========================================
DEPOSIT HISTORY
=========================================*/

async function loadDepositHistory(){

const box=document.getElementById("depositHistory");

const {data,error}=await db

.from("deposits")

.select("*")

.eq("user_id",currentUser.id)

.order("created_at",{ascending:false});

if(error)return;

if(!data.length){

box.innerHTML=`

<div class="history-empty">

No deposit history available.

</div>

`;

return;

}

box.innerHTML="";

data.forEach(item=>{

box.innerHTML+=`

<div class="history-card">

<div class="top">

<h4>UGX ${Number(item.amount).toLocaleString()}</h4>

<span class="status ${item.status}">

${item.status}

</span>

</div>

<p><strong>Method:</strong> ${item.method}</p>

<p><strong>Sender:</strong> ${item.phone_number||"-"}</p>

<p><strong>Transaction ID:</strong> ${item.transaction_id||"-"}</p>

<p><strong>Date:</strong>

${new Date(item.created_at).toLocaleString()}

</p>

</div>

`;

});

}

/*=========================================
CANCEL PENDING DEPOSIT
=========================================*/

document.getElementById("cancelDeposit").onclick=

async function(){

const id=this.dataset.id;

if(!id)return;

if(!confirm(

"Cancel this pending deposit request?"

)) return;

const {error}=await db

.from("deposits")

.update({

status:"cancelled"

})

.eq("id",id)

.eq("user_id",currentUser.id);

if(error){

alert(error.message);

return;

}

alert("Deposit request cancelled.");

await loadLatestDeposit();

await loadDepositHistory();

};

/*=========================================
REAL-TIME UPDATES
=========================================*/

db

.channel("deposit_updates")

.on(

"postgres_changes",

{

event:"UPDATE",

schema:"public",

table:"deposits"

},

payload=>{

if(payload.new.user_id===currentUser.id){

loadLatestDeposit();

loadDepositHistory();

loadProfile();

}

}

)

.subscribe();
