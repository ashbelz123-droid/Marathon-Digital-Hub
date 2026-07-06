/* ==========================================
   MARATHON DIGITAL HUB
   DEPOSIT.JS
========================================== */

const db = window.supabaseClient;

let currentUser = null;
let profile = null;
let selectedMethod = "MTN";

/* ==========================================
   START
========================================== */

document.addEventListener("DOMContentLoaded", async () => {

    const { data: { user }, error } = await db.auth.getUser();

    if (error) {
        console.log(error);
        return;
    }

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    await loadProfile();
    await loadPaymentAccounts();
    await loadLatestDeposit();
    await loadDepositHistory();

});

/* ==========================================
   LOAD USER PROFILE
========================================== */

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

    document.getElementById("walletBalance").textContent =
        "UGX " + Number(profile.wallet_balance || 0).toLocaleString();

}

/* ==========================================
   LOAD PAYMENT ACCOUNTS
========================================== */

async function loadPaymentAccounts() {

    const { data, error } = await db
        .from("payment_settings")
        .select("*")
        .eq("is_active", true);

    if (error) {
        console.log(error);
        return;
    }

    data.forEach(account => {

        if (account.method.toLowerCase() === "mtn") {

            document.getElementById("mtnName").textContent =
                account.account_name;

            document.getElementById("mtnNumber").textContent =
                account.phone_number;

        }

        if (account.method.toLowerCase() === "airtel") {

            document.getElementById("airtelName").textContent =
                account.account_name;

            document.getElementById("airtelNumber").textContent =
                account.phone_number;

        }

    });

                          }

/* ==========================================
   COPY PAYMENT NUMBERS
========================================== */

document.getElementById("copyMTN").onclick = async () => {

    const number = document.getElementById("mtnNumber").textContent;

    if(number === "Loading..." || number === ""){
        alert("MTN number not available.");
        return;
    }

    await navigator.clipboard.writeText(number);

    alert("MTN number copied successfully.");

};

document.getElementById("copyAirtel").onclick = async () => {

    const number = document.getElementById("airtelNumber").textContent;

    if(number === "Loading..." || number === ""){
        alert("Airtel number not available.");
        return;
    }

    await navigator.clipboard.writeText(number);

    alert("Airtel number copied successfully.");

};

/* ==========================================
   PAYMENT METHOD
========================================== */

document.getElementById("mtnMethod").onclick = () => {

    selectedMethod = "MTN";

    document.getElementById("mtnMethod").classList.add("active");
    document.getElementById("airtelMethod").classList.remove("active");

};

document.getElementById("airtelMethod").onclick = () => {

    selectedMethod = "Airtel";

    document.getElementById("airtelMethod").classList.add("active");
    document.getElementById("mtnMethod").classList.remove("active");

};

/* ==========================================
   SUBMIT DEPOSIT
========================================== */

document.getElementById("submitDeposit").onclick = async () => {

    const amount = Number(document.getElementById("depositAmount").value);

    const transactionId = document
        .getElementById("transactionId")
        .value
        .trim();

    if(amount <= 0){

        alert("Please enter a valid deposit amount.");

        return;

    }

    if(transactionId === ""){

        alert("Please enter the Transaction ID.");

        return;

    }

    const btn = document.getElementById("submitDeposit");

    btn.disabled = true;
    btn.innerHTML = "Submitting...";

    const { error } = await db
        .from("deposits")
        .insert({

            user_id: currentUser.id,
            amount: amount,
            method: selectedMethod,
            transaction_id: transactionId,
            status: "pending",
            payment_message: transactionId,
            user_message: "Deposit submitted successfully."

        });

    if(error){

        btn.disabled = false;
        btn.innerHTML = "Submit Deposit Request";

        alert(error.message);

        return;

    }

    /* Continue in Part 3 */

       /* ==========================================
       CREATE ADMIN NOTIFICATION
    ========================================== */

    await db
        .from("admin_notifications")
        .insert({

            title: "New Deposit Request",

            message:
                profile.fullname +
                " submitted a " +
                selectedMethod +
                " deposit of UGX " +
                amount.toLocaleString(),

            type: "deposit",

            is_read: false,

            created_at: new Date().toISOString()

        });

    /* ==========================================
       RESET FORM
    ========================================== */

    document.getElementById("depositAmount").value = "";
    document.getElementById("transactionId").value = "";

    btn.disabled = false;
    btn.innerHTML = "Submit Deposit Request";

    alert("Deposit request submitted successfully.");

    await loadLatestDeposit();
    await loadDepositHistory();

};

/* ==========================================
   LOAD LATEST DEPOSIT
========================================== */

async function loadLatestDeposit(){

    const { data, error } = await db
        .from("deposits")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending:false })
        .limit(1);

    if(error){

        console.log(error);
        return;

    }

    if(!data || data.length===0) return;

    const deposit = data[0];

    document.getElementById("latestStatus").textContent =
        deposit.status.toUpperCase();

    document.getElementById("latestAmount").textContent =
        "UGX " + Number(deposit.amount).toLocaleString();

    document.getElementById("latestMethod").textContent =
        deposit.method;

    document.getElementById("latestTransaction").textContent =
        deposit.transaction_id;

    document.getElementById("latestTime").textContent =
        new Date(deposit.created_at).toLocaleString();

}

/* ==========================================
   LOAD DEPOSIT HISTORY
========================================== */

async function loadDepositHistory(){

    const { data, error } = await db
        .from("deposits")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending:false });

    if(error){

        console.log(error);
        return;

    }

    const history = document.getElementById("depositHistory");

    history.innerHTML = "";

    if(!data || data.length===0){

        history.innerHTML =
        "<div class='history-empty'>No deposit history.</div>";

        return;

    }

    data.forEach(item=>{

        history.innerHTML += `

        <div class="history-item">

            <h4>UGX ${Number(item.amount).toLocaleString()}</h4>

            <p><strong>Status:</strong> ${item.status}</p>

            <p><strong>Method:</strong> ${item.method}</p>

            <p><strong>Transaction ID:</strong> ${item.transaction_id}</p>

            <p>${new Date(item.created_at).toLocaleString()}</p>

        </div>

        `;

    });

           }
