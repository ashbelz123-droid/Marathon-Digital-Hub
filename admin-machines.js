/*=========================================
MARATHON DIGITAL HUB
ADMIN MACHINES
=========================================*/

const db = window.supabaseClient;

let machines = [];
let editingId = null;
let uploadedImageUrl = "";
let deleteMachineId = null;

/*=========================================
ELEMENTS
=========================================*/

const machineForm = document.getElementById("machineForm");
const openFormBtn = document.getElementById("openFormBtn");
const cancelMachine = document.getElementById("cancelMachine");
const saveMachine = document.getElementById("saveMachine");

const machineList = document.getElementById("machineList");
const searchMachine = document.getElementById("searchMachine");

const previewImage = document.getElementById("previewImage");
const machineImage = document.getElementById("machineImage");

const successPopup = document.getElementById("successPopup");
const deletePopup = document.getElementById("deletePopup");
const loadingOverlay = document.getElementById("loadingOverlay");

/*=========================================
START
=========================================*/

document.addEventListener("DOMContentLoaded", () => {

    machineForm.style.display = "none";

    loadMachines();

});

/*=========================================
OPEN FORM
=========================================*/

openFormBtn.onclick = () => {

    editingId = null;

    clearForm();

    document.getElementById("formTitle").textContent =
    "Add New Machine";

    machineForm.style.display = "block";

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

};

/*=========================================
CANCEL
=========================================*/

cancelMachine.onclick = () => {

    machineForm.style.display = "none";

    clearForm();

};

/*=========================================
CLEAR FORM
=========================================*/

function clearForm(){

    document.getElementById("machineName").value = "";

    document.getElementById("machineSeries").value = "";

    document.getElementById("machinePrice").value = "";

    document.getElementById("machineReturn").value = "";

    document.getElementById("machineDuration").value = "";

    document.getElementById("machineStatus").value = "true";

    document.getElementById("machineVIP").checked = false;

    machineImage.value = "";

    previewImage.src = "";

    previewImage.style.display = "none";

    uploadedImageUrl = "";

}

/*=========================================
IMAGE PREVIEW
=========================================*/

machineImage.addEventListener("change", e=>{

    const file = e.target.files[0];

    if(!file) return;

    previewImage.src = URL.createObjectURL(file);

    previewImage.style.display = "block";

});

/*=========================================
LOADING
=========================================*/

function showLoading(){

    loadingOverlay.style.display = "flex";

}

function hideLoading(){

    loadingOverlay.style.display = "none";

  }

/*=========================================
LOAD MACHINES
=========================================*/

async function loadMachines(){

    showLoading();

    const { data, error } = await db

        .from("machines")

        .select("*")

        .order("created_at", { ascending:false });

    hideLoading();

    if(error){

        console.error(error);

        machineList.innerHTML = `
            <div class="emptyState">
                <h2>Failed to load machines</h2>
                <p>${error.message}</p>
            </div>
        `;

        return;

    }

    machines = data || [];

    updateStats();

    renderMachines(machines);

}

/*=========================================
UPDATE DASHBOARD
=========================================*/

function updateStats(){

    document.getElementById("totalMachines").textContent =
        machines.length;

    document.getElementById("activeMachines").textContent =
        machines.filter(m=>m.status===true).length;

    document.getElementById("disabledMachines").textContent =
        machines.filter(m=>m.status===false).length;

    document.getElementById("vipMachines").textContent =
        machines.filter(m=>m.is_vip===true).length;

}

/*=========================================
RENDER MACHINES
=========================================*/

function renderMachines(list){

    if(list.length===0){

        machineList.innerHTML=`
            <div class="emptyState">
                <h2>No Machines Found</h2>
                <p>Add your first machine.</p>
            </div>
        `;

        return;

    }

    machineList.innerHTML=list.map(machine=>{

        const daily=Math.floor(
            Number(machine.total_return||0)/
            Number(machine.duration_days||1)
        );

        const image =
            machine.image_url && machine.image_url !== ""
            ? machine.image_url
            : "https://placehold.co/600x400/102040/FFFFFF?text=Machine";

        return `

        <div class="machineCard">

            <img
                src="${image}"
                alt="${machine.name}"
                onerror="this.src='https://placehold.co/600x400/102040/FFFFFF?text=Machine'">

            <div class="machineInfo">

                <h3>${machine.name}</h3>

                <p><strong>Series:</strong> ${machine.series||"-"}</p>

                <p><strong>Price:</strong> UGX ${Number(machine.price).toLocaleString()}</p>

                <p><strong>Total Return:</strong> UGX ${Number(machine.total_return).toLocaleString()}</p>

                <p><strong>Daily Income:</strong> UGX ${daily.toLocaleString()}</p>

                <p><strong>Duration:</strong> ${machine.duration_days} Days</p>

                <div class="badges">

                    ${
                        machine.status
                        ? '<span class="badge activeBadge">ACTIVE</span>'
                        : '<span class="badge disabledBadge">DISABLED</span>'
                    }

                    ${
                        machine.is_vip
                        ? '<span class="badge vipBadge">VIP</span>'
                        : ''
                    }

                </div>

                <div class="cardButtons">

                    <button
                        class="editBtn"
                        onclick="editMachine('${machine.id}')">

                        ✏ Edit

                    </button>

                    <button
                        class="deleteBtn"
                        onclick="deleteMachine('${machine.id}')">

                        🗑 Delete

                    </button>

                    <button
                        class="enableBtn"
                        onclick="changeStatus('${machine.id}',true)">

                        Enable

                    </button>

                    <button
                        class="disableBtn"
                        onclick="changeStatus('${machine.id}',false)">

                        Disable

                    </button>

                </div>

            </div>

        </div>

        `;

    }).join("");

}

/*=========================================
SEARCH
=========================================*/

searchMachine.addEventListener("input",()=>{

    const value=searchMachine.value.toLowerCase();

    const filtered=machines.filter(machine=>

        (machine.name||"")
        .toLowerCase()
        .includes(value)

        ||

        (machine.series||"")
        .toLowerCase()
        .includes(value)

    );

    renderMachines(filtered);

});

/*=========================================
UPLOAD IMAGE
=========================================*/

async function uploadImage(){

    const file = machineImage.files[0];

    if(!file) return uploadedImageUrl;

    showLoading();

    const fileName =
        `machine-${Date.now()}-${file.name.replace(/\s+/g,"-")}`;

    const { error } = await db.storage

        .from("machine-images")

        .upload(fileName,file,{upsert:true});

    hideLoading();

    if(error){

        alert(error.message);

        return null;

    }

    const { data } = db.storage

        .from("machine-images")

        .getPublicUrl(fileName);

    return data.publicUrl;

}

/*=========================================
SAVE MACHINE
=========================================*/

saveMachine.addEventListener("click",saveCurrentMachine);

async function saveCurrentMachine(){

    let imageUrl = uploadedImageUrl;

    if(machineImage.files.length){

        imageUrl = await uploadImage();

        if(!imageUrl) return;

    }

    const machine = {

        name:document.getElementById("machineName").value.trim(),

        series:document.getElementById("machineSeries").value.trim(),

        price:Number(document.getElementById("machinePrice").value),

        total_return:Number(document.getElementById("machineReturn").value),

        duration_days:Number(document.getElementById("machineDuration").value),

        status:document.getElementById("machineStatus").value==="true",

        is_vip:document.getElementById("machineVIP").checked,

        image_url:imageUrl

    };

    if(machine.name===""){

        alert("Enter machine name.");

        return;

    }

    showLoading();

    let result;

    if(editingId){

        result = await db

            .from("machines")

            .update(machine)

            .eq("id",editingId);

    }else{

        result = await db

            .from("machines")

            .insert(machine);

    }

    hideLoading();

    if(result.error){

        alert(result.error.message);

        return;

    }

    machineForm.style.display="none";

    clearForm();

    loadMachines();

    showSuccess(
        editingId
        ? "Machine updated successfully."
        : "Machine added successfully."
    );

}

/*=========================================
EDIT MACHINE
=========================================*/

window.editMachine = function(id){

    const machine = machines.find(m=>m.id===id);

    if(!machine) return;

    editingId = id;

    document.getElementById("formTitle").textContent =
        "Edit Machine";

    document.getElementById("machineName").value =
        machine.name || "";

    document.getElementById("machineSeries").value =
        machine.series || "";

    document.getElementById("machinePrice").value =
        machine.price || "";

    document.getElementById("machineReturn").value =
        machine.total_return || "";

    document.getElementById("machineDuration").value =
        machine.duration_days || "";

    document.getElementById("machineStatus").value =
        machine.status ? "true" : "false";

    document.getElementById("machineVIP").checked =
        machine.is_vip;

    uploadedImageUrl = machine.image_url || "";

    if(uploadedImageUrl){

        previewImage.src = uploadedImageUrl;

        previewImage.style.display = "block";

    }

    machineForm.style.display = "block";

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

};

/*=========================================
DELETE MACHINE
=========================================*/

window.deleteMachine = function(id){

    deleteMachineId = id;

    deletePopup.style.display = "flex";

};

document.getElementById("cancelDelete").onclick = () => {

    deletePopup.style.display = "none";

    deleteMachineId = null;

};

document.getElementById("confirmDelete").onclick = async () => {

    if(!deleteMachineId) return;

    showLoading();

    const { error } = await db

        .from("machines")

        .delete()

        .eq("id", deleteMachineId);

    hideLoading();

    deletePopup.style.display = "none";

    if(error){

        alert(error.message);

        return;

    }

    deleteMachineId = null;

    loadMachines();

    showSuccess("Machine deleted successfully.");

};

/*=========================================
ENABLE / DISABLE
=========================================*/

window.changeStatus = async function(id,status){

    showLoading();

    const { error } = await db

        .from("machines")

        .update({

            status:status

        })

        .eq("id",id);

    hideLoading();

    if(error){

        alert(error.message);

        return;

    }

    loadMachines();

    showSuccess(

        status

        ? "Machine enabled successfully."

        : "Machine disabled successfully."

    );

};

/*=========================================
SUCCESS POPUP
=========================================*/

function showSuccess(message){

    document.getElementById("successMessage").textContent = message;

    successPopup.style.display = "flex";

}

document.getElementById("closeSuccess").onclick = () => {

    successPopup.style.display = "none";

};

/*=========================================
CLICK OUTSIDE POPUPS
=========================================*/

window.addEventListener("click",(e)=>{

    if(e.target===successPopup){

        successPopup.style.display="none";

    }

    if(e.target===deletePopup){

        deletePopup.style.display="none";

    }

});

/*=========================================
FINISH
=========================================*/

console.log("✅ Marathon Admin Machines Ready");
