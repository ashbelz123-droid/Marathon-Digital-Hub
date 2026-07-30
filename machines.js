/*=========================================
MARATHON DIGITAL HUB
MACHINES.JS
PART 1 - STARTUP
=========================================*/

/*=========================================
SUPABASE
=========================================*/

const db = window.supabaseClient;

/*=========================================
GLOBAL VARIABLES
=========================================*/

let currentUser = null;
let allMachines = [];
let purchasedMachines = [];
let currentSeries = "All";

/*=========================================
PAGE START
=========================================*/

document.addEventListener("DOMContentLoaded", startPage);

/*=========================================
START PAGE
=========================================*/

async function startPage() {

    try {

        showLoading(true);

        /* Check Login */

        const {
            data: { user },
            error
        } = await db.auth.getUser();

        if (error) throw error;

        if (!user) {

            window.location.href = "login.html";
            return;

        }

        currentUser = user;

        /* Clean expired machines */

        await cleanExpiredMachines();

        /* Load purchased machines */

        await loadPurchasedMachines();

        /* Load machines */

        await loadMachines();

    } catch (error) {

        console.error(error);

        document.getElementById("machinesContainer").innerHTML = `
            <div class="loading">
                Failed to load machines.
            </div>
        `;

    } finally {

        showLoading(false);

    }

}

/*=========================================
SHOW LOADING
=========================================*/

function showLoading(show = true) {

    const overlay = document.getElementById("loadingOverlay");

    if (!overlay) return;

    overlay.style.display = show ? "flex" : "none";

}

/*=========================================
HIDE LOADING
=========================================*/

function hideLoading() {

    showLoading(false);

}

/*=========================================
LOAD PURCHASED MACHINES
=========================================*/

async function loadPurchasedMachines() {

    purchasedMachines = [];

    const { data, error } = await db
        .from("user_machines")
        .select("machine_id")
        .eq("user_id", currentUser.id)
        .eq("status", "active");

    if (error) {

        console.error(error);
        return;

    }

    purchasedMachines = (data || []).map(item => item.machine_id);

}

/*=========================================
LOAD ALL MACHINES
=========================================*/

async function loadMachines() {

    const container = document.getElementById("machinesContainer");

    container.innerHTML = `
        <div class="loading">
            Loading machines...
        </div>
    `;

    const { data, error } = await db
        .from("machines")
        .select("*")
        .eq("status", true)
        .order("display_order", { ascending: true })
        .order("price", { ascending: true });

    if (error) {

        console.error(error);

        container.innerHTML = `
            <div class="loading">
                Failed to load machines.
            </div>
        `;

        return;

    }

    allMachines = data || [];

    if (allMachines.length === 0) {

        container.style.display = "none";

        const empty = document.getElementById("emptyState");

        if (empty) empty.style.display = "block";

        return;

    }

    container.style.display = "flex";

    const empty = document.getElementById("emptyState");

    if (empty) empty.style.display = "none";

    buildSeriesTabs();

    renderMachines(currentSeries);

}

    /*=========================================
BUILD SERIES TABS
=========================================*/

function buildSeriesTabs() {

    const tabs = document.getElementById("seriesTabs");

    tabs.innerHTML = "";

    /* All Tab */

    createSeriesTab("All");

    /* Get Unique Series */

    const series = [
        ...new Set(
            allMachines.map(machine =>
                machine.series || "General"
            )
        )
    ];

    series.sort();

    series.forEach(name => {

        createSeriesTab(name);

    });

}

/*=========================================
CREATE SERIES TAB
=========================================*/

function createSeriesTab(seriesName) {

    const button = document.createElement("button");

    button.textContent = seriesName;

    if (seriesName === currentSeries) {

        button.classList.add("active");

    }

    button.onclick = () => {

        currentSeries = seriesName;

        document
            .querySelectorAll("#seriesTabs button")
            .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        renderMachines(currentSeries);

    };

    document
        .getElementById("seriesTabs")
        .appendChild(button);

}

/*=========================================
RENDER MACHINES
=========================================*/

function renderMachines(series) {

    const container = document.getElementById("machinesContainer");

    container.innerHTML = "";

    const machines = series === "All"

        ? allMachines

        : allMachines.filter(machine =>
            (machine.series || "General") === series
        );

    if (machines.length === 0) {

        container.innerHTML = `
            <div class="loading">
                No machines available.
            </div>
        `;

        return;

    }

    machines.forEach(machine => {

        const purchased =
            purchasedMachines.includes(machine.id);

        container.innerHTML += createMachineCard(
            machine,
            purchased
        );

    });

}

/*=========================================
CREATE MACHINE CARD
=========================================*/

function createMachineCard(machine, purchased) {

    const image =
        machine.image_url &&
        machine.image_url !== ""
            ? machine.image_url
            : "images/default-machine.png";

    return `

    <div class="machine-card">

        <div class="machine-top">

            <img
                src="${image}"
                class="machine-image"
                loading="lazy"
                onerror="this.src='images/default-machine.png'">

            <div class="machine-details">

                <div class="machine-name">
                    ${machine.name}
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
            onclick="buyMachine('${machine.id}', this)">

            ${purchased ? "PURCHASED ✓" : "BUY MACHINE"}

        </button>

    </div>

    `;

}

/*=========================================
BUY MACHINE
=========================================*/

async function buyMachine(machineId, button) {

    try {

        button.disabled = true;
        button.textContent = "Processing...";

        showLoading(true);

        /* Find Machine */

        const machine = allMachines.find(m => m.id === machineId);

        if (!machine) {

            throw new Error("Machine not found.");

        }

        /* Duplicate Check */

        if (purchasedMachines.includes(machineId)) {

            alert("You already own this machine.");

            renderMachines(currentSeries);

            return;

        }

        /* Load Wallet */

        const { data: profile, error: profileError } = await db
            .from("profiles")
            .select("wallet_balance,total_invested")
            .eq("id", currentUser.id)
            .single();

        if (profileError) {

            throw profileError;

        }

        const wallet = Number(profile.wallet_balance || 0);
        const price = Number(machine.price);

        /* Balance Check */

        if (wallet < price) {

            alert("Insufficient wallet balance.");

            renderMachines(currentSeries);

            return;

        }

        /* Final Duplicate Check */

        const { data: existing } = await db
            .from("user_machines")
            .select("id")
            .eq("user_id", currentUser.id)
            .eq("machine_id", machineId)
            .eq("status", "active");

        if (existing && existing.length > 0) {

            purchasedMachines.push(machineId);

            renderMachines(currentSeries);

            alert("You already own this machine.");

            return;

        }

        /* Calculate Expiry */

        const expiry = new Date();

        expiry.setDate(
            expiry.getDate() + Number(machine.duration_days)
        );

        const newBalance = wallet - price;         /*=========================================
        UPDATE USER WALLET
        =========================================*/

        const { error: walletError } = await db
            .from("profiles")
            .update({
                wallet_balance: newBalance,
                total_invested: Number(profile.total_invested || 0) + price
            })
            .eq("id", currentUser.id);

        if (walletError) {

            throw walletError;

        }

        /*=========================================
        SAVE PURCHASE
        =========================================*/

        const { error: purchaseError } = await db
            .from("user_machines")
            .insert({

                user_id: currentUser.id,

                machine_id: machine.id,

                machine_name: machine.name,

                machine_image: machine.image_url,

                amount_paid: price,

                purchase_date: new Date().toISOString(),

                expiry_date: expiry.toISOString(),

                status: "active",

                is_vip: machine.is_vip,

                earned_amount: 0,

                completed: false

            });

        if (purchaseError) {

            throw purchaseError;

        }

        /*=========================================
        SAVE WALLET TRANSACTION
        =========================================*/

        await db
            .from("wallet_transactions")
            .insert({

                user_id: currentUser.id,

                type: "Machine Purchase",

                amount: price,

                description: `Purchased ${machine.name}`,

                balance_after: newBalance,

                created_at: new Date().toISOString()

            });

        /*=========================================
        UPDATE LOCAL DATA
        =========================================*/

        purchasedMachines.push(machine.id);

        showSuccess(
            `${machine.name} purchased successfully.`
        );

        renderMachines(currentSeries);

    } catch (error) {

        console.error(error);

        alert(error.message || "Purchase failed.");

        renderMachines(currentSeries);

    } finally {

        hideLoading();

    }

            }

/*=========================================
SUCCESS POPUP
=========================================*/

function showSuccess(message) {

    const popup = document.getElementById("successPopup");
    const text = document.getElementById("successMessage");
    const closeBtn = document.getElementById("closeSuccess");

    if (!popup || !text) return;

    text.textContent = message;

    popup.style.display = "flex";

    if (closeBtn) {

        closeBtn.onclick = () => {

            popup.style.display = "none";

        };

    }

    setTimeout(() => {

        popup.style.display = "none";

    }, 2500);

}

/*=========================================
REMOVE EXPIRED MACHINES
=========================================*/

async function cleanExpiredMachines() {

    if (!currentUser) return;

    const now = new Date().toISOString();

    const { data, error } = await db
        .from("user_machines")
        .select("id,machine_id")
        .eq("user_id", currentUser.id)
        .eq("status", "active")
        .lt("expiry_date", now);

    if (error) {

        console.error(error);
        return;

    }

    if (!data || data.length === 0) return;

    const ids = data.map(item => item.id);

    await db
        .from("user_machines")
        .update({
            status: "expired",
            completed: true
        })
        .in("id", ids);

}

/*=========================================
AUTO REFRESH
=========================================*/

setInterval(async () => {

    if (!currentUser) return;

    await loadPurchasedMachines();

    renderMachines(currentSeries);

}, 30000);

/*=========================================
PAGE VISIBLE
=========================================*/

document.addEventListener("visibilitychange", async () => {

    if (document.hidden) return;

    if (!currentUser) return;

    await loadPurchasedMachines();

    renderMachines(currentSeries);

});

/*=========================================
ONLINE
=========================================*/

window.addEventListener("online", async () => {

    if (!currentUser) return;

    await loadPurchasedMachines();

    renderMachines(currentSeries);

});

/*=========================================
IMAGE FALLBACK
=========================================*/

document.addEventListener("error", function (e) {

    if (e.target.tagName === "IMG") {

        e.target.src = "images/default-machine.png";

    }

}, true);

/*=========================================
END
=========================================*/
