/*=========================================
SUPABASE
=========================================*/

const db = window.supabaseClient;

let currentUser = null;
let profile = null;

/*=========================================
START PROFILE
=========================================*/

document.addEventListener("DOMContentLoaded", async () => {

    try{

        /* Check login */

        const { data:{ user } } = await db.auth.getUser();

        if(!user){

            window.location.href = "login.html";
            return;

        }

        currentUser = user;

        /* Run mining engine first */

        if(typeof checkMiningIncome === "function"){

            await checkMiningIncome();

        }

        /* Now load the profile */

        await initializeProfile();

    }catch(error){

        console.error(error);

    }

});

/*=========================================
INITIALIZE PROFILE
=========================================*/

async function initializeProfile(){

    await Promise.all([

        loadProfile(),

        loadStatistics(),

        loadNotifications()

    ]);

}

/*=========================================
LOAD PROFILE
=========================================*/

async function loadProfile(){

    const { data, error } = await db

    .from("profiles")

    .select("*")

    .eq("id", currentUser.id)

    .single();

    if(error){

        console.log(error);
        return;

    }

    profile = data;

    document.getElementById("userName").textContent =
    "Welcome, " + (profile.fullname || "User");

    document.getElementById("fullName").textContent =
    profile.fullname || "User";

    document.getElementById("email").textContent =
    profile.email || "No Email";

    document.getElementById("walletBalance").textContent =
    "UGX " + Number(profile.wallet_balance || 0).toLocaleString();

    document.getElementById("membership").textContent =
    profile.membership || "Standard";

    document.getElementById("kycStatus").textContent =
    profile.kyc_status || "Not Verified";

    document.getElementById("accountStatus").textContent =
    profile.account_status || "Active";

    if(profile.avatar_url){

        document.getElementById("avatar").src =
        profile.avatar_url;

    }

    if(profile.account_status === "suspended" || profile.is_frozen){

        document.getElementById("suspensionCard").style.display =
        "block";

    }

      }

/*=========================================
LOAD STATISTICS
=========================================*/

async function loadStatistics(){

    /* Active Machines */

    const { data: machines } = await db
    .from("user_machines")
    .select("id")
    .eq("user_id", currentUser.id)
    .eq("status","active");

    document.getElementById("activeMachines").textContent =
    machines ? machines.length : 0;


    /* Team Members */

    const { data: team } = await db
    .from("referrals")
    .select("id")
    .eq("referrer_id", currentUser.id);

    document.getElementById("teamMembers").textContent =
    team ? team.length : 0;


    /* Referral Bonus */

    document.getElementById("referralBonus").textContent =
    "UGX " +
    Number(profile.total_referral_bonus || 0).toLocaleString();


    /* Referral Code */

    document.getElementById("referralCode").value =
    profile.referral_code || "";


    /* Referral Link */

    document.getElementById("referralLink").value =
    window.location.origin +
    "/register.html?ref=" +
    (profile.referral_code || "");

}

/*=========================================
LOAD NOTIFICATIONS
=========================================*/

async function loadNotifications(){

    const { data } = await db

    .from("user_notifications")

    .select("id")

    .eq("user_id", currentUser.id)

    .eq("is_read", false);

    const total = data ? data.length : 0;

    document.getElementById("notifyCount").textContent = total;

    document.getElementById("notificationCount").textContent = total;

}

/*=========================================
AUTO REFRESH
=========================================*/

setInterval(async()=>{

    if(!currentUser) return;

    await loadProfile();

    await loadStatistics();

    await loadNotifications();

},30000);

/*=========================================
COPY REFERRAL CODE
=========================================*/

document.getElementById("copyReferral").onclick = async () => {

    const input = document.getElementById("referralCode");

    await navigator.clipboard.writeText(input.value);

    alert("Referral code copied.");

};

/*=========================================
SHARE REFERRAL LINK
=========================================*/

document.getElementById("shareReferral").onclick = async () => {

    const link = document.getElementById("referralLink").value;

    if (navigator.share) {

        navigator.share({

            title: "Marathon Digital Hub",

            text: "Join my Marathon Digital Hub team.",

            url: link

        });

    } else {

        await navigator.clipboard.writeText(link);

        alert("Referral link copied.");

    }

};

/*=========================================
PROFILE PHOTO UPLOAD
=========================================*/

document.getElementById("changePhoto").onclick = () => {

    document.getElementById("photoInput").click();

};

document.getElementById("photoInput").addEventListener("change", uploadPhoto);

async function uploadPhoto(e){

    const file = e.target.files[0];

    if(!file) return;

    const fileName = currentUser.id + "-" + Date.now();

    const { error: uploadError } = await db.storage

        .from("machine-images")

        .upload(fileName, file, {

            upsert:true

        });

    if(uploadError){

        alert(uploadError.message);

        return;

    }

    const {

        data

    } = db.storage

    .from("machine-images")

    .getPublicUrl(fileName);

    const imageUrl = data.publicUrl;

    await db

    .from("profiles")

    .update({

        avatar_url:imageUrl

    })

    .eq("id", currentUser.id);

    document.getElementById("avatar").src = imageUrl;

}

/*=========================================
POPUP CONTENT
=========================================*/

const pages = {

about:{

title:"About Marathon Digital Hub",

content:`

<p>Marathon Digital Hub is a digital mining platform that allows members to purchase mining machines, earn daily mining rewards, grow teams through referrals and manage investments securely.</p>

`

},

faq:{

title:"Frequently Asked Questions",

content:`

<p><b>How do I start?</b><br>Deposit funds then purchase a mining machine.</p>

<br>

<p><b>How do I withdraw?</b><br>Submit a withdrawal request. The admin reviews and processes it manually.</p>

`

},

terms:{

title:"Terms & Conditions",

content:`

<p>Users must follow platform rules. Fraud, abuse or multiple fake accounts may result in account suspension.</p>

`

},

privacy:{

title:"Privacy Policy",

content:`

<p>Your information is stored securely and is only used to operate your Marathon Digital Hub account.</p>

`

}

};

/*=========================================
POPUP
=========================================*/

function openPopup(page){

    document.getElementById("popupTitle").innerHTML = pages[page].title;

    document.getElementById("popupContent").innerHTML = pages[page].content;

    document.getElementById("popupOverlay").style.display = "flex";

}

document.getElementById("aboutBtn").onclick = ()=>openPopup("about");

document.getElementById("faqBtn").onclick = ()=>openPopup("faq");

document.getElementById("termsBtn").onclick = ()=>openPopup("terms");

document.getElementById("privacyBtn").onclick = ()=>openPopup("privacy");

document.getElementById("closePopup").onclick = ()=>{

    document.getElementById("popupOverlay").style.display="none";

};

/*=========================================
LOGOUT
=========================================*/

document.getElementById("logoutBtn").onclick = async ()=>{

    await db.auth.signOut();

    window.location.href="login.html";

};
