/*=========================================
MARATHON DIGITAL HUB
PROFILE.JS
PART 1
=========================================*/

document.addEventListener("DOMContentLoaded", async () => {

try{

/*=========================================
AUTHENTICATION
=========================================*/

const {
data:{user},
error
}=await supabase.auth.getUser();

if(error || !user){

window.location.href="login.html";

return;

}

const userId=user.id;

/*=========================================
LOAD PROFILE
=========================================*/

const {
data:profile,
error:profileError
}=await supabase

.from("profiles")

.select("*")

.eq("id",userId)

.single();

if(profileError){

console.error(profileError);

return;

}

/*=========================================
CACHE
=========================================*/

window.currentUser=user;

window.currentProfile=profile;

/*=========================================
PROFILE HEADER
=========================================*/

document.getElementById("fullName").textContent=
profile.fullname||"";

document.getElementById("email").textContent=
profile.email||"";

document.getElementById("userId").textContent=
profile.id.substring(0,8).toUpperCase();

document.getElementById("walletBalance").textContent=

`UGX ${Number(profile.wallet_balance||0).toLocaleString()}`;

document.getElementById("investedAmount").textContent=

`UGX ${Number(profile.total_invested||0).toLocaleString()}`;

document.getElementById("profitAmount").textContent=

`UGX ${Number(profile.total_profit||0).toLocaleString()}`;

document.getElementById("referralBonus").textContent=

`UGX ${Number(profile.total_referral_bonus||0).toLocaleString()}`;

/*=========================================
BADGES
=========================================*/

document.getElementById("membershipBadge").textContent=

profile.membership||"Standard";

document.getElementById("kycBadge").textContent=

profile.kyc_status||"Not Verified";

document.getElementById("statusBadge").textContent=

profile.account_status||"Active";

/*=========================================
PROFILE IMAGE
=========================================*/

const avatar=document.getElementById("profileAvatar");

avatar.src=

profile.avatar_url ||

"assets/images/default-avatar.png";

/*=========================================
ACCOUNT INFO
=========================================*/

document.getElementById("profileEmail").textContent=

profile.email||"-";

document.getElementById("profilePhone").textContent=

profile.phone||"-";

document.getElementById("profileCountry").textContent=

profile.country||"-";

document.getElementById("profileGender").textContent=

profile.gender||"-";

document.getElementById("profileDob").textContent=

profile.date_of_birth||"-";

document.getElementById("profileMembership").textContent=

profile.membership||"Standard";

document.getElementById("profileTimezone").textContent=

profile.timezone||"Africa/Kampala";

document.getElementById("profileLanguage").textContent=

profile.language||"English";

document.getElementById("profileLastLogin").textContent=

profile.last_login
?new Date(profile.last_login).toLocaleString()
:"-";

/*=========================================
MEMBER SINCE
=========================================*/

const created=new Date(profile.created_at);

document.getElementById("memberSince").textContent=

created.toLocaleDateString();

/*=========================================
SUSPENSION
=========================================*/

if(profile.is_frozen){

document

.getElementById("suspensionCard")

.classList.remove("hidden");

document

.getElementById("suspensionReason")

.textContent=

profile.suspension_reason ||

"Suspicious activities that may violate Marathon Digital Hub policies have been detected. Please contact support for assistance.";

document

.getElementById("depositBtn")

.disabled=true;

document

.getElementById("withdrawBtn")

.disabled=true;

document

.getElementById("statusBadge")

.textContent="Suspended";

}

   /*=========================================
PART 2
STATISTICS
REFERRALS
KYC
=========================================*/

const supabase = window.supabaseClient;

/*=========================================
ACTIVE MACHINES
=========================================*/

const {
data:userMachines
}=await supabase

.from("user_machines")

.select("*")

.eq("user_id",userId)

.eq("status","active");

document.getElementById("activeMachines").textContent=

userMachines?.length || 0;

/*=========================================
COMPLETED MACHINES
=========================================*/

const completedMachines=

userMachines?.filter(machine=>machine.completed===true);

document.getElementById("completedMachines").textContent=

completedMachines.length;

/*=========================================
TEAM MEMBERS
=========================================*/

const {

data:team

}=await supabase

.from("referrals")

.select("*")

.eq("referrer_id",userId);

document.getElementById("teamMembers").textContent=

team?.length || 0;

/*=========================================
ACTIVE REFERRALS
=========================================*/

const activeReferrals=

team?.filter(referral=>

referral.first_deposit_completed===true &&

referral.first_machine_purchased===true

);

document.getElementById("activeReferrals").textContent=

activeReferrals.length;

/*=========================================
REFERRAL CODE
=========================================*/

document.getElementById("referralCode").value=

profile.referral_code || "";

/*=========================================
REFERRAL LINK
=========================================*/

const referralLink=

`${window.location.origin}/register.html?ref=${profile.referral_code}`;

document.getElementById("referralLink").value=

referralLink;

/*=========================================
COPY CODE
=========================================*/

document

.getElementById("copyCodeBtn")

.addEventListener("click",()=>{

navigator.clipboard.writeText(profile.referral_code);

});

/*=========================================
COPY LINK
=========================================*/

document

.getElementById("copyLinkBtn")

.addEventListener("click",()=>{

navigator.clipboard.writeText(referralLink);

});

/*=========================================
WHATSAPP SHARE
=========================================*/

document

.getElementById("shareWhatsappBtn")

.addEventListener("click",()=>{

const text=

`Join Marathon Digital Hub using my referral link:%0A${referralLink}`;

window.open(

`https://wa.me/?text=${text}`,

"_blank"

);

});

/*=========================================
AUTOMATIC KYC
=========================================*/

const activeCount=

activeReferrals.length;

document.getElementById("kycProgressText").textContent=

`${activeCount}/10`;

const percentage=

Math.min(

(activeCount/10)*100,

100

);

document.getElementById("kycProgressBar").style.width=

percentage+"%";

/*=========================================
AUTO VERIFY
=========================================*/

if(

activeCount>=10 &&

profile.kyc_status!=="Verified"

){

await supabase

.from("profiles")

.update({

kyc_status:"Verified"

})

.eq("id",userId);

document.getElementById("kycBadge").textContent=

"Verified";

document.getElementById("kycStatusBadge").textContent=

"Verified";

}

/*=========================================
PURCHASED MACHINES
=========================================*/

const preview=

document.getElementById("machinePreview");

preview.innerHTML="";

userMachines.forEach(machine=>{

preview.innerHTML+=`

<div class="machine-item">

<strong>${machine.machine_name}</strong>

<span>${machine.status}</span>

</div>

`;

});

   
