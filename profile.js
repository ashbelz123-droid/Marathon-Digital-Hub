// ======================================
// Marathon Digital Hub
// Profile Page
// Part 1
// ======================================

const supabase = window.supabaseClient;

// -------------------------------
// Check Authentication
// -------------------------------

async function getCurrentUser() {

    const {

        data: { user },

        error

    } = await supabase.auth.getUser();

    if (error || !user) {

        window.location.href = "login.html";

        return null;

    }

    return user;

}

// -------------------------------
// Load Profile
// -------------------------------

async function loadProfile() {

    const user = await getCurrentUser();

    if (!user) return;

    const { data, error } = await supabase

        .from("profiles")

        .select("*")

        .eq("id", user.id)

        .single();

    if (error) {

        console.error(error);

        return;

    }

    // -------------------
    // Profile Information
    // -------------------

    document.getElementById("fullName").textContent =
        data.fullname || "Member";

    document.getElementById("email").textContent =
        data.email || "";

    document.getElementById("membershipBadge").textContent =
        data.membership || "Standard";

    document.getElementById("kycBadge").textContent =
        data.kyc_status || "Not Verified";

    // -------------------
    // Status
    // -------------------

    const statusBadge =
        document.getElementById("statusBadge");

    statusBadge.textContent =
        data.account_status || "Active";

    if (data.is_frozen) {

        statusBadge.textContent = "Suspended";

        statusBadge.classList.add("suspended");

        document
            .getElementById("suspensionBanner")
            .classList.remove("hidden");

        document
            .getElementById("suspensionReason")
            .textContent =
            data.suspension_reason ||
            "Suspicious activities that may violate Marathon Digital Hub policies have been detected. Your account has been temporarily suspended while under review. Please contact support for assistance.";

    }

    // -------------------
    // Avatar
    // -------------------

    document.getElementById("profileImage").src =
        data.avatar_url ||
        "https://placehold.co/200x200/png";

    // -------------------
    // Referral
    // -------------------

    document.getElementById("referralCode").value =
        data.referral_code || "";

    document.getElementById("referralLink").value =
        window.location.origin +
        "/register.html?ref=" +
        (data.referral_code || "");

}

document.addEventListener("DOMContentLoaded", () => {

    loadProfile();

});

// ======================================
// Load Statistics
// ======================================

async function loadStatistics() {

    const user = await getCurrentUser();

    if (!user) return;

    // -----------------------------
    // Active Machines
    // -----------------------------

    const { count: activeMachines } = await supabase
        .from("user_machines")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");

    document.getElementById("activeMachines").textContent =
        activeMachines || 0;

    // -----------------------------
    // Team Members
    // -----------------------------

    const { count: teamMembers } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user.id);

    document.getElementById("teamMembers").textContent =
        teamMembers || 0;

    // -----------------------------
    // Active Referrals
    // -----------------------------

    const { count: activeReferrals } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user.id)
        .eq("first_deposit_completed", true)
        .eq("first_machine_purchased", true);

    document.getElementById("activeReferrals").textContent =
        activeReferrals || 0;

    // -----------------------------
    // Referral Bonus
    // -----------------------------

    const { data: profile } = await supabase
        .from("profiles")
        .select("total_referral_bonus")
        .eq("id", user.id)
        .single();

    document.getElementById("referralBonus").textContent =
        "UGX " +
        Number(profile?.total_referral_bonus || 0)
        .toLocaleString();

    // -----------------------------
    // Profile Completion
    // -----------------------------

    const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    let completed = 0;

    if (userProfile.fullname) completed++;
    if (userProfile.email) completed++;
    if (userProfile.phone) completed++;
    if (userProfile.country) completed++;
    if (userProfile.gender) completed++;
    if (userProfile.date_of_birth) completed++;
    if (userProfile.avatar_url) completed++;

    const percent = Math.round((completed / 7) * 100);

    document.getElementById("profilePercent").textContent =
        percent + "%";

    document.getElementById("profileProgress").style.width =
        percent + "%";

    // -----------------------------
    // Automatic KYC Progress
    // -----------------------------

    document.getElementById("kycProgressText").textContent =
        `${activeReferrals || 0} / 10`;

    const kycWidth =
        Math.min((activeReferrals || 0) * 10, 100);

    document.getElementById("kycProgress").style.width =
        kycWidth + "%";

    if ((activeReferrals || 0) >= 10) {

        document.getElementById("kycStatusText").textContent =
            "Verified";

    } else {

        document.getElementById("kycStatusText").textContent =
            "In Progress";

    }

}

// ======================================
// Load Purchased Machines
// ======================================

async function loadPurchasedMachines() {

    const user = await getCurrentUser();

    if (!user) return;

    const { data, error } = await supabase

        .from("user_machines")

        .select("*")

        .eq("user_id", user.id)

        .order("purchase_date", { ascending: false })

        .limit(3);

    if (error) {

        console.error(error);

        return;

    }

    const container =
        document.getElementById("machineList");

    container.innerHTML = "";

    if (!data.length) {

        container.innerHTML = `

        <div class="empty-card">

            No purchased machines yet.

        </div>

        `;

        return;

    }

    data.forEach(machine => {

        container.innerHTML += `

        <div class="machine-card">

            <div>

                <h4>${machine.machine_name}</h4>

                <small>${machine.status}</small>

            </div>

            <strong>

                UGX ${Number(machine.amount_paid)
                .toLocaleString()}

            </strong>

        </div>

        `;

    });

}

document.addEventListener("DOMContentLoaded", () => {

    loadStatistics();

    loadPurchasedMachines();

});

// ======================================
// Marathon Digital Hub
// Profile Page
// Part 3
// ======================================

// ---------- Copy Referral Code ----------

document.getElementById("copyCodeBtn").onclick = () => {

    navigator.clipboard.writeText(
        document.getElementById("referralCode").value
    );

    alert("Referral code copied.");

};

// ---------- Copy Referral Link ----------

document.getElementById("copyLinkBtn").onclick = () => {

    navigator.clipboard.writeText(
        document.getElementById("referralLink").value
    );

    alert("Referral link copied.");

};

// ---------- WhatsApp Share ----------

document.getElementById("shareWhatsappBtn").onclick = () => {

    const link =
        document.getElementById("referralLink").value;

    const text =
`Join Marathon Digital Hub using my referral link and start earning today.

${link}`;

    window.open(

        "https://wa.me/?text=" +

        encodeURIComponent(text),

        "_blank"

    );

};

// ======================================
// Settings Bottom Sheet
// ======================================

const settingsModal =
document.getElementById("settingsModal");

const overlay =
document.getElementById("overlay");

document.getElementById("settingsBtn").onclick = () => {

    settingsModal.classList.add("show");

    overlay.classList.add("show");

};

overlay.onclick = () => {

    settingsModal.classList.remove("show");

    overlay.classList.remove("show");

};

// ======================================
// Change Profile Picture
// ======================================

document.getElementById("changePhotoBtn").onclick = () => {

    document.getElementById("photoInput").click();

};

document.getElementById("changePhotoMenuBtn").onclick = () => {

    document.getElementById("photoInput").click();

};

document.getElementById("photoInput").addEventListener(

"change",

async function () {

    const file = this.files[0];

    if (!file) return;

    const user = await getCurrentUser();

    if (!user) return;

    const fileName =
        `${user.id}-${Date.now()}`;

    const { error: uploadError } =
    await supabase.storage

        .from("machine-images")

        .upload(fileName, file, {

            upsert: true

        });

    if (uploadError) {

        alert(uploadError.message);

        return;

    }

    const {

        data: publicData

    } = supabase.storage

        .from("machine-images")

        .getPublicUrl(fileName);

    await supabase

        .from("profiles")

        .update({

            avatar_url:

            publicData.publicUrl

        })

        .eq("id", user.id);

    document.getElementById("profileImage").src =
        publicData.publicUrl;

}

// ======================================
// Notifications
// ======================================

async function loadNotifications(){

    const user = await getCurrentUser();

    if(!user) return;

    const { data } = await supabase

    .from("user_notifications")

    .select("*")

    .eq("user_id",user.id)

    .eq("is_read",false);

    document.getElementById("notificationCount").textContent =
    data ? data.length : 0;

}

loadNotifications();

// ======================================
// Logout
// ======================================

document.getElementById("logoutMenuBtn").onclick =
async()=>{

    await supabase.auth.signOut();

    window.location.href="login.html";

};

// ======================================
// About Marathon Digital Hub
// ======================================

document.getElementById("aboutMenuBtn").onclick=()=>{

alert(`Marathon Digital Hub

• About Us

Marathon Digital Hub is a digital investment platform designed to provide members with secure mining investment opportunities, referral rewards and transparent earnings.

• FAQ

Visit the FAQ section inside the website for common questions.

• Terms & Conditions

Using Marathon Digital Hub means you agree to follow all platform rules and policies.

• Privacy Policy

Your personal information is protected and used only for operating your account securely.`);

};

// ======================================
// Support
// ======================================

document.getElementById("supportMenuBtn").onclick=()=>{

window.location.href="support.html";

};

// ======================================
// Edit Profile
// ======================================

document.getElementById("editProfileBtn").onclick=()=>{

window.location.href="edit-profile.html";

};

// ======================================
// Change Password
// ======================================

document.getElementById("changePasswordMenuBtn").onclick=()=>{

window.location.href="change-password.html";

};

console.log(
"Marathon Digital Hub Profile Loaded Successfully"
);
