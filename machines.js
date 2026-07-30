/*=========================================
MARATHON DIGITAL HUB
MACHINES PAGE
PART 1
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
START APPLICATION
=========================================*/

async function startPage() {

    try {

        showLoading(true);

        /* Check Login */

        const { data, error } = await db.auth.getUser();

        if (error) throw error;

        if (!data.user) {

            window.location.href = "login.html";
            return;

        }

        currentUser = data.user;

        /* Remove expired machines */

        await cleanExpiredMachines();

        /* Load purchased machines */

        await loadPurchasedMachines();

        /* Load available machines */

        await loadMachines();

    }

    catch (error) {

        console.error(error);

        document.getElementById("machinesContainer").innerHTML = `

            <div class="loading">

                Failed to load machines.

            </div>

        `;

    }

    finally {

        showLoading(false);

    }

}

/*=========================================
LOADING OVERLAY
=========================================*/

function showLoading(show = true) {

    const overlay = document.getElementById("loadingOverlay");

    if (!overlay) return;

    overlay.style.display = show ? "flex" : "none";

}

function hideLoading() {

    showLoading(false);

}

/*=========================================
LOAD USER PURCHASED MACHINES
=========================================*/

async function loadPurchasedMachines() {

    purchasedMachines = [];

    const { data, error } = await db

        .from("user_machines")

        .select("machine_id")

        .eq("user_id", currentUser.id)

        .eq("status", "active");

    if (error) {

        console.error("Purchased Machines:", error);

        return;

    }

    purchasedMachines = data.map(item => item.machine_id);

}

/*=========================================
LOAD MACHINES
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

        console.error("Machines:", error);

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

        document.getElementById("emptyState").style.display = "block";

        return;

    }

    document.getElementById("emptyState").style.display = "none";

    container.style.display = "flex";

    buildSeriesTabs();

    renderMachines(currentSeries);

}

/*=========================================
BUILD SERIES TABS
=========================================*/

function buildSeriesTabs() {

    const tabs = document.getElementById("seriesTabs");

    tabs.innerHTML = "";

    createSeriesTab("All");

    const groups = [];

    allMachines.forEach(machine => {

        const group = getSeriesGroup(machine.series);

        if (!groups.includes(group)) {

            groups.push(group);

        }

    });

    groups.sort();

    groups.forEach(group => {

        createSeriesTab(group);

    });

}

/*=========================================
GET SERIES GROUP
=========================================*/

function getSeriesGroup(series) {

    if (!series) return "General";

    return series
        .replace(/[0-9]/g, "")
        .trim()
        .toUpperCase();

}

/*=========================================
CREATE SERIES TAB
=========================================*/

function createSeriesTab(name) {

    const button = document.createElement("button");

    button.textContent = name;

    if (name === currentSeries) {

        button.classList.add("active");

    }

    button.onclick = () => {

        currentSeries = name;

        document
            .querySelectorAll("#seriesTabs button")
            .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        renderMachines(name);

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

            getSeriesGroup(machine.series) === series

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

    const image = machine.image_url && machine.image_url !== ""
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
        button.innerText = "Processing...";

        showLoading(true);

        /* Already Purchased */

        if (purchasedMachines.includes(machineId)) {

            alert("You already own this machine.");

            renderMachines(currentSeries);

            return;

        }

        /* Load Machine */

        const { data: machine, error: machineError } = await db

            .from("machines")

            .select("*")

            .eq("id", machineId)

            .single();

        if (machineError || !machine) {

            throw new Error("Machine not found.");

        }

        /* Load Wallet */

        const { data: profile, error: profileError } = await db

            .from("profiles")

            .select("wallet_balance,total_invested")

            .eq("id", currentUser.id)

            .single();

        if (profileError || !profile) {

            throw new Error("Unable to load wallet.");

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

            alert("You already own this machine.");

            renderMachines(currentSeries);

            return;

        }

        /* Calculate Expiry */

        const expiry = new Date();

        expiry.setDate(

            expiry.getDate() + Number(machine.duration_days)

        );

        const newBalance = wallet - price;        /*=========================================
        UPDATE USER WALLET
        =========================================*/

        const { error: walletError } = await db

            .from("profiles")

            .update({

                wallet_balance: newBalance,

                total_invested:
                    Number(profile.total_invested || 0) + price

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

                earned_amount: 0,

                completed: false,

                is_vip: machine.is_vip,

                last_profit_date: null

            });

        if (purchaseError) {

            throw purchaseError;

        }

        /*=========================================
        SAVE TRANSACTION
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

        await loadPurchasedMachines();

        renderMachines(currentSeries);

    }

    catch(error){

        console.error(error);

        alert(error.message || "Purchase failed.");

    }

    finally{

        hideLoading();

    }

}

/*=========================================
SUCCESS POPUP
=========================================*/

function showSuccess(message){

    const popup = document.getElementById("successPopup");

    const text = document.getElementById("successMessage");

    text.textContent = message;

    popup.style.display = "flex";

    setTimeout(()=>{

        popup.style.display = "none";

    },2500);

}

/*=========================================
REMOVE EXPIRED MACHINES
=========================================*/

async function cleanExpiredMachines(){

    if(!currentUser) return;

    const now = new Date().toISOString();

    const { data } = await db

        .from("user_machines")

        .select("id")

        .eq("user_id", currentUser.id)

        .eq("status","active")

        .lt("expiry_date", now);

    if(!data || data.length===0) return;

    const ids = data.map(item=>item.id);

    await db

        .from("user_machines")

        .update({

            status:"expired",

            completed:true

        })

        .in("id", ids);

}

/*=========================================
IMAGE FALLBACK
=========================================*/

document.addEventListener("error",function(e){

    if(e.target.tagName==="IMG"){

        e.target.src="images/default-machine.png";

    }

},true);

/*=========================================
PAGE REFRESH
=========================================*/

document.addEventListener("visibilitychange",async()=>{

    if(document.hidden) return;

    if(!currentUser) return;

    await loadPurchasedMachines();

    renderMachines(currentSeries);

});

/*=========================================
END
=========================================*/
