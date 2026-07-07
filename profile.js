/*=========================================
MARATHON DIGITAL HUB
PROFILE.JS
PART 1
=========================================*/

document.addEventListener("DOMContentLoaded", async () => {

const {
data: { session },
error
} = await supabase.auth.getSession();

if (!session) {

window.location.href = "login.html";
return;

}

const user = session.user;
const userId = user.id;

/*=============================
ELEMENTS
=============================*/

const fullName = document.getElementById("fullName");
const email = document.getElementById("email");

const walletBalance = document.getElementById("walletBalance");

const membershipBadge = document.getElementById("membershipBadge");
const statusBadge = document.getElementById("statusBadge");
const kycBadge = document.getElementById("kycBadge");

const phoneNumber = document.getElementById("phoneNumber");
const emailAddress = document.getElementById("emailAddress");

const country = document.getElementById("country");
const gender = document.getElementById("gender");
const dob = document.getElementById("dob");

const memberSince = document.getElementById("memberSince");

const totalProfit = document.getElementById("totalProfit");
const totalInvested = document.getElementById("totalInvested");

/*=============================
LOAD PROFILE
=============================*/

const { data: profile, error: profileError } = await supabase

.from("profiles")

.select("*")

.eq("id", userId)

.single();

if (profileError) {

console.error(profileError);

return;

}

/*=============================
SHOW PROFILE
=============================*/

fullName.textContent = profile.fullname || "User";

email.textContent = profile.email || "";

emailAddress.textContent = profile.email || "";

phoneNumber.textContent = profile.phone || "Not Added";

country.textContent = profile.country || "Not Set";

gender.textContent = profile.gender || "Not Set";

dob.textContent = profile.date_of_birth || "Not Set";

membershipBadge.textContent = profile.membership || "STANDARD";

statusBadge.textContent = profile.account_status || "ACTIVE";

kycBadge.textContent = profile.kyc_status || "NOT VERIFIED";

walletBalance.textContent =
"UGX " +
Number(profile.wallet_balance || 0).toLocaleString();

totalProfit.textContent =
"UGX " +
Number(profile.total_profit || 0).toLocaleString();

totalInvested.textContent =
"UGX " +
Number(profile.total_invested || 0).toLocaleString();

/*=============================
MEMBER DATE
=============================*/

if(profile.created_at){

memberSince.textContent =
new Date(profile.created_at)
.toLocaleDateString();

    }

                          /*=========================================
PROFILE.JS
PART 2
=========================================*/

/*=============================
AUTO GENERATE REFERRAL CODE
=============================*/

if (!profile.referral_code) {

const newReferralCode =
"MDH" +
Math.random().toString(36).substring(2,8).toUpperCase();

const { error } = await supabase
.from("profiles")
.update({
referral_code: newReferralCode
})
.eq("id", userId);

if (!error) {

profile.referral_code = newReferralCode;

}

}

/*=============================
REFERRAL LINK
=============================*/

const referralCode =
document.getElementById("referralCode");

const referralLink =
document.getElementById("referralLink");

if(referralCode){

referralCode.value =
profile.referral_code || "";

}

if(referralLink){

referralLink.value =
"https://marathon-digital-hub-lwb4.vercel.app/register.html?ref=" +
(profile.referral_code || "");

}

/*=============================
CHECK MACHINE PURCHASE
=============================*/

const { data: machines } = await supabase

.from("user_machines")

.select("id")

.eq("user_id",userId)

.eq("status","active");

const referralLocked =
document.getElementById("referralLocked");

const referralContent =
document.getElementById("referralContent");

if(machines && machines.length>0){

if(referralLocked)
referralLocked.style.display="none";

if(referralContent)
referralContent.style.display="block";

}else{

if(referralLocked)
referralLocked.style.display="block";

if(referralContent)
referralContent.style.display="none";

}

/*=============================
TEAM MEMBERS
=============================*/

const { data: referrals } = await supabase

.from("referrals")

.select("*")

.eq("referrer_id",userId);

const totalTeam =
document.getElementById("totalTeam");

const activeTeam =
document.getElementById("activeTeam");

const referralBonus =
document.getElementById("referralBonus");

if(totalTeam){

totalTeam.textContent =
referrals ? referrals.length : 0;

}

if(activeTeam){

const active =
(referrals || []).filter(r =>
r.first_machine_purchased===true
);

activeTeam.textContent =
active.length;

}

if(referralBonus){

referralBonus.textContent =
"UGX " +
Number(profile.total_referral_bonus || 0)
.toLocaleString();

}

/*=============================
COPY BUTTONS
=============================*/

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

"https://marathon-digital-hub-lwb4.vercel.app/register.html?ref=" +
profile.referral_code

);

alert("Referral link copied.");

});

                          /*=========================================
PROFILE.JS
PART 3
=========================================*/

/*=============================
ACTIVE MACHINES
=============================*/

const activeMachines =
document.getElementById("activeMachines");

const runningMachines =
document.getElementById("runningMachines");

const completedMachines =
document.getElementById("completedMachines");

const dailyIncome =
document.getElementById("dailyIncome");

const { data: userMachines } = await supabase
.from("user_machines")
.select("*")
.eq("user_id", userId);

if(userMachines){

const active = userMachines.filter(m => m.status === "active");
const completed = userMachines.filter(m => m.completed === true);

let income = 0;

active.forEach(machine=>{
income += Number(machine.earned_amount || 0);
});

if(activeMachines)
activeMachines.textContent = active.length;

if(runningMachines)
runningMachines.textContent = active.length;

if(completedMachines)
completedMachines.textContent = completed.length;

if(dailyIncome)
dailyIncome.textContent =
"UGX " + income.toLocaleString();

}

/*=============================
LOAD NOTIFICATIONS
=============================*/

const notificationContainer =
document.getElementById("notificationContainer");

const { data: notifications } = await supabase
.from("user_notifications")
.select("*")
.eq("user_id", userId)
.order("created_at",{ascending:false})
.limit(5);

if(notificationContainer && notifications && notifications.length){

notificationContainer.innerHTML="";

notifications.forEach(item=>{

notificationContainer.innerHTML += `

<div class="notification-item">

<h4>${item.title}</h4>

<p>${item.message}</p>

<small>${new Date(item.created_at).toLocaleDateString()}</small>

</div>

`;

});

}

/*=============================
SHARE REFERRAL
=============================*/

document.getElementById("shareReferralBtn")
?.addEventListener("click",async()=>{

const link =
`https://marathon-digital-hub-lwb4.vercel.app/register.html?ref=${profile.referral_code}`;

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

/*=============================
SETTINGS POPUP
=============================*/

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

/*=============================
BUTTON NAVIGATION
=============================*/

document.getElementById("depositBtn")
?.addEventListener("click",()=>{

window.location.href="deposit.html";

});

document.getElementById("withdrawBtn")
?.addEventListener("click",()=>{

window.location.href="withdraw.html";

});

document.getElementById("machineBtn")
?.addEventListener("click",()=>{

window.location.href="machines.html";

});

document.getElementById("buyFirstMachineBtn")
?.addEventListener("click",()=>{

window.location.href="machines.html";

});

document.getElementById("backBtn")
?.addEventListener("click",()=>{

window.location.href="dashboard.html";

});

/*=============================
LOGOUT
=============================*/

document.getElementById("logoutBtn")
?.addEventListener("click",async()=>{

const ok = confirm("Do you want to logout?");

if(!ok) return;

await supabase.auth.signOut();

window.location.href="login.html";

});

/*=============================
HIDE LOADER
=============================*/

const loading =
document.getElementById("loadingScreen");

if(loading){

loading.style.display="none";

}

});

/*=========================================
PROFILE.JS
PART 3
=========================================*/

/*=============================
ACTIVE MACHINES
=============================*/

const activeMachines =
document.getElementById("activeMachines");

const runningMachines =
document.getElementById("runningMachines");

const completedMachines =
document.getElementById("completedMachines");

const dailyIncome =
document.getElementById("dailyIncome");

const { data: userMachines } = await supabase
.from("user_machines")
.select("*")
.eq("user_id", userId);

if(userMachines){

const active = userMachines.filter(m => m.status === "active");
const completed = userMachines.filter(m => m.completed === true);

let income = 0;

active.forEach(machine=>{
income += Number(machine.earned_amount || 0);
});

if(activeMachines)
activeMachines.textContent = active.length;

if(runningMachines)
runningMachines.textContent = active.length;

if(completedMachines)
completedMachines.textContent = completed.length;

if(dailyIncome)
dailyIncome.textContent =
"UGX " + income.toLocaleString();

}

/*=============================
LOAD NOTIFICATIONS
=============================*/

const notificationContainer =
document.getElementById("notificationContainer");

const { data: notifications } = await supabase
.from("user_notifications")
.select("*")
.eq("user_id", userId)
.order("created_at",{ascending:false})
.limit(5);

if(notificationContainer && notifications && notifications.length){

notificationContainer.innerHTML="";

notifications.forEach(item=>{

notificationContainer.innerHTML += `

<div class="notification-item">

<h4>${item.title}</h4>

<p>${item.message}</p>

<small>${new Date(item.created_at).toLocaleDateString()}</small>

</div>

`;

});

}

/*=============================
SHARE REFERRAL
=============================*/

document.getElementById("shareReferralBtn")
?.addEventListener("click",async()=>{

const link =
`https://marathon-digital-hub-lwb4.vercel.app/register.html?ref=${profile.referral_code}`;

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

/*=============================
SETTINGS POPUP
=============================*/

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

/*=============================
BUTTON NAVIGATION
=============================*/

document.getElementById("depositBtn")
?.addEventListener("click",()=>{

window.location.href="deposit.html";

});

document.getElementById("withdrawBtn")
?.addEventListener("click",()=>{

window.location.href="withdraw.html";

});

document.getElementById("machineBtn")
?.addEventListener("click",()=>{

window.location.href="machines.html";

});

document.getElementById("buyFirstMachineBtn")
?.addEventListener("click",()=>{

window.location.href="machines.html";

});

document.getElementById("backBtn")
?.addEventListener("click",()=>{

window.location.href="dashboard.html";

});

/*=============================
LOGOUT
=============================*/

document.getElementById("logoutBtn")
?.addEventListener("click",async()=>{

const ok = confirm("Do you want to logout?");

if(!ok) return;

await supabase.auth.signOut();

window.location.href="login.html";

});

/*=============================
HIDE LOADER
=============================*/

const loading =
document.getElementById("loadingScreen");

if(loading){

loading.style.display="none";

}

});
