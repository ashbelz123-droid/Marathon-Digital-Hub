/* ==========================================
MARATHON DIGITAL HUB
ADMIN MACHINES
========================================== */

const db = window.supabaseClient;

let machines = [];
let editingId = null;
let uploadedImageUrl = "";
let deleteId = null;

/* ==========================================
ELEMENTS
========================================== */

const form = document.getElementById("machineForm");
const openForm = document.getElementById("openForm");
const saveBtn = document.getElementById("saveMachine");
const cancelBtn = document.getElementById("cancelMachine");
const imageInput = document.getElementById("machineImage");
const preview = document.getElementById("previewImage");
const machineList = document.getElementById("machineList");
const search = document.getElementById("searchMachine");

/* ==========================================
START
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadMachines();

});

/* ==========================================
SHOW / HIDE FORM
========================================== */

openForm.onclick = () => {

    editingId = null;

    document.getElementById("formTitle").innerText =
    "Add Machine";

    form.style.display = "block";

    clearForm();

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

};

cancelBtn.onclick = () => {

    form.style.display = "none";

};

/* ==========================================
CLEAR FORM
========================================== */

function clearForm(){

    document.getElementById("machineName").value="";

    document.getElementById("machineSeries").value="";

    document.getElementById("machinePrice").value="";

    document.getElementById("machineReturn").value="";

    document.getElementById("machineDuration").value="";

    document.getElementById("machineStatus").value="true";

    document.getElementById("machineVIP").checked=false;

    imageInput.value="";

    preview.style.display="none";

    preview.src="";

    uploadedImageUrl="";

}

/* ==========================================
IMAGE PREVIEW
========================================== */

imageInput.addEventListener("change",function(){

    const file=this.files[0];

    if(!file) return;

    preview.src=URL.createObjectURL(file);

    preview.style.display="block";

});

/* ==========================================
LOAD MACHINES
========================================== */

async function loadMachines(){

    machineList.innerHTML="<h2>Loading machines...</h2>";

    const {data,error}=await db

    .from("machines")

    .select("*")

    .order("created_at",{ascending:false});

    if(error){

        machineList.innerHTML=

        "<h2>Failed to load machines.</h2>";

        console.log(error);

        return;

    }

    machines=data||[];

    updateStats();

    renderMachines();

        }

/* ==========================================
RENDER MACHINE CARDS
========================================== */

function renderMachines(list = machines){

    if(list.length===0){

        machineList.innerHTML=`
        <div class="empty">
            <h2>No machines found</h2>
        </div>
        `;

        return;

    }

    machineList.innerHTML=list.map(machine=>{

        const daily=Math.round(
            Number(machine.total_return||0)/
            Number(machine.duration_days||1)
        );

        return `

        <div class="machineCard">

            <img src="${machine.image_url||'https://placehold.co/600x400?text=No+Image'}">

            <div class="machineInfo">

                <h3>${machine.name}</h3>

                <p><strong>Series:</strong> ${machine.series||'-'}</p>

                <p><strong>Price:</strong> UGX ${Number(machine.price).toLocaleString()}</p>

                <p><strong>Total Return:</strong> UGX ${Number(machine.total_return).toLocaleString()}</p>

                <p><strong>Duration:</strong> ${machine.duration_days} Days</p>

                <p><strong>Daily Income:</strong> UGX ${daily.toLocaleString()}</p>

                <div class="badges">

                    ${machine.is_vip
                        ?'<span class="badge vip">VIP</span>'
                        :''
                    }

                    ${
                        machine.status
                        ?'<span class="badge active">Active</span>'
                        :'<span class="badge disabled">Disabled</span>'
                    }

                </div>

                <div class="cardButtons">

                    <button
                    class="editBtn"
                    onclick="editMachine('${machine.id}')">

                    ✏️ Edit

                    </button>

                    <button
                    class="deleteBtn"
                    onclick="askDelete('${machine.id}')">

                    🗑 Delete

                    </button>

                    <button
                    class="enableBtn"
                    onclick="toggleStatus('${machine.id}',true)">

                    Enable

                    </button>

                    <button
                    class="disableBtn"
                    onclick="toggleStatus('${machine.id}',false)">

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

search.addEventListener("input",()=>{

    const q=search.value.toLowerCase();

    const filtered=machines.filter(m=>

        (m.name||"").toLowerCase().includes(q) ||

        (m.series||"").toLowerCase().includes(q)

    );

    renderMachines(filtered);

});

/* ==========================================
UPLOAD IMAGE
========================================== */

async function uploadImage(){

    const file=imageInput.files[0];

    if(!file) return uploadedImageUrl;

    const fileName=Date.now()+"-"+file.name.replace(/\s+/g,"-");

    const {error}=await db.storage

    .from("machine-images")

    .upload(fileName,file,{upsert:true});

    if(error){

        alert(error.message);

        return null;

    }

    const {data}=db.storage

    .from("machine-images")

    .getPublicUrl(fileName);

    return data.publicUrl;

}

/* ==========================================
SAVE MACHINE
========================================== */

saveBtn.addEventListener("click",saveMachine);

async function saveMachine(){

    const imageUrl=await uploadImage();

    if(imageInput.files.length && !imageUrl) return;

    const machine={

        name:document.getElementById("machineName").value.trim(),

        series:document.getElementById("machineSeries").value.trim(),

        price:Number(document.getElementById("machinePrice").value),

        total_return:Number(document.getElementById("machineReturn").value),

        duration_days:Number(document.getElementById("machineDuration").value),

        image_url:imageUrl || uploadedImageUrl,

        is_vip:document.getElementById("machineVIP").checked,

        status:document.getElementById("machineStatus").value==="true"

    };

    if(!machine.name){

        alert("Enter machine name");

        return;

    }

    let result;

    if(editingId){

        result=await db

        .from("machines")

        .update(machine)

        .eq("id",editingId);

    }else{

        result=await db

        .from("machines")

        .insert(machine);

    }

    if(result.error){

        alert(result.error.message);

        return;

    }

    form.style.display="none";

    clearForm();

    loadMachines();

}

/* ==========================================
EDIT MACHINE
========================================== */

window.editMachine=function(id){

    const m=machines.find(x=>x.id===id);

    if(!m) return;

    editingId=id;

    document.getElementById("formTitle").textContent="Edit Machine";

    document.getElementById("machineName").value=m.name||"";

    document.getElementById("machineSeries").value=m.series||"";

    document.getElementById("machinePrice").value=m.price||0;

    document.getElementById("machineReturn").value=m.total_return||0;

    document.getElementById("machineDuration").value=m.duration_days||0;

    document.getElementById("machineVIP").checked=m.is_vip;

    document.getElementById("machineStatus").value=m.status?"true":"false";

    uploadedImageUrl=m.image_url||"";

    if(uploadedImageUrl){

        preview.src=uploadedImageUrl;

        preview.style.display="block";

    }

    form.style.display="block";

    window.scrollTo({top:0,behavior:"smooth"});

};

/* ==========================================
DELETE MACHINE
========================================== */

window.askDelete=async function(id){

    if(!confirm("Delete this machine?")) return;

    const {error}=await db

    .from("machines")

    .delete()

    .eq("id",id);

    if(error){

        alert(error.message);

        return;

    }

    loadMachines();

};

/* ==========================================
ENABLE / DISABLE
========================================== */

window.toggleStatus=async function(id,status){

    const {error}=await db

    .from("machines")

    .update({status})

    .eq("id",id);

    if(error){

        alert(error.message);

        return;

    }

    loadMachines();

};
