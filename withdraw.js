/*=========================================
MARATHON DIGITAL HUB
withdraw.js
PART 1
=========================================*/

const db = window.supabaseClient;

/*==============================
ELEMENTS
==============================*/

const walletBalance = document.getElementById("walletBalance");

const withdrawForm = document.getElementById("withdrawForm");

const pendingCard = document.getElementById("pendingCard");

const withdrawAmount = document.getElementById("withdrawAmount");

const withdrawMethod = document.getElementById("withdrawMethod");

const phoneNumber = document.getElementById("phoneNumber");

const summaryAmount = document.getElementById("summaryAmount");

const summaryFee = document.getElementById("summaryFee");

const summaryReceive = document.getElementById("summaryReceive");

const popupAmount = document.getElementById("popupAmount");

const popupFee = document.getElementById("popupFee");

const popupReceive = document.getElementById("popupReceive");

const confirmPopup = document.getElementById("confirmPopup");

const loadingScreen = document.getElementById("loadingScreen");

let currentUser = null;

let profile = null;

/*==============================
LOADING
==============================*/

function showLoading(){

loadingScreen.style.display="flex";

}

function hideLoading(){

loadingScreen.style.display="none";

}

/*==============================
LOAD USER
==============================*/

async function loadUser(){

showLoading();

const {data:{user},error}=await db.auth.getUser();

if(error || !user){

window.location.href="login.html";

return;

}

currentUser=user;

await loadProfile();

}

/*==============================
LOAD PROFILE
==============================*/

async function loadProfile(){

const {data,error}=await db

.from("profiles")

.select("*")

.eq("id",currentUser.id)

.single();

hideLoading();

if(error){

alert("Unable to load your profile.");

return;

}

profile=data;

walletBalance.innerHTML=

"UGX "+Number(profile.wallet_balance).toLocaleString();

checkPendingWithdrawal();

loadWithdrawalHistory();

}

/*==============================
START
==============================*/

document.addEventListener(

"DOMContentLoaded",

loadUser

);

  /*=========================================
MARATHON DIGITAL HUB
withdraw.js
PART 2
=========================================*/

/*==============================
LIVE CALCULATION
==============================*/

withdrawAmount.addEventListener("input",updateSummary);

function updateSummary(){

const amount=Number(withdrawAmount.value)||0;

const fee=amount*0.095;

const receive=amount-fee;

summaryAmount.innerHTML=
"UGX "+amount.toLocaleString();

summaryFee.innerHTML=
"UGX "+fee.toLocaleString();

summaryReceive.innerHTML=
"UGX "+receive.toLocaleString();

popupAmount.innerHTML=
"UGX "+amount.toLocaleString();

popupFee.innerHTML=
"UGX "+fee.toLocaleString();

popupReceive.innerHTML=
"UGX "+receive.toLocaleString();

}

/*==============================
CHECK PENDING
==============================*/

async function checkPendingWithdrawal(){

const {data,error}=await db

.from("withdrawals")

.select("*")

.eq("user_id",currentUser.id)

.eq("status","pending")

.order("created_at",{ascending:false})

.limit(1);

if(error){

console.log(error);

return;

}

if(data.length>0){

const withdrawal=data[0];

withdrawForm.style.display="none";

pendingCard.style.display="block";

document.getElementById("pendingAmount").innerHTML=
"UGX "+Number(withdrawal.amount).toLocaleString();

document.getElementById("pendingFee").innerHTML=
"UGX "+Number(withdrawal.fee).toLocaleString();

document.getElementById("pendingReceive").innerHTML=
"UGX "+Number(withdrawal.net_amount).toLocaleString();

document.getElementById("pendingPhone").innerHTML=
withdrawal.phone_number;

}else{

withdrawForm.style.display="block";

pendingCard.style.display="none";

}

}

/*==============================
OPEN CONFIRM POPUP
==============================*/

document.getElementById("withdrawBtn")

.addEventListener("click",()=>{

const amount=Number(withdrawAmount.value);

if(amount<=0){

alert("Enter a valid withdrawal amount.");

return;

}

if(amount>Number(profile.wallet_balance)){

alert("Insufficient wallet balance.");

return;

}

if(withdrawMethod.value===""){

alert("Please select a payment method.");

return;

}

if(phoneNumber.value.trim()===""){

alert("Please enter your phone number.");

return;

}

confirmPopup.style.display="flex";

});

/*==============================
CLOSE POPUP
==============================*/

document.getElementById("cancelPopup")

.addEventListener("click",()=>{

confirmPopup.style.display="none";

});

/*=========================================
MARATHON DIGITAL HUB
withdraw.js
PART 3
=========================================*/

/*==============================
CONFIRM WITHDRAWAL
==============================*/

document.getElementById("confirmWithdrawal")

.addEventListener("click",async()=>{

confirmPopup.style.display="none";

showLoading();

try{

const amount=Number(withdrawAmount.value);

const fee=amount*0.095;

const net=amount-fee;

/* Check if a pending withdrawal already exists */

const {data:pending}=await db

.from("withdrawals")

.select("id")

.eq("user_id",currentUser.id)

.eq("status","pending");

if(pending && pending.length>0){

hideLoading();

alert("You already have a pending withdrawal.");

return;

}

/* Save withdrawal */

const {error}=await db

.from("withdrawals")

.insert({

user_id:currentUser.id,

amount:amount,

fee:fee,

net_amount:net,

method:withdrawMethod.value,

phone_number:phoneNumber.value,

status:"pending"

});

if(error) throw error;

/* User notification */

await db

.from("user_notifications")

.insert({

user_id:currentUser.id,

title:"Withdrawal Submitted",

message:
`Your withdrawal request of UGX ${amount.toLocaleString()} has been received. A 9.5% processing fee has been applied. Please wait for approval.`,

type:"withdraw"

});

hideLoading();

document.getElementById("successPopup").style.display="flex";

checkPendingWithdrawal();

loadWithdrawalHistory();

}catch(err){

hideLoading();

alert(err.message);

}

});

/*==============================
SUCCESS POPUP
==============================*/

document.getElementById("successOk")

.addEventListener("click",()=>{

document.getElementById("successPopup").style.display="none";

});

/*==============================
CANCEL PENDING
==============================*/

document.getElementById("cancelBtn")

.addEventListener("click",async()=>{

if(!confirm("Cancel this withdrawal request?")) return;

showLoading();

const {data}=await db

.from("withdrawals")

.select("id")

.eq("user_id",currentUser.id)

.eq("status","pending")

.single();

if(data){

await db

.from("withdrawals")

.update({

status:"cancelled"

})

.eq("id",data.id);

await db

.from("user_notifications")

.insert({

user_id:currentUser.id,

title:"Withdrawal Cancelled",

message:"Your pending withdrawal has been cancelled successfully.",

type:"withdraw"

});

}

hideLoading();

checkPendingWithdrawal();

loadWithdrawalHistory();

});

/*==============================
WITHDRAWAL HISTORY
==============================*/

async function loadWithdrawalHistory(){

const {data,error}=await db

.from("withdrawals")

.select("*")

.eq("user_id",currentUser.id)

.order("created_at",{ascending:false})

.limit(10);

const history=document.getElementById("withdrawHistory");

history.innerHTML="";

if(error || !data || data.length===0){

history.innerHTML=`

<div class="empty-history">

<i class="fas fa-wallet"></i>

<p>No withdrawals yet.</p>

</div>

`;

return;

}

data.forEach(item=>{

history.innerHTML+=`

<div class="history-item">

<div>

<strong>UGX ${Number(item.amount).toLocaleString()}</strong>

<br>

<small>${item.method}</small>

</div>

<div>

<span class="status ${item.status.toLowerCase()}">

${item.status}

</span>

</div>

</div>

`;

});

}

/*==============================
REFRESH STATUS
==============================*/

document.getElementById("refreshBtn")

.addEventListener("click",()=>{

checkPendingWithdrawal();

loadWithdrawalHistory();

});
