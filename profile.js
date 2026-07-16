//======================================
// PROFILE.JS PART 1
// Marathon Digital Hub
//======================================

//---------- SUPABASE ----------//

const client = window.supabaseClient;

//---------- ELEMENTS ----------//

const profilePhoto = document.getElementById("profilePhoto");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");

const walletBalance = document.getElementById("walletBalance");

const memberType = document.getElementById("memberType");
const verifyBadge = document.getElementById("verifyBadge");
const accountStatus = document.getElementById("accountStatus");

let currentUser = null;
let profile = null;

//======================================
// CHECK LOGIN
//======================================

async function checkLogin(){

const { data, error } =
await client.auth.getUser();

if(error || !data.user){

window.location.href="login.html";

return;

}

currentUser = data.user;

loadProfile();

}

//======================================
// LOAD PROFILE
//======================================

async function loadProfile(){

const { data, error } =
await client

.from("profiles")

.select("*")

.eq("id",currentUser.id)

.single();

if(error){

console.error(error);

return;

}

profile=data;

// Profile Photo

if(profile.avatar_url){

profilePhoto.src=
profile.avatar_url;

}

// Name

userName.textContent=
profile.fullname;

// Email

userEmail.textContent=
profile.email;

// Wallet

walletBalance.textContent=

"UGX "+

Number(

profile.wallet_balance || 0

).toLocaleString();

// Membership

memberType.textContent=
profile.membership;

// KYC

verifyBadge.textContent=
profile.kyc_status;

// Account Status

accountStatus.textContent=
profile.account_status;

// Suspended Account

if(

profile.account_status==="suspended" ||

profile.is_frozen===true

){

accountStatus.style.background="#7A1F1F";

accountStatus.style.color="#FFB3B3";

}

}

//======================================
// START
//======================================

checkLogin();

//======================================
// PROFILE.JS PART 2
// Statistics & Referral
//======================================

//---------- ELEMENTS ----------//

const machineCount =
document.getElementById("machineCount");

const teamCount =
document.getElementById("teamCount");

const bonusBalance =
document.getElementById("bonusBalance");

const todayIncome =
document.getElementById("todayIncome");

const completionPercent =
document.getElementById("completionPercent");

const progressBar =
document.getElementById("progressBar");

const referralCode =
document.getElementById("referralCode");

const referralLink =
document.getElementById("referralLink");

const notificationCount =
document.getElementById("notificationCount");

//======================================
// LOAD DASHBOARD DATA
//======================================

async function loadDashboardData(){

//------------------------------
// Active Machines
//------------------------------

const {

count:machines

}=await client

.from("user_machines")

.select("*",{count:"exact",head:true})

.eq("user_id",currentUser.id)

.eq("status","active");

machineCount.textContent=
machines || 0;


//------------------------------
// Team Members
//------------------------------

const {

count:team

}=await client

.from("referrals")

.select("*",{count:"exact",head:true})

.eq("referrer_id",currentUser.id);

teamCount.textContent=
team || 0;


//------------------------------
// Referral Bonus
//------------------------------

bonusBalance.textContent=

"UGX "+

Number(

profile.total_referral_bonus || 0

).toLocaleString();


//------------------------------
// Today's Income
//------------------------------

const {

data:todayMachines

}=await client

.from("user_machines")

.select("earned_amount")

.eq("user_id",currentUser.id)

.eq("status","active");

let totalToday=0;

if(todayMachines){

todayMachines.forEach(item=>{

totalToday+=Number(

item.earned_amount || 0

);

});

}

todayIncome.textContent=

"UGX "+

totalToday.toLocaleString();


//------------------------------
// Referral
//------------------------------

referralCode.value=

profile.referral_code || "";

referralLink.value=

window.location.origin+

"/register.html?ref="+

(profile.referral_code || "");


//------------------------------
// Notifications
//------------------------------

const {

count:notices

}=await client

.from("user_notifications")

.select("*",{count:"exact",head:true})

.eq("user_id",currentUser.id)

.eq("is_read",false);

notificationCount.textContent=

notices || 0;


//------------------------------
// Profile Completion
//------------------------------

let completed=0;

const totalFields=8;

if(profile.fullname) completed++;

if(profile.email) completed++;

if(profile.phone) completed++;

if(profile.avatar_url) completed++;

if(profile.country) completed++;

if(profile.gender) completed++;

if(profile.date_of_birth) completed++;

if(profile.profile_completed) completed++;

const percent=

Math.round(

(completed/totalFields)*100

);

completionPercent.textContent=

percent+"%";

progressBar.style.width=

percent+"%";

}

//======================================
// LOAD AFTER PROFILE
//======================================

loadDashboardData();

//======================================
// PROFILE.JS PART 3
// Buttons, Popups & Settings
//======================================

//---------- ELEMENTS ----------//

const overlay=document.getElementById("overlay");
const popup=document.getElementById("popup");
const popupTitle=document.getElementById("popupTitle");
const popupContent=document.getElementById("popupContent");
const closePopup=document.getElementById("closePopup");

//======================================
// POPUP
//======================================

function openPopup(title,content){

popupTitle.textContent=title;

popupContent.innerHTML=content;

overlay.classList.add("active");
popup.classList.add("active");

}

function hidePopup(){

overlay.classList.remove("active");
popup.classList.remove("active");

}

closePopup.onclick=hidePopup;
overlay.onclick=hidePopup;

//======================================
// ABOUT
//======================================

document.getElementById("openAbout").onclick=()=>{

openPopup("About Marathon Digital Hub",`

<p>Marathon Digital Hub is a secure digital mining platform designed to provide transparent mining services, investment opportunities, referral rewards, and professional account management.</p>

<p>Our mission is to provide a reliable, secure and user-friendly digital mining experience while maintaining transparency and long-term growth.</p>

`);

};

//======================================
// FAQ
//======================================

document.getElementById("openFaq").onclick=()=>{

openPopup("Frequently Asked Questions",`

<h3>How do I buy a machine?</h3>

<p>Open the Machines page and purchase an available machine.</p>

<h3>When do I receive earnings?</h3>

<p>Earnings are credited according to your active machine schedule.</p>

<h3>How do referrals work?</h3>

<p>Invite friends using your referral link to earn referral bonuses.</p>

`);

};

//======================================
// TERMS
//======================================

document.getElementById("openTerms").onclick=()=>{

openPopup("Terms & Conditions",`

<p>All members must follow Marathon Digital Hub rules.</p>

<p>Fraudulent activities, fake payment proofs, abuse of referrals or attempts to compromise platform security may result in account suspension.</p>

`);

};

//======================================
// PRIVACY
//======================================

document.getElementById("openPrivacy").onclick=()=>{

openPopup("Privacy Policy",`

<p>Your personal information is protected and only used to provide Marathon Digital Hub services.</p>

<p>We never intentionally expose your private information without legal requirements.</p>

`);

};

//======================================
// COPY REFERRAL
//======================================

document.getElementById("copyReferralBtn").onclick=()=>{

navigator.clipboard.writeText(referralCode.value);

alert("Referral code copied.");

};

document.getElementById("copyLinkBtn").onclick=()=>{

navigator.clipboard.writeText(referralLink.value);

alert("Referral link copied.");

};

//======================================
// SHARE REFERRAL
//======================================

document.getElementById("shareReferralBtn").onclick=()=>{

if(navigator.share){

navigator.share({

title:"Marathon Digital Hub",

text:"Join my team.",

url:referralLink.value

});

}else{

navigator.clipboard.writeText(referralLink.value);

alert("Referral link copied.");

}

};

//======================================
// CHANGE PHOTO
//======================================

document.getElementById("changePhoto").onclick=()=>{

photoInput.click();

};

photoInput.onchange=()=>{

alert("Profile photo upload will be connected to Supabase Storage.");

};

//======================================
// OPEN PAGES
//======================================

document.getElementById("openMachines").onclick=()=>{

location.href="machines.html";

};

document.getElementById("openKyc").onclick=()=>{

location.href="kyc.html";

};

document.getElementById("editProfile").onclick=()=>{

location.href="edit-profile.html";

};

//======================================
// CHANGE PASSWORD
//======================================

document.getElementById("changePassword").onclick=async()=>{

const password=prompt("Enter new password");

if(!password) return;

const {error}=await client.auth.updateUser({

password:password

});

if(error){

alert(error.message);

}else{

alert("Password updated successfully.");

}

};

//======================================
// LOGOUT
//======================================

document.getElementById("logoutBtn").onclick=async()=>{

const ok=confirm("Logout?");

if(!ok) return;

await client.auth.signOut();

location.href="login.html";

};

console.log("Profile page loaded successfully.");
