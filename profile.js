/*=========================================
PROFILE.JS - PART 1
=========================================*/

const supabase = window.supabaseClient;

let user = null;
let profile = null;

/*=========================================
START
=========================================*/

document.addEventListener("DOMContentLoaded", () => {
    initializeProfile();
});

async function initializeProfile() {

    try {

        const {
            data: { session },
            error
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (!session) {
            location.href = "login.html";
            return;
        }

        user = session.user;

        await loadProfile();

    } catch (err) {

        console.error(err);

        alert("Error: " + err.message);

    }

}

/*=========================================
LOAD PROFILE
=========================================*/

async function loadProfile() {

    const { data, error } = await supabase

        .from("profiles")

        .select("*")

        .eq("id", user.id)

        .single();

    if (error) throw error;

    profile = data;

    updateProfileUI();

}

/*=========================================
UPDATE PROFILE UI
=========================================*/

function updateProfileUI() {

    const set = (id, value) => {

        const el = document.getElementById(id);

        if (el) el.textContent = value;

    };

    set("fullName", profile.fullname || "User");

    set("profileName", profile.fullname || "-");

    set("profileEmail", profile.email || "-");

    set("profilePhone", profile.phone || "Not Added");

    set("profileCountry", profile.country || "Not Set");

    set("profileDob", profile.date_of_birth || "Not Set");

    set("profileGender", profile.gender || "Not Set");

    set("profileStatus", profile.account_status || "Active");

    set("profileKyc", profile.kyc_status || "Not Verified");

    set("membership", profile.membership || "Standard");

    set("memberLevel",
        (profile.membership || "Standard").toUpperCase() + " MEMBER"
    );

    set(
        "walletBalance",
        "UGX " + Number(profile.wallet_balance || 0).toLocaleString()
    );

    set(
        "totalInvested",
        "UGX " + Number(profile.total_invested || 0).toLocaleString()
    );

    set(
        "totalProfit",
        "UGX " + Number(profile.total_profit || 0).toLocaleString()
    );

    set(
        "memberSince",
        new Date(profile.created_at).toLocaleDateString()
    );

    set(
        "userId",
        "ID: " + user.id.substring(0,8).toUpperCase()
    );

    if (profile.avatar_url) {

        const img = document.getElementById("profileImage");

        if (img) img.src = profile.avatar_url;

    }

    loadMachines();

}

/*=========================================
PROFILE.JS - PART 2
=========================================*/

let machines = [];
let referralCount = 0;

/*=========================================
LOAD MACHINES
=========================================*/

async function loadMachines() {

    const { data, error } = await supabase

        .from("user_machines")

        .select("*")

        .eq("user_id", user.id);

    if (error) {

        console.error(error);

        machines = [];

    } else {

        machines = data || [];

    }

    const active = machines.filter(m =>
        m.status === "active" && !m.completed
    ).length;

    const activeMachines =
        document.getElementById("activeMachines");

    if (activeMachines)
        activeMachines.textContent = active;

    checkReferralAccess();

    await loadReferralData();

    calculateProfileCompletion();

}

/*=========================================
REFERRAL ACCESS
=========================================*/

function checkReferralAccess() {

    const lock =
        document.getElementById("referralLockCard");

    if (!lock) return;

    if (machines.length > 0) {

        lock.style.display = "none";

    } else {

        lock.style.display = "block";

    }

}

/*=========================================
LOAD REFERRALS
=========================================*/

async function loadReferralData() {

    if (!profile.referral_code) return;

    const { data, error } = await supabase

        .from("profiles")

        .select("id")

        .eq("referred_by", profile.referral_code);

    if (error) {

        console.error(error);

        return;

    }

    referralCount = data ? data.length : 0;

    const team =
        document.getElementById("teamMembers");

    if (team)
        team.textContent = referralCount;

    const activeTeam =
        document.getElementById("activeTeam");

    if (activeTeam)
        activeTeam.textContent = referralCount;

    const bonus =
        document.getElementById("referralBonus");

    if (bonus)

        bonus.textContent =
            "UGX " +
            Number(
                profile.total_referral_bonus || 0
            ).toLocaleString();

    const code =
        document.getElementById("referralCode");

    if (code)

        code.value =
            profile.referral_code;

    const link =
        document.getElementById("referralLink");

    if (link)

        link.value =
`https://marathon-digital-hub-lwb4.vercel.app/register.html?ref=${profile.referral_code}`;

}

/*=========================================
PROFILE COMPLETION
=========================================*/

function calculateProfileCompletion() {

    let score = 0;

    if (profile.fullname) score += 10;
    if (profile.phone) score += 10;
    if (profile.email) score += 10;
    if (profile.country) score += 10;
    if (profile.gender) score += 10;
    if (profile.date_of_birth) score += 10;
    if (profile.avatar_url) score += 10;
    if (profile.transaction_pin) score += 20;
    if (profile.profile_completed) score += 20;

    if (score > 100) score = 100;

    const percent =
        document.getElementById("profilePercent");

    if (percent)
        percent.textContent = score + "%";

    const bar =
        document.getElementById("profileProgress");

    if (bar)
        bar.style.width = score + "%";

}

/*=========================================
PROFILE.JS - PART 3
=========================================*/

/*=========================================
POPUPS
=========================================*/

const overlay = document.getElementById("popupOverlay");

function openPopup(id) {

    const popup = document.getElementById(id);

    if (!popup) return;

    if (overlay) overlay.style.display = "block";

    popup.classList.add("active");

}

function closePopups() {

    if (overlay) overlay.style.display = "none";

    document.querySelectorAll(".popup").forEach(p => {

        p.classList.remove("active");

    });

}

document.querySelectorAll(".closePopup").forEach(btn => {

    btn.addEventListener("click", closePopups);

});

if (overlay) {

    overlay.addEventListener("click", closePopups);

}

/*=========================================
BUTTON EVENTS
=========================================*/

function go(page){

    window.location.href = page;

}

document.getElementById("depositBtn")?.addEventListener("click",()=>{

    go("deposit.html");

});

document.getElementById("withdrawBtn")?.addEventListener("click",()=>{

    go("withdraw.html");

});

document.getElementById("buyMachineBtn")?.addEventListener("click",()=>{

    go("machines.html");

});

document.getElementById("settingBtn")?.addEventListener("click",()=>{

    openPopup("settingsPopup");

});

document.getElementById("inviteBtn")?.addEventListener("click",()=>{

    if(machines.length===0){

        alert("Buy your first machine to unlock referrals.");

        return;

    }

    openPopup("referralPopup");

});

document.getElementById("teamBtn")?.addEventListener("click",()=>{

    if(machines.length===0){

        alert("No team available yet.");

        return;

    }

    openPopup("referralPopup");

});

/*=========================================
COPY
=========================================*/

document.getElementById("copyCodeBtn")?.addEventListener("click",async()=>{

    const code=document.getElementById("referralCode").value;

    await navigator.clipboard.writeText(code);

    alert("Referral code copied.");

});

document.getElementById("copyLinkBtn")?.addEventListener("click",async()=>{

    const link=document.getElementById("referralLink").value;

    await navigator.clipboard.writeText(link);

    alert("Referral link copied.");

});

/*=========================================
SHARE
=========================================*/

document.getElementById("shareReferralBtn")?.addEventListener("click",async()=>{

    const link=document.getElementById("referralLink").value;

    if(navigator.share){

        await navigator.share({

            title:"Marathon Digital Hub",

            text:"Join Marathon Digital Hub using my referral link.",

            url:link

        });

    }else{

        await navigator.clipboard.writeText(link);

        alert("Referral link copied.");

    }

});

/*=========================================
LOGOUT
=========================================*/

document.getElementById("logoutBtn")?.addEventListener("click",async()=>{

    const ok=confirm("Are you sure you want to logout?");

    if(!ok) return;

    await supabase.auth.signOut();

    location.href="login.html";

});

/*=========================================
PLACEHOLDER SETTINGS
=========================================*/

document.getElementById("editProfileBtn")?.addEventListener("click",()=>{

    alert("Edit Profile coming soon.");

});

document.getElementById("changePasswordBtn")?.addEventListener("click",()=>{

    alert("Change Password coming soon.");

});

document.getElementById("changePinBtn")?.addEventListener("click",()=>{

    alert("Transaction PIN coming soon.");

});

document.getElementById("changePhotoBtn")?.addEventListener("click",()=>{

    alert("Change Profile Photo coming soon.");

});

document.getElementById("changePhotoBtn2")?.addEventListener("click",()=>{

    alert("Change Profile Photo coming soon.");

});

/*=========================================
READY
=========================================*/

console.log("Profile loaded successfully.");
