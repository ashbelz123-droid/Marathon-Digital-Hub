/* ==========================================
   INCOME PAGE
========================================== */

const db = window.supabaseClient;

let currentUser = null;
let profile = null;
let userMachines = [];

/* ==========================================
   START
========================================== */

document.addEventListener("DOMContentLoaded", init);

async function init(){

    try{

        const { data, error } = await db.auth.getUser();

        if(error) throw error;

        if(!data.user){

            window.location.href = "login.html";
            return;

        }

        currentUser = data.user;

        await loadProfile();

        await loadUserMachines();

        startAutoRefresh();

    }catch(err){

        console.error(err);

        document.getElementById("machineList").innerHTML = `
            <div class="loading">
                Unable to load income page.
            </div>
        `;

    }

}

/* ==========================================
   AUTO REFRESH
========================================== */

function startAutoRefresh(){

    setInterval(async()=>{

        if(currentUser){

            await loadProfile();

            await loadUserMachines();

        }

    },60000);

}

/* ==========================================
   LOAD PROFILE
========================================== */

async function loadProfile(){

    const { data, error } = await db

    .from("profiles")

    .select("*")

    .eq("id", currentUser.id)

    .single();

    if(error){

        console.error(error);

        return;

    }

    profile = data;

}

/* ==========================================
   FORMAT MONEY
========================================== */

function formatMoney(value){

    return "UGX " + Number(value || 0).toLocaleString();

}

/* ==========================================
   CHECK IF TODAY IS ALREADY PAID
========================================== */

function paidToday(lastProfitDate){

    if(!lastProfitDate) return false;

    const last = new Date(lastProfitDate);

    const today = new Date();

    return (

        last.getFullYear() === today.getFullYear() &&

        last.getMonth() === today.getMonth() &&

        last.getDate() === today.getDate()

    );

}

/* ==========================================
   CREDIT USER WALLET
========================================== */

async function creditWallet(amount){

    amount = Number(amount);

    if(amount <= 0) return false;

    const wallet = Number(profile.wallet_balance || 0);

    const totalProfit = Number(profile.total_profit || 0);

    const updateData = {

        wallet_balance: wallet + amount,

        total_profit: totalProfit + amount,

        last_profit_claim: new Date().toISOString()

    };

    const { error } = await db

    .from("profiles")

    .update(updateData)

    .eq("id", currentUser.id);

    if(error){

        console.error(error);

        return false;

    }

    profile.wallet_balance = updateData.wallet_balance;

    profile.total_profit = updateData.total_profit;

    profile.last_profit_claim = updateData.last_profit_claim;

    return true;

}

/* ==========================================
   SAVE WALLET TRANSACTION
========================================== */

async function saveTransaction(amount, machineName){

    await db

    .from("wallet_transactions")

    .insert({

        user_id: currentUser.id,

        type: "Mining Income",

        amount: amount,

        description: `Daily income from ${machineName}`,

        created_at: new Date().toISOString(),

        status: "completed",

        balance_after: profile.wallet_balance

    });

       }

/* ==========================================
   LOAD USER MACHINES
========================================== */

async function loadUserMachines(){

    document.getElementById("machineList").innerHTML = `
        <div class="loading">
            Loading your machines...
        </div>
    `;

    const { data, error } = await db

    .from("user_machines")

    .select(`
        *,
        machines(
            id,
            name,
            price,
            total_return,
            duration_days,
            daily_income,
            series,
            image_url,
            is_vip
        )
    `)

    .eq("user_id", currentUser.id)

    .order("purchase_date", { ascending:false });

    if(error){

        console.error(error);

        document.getElementById("machineList").innerHTML = `
            <div class="loading">
                Failed to load your machines.
            </div>
        `;

        return;

    }

    userMachines = data || [];

    await processMachineIncome();

    renderMachines();

}

/* ==========================================
   PROCESS DAILY INCOME
========================================== */

async function processMachineIncome(){

    const today = new Date();

    const isWeekend =
        today.getDay() === 0 ||
        today.getDay() === 6;

    for(const item of userMachines){

        const machine = item.machines;

        if(!machine) continue;

        if(item.completed) continue;

        const isVIP = machine.is_vip === true;

        if(isWeekend && !isVIP){

            continue;

        }

        if(paidToday(item.last_profit_date)){

            continue;

        }

        const totalReturn =
            Number(machine.total_return);

        let dailyIncome =
            Number(machine.daily_income);

        if(dailyIncome <= 0){

            dailyIncome =
                totalReturn /
                Number(machine.duration_days);

        }

        const earned =
            Number(item.earned_amount || 0);

        if(earned >= totalReturn){

            await completeMachine(item.id);

            continue;

        }

        let credit = dailyIncome;

        if(earned + credit > totalReturn){

            credit =
                totalReturn - earned;

        }

        if(credit <= 0){

            continue;

        }

        const walletUpdated =
            await creditWallet(credit);

        if(!walletUpdated){

            continue;

        }

        await saveTransaction(

            credit,

            machine.name

        );

        const newEarned =
            earned + credit;

        const completedNow =
            newEarned >= totalReturn;

        const updateData = {

            earned_amount: newEarned,

            last_profit_date:
                new Date().toISOString(),

            completed: completedNow,

            status: completedNow
                ? "completed"
                : "active",

            completed_at: completedNow
                ? new Date().toISOString()
                : null

        };

        const { error } = await db

        .from("user_machines")

        .update(updateData)

        .eq("id", item.id);

        if(error){

            console.error(error);

            continue;

        }

        /* Update local data */

        item.earned_amount =
            updateData.earned_amount;

        item.last_profit_date =
            updateData.last_profit_date;

        item.completed =
            updateData.completed;

        item.status =
            updateData.status;

        item.completed_at =
            updateData.completed_at;

    }

}

/* ==========================================
   COMPLETE MACHINE
========================================== */

async function completeMachine(machineId){

    await db

    .from("user_machines")

    .update({

        completed: true,

        status: "completed",

        completed_at:
            new Date().toISOString()

    })

    .eq("id", machineId);

    }

/* ==========================================
   RENDER MACHINES
========================================== */

function renderMachines(){

    const container =
        document.getElementById("machineList");

    container.innerHTML = "";

    if(userMachines.length === 0){

        container.innerHTML = `
            <div class="loading">
                You have not purchased any machines yet.
            </div>
        `;

        updateSummary(0,0,0,0);

        return;

    }

    let activeMachines = 0;
    let dailyIncome = 0;
    let totalIncome = 0;
    let totalReturn = 0;

    const today = new Date();

    const isWeekend =
        today.getDay() === 0 ||
        today.getDay() === 6;

    let html = "";

    userMachines.forEach(item=>{

        const machine = item.machines;

        if(!machine) return;

        const isVIP =
            machine.is_vip === true;

        const completed =
            item.completed === true;

        const earned =
            Number(item.earned_amount || 0);

        const machineReturn =
            Number(machine.total_return);

        const remaining =
            Math.max(0, machineReturn - earned);

        let daily =
            Number(machine.daily_income);

        if(daily <= 0){

            daily =
                machineReturn /
                Number(machine.duration_days);

        }

        const weekendPaused =
            isWeekend &&
            !isVIP &&
            !completed;

        let progress =
            (earned / machineReturn) * 100;

        if(progress > 100){

            progress = 100;

        }

        const daysLeft =
            Math.ceil(remaining / daily);

        let statusText = "🟢 ACTIVE";
        let statusClass = "active";

        if(completed){

            statusText = "🔴 COMPLETED";
            statusClass = "expired";

        }else if(weekendPaused){

            statusText = "🟡 WEEKEND PAUSE";
            statusClass = "weekend";

        }

        if(!completed){

            activeMachines++;

        }

        totalIncome += earned;
        totalReturn += machineReturn;

        if(!completed && !weekendPaused){

            dailyIncome += daily;

        }

        const image =

            machine.image_url &&
            machine.image_url.trim() !== ""

            ? machine.image_url

            : "images/default-machine.png";

        html += `

        <div class="machineCard">

            <div class="machineTop">

                <img
                    src="${image}"
                    class="machineImage"
                    onerror="this.src='images/default-machine.png'">

                <div class="machineInfo">

                    <div class="machineName">

                        ${machine.name}

                        ${isVIP ? '<span class="vipBadge">VIP</span>' : ""}

                    </div>

                    <div class="machineSeries">

                        ${machine.series || "STANDARD"}

                    </div>

                </div>

            </div>

            <div class="infoRow">

                <span class="infoTitle">
                    Purchase Price
                </span>

                <span class="infoValue">
                    ${formatMoney(machine.price)}
                </span>

            </div>

            <div class="infoRow">

                <span class="infoTitle">
                    Earned
                </span>

                <span class="infoValue">
                    ${formatMoney(earned)}
                </span>

            </div>

            <div class="infoRow">

                <span class="infoTitle">
                    Remaining
                </span>

                <span class="infoValue">
                    ${formatMoney(remaining)}
                </span>

            </div>

            <div class="infoRow">

                <span class="infoTitle">
                    Total Return
                </span>

                <span class="infoValue">
                    ${formatMoney(machineReturn)}
                </span>

            </div>

            <div class="infoRow">

                <span class="infoTitle">
                    Daily Income
                </span>

                <span class="infoValue">

                    ${
                        weekendPaused
                        ? "UGX 0"
                        : formatMoney(daily)
                    }

                </span>

            </div>

            <div class="infoRow">

                <span class="infoTitle">
                    Working Days Left
                </span>

                <span class="infoValue">

                    ${
                        completed
                        ? "Completed"
                        : daysLeft + " Days"
                    }

                </span>

            </div>

            <div class="infoRow">

                <span class="infoTitle">
                    Status
                </span>

                <span class="${statusClass}">
                    ${statusText}
                </span>

            </div>

            <div class="progress">

                <div
                    class="progressFill"
                    style="width:${progress}%">
                </div>

            </div>

            <div class="progressText">

                <span>

                    ${Math.floor(progress)}%
                    Complete

                </span>

                <span>

                    ${
                        isVIP
                        ? "VIP Machine"
                        : "Standard Machine"
                    }

                </span>

            </div>

        </div>

        `;

    });

    container.innerHTML = html;

    updateSummary(

        activeMachines,

        dailyIncome,

        totalIncome,

        totalReturn

    );

}

/* ==========================================
   UPDATE SUMMARY
========================================== */

function updateSummary(active,daily,total,returns){

    document.getElementById("activeMachines").textContent =
        active;

    document.getElementById("dailyIncome").textContent =
        formatMoney(daily);

    document.getElementById("totalIncome").textContent =
        formatMoney(total);

    document.getElementById("totalReturn").textContent =
        formatMoney(returns);

}

/* ==========================================
   REFRESH BUTTON
========================================== */

const refreshBtn =
    document.getElementById("refreshBtn");

if(refreshBtn){

    refreshBtn.addEventListener("click", async()=>{

        refreshBtn.disabled = true;

        try{

            await loadProfile();

            await loadUserMachines();

        }catch(err){

            console.error(err);

        }

        refreshBtn.disabled = false;

    });

}

/* ==========================================
   REFRESH WHEN PAGE BECOMES ACTIVE
========================================== */

document.addEventListener("visibilitychange", async()=>{

    if(document.visibilityState === "visible"){

        await loadProfile();

        await loadUserMachines();

    }

});

window.addEventListener("focus", async()=>{

    await loadProfile();

    await loadUserMachines();

});

/* ==========================================
   IMAGE FALLBACK
========================================== */

document.addEventListener("error",function(e){

    if(e.target.tagName === "IMG"){

        e.target.src = "images/default-machine.png";

    }

},true);

/* ==========================================
   AUTH LISTENER
========================================== */

db.auth.onAuthStateChange((event)=>{

    if(event === "SIGNED_OUT"){

        window.location.href = "login.html";

    }

});

/* ==========================================
   END
========================================== */
