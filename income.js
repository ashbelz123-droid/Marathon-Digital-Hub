/* ==========================================
   MARATHON DIGITAL HUB
   INCOME.JS
========================================== */

const db = window.supabaseClient;

let currentUser = null;
let profile = null;
let userMachines = [];

/* ==========================================
   START PAGE
========================================== */

document.addEventListener("DOMContentLoaded", init);

async function init(){

    try{

        const { data:{ user }, error } = await db.auth.getUser();

        if(error){

            console.log(error);
            return;

        }

        if(!user){

            window.location.href="login.html";
            return;

        }

        currentUser = user;

        await loadProfile();

        await loadMachines();

    }catch(err){

        console.log(err);

        document.getElementById("machineList").innerHTML=`
            <div class="loading">
                Unable to load page.
            </div>
        `;

    }

}

/* ==========================================
   LOAD PROFILE
========================================== */

async function loadProfile(){

    const { data,error } = await db

    .from("profiles")

    .select("*")

    .eq("id",currentUser.id)

    .single();

    if(error){

        console.log(error);
        return;

    }

    profile=data;

}

/* ==========================================
   LOAD USER MACHINES
========================================== */

async function loadMachines(){

    document.getElementById("machineList").innerHTML=`

        <div class="loading">

            Loading your machines...

        </div>

    `;

    const { data,error } = await db

    .from("user_machines")

    .select(`
        *,
        machines(
            id,
            name,
            series,
            image_url,
            price,
            total_return,
            duration_days,
            is_vip
        )
    `)

    .eq("user_id",currentUser.id)

    .order("purchase_date",{ascending:false});

    if(error){

        console.log(error);

        document.getElementById("machineList").innerHTML=`

            <div class="loading">

                Failed to load your machines.

            </div>

        `;

        return;

    }

    userMachines = data || [];

    renderMachines();

}

/* ==========================================
   RENDER MACHINES
========================================== */

function renderMachines(){

    const container = document.getElementById("machineList");

    container.innerHTML = "";

    if(userMachines.length === 0){

        container.innerHTML = `
            <div class="loading">
                You have not purchased any machines yet.
            </div>
        `;

        return;

    }

    let activeMachines = 0;
    let totalIncome = 0;
    let totalReturn = 0;
    let dailyIncome = 0;

    const today = new Date();

    const isWeekend =
        today.getDay() === 0 || today.getDay() === 6;

    userMachines.forEach(item=>{

        const machine = item.machines;

        if(!machine) return;

        const purchaseDate = new Date(item.purchase_date);

        const isVIP = machine.is_vip === true;

        const totalReturnMachine =
            Number(machine.total_return);

        const duration =
            Number(machine.duration_days);

        const dailyReturn =
            totalReturnMachine / duration;

        /* Count earning days */

        let earningDays = 0;

        let current = new Date(purchaseDate);

        while(current <= today && earningDays < duration){

            const day = current.getDay();

            if(isVIP || (day !== 0 && day !== 6)){

                earningDays++;

            }

            current.setDate(current.getDate()+1);

        }

        const expired =
            earningDays >= duration;

        const earned = Math.min(
            totalReturnMachine,
            dailyReturn * earningDays
        );

        const remaining = Math.max(
            0,
            totalReturnMachine - earned
        );

        const progress = Math.min(
            100,
            (earned / totalReturnMachine) * 100
        );

        const daysRemaining = Math.max(
            0,
            duration - earningDays
        );

        const weekendDisabled =
            isWeekend && !isVIP && !expired;

        let statusText = "🟢 ACTIVE";
        let statusClass = "active";

        if(expired){

            statusText = "🔴 EXPIRED";
            statusClass = "expired";

        }else if(weekendDisabled){

            statusText = "🟠 DISABLED (WEEKEND)";
            statusClass = "weekend";

        }

        if(!expired){

            activeMachines++;

        }

        totalIncome += earned;

        totalReturn += totalReturnMachine;

        if(!expired && !weekendDisabled){

            dailyIncome += dailyReturn;

        }

        const image =
            machine.image_url &&
            machine.image_url.trim() !== ""
            ? machine.image_url
            : "images/default-machine.png";

                container.innerHTML += `

        <div class="machineCard">

            <div class="machineTop">

                <img
                    src="${image}"
                    class="machineImage"
                    onerror="this.src='images/default-machine.png'">

                <div class="machineInfo">

                    <div class="machineName">

                        ${machine.name}

                        ${isVIP ? '<span class="vipBadge">VIP</span>' : ''}

                    </div>

                    <div class="machineSeries">

                        ${machine.series || "STANDARD"}

                    </div>

                </div>

            </div>

            <div class="infoRow">

                <span class="infoTitle">Purchase Price</span>

                <span class="infoValue">

                    UGX ${Number(machine.price).toLocaleString()}

                </span>

            </div>

            <div class="infoRow">

                <span class="infoTitle">Earned</span>

                <span class="infoValue">

                    UGX ${Math.floor(earned).toLocaleString()}

                </span>

            </div>

            <div class="infoRow">

                <span class="infoTitle">Remaining</span>

                <span class="infoValue">

                    UGX ${Math.floor(remaining).toLocaleString()}

                </span>

            </div>

            <div class="infoRow">

                <span class="infoTitle">Total Return</span>

                <span class="infoValue">

                    UGX ${totalReturnMachine.toLocaleString()}

                </span>

            </div>

            <div class="infoRow">

                <span class="infoTitle">Daily Income</span>

                <span class="infoValue">

                    ${weekendDisabled
                        ? "UGX 0"
                        : "UGX " + Math.floor(dailyReturn).toLocaleString()}

                </span>

            </div>

            <div class="infoRow">

                <span class="infoTitle">Working Days Left</span>

                <span class="infoValue">

                    ${expired ? "Completed" : daysRemaining + " Days"}

                </span>

            </div>

            <div class="infoRow">

                <span class="infoTitle">Status</span>

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

                    ${Math.floor(progress)}% Complete

                </span>

                <span>

                    ${isVIP ? "VIP Machine" : "Standard Machine"}

                </span>

            </div>

        </div>

        `;

    });

    document.getElementById("activeMachines").textContent =
        activeMachines;

    document.getElementById("dailyIncome").textContent =
        "UGX " + Math.floor(dailyIncome).toLocaleString();

    document.getElementById("totalIncome").textContent =
        "UGX " + Math.floor(totalIncome).toLocaleString();

    document.getElementById("totalReturn").textContent =
        "UGX " + Math.floor(totalReturn).toLocaleString();

}
    });

        }

