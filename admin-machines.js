/*=========================================
MARATHON DIGITAL HUB
ADMIN MACHINES
=========================================*/

// ==========================
// SUPABASE
// ==========================

const db = window.supabaseClient;

// ==========================
// STATE
// ==========================

let machines = [];
let editingId = null;
let deleteId = null;
let selectedImage = null;

// ==========================
// ELEMENTS
// ==========================

const addMachineBtn = document.getElementById("addMachineBtn");
const machineForm = document.getElementById("machineForm");
const machineFormElement = document.getElementById("machineFormElement");
const closeFormBtn = document.getElementById("closeFormBtn");
const cancelBtn = document.getElementById("cancelBtn");

const machinesContainer = document.getElementById("machinesContainer");

const searchInput = document.getElementById("searchInput");

const previewImage = document.getElementById("previewImage");
const machineImage = document.getElementById("machineImage");

const loadingScreen = document.getElementById("loadingScreen");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

// ==========================
// START
// ==========================

document.addEventListener("DOMContentLoaded", () => {

    machineForm.classList.add("hidden");

    loadMachines();

});

// ==========================
// OPEN FORM
// ==========================

addMachineBtn.addEventListener("click", () => {

    editingId = null;

    machineFormElement.reset();

    previewImage.src = "";

    previewImage.style.display = "none";

    selectedImage = null;

    document.getElementById("formTitle").textContent =
    "Add New Machine";

    machineForm.classList.remove("hidden");

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

});

// ==========================
// CLOSE FORM
// ==========================

closeFormBtn.addEventListener("click", hideForm);

cancelBtn.addEventListener("click", hideForm);

function hideForm(){

    machineForm.classList.add("hidden");

    machineFormElement.reset();

    previewImage.src = "";

    previewImage.style.display = "none";

    selectedImage = null;

}

// ==========================
// IMAGE PREVIEW
// ==========================

machineImage.addEventListener("change",(e)=>{

    const file = e.target.files[0];

    if(!file) return;

    selectedImage = file;

    previewImage.src = URL.createObjectURL(file);

    previewImage.style.display = "block";

});

// ==========================
// LOADING
// ==========================

function showLoading(){

    loadingScreen.classList.remove("hidden");

}

function hideLoading(){

    loadingScreen.classList.add("hidden");

}

// ==========================
// TOAST
// ==========================

function showToast(message){

    toastMessage.textContent = message;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },3000);

}

console.log("✅ Admin Machines JS Loaded");

/*=========================================
LOAD MACHINES
=========================================*/

async function loadMachines() {

    showLoading();

    const { data, error } = await db

        .from("machines")

        .select("*")

        .order("created_at", { ascending: false });

    hideLoading();

    if (error) {

        console.error(error);

        showToast(error.message);

        return;

    }

    machines = data || [];

    updateStats();

    renderMachines(machines);

}

/*=========================================
UPDATE STATS
=========================================*/

function updateStats() {

    document.getElementById("totalMachines").textContent =
        machines.length;

    document.getElementById("activeMachines").textContent =
        machines.filter(m => m.status).length;

    document.getElementById("disabledMachines").textContent =
        machines.filter(m => !m.status).length;

    document.getElementById("vipMachines").textContent =
        machines.filter(m => m.is_vip).length;

    document.getElementById("machineCount").textContent =
        machines.length + " Machines";

}

/*=========================================
RENDER MACHINES
=========================================*/

function renderMachines(list) {

    if (list.length === 0) {

        machinesContainer.innerHTML = `

            <div class="emptyState">

                <h2>No Machines Found</h2>

                <p>Create your first mining machine.</p>

            </div>

        `;

        return;

    }

    machinesContainer.innerHTML = "";

    list.forEach(machine => {

        const dailyIncome = Math.floor(

            Number(machine.total_return) /

            Number(machine.duration_days)

        );

        const image = machine.image_url ||

            "https://placehold.co/600x400/10253F/FFFFFF?text=Machine";

        machinesContainer.innerHTML += `

        <div class="machineCard">

            <img src="${image}" alt="${machine.name}">

            <div class="machineContent">

                <h3>${machine.name}</h3>

                <div class="machineInfo">

                    <span>Series</span>

                    <strong>${machine.series || "-"}</strong>

                </div>

                <div class="machineInfo">

                    <span>Price</span>

                    <strong>UGX ${Number(machine.price).toLocaleString()}</strong>

                </div>

                <div class="machineInfo">

                    <span>Total Return</span>

                    <strong>UGX ${Number(machine.total_return).toLocaleString()}</strong>

                </div>

                <div class="machineInfo">

                    <span>Daily Income</span>

                    <strong>UGX ${dailyIncome.toLocaleString()}</strong>

                </div>

                <div class="machineInfo">

                    <span>Duration</span>

                    <strong>${machine.duration_days} Days</strong>

                </div>

                <div class="badgeRow">

                    <span class="badge ${machine.status ? "active" : "disabled"}">

                        ${machine.status ? "ACTIVE" : "DISABLED"}

                    </span>

                    ${machine.is_vip
                        ? '<span class="badge vip">VIP</span>'
                        : ""
                    }

                </div>

                <div class="cardActions">

                    <button

                        class="editBtn"

                        onclick="editMachine('${machine.id}')">

                        Edit

                    </button>

                    <button

                        class="deleteBtn"

                        onclick="openDelete('${machine.id}')">

                        Delete

                    </button>

                    <button

                        class="${machine.status ? "disableBtn" : "enableBtn"}"

                        onclick="changeStatus('${machine.id}', ${!machine.status})">

                        ${machine.status ? "Disable" : "Enable"}

                    </button>

                </div>

            </div>

        </div>

        `;

    });

}

/*=========================================
SEARCH
=========================================*/

searchInput.addEventListener("input", () => {

    const value = searchInput.value

        .trim()

        .toLowerCase();

    const filtered = machines.filter(machine =>

        (machine.name || "")

        .toLowerCase()

        .includes(value)

        ||

        (machine.series || "")

        .toLowerCase()

        .includes(value)

    );

    renderMachines(filtered);

});

/*=========================================
UPLOAD IMAGE
=========================================*/

async function uploadImage() {

    if (!selectedImage) return null;

    const fileName =
        `machine-${Date.now()}-${selectedImage.name.replace(/\s+/g,"-")}`;

    showLoading();

    const { error } = await db.storage

        .from("machine-images")

        .upload(fileName, selectedImage, {

            upsert: true

        });

    hideLoading();

    if (error) {

        showToast(error.message);

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

machineFormElement.addEventListener("submit", saveMachine);

async function saveMachine(e) {

    e.preventDefault();

    let imageUrl = "";

    if (selectedImage) {

        imageUrl = await uploadImage();

        if (!imageUrl) return;

    }

    const machine = {

        name: document.getElementById("machineName").value.trim(),

        series: document.getElementById("machineSeries").value.trim(),

        price: Number(document.getElementById("machinePrice").value),

        total_return: Number(document.getElementById("machineReturn").value),

        duration_days: Number(document.getElementById("machineDuration").value),

        status: document.getElementById("machineStatus").value === "true",

        is_vip: document.getElementById("machineVIP").checked

    };

    if (imageUrl) {

        machine.image_url = imageUrl;

    }

    showLoading();

    let result;

    if (editingId) {

        result = await db

            .from("machines")

            .update(machine)

            .eq("id", editingId);

    } else {

        result = await db

            .from("machines")

            .insert([machine]);

    }

    hideLoading();

    if (result.error) {

        showToast(result.error.message);

        return;

    }

    editingId = null;

    hideForm();

    showToast("Machine saved successfully.");

    loadMachines();

}

/*=========================================
EDIT MACHINE
=========================================*/

window.editMachine = function(id) {

    const machine = machines.find(m => m.id === id);

    if (!machine) return;

    editingId = id;

    document.getElementById("formTitle").textContent =
        "Edit Machine";

    document.getElementById("machineName").value =
        machine.name;

    document.getElementById("machineSeries").value =
        machine.series || "";

    document.getElementById("machinePrice").value =
        machine.price;

    document.getElementById("machineReturn").value =
        machine.total_return;

    document.getElementById("machineDuration").value =
        machine.duration_days;

    document.getElementById("machineStatus").value =
        machine.status ? "true" : "false";

    document.getElementById("machineVIP").checked =
        machine.is_vip;

    if (machine.image_url) {

        previewImage.src = machine.image_url;

        previewImage.style.display = "block";

    } else {

        previewImage.style.display = "none";

    }

    selectedImage = null;

    machineForm.classList.remove("hidden");

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

};

/*=========================================
DELETE MACHINE
=========================================*/

const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

window.openDelete = function(id){

    deleteId = id;

    deleteModal.classList.remove("hidden");

};

cancelDeleteBtn.addEventListener("click",()=>{

    deleteId = null;

    deleteModal.classList.add("hidden");

});

confirmDeleteBtn.addEventListener("click",async()=>{

    if(!deleteId) return;

    showLoading();

    const { error } = await db

        .from("machines")

        .delete()

        .eq("id",deleteId);

    hideLoading();

    deleteModal.classList.add("hidden");

    if(error){

        showToast(error.message);

        return;

    }

    deleteId = null;

    showToast("Machine deleted successfully.");

    loadMachines();

});

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

        showToast(error.message);

        return;

    }

    showToast(

        status

        ? "Machine enabled."

        : "Machine disabled."

    );

    loadMachines();

};

/*=========================================
CLICK OUTSIDE MODAL
=========================================*/

deleteModal.addEventListener("click",(e)=>{

    if(e.target===deleteModal){

        deleteModal.classList.add("hidden");

        deleteId = null;

    }

});

/*=========================================
GLOBAL ERROR HANDLER
=========================================*/

window.addEventListener("error",(e)=>{

    console.error(e.error);

    showToast("JavaScript Error. Check console.");

});

/*=========================================
READY
=========================================*/

console.log("✅ Marathon Digital Hub Admin Machines Ready");
