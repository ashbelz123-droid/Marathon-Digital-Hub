/* ==========================================
   MARATHON DIGITAL HUB
   MINING ENGINE V2
   PART 1
========================================== */

const db = window.supabaseClient;

/* ==========================================
   GLOBAL VARIABLES
========================================== */

let currentUser = null;
let currentProfile = null;
let siteSettings = null;
let userMachines = [];

/* ==========================================
   INITIALIZE ENGINE
========================================== */

async function initializeMiningEngine() {

    try {

        const { data, error } = await db.auth.getUser();

        if (error || !data.user) {

            console.log("Mining Engine: User not logged in.");

            return;

        }

        currentUser = data.user;

        await loadProfile();

        await loadSiteSettings();

        await loadUserMachines();

    } catch (error) {

        console.error("Mining Engine Init Error:", error);

    }

}

/* ==========================================
   LOAD PROFILE
========================================== */

async function loadProfile() {

    const { data, error } = await db

        .from("profiles")

        .select("*")

        .eq("id", currentUser.id)

        .single();

    if (error) {

        throw error;

    }

    currentProfile = data;

}

/* ==========================================
   LOAD SITE SETTINGS
========================================== */

async function loadSiteSettings() {

    const { data, error } = await db

        .from("site_settings")

        .select("*")

        .limit(1)

        .single();

    if (error) {

        console.warn("Site settings not found.");

        siteSettings = {

            weekend_enabled: true

        };

        return;

    }

    siteSettings = data;

}

/* ==========================================
   LOAD USER MACHINES
========================================== */

async function loadUserMachines() {

    const { data, error } = await db

        .from("user_machines")

        .select(`
            *,
            machines (
                id,
                name,
                total_return,
                duration_days,
                daily_income,
                is_vip
            )
        `)

        .eq("user_id", currentUser.id)

        .order("purchase_date", {

            ascending: true

        });

    if (error) {

        throw error;

    }

    userMachines = data || [];

}

/* ==========================================
   CHECK ALL MACHINES
========================================== */

async function processAllMachines() {

    if (!currentProfile) return;

    for (const machineRecord of userMachines) {

        try {

            await processSingleMachine(machineRecord);

        } catch (error) {

            console.error(
                "Machine Processing Error:",
                machineRecord.id,
                error
            );

        }

    }

}

/* ==========================================
   PROCESS SINGLE MACHINE
========================================== */

async function processSingleMachine(machineRecord) {

    const machine = machineRecord.machines;

    if (!machine) return;

    /* Machine already completed */

    if (machineRecord.completed === true) {

        return;

    }

    /* Machine manually stopped */

    if (machineRecord.status !== "active") {

        return;

    }

    /* Machine expired */

    if (machineRecord.expiry_date) {

        const expiry = new Date(machineRecord.expiry_date);

        if (Date.now() >= expiry.getTime()) {

            await completeMachine(machineRecord.id);

            return;

        }

    }

    /* Weekend check */

    const weekendEnabled =
        siteSettings?.weekend_enabled === true;

    const today = new Date();

    const isWeekend =
        today.getDay() === 0 ||
        today.getDay() === 6;

    const vipMachine =
        machine.is_vip === true ||
        machineRecord.is_vip === true;

    if (

        weekendEnabled &&
        isWeekend &&
        !vipMachine

    ) {

        return;

    }

    /* Already paid today */

    if (machineRecord.last_profit_date) {

        const last = new Date(
            machineRecord.last_profit_date
        );

        if (

            last.getFullYear() === today.getFullYear() &&
            last.getMonth() === today.getMonth() &&
            last.getDate() === today.getDate()

        ) {

            return;

        }

    }

    /* Ready for payout */

    await processMachineIncome(
        machineRecord,
        machine
    );

    }

/* ==========================================
   PROCESS MACHINE INCOME
========================================== */

async function processMachineIncome(
    machineRecord,
    machine
) {

    const totalReturn =
        Number(machine.total_return || 0);

    const duration =
        Number(machine.duration_days || 0);

    let dailyIncome =
        Number(machine.daily_income || 0);

    if (duration <= 0) {

        console.error(
            "Invalid machine duration:",
            machine.name
        );

        return;

    }

    /* Calculate daily income if missing */

    if (dailyIncome <= 0) {

        dailyIncome = totalReturn / duration;

    }

    const earned =
        Number(machineRecord.earned_amount || 0);

    /* Already reached maximum */

    if (earned >= totalReturn) {

        await completeMachine(machineRecord.id);

        return;

    }

    /* Remaining amount */

    const remaining =
        totalReturn - earned;

    let payout = dailyIncome;

    /* Never exceed total return */

    if (payout > remaining) {

        payout = remaining;

    }

    if (payout <= 0) {

        await completeMachine(machineRecord.id);

        return;

    }

    await creditMachineIncome(

        machineRecord,
        machine,
        payout

    );

       }

/* ==========================================
   CREDIT MACHINE INCOME
========================================== */

async function creditMachineIncome(
    machineRecord,
    machine,
    amount
) {

    const today =
        new Date().toISOString().split("T")[0];

    const transactionReference =
        `mining_${machineRecord.id}_${today}`;

    /* Prevent duplicate payout */

    const { data: existingTransaction } = await db

        .from("wallet_transactions")

        .select("id")

        .eq("transaction_reference", transactionReference)

        .maybeSingle();

    if (existingTransaction) {

        console.log(
            "Mining already paid today:",
            machine.name
        );

        return;

    }

    const newWallet =

        Number(currentProfile.wallet_balance || 0)

        + amount;

    const newProfit =

        Number(currentProfile.total_profit || 0)

        + amount;

    /* Update profile */

    const { error: profileError } = await db

        .from("profiles")

        .update({

            wallet_balance: newWallet,

            total_profit: newProfit,

            last_profit_claim:
                new Date().toISOString()

        })

        .eq("id", currentUser.id);

    if (profileError) {

        console.error(profileError);

        return;

    }

    /* Save wallet transaction */

    const { error: transactionError } = await db

        .from("wallet_transactions")

        .insert({

            user_id: currentUser.id,

            type: "Mining Income",

            amount: amount,

            description:
                `Daily mining income from ${machine.name}`,

            created_at:
                new Date().toISOString(),

            status: "completed",

            balance_after: newWallet,

            reference_id: machineRecord.id,

            transaction_reference:
                transactionReference

        });

    if (transactionError) {

        console.error(transactionError);

        return;

    }

    const earned =

        Number(machineRecord.earned_amount || 0)

        + amount;

    const completed =

        earned >= Number(machine.total_return);

    /* Update machine */

    await db

        .from("user_machines")

        .update({

            earned_amount: earned,

            last_profit_date:
                new Date().toISOString(),

            completed: completed,

            status: completed
                ? "completed"
                : "active",

            completed_at: completed
                ? new Date().toISOString()
                : null

        })

        .eq("id", machineRecord.id);

    /* Update local profile */

    currentProfile.wallet_balance = newWallet;

    currentProfile.total_profit = newProfit;

}

/* ==========================================
   COMPLETE MACHINE
========================================== */

async function completeMachine(machineId) {

    try {

        await db

            .from("user_machines")

            .update({

                completed: true,

                status: "completed",

                completed_at: new Date().toISOString()

            })

            .eq("id", machineId);

    } catch (error) {

        console.error(

            "Complete Machine Error:",

            error

        );

    }

}

/* ==========================================
   RUN MINING ENGINE
========================================== */

async function runMiningEngine() {

    try {

        await initializeMiningEngine();

        if (

            !currentUser ||

            !currentProfile ||

            userMachines.length === 0

        ) {

            return;

        }

        await processAllMachines();

    } catch (error) {

        console.error(

            "Mining Engine Error:",

            error

        );

    }

}

/* ==========================================
   START ENGINE
========================================== */

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        await runMiningEngine();

    }

);

/* ==========================================
   AUTO REFRESH PROFILE
========================================== */

window.addEventListener(

    "focus",

    async () => {

        try {

            await initializeMiningEngine();

        } catch (error) {

            console.error(error);

        }

    }

);

/* ==========================================
   ENGINE READY
========================================== */

console.log(

    "Marathon Mining Engine V2 Loaded."

);

/* ==========================================
   PART 6
   PRODUCTION SAFETY
========================================== */

let miningEngineRunning = false;

/* ==========================================
   SAFE START
========================================== */

async function startMiningEngine() {

    if (miningEngineRunning) {

        console.log("Mining engine already running.");

        return;

    }

    miningEngineRunning = true;

    try {

        await runMiningEngine();

    } catch (error) {

        console.error(

            "Mining Engine Fatal Error:",

            error

        );

    } finally {

        miningEngineRunning = false;

    }

}

/* ==========================================
   ONLINE CHECK
========================================== */

window.addEventListener("online", () => {

    console.log("Internet Restored");

    startMiningEngine();

});

/* ==========================================
   PAGE VISIBILITY
========================================== */

document.addEventListener(

    "visibilitychange",

    () => {

        if (

            document.visibilityState === "visible"

        ) {

            startMiningEngine();

        }

    }

);

/* ==========================================
   AUTH STATE
========================================== */

db.auth.onAuthStateChange(

    async (event) => {

        if (

            event === "SIGNED_IN"

        ) {

            startMiningEngine();

        }

    }

);

/* ==========================================
   VERSION
========================================== */

const MINING_ENGINE_VERSION = "2.0.0";

console.log(

    "Marathon Digital Hub",

    "Mining Engine",

    MINING_ENGINE_VERSION,

    "Ready"

);
