/*=========================================
SUPABASE
=========================================*/

const db = window.supabaseClient;

/*=========================================
GLOBAL VARIABLES
=========================================*/

let currentUser = null;
let profile = null;

let allMachines = [];
let purchasedMachines = [];

let currentSeries = "ALL";

let buyingMachine = false;

/*=========================================
START PAGE
=========================================*/

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const { data: { user }, error } = await db.auth.getUser();

        if (error || !user) {

            window.location.href = "login.html";
            return;

        }

        currentUser = user;

        await initializePage();

    } catch (error) {

        console.error(error);

        showError("Unable to start page.");

    }

});

/*=========================================
INITIALIZE PAGE
=========================================*/

async function initializePage() {

    showLoading();

    await loadProfile();

    await loadMachines();

    await loadPurchasedMachines();

    buildSeriesTabs();

    renderMachines();

}

/*=========================================
LOAD USER PROFILE
=========================================*/

async function loadProfile() {

    const { data, error } = await db

        .from("profiles")

        .select("*")

        .eq("id", currentUser.id)

        .single();

    if (error) {

        throw error;

    }

    profile = data;

}

/*=========================================
SHOW LOADING
=========================================*/

function showLoading() {

    document.getElementById("machines").innerHTML = `

        <div class="loading">

            Loading machines...

        </div>

    `;

}

/*=========================================
SHOW ERROR
=========================================*/

function showError(message) {

    document.getElementById("machines").innerHTML = `

        <div class="empty-state">

            <h3>Oops!</h3>

            <p>${message}</p>

        </div>

    `;

}

/* ==========================================
LOAD USER
========================================== */

async function loadUser() {

    const {
        data: { user },
        error
    } = await db.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return false;
    }

    currentUser = user;
    return true;
}

/* ==========================================
REMOVE DUPLICATE PURCHASES
========================================== */

async function removeDuplicatePurchases() {

    const { data, error } = await db
        .from("user_machines")
        .select("id,machine_id,purchase_date")
        .eq("user_id", currentUser.id)
        .order("purchase_date", { ascending: true });

    if (error || !data) return;

    const seen = {};

    for (const machine of data) {

        if (seen[machine.machine_id]) {

            await db
                .from("user_machines")
                .delete()
                .eq("id", machine.id);

        } else {

            seen[machine.machine_id] = true;

        }
    }
}

/* ==========================================
START PAGE
========================================== */

document.addEventListener("DOMContentLoaded", async () => {

    const ok = await loadUser();

    if (!ok) return;

    await removeDuplicatePurchases();

    await loadMachines();

});

/* ==========================================
LOAD MACHINES
========================================== */

async function loadMachines() {

    machineContainer.innerHTML =
        `<div class="loading">Loading machines...</div>`;

    const { data, error } = await db
        .from("machines")
        .select("*")
        .eq("status", true)
        .order("display_order", { ascending: true });

    if (error) {

        console.error(error);

        machineContainer.innerHTML =
            `<div class="loading">Failed to load machines.</div>`;

        return;
    }

    allMachines = data || [];

    buildSeriesTabs();

    renderMachines("ALL");
}

/* ==========================================
BUILD SERIES TABS
========================================== */

function buildSeriesTabs() {

    seriesTabs.innerHTML = "";

    const seriesList = ["ALL"];

    allMachines.forEach(machine => {

        const series = machine.series || "General";

        if (!seriesList.includes(series)) {

            seriesList.push(series);

        }

    });

    seriesList.forEach((series, index) => {

        const button = document.createElement("button");

        button.className = index === 0 ? "tab active" : "tab";

        button.textContent = series;

        button.onclick = () => {

            document
                .querySelectorAll(".tab")
                .forEach(tab => tab.classList.remove("active"));

            button.classList.add("active");

            renderMachines(series);

        };

        seriesTabs.appendChild(button);

    });

}

/* ==========================================
RENDER MACHINES
========================================== */

async function renderMachines(series) {

    machineContainer.innerHTML = "";

    let list = allMachines;

    if (series !== "ALL") {

        list = allMachines.filter(machine =>
            (machine.series || "General") === series
        );

    }

    if (list.length === 0) {

        machineContainer.innerHTML =
            `<div class="loading">No machines available.</div>`;

        return;

    }

    for (const machine of list) {

        await createMachineCard(machine);

    }

}

/* ==========================================
CREATE MACHINE CARD
========================================== */

async function createMachineCard(machine) {

    const { data: owned } = await db
        .from("user_machines")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("machine_id", machine.id)
        .limit(1);

    const purchased = owned && owned.length > 0;

    const image = machine.image_url || "images/default-machine.png";

    machineContainer.innerHTML += `
    <div class="machine-card">

        <img class="machine-image"
             src="${image}"
             onerror="this.src='images/default-machine.png'">

        <div class="machine-info">

            <h3>${machine.name}</h3>

            <div class="machine-price">
                Price
                <span>UGX ${Number(machine.price).toLocaleString()}</span>
            </div>

            <div class="machine-price">
                Total Return
                <span>UGX ${Number(machine.total_return).toLocaleString()}</span>
            </div>

            <div class="machine-price">
                Duration
                <span>${machine.duration_days} Days</span>
            </div>

        </div>

        <button
            class="buy-btn"
            ${purchased ? "disabled" : ""}
            onclick="buyMachine('${machine.id}')">

            ${purchased ? "PURCHASED ✓" : "BUY MACHINE"}

        </button>

    </div>`;
}

/* ==========================================
BUY MACHINE
========================================== */

async function buyMachine(machineId) {

    const button = event.target;

    button.disabled = true;
    button.innerText = "Processing...";

    try {

        /* Machine */

        const { data: machine } = await db
            .from("machines")
            .select("*")
            .eq("id", machineId)
            .single();

        /* Already purchased */

        const { data: existing } = await db
            .from("user_machines")
            .select("id")
            .eq("user_id", currentUser.id)
            .eq("machine_id", machineId)
            .limit(1);

        if (existing.length > 0) {

            alert("You already own this machine.");

            await loadMachines();

            return;
        }

        /* Wallet */

        const { data: profile } = await db
            .from("profiles")
            .select("wallet_balance")
            .eq("id", currentUser.id)
            .single();

        const balance = Number(profile.wallet_balance);

        if (balance < Number(machine.price)) {

            alert("Insufficient wallet balance.");

            button.disabled = false;
            button.innerText = "BUY MACHINE";

            return;
        }

        /* Update wallet */

        await db
            .from("profiles")
            .update({
                wallet_balance: balance - Number(machine.price)
            })
            .eq("id", currentUser.id);

        /* Expiry */

        const expiry = new Date();

        expiry.setDate(
            expiry.getDate() + Number(machine.duration_days)
        );

        /* Save purchase */

        await db
            .from("user_machines")
            .insert({

                user_id: currentUser.id,

                machine_id: machine.id,

                machine_name: machine.name,

                machine_image: machine.image_url,

                amount_paid: machine.price,

                purchase_date: new Date().toISOString(),

                expiry_date: expiry.toISOString(),

                earned_amount: 0,

                completed: false,

                status: "active",

                is_vip: machine.is_vip

            });

        /* Wallet history */

        await db
            .from("wallet_transactions")
            .insert({

                user_id: currentUser.id,

                type: "Machine Purchase",

                amount: machine.price,

                description: machine.name,

                created_at: new Date().toISOString()

            });

        showSuccessPopup("Machine Purchased Successfully");

        await removeDuplicatePurchases();

        await loadMachines();

    } catch (err) {

        console.error(err);

        alert("Purchase failed.");

        button.disabled = false;
        button.innerText = "BUY MACHINE";

    }

}

/* ==========================================
SUCCESS POPUP
========================================== */

function showSuccessPopup(message) {

    const popup = document.getElementById("successPopup");

    popup.textContent = message;

    popup.style.display = "block";

    setTimeout(() => {

        popup.style.display = "none";

    }, 2500);

                                   }
/* ==========================================
AUTO REFRESH MACHINES
========================================== */

setInterval(async () => {

    if (!currentUser) return;

    await loadMachines();

}, 30000);

/* ==========================================
FADE-IN ANIMATION
========================================== */

function animateCards() {

    const cards = document.querySelectorAll(".machine-card");

    cards.forEach((card, index) => {

        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";

        setTimeout(() => {

            card.style.transition = "all .4s ease";

            card.style.opacity = "1";

            card.style.transform = "translateY(0)";

        }, index * 80);

    });

}

/* ==========================================
IMAGE FALLBACK
========================================== */

document.addEventListener("error", function (e) {

    if (e.target.tagName === "IMG") {

        e.target.src = "images/default-machine.png";

    }

}, true);

/* ==========================================
PRELOAD MACHINE IMAGES
========================================== */

function preloadImages() {

    allMachines.forEach(machine => {

        if (machine.image_url) {

            const img = new Image();

            img.src = machine.image_url;

        }

    });

}

/* ==========================================
DISABLE DOUBLE CLICK
========================================== */

let buying = false;

document.addEventListener("click", function (e) {

    if (!e.target.classList.contains("buy-btn")) return;

    if (buying) {

        e.preventDefault();

        return;

    }

    buying = true;

    setTimeout(() => {

        buying = false;

    }, 3000);

});

/* ==========================================
AFTER MACHINE LOAD
========================================== */

const originalLoadMachines = loadMachines;

loadMachines = async function () {

    await originalLoadMachines();

    preloadImages();

    animateCards();

};

/* ==========================================
PAGE READY
========================================== */

window.addEventListener("load", () => {

    console.log("Machines Page Ready");

});

/* ==========================================
REMOVE EXPIRED MACHINES
========================================== */

async function checkExpiredMachines() {

    const now = new Date().toISOString();

    const { data, error } = await db
        .from("user_machines")
        .select("id, expiry_date, status")
        .eq("user_id", currentUser.id)
        .eq("status", "active");

    if (error || !data) return;

    for (const machine of data) {

        if (
            machine.expiry_date &&
            new Date(machine.expiry_date) <= new Date(now)
        ) {

            await db
                .from("user_machines")
                .update({
                    status: "completed",
                    completed: true,
                    completed_at: now
                })
                .eq("id", machine.id);

        }

    }

}

/* ==========================================
AUTO CHECK EVERY MINUTE
========================================== */

setInterval(async () => {

    if (!currentUser) return;

    await checkExpiredMachines();

}, 60000);

/* ==========================================
REFRESH AFTER PURCHASE
========================================== */

async function refreshPage() {

    await checkExpiredMachines();

    await removeDuplicatePurchases();

    await loadMachines();

}

/* ==========================================
NETWORK STATUS
========================================== */

window.addEventListener("online", () => {

    console.log("Connected");

    refreshPage();

});

window.addEventListener("offline", () => {

    console.log("Offline");

});

/* ==========================================
FINAL STARTUP
========================================== */

window.addEventListener("load", async () => {

    if (!currentUser) return;

    await checkExpiredMachines();

    await removeDuplicatePurchases();

    await loadMachines();

    console.log("Machines System V2 Ready");

});
