/*==================================================
PROFILE.JS
PART 1
==================================================*/

const db = window.supabaseClient;

let currentUser = null;
let profile = null;
let userMachines = [];

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const { data:{ user }, error } = await db.auth.getUser();

        if (error) throw error;

        if (!user) {

            window.location.href = "login.html";
            return;

        }

        currentUser = user;

        await initializeProfile();

    } catch (err) {

        console.error("AUTH ERROR:", err);

        alert(err.message);

    }

});

/*==================================================
INITIALIZE
==================================================*/

async function initializeProfile(){

    await loadProfile();

    await loadUserMachines();

}

/*==================================================
LOAD PROFILE
==================================================*/

async function loadProfile(){

    const { data, error } = await db

        .from("profiles")

        .select("*")

        .eq("id", currentUser.id)

        .single();

    if(error){

        console.error(error);

        return;

    }

    profile = data;

    updateProfileUI();

}

/*==================================================
UPDATE UI
==================================================*/

function setText(id,value){

    const el=document.getElementById(id);

    if(el) el.textContent=value;

}

function updateProfileUI(){

    setText("fullName",profile.fullname||"User");

    setText("profileName",profile.fullname||"User");

    setText("profileEmail",profile.email||"-");

    setText("profilePhone",profile.phone||"Not Added");

    setText("profileCountry",profile.country||"Not Set");

    setText("profileDob",profile.date_of_birth||"Not Set");

    setText("profileGender",profile.gender||"Not Set");

    setText("profileStatus",profile.account_status||"Active");

    setText("profileKyc",profile.kyc_status||"Not Verified");

    setText("memberSince",

        new Date(profile.created_at)

        .toLocaleDateString()

    );

    setText(

        "walletBalance",

        "UGX "+Number(

            profile.wallet_balance||0

        ).toLocaleString()

    );

    setText(

        "totalInvested",

        "UGX "+Number(

            profile.total_invested||0

        ).toLocaleString()

    );

    setText(

        "totalProfit",

        "UGX "+Number(

            profile.total_profit||0

        ).toLocaleString()

    );

    if(profile.avatar_url){

        const img=document.getElementById("profileImage");

        if(img){

            img.src=profile.avatar_url;

        }

    }

}

/*==================================================
LOAD USER MACHINES
==================================================*/

async function loadUserMachines(){

    const { data, error } = await db

        .from("user_machines")

        .select("*")

        .eq("user_id", currentUser.id);

    if(error){

        console.error(error);

        return;

    }

    userMachines = data || [];

    const active = userMachines.filter(machine =>
        machine.status === "active"
    ).length;

    setText("activeMachines", active);

    await loadReferralInformation();

}

/*==================================================
LOAD REFERRAL INFORMATION
==================================================*/

async function loadReferralInformation(){

    if(!profile || !profile.referral_code){

        setText("teamMembers",0);
        setText("activeTeam",0);

        return;

    }

    const { data, error } = await db

        .from("profiles")

        .select("id")

        .eq("referred_by", profile.referral_code);

    if(error){

        console.error(error);

        return;

    }

    const totalTeam = data ? data.length : 0;

    setText("teamMembers", totalTeam);

    setText("activeTeam", totalTeam);

    setText(

        "referralBonus",

        "UGX " +

        Number(profile.total_referral_bonus || 0)

        .toLocaleString()

    );

    const code = document.getElementById("referralCode");

    if(code){

        code.value = profile.referral_code;

    }

    const link = document.getElementById("referralLink");

    if(link){

        link.value =
        `https://marathon-digital-hub-lwb4.vercel.app/register.html?ref=${profile.referral_code}`;

    }

    updateProfileCompletion();

}

/*==================================================
PROFILE COMPLETION
==================================================*/

function updateProfileCompletion(){

    let percent = 0;

    if(profile.fullname) percent += 10;
    if(profile.phone) percent += 10;
    if(profile.email) percent += 10;
    if(profile.country) percent += 10;
    if(profile.gender) percent += 10;
    if(profile.date_of_birth) percent += 10;
    if(profile.avatar_url) percent += 10;
    if(profile.transaction_pin) percent += 20;
    if(profile.profile_completed) percent += 20;

    if(percent > 100){

        percent = 100;

    }

    const progress = document.getElementById("profileProgress");

    if(progress){

        progress.style.width = percent + "%";

    }

    setText("profilePercent", percent + "%");

            }

/*==================================================
PROFILE.JS
PART 3
==================================================*/

/*==============================
POPUPS
==============================*/

const overlay = document.getElementById("popupOverlay");

function openPopup(id){

    const popup = document.getElementById(id);

    if(!popup) return;

    if(overlay) overlay.style.display="block";

    popup.classList.add("active");

}

function closePopup(){

    if(overlay) overlay.style.display="none";

    document.querySelectorAll(".popup").forEach(p=>{

        p.classList.remove("active");

    });

}

overlay?.addEventListener("click",closePopup);

document.querySelectorAll(".closePopup").forEach(btn=>{

    btn.addEventListener("click",closePopup);

});

/*==============================
BUTTONS
==============================*/

document.getElementById("inviteBtn")?.addEventListener("click",()=>{

    if(userMachines.length===0){

        alert("Buy your first mining machine to unlock referrals.");

        return;

    }

    openPopup("referralPopup");

});

document.getElementById("settingBtn")?.addEventListener("click",()=>{

    openPopup("settingsPopup");

});

/*==============================
COPY REFERRAL
==============================*/

async function copyText(id){

    const el=document.getElementById(id);

    if(!el) return;

    try{

        await navigator.clipboard.writeText(el.value);

        alert("Copied successfully.");

    }catch(e){

        console.error(e);

    }

}

document.getElementById("copyCodeBtn")?.addEventListener("click",()=>{

    copyText("referralCode");

});

document.getElementById("copyLinkBtn")?.addEventListener("click",()=>{

    copyText("referralLink");

});

/*==============================
SHARE
==============================*/

document.getElementById("shareReferralBtn")?.addEventListener("click",async()=>{

    const link=document.getElementById("referralLink")?.value;

    if(!link) return;

    if(navigator.share){

        try{

            await navigator.share({

                title:"Marathon Digital Hub",

                text:"Join Marathon Digital Hub using my referral link.",

                url:link

            });

        }catch(e){}

    }else{

        await navigator.clipboard.writeText(link);

        alert("Referral link copied.");

    }

});

/*==============================
LOGOUT
==============================*/

document.getElementById("logoutBtn")?.addEventListener("click",async()=>{

    if(!confirm("Logout?")) return;

    await db.auth.signOut();

    window.location.href="login.html";

});

/*==============================
NAVIGATION
==============================*/

document.getElementById("buyMachineBtn")?.addEventListener("click",()=>{

    location.href="machines.html";

});

document.getElementById("depositBtn")?.addEventListener("click",()=>{

    location.href="deposit.html";

});

document.getElementById("withdrawBtn")?.addEventListener("click",()=>{

    location.href="withdraw.html";

});

/*==============================
PROFILE IMAGE
==============================*/

document.getElementById("changePhotoBtn")?.addEventListener("click",()=>{

    document.getElementById("photoInput")?.click();

});

/*==============================
READY
==============================*/

console.log("Profile page initialized.");
