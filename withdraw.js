/*=========================================
MARATHON DIGITAL HUB
WITHDRAW.JS
PART 1
=========================================*/

const db = window.supabaseClient;

/*==============================
ELEMENTS
==============================*/

const walletBalance =
document.getElementById("walletBalance");

const withdrawAmount =
document.getElementById("withdrawAmount");

const withdrawMethod =
document.getElementById("withdrawMethod");

const receiverPhone =
document.getElementById("receiverPhone");

const summaryAmount =
document.getElementById("summaryAmount");

const summaryFee =
document.getElementById("summaryFee");

const summaryReceive =
document.getElementById("summaryReceive");

const popupAmount =
document.getElementById("popupAmount");

const popupFee =
document.getElementById("popupFee");

const popupReceive =
document.getElementById("popupReceive");

const withdrawFormCard =
document.getElementById("withdrawFormCard");

const pendingCard =
document.getElementById("pendingWithdrawalCard");

const loadingScreen =
document.getElementById("loadingScreen");

/*==============================
CURRENT USER
==============================*/

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

const {data:{user}} =
await db.auth.getUser();

if(!user){

location.href="login.html";

return;

}

currentUser = user;

const {data,error} = await db

.from("profiles")

.select("*")

.eq("id",user.id)

.single();

hideLoading();

if(error){

alert("Unable to load profile.");

return;

}

profile = data;

walletBalance.innerHTML =
"UGX " +
Number(profile.wallet_balance)
.toLocaleString();

checkPendingWithdrawal();

}

/*==============================
START
==============================*/

document.addEventListener(

"DOMContentLoaded",

loadUser

);

/*=========================================
WITHDRAW.JS
PART 2
=========================================*/

/*==============================
LIVE CALCULATIONS
==============================*/

withdrawAmount.addEventListener("input", calculateWithdrawal);

function calculateWithdrawal(){

const amount = Number(withdrawAmount.value) || 0;

const fee = amount * 0.095;

const receive = amount - fee;

summaryAmount.innerHTML =
"UGX " + amount.toLocaleString();

summaryFee.innerHTML =
"UGX " + fee.toLocaleString();

summaryReceive.innerHTML =
"UGX " + receive.toLocaleString();

popupAmount.innerHTML =
"UGX " + amount.toLocaleString();

popupFee.innerHTML =
"UGX " + fee.toLocaleString();

popupReceive.innerHTML =
"UGX " + receive.toLocaleString();

}

/*==============================
CHECK PENDING
==============================*/

async function checkPendingWithdrawal(){

const {data,error} = await db

.from("withdrawals")

.select("*")

.eq("user_id",currentUser.id)

.eq("status","Pending")

.order("created_at",{ascending:false})

.limit(1);

if(error){

console.log(error);

return;

}

if(data.length>0){

const w = data[0];

withdrawFormCard.style.display="none";

pendingCard.style.display="block";

document.getElementById("pendingAmount").innerHTML =
"UGX " + Number(w.amount).toLocaleString();

document.getElementById("pendingFee").innerHTML =
"UGX " + Number(w.fee).toLocaleString();

document.getElementById("pendingNet").innerHTML =
"UGX " + Number(w.net_amount).toLocaleString();

document.getElementById("pendingPhone").innerHTML =
w.receiver_phone;

}else{

withdrawFormCard.style.display="block";

pendingCard.style.display="none";

}

}

/*==============================
POPUP
==============================*/

const confirmPopup =
document.getElementById("confirmPopup");

document

.getElementById("withdrawBtn")

.onclick = function(){

const amount = Number(withdrawAmount.value);

if(amount<=0){

alert("Enter a valid amount.");

return;

}

if(amount>Number(profile.wallet_balance)){

alert("Insufficient wallet balance.");

return;

}

if(withdrawMethod.value==""){

alert("Select Mobile Money network.");

return;

}

if(receiverPhone.value.trim()==""){

alert("Enter receiver phone number.");

return;

}

confirmPopup.style.display="flex";

};

document

.getElementById("closePopup")

.onclick=function(){

confirmPopup.style.display="none";

};

/*=========================================
WITHDRAW.JS
PART 3
=========================================*/

/*==============================
CONFIRM WITHDRAWAL
==============================*/

document.getElementById("confirmWithdrawal")

.addEventListener("click", async ()=>{

confirmPopup.style.display="none";

showLoading();

try{

const amount = Number(withdrawAmount.value);

const fee = amount * 0.095;

const net = amount - fee;

/* Prevent duplicate pending withdrawal */

const {data:pending} = await db

.from("withdrawals")

.select("id")

.eq("user_id",currentUser.id)

.eq("status","Pending");

if(pending && pending.length>0){

hideLoading();

alert("You already have a pending withdrawal.");

return;

}

/* Save withdrawal */

const {error} = await db

.from("withdrawals")

.insert({

user_id:currentUser.id,

amount:amount,

fee:fee,

net_amount:net,

method:withdrawMethod.value,

receiver_phone:receiverPhone.value,

status:"Pending"

});

if(error) throw error;

/* Notification */

await db

.from("notifications")

.insert({

user_id:currentUser.id,

title:"Withdrawal Submitted",

message:`Your withdrawal request of UGX ${amount.toLocaleString()} has been received and is awaiting approval.`

});

hideLoading();

document.getElementById("successPopup").style.display="flex";

checkPendingWithdrawal();

loadHistory();

}catch(err){

hideLoading();

alert(err.message);

}

});

/*==============================
SUCCESS BUTTON
==============================*/

document.getElementById("successOkBtn")

.onclick=function(){

document.getElementById("successPopup").style.display="none";

};

/*==============================
CANCEL WITHDRAWAL
==============================*/

document.getElementById("cancelWithdrawalBtn")

.addEventListener("click",async()=>{

if(!confirm("Cancel this pending withdrawal?")) return;

showLoading();

const {data} = await db

.from("withdrawals")

.select("id")

.eq("user_id",currentUser.id)

.eq("status","Pending")

.single();

if(data){

await db

.from("withdrawals")

.update({

status:"Cancelled"

})

.eq("id",data.id);

await db

.from("notifications")

.insert({

user_id:currentUser.id,

title:"Withdrawal Cancelled",

message:"Your pending withdrawal request has been cancelled."

});

}

hideLoading();

checkPendingWithdrawal();

loadHistory();

});

/*==============================
WITHDRAWAL HISTORY
==============================*/

async function loadHistory(){

const {data,error} = await db

.from("withdrawals")

.select("*")

.eq("user_id",currentUser.id)

.order("created_at",{ascending:false})

.limit(10);

const history =

document.getElementById("withdrawHistory");

history.innerHTML="";

if(error || !data || data.length===0){

history.innerHTML=`

<div class="empty-box">

<i class="fas fa-wallet"></i>

<p>No withdrawal history available.</p>

</div>`;

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

</div>`;

});

}

/*==============================
REFRESH STATUS
==============================*/

document.getElementById("refreshStatusBtn")

.onclick=()=>{

checkPendingWithdrawal();

loadHistory();

};
