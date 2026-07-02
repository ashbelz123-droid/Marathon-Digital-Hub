const db = window.supabaseClient;

let currentUser = null;

/* ==========================
SEARCH USER
========================== */

document

.getElementById("searchBtn")

.addEventListener("click", searchUser);

async function searchUser(){

    const keyword = document

    .getElementById("searchInput")

    .value

    .trim();

    if(keyword===""){

        alert("Enter name, phone or email.");

        return;

    }

    const { data, error } = await db

        .from("profiles")

        .select("*")

        .or(

            `fullname.ilike.%${keyword}%,

             phone.ilike.%${keyword}%,

             email.ilike.%${keyword}%`

        )

        .limit(1)

        .single();

    if(error || !data){

        document.getElementById("reportArea").innerHTML=

        "<div class='empty'>User not found.</div>";

        return;

    }

    currentUser = data;

    document.getElementById("reportArea").innerHTML = `

        <div class="reportCard">

            <h4>User Profile</h4>

            <div class="reportRow">

                <span class="reportLabel">

                    Full Name

                </span>

                <span class="reportValue">

                    ${data.fullname}

                </span>

            </div>

            <div class="reportRow">

                <span class="reportLabel">

                    Phone

                </span>

                <span class="reportValue">

                    ${data.phone || "-"}

                </span>

            </div>

            <div class="reportRow">

                <span class="reportLabel">

                    Email

                </span>

                <span class="reportValue">

                    ${data.email || "-"}

                </span>

            </div>

            <div class="reportRow">

                <span class="reportLabel">

                    Wallet

                </span>

                <span class="reportValue">

                    UGX ${Number(data.wallet_balance).toLocaleString()}

                </span>

            </div>

            <div class="reportRow">

                <span class="reportLabel">

                    Status

                </span>

                <span class="reportValue">

                    ${data.account_status}

                </span>

            </div>

            <button
            class="copyBtn"
            id="copyBtn">

                Copy Full Report

            </button>

        </div>

    `;

      }

/* ==========================
LOAD USER REPORT
========================== */

async function loadFullReport() {

    if (!currentUser) return;

    const userId = currentUser.id;

    const [
        deposits,
        withdrawals,
        machines,
        wallet
    ] = await Promise.all([

        db.from("deposits")
          .select("*")
          .eq("user_id", userId),

        db.from("withdrawals")
          .select("*")
          .eq("user_id", userId),

        db.from("user_machines")
          .select("*,machines(name)")
          .eq("user_id", userId),

        db.from("wallet_transactions")
          .select("*")
          .eq("user_id", userId)

    ]);

    const reportArea = document.getElementById("reportArea");

    reportArea.innerHTML += `

    <div class="reportCard">

        <h4>Summary</h4>

        <div class="reportRow">
            <span class="reportLabel">Deposits</span>
            <span class="reportValue">${deposits.data.length}</span>
        </div>

        <div class="reportRow">
            <span class="reportLabel">Withdrawals</span>
            <span class="reportValue">${withdrawals.data.length}</span>
        </div>

        <div class="reportRow">
            <span class="reportLabel">Machines</span>
            <span class="reportValue">${machines.data.length}</span>
        </div>

        <div class="reportRow">
            <span class="reportLabel">Wallet Transactions</span>
            <span class="reportValue">${wallet.data.length}</span>
        </div>

    </div>

    `;

    document.getElementById("copyBtn").onclick = function(){

        let report = "";

        report += "===== USER REPORT =====\n\n";

        report += "Name: " + currentUser.fullname + "\n";
        report += "Phone: " + (currentUser.phone || "-") + "\n";
        report += "Email: " + (currentUser.email || "-") + "\n";
        report += "Wallet: UGX " + currentUser.wallet_balance + "\n";
        report += "Status: " + currentUser.account_status + "\n\n";

        report += "Deposits: " + deposits.data.length + "\n";
        report += "Withdrawals: " + withdrawals.data.length + "\n";
        report += "Machines: " + machines.data.length + "\n";
        report += "Wallet Transactions: " + wallet.data.length + "\n";

        navigator.clipboard.writeText(report);

        alert("User report copied.");

    };

}

/* Load report after user search */

setTimeout(loadFullReport,500);
