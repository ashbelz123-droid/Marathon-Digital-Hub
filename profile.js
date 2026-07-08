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

        const { data: { user } } = await db.auth.getUser();

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        currentUser = user;

        await loadProfile();
        await loadWallet();
        await loadStats();
        await loadPersonalInformation();
        await loadNotifications();

        hideLoader();

    } catch (err) {

        console.error(err);
        alert("Unable to load profile.");

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
        console.log(error);
        return;
    }

    profile = data;

    /* Profile Card */

    document.getElementById("fullName").textContent =
        data.fullname || "User";

    document.getElementById("email").textContent =
        data.email || "";

    document.getElementById("membershipBadge").textContent =
        data.membership || "STANDARD";

    document.getElementById("statusBadge").textContent =
        data.account_status || "ACTIVE";

    document.getElementById("kycBadge").textContent =
        data.kyc_status || "NOT VERIFIED";

    document.getElementById("userLevel").textContent =
        data.level || 1;

    /* Avatar */

    if (data.avatar_url) {

        document.getElementById("profileAvatar").src =
            data.avatar_url;

    }

}

/*=========================================
LOAD WALLET
=========================================*/

async function loadWallet() {

    document.getElementById("walletBalance").textContent =
        "UGX " +
        Number(profile.wallet_balance || 0).toLocaleString();

}

/*=========================================
LOAD PERSONAL INFORMATION
=========================================*/

async function loadPersonalInformation() {

    document.getElementById("phoneNumber").textContent =
        profile.phone || "Not Added";

    document.getElementById("emailAddress").textContent =
        profile.email || "-";

    document.getElementById("country").textContent =
        profile.country || "Not Set";

    document.getElementById("gender").textContent =
        profile.gender || "Not Set";

    document.getElementById("dateOfBirth").textContent =
        profile.date_of_birth || "Not Set";

    document.getElementById("timezone").textContent =
        profile.timezone || "Africa/Kampala";

    document.getElementById("language").textContent =
        profile.language || "English";

    document.getElementById("memberSince").textContent =
        new Date(profile.created_at).toLocaleDateString();

    document.getElementById("lastLogin").textContent =
        profile.last_login
            ? new Date(profile.last_login).toLocaleString()
            : "Never";

            }

/*=========================================
MARATHON DIGITAL HUB
PROFILE.JS
PART 2
=========================================*/

/*=========================================
LOAD USER STATISTICS
=========================================*/

async function loadStats() {

    /* Active Machines */

    const { data: machines, error } = await db
        .from("user_machines")
        .select("*")
        .eq("user_id", currentUser.id);

    if (error) {
        console.log(error);
        return;
    }

    const activeMachines = machines.filter(m => m.status === "active");
    const completedMachines = machines.filter(m => m.completed === true);

    document.getElementById("activeMachines").textContent =
        activeMachines.length;

    document.getElementById("completedMachines").textContent =
        completedMachines.length;

    /* Investment */

    document.getElementById("totalInvested").textContent =
        "UGX " +
        Number(profile.total_invested || 0).toLocaleString();

    document.getElementById("totalProfit").textContent =
        "UGX " +
        Number(profile.total_profit || 0).toLocaleString();

    /* Daily Income */

    let dailyIncome = 0;

    activeMachines.forEach(machine => {

        dailyIncome += Number(machine.earned_amount || 0);

    });

    document.getElementById("dailyIncome").textContent =
        "UGX " +
        dailyIncome.toLocaleString();

    /* Next Profit */

    const nextProfit = new Date();

    nextProfit.setHours(nextProfit.getHours() + 24);

    document.getElementById("nextProfit").textContent =
        nextProfit.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    await loadReferral();

}

/*=========================================
LOAD REFERRAL
=========================================*/

async function loadReferral() {

    const { data: referrals, error } = await db
        .from("referrals")
        .select("*")
        .eq("referrer_id", currentUser.id);

    if (error) {
        console.log(error);
        return;
    }

    document.getElementById("teamMembers").textContent =
        referrals.length;

    document.getElementById("totalTeam").textContent =
        referrals.length;

    const activeTeam =
        referrals.filter(item => item.first_machine_purchased);

    document.getElementById("activeTeam").textContent =
        activeTeam.length;

    document.getElementById("referralBonus").textContent =
        "UGX " +
        Number(profile.total_referral_bonus || 0).toLocaleString();

    document.getElementById("teamInvestment").textContent =
        "UGX " +
        Number(profile.total_referral_bonus || 0).toLocaleString();

    /* Generate Referral Code */

    if (!profile.referral_code) {

        const referralCode =
            "MDH" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

        await db
            .from("profiles")
            .update({
                referral_code: referralCode
            })
            .eq("id", currentUser.id);

        profile.referral_code = referralCode;

    }

    document.getElementById("referralCode").value =
        profile.referral_code;

    document.getElementById("referralLink").value =
        window.location.origin +
        "/register.html?ref=" +
        profile.referral_code;

    /* Lock / Unlock Referral */

    if (activeMachinesExist(machines)) {

        document.getElementById("referralLocked").style.display = "none";
        document.getElementById("referralContent").style.display = "block";

    } else {

        document.getElementById("referralLocked").style.display = "block";
        document.getElementById("referralContent").style.display = "none";

    }

}

/*=========================================
CHECK ACTIVE MACHINE
=========================================*/

function activeMachinesExist(machineList) {

    return machineList.some(machine =>
        machine.status === "active"
    );

}

/*=========================================
MARATHON DIGITAL HUB
PROFILE.JS
PART 3
=========================================*/

/*=========================================
LOAD NOTIFICATIONS
=========================================*/

async function loadNotifications() {

    const { data, error } = await db
        .from("user_notifications")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) {
        console.log(error);
        return;
    }

    const container =
        document.getElementById("notificationContainer");

    if (!container) return;

    container.innerHTML = "";

    if (data.length === 0) {

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
        <div class="info-item">
            <span>${item.title}</span>
            <strong>${item.message}</strong>
        </div>
        `;

    });

}

/*=========================================
COPY REFERRAL CODE
=========================================*/

document.getElementById("copyCodeBtn")
?.addEventListener("click", async () => {

    await navigator.clipboard.writeText(
        profile.referral_code
    );

    alert("Referral code copied.");

});

/*=========================================
COPY REFERRAL LINK
=========================================*/

document.getElementById("copyLinkBtn")
?.addEventListener("click", async () => {

    await navigator.clipboard.writeText(
        document.getElementById("referralLink").value
    );

    alert("Referral link copied.");

});

/*=========================================
SHARE REFERRAL
=========================================*/

document.getElementById("shareReferralBtn")
?.addEventListener("click", async () => {

    const link =
        document.getElementById("referralLink").value;

    if (navigator.share) {

        await navigator.share({

            title: "Marathon Digital Hub",

            text: "Join Marathon Digital Hub using my referral link.",

            url: link

        });

    } else {

        await navigator.clipboard.writeText(link);

        alert("Referral link copied.");

    }

});

/*=========================================
BUTTON NAVIGATION
=========================================*/

document.getElementById("depositBtn")
?.addEventListener("click", () => {

    location.href = "deposit.html";

});

document.getElementById("withdrawBtn")
?.addEventListener("click", () => {

    location.href = "withdraw.html";

});

document.getElementById("machinesBtn")
?.addEventListener("click", () => {

    location.href = "machines.html";

});

document.getElementById("buyMachineBtn")
?.addEventListener("click", () => {

    location.href = "machines.html";

});

document.getElementById("backBtn")
?.addEventListener("click", () => {

    history.back();

});

/*=========================================
SETTINGS POPUP
=========================================*/

const popup =
document.getElementById("settingsPopup");

const overlay =
document.getElementById("popupOverlay");

document.getElementById("settingsBtn")
?.addEventListener("click", () => {

    popup.classList.add("active");
    overlay.classList.add("active");

});

document.getElementById("closePopup")
?.addEventListener("click", () => {

    popup.classList.remove("active");
    overlay.classList.remove("active");

});

overlay?.addEventListener("click", () => {

    popup.classList.remove("active");
    overlay.classList.remove("active");

});

/*=========================================
CHANGE AVATAR
=========================================*/

document.getElementById("changeAvatar")
?.addEventListener("click", () => {

    document.getElementById("avatarInput").click();

});

document.getElementById("avatarInput")
?.addEventListener("change", () => {

    alert("Avatar upload will be connected after Storage is configured.");

});

/*=========================================
LOGOUT
=========================================*/

document.getElementById("logoutBtn")
?.addEventListener("click", async () => {

    if (!confirm("Logout from Marathon Digital Hub?"))
        return;

    await db.auth.signOut();

    location.href = "login.html";

});

/*=========================================
AUTO REFRESH
=========================================*/

setInterval(async () => {

    if (!currentUser) return;

    await loadWallet();
    await loadStats();
    await loadNotifications();

}, 30000);

/*=========================================
HIDE LOADER
=========================================*/

function hideLoader() {

    const loader =
        document.getElementById("loadingScreen");

    if (!loader) return;

    setTimeout(() => {

        loader.style.display = "none";

    }, 500);

}

/*=========================================
INITIALIZE REMAINING DATA
=========================================*/

loadNotifications();
