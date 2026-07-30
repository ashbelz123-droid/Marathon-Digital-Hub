/* ==========================================
   MARATHON DIGITAL HUB
   MINING ENGINE
========================================== */

const db = window.supabaseClient;

/* ==========================================
   CHECK DAILY MINING INCOME
========================================== */

async function checkMiningIncome(){

    const { data:{ user } } = await db.auth.getUser();

    if(!user) return;

    const currentUser = user;

    /* Load Profile */

    const { data: profile } = await db

    .from("profiles")

    .select("*")

    .eq("id", currentUser.id)

    .single();

    if(!profile) return;

    /* Load User Machines */

    const { data: machines } = await db

    .from("user_machines")

    .select(`
        *,
        machines(
            id,
            name,
            total_return,
            duration_days,
            daily_income,
            is_vip
        )
    `)

    .eq("user_id", currentUser.id);

    if(!machines) return;

    await processMiningIncome(

        currentUser,

        profile,

        machines

    );

}

/* ==========================================
   PROCESS MINING INCOME
========================================== */

async function processMiningIncome(currentUser, profile, userMachines){

    const today = new Date();

    const isWeekend =
        today.getDay() === 0 ||
        today.getDay() === 6;

    for(const item of userMachines){

        const machine = item.machines;

        if(!machine) continue;

        if(item.completed) continue;

        const isVIP =
            machine.is_vip === true;

        /* Skip non-VIP machines on weekends */

        if(isWeekend && !isVIP){

            continue;

        }

        /* Already paid today */

        if(item.last_profit_date){

            const last =
                new Date(item.last_profit_date);

            if(

                last.getFullYear() === today.getFullYear() &&

                last.getMonth() === today.getMonth() &&

                last.getDate() === today.getDate()

            ){

                continue;

            }

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

        await creditMiningProfit(

            currentUser.id,

            profile,

            credit,

            machine.name

        );

        const newEarned =
            earned + credit;

        const completedNow =
            newEarned >= totalReturn;

        await db

        .from("user_machines")

        .update({

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

        })

        .eq("id", item.id);

    }

}

/* ==========================================
   CREDIT MINING PROFIT
========================================== */

async function creditMiningProfit(userId, profile, amount, machineName){

    amount = Number(amount);

    if(amount <= 0) return;

    const newWallet =
        Number(profile.wallet_balance || 0) + amount;

    const newProfit =
        Number(profile.total_profit || 0) + amount;

    const { error } = await db

    .from("profiles")

    .update({

        wallet_balance: newWallet,

        total_profit: newProfit,

        last_profit_claim: new Date().toISOString()

    })

    .eq("id", userId);

    if(error){

        console.error("Wallet Update Error:", error);

        return;

    }

    profile.wallet_balance = newWallet;

    profile.total_profit = newProfit;

    profile.last_profit_claim = new Date().toISOString();

    await db

    .from("wallet_transactions")

    .insert({

        user_id: userId,

        type: "Mining Income",

        amount: amount,

        description: `Daily mining income from ${machineName}`,

        status: "completed",

        created_at: new Date().toISOString(),

        balance_after: newWallet

    });

}

/* ==========================================
   COMPLETE MACHINE
========================================== */

async function completeMachine(machineId){

    const { error } = await db

    .from("user_machines")

    .update({

        completed: true,

        status: "completed",

        completed_at: new Date().toISOString()

    })

    .eq("id", machineId);

    if(error){

        console.error("Machine Complete Error:", error);

    }

}

/* ==========================================
   START ENGINE
========================================== */

document.addEventListener("DOMContentLoaded",()=>{

    checkMiningIncome();

});
