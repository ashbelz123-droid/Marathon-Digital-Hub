// ======================================
// PROFILE PAGE
// Marathon Digital Hub
// Part 1
// ======================================

const client = window.supabaseClient;

// ---------- DOM ----------

const userName =
document.getElementById("userName");

const userEmail =
document.getElementById("userEmail");

const walletBalance =
document.getElementById("walletBalance");

const profilePhoto =
document.getElementById("profilePhoto");

const memberType =
document.getElementById("memberType");

const verifyBadge =
document.getElementById("verifyBadge");

const accountStatus =
document.getElementById("accountStatus");

const machineCount =
document.getElementById("machineCount");

const teamCount =
document.getElementById("teamCount");

const bonusBalance =
document.getElementById("bonusBalance");

const todayIncome =
document.getElementById("todayIncome");

const notificationCount =
document.getElementById("notificationCount");

// ---------- CURRENT USER ----------

let currentUser = null;

async function loadProfile(){

const {

data:{user},

error

} = await client.auth.getUser();

if(error || !user){

window.location.href="login.html";

return;

}

currentUser=user;

userEmail.textContent=user.email;

// Load profile data
await loadUserData();

}

// ---------- LOAD USER DATA ----------

async function loadUserData(){

const {

data,

error

}=await client

.from("users")

.select("*")

.eq("id",currentUser.id)

.single();

if(error){

console.log(error);

return;

}

userName.textContent=
data.full_name || "Member";

walletBalance.textContent=
"UGX " + Number(
data.wallet || 0
).toLocaleString();

memberType.textContent=
data.membership || "Standard";

verifyBadge.textContent=
data.kyc
? "Verified"
: "Not Verified";

accountStatus.textContent=
data.status || "Active";

if(data.photo){

profilePhoto.src=data.photo;

}

}

// ---------- START ----------

loadProfile();

// ======================================
// PROFILE PAGE
// Part 2
// ======================================

// ---------- PROFILE COMPLETION ----------

const completionPercent =
document.getElementById("completionPercent");

const progressBar =
document.getElementById("progressBar");

function updateProfileCompletion(user){

let total = 6;

let completed = 0;

if(user.full_name) completed++;

if(user.email) completed++;

if(user.phone) completed++;

if(user.photo) completed++;

if(user.country) completed++;

if(user.kyc) completed++;

const percent =
Math.round((completed / total) * 100);

completionPercent.textContent =
percent + "%";

progressBar.style.width =
percent + "%";

}

// ---------- LOAD STATISTICS ----------

async function loadStatistics(){

// Active Machines

const {

count:machines

}=await client

.from("machines")

.select("*",{count:"exact",head:true})

.eq("user_id",currentUser.id);

machineCount.textContent =
machines || 0;

// Team Members

const {

count:team

}=await client

.from("users")

.select("*",{count:"exact",head:true})

.eq("referred_by",currentUser.id);

teamCount.textContent =
team || 0;

// Referral Bonus

const {

data:bonus

}=await client

.from("users")

.select("referral_bonus")

.eq("id",currentUser.id)

.single();

bonusBalance.textContent =
"UGX " +
Number(
bonus?.referral_bonus || 0
).toLocaleString();

// Today's Income

const {

data:income

}=await client

.from("users")

.select("today_income")

.eq("id",currentUser.id)

.single();

todayIncome.textContent =
"UGX " +
Number(
income?.today_income || 0
).toLocaleString();

}

// ---------- REFERRAL ----------

const referralCode =
document.getElementById("referralCode");

const referralLink =
document.getElementById("referralLink");

const copyReferralBtn =
document.getElementById("copyReferralBtn");

const copyLinkBtn =
document.getElementById("copyLinkBtn");

async function loadReferral(){

const {

data

}=await client

.from("users")

.select("referral_code")

.eq("id",currentUser.id)

.single();

referralCode.value =
data?.referral_code || "";

referralLink.value =
location.origin +
"/register.html?ref=" +
(data?.referral_code || "");

}

copyReferralBtn.onclick = ()=>{

navigator.clipboard.writeText(
referralCode.value
);

alert("Referral code copied.");

};

copyLinkBtn.onclick = ()=>{

navigator.clipboard.writeText(
referralLink.value
);

alert("Referral link copied.");

};

// ---------- UPDATE PAGE ----------

async function updatePage(){

await loadStatistics();

await loadReferral();

const {

data

}=await client

.from("users")

.select("*")

.eq("id",currentUser.id)

.single();

if(data){

updateProfileCompletion(data);

}

}

updatePage();

// ======================================
// PROFILE PAGE
// Part 3
// ======================================

// ---------- ELEMENTS ----------

const overlay =
document.getElementById("overlay");

const aboutPopup =
document.getElementById("aboutPopup");

const settingsPopup =
document.getElementById("settingsPopup");

const openAbout =
document.getElementById("openAbout");

const closeAbout =
document.getElementById("closeAbout");

const openSettings =
document.getElementById("openSettings");

const closeSettings =
document.getElementById("closeSettings");

// ---------- POPUPS ----------

function openPopup(popup){

overlay.classList.add("active");

popup.classList.add("active");

}

function closePopup(popup){

overlay.classList.remove("active");

popup.classList.remove("active");

}

if(openAbout){

openAbout.onclick=()=>{

openPopup(aboutPopup);

};

}

if(closeAbout){

closeAbout.onclick=()=>{

closePopup(aboutPopup);

};

}

if(openSettings){

openSettings.onclick=()=>{

openPopup(settingsPopup);

};

}

if(closeSettings){

closeSettings.onclick=()=>{

closePopup(settingsPopup);

};

}

overlay.onclick=()=>{

overlay.classList.remove("active");

aboutPopup.classList.remove("active");

settingsPopup.classList.remove("active");

};

// ---------- PROFILE PHOTO ----------

const photoInput =
document.getElementById("photoInput");

const changePhoto =
document.getElementById("changePhoto");

if(changePhoto){

changePhoto.onclick=()=>{

photoInput.click();

};

}

photoInput?.addEventListener("change",()=>{

const file=photoInput.files[0];

if(!file) return;

const reader=new FileReader();

reader.onload=function(e){

profilePhoto.src=e.target.result;

};

reader.readAsDataURL(file);

});

// ---------- CHANGE PASSWORD ----------

const changePasswordBtn =
document.getElementById("changePasswordBtn");

if(changePasswordBtn){

changePasswordBtn.onclick=async()=>{

const password=prompt("Enter new password");

if(!password) return;

const {error}=await client.auth.updateUser({

password:password

});

if(error){

alert(error.message);

}else{

alert("Password changed successfully.");

}

};

}

// ---------- LOGOUT ----------

const logoutBtn =
document.getElementById("logoutBtn");

if(logoutBtn){

logoutBtn.onclick=async()=>{

await client.auth.signOut();

window.location.href="login.html";

};

}

// ---------- ABOUT TEXT ----------

const aboutContent =
document.getElementById("aboutContent");

if(aboutContent){

aboutContent.textContent=

"Marathon Digital Hub is a digital mining platform designed to provide secure mining plans, referral rewards, daily earnings, team growth, and transparent account management for every member.";

}

// ---------- PAGE READY ----------

console.log("Profile page loaded successfully.");
