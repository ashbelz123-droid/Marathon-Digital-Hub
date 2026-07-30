/*=========================================
SUPABASE
=========================================*/

const db = window.supabaseClient;

let currentUser = null;
let profile = null;

let machines = [];
let currentSeries = "ALL";

/*=========================================
START PAGE
=========================================*/

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const { data: { user } } = await db.auth.getUser();

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        currentUser = user;

        await initializePage();

    } catch (error) {

        console.error(error);

        document.getElementById("machines").innerHTML = `
            <div class="empty-state">
                <h3>Unable to Load</h3>
                <p>Please refresh the page.</p>
            </div>
        `;
    }

});

/*=========================================
INITIALIZE
=========================================*/

async function initializePage() {

    await Promise.all([
        loadProfile(),
        loadMachines()
    ]);

}

/*=========================================
LOAD PROFILE
=========================================*/

async function loadProfile() {

    const { data, error } = await db
        .from("profiles")
        .select("wallet_balance")
        .eq("id", currentUser.id)
        .single();

    if (error) {
        console.log(error);
        return;
    }

    profile = data;

}

/*=========================================
SHOW LOADING
=========================================*/

function showLoading() {

    document.getElementById("machines").innerHTML = `
        <div class="loading">
            Loading Machines...
        </div>
    `;

}

/*=========================================
LOAD MACHINES
=========================================*/

async function loadMachines() {

    showLoading();

    const { data, error } = await db
        .from("machines")
        .select("*")
        .eq("status", true)
        .order("display_order", { ascending: true })
        .order("price", { ascending: true });

    if (error) {

        console.log(error);

        document.getElementById("machines").innerHTML = `
            <div class="empty-state">
                <h3>Failed to Load</h3>
                <p>Unable to fetch machines.</p>
            </div>
        `;

        return;

    }

    machines = data || [];

    buildSeriesTabs();

    renderMachines();

}

/*=========================================
BUILD SERIES TABS
=========================================*/

function buildSeriesTabs() {

    const tabs = document.getElementById("seriesTabs");

    tabs.innerHTML = "";

    /* ALL */

    const allBtn = document.createElement("button");

    allBtn.className = "tab active";

    allBtn.textContent = "All";

    allBtn.onclick = () => {

        currentSeries = "ALL";

        updateActiveTab(allBtn);

        renderMachines();

    };

    tabs.appendChild(allBtn);

    /* UNIQUE SERIES */

    const seriesList = [];

    machines.forEach(machine => {

        const series = machine.series || "General";

        if (!seriesList.includes(series)) {

            seriesList.push(series);

        }

    });

    /* CREATE BUTTONS */

    seriesList.forEach(series => {

        const btn = document.createElement("button");

        btn.className = "tab";

        btn.textContent = series;

        btn.onclick = () => {

            currentSeries = series;

            updateActiveTab(btn);

            renderMachines();

        };

        tabs.appendChild(btn);

    });

}

/*=========================================
ACTIVE TAB
=========================================*/

function updateActiveTab(button) {

    document.querySelectorAll(".tab").forEach(tab => {

        tab.classList.remove("active");

    });

    button.classList.add("active");

                                         }

/*=========================================
RENDER MACHINES
=========================================*/

async function renderMachines() {

    const container = document.getElementById("machines");

    container.innerHTML = "";

    let list = [];

    if (currentSeries === "ALL") {

        list = machines;

    } else {

        list = machines.filter(machine =>
            (machine.series || "General") === currentSeries
        );

    }

    if (list.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No Machines Found</h3>
                <p>No machines are available in this series.</p>
            </div>
        `;

        return;

    }

    for (const machine of list) {

        const { data: owned } = await db
            .from("user_machines")
            .select("id")
            .eq("user_id", currentUser.id)
            .eq("machine_id", machine.id);

        const purchased = owned && owned.length > 0;

        const image = machine.image_url && machine.image_url !== ""
            ? machine.image_url
            : "images/default-machine.png";

        container.innerHTML += `

        <div class="machine-card">

            <div class="machine-top">

                <img
                    class="machine-image"
                    src="${image}"
                    onerror="this.src='images/default-machine.png'">

                <div class="machine-info">

                    <div class="machine-name">
                        ${machine.name}
                    </div>

                    <div class="machine-series">
                        ${machine.series || "General"}
                    </div>

                    <div class="machine-row">
                        <span>Price</span>
                        <strong>
                            UGX ${Number(machine.price).toLocaleString()}
                        </strong>
                    </div>

                    <div class="machine-row">
                        <span>Total Return</span>
                        <strong>
                            UGX ${Number(machine.total_return).toLocaleString()}
                        </strong>
                    </div>

                    <div class="machine-row">
                        <span>Duration</span>
                        <strong>
                            ${machine.duration_days} Days
                        </strong>
                    </div>

                </div>

            </div>

            <button
                class="buy-btn"
                ${purchased ? "disabled" : ""}
                onclick="buyMachine('${machine.id}')">

                ${purchased ? "PURCHASED ✓" : "BUY MACHINE"}

            </button>

        </div>

        `;

    }

          }

/*=========================================
BUY MACHINE
=========================================*/

async function buyMachine(machineId) {

    try {

        /* Get Machine */

        const { data: machine, error: machineError } = await db
            .from("machines")
            .select("*")
            .eq("id", machineId)
            .single();

        if (machineError || !machine) {

            alert("Machine not found.");
            return;

        }

        /* Reload Wallet */

        const { data: walletData, error: walletError } = await db
            .from("profiles")
            .select("wallet_balance")
            .eq("id", currentUser.id)
            .single();

        if (walletError) {

            alert("Unable to load wallet.");
            return;

        }

        const wallet = Number(walletData.wallet_balance);
        const price = Number(machine.price);

        /* Wallet Check */

        if (wallet < price) {

            alert("Insufficient wallet balance.");
            return;

        }

        /* Already Purchased */

        const { data: existing } = await db
            .from("user_machines")
            .select("id")
            .eq("user_id", currentUser.id)
            .eq("machine_id", machine.id);

        if (existing && existing.length > 0) {

            alert("You already own this machine.");
            return;

        }

        /* Calculate Expiry */

        const purchaseDate = new Date();

        const expiryDate = new Date();

        expiryDate.setDate(
            expiryDate.getDate() + Number(machine.duration_days)
        );

        /* Deduct Wallet */

        const { error: updateError } = await db
            .from("profiles")
            .update({
                wallet_balance: wallet - price
            })
            .eq("id", currentUser.id);

        if (updateError) {

            alert(updateError.message);
            return;

        }

        /* Save Purchased Machine */

        const { error: purchaseError } = await db
            .from("user_machines")
            .insert({

                user_id: currentUser.id,

                machine_id: machine.id,

                machine_name: machine.name,

                machine_image: machine.image_url,

                amount_paid: price,

                purchase_date: purchaseDate.toISOString(),

                expiry_date: expiryDate.toISOString(),

                earned_amount: 0,

                completed: false,

                status: "active",

                is_vip: machine.is_vip,

                last_profit_date: null

            });

        if (purchaseError) {

            alert(purchaseError.message);
            return;

        }

        /* Wallet Transaction */

        await db
            .from("wallet_transactions")
            .insert({

                user_id: currentUser.id,

                type: "Machine Purchase",

                amount: price,

                description: "Purchased " + machine.name,

                status: "completed",

                created_at: new Date().toISOString(),

                balance_after: wallet - price

            });

        /* Refresh Wallet */

        await loadProfile();

        /* Refresh Machine List */

        await loadMachines();

        /* Success */

        showSuccessPopup(
            machine.name + " purchased successfully."
        );

    } catch (error) {

        console.error(error);

        alert("Unexpected error occurred.");

    }

}

/*=========================================
SUCCESS POPUP
=========================================*/

function showSuccessPopup(message) {

    const popup = document.getElementById("successPopup");

    popup.textContent = message;

    popup.style.display = "block";

    setTimeout(() => {

        popup.style.display = "none";

    }, 2500);

            }
