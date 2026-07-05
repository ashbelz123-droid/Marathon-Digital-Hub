/* =====================================
MARATHON DIGITAL HUB
ADMIN MACHINES
===================================== */

const db = window.supabaseClient;

let machines = [];
let uploadedImage = "";
let editingMachineId = null;

/* =====================================
ELEMENTS
===================================== */

const machineForm = document.getElementById("machineForm");
const addMachineBtn = document.getElementById("addMachineBtn");
const saveMachineBtn = document.getElementById("saveMachine");
const machineList = document.getElementById("machineList");
const previewImage = document.getElementById("previewImage");
const imageInput = document.getElementById("machineImage");

/* =====================================
START
===================================== */

document.addEventListener("DOMContentLoaded", async () => {

    machineForm.style.display = "none";

    await loadMachines();

});

/* =====================================
OPEN FORM
===================================== */

addMachineBtn.addEventListener("click", () => {

    editingMachineId = null;

    machineForm.reset();

    previewImage.style.display = "none";

    previewImage.src = "";

    uploadedImage = "";

    machineForm.style.display = "block";

    document.querySelector(".machineForm h2").textContent =
    "Add Machine";

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

});

/* =====================================
IMAGE PREVIEW
===================================== */

imageInput.addEventListener("change",(e)=>{

    const file=e.target.files[0];

    if(!file) return;

    previewImage.src=URL.createObjectURL(file);

    previewImage.style.display="block";

});

/* =====================================
LOAD MACHINES
===================================== */

async function loadMachines(){

    machineList.innerHTML="<h3>Loading machines...</h3>";

    const {data,error}=await db

    .from("machines")

    .select("*")

    .order("created_at",{ascending:false});

    if(error){

        console.log(error);

        machineList.innerHTML=

        "<h3>Failed to load machines.</h3>";

        return;

    }

    machines=data || [];

    updateStats();

    renderMachines();

}

/* =====================================
UPDATE DASHBOARD
===================================== */

function updateStats(){

    document.getElementById("totalMachines").textContent=

    machines.length;

    document.getElementById("activeMachines").textContent=

    machines.filter(m=>m.status===true).length;

    document.getElementById("disabledMachines").textContent=

    machines.filter(m=>m.status===false).length;

    document.getElementById("vipMachines").textContent=

    machines.filter(m=>m.is_vip===true).length;

                            }
