/* ==========================
PROFILE.JS
PART 1
========================== */

// Supabase client
const supabase = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
);

let currentUser = null;
let profile = null;

/* ==========================
START
========================== */

document.addEventListener("DOMContentLoaded", async () => {

await checkSession();

if(currentUser){

await loadProfile();

await loadStatistics();

}

});

/* ==========================
CHECK LOGIN
========================== */

async function checkSession(){

const { data, error } = await supabase.auth.getUser();

if(error || !data.user){

window.location.href="login.html";

return;

}

currentUser = data.user;

}

/* ==========================
LOAD PROFILE
========================== */

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

profile=data;

/* ==========================
PROFILE DETAILS
========================== */

document.getElementById("fullName").textContent =
profile.fullname || "User";

document.getElementById("username").textContent =
profile.email || "";

document.getElementById("walletBalance").textContent =
"UGX " + Number(profile.wallet_balance || 0).toLocaleString();

document.getElementById("membershipBadge").textContent =
profile.membership || "Standard";

document.getElementById("kycBadge").textContent =
profile.kyc_status || "Not Verified";

document.getElementById("email").textContent =
profile.email || "-";

document.getElementById("phone").textContent =
profile.phone || "-";

document.getElementById("country").textContent =
profile.country || "-";

/* ==========================
PROFILE IMAGE
========================== */

if(profile.avatar_url){

document.getElementById("profileImage").src =
profile.avatar_url;

}

/* ==========================
ACCOUNT STATUS
========================== */

if(profile.is_frozen){

document.getElementById("accountBadge").textContent =
"Suspended";

document.getElementById("accountBadge").className =
"badge suspended";

document.getElementById("accountStatusCard").style.display =
"flex";

document.getElementById("suspensionReason").textContent =
profile.suspension_reason ||
"Your account has been suspended by the administrator.";

}else{

document.getElementById("accountBadge").textContent =
"Active";

document.getElementById("accountBadge").className =
"badge active";

}

}

/* ==========================
LOAD STATISTICS
========================== */

async function loadStatistics(){

// This function will be completed
// in Part 2.

   }

/* ==========================
LOAD STATISTICS
========================== */

async function loadStatistics(){

/* --------------------------
ACTIVE MACHINES
-------------------------- */

const { data: machines } = await supabase

.from("user_machines")

.select("id,status,amount_paid,earned_amount")

.eq("user_id", currentUser.id);

const activeMachines =
machines?.filter(m=>m.status==="active").length || 0;

document.getElementById("activeMachines").textContent =
activeMachines;

/* --------------------------
TOTAL INVESTED
-------------------------- */

let invested = 0;

machines?.forEach(machine=>{

invested += Number(machine.amount_paid || 0);

});

document.getElementById("totalInvested").textContent =
"UGX " + invested.toLocaleString();

/* --------------------------
TOTAL PROFIT
-------------------------- */

document.getElementById("totalProfit").textContent =
"UGX " +
Number(profile.total_profit || 0).toLocaleString();

/* --------------------------
TEAM MEMBERS
-------------------------- */

const { data: referrals } = await supabase

.from("referrals")

.select("*")

.eq("referrer_id", currentUser.id);

document.getElementById("teamMembers").textContent =
referrals?.length || 0;

document.getElementById("teamCount").textContent =
referrals?.length || 0;

/* --------------------------
ACTIVE TEAM
-------------------------- */

const activeTeam =
referrals?.filter(r=>r.first_machine_purchased===true).length || 0;

document.getElementById("activeTeam").textContent =
activeTeam;

/* --------------------------
REFERRAL BONUS
-------------------------- */

document.getElementById("referralReward").textContent =
"UGX " +
Number(profile.total_referral_bonus || 0).toLocaleString();

/* --------------------------
KYC PROGRESS
-------------------------- */

document.getElementById("kycProgress").textContent =
activeTeam + "/10";

/* --------------------------
REFERRAL LINK
-------------------------- */

const referralCode =
profile.referral_code || currentUser.id.substring(0,8);

document.getElementById("referralLink").value =
window.location.origin +
"/register.html?ref=" +
referralCode;

/* --------------------------
MEMBER SINCE
-------------------------- */

if(profile.created_at){

document.getElementById("memberSince").textContent =
new Date(profile.created_at)
.toLocaleDateString();

}

/* --------------------------
LAST LOGIN
-------------------------- */

document.getElementById("lastLogin").textContent =
profile.last_login
? new Date(profile.last_login).toLocaleString()
: "First Login";

/* --------------------------
NOTIFICATION COUNT
-------------------------- */

const { count } = await supabase

.from("user_notifications")

.select("*",{count:"exact",head:true})

.eq("user_id",currentUser.id)

.eq("is_read",false);

document.getElementById("notificationBadge").textContent =
count || 0;

}

/* ==========================
PROFILE.JS
PART 3
POPUPS • PROFILE • SUPPORT
========================== */

/* --------------------------
COPY REFERRAL LINK
-------------------------- */

document.getElementById("copyReferralBtn")?.addEventListener("click",()=>{

const link=document.getElementById("referralLink");

link.select();

document.execCommand("copy");

alert("Referral link copied.");

});

/* --------------------------
SHARE REFERRAL
-------------------------- */

document.getElementById("shareReferralBtn")?.addEventListener("click",()=>{

const link=document.getElementById("referralLink").value;

const text=
`🚀 Join Marathon Digital Hub and start earning today.\n\n${link}`;

window.open(

`https://wa.me/?text=${encodeURIComponent(text)}`,

"_blank"

);

});

/* --------------------------
UPLOAD PROFILE PHOTO
-------------------------- */

document.getElementById("changeAvatarBtn")?.addEventListener("click",()=>{

document.getElementById("avatarInput").click();

});

document.getElementById("avatarInput")?.addEventListener("change",uploadAvatar);

async function uploadAvatar(e){

const file=e.target.files[0];

if(!file) return;

const fileName=
`${currentUser.id}_${Date.now()}`;

const { error:uploadError }=
await supabase.storage

.from("machine-images")

.upload(fileName,file,{upsert:true});

if(uploadError){

alert(uploadError.message);

return;

}

const { data }=
supabase.storage

.from("machine-images")

.getPublicUrl(fileName);

await supabase

.from("profiles")

.update({

avatar_url:data.publicUrl

})

.eq("id",currentUser.id);

document.getElementById("profileImage").src=
data.publicUrl;

alert("Profile picture updated.");

}

/* --------------------------
EDIT PROFILE
-------------------------- */

document.getElementById("saveProfileBtn")?.addEventListener("click",saveProfile);

async function saveProfile(){

const fullname=
document.getElementById("editName").value.trim();

const phone=
document.getElementById("editPhone").value.trim();

const country=
document.getElementById("editCountry").value.trim();

const gender=
document.getElementById("editGender").value;

const dob=
document.getElementById("editDob").value;

const { error }=
await supabase

.from("profiles")

.update({

fullname,

phone,

country,

gender,

date_of_birth:dob,

updated_at:new Date()

})

.eq("id",currentUser.id);

if(error){

alert(error.message);

return;

}

alert("Profile updated.");

loadProfile();

closeAllModals();

}

/* --------------------------
CHANGE PASSWORD
-------------------------- */

document.getElementById("updatePasswordBtn")?.addEventListener("click",async()=>{

const password=
document.getElementById("newPassword").value;

const confirm=
document.getElementById("confirmPassword").value;

if(password!==confirm){

alert("Passwords do not match.");

return;

}

const { error }=
await supabase.auth.updateUser({

password

});

if(error){

alert(error.message);

return;

}

alert("Password updated.");

closeAllModals();

});

/* --------------------------
CHANGE TRANSACTION PIN
-------------------------- */

document.getElementById("updatePinBtn")?.addEventListener("click",async()=>{

const pin=
document.getElementById("newPin").value;

const confirm=
document.getElementById("confirmPin").value;

if(pin.length!==6){

alert("PIN must contain 6 digits.");

return;

}

if(pin!==confirm){

alert("PIN does not match.");

return;

}

const { error }=
await supabase

.from("profiles")

.update({

transaction_pin:pin

})

.eq("id",currentUser.id);

if(error){

alert(error.message);

return;

}

alert("Transaction PIN updated.");

closeAllModals();

});

/* --------------------------
SUPPORT
-------------------------- */

document.getElementById("sendSupportBtn")?.addEventListener("click",async()=>{

const subject=
document.getElementById("supportSubject").value.trim();

const message=
document.getElementById("supportMessage").value.trim();

if(!subject||!message){

alert("Complete all fields.");

return;

}

const { error }=
await supabase

.from("support_messages")

.insert({

user_id:currentUser.id,

subject,

message

});

if(error){

alert(error.message);

return;

}

alert("Support message sent.");

closeAllModals();

});

/* --------------------------
LOGOUT
-------------------------- */

document.getElementById("confirmLogout")?.addEventListener("click",async()=>{

await supabase.auth.signOut();

window.location.href="login.html";

});

/* --------------------------
MODALS
-------------------------- */

function openModal(id){

document.getElementById(id)?.classList.add("active");

}

function closeAllModals(){

document.querySelectorAll(".modal").forEach(modal=>{

modal.classList.remove("active");

});

}

document.querySelectorAll(".closeModal").forEach(btn=>{

btn.onclick=closeAllModals;

});

window.onclick=(e)=>{

if(e.target.classList.contains("modal")){

closeAllModals();

}

};

/* --------------------------
OPEN MODALS
-------------------------- */

document.getElementById("settingsBtn")?.onclick=()=>openModal("settingsModal");

document.getElementById("editProfileBtn")?.onclick=()=>openModal("editProfileModal");

document.getElementById("changePasswordBtn")?.onclick=()=>openModal("passwordModal");

document.getElementById("changePinBtn")?.onclick=()=>openModal("pinModal");

document.getElementById("notificationsBtn")?.onclick=()=>openModal("notificationsModal");

document.getElementById("supportBtn")?.onclick=()=>openModal("supportModal");

document.getElementById("logoutBtn")?.onclick=()=>openModal("logoutModal");

/* ==========================
PROFILE.JS
PART 4
EXTRA FEATURES
========================== */

/* --------------------------
LOAD NOTIFICATIONS
-------------------------- */

async function loadNotifications(){

const { data, error } = await supabase

.from("user_notifications")

.select("*")

.eq("user_id", currentUser.id)

.order("created_at",{ascending:false})

.limit(30);

if(error) return;

const container=document.getElementById("notificationsContainer");

if(!container) return;

container.innerHTML="";

if(!data.length){

container.innerHTML=`
<div class="empty-card">
No notifications available.
</div>`;

return;

}

data.forEach(notification=>{

container.innerHTML+=`

<div class="notification-card">

<h4>${notification.title}</h4>

<p>${notification.message}</p>

<small>

${new Date(notification.created_at).toLocaleString()}

</small>

</div>

`;

});

}

/* --------------------------
MARK ALL AS READ
-------------------------- */

async function markNotificationsRead(){

await supabase

.from("user_notifications")

.update({

is_read:true

})

.eq("user_id",currentUser.id)

.eq("is_read",false);

}

/* --------------------------
AUTO DELETE OLD
NOTIFICATIONS (30 DAYS)
-------------------------- */

async function cleanNotifications(){

const date=new Date();

date.setDate(date.getDate()-30);

await supabase

.from("user_notifications")

.delete()

.eq("user_id",currentUser.id)

.lt("created_at",date.toISOString());

}

/* --------------------------
CONTACT SUPPORT
-------------------------- */

document.getElementById("contactSupportBtn")?.addEventListener("click",()=>{

openModal("supportModal");

});

/* --------------------------
GO TO PURCHASED MACHINES
-------------------------- */

document.getElementById("machinesBtn")?.addEventListener("click",()=>{

window.location.href="user-machines.html";

});

/* --------------------------
GO TO DEPOSIT
-------------------------- */

document.getElementById("depositBtn")?.addEventListener("click",()=>{

window.location.href="deposit.html";

});

/* --------------------------
GO TO WITHDRAW
-------------------------- */

document.getElementById("withdrawBtn")?.addEventListener("click",()=>{

window.location.href="withdraw.html";

});

/* --------------------------
PAGE STARTUP
-------------------------- */

document.addEventListener("DOMContentLoaded",async()=>{

await cleanNotifications();

await loadNotifications();

});

/* --------------------------
LIVE PROFILE REFRESH
-------------------------- */

setInterval(async()=>{

await loadProfile();

await loadStatistics();

},30000);
