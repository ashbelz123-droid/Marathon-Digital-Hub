/*=========================================
MARATHON DIGITAL HUB
PROFILE.JS
PART 1
=========================================*/

const db = window.supabaseClient;

let currentUser = null;
let profile = null;

document.addEventListener("DOMContentLoaded", async () => {

try{

const { data:{ user } } = await db.auth.getUser();

if(!user){

window.location.href="login.html";
return;

}

currentUser = user;

await loadProfile();

await loadWallet();

await loadStats();

await loadPersonalInfo();

hideLoader();

}catch(err){

console.error(err);

}

});

/*=========================================
LOAD PROFILE
=========================================*/

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

profile = data;

/* Profile */

document.getElementById("fullName").textContent =
data.fullname || "User";

document.getElementById("email").textContent =
data.email || "";

document.getElementById("membershipBadge").textContent =
data.membership || "Standard";

document.getElementById("statusBadge").textContent =
data.account_status || "Active";

document.getElementById("kycBadge").textContent =
data.kyc_status || "Not Verified";

/* Avatar */

if(data.avatar_url){

document.getElementById("profileAvatar").src =
data.avatar_url;

}

/* Level */

const level=document.getElementById("userLevel");

if(level){

level.textContent=data.level || 1;

}

}

/*=========================================
LOAD WALLET
=========================================*/

async function loadWallet(){

const balance =
Number(profile.wallet_balance || 0);

document.getElementById("walletBalance").textContent =
"UGX " + balance.toLocaleString();

}

/*=========================================
LOAD PERSONAL INFO
=========================================*/

async function loadPersonalInfo(){

document.getElementById("phoneNumber").textContent =
profile.phone || "Not Added";

document.getElementById("emailAddress").textContent =
profile.email || "-";

document.getElementById("country").textContent =
profile.country || "Not Set";

document.getElementById("gender").textContent =
profile.gender || "Not Set";

document.getElementById("dob").textContent =
profile.date_of_birth || "Not Set";

document.getElementById("memberSince").textContent =
new Date(profile.created_at).toLocaleDateString();

              }

/*=========================================
PROFILE.JS
PART 2
=========================================*/

/*=========================================
LOAD MACHINE STATISTICS
=========================================*/

async function loadStats(){

const { data:userMachines, error } = await db

.from("user_machines")

.select("*")

.eq("user_id", currentUser.id);

if(error){

console.log(error);
return;

}

const active =
userMachines.filter(m => m.status === "active");

const completed =
userMachines.filter(m => m.completed === true);

let totalIncome = 0;

active.forEach(machine=>{

totalIncome += Number(machine.earned_amount || 0);

});

/* Active Machines */

document.getElementById("activeMachines").textContent =
active.length;

/* Completed Machines */

document.getElementById("completedMachines").textContent =
completed.length;

/* Investment */

document.getElementById("totalInvested").textContent =
"UGX " +
Number(profile.total_invested || 0).toLocaleString();

/* Profit */

document.getElementById("totalProfit").textContent =
"UGX " +
Number(profile.total_profit || 0).toLocaleString();

/* Daily Income */

document.getElementById("dailyIncome").textContent =
"UGX " +
totalIncome.toLocaleString();

/*=========================================
NEXT PROFIT TIMER
=========================================*/

const next=document.getElementById("nextProfit");

if(next && active.length>0){

const nextTime=new Date();

nextTime.setHours(nextTime.getHours()+24);

next.textContent=
nextTime.toLocaleTimeString([],{

hour:"2-digit",
minute:"2-digit"

});

}

await loadReferral();

}

/*=========================================
LOAD REFERRALS
=========================================*/

async function loadReferral(){

const { data:referrals,error } = await db

.from("referrals")

.select("*")

.eq("referrer_id",currentUser.id);

if(error){

console.log(error);
return;

}

document.getElementById("teamMembers").textContent =
referrals.length;

document.getElementById("totalTeam").textContent =
referrals.length;

const activeTeam = referrals.filter(r =>
r.first_machine_purchased === true
);

document.getElementById("activeTeam").textContent =
activeTeam.length;

document.getElementById("referralBonus").textContent =
"UGX " +
Number(profile.total_referral_bonus || 0)
.toLocaleString();

document.getElementById("teamInvestment").textContent =
"UGX " +
Number(profile.total_referral_bonus || 0)
.toLocaleString();

/*=========================================
REFERRAL CODE
=========================================*/

if(!profile.referral_code){

const code =
"MDH" +
Math.random()
.toString(36)
.substring(2,8)
.toUpperCase();

await db

.from("profiles")

.update({

referral_code:code

})

.eq("id",currentUser.id);

profile.referral_code=code;

}

document.getElementById("referralCode").value =
profile.referral_code;

document.getElementById("referralLink").value =
window.location.origin +
"/register.html?ref=" +
profile.referral_code;

/*=========================================
UNLOCK REFERRAL
=========================================*/

const { data:machines } = await db

.from("user_machines")

.select("id")

.eq("user_id",currentUser.id)

.eq("status","active");

if(machines.length>0){

document.getElementById("referralLocked").style.display="none";

document.getElementById("referralContent").style.display="block";

}else{

document.getElementById("referralLocked").style.display="block";

document.getElementById("referralContent").style.display="none";

}

    }

/*=========================================
PROFILE.JS
PART 3
=========================================*/

/*=========================================
LOAD USER NOTIFICATIONS
=========================================*/

async function loadNotifications(){

const { data,error } = await db

.from("user_notifications")

.select("*")

.eq("user_id",currentUser.id)

.order("created_at",{ascending:false})

.limit(5);

if(error){

console.log(error);
return;

}

const container =
document.getElementById("notificationContainer");

if(!container) return;

container.innerHTML="";

if(data.length===0){

container.innerHTML=`

<div class="empty-box">

<i class="fas fa-bell-slash"></i>

<p>No notifications available.</p>

</div>

`;

return;

}

data.forEach(item=>{

container.innerHTML+=`

<div class="notification-item">

<h4>${item.title}</h4>

<p>${item.message}</p>

<small>${new Date(item.created_at).toLocaleString()}</small>

</div>

`;

});

}

/*=========================================
COPY BUTTONS
=========================================*/

document.getElementById("copyCodeBtn")
?.addEventListener("click",()=>{

navigator.clipboard.writeText(profile.referral_code);

alert("Referral code copied.");

});

document.getElementById("copyLinkBtn")
?.addEventListener("click",()=>{

navigator.clipboard.writeText(

window.location.origin+
"/register.html?ref="+
profile.referral_code

);

alert("Referral link copied.");

});

/*=========================================
SHARE REFERRAL
=========================================*/

document.getElementById("shareReferralBtn")
?.addEventListener("click",async()=>{

const link=

window.location.origin+
"/register.html?ref="+
profile.referral_code;

if(navigator.share){

await navigator.share({

title:"Marathon Digital Hub",

text:"Join Marathon Digital Hub using my referral link.",

url:link

});

}else{

navigator.clipboard.writeText(link);

alert("Referral link copied.");

}

});

/*=========================================
NAVIGATION BUTTONS
=========================================*/

document.getElementById("depositBtn")
?.addEventListener("click",()=>{

location.href="deposit.html";

});

document.getElementById("withdrawBtn")
?.addEventListener("click",()=>{

location.href="withdraw.html";

});

document.getElementById("machineBtn")
?.addEventListener("click",()=>{

location.href="machines.html";

});

document.getElementById("buyFirstMachineBtn")
?.addEventListener("click",()=>{

location.href="machines.html";

});

document.getElementById("backBtn")
?.addEventListener("click",()=>{

history.back();

});

/*=========================================
SETTINGS POPUP
=========================================*/

const popup =
document.getElementById("settingsPopup");

const overlay =
document.getElementById("popupOverlay");

document.getElementById("settingsBtn")
?.addEventListener("click",()=>{

popup.classList.add("active");

overlay.classList.add("active");

});

document.getElementById("closePopup")
?.addEventListener("click",()=>{

popup.classList.remove("active");

overlay.classList.remove("active");

});

overlay?.addEventListener("click",()=>{

popup.classList.remove("active");

overlay.classList.remove("active");

});

/*=========================================
AVATAR CHANGE
=========================================*/

document.getElementById("changeAvatar")
?.addEventListener("click",()=>{

document.getElementById("avatarInput").click();

});

document.getElementById("avatarInput")
?.addEventListener("change",()=>{

alert("Avatar upload will be connected after the Storage bucket is ready.");

});

/*=========================================
LOGOUT
=========================================*/

document.getElementById("logoutBtn")
?.addEventListener("click",async()=>{

if(!confirm("Logout from Marathon Digital Hub?")) return;

await db.auth.signOut();

location.href="login.html";

});

/*=========================================
AUTO REFRESH
=========================================*/

setInterval(async()=>{

if(currentUser){

await loadWallet();

await loadStats();

await loadNotifications();

}

},30000);

/*=========================================
HIDE LOADER
=========================================*/

function hideLoader(){

const loader =
document.getElementById("loadingScreen");

if(loader){

setTimeout(()=>{

loader.style.display="none";

},500);

}

}

/*=========================================
INITIAL NOTIFICATIONS
=========================================*/

loadNotifications();
