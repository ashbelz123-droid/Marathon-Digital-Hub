/*==================================================
PART 1
MACHINE MODAL VARIABLES
==================================================*/

/*==================================================
MODAL ELEMENTS
==================================================*/

const machineModal =
document.getElementById("machineModal");

const machineModalTitle =
document.getElementById("machineModalTitle");

const machineSelect =
document.getElementById("machineSelect");

const machineAmountPaid =
document.getElementById("machineAmountPaid");

const machinePurchaseDate =
document.getElementById("machinePurchaseDate");

const machineExpiryDate =
document.getElementById("machineExpiryDate");

const machineStatus =
document.getElementById("machineStatus");

const machineEarned =
document.getElementById("machineEarned");

const machineVip =
document.getElementById("machineVip");

const saveMachineBtn =
document.getElementById("saveMachineBtn");

const deleteMachineBtn =
document.getElementById("deleteMachineBtn");

const closeMachineModal =
document.getElementById("closeMachineModal");

/*==================================================
GLOBAL VARIABLES
==================================================*/

let editingMachine = false;

/*==================================================
PART 2
OPEN & CLOSE MACHINE MODAL
==================================================*/

/*==================================================
OPEN ASSIGN MACHINE
==================================================*/

document.getElementById("addMachineBtn").onclick = () => {

    if (!selectedUser) {

        showToast("Select a user first", "error");

        return;

    }

    editingMachine = false;

    machineModalTitle.textContent = "Assign Machine";

    machineModal.classList.remove("hidden");

    loadMachineDropdown();

};

/*==================================================
ASSIGN BUTTON
==================================================*/

document.getElementById("assignMachineBtn").onclick = () => {

    if (!selectedUser) {

        showToast("Select a user first", "error");

        return;

    }

    editingMachine = false;

    machineModalTitle.textContent = "Assign Machine";

    machineModal.classList.remove("hidden");

    loadMachineDropdown();

};

/*==================================================
EMPTY STATE BUTTON
==================================================*/

document.getElementById("emptyAssignBtn").onclick = () => {

    if (!selectedUser) {

        showToast("Select a user first", "error");

        return;

    }

    editingMachine = false;

    machineModalTitle.textContent = "Assign Machine";

    machineModal.classList.remove("hidden");

    loadMachineDropdown();

};

/*==================================================
CLOSE MACHINE MODAL
==================================================*/

closeMachineModal.onclick = () => {

    machineModal.classList.add("hidden");

};

document.getElementById("overlay").onclick = () => {

    machineModal.classList.add("hidden");

};

/*==================================================
PART 3
LOAD MACHINE DROPDOWN
==================================================*/

/*==================================================
LOAD MACHINES
==================================================*/

function loadMachineDropdown(){

machineSelect.innerHTML="";

machines.forEach(machine=>{

const option=document.createElement("option");

option.value=machine.id;

option.textContent=

`${machine.name} • UGX ${Number(machine.price||0).toLocaleString()}`;

machineSelect.appendChild(option);

});

if(machines.length){

machineSelect.value=machines[0].id;

fillMachineData(machines[0]);

}

}

/*==================================================
WHEN MACHINE CHANGES
==================================================*/

machineSelect.onchange=()=>{

const machine=machines.find(

m=>m.id==machineSelect.value

);

if(machine){

fillMachineData(machine);

}

};

/*==================================================
PART 4
AUTO FILL MACHINE DETAILS
==================================================*/

/*==================================================
FILL MACHINE DATA
==================================================*/

function fillMachineData(machine){

if(!machine) return;

/* Purchase Amount */

machineAmountPaid.value=

machine.price||0;

/* Earned Amount */

machineEarned.value=0;

/* Status */

machineStatus.value="active";

/* VIP */

machineVip.checked=

machine.is_vip||false;

/* Purchase Date */

const today=new Date();

machinePurchaseDate.value=

today.toISOString().split("T")[0];

/* Expiry Date */

const expiry=new Date(today);

expiry.setDate(

expiry.getDate()+

Number(machine.duration_days||0)

);

machineExpiryDate.value=

expiry.toISOString().split("T")[0];

}

/*==================================================
PART 5
SAVE MACHINE
==================================================*/

/*==================================================
SAVE MACHINE
==================================================*/

saveMachineBtn.onclick = async () => {

if(!selectedUser){

showToast("Select a user first","error");

return;

}

const machine=machines.find(

m=>m.id==machineSelect.value

);

if(!machine){

showToast("Select a machine","error");

return;

}

const machineData={

user_id:selectedUser.id,

machine_id:machine.id,

machine_name:machine.name,

machine_image:machine.image_url,

amount_paid:Number(machineAmountPaid.value),

earned_amount:Number(machineEarned.value),

purchase_date:machinePurchaseDate.value,

expiry_date:machineExpiryDate.value,

status:machineStatus.value,

completed:machineStatus.value==="completed",

is_vip:machineVip.checked,

daily_income:machine.daily_income,

total_return:machine.total_return

};

if(editingMachine){

updateMachine(machineData);

}else{

assignMachine(machineData);

}

};

/*==================================================
PART 6
ASSIGN MACHINE
==================================================*/

/*==================================================
ASSIGN MACHINE
==================================================*/

async function assignMachine(machineData){

try{

const {error}=await db

.from("user_machines")

.insert(machineData);

if(error) throw error;

/*====================================
UPDATE USER INVESTMENT
====================================*/

const invested=

Number(selectedUser.total_invested||0)+

Number(machineData.amount_paid);

const {error:updateError}=await db

.from("profiles")

.update({

total_invested:invested

})

.eq("id",selectedUser.id);

if(updateError) throw updateError;

showToast(

"Machine assigned successfully"

);

machineModal.classList.add("hidden");

await selectUser(selectedUser);

}

catch(error){

console.error(error);

showToast(error.message,"error");

}

}

/*==================================================
PART 7
UPDATE MACHINE
==================================================*/

/*==================================================
UPDATE MACHINE
==================================================*/

async function updateMachine(machineData){

try{

const {error}=await db

.from("user_machines")

.update({

amount_paid:machineData.amount_paid,

earned_amount:machineData.earned_amount,

purchase_date:machineData.purchase_date,

expiry_date:machineData.expiry_date,

status:machineData.status,

completed:machineData.completed,

is_vip:machineData.is_vip,

daily_income:machineData.daily_income,

total_return:machineData.total_return

})

.eq("id",selectedMachine.id);

if(error) throw error;

showToast(

"Machine updated successfully"

);

machineModal.classList.add("hidden");

await selectUser(selectedUser);

}

catch(error){

console.error(error);

showToast(error.message,"error");

}

}

/*==================================================
PART 8
EDIT MACHINE
==================================================*/

/*==================================================
OPEN EDIT MACHINE
==================================================*/

function editMachine(){

if(!selectedMachine){

showToast("Select a machine first","error");

return;

}

editingMachine=true;

machineModalTitle.textContent=

"Edit Machine";

machineModal.classList.remove("hidden");

loadMachineDropdown();

machineSelect.value=

selectedMachine.machine_id;

machineAmountPaid.value=

selectedMachine.amount_paid||0;

machineEarned.value=

selectedMachine.earned_amount||0;

machinePurchaseDate.value=

String(selectedMachine.purchase_date)

.substring(0,10);

machineExpiryDate.value=

String(selectedMachine.expiry_date)

.substring(0,10);

machineStatus.value=

selectedMachine.status||"active";

machineVip.checked=

selectedMachine.is_vip||false;

}

/*==================================================
OPEN EDIT FROM MACHINE CARD
==================================================*/

document.getElementById(

"editMachineBtn"

).onclick=()=>{

editMachine();

};

/*==================================================
PART 9
DELETE MACHINE
==================================================*/

/*==================================================
DELETE MACHINE
==================================================*/

document.getElementById(

"deleteMachineBtn"

).onclick=async()=>{

if(!selectedMachine){

showToast(

"No machine selected",

"error"

);

return;

}

const confirmDelete=confirm(

"Are you sure you want to permanently delete this machine?"

);

if(!confirmDelete) return;

try{

const {error}=await db

.from("user_machines")

.delete()

.eq(

"id",

selectedMachine.id

);

if(error) throw error;

/*====================================
UPDATE USER INVESTMENT
====================================*/

const invested=Math.max(

0,

Number(selectedUser.total_invested||0)-

Number(selectedMachine.amount_paid||0)

);

await db

.from("profiles")

.update({

total_invested:invested

})

.eq(

"id",

selectedUser.id

);

showToast(

"Machine deleted successfully"

);

machineModal.classList.add("hidden");

selectedMachine=null;

await selectUser(selectedUser);

}

catch(error){

console.error(error);

showToast(

error.message,

"error"

);

}

};

/*==================================================
PART 10
EXTEND MACHINE
==================================================*/

/*==================================================
EXTEND MACHINE
==================================================*/

document.getElementById(

"extendMachineBtn"

).onclick=async()=>{

if(!selectedMachine){

showToast(

"No machine selected",

"error"

);

return;

}

const days=prompt(

"Enter number of days to extend",

30

);

if(days===null) return;

if(isNaN(days)||Number(days)<=0){

showToast(

"Invalid number of days",

"error"

);

return;

}

const expiryDate=new Date(

selectedMachine.expiry_date

);

expiryDate.setDate(

expiryDate.getDate()+

Number(days)

);

try{

const {error}=await db

.from("user_machines")

.update({

expiry_date:

expiryDate

.toISOString()

.split("T")[0]

})

.eq(

"id",

selectedMachine.id

);

if(error) throw error;

showToast(

"Machine extended successfully"

);

machineModal.classList.add("hidden");

await selectUser(selectedUser);

}

catch(error){

console.error(error);

showToast(

error.message,

"error"

);

}

};

/*==================================================
PART 11
CHANGE MACHINE STATUS
==================================================*/

/*==================================================
CHANGE STATUS
==================================================*/

async function changeMachineStatus(status){

if(!selectedMachine){

showToast(

"No machine selected",

"error"

);

return;

}

try{

const completed=

status==="completed";

const {error}=await db

.from("user_machines")

.update({

status:status,

completed:completed

})

.eq(

"id",

selectedMachine.id

);

if(error) throw error;

showToast(

"Machine status updated"

);

machineModal.classList.add("hidden");

await selectUser(selectedUser);

}

catch(error){

console.error(error);

showToast(

error.message,

"error"

);

}

}

/*==================================================
STATUS SELECT
==================================================*/

machineStatus.onchange=()=>{

if(machineStatus.value==="completed"){

machineEarned.readOnly=true;

}else{

machineEarned.readOnly=false;

}

};

/*==================================================
QUICK STATUS BUTTONS
==================================================*/

document.getElementById(

"toggleStatusBtn"

).onclick=()=>{

const status=prompt(

"Enter Status:\n\nactive\nsuspended\nexpired\ncompleted",

selectedMachine?.status||"active"

);

if(!status) return;

changeMachineStatus(

status.toLowerCase()

);

};

/*==================================================
PART 12
VIEW MACHINE DETAILS
==================================================*/

/*==================================================
VIEW MACHINE
==================================================*/

function viewMachine(){

if(!selectedMachine){

showToast(

"No machine selected",

"error"

);

return;

}

const info=selectedMachine.machines||{};

document.getElementById(

"machineDetails"

).innerHTML=`

<div class="machineDetailsCard">

<img
class="detailsImage"
src="${
selectedMachine.machine_image||
info.image_url||
"images/default-machine.png"
}">

<h2>

${selectedMachine.machine_name||info.name}

</h2>

<div class="detailsGrid">

<div>

<label>Series</label>

<p>

${info.series||"-"}

</p>

</div>

<div>

<label>Status</label>

<p>

${selectedMachine.status}

</p>

</div>

<div>

<label>VIP</label>

<p>

${selectedMachine.is_vip?"YES":"NO"}

</p>

</div>

<div>

<label>Purchase Amount</label>

<p>

${formatMoney(selectedMachine.amount_paid)}

</p>

</div>

<div>

<label>Daily Income</label>

<p>

${formatMoney(
selectedMachine.daily_income||
info.daily_income
)}

</p>

</div>

<div>

<label>Total Return</label>

<p>

${formatMoney(
selectedMachine.total_return||
info.total_return
)}

</p>

</div>

<div>

<label>Earned</label>

<p>

${formatMoney(
selectedMachine.earned_amount
)}

</p>

</div>

<div>

<label>Purchase Date</label>

<p>

${String(
selectedMachine.purchase_date
).substring(0,10)}

</p>

</div>

<div>

<label>Expiry Date</label>

<p>

${String(
selectedMachine.expiry_date
).substring(0,10)}

</p>

</div>

<div>

<label>Days Remaining</label>

<p>

${getProgress(

selectedMachine.purchase_date,

selectedMachine.expiry_date

).remainingDays}

Days

</p>

</div>

</div>

</div>

`;

document.getElementById(

"viewMachineModal"

).classList.remove("hidden");

document.getElementById(

"overlay"

).classList.remove("hidden");

}

/*==================================================
CLOSE VIEW
==================================================*/

document.getElementById(

"closeViewMachine"

).onclick=()=>{

document.getElementById(

"viewMachineModal"

).classList.add("hidden");

document.getElementById(

"overlay"

).classList.add("hidden");

};

/*==================================================
VIEW BUTTON
==================================================*/

document.getElementById(

"viewMachineBtn"

).onclick=()=>{

viewMachine();

};
