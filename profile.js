// =====================================
// Marathon Digital Hub
// profile.js - Part 1
// =====================================

const supabase = window.supabaseClient;

// ---------- DOM ----------

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const profilePhoto = document.getElementById("profilePhoto");

const walletBalance = document.getElementById("walletBalance");

const memberType = document.getElementById("memberType");
const verifyBadge = document.getElementById("verifyBadge");
const accountStatus = document.getElementById("accountStatus");

let currentUser = null;

// ---------- CHECK LOGIN ----------

async function checkUser(){

const { data, error } =
await supabase.auth.getUser();

if(error || !data.user){

window.location.href="login.html";

return;

}

currentUser = data.user;

loadProfile();

}

// ---------- LOAD PROFILE ----------

async function loadProfile(){

const { data, error } = await supabase

.from("profiles")

.select("*")

.eq("id", currentUser.id)

.single();

if(error){

console.error(error);

return;

}

// Name
userName.textContent =
data.fullname || "Member";

// Email
userEmail.textContent =
data.email || currentUser.email;

// Wallet
walletBalance.textContent =
"UGX " +
Number(
data.wallet_balance || 0
).toLocaleString();

// Membership
memberType.textContent =
data.membership;

// KYC
verifyBadge.textContent =
data.kyc_status;

// Status
accountStatus.textContent =
data.account_status;

// Avatar
if(data.avatar_url){

profilePhoto.src =
data.avatar_url;

}

}

// ---------- START ----------

checkUser();

// =====================================
// profile.js - Part 2
// =====================================

// ---------- DOM ----------

const machineCount =
document.getElementById("machineCount");

const teamCount =
document.getElementById("teamCount");

const bonusBalance =
document.getElementById("bonusBalance");

const completionPercent =
document.getElementById("completionPercent");

const progressBar =
document.getElementById("progressBar");

const notificationCount =
document.getElementById("notificationCount");

// ---------- LOAD STATISTICS ----------

async function loadStatistics(){

// Active Machines

const {

count:machines

}=await supabase

.from("user_machines")

.select("*",{count:"exact",head:true})

.eq("user_id",currentUser.id)

.eq("status","active");

machineCount.textContent=
machines || 0;


// Team Members

const {

count:team

}=await supabase

.from("referrals")

.select("*",{count:"exact",head:true})

.eq("referrer_id",currentUser.id);

teamCount.textContent=
team || 0;


// Referral Bonus

const {

data

}=await supabase

.from("profiles")

.select("total_referral_bonus")

.eq("id",currentUser.id)

.single();

bonusBalance.textContent=

"UGX "+

Number(

data?.total_referral_bonus || 0

).toLocaleString();

}

// ---------- PROFILE COMPLETION ----------

async function loadCompletion(){

const {

data

}=await supabase

.from("profiles")

.select("*")

.eq("id",currentUser.id)

.single();

let total=8;

let complete=0;

if(data.fullname) complete++;

if(data.email) complete++;

if(data.phone) complete++;

if(data.avatar_url) complete++;

if(data.country) complete++;

if(data.date_of_birth) complete++;

if(data.gender) complete++;

if(data.profile_completed) complete++;

const percent=

Math.round(

(complete/total)*100

);

completionPercent.textContent=

percent+"%";

progressBar.style.width=

percent+"%";

}

// ---------- NOTIFICATIONS ----------

async function loadNotifications(){

const {

count

}=await supabase

.from("user_notifications")

.select("*",{count:"exact",head:true})

.eq("user_id",currentUser.id)

.eq("is_read",false);

notificationCount.textContent=

count || 0;

}

// ---------- REFERRAL ----------

const referralCode=

document.getElementById("referralCode");

const referralLink=

document.getElementById("referralLink");

if(referralCode){

const {

data

}=await supabase

.from("profiles")

.select("referral_code")

.eq("id",currentUser.id)

.single();

referralCode.value=

data?.referral_code || "";

referralLink.value=

location.origin+

"/register.html?ref="+

(data?.referral_code || "");

}

// ---------- LOAD EVERYTHING ----------

async function loadDashboard(){

await loadStatistics();

await loadCompletion();

await loadNotifications();

}

loadDashboard();

// =====================================
// profile.js - Part 3
// =====================================

// ---------- POPUPS ----------

const overlay = document.getElementById("overlay");

const aboutPopup = document.getElementById("aboutPopup");
const settingsPopup = document.getElementById("settingsPopup");

const openAbout = document.getElementById("openAbout");
const closeAbout = document.getElementById("closeAbout");

const openSettings = document.getElementById("openSettings");
const closeSettings = document.getElementById("closeSettings");

function showPopup(popup){

overlay.classList.add("active");
popup.classList.add("active");

}

function hidePopup(popup){

overlay.classList.remove("active");
popup.classList.remove("active");

}

openAbout?.addEventListener("click",()=>{

showPopup(aboutPopup);

});

closeAbout?.addEventListener("click",()=>{

hidePopup(aboutPopup);

});

openSettings?.addEventListener("click",()=>{

showPopup(settingsPopup);

});

closeSettings?.addEventListener("click",()=>{

hidePopup(settingsPopup);

});

overlay?.addEventListener("click",()=>{

overlay.classList.remove("active");

aboutPopup?.classList.remove("active");

settingsPopup?.classList.remove("active");

});

// ---------- COPY REFERRAL ----------

document.getElementById("copyReferralBtn")?.addEventListener("click",()=>{

navigator.clipboard.writeText(

document.getElementById("referralCode").value

);

alert("Referral code copied.");

});

document.getElementById("copyLinkBtn")?.addEventListener("click",()=>{

navigator.clipboard.writeText(

document.getElementById("referralLink").value

);

alert("Referral link copied.");

});

// ---------- CHANGE PROFILE PHOTO ----------

const photoInput =
document.getElementById("photoInput");

document.getElementById("changePhoto")?.addEventListener("click",()=>{

photoInput.click();

});

photoInput?.addEventListener("change",async(e)=>{

const file=e.target.files[0];

if(!file) return;

// Image preview

profilePhoto.src=URL.createObjectURL(file);

// NOTE:
// Upload to your Supabase Storage bucket
// and save the returned URL into
// profiles.avatar_url

});

// ---------- CHANGE PASSWORD ----------

document.getElementById("changePasswordBtn")?.addEventListener("click",async()=>{

const password=

prompt("Enter new password");

if(!password) return;

const { error }=

await supabase.auth.updateUser({

password

});

if(error){

alert(error.message);

}else{

alert("Password updated successfully.");

}

});

// ---------- LOGOUT ----------

document.getElementById("logoutBtn")?.addEventListener("click",async()=>{

const ok=

confirm("Logout from your account?");

if(!ok) return;

await supabase.auth.signOut();

window.location.href="login.html";

});

// ---------- ABOUT CONTENT ----------

const aboutContent=

document.getElementById("aboutContent");

if(aboutContent){

aboutContent.innerHTML=`

<b>Marathon Digital Hub</b><br><br>

Marathon Digital Hub is a secure digital mining platform that allows members to purchase mining machines, earn daily income, build referral teams, manage investments, and track profits through one professional dashboard.

`;

}

console.log("Profile loaded successfully.");
