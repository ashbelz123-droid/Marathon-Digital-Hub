/* ==========================================
PROFILE.JS
PART 1
========================================== */

const db = window.supabaseClient;

let currentUser = null;
let profile = null;
let userMachines = [];

document.addEventListener("DOMContentLoaded", init);

async function init() {

    try {

        const { data: { user } } = await db.auth.getUser();

        if (!user) {

            window.location.href = "login.html";
            return;

        }

        currentUser = user;

        await loadProfile();

        await loadMachines();

        updateReferralLock();

    } catch (err) {

        console.error(err);

        alert("Failed to load profile.");

    }

}

/* ==========================================
LOAD PROFILE
========================================== */

async function loadProfile() {

    const { data, error } = await db

        .from("profiles")

        .select("*")

        .eq("id", currentUser.id)

        .single();

    if (error) {

        console.error(error);
        return;

    }

    profile = data;

    document.getElementById("fullName").textContent =
        profile.fullname || "User";

    document.getElementById("profileName").textContent =
        profile.fullname || "-";

    document.getElementById("profileEmail").textContent =
        profile.email || "-";

    document.getElementById("profilePhone").textContent =
        profile.phone || "Not Added";

    document.getElementById("profileCountry").textContent =
        profile.country || "Not Set";

    document.getElementById("profileDob").textContent =
        profile.date_of_birth || "Not Set";

    document.getElementById("profileGender").textContent =
        profile.gender || "Not Set";

    document.getElementById("membership").textContent =
        profile.membership || "Standard";

    document.getElementById("memberLevel").textContent =
        (profile.membership || "STANDARD") + " MEMBER";

    document.getElementById("walletBalance").textContent =
        "UGX " + Number(profile.wallet_balance || 0).toLocaleString();

    document.getElementById("totalInvested").textContent =
        "UGX " + Number(profile.total_invested || 0).toLocaleString();

    document.getElementById("totalProfit").textContent =
        "UGX " + Number(profile.total_profit || 0).toLocaleString();

    document.getElementById("profileKyc").textContent =
        profile.kyc_status || "Not Verified";

    document.getElementById("profileStatus").textContent =
        profile.account_status || "Active";

    document.getElementById("statusBadge").textContent =
        profile.account_status === "active"
            ? "🟢 Active"
            : "🔴 Suspended";

    document.getElementById("kycBadge").textContent =
        profile.kyc_status === "Verified"
            ? "🛡️ Verified"
            : "🛡️ Not Verified";

    document.getElementById("userId").textContent =
        "ID: " + currentUser.id.substring(0,8).toUpperCase();

    document.getElementById("memberSince").textContent =
        new Date(profile.created_at).toLocaleDateString();

    if(profile.avatar_url){

        document.getElementById("profileImage").src =
        profile.avatar_url;

    }

          }

/* ==========================================
PROFILE.JS
PART 2
========================================== */

/* ==========================================
LOAD USER MACHINES
========================================== */

async function loadMachines() {

    const { data, error } = await db
        .from("user_machines")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("status", "active");

    if (error) {
        console.error(error);
        return;
    }

    userMachines = data || [];

    document.getElementById("activeMachines").textContent =
        userMachines.length;

    loadReferralData();

}

/* ==========================================
LOAD REFERRAL DATA
========================================== */

async function loadReferralData() {

    /* Team Members */

    const { data: team } = await db
        .from("profiles")
        .select("id")
        .eq("referred_by", profile.referral_code);

    const totalTeam = team ? team.length : 0;

    document.getElementById("teamMembers").textContent =
        totalTeam;

    /* Active Team */

    let active = 0;

    if (team && team.length > 0) {

        for (const member of team) {

            const { data } = await db
                .from("user_machines")
                .select("id")
                .eq("user_id", member.id)
                .limit(1);

            if (data && data.length > 0) {

                active++;

            }

        }

    }

    document.getElementById("activeTeam").textContent =
        active;

    /* Referral Bonus */

    document.getElementById("referralBonus").textContent =
        "UGX " +
        Number(profile.total_referral_bonus || 0).toLocaleString();

    /* Referral Code */

    document.getElementById("referralCode").value =
        profile.referral_code || "";

    /* Referral Link */

    const referralLink =
        "https://marathon-digital-hub-lwb4.vercel.app/register.html?ref=" +
        encodeURIComponent(profile.referral_code || "");

    document.getElementById("referralLink").value =
        referralLink;

}

/* ==========================================
PROFILE COMPLETION
========================================== */

function updateProfileCompletion() {

    let score = 0;

    if (profile.fullname) score += 10;
    if (profile.email) score += 10;
    if (profile.phone) score += 10;
    if (profile.country) score += 10;
    if (profile.gender) score += 10;
    if (profile.date_of_birth) score += 10;
    if (profile.avatar_url) score += 10;
    if (profile.transaction_pin) score += 10;
    if (profile.kyc_status === "Verified") score += 20;

    document.getElementById("profilePercent").textContent =
        score + "%";

    document.getElementById("profileProgress").style.width =
        score + "%";

                        }

/* ==========================================
PROFILE.JS
PART 3
========================================== */

/* ==========================================
REFERRAL LOCK
========================================== */

function updateReferralLock() {

    const lockCard = document.getElementById("referralLockCard");

    if (!lockCard) return;

    if (userMachines.length > 0) {

        lockCard.style.display = "none";

    } else {

        lockCard.style.display = "block";

    }

    updateProfileCompletion();

}

/* ==========================================
POPUPS
========================================== */

const overlay = document.getElementById("popupOverlay");

function openPopup(id){

    overlay.style.display = "block";

    document.getElementById(id).classList.add("active");

}

function closeAllPopups(){

    overlay.style.display = "none";

    document.querySelectorAll(".popup").forEach(p=>{

        p.classList.remove("active");

    });

}

document.querySelectorAll(".closePopup").forEach(btn=>{

    btn.addEventListener("click",closeAllPopups);

});

overlay.addEventListener("click",closeAllPopups);

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

/* ==========================================
COPY REFERRAL
========================================== */

document.getElementById("copyCodeBtn")?.addEventListener("click",()=>{

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

/* ==========================================
SHARE REFERRAL
========================================== */

document.getElementById("shareReferralBtn")?.addEventListener("click",async()=>{

    const link=document.getElementById("referralLink").value;

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

/* ==========================================
BUY MACHINE
========================================== */

document.getElementById("buyMachineBtn")?.addEventListener("click",()=>{

    window.location.href="machines.html";

});

/* ==========================================
LOGOUT
========================================== */

document.getElementById("logoutBtn")?.addEventListener("click",async()=>{

    if(!confirm("Logout from your account?")) return;

    await db.auth.signOut();

    window.location.href="login.html";

});

/* ==========================================
PLACEHOLDER BUTTONS
========================================== */

document.getElementById("depositBtn")?.onclick=()=>location.href="deposit.html";

document.getElementById("withdrawBtn")?.onclick=()=>location.href="withdraw.html";

document.getElementById("rewardBtn")?.onclick=()=>{

    alert("Rewards feature coming soon.");

};

document.getElementById("teamBtn")?.onclick=()=>{

    if(userMachines.length===0){

        alert("Buy a machine first to unlock your team.");

        return;

    }

    openPopup("referralPopup");

};

/* ==========================================
END
========================================== */

console.log("Profile page loaded successfully.");
