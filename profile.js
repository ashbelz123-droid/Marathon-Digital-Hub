/*=========================================
MARATHON DIGITAL HUB
PROFILE.JS
PART 1
=========================================*/

const db = window.supabaseClient;

let currentUser = null;
let profile = null;

/*==============================
START
==============================*/

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const { data: { user }, error } = await db.auth.getUser();

        if (error || !user) {

            location.href = "login.html";
            return;

        }

        currentUser = user;

        await loadProfile();

    } catch (err) {

        console.error("Profile Error:", err);

        alert("Unable to load your profile.");

    }

});

/*==============================
LOAD PROFILE
==============================*/

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

    /* Profile */

    setText("fullName", profile.fullname);

    setText("email", profile.email);

    setText("membershipBadge", profile.membership || "Standard");

    setText("kycBadge", profile.kyc_status || "Not Verified");

    /* Wallet */

    setText(

        "walletBalance",

        "UGX " +

        Number(profile.wallet_balance || 0)

        .toLocaleString()

    );

    /* Avatar */

    if (

        profile.avatar_url &&

        document.getElementById("profileAvatar")

    ) {

        document.getElementById("profileAvatar").src =

        profile.avatar_url;

    }

    await loadStatistics();

}

/*==============================
HELPER
==============================*/

function setText(id, value) {

    const el = document.getElementById(id);

    if (el) {

        el.textContent = value;

    }

}

/*=========================================
PROFILE.JS
PART 2
Statistics + Referrals
=========================================*/

async function loadStatistics() {

    /*==============================
    ACTIVE MACHINES
    ==============================*/

    const { data: machines, error } = await db

        .from("user_machines")

        .select("*")

        .eq("user_id", currentUser.id)

        .eq("status", "active");

    if (error) {

        console.error(error);
        return;

    }

    setText("activeMachines", machines.length);

    /*==============================
    INVESTMENT
    ==============================*/

    setText(

        "totalInvested",

        "UGX " +

        Number(profile.total_invested || 0)

        .toLocaleString()

    );

    setText(

        "totalProfit",

        "UGX " +

        Number(profile.total_profit || 0)

        .toLocaleString()

    );

    /*==============================
    TEAM MEMBERS
    ==============================*/

    const { data: team, error: teamError } = await db

        .from("referrals")

        .select("*")

        .eq("referrer_id", currentUser.id);

    if (teamError) {

        console.error(teamError);
        return;

    }

    setText("teamMembers", team.length);

    setText("totalTeam", team.length);

    const activeTeam = team.filter(

        member => member.first_machine_purchased

    );

    setText("activeTeam", activeTeam.length);

    setText(

        "referralBonus",

        "UGX " +

        Number(profile.total_referral_bonus || 0)

        .toLocaleString()

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

    const referralCode =

        document.getElementById("referralCode");

    if (referralCode) {

        referralCode.value = profile.referral_code;

    }

    const referralLink =

        window.location.origin +

        "/register.html?ref=" +

        profile.referral_code;

    const referralInput =

        document.getElementById("referralLink");

    if (referralInput) {

        referralInput.value = referralLink;

    }

            }

/*=========================================
PROFILE.JS
PART 3
Buttons + Logout
=========================================*/

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

    const link =
        window.location.origin +
        "/register.html?ref=" +
        profile.referral_code;

    navigator.clipboard.writeText(link);

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

document.getElementById("depositBtn")?.addEventListener("click", () => {

    location.href = "deposit.html";

});

document.getElementById("withdrawBtn")?.addEventListener("click", () => {

    location.href = "withdraw.html";

});

document.getElementById("machinesBtn")?.addEventListener("click", () => {

    location.href = "machines.html";

});

/*==============================
LOGOUT
==============================*/

document.getElementById("logoutBtn")?.addEventListener("click", async () => {

    const ok = confirm("Logout from Marathon Digital Hub?");

    if (!ok) return;

    await db.auth.signOut();

    location.href = "login.html";

});

/*==============================
AUTO REFRESH
==============================*/

setInterval(async () => {

    if (!currentUser) return;

    await loadProfile();

}, 30000);
