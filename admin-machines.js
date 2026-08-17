/*=========================================
MARATHON DIGITAL HUB
ADMIN MACHINES
=========================================*/
const db = window.supabaseClient;
let machines = [];
let editingId = null;
let deleteId = null;
let selectedImage = null;

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

// Loading overlay intentionally disabled for a clean instant UI.
function showLoading(){ return; }
function hideLoading(){ if(loadingScreen) loadingScreen.classList.add("hidden"); }
function showToast(message){
  if(!toast || !toastMessage) return;
  toastMessage.textContent = message;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),3000);
}

async function loadAssignmentCount(){
  const el = document.getElementById("userMachineAssignments");
  if(!el) return;
  const { count, error } = await db
    .from("user_machines")
    .select("id", { count:"exact", head:true });
  if(error){
    console.error("Could not load user machine assignments:", error);
    el.textContent = "—";
    return;
  }
  el.textContent = count ?? 0;
}

async function loadMachines(){
  const { data, error } = await db
    .from("machines")
    .select("*")
    .order("created_at", { ascending:false });
  if(error){ console.error(error); showToast(error.message); return; }
  machines = data || [];
  updateStats();
  renderMachines(machines);
  loadAssignmentCount();
}

function updateStats(){
  // Total Machines is the real machines table count — currently 33.
  document.getElementById("totalMachines").textContent = machines.length;
  document.getElementById("activeMachines").textContent = machines.filter(m=>m.status).length;
  document.getElementById("disabledMachines").textContent = machines.filter(m=>!m.status).length;
  document.getElementById("vipMachines").textContent = machines.filter(m=>m.is_vip).length;
  document.getElementById("machineCount").textContent = machines.length + " Machines";
}

function renderMachines(list){
  if(!list.length){
    machinesContainer.innerHTML='<div class="emptyState"><h2>No Machines Found</h2><p>There are no configured machines matching this search.</p></div>';
    return;
  }
  machinesContainer.innerHTML="";
  list.forEach(machine=>{
    const dailyIncome = Math.floor(Number(machine.total_return||0)/Math.max(Number(machine.duration_days||1),1));
    const image = machine.image_url || "https://placehold.co/600x400/10253F/FFFFFF?text=Machine";
    machinesContainer.innerHTML += `
      <article class="machineCard">
        <img src="${image}" alt="${machine.name||"Machine"}">
        <div class="machineContent">
          <h3>${machine.name||"Unnamed Machine"}</h3>
          <div class="machineInfo"><span>Series</span><strong>${machine.series||"-"}</strong></div>
          <div class="machineInfo"><span>Price</span><strong>UGX ${Number(machine.price||0).toLocaleString()}</strong></div>
          <div class="machineInfo"><span>Total Return</span><strong>UGX ${Number(machine.total_return||0).toLocaleString()}</strong></div>
          <div class="machineInfo"><span>Daily Income</span><strong>UGX ${dailyIncome.toLocaleString()}</strong></div>
          <div class="machineInfo"><span>Duration</span><strong>${machine.duration_days||0} Days</strong></div>
          <div class="badgeRow">
            <span class="badge ${machine.status?"active":"disabled"}">${machine.status?"ACTIVE":"DISABLED"}</span>
            ${machine.is_vip?'<span class="badge vip">VIP</span>':""}
          </div>
          <div class="cardActions">
            <button class="editBtn" onclick="editMachine('${machine.id}')">Edit</button>
            <button class="deleteBtn" onclick="openDelete('${machine.id}')">Delete</button>
            <button class="${machine.status?"disableBtn":"enableBtn"}" onclick="changeStatus('${machine.id}', ${!machine.status})">${machine.status?"Disable":"Enable"}</button>
          </div>
        </div>
      </article>`;
  });
}

addMachineBtn.addEventListener("click",()=>{
  editingId=null;
  machineFormElement.reset();
  previewImage.src="";
  previewImage.style.display="none";
  selectedImage=null;
  document.getElementById("formTitle").textContent="Add New Machine";
  machineForm.classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
});

function hideForm(){
  machineForm.classList.add("hidden");
  machineFormElement.reset();
  previewImage.src="";
  previewImage.style.display="none";
  selectedImage=null;
}
closeFormBtn.addEventListener("click",hideForm);
cancelBtn.addEventListener("click",hideForm);

machineImage.addEventListener("change",e=>{
  const file=e.target.files[0];
  if(!file)return;
  selectedImage=file;
  previewImage.src=URL.createObjectURL(file);
  previewImage.style.display="block";
});

searchInput.addEventListener("input",()=>{
  const value=searchInput.value.trim().toLowerCase();
  renderMachines(machines.filter(machine=>(machine.name||"").toLowerCase().includes(value)||(machine.series||"").toLowerCase().includes(value)));
});

async function uploadImage(){
  if(!selectedImage)return null;
  const fileName=`machine-${Date.now()}-${selectedImage.name.replace(/\s+/g,"-")}`;
  const {error}=await db.storage.from("machine-images").upload(fileName,selectedImage,{upsert:true});
  if(error){showToast(error.message);return null;}
  return db.storage.from("machine-images").getPublicUrl(fileName).data.publicUrl;
}

machineFormElement.addEventListener("submit",saveMachine);
async function saveMachine(e){
  e.preventDefault();
  let imageUrl="";
  if(selectedImage){ imageUrl=await uploadImage(); if(!imageUrl)return; }
  const machine={
    name:document.getElementById("machineName").value.trim(),
    series:document.getElementById("machineSeries").value.trim(),
    price:Number(document.getElementById("machinePrice").value),
    total_return:Number(document.getElementById("machineReturn").value),
    duration_days:Number(document.getElementById("machineDuration").value),
    status:document.getElementById("machineStatus").value==="true",
    is_vip:document.getElementById("machineVIP").checked
  };
  if(imageUrl)machine.image_url=imageUrl;
  const result=editingId
    ? await db.from("machines").update(machine).eq("id",editingId)
    : await db.from("machines").insert([machine]);
  if(result.error){showToast(result.error.message);return;}
  editingId=null;
  hideForm();
  showToast("Machine saved successfully.");
  loadMachines();
}

window.editMachine=function(id){
  const machine=machines.find(m=>m.id===id);
  if(!machine)return;
  editingId=id;
  document.getElementById("formTitle").textContent="Edit Machine";
  document.getElementById("machineName").value=machine.name||"";
  document.getElementById("machineSeries").value=machine.series||"";
  document.getElementById("machinePrice").value=machine.price||0;
  document.getElementById("machineReturn").value=machine.total_return||0;
  document.getElementById("machineDuration").value=machine.duration_days||0;
  document.getElementById("machineStatus").value=machine.status?"true":"false";
  document.getElementById("machineVIP").checked=!!machine.is_vip;
  if(machine.image_url){previewImage.src=machine.image_url;previewImage.style.display="block";}else{previewImage.style.display="none";}
  selectedImage=null;
  machineForm.classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
};

const deleteModal=document.getElementById("deleteModal");
const confirmDeleteBtn=document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn=document.getElementById("cancelDeleteBtn");
window.openDelete=function(id){deleteId=id;deleteModal.classList.remove("hidden");};
cancelDeleteBtn.addEventListener("click",()=>{deleteId=null;deleteModal.classList.add("hidden");});
confirmDeleteBtn.addEventListener("click",async()=>{
  if(!deleteId)return;
  const {error}=await db.from("machines").delete().eq("id",deleteId);
  deleteModal.classList.add("hidden");
  if(error){showToast(error.message);return;}
  deleteId=null;
  showToast("Machine deleted successfully.");
  loadMachines();
});

deleteModal.addEventListener("click",e=>{if(e.target===deleteModal){deleteModal.classList.add("hidden");deleteId=null;}});
window.changeStatus=async function(id,status){
  const {error}=await db.from("machines").update({status}).eq("id",id);
  if(error){showToast(error.message);return;}
  showToast(status?"Machine enabled.":"Machine disabled.");
  loadMachines();
};

document.addEventListener("DOMContentLoaded",()=>{
  if(machineForm) machineForm.classList.add("hidden");
  // Always load the real machines table; no artificial loading screen.
  loadMachines();
});

window.addEventListener("error",e=>{console.error(e.error);showToast("JavaScript Error. Check console.");});
console.log("✅ Marathon Digital Hub Admin Machines Ready");