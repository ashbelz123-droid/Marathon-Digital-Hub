/*=========================================
MARATHON DIGITAL HUB
PROFILE.JS
PART 1
=========================================*/

const db = window.supabaseClient;

let currentUser = null;
let profile = null;

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const { data: { user }, error } = await db.auth.getUser();

        if (error || !user) {
            window.location.href = "login.html";
            return;
        }

        currentUser = user;

        await loadProfile();

        hideLoader();

    } catch (err) {

        console.error(err);

        alert("Unable to load profile.");

        hideLoader();

    }

});

/*=========================================
LOAD PROFILE
=========================================*/

async function loadProfile() {

    const { data, error } = await db
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (error) {
        console.error(error);
        throw error;
    }

    profile = data;

    setText("fullName", profile.fullname || "User");
    setText("email", profile.email || "");

    setText("membershipBadge", profile.membership || "Standard");
    setText("statusBadge", profile.account_status || "Active");
    setText("kycBadge", profile.kyc_status || "Not Verified");

    setText("walletBalance",
        "UGX " + Number(profile.wallet_balance || 0).toLocaleString()
    );

    setText("phoneNumber", profile.phone || "Not Added");
    setText("emailAddress", profile.email || "Not Added");
    setText("country", profile.country || "Not Set");
    setText("gender", profile.gender || "Not Set");
    setText("dateOfBirth", profile.date_of_birth || "Not Set");
    setText("timezone", profile.timezone || "Africa/Kampala");
    setText("language", profile.language || "English");

    if (profile.created_at) {
        setText(
            "memberSince",
            new Date(profile.created_at).toLocaleDateString()
        );
    }

    if (profile.last_login) {
        setText(
            "lastLogin",
            new Date(profile.last_login).toLocaleString()
        );
    }

    setText("userLevel", profile.level || 1);

    if (profile.avatar_url) {

        const avatar = document.getElementById("profileAvatar");

        if (avatar) avatar.src = profile.avatar_url;

    }

    await loadStatistics();

      }

/*=========================================
PROFILE.JS
PART 2
Statistics + Referrals
=========================================*/

async function loadStatistics() {

    /*==============================
      USER MACHINES
    ==============================*/

    const { data: machines, error } = await db
        .from("user_machines")
        .select("*")
        .eq("user_id", currentUser.id);

    if (error) {
        console.error(error);
        return;
    }

    const activeMachines =
        machines.filter(m => m.status === "active");

    const completedMachines =
        machines.filter(m => m.completed === true);

    setText("activeMachines", activeMachines.length);

    setText("completedMachines", completedMachines.length);

    setText(
        "totalInvested",
        "UGX " + Number(profile.total_invested || 0).toLocaleString()
    );

    setText(
        "totalProfit",
        "UGX " + Number(profile.total_profit || 0).toLocaleString()
    );

    let dailyIncome = 0;

    activeMachines.forEach(machine => {

        dailyIncome += Number(machine.earned_amount || 0);

    });

    setText(
        "dailyIncome",
        "UGX " + dailyIncome.toLocaleString()
    );

    if (document.getElementById("nextProfit")) {

        const next = new Date();

        next.setHours(next.getHours() + 24);

        setText(
            "nextProfit",
            next.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
        );

    }

    /*==============================
      REFERRALS
    ==============================*/

    const { data: referrals, error: refError } = await db
        .from("referrals")
        .select("*")
        .eq("referrer_id", currentUser.id);

    if (refError) {
        console.error(refError);
        return;
    }

    setText("teamMembers", referrals.length);

    setText("totalTeam", referrals.length);

    const activeTeam =
        referrals.filter(r => r.first_machine_purchased);

    setText("activeTeam", activeTeam.length);

    setText(
        "referralBonus",
        "UGX " +
        Number(profile.total_referral_bonus || 0).toLocaleString()
    );

    setText(
        "teamInvestment",
        "UGX " +
        Number(profile.total_referral_bonus || 0).toLocaleString()
    );

    /*==============================
      REFERRAL CODE
    ==============================*/

    if (!profile.referral_code) {

        const code =
            "MDH" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

        await db
            .from("profiles")
            .update({
                referral_code: code
            })
            .eq("id", currentUser.id);

        profile.referral_code = code;

    }

    const codeInput =
        document.getElementById("referralCode");

    if (codeInput)
        codeInput.value = profile.referral_code;

    const link =
        window.location.origin +
        "/register.html?ref=" +
        profile.referral_code;

    const linkInput =
        document.getElementById("referralLink");

    if (linkInput)
        linkInput.value = link;

    /*==============================
      LOCK / UNLOCK REFERRALS
    ==============================*/

    const locked =
        document.getElementById("referralLocked");

    const content =
        document.getElementById("referralContent");

    if (activeMachines.length > 0) {

        if (locked) locked.style.display = "none";

        if (content) content.style.display = "block";

    } else {

        if (locked) locked.style.display = "block";

        if (content) content.style.display = "none";

    }

  }

/*=========================================
PROFILE.JS
PART 3
Notifications + Buttons + Loader
=========================================*/

/*==============================
LOAD NOTIFICATIONS
==============================*/

async function loadNotifications() {

    const container =
        document.getElementById("notificationContainer");

    if (!container) return;

    const { data, error } = await db
        .from("user_notifications")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) {
        console.error(error);
        return;
    }

    container.innerHTML = "";

    if (!data || data.length === 0) {

        container.innerHTML = `
        <div class="empty-box">
            <i class="fas fa-bell-slash"></i>
            <p>No notifications available.</p>
        </div>
        `;

        return;
    }

    data.forEach(item => {

        container.innerHTML += `
        <div class="notification-item">
            <h4>${item.title}</h4>
            <p>${item.message}</p>
            <small>${new Date(item.created_at).toLocaleString()}</small>
        </div>
        `;

    });

}

/*==============================
COPY REFERRAL CODE
==============================*/

document.getElementById("copyCodeBtn")?.addEventListener("click", () => {

    navigator.clipboard.writeText(profile.referral_code);

    alert("Referral code copied.");

});

/*==============================
COPY REFERRAL LINK
==============================*/

document.getElementById("copyLinkBtn")?.addEventListener("click", () => {

    navigator.clipboard.writeText(
        window.location.origin +
        "/register.html?ref=" +
        profile.referral_code
    );

    alert("Referral link copied.");

});

/*==============================
SHARE REFERRAL
==============================*/

document.getElementById("shareReferralBtn")?.addEventListener("click", async () => {

    const link =
        window.location.origin +
        "/register.html?ref=" +
        profile.referral_code;

    if (navigator.share) {

        await navigator.share({

            title: "Marathon Digital Hub",

            text: "Join Marathon Digital Hub using my referral link.",

            url: link

        });

    } else {

        navigator.clipboard.writeText(link);

        alert("Referral link copied.");

    }

});

/*==============================
BUTTONS
==============================*/

document.getElementById("depositBtn")?.onclick = () => location.href = "deposit.html";

document.getElementById("withdrawBtn")?.onclick = () => location.href = "withdraw.html";

document.getElementById("machinesBtn")?.onclick = () => location.href = "machines.html";

document.getElementById("buyMachineBtn")?.onclick = () => location.href = "machines.html";

document.getElementById("backBtn")?.onclick = () => history.back();

/*==============================
SETTINGS POPUP
==============================*/

const popup = document.getElementById("settingsPopup");

const overlay = document.getElementById("popupOverlay");

document.getElementById("settingsBtn")?.addEventListener("click", () => {

    popup?.classList.add("active");

    overlay?.classList.add("active");

});

document.getElementById("closePopup")?.addEventListener("click", () => {

    popup?.classList.remove("active");

    overlay?.classList.remove("active");

});

overlay?.addEventListener("click", () => {

    popup?.classList.remove("active");

    overlay?.classList.remove("active");

});

/*==============================
CHANGE AVATAR
==============================*/

document.getElementById("changeAvatar")?.addEventListener("click", () => {

    document.getElementById("avatarInput").click();

});

document.getElementById("avatarInput")?.addEventListener("change", () => {

    alert("Avatar upload will be connected after Storage is configured.");

});

/*==============================
LOGOUT
==============================*/

document.getElementById("logoutBtn")?.addEventListener("click", async () => {

    if (!confirm("Logout from Marathon Digital Hub?")) return;

    await db.auth.signOut();

    location.href = "login.html";

});

/*==============================
AUTO REFRESH
==============================*/

setInterval(async () => {

    if (!currentUser) return;

    await loadWallet();

    await loadStatistics();

    await loadNotifications();

}, 30000);

/*==============================
HELPER
==============================*/

function setText(id, value) {

    const el = document.getElementById(id);

    if (el) el.textContent = value;

}

/*==============================
HIDE LOADER
==============================*/

function hideLoader() {

    const loader = document.getElementById("loadingScreen");

    if (!loader) return;

    loader.style.opacity = "0";

    setTimeout(() => {

        loader.style.display = "none";

    }, 400);

}

/*==============================
INITIAL NOTIFICATIONS
==============================*/

loadNotifications();
