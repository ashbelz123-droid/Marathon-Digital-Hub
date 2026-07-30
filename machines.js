/*=========================================
SUPABASE
=========================================*/

const db = window.supabaseClient;

let currentUser = null;
let allMachines = [];
let purchasedMachines = new Set();
let currentSeries = "All";

/*=========================================
START PAGE
=========================================*/

document.addEventListener("DOMContentLoaded", async () => {

    try{

        showLoading(true);

        /* Check Login */

        const { data:{ user }, error } = await db.auth.getUser();

        if(error) throw error;

        if(!user){

            window.location.href = "login.html";
            return;

        }

        currentUser = user;

        /* Load Everything */

        await initializePage();

    }catch(error){

        console.error(error);

        document.getElementById("machinesContainer").innerHTML = `

            <div class="loading">

                Failed to load machines.

            </div>

        `;

    }finally{

        showLoading(false);

    }

});

/*=========================================
INITIALIZE PAGE
=========================================*/

async function initializePage(){

    await loadPurchasedMachines();

    await loadMachines();

}

/*=========================================
LOADING OVERLAY
=========================================*/

function showLoading(show){

    const overlay = document.getElementById("loadingOverlay");

    if(!overlay) return;

    overlay.style.display = show ? "flex" : "none";

}

/*=========================================
LOAD USER PURCHASED MACHINES
=========================================*/

async function loadPurchasedMachines(){

    purchasedMachines.clear();

    const { data, error } = await db

        .from("user_machines")

        .select("machine_id")

        .eq("user_id", currentUser.id)

        .eq("status", "active");

    if(error){

        console.error(error);

        return;

    }

    (data || []).forEach(item=>{

        purchasedMachines.add(item.machine_id);

    });

}

/*=========================================
LOAD ALL MACHINES
=========================================*/

async function loadMachines(){

    const { data, error } = await db

        .from("machines")

        .select("*")

        .eq("status", true)

        .order("display_order",{ascending:true})

        .order("price",{ascending:true});

    if(error){

        console.error(error);

        document.getElementById("machinesContainer").innerHTML=`

            <div class="loading">

                Failed to load machines.

            </div>

        `;

        return;

    }

    allMachines = data || [];

    buildSeriesTabs();

    renderMachines(currentSeries);

           }

/*=========================================
BUILD SERIES TABS
=========================================*/

function buildSeriesTabs(){

    const tabs = document.getElementById("seriesTabs");

    tabs.innerHTML = "";

    /* All Button */

    createSeriesButton("All");

    /* Get Unique Series */

    const seriesList = [...new Set(

        allMachines.map(machine =>

            machine.series || "General"

        )

    )];

    seriesList.sort();

    /* Create Tabs */

    seriesList.forEach(series=>{

        createSeriesButton(series);

    });

}

/*=========================================
CREATE TAB
=========================================*/

function createSeriesButton(series){

    const button = document.createElement("button");

    button.textContent = series;

    if(series === currentSeries){

        button.classList.add("active");

    }

    button.onclick = ()=>{

        currentSeries = series;

        document.querySelectorAll(".series-tabs button")

        .forEach(btn=>btn.classList.remove("active"));

        button.classList.add("active");

        renderMachines(series);

    };

    document.getElementById("seriesTabs")

    .appendChild(button);

}

/*=========================================
RENDER MACHINES
=========================================*/

function renderMachines(series){

    const container = document.getElementById("machinesContainer");

    container.innerHTML = "";

    const machines = series === "All"

    ? allMachines

    : allMachines.filter(machine=>

        (machine.series || "General") === series

    );

    if(machines.length === 0){

        container.innerHTML = `

            <div class="loading">

                No machines available.

            </div>

        `;

        return;

    }

    let html = "";

    machines.forEach(machine=>{

        const purchased = purchasedMachines.has(machine.id);

        const image = machine.image_url || "images/default-machine.png";

        html += machineCard(machine, purchased, image);

    });

    container.innerHTML = html;

                 }

/*=========================================
CREATE MACHINE CARD
=========================================*/

function machineCard(machine, purchased, image){

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

            onclick="buyMachine('${machine.id}')">

            ${purchased ? "PURCHASED ✓" : "BUY MACHINE"}

        </button>

    </div>

    `;

}

/*=========================================
BUY MACHINE
=========================================*/

async function buyMachine(machineId){

    /* Prevent double clicking */

    const button = event.target;

    button.disabled = true;

    button.innerText = "Processing...";

    showLoading(true);

    try{

        /* Check again if already purchased */

        if(purchasedMachines.has(machineId)){

            alert("You already own this machine.");

            renderMachines(currentSeries);

            return;

        }

        /* Continue in Part 5 */

    }catch(error){

        console.error(error);

        alert("Purchase failed.");

        renderMachines(currentSeries);

    }finally{

        showLoading(false);

    }

}

        /*=========================================
        LOAD MACHINE
        =========================================*/

        const { data: machine, error: machineError } = await db

            .from("machines")

            .select("*")

            .eq("id", machineId)

            .single();

        if(machineError || !machine){

            throw new Error("Machine not found.");

        }

        /*=========================================
        LOAD USER PROFILE
        =========================================*/

        const { data: profile, error: profileError } = await db

            .from("profiles")

            .select("wallet_balance")

            .eq("id", currentUser.id)

            .single();

        if(profileError || !profile){

            throw new Error("Unable to load wallet.");

        }

        const wallet = Number(profile.wallet_balance || 0);
        const price = Number(machine.price);

        /*=========================================
        CHECK BALANCE
        =========================================*/

        if(wallet < price){

            alert("Insufficient wallet balance.");

            renderMachines(currentSeries);

            return;

        }

        /*=========================================
        FINAL DUPLICATE CHECK
        =========================================*/

        const { data: existing } = await db

            .from("user_machines")

            .select("id")

            .eq("user_id", currentUser.id)

            .eq("machine_id", machineId)

            .eq("status","active");

        if(existing && existing.length){

            purchasedMachines.add(machineId);

            renderMachines(currentSeries);

            alert("You already own this machine.");

            return;

        }

        /*=========================================
        CALCULATE EXPIRY
        =========================================*/

        const expiry = new Date();

        expiry.setDate(

            expiry.getDate() +

            Number(machine.duration_days)

        );

        /*=========================================
        UPDATE WALLET
        =========================================*/

        const newBalance = wallet - price;

        const { error: walletError } = await db

            .from("profiles")

            .update({

                wallet_balance: newBalance,

                total_invested:

                    (Number(profile.total_invested || 0) + price)

            })

            .eq("id", currentUser.id);

        if(walletError){

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

                earned_amount: 0,

                completed: false,

                status: "active",

                is_vip: machine.is_vip

            });

        if(purchaseError){

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

                description: machine.name,

                balance_after: newBalance,

                created_at: new Date().toISOString()

            });

        purchasedMachines.add(machine.id);

        showSuccess(

            machine.name +

            " purchased successfully."

        );

        renderMachines(currentSeries);

    } catch (error) {

        console.error(error);

        alert(error.message || "Purchase failed.");

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

    text.textContent = message;

    popup.classList.add("show");

    setTimeout(() => {

        popup.classList.remove("show");

    }, 2500);

}

/*=========================================
LOADING
=========================================*/

function showLoading() {

    document.getElementById("loadingOverlay").style.display = "flex";

}

function hideLoading() {

    document.getElementById("loadingOverlay").style.display = "none";

}

/*=========================================
AUTO REFRESH
=========================================*/

setInterval(async () => {

    if (!currentUser) return;

    try {

        await loadPurchasedMachines();

        renderMachines(currentSeries);

    } catch (e) {

        console.log(e);

    }

}, 30000);

/*=========================================
REMOVE EXPIRED MACHINES
=========================================*/

async function cleanExpiredMachines() {

    if (!currentUser) return;

    const now = new Date().toISOString();

    const { data } = await db

        .from("user_machines")

        .select("id")

        .eq("user_id", currentUser.id)

        .eq("status", "active")

        .lt("expiry_date", now);

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
IMAGE FALLBACK
=========================================*/

document.addEventListener("error", function (e) {

    if (e.target.tagName === "IMG") {

        e.target.src = "images/default-machine.png";

    }

}, true);

/*=========================================
PAGE VISIBILITY
=========================================*/

document.addEventListener("visibilitychange", async () => {

    if (!document.hidden && currentUser) {

        await loadPurchasedMachines();

        renderMachines(currentSeries);

    }

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
STARTUP
=========================================*/

window.addEventListener("load", async () => {

    try {

        await cleanExpiredMachines();

    } catch (e) {

        console.log(e);

    }

});

/*=========================================
END
=========================================*/
