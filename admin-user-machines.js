/*==================================================
ADMIN USER MACHINES
PART 1
INITIALIZATION
==================================================*/

/*==================================================
SUPABASE
==================================================*/

const db = window.supabaseClient;

/*==================================================
GLOBAL DATA
==================================================*/

let users = [];
let machines = [];
let userMachines = [];
let selectedUser = null;
let selectedMachine = null;

/*==================================================
DOM ELEMENTS
==================================================*/

/* Search */

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

/* Statistics */

const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const totalMachines = document.getElementById("totalMachines");
const vipUsers = document.getElementById("vipUsers");
const userCount = document.getElementById("userCount");

/* Containers */

const usersContainer = document.getElementById("usersContainer");
const emptyState = document.getElementById("emptyState");
const userDashboard = document.getElementById("userDashboard");
const machineList = document.getElementById("machineList");
const activityList = document.getElementById("activityList");

/*==================================================
START APP
==================================================*/

document.addEventListener("DOMContentLoaded", async () => {

    try{

        showLoading(true);

        await loadDashboard();

        registerEvents();

        showLoading(false);

        toast("Admin panel loaded");

    }

    catch(error){

        console.error(error);

        showLoading(false);

        toast(error.message,"error");

    }

});

/*==================================================
LOAD EVERYTHING
==================================================*/

async function loadDashboard(){

    await loadUsers();

    await loadMachines();

}

/*==================================================
LOAD USERS
==================================================*/

async function loadUsers(){

    const {data,error} = await db
    .from("profiles")
    .select("*")
    .order("created_at",{ascending:false});

    if(error) throw error;

    users = data || [];

    renderUsers(users);

    updateStatistics();

}

/*==================================================
LOAD MACHINES
==================================================*/

async function loadMachines(){

    const {data,error} = await db
    .from("machines")
    .select("*")
    .eq("status",true)
    .order("display_order",{ascending:true});

    if(error) throw error;

    machines = data || [];

}

/*==================================================
STATISTICS
==================================================*/

function updateStatistics(){

    totalUsers.textContent = users.length;

    activeUsers.textContent =
    users.filter(
        u=>u.account_status==="active"
    ).length;

    vipUsers.textContent =
    users.filter(
        u=>u.membership==="VIP"
    ).length;

    userCount.textContent =
    `${users.length} Members`;

}

/*==================================================
PLACEHOLDERS
(FILLED IN NEXT PARTS)
==================================================*/

function registerEvents(){}

function renderUsers(){}

function toast(){}

function showLoading(){}

function selectUser(){}

/*==================================================
PART 2
EVENTS + USERS
==================================================*/

/*==================================================
REGISTER EVENTS
==================================================*/

function registerEvents(){

    searchBtn.onclick = searchUsers;

    searchInput.addEventListener("keyup",(e)=>{

        if(e.key==="Enter"){

            searchUsers();

        }

    });

}

/*==================================================
SEARCH USERS
==================================================*/

function searchUsers(){

    const keyword = searchInput.value
    .trim()
    .toLowerCase();

    if(!keyword){

        renderUsers(users);

        return;

    }

    const filtered = users.filter(user=>{

        return (

            (user.fullname||"")
            .toLowerCase()
            .includes(keyword)

            ||

            (user.phone||"")
            .toLowerCase()
            .includes(keyword)

            ||

            (user.email||"")
            .toLowerCase()
            .includes(keyword)

            ||

            (user.referral_code||"")
            .toLowerCase()
            .includes(keyword)

        );

    });

    renderUsers(filtered);

}

/*==================================================
RENDER USERS
==================================================*/

function renderUsers(list){

    usersContainer.innerHTML="";

    if(list.length===0){

        usersContainer.innerHTML=`

        <div class="emptyStateSmall">

            <div class="emptyIcon">👤</div>

            <h3>No Users Found</h3>

            <p>Try another search.</p>

        </div>

        `;

        return;

    }

    list.forEach(user=>{

        const card=document.createElement("div");

        card.className="userCard";

        if(selectedUser && selectedUser.id===user.id){

            card.classList.add("active");

        }

        card.innerHTML=`

        <img

        class="userAvatar"

        src="${user.avatar_url || "images/default-avatar.png"}">

        <div class="userInfo">

            <h3>${user.fullname || "Unknown User"}</h3>

            <p>${user.phone || user.email || "-"}</p>

            <div class="userTags">

                <span class="userTag">

                    ${user.membership || "Standard"}

                </span>

                <span class="userTag">

                    ${user.account_status || "active"}

                </span>

            </div>

        </div>

        <div class="userArrow">

            ›

        </div>

        `;

        card.onclick=()=>{

            selectUser(user);

        };

        usersContainer.appendChild(card);

    });

}

/*==================================================
SELECT USER
==================================================*/

async function selectUser(user){

    selectedUser=user;

    renderUsers(users);

    emptyState.classList.add("hidden");

    userDashboard.classList.remove("hidden");

    fillUserProfile();

    await loadUserMachines();

    await loadUserActivity();

}

/*==================================================
PROFILE
==================================================*/

function fillUserProfile(){

    document.getElementById("userAvatar").src =
    selectedUser.avatar_url ||
    "images/default-avatar.png";

    document.getElementById("userName").textContent =
    selectedUser.fullname || "-";

    document.getElementById("userPhone").textContent =
    selectedUser.phone ||
    selectedUser.email ||
    "-";

    document.getElementById("membershipBadge").textContent =
    selectedUser.membership || "Standard";

    document.getElementById("statusBadge").textContent =
    selectedUser.account_status || "active";

    document.getElementById("kycBadge").textContent =
    selectedUser.kyc_status || "Not Verified";

    document.getElementById("walletBalance").textContent =
    money(selectedUser.wallet_balance);

    document.getElementById("totalInvested").textContent =
    money(selectedUser.total_invested);

    document.getElementById("totalProfit").textContent =
    money(selectedUser.total_profit);

    document.getElementById("ownedMachines").textContent="0";

}

/*==================================================
MONEY
==================================================*/

function money(value){

    return "UGX " +

    Number(value || 0)

    .toLocaleString();

}

/*==================================================
PART 3
LOAD USER MACHINES
==================================================*/

/*==================================================
LOAD USER MACHINES
==================================================*/

async function loadUserMachines(){

    if(!selectedUser) return;

    try{

        const {data,error}=await db
        .from("user_machines")
        .select(`
            *,
            machines(*)
        `)
        .eq("user_id",selectedUser.id)
        .order("purchase_date",{ascending:false});

        if(error) throw error;

        userMachines=data||[];

        document.getElementById("ownedMachines").textContent=
        userMachines.length;

        updateMachineSummary();

        renderMachines(userMachines);

    }

    catch(error){

        console.error(error);

        toast("Failed to load machines","error");

    }

}

/*==================================================
SUMMARY
==================================================*/

function updateMachineSummary(){

    document.getElementById("summaryMachines").textContent=
    userMachines.length;

    document.getElementById("summaryRunning").textContent=
    userMachines.filter(
        m=>m.status==="active"
    ).length;

    document.getElementById("summaryCompleted").textContent=
    userMachines.filter(
        m=>m.completed===true
    ).length;

    let totalPaid=0;

    userMachines.forEach(machine=>{

        totalPaid+=Number(
            machine.amount_paid||0
        );

    });

    document.getElementById("summaryPaid").textContent=
    money(totalPaid);

}

/*==================================================
RENDER MACHINES
==================================================*/

function renderMachines(list){

    machineList.innerHTML="";

    const empty=document.getElementById("machineEmpty");

    if(list.length===0){

        empty.classList.remove("hidden");

        return;

    }

    empty.classList.add("hidden");

    list.forEach(machine=>{

        const info=machine.machines||{};

        const progress=getProgress(

            machine.purchase_date,

            machine.expiry_date

        );

        const card=document.createElement("div");

        card.className="machineCard";

        card.innerHTML=`

        <img

        class="machineImage"

        src="${machine.machine_image||
        info.image_url||
        'images/default-machine.png'}">

        <div class="machineInfo">

            <h3>

                ${machine.machine_name||
                info.name||
                'Machine'}

            </h3>

            <p>

                ${info.series||'-'}

            </p>

            <div class="machineBadges">

                <span class="machineBadge active">

                    ${machine.status}

                </span>

                ${machine.is_vip ?

                '<span class="machineBadge vip">VIP</span>'

                :''}

            </div>

            <p>

                Purchase

                <strong>

                    ${money(machine.amount_paid)}

                </strong>

            </p>

            <p>

                Earned

                <strong>

                    ${money(machine.earned_amount)}

                </strong>

            </p>

            <div class="machineProgress">

                <span>

                    ${progress.remainingDays}

                    Days Remaining

                </span>

                <div class="progressBar">

                    <div

                    class="progressFill"

                    style="width:${progress.percent}%">

                    </div>

                </div>

            </div>

        </div>

        <button

        class="machineAction">

        ⋮

        </button>

        `;

        card.onclick=()=>{

            selectedMachine=machine;

            openMachineDetails();

        };

        card.querySelector(".machineAction")

        .onclick=(e)=>{

            e.stopPropagation();

            selectedMachine=machine;

            openEditMachine();

        };

        machineList.appendChild(card);

    });

}

/*==================================================
PROGRESS
==================================================*/

function getProgress(start,end){

    if(!start||!end){

        return{

            percent:0,

            remainingDays:0

        };

    }

    const startDate=new Date(start);

    const endDate=new Date(end);

    const today=new Date();

    const total=endDate-startDate;

    const passed=today-startDate;

    let percent=(passed/total)*100;

    percent=Math.max(

        0,

        Math.min(percent,100)

    );

    const remaining=Math.max(

        0,

        Math.ceil(

        (endDate-today)/86400000)

    );

    return{

        percent,

        remainingDays:remaining

    };

}

/*==================================================
PLACEHOLDERS
(PART 4)
==================================================*/

function openMachineDetails(){}

function openEditMachine(){}

async function loadUserActivity(){}

/*==================================================
PART 4
EDIT / SAVE MACHINE
==================================================*/

/*==================================================
OPEN EDIT MACHINE
==================================================*/

function openEditMachine(){

    if(!selectedMachine) return;

    document
    .getElementById("machineModal")
    .classList.remove("hidden");

    document
    .getElementById("machineModalTitle")
    .textContent="Edit Machine";

    loadMachineOptions();

    document.getElementById("machineSelect").value=
    selectedMachine.machine_id;

    document.getElementById("machineAmountPaid").value=
    selectedMachine.amount_paid||0;

    document.getElementById("machinePurchaseDate").value=
    selectedMachine.purchase_date
    ?
    selectedMachine.purchase_date.substring(0,10)
    :
    "";

    document.getElementById("machineExpiryDate").value=
    selectedMachine.expiry_date
    ?
    selectedMachine.expiry_date.substring(0,10)
    :
    "";

    document.getElementById("machineStatus").value=
    selectedMachine.status;

    document.getElementById("machineEarned").value=
    selectedMachine.earned_amount||0;

    document.getElementById("machineVip").checked=
    selectedMachine.is_vip;

}

/*==================================================
LOAD MACHINE OPTIONS
==================================================*/

function loadMachineOptions(){

    const select=document.getElementById("machineSelect");

    select.innerHTML="";

    machines.forEach(machine=>{

        select.innerHTML+=`

        <option value="${machine.id}">

        ${machine.name}

        </option>

        `;

    });

}

/*==================================================
SAVE MACHINE
==================================================*/

document.getElementById("saveMachineBtn").onclick=

async()=>{

    if(!selectedMachine) return;

    try{

        const values={

            machine_id:
            document.getElementById("machineSelect").value,

            amount_paid:Number(

                document.getElementById("machineAmountPaid").value

            ),

            purchase_date:

            document.getElementById("machinePurchaseDate").value,

            expiry_date:

            document.getElementById("machineExpiryDate").value,

            status:

            document.getElementById("machineStatus").value,

            earned_amount:Number(

                document.getElementById("machineEarned").value

            ),

            is_vip:

            document.getElementById("machineVip").checked

        };

        const machineInfo=

        machines.find(

        m=>m.id===values.machine_id

        );

        values.machine_name=

        machineInfo.name;

        values.machine_image=

        machineInfo.image_url;

        const {error}=await db

        .from("user_machines")

        .update(values)

        .eq("id",selectedMachine.id);

        if(error) throw error;

        toast("Machine updated");

        closeMachineModal();

        await loadUserMachines();

    }

    catch(error){

        console.error(error);

        toast(error.message,"error");

    }

};

/*==================================================
DELETE MACHINE
==================================================*/

document.getElementById("deleteMachineBtn").onclick=

async()=>{

    if(!selectedMachine){

    await assignMachine();

    return;

    }

    if(

    !confirm(

    "Delete this machine?"

    )

    ) return;

    try{

        const {error}=await db

        .from("user_machines")

        .delete()

        .eq("id",selectedMachine.id);

        if(error) throw error;

        toast("Machine deleted");

        closeMachineModal();

        await loadUserMachines();

    }

    catch(error){

        toast(error.message,"error");

    }

};

/*==================================================
CLOSE MODAL
==================================================*/

document.getElementById("closeMachineModal").onclick=

closeMachineModal;

function closeMachineModal(){

    document

    .getElementById("machineModal")

    .classList.add("hidden");

        }

/*==================================================
PART 5
ASSIGN MACHINE
==================================================*/

/*==================================================
OPEN ASSIGN MACHINE
==================================================*/

document.getElementById("assignMachineBtn").onclick =
openAssignMachine;

document.getElementById("addMachineBtn").onclick =
openAssignMachine;

document.getElementById("emptyAssignBtn").onclick =
openAssignMachine;

function openAssignMachine(){

    if(!selectedUser){

        toast("Select a user first","error");

        return;

    }

    selectedMachine = null;

    document.getElementById(
        "machineModalTitle"
    ).textContent="Assign Machine";

    loadMachineOptions();

    document.getElementById(
        "machineSelect"
    ).selectedIndex=0;

    const firstMachine = machines[0];

    const today = new Date();

    const expiry = new Date();

    expiry.setDate(

        today.getDate() +

        Number(firstMachine?.duration_days || 0)

    );

    document.getElementById(
        "machineAmountPaid"
    ).value = firstMachine?.price || 0;

    document.getElementById(
        "machinePurchaseDate"
    ).value = today.toISOString().slice(0,10);

    document.getElementById(
        "machineExpiryDate"
    ).value = expiry.toISOString().slice(0,10);

    document.getElementById(
        "machineStatus"
    ).value="active";

    document.getElementById(
        "machineEarned"
    ).value=0;

    document.getElementById(
        "machineVip"
    ).checked = firstMachine?.is_vip || false;

    document.getElementById(
        "machineModal"
    ).classList.remove("hidden");

}

/*==================================================
AUTO UPDATE WHEN MACHINE CHANGES
==================================================*/

document.getElementById(
"machineSelect"
).onchange = function(){

    const machine = machines.find(

        m=>m.id===this.value

    );

    if(!machine) return;

    const purchase = new Date(

        document.getElementById(
        "machinePurchaseDate"
        ).value

    );

    const expiry = new Date(purchase);

    expiry.setDate(

        expiry.getDate() +

        Number(machine.duration_days)

    );

    document.getElementById(
        "machineAmountPaid"
    ).value = machine.price;

    document.getElementById(
        "machineExpiryDate"
    ).value = expiry.toISOString().slice(0,10);

    document.getElementById(
        "machineVip"
    ).checked = machine.is_vip;

};

/*==================================================
SAVE NEW MACHINE
==================================================*/

async function assignMachine(){

    const machine = machines.find(

        m=>m.id===

        document.getElementById(
        "machineSelect"
        ).value

    );

    if(!machine){

        toast("Choose a machine","error");

        return;

    }

    try{

        const paid = Number(

            document.getElementById(
            "machineAmountPaid"
            ).value

        );

        const {error} = await db

        .from("user_machines")

        .insert({

            user_id:selectedUser.id,

            machine_id:machine.id,

            machine_name:machine.name,

            machine_image:machine.image_url,

            amount_paid:paid,

            purchase_date:

            document.getElementById(
            "machinePurchaseDate"
            ).value,

            expiry_date:

            document.getElementById(
            "machineExpiryDate"
            ).value,

            earned_amount:Number(

            document.getElementById(
            "machineEarned"
            ).value

            ),

            status:

            document.getElementById(
            "machineStatus"
            ).value,

            completed:false,

            is_vip:

            document.getElementById(
            "machineVip"
            ).checked

        });

        if(error) throw error;

        await db

        .from("profiles")

        .update({

            total_invested:

            Number(

            selectedUser.total_invested||0

            ) + paid

        })

        .eq("id",selectedUser.id);

        toast("Machine assigned");

        closeMachineModal();

        await selectUser(selectedUser);

    }

    catch(error){

        console.error(error);

        toast(error.message,"error");

    }

    }
