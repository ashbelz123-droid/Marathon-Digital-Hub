/* ==========================
PROFILE.JS
PART 1
========================== */

const supabase = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
);

/* ==========================
GLOBAL VARIABLES
========================== */

let currentUser = null;
let profile = null;

/* ==========================
AUTH CHECK
========================== */

async function checkAuth(){

const { data:{ user } } =
await supabase.auth.getUser();

if(!user){

window.location.href="login.html";

return;

}

currentUser=user;

loadProfile();

}

checkAuth();

/* ==========================
LOAD PROFILE
========================== */

async function loadProfile(){

const { data,error } = await supabase

.from("profiles")

.select("*")

.eq("id",currentUser.id)

.single();

if(error){

console.error(error);

return;

}

profile=data;

displayProfile();

loadStatistics();

}

/* ==========================
DISPLAY PROFILE
========================== */

function displayProfile(){

document.getElementById("fullName").textContent=
profile.fullname || "Unknown User";

document.getElementById("username").textContent=
"@"+(profile.referral_code || "member");

document.getElementById("walletBalance").textContent=
"UGX "+
Number(profile.wallet_balance || 0).toLocaleString();

document.getElementById("membershipBadge").textContent=
profile.membership || "Standard";

document.getElementById("kycBadge").textContent=
profile.kyc_status || "Not Verified";

document.getElementById("email").textContent=
profile.email || "-";

document.getElementById("phone").textContent=
profile.phone || "-";

document.getElementById("country").textContent=
profile.country || "-";

document.getElementById("memberSince").textContent=
new Date(profile.created_at)
.toLocaleDateString();

document.getElementById("lastLogin").textContent=
profile.last_login
? new Date(profile.last_login)
.toLocaleString()
: "Never";

if(profile.avatar_url){

document.getElementById("profileImage").src=
profile.avatar_url;

}

/* ==========================
ACCOUNT STATUS
========================== */

if(profile.is_frozen ||
profile.account_status==="suspended"){

document.getElementById("accountStatusCard")
.style.display="flex";

document.getElementById("accountBadge")
.textContent="Suspended";

document.getElementById("accountBadge")
.className="badge suspended";

document.getElementById("suspensionReason")
.textContent=
profile.suspension_reason ||
"Your account has been suspended by the administrator.";

}

    }

/* ==========================
LOAD STATISTICS
========================== */

async function loadStatistics(){

/* Active Machines */

const { data:machines } =
await supabase
.from("user_machines")
.select("id")
.eq("user_id",currentUser.id)
.eq("status","active");

document.getElementById("activeMachines")
.textContent=machines?.length || 0;


/* Total Invested */

document.getElementById("totalInvested")
.textContent=
"UGX "+
Number(profile.total_invested || 0)
.toLocaleString();


/* Total Profit */

document.getElementById("totalProfit")
.textContent=
"UGX "+
Number(profile.total_profit || 0)
.toLocaleString();


/* ==========================
REFERRALS
========================== */

const { data:referrals } =
await supabase
.from("referrals")
.select("*")
.eq("referrer_id",currentUser.id);

const totalTeam=referrals?.length || 0;

const activeTeam=
referrals?.filter(r=>
r.first_deposit_completed &&
r.first_machine_purchased
).length || 0;

const inactiveTeam=
totalTeam-activeTeam;

document.getElementById("teamMembers")
.textContent=totalTeam;

document.getElementById("teamCount")
.textContent=totalTeam;

document.getElementById("activeTeam")
.textContent=activeTeam;

document.getElementById("inactiveTeam")
.textContent=inactiveTeam;


/* Referral Bonus */

document.getElementById("referralReward")
.textContent=
"UGX "+
Number(profile.total_referral_bonus || 0)
.toLocaleString();


/* ==========================
KYC PROGRESS
========================== */

document.getElementById("kycProgress")
.textContent=
activeTeam+"/10";


/* Auto Verify KYC */

if(
activeTeam>=10 &&
profile.kyc_status!=="Verified"
){

await supabase
.from("profiles")
.update({

kyc_status:"Verified"

})
.eq("id",currentUser.id);

document.getElementById("kycBadge")
.textContent="Verified";

document.getElementById("kycStatus")
.textContent="Verified";

await createNotification(

"🎉 KYC Activated",

"Congratulations! Your KYC has been automatically verified because you reached 10 active referrals."

);

}


/* ==========================
NOTIFICATIONS
========================== */

const { data:notifications } =
await supabase

.from("user_notifications")

.select("*")

.eq("user_id",currentUser.id)

.eq("is_read",false);

document.getElementById("notificationBadge")
.textContent=
notifications?.length || 0;

}


/* ==========================
CREATE NOTIFICATION
========================== */

async function createNotification(

title,

message

){

await supabase

.from("user_notifications")

.insert({

user_id:currentUser.id,

title,

message,

type:"success"

});

    }

/* ==========================================
PROFILE.JS
PART 3
========================================== */

/* ========= PROFILE PICTURE ========= */

const avatarInput = document.getElementById("avatarInput");

if (avatarInput) {

avatarInput.addEventListener("change", uploadAvatar);

}

async function uploadAvatar(e){

const file = e.target.files[0];

if(!file){

return;

}

/* File validation */

const allowed = [

"image/png",

"image/jpeg",

"image/jpg",

"image/webp"

];

if(!allowed.includes(file.type)){

alert("Only PNG, JPG, JPEG and WEBP images are allowed.");

return;

}

if(file.size > 2 * 1024 * 1024){

alert("Image must be below 2MB.");

return;

}

const fileName =
`avatars/${currentUser.id}_${Date.now()}`;

const { error:uploadError } =
await supabase.storage

.from("machine-images")

.upload(fileName,file,{

upsert:true

});

if(uploadError){

alert(uploadError.message);

return;

}

const {

data:{ publicUrl }

}

=

supabase.storage

.from("machine-images")

.getPublicUrl(fileName);

await supabase

.from("profiles")

.update({

avatar_url:publicUrl,

updated_at:new Date()

})

.eq("id",currentUser.id);

document.getElementById("profileImage").src=

publicUrl;

alert("Profile picture updated successfully.");

}

/* ========= COPY REFERRAL ========= */

document.getElementById("copyReferralBtn")

?.addEventListener("click",()=>{

navigator.clipboard.writeText(

document.getElementById("referralLink").value

);

alert("Referral link copied.");

});

/* ========= SHARE ========= */

document.getElementById("shareReferralBtn")

?.addEventListener("click",()=>{

const link=

document.getElementById("referralLink").value;

window.open(

`https://wa.me/?text=${encodeURIComponent(link)}`,

"_blank"

);

});

/* ========= QUICK ACTIONS ========= */

document.getElementById("depositBtn")

?.addEventListener("click",()=>{

location.href="deposit.html";

});

document.getElementById("withdrawBtn")

?.addEventListener("click",()=>{

location.href="withdraw.html";

});

document.getElementById("machinesBtn")

?.addEventListener("click",()=>{

location.href="my-machines.html";

});

document.getElementById("historyBtn")

?.addEventListener("click",()=>{

location.href="history.html";

});

/* ========= LOGOUT ========= */

document.getElementById("confirmLogout")

?.addEventListener("click",async()=>{

await supabase.auth.signOut();

location.href="login.html";

});

/* ========= AUTO CLEAN OLD NOTIFICATIONS ========= */

async function cleanNotifications(){

const limitDate=new Date();

limitDate.setDate(limitDate.getDate()-30);

await supabase

.from("user_notifications")

.delete()

.eq("user_id",currentUser.id)

.lt(

"created_at",

limitDate.toISOString()

);

}

cleanNotifications();

/* ========= AUTO REFRESH ========= */

setInterval(()=>{

loadStatistics();

},60000);
