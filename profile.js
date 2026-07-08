/*=========================================
MARATHON DIGITAL HUB
PROFILE.JS
PART 1
=========================================*/

document.addEventListener("DOMContentLoaded", async () => {

const supabase = window.supabaseClient;

const loadingScreen = document.getElementById("loadingScreen");

try{

/*==========================
CHECK LOGIN
==========================*/

const {
data:{session},
error
}=await supabase.auth.getSession();

if(error) throw error;

if(!session){

window.location.href="login.html";
return;

}

const user=session.user;
const userId=user.id;

/*==========================
GET HTML ELEMENTS
==========================*/

const fullName=document.getElementById("fullName");
const email=document.getElementById("email");
const emailAddress=document.getElementById("emailAddress");

const phoneNumber=document.getElementById("phoneNumber");
const country=document.getElementById("country");
const gender=document.getElementById("gender");
const dob=document.getElementById("dob");
const memberSince=document.getElementById("memberSince");

const walletBalance=document.getElementById("walletBalance");

const membershipBadge=document.getElementById("membershipBadge");
const statusBadge=document.getElementById("statusBadge");
const kycBadge=document.getElementById("kycBadge");

const totalProfit=document.getElementById("totalProfit");
const totalInvested=document.getElementById("totalInvested");

/*==========================
LOAD PROFILE
==========================*/

const {
data:profile,
error:profileError
}=await supabase

.from("profiles")

.select("*")

.eq("id",userId)

.maybeSingle();

if(profileError) throw profileError;

if(!profile){

alert("Profile not found.");

window.location.href="login.html";

return;

}

/*==========================
SHOW PROFILE
==========================*/

fullName.textContent=profile.fullname||"User";

email.textContent=profile.email||"";

emailAddress.textContent=profile.email||"";

phoneNumber.textContent=profile.phone||"Not Added";

country.textContent=profile.country||"Not Set";

gender.textContent=profile.gender||"Not Set";

dob.textContent=profile.date_of_birth||"Not Set";

membershipBadge.textContent=profile.membership||"STANDARD";

statusBadge.textContent=profile.account_status||"ACTIVE";

kycBadge.textContent=profile.kyc_status||"NOT VERIFIED";

walletBalance.textContent=
"UGX "+
Number(profile.wallet_balance||0).toLocaleString();

totalProfit.textContent=
"UGX "+
Number(profile.total_profit||0).toLocaleString();

totalInvested.textContent=
"UGX "+
Number(profile.total_invested||0).toLocaleString();

if(profile.created_at){

memberSince.textContent=
new Date(profile.created_at)
.toLocaleDateString();

}

    /*=========================================
PROFILE.JS
PART 2
=========================================*/

/*==========================
AUTO CREATE REFERRAL CODE
==========================*/

if(!profile.referral_code){

const referralCodeValue=
"MDH"+
Math.random().toString(36)
.substring(2,8)
.toUpperCase();

const {error:updateError}=await supabase

.from("profiles")

.update({

referral_code:referralCodeValue

})

.eq("id",userId);

if(!updateError){

profile.referral_code=referralCodeValue;

}

}

/*==========================
REFERRAL DETAILS
==========================*/

const referralCodeInput=
document.getElementById("referralCode");

const referralLinkInput=
document.getElementById("referralLink");

const referralLocked=
document.getElementById("referralLocked");

const referralContent=
document.getElementById("referralContent");

const referralLink=

window.location.origin+
"/register.html?ref="+
profile.referral_code;

if(referralCodeInput){

referralCodeInput.value=
profile.referral_code||"";

}

if(referralLinkInput){

referralLinkInput.value=
referralLink;

}

/*==========================
CHECK MACHINE PURCHASE
==========================*/

const {

data:userMachines

}=await supabase

.from("user_machines")

.select("id,status")

.eq("user_id",userId);

const hasMachine=
userMachines &&
userMachines.length>0;

if(hasMachine){

referralLocked.style.display="none";

referralContent.style.display="block";

}else{

referralLocked.style.display="block";

referralContent.style.display="none";

}

/*==========================
LOAD REFERRALS
==========================*/

const {

data:referrals

}=await supabase

.from("referrals")

.select("*")

.eq("referrer_id",userId);

const totalTeam=
document.getElementById("totalTeam");

const activeTeam=
document.getElementById("activeTeam");

const referralBonus=
document.getElementById("referralBonus");

const teamMembers=
document.getElementById("teamMembers");

const totalReferralCount=
referrals?referrals.length:0;

if(totalTeam)
totalTeam.textContent=
totalReferralCount;

if(teamMembers)
teamMembers.textContent=
totalReferralCount;

const activeReferralCount=
(referrals||[])
.filter(r=>r.first_machine_purchased)
.length;

if(activeTeam)
activeTeam.textContent=
activeReferralCount;

if(referralBonus){

referralBonus.textContent=

"UGX "+Number(

profile.total_referral_bonus||0

).toLocaleString();

}

/*==========================
COPY BUTTONS
==========================*/

document
.getElementById("copyCodeBtn")
?.addEventListener("click",()=>{

navigator.clipboard.writeText(
profile.referral_code
);

alert("Referral code copied.");

});

document
.getElementById("copyLinkBtn")
?.addEventListener("click",()=>{

navigator.clipboard.writeText(
referralLink
);

alert("Referral link copied.");

});

/*==========================
SHARE BUTTON
==========================*/

document
.getElementById("shareReferralBtn")
?.addEventListener("click",async()=>{

if(navigator.share){

await navigator.share({

title:"Marathon Digital Hub",

text:"Join Marathon Digital Hub using my referral link.",

url:referralLink

});

}else{

navigator.clipboard.writeText(
referralLink
);

alert("Referral link copied.");

}

});

    /*=========================================
PROFILE.JS
PART 3
=========================================*/

/*==========================
ACTIVE MACHINES
==========================*/

const activeMachines =
document.getElementById("activeMachines");

const runningMachines =
document.getElementById("runningMachines");

const completedMachines =
document.getElementById("completedMachines");

const dailyIncome =
document.getElementById("dailyIncome");

let activeCount = 0;
let completedCount = 0;
let income = 0;

(userMachines || []).forEach(machine=>{

if(machine.status==="active"){

activeCount++;

}

if(machine.completed){

completedCount++;

}

income += Number(machine.earned_amount || 0);

});

if(activeMachines)
activeMachines.textContent = activeCount;

if(runningMachines)
runningMachines.textContent = activeCount;

if(completedMachines)
completedMachines.textContent = completedCount;

if(dailyIncome){

dailyIncome.textContent =
"UGX " + income.toLocaleString();

}

/*==========================
NOTIFICATIONS
==========================*/

const notificationContainer =
document.getElementById("notificationContainer");

const { data: notifications } =
await supabase

.from("user_notifications")

.select("*")

.eq("user_id",userId)

.order("created_at",{ascending:false})

.limit(5);

if(notificationContainer){

if(notifications && notifications.length){

notificationContainer.innerHTML="";

notifications.forEach(item=>{

notificationContainer.innerHTML += `

<div class="info-row">

<div>

<strong>${item.title}</strong>

<p>${item.message}</p>

<small>${new Date(item.created_at).toLocaleDateString()}</small>

</div>

</div>

`;

});

}

}

/*==========================
SETTINGS POPUP
==========================*/

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

/*==========================
NAVIGATION
==========================*/

document.getElementById("depositBtn")
?.onclick=()=>location.href="deposit.html";

document.getElementById("withdrawBtn")
?.onclick=()=>location.href="withdraw.html";

document.getElementById("machineBtn")
?.onclick=()=>location.href="machines.html";

document.getElementById("buyFirstMachineBtn")
?.onclick=()=>location.href="machines.html";

document.getElementById("backBtn")
?.onclick=()=>location.href="dashboard.html";

/*==========================
LOGOUT
==========================*/

document.getElementById("logoutBtn")
?.addEventListener("click",async()=>{

const confirmLogout =
confirm("Logout from your account?");

if(!confirmLogout) return;

await supabase.auth.signOut();

location.href="login.html";

});

}catch(err){

console.error(err);

alert(
err.message ||
"Failed to load profile."
);

}finally{

if(loadingScreen){

loadingScreen.style.display="none";

}

}

});
