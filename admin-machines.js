/* ==========================================
MARATHON DIGITAL HUB
ADMIN MACHINES
========================================== */

const db = window.supabaseClient;

let machines = [];
let editingId = null;
let deleteId = null;
let uploadedImage = "";

/* ==========================================
ELEMENTS
========================================== */

const form = document.getElementById("machineForm");
const openFormBtn = document.getElementById("openFormBtn");
const cancelMachine = document.getElementById("cancelMachine");
const saveMachine = document.getElementById("saveMachine");
const machineList = document.getElementById("machineList");
const searchMachine = document.getElementById("searchMachine");
const previewImage = document.getElementById("previewImage");
const machineImage = document.getElementById("machineImage");

/* ==========================================
START
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    form.style.display = "none";

    loadMachines();

});

/* ==========================================
OPEN FORM
========================================== */

openFormBtn.onclick = () => {

    editingId = null;

    clearForm();

    document.getElementById("formTitle").innerText =
    "Add New Machine";

    form.style.display = "block";

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

};

/* ==========================================
CANCEL
========================================== */

cancelMachine.onclick = () => {

    form.style.display = "none";

    clearForm();

};

/* ==========================================
CLEAR FORM
========================================== */

function clearForm(){

    document.getElementById("machineName").value = "";
    document.getElementById("machineSeries").value = "";
    document.getElementById("machinePrice").value = "";
    document.getElementById("machineReturn").value = "";
    document.getElementById("machineDuration").value = "";
    document.getElementById("machineStatus").value = "true";
    document.getElementById("machineVIP").checked = false;

    machineImage.value = "";

    uploadedImage = "";

    previewImage.src = "";

    previewImage.style.display = "none";

}

/* ==========================================
IMAGE PREVIEW
========================================== */

machineImage.addEventListener("change",(e)=>{

    const file=e.target.files[0];

    if(!file) return;

    previewImage.src=URL.createObjectURL(file);

    previewImage.style.display="block";

});

/* ==========================================
LOAD MACHINES
========================================== */

async function loadMachines(){

    machineList.innerHTML = `
        <div class="emptyState">
            <h2>Loading machines...</h2>
        </div>
    `;

    const { data, error } = await db

    .from("machines")

    .select("*")

    .order("created_at",{ascending:false});

    if(error){

        console.log(error);

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

/* ==========================================
UPDATE STATS
========================================== */

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

/* ==========================================
RENDER MACHINES
========================================== */

function renderMachines(machineArray){

    if(machineArray.length===0){

        machineList.innerHTML=`
        <div class="emptyState">
            <h2>No Machines Found</h2>
            <p>Add your first mining machine.</p>
        </div>
        `;

        return;

    }

    machineList.innerHTML=machineArray.map(machine=>{

        const daily=Math.floor(
            Number(machine.total_return||0)/
            Number(machine.duration_days||1)
        );

        return `

        <div class="machineCard">

            <img
            src="${machine.image_url||''}"
            alt="${machine.name}">

            <div class="machineInfo">

                <h3>${machine.name}</h3>

                <p>
                <strong>Series:</strong>
                ${machine.series||"-"}
                </p>

                <p>
                <strong>Price:</strong>
                UGX ${Number(machine.price).toLocaleString()}
                </p>

                <p>
                <strong>Total Return:</strong>
                UGX ${Number(machine.total_return).toLocaleString()}
                </p>

                <p>
                <strong>Daily Income:</strong>
                UGX ${daily.toLocaleString()}
                </p>

                <p>
                <strong>Duration:</strong>
                ${machine.duration_days} Days
                </p>

                <div class="badges">

                    ${
                        machine.is_vip
                        ?'<span class="badge vipBadge">⭐ VIP</span>'
                        :''
                    }

                    ${
                        machine.status
                        ?'<span class="badge activeBadge">🟢 Active</span>'
                        :'<span class="badge disabledBadge">🔴 Disabled</span>'
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

/* ==========================================
SEARCH
========================================== */

searchMachine.addEventListener("input",()=>{

    const keyword=searchMachine.value.toLowerCase();

    const filtered=machines.filter(machine=>

        (machine.name||"")
        .toLowerCase()
        .includes(keyword)

        ||

        (machine.series||"")
        .toLowerCase()
        .includes(keyword)

    );

    renderMachines(filtered);

});

/* ==========================================
UPLOAD IMAGE
========================================== */

async function uploadMachineImage(){

    const file = machineImage.files[0];

    if(!file) return uploadedImage;

    const fileName = Date.now()+"-"+file.name.replace(/\s/g,"-");

    const { error } = await db.storage

    .from("machine-images")

    .upload(fileName,file,{upsert:true});

    if(error){

        alert(error.message);

        return null;

    }

    const { data } = db.storage

    .from("machine-images")

    .getPublicUrl(fileName);

    return data.publicUrl;

}

/* ==========================================
SAVE MACHINE
========================================== */

saveMachine.addEventListener("click",saveCurrentMachine);

async function saveCurrentMachine(){

    const imageUrl = await uploadMachineImage();

    if(machineImage.files.length && !imageUrl) return;

    const machineData = {

        name:document.getElementById("machineName").value.trim(),

        series:document.getElementById("machineSeries").value.trim(),

        price:Number(document.getElementById("machinePrice").value),

        total_return:Number(document.getElementById("machineReturn").value),

        duration_days:Number(document.getElementById("machineDuration").value),

        status:document.getElementById("machineStatus").value==="true",

        is_vip:document.getElementById("machineVIP").checked,

        image_url:imageUrl || uploadedImage

    };

    if(machineData.name===""){

        alert("Machine name is required.");

        return;

    }

    let response;

    if(editingId){

        response = await db

        .from("machines")

        .update(machineData)

        .eq("id",editingId);

    }else{

        response = await db

        .from("machines")

        .insert(machineData);

    }

    if(response.error){

        alert(response.error.message);

        return;

    }

    form.style.display="none";

    clearForm();

    loadMachines();

}

/* ==========================================
EDIT MACHINE
========================================== */

window.editMachine = function(id){

    const machine = machines.find(m=>m.id===id);

    if(!machine) return;

    editingId=id;

    document.getElementById("formTitle").innerText="Edit Machine";

    document.getElementById("machineName").value=machine.name||"";

    document.getElementById("machineSeries").value=machine.series||"";

    document.getElementById("machinePrice").value=machine.price||0;

    document.getElementById("machineReturn").value=machine.total_return||0;

    document.getElementById("machineDuration").value=machine.duration_days||0;

    document.getElementById("machineStatus").value=machine.status?"true":"false";

    document.getElementById("machineVIP").checked=machine.is_vip;

    uploadedImage=machine.image_url||"";

    if(uploadedImage){

        previewImage.src=uploadedImage;

        previewImage.style.display="block";

    }

    form.style.display="block";

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

};

/* ==========================================
DELETE MACHINE
========================================== */

window.deleteMachine = async function(id){

    const ok = confirm("Are you sure you want to delete this machine?");

    if(!ok) return;

    const { error } = await db

    .from("machines")

    .delete()

    .eq("id",id);

    if(error){

        alert(error.message);

        return;

    }

    await loadMachines();

};

/* ==========================================
ENABLE / DISABLE MACHINE
========================================== */

window.changeStatus = async function(id,status){

    const { error } = await db

    .from("machines")

    .update({

        status:status

    })

    .eq("id",id);

    if(error){

        alert(error.message);

        return;

    }

    await loadMachines();

};

/* ==========================================
SUCCESS POPUP
========================================== */

function showSuccess(message){

    const popup=document.getElementById("successPopup");

    document.getElementById("successMessage").textContent=message;

    popup.style.display="flex";

}

document.getElementById("closeSuccess").onclick=function(){

    document.getElementById("successPopup").style.display="none";

};

/* ==========================================
DELETE POPUP BUTTON
========================================== */

document.getElementById("cancelDelete").onclick=function(){

    document.getElementById("deletePopup").style.display="none";

};

/* ==========================================
LOADING
========================================== */

function showLoading(){

    document.getElementById("loadingOverlay").style.display="flex";

}

function hideLoading(){

    document.getElementById("loadingOverlay").style.display="none";

}

/* ==========================================
CLICK OUTSIDE POPUPS
========================================== */

window.onclick=function(e){

    if(e.target.id==="successPopup"){

        document.getElementById("successPopup").style.display="none";

    }

    if(e.target.id==="deletePopup"){

        document.getElementById("deletePopup").style.display="none";

    }

};

/* ==========================================
END OF FILE
========================================== */

console.log("Admin Machines Loaded Successfully");
