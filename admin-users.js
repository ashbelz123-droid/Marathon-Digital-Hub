/*=========================================
MARATHON DIGITAL HUB
ADMIN USERS
=========================================*/

/*=========================================
SUPABASE
=========================================*/
const db = window.supabaseClient;

/*=========================================
GLOBAL DATA
=========================================*/
let users = [];
let selectedUser = null;

/*=========================================
ELEMENTS
=========================================*/
const usersList = document.getElementById("usersList");
const searchInput = document.getElementById("searchInput");

const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const vipUsers = document.getElementById("vipUsers");

const loadingScreen = document.getElementById("loadingScreen");

/*=========================================
LOADING
=========================================*/
function showLoading(){
  if(loadingScreen){
    loadingScreen.classList.remove("hidden");
  }
}

function hideLoading(){
  if(loadingScreen){
    loadingScreen.classList.add("hidden");
  }
}

/*=========================================
TOAST
=========================================*/
function showToast(message){
  const toast = document.getElementById("toast");
  const text = document.getElementById("toastText");
  if(!toast || !text){
    alert(message);
    return;
  }
  text.textContent = message;
  toast.classList.add("show");
  setTimeout(()=>{ toast.classList.remove("show"); }, 3000);
}

/*=========================================
INITIALIZE
=========================================*/
document.addEventListener("DOMContentLoaded", initPage);

async function initPage(){
  showLoading();
  try{
    await loadUsers();
  }catch(err){
    console.error(err);
    alert(err.message || err);
  }
  hideLoading();
}

/*=========================================
LOAD USERS
=========================================*/
async function loadUsers(){
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if(error){
    throw error;
  }

  users = data || [];
  updateDashboard();
  renderUsers();
}

/*=========================================
UPDATE DASHBOARD
=========================================*/
function updateDashboard(){
  if(totalUsers) totalUsers.textContent = users.length;
  if(activeUsers) activeUsers.textContent = users.filter(u => !u.is_frozen).length;
  if(vipUsers) vipUsers.textContent = users.filter(u => u.membership === "VIP").length;
}

/*=========================================
RENDER USERS
=========================================*/
function renderUsers(list = users){
  if(!usersList) return;
  usersList.innerHTML = "";

  if(list.length === 0){
    usersList.innerHTML = `
      <div class="emptyCard">
        <h3>No Users Found</h3>
      </div>
    `;
    return;
  }

  list.forEach(user => {
    const card = document.createElement("div");
    card.className = "userCard";

    const avatar = user.avatar_url || "images/default-avatar.png";
    const phone = user.phone || "No Phone";
    const email = user.email || "No Email";
    const membership = user.membership || "Standard";
    const status = user.account_status || (user.is_frozen ? "Suspended" : "Active");

    card.innerHTML = `
      <div class="userLeft">
        <img class="userAvatar" src="${avatar}">
        <div class="userInfo">
          <h3>${user.fullname || user.username || "Unknown"}</h3>
          <p>${phone}</p>
          <p>${email}</p>
        </div>
      </div>
      <div class="userRight">
        <span class="badge">${membership}</span>
        <p class="small">${status}</p>
      </div>
    `;

    card.onclick = () => selectUser(user);

    usersList.appendChild(card);
  });
}

/*=========================================
SEARCH & FILTER
=========================================*/
if(searchInput){
  searchInput.addEventListener("input", ()=>{
    const keyword = searchInput.value.toLowerCase().trim();
    const filtered = users.filter(user => {
      return (
        (user.fullname || "").toLowerCase().includes(keyword) ||
        (user.email || "").toLowerCase().includes(keyword) ||
        (user.username || "").toLowerCase().includes(keyword) ||
        (user.phone || "").toLowerCase().includes(keyword)
      );
    });
    renderUsers(filtered);
  });
}

/*=========================================
SELECT USER
=========================================*/
function selectUser(user){
  selectedUser = user;

  const profileSection = document.getElementById("userProfileSection");
  const machinesSection = document.getElementById("machinesSection");

  if(profileSection) profileSection.classList.remove("hidden");
  if(machinesSection) machinesSection.classList.remove("hidden");

  loadUserProfile();
  // if you have loadUserMachines in another file, call it
  if(typeof loadUserMachines === "function"){
    loadUserMachines();
  }
}

/*=========================================
LOAD USER PROFILE
=========================================*/
function loadUserProfile(){
  if(!selectedUser) return;

  const getEl = id => document.getElementById(id);

  getEl("profileAvatar").src = selectedUser.avatar_url || "images/default-avatar.png";
  getEl("profileName").textContent = selectedUser.fullname || selectedUser.username || "Unknown User";
  getEl("profilePhone").textContent = selectedUser.phone || "No Phone";
  getEl("profileEmail").textContent = selectedUser.email || "No Email";
  getEl("profileCountry").textContent = selectedUser.country || "Unknown";
  getEl("membershipBadge").textContent = selectedUser.membership || "Standard";
  getEl("statusBadge").textContent = selectedUser.account_status || (selectedUser.is_frozen ? "Suspended" : "Active");
  getEl("kycBadge").textContent = selectedUser.kyc_status || "Not Verified";
  getEl("profileInvested").textContent = "UGX " + Number(selectedUser.total_invested || 0).toLocaleString();
  getEl("profileProfit").textContent = "UGX " + Number(selectedUser.total_profit || 0).toLocaleString();
  getEl("profileWallet").textContent = "UGX " + Number(selectedUser.wallet_balance || selectedUser.balance || 0).toLocaleString();
  getEl("profileRegistered").textContent = selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : "--";
  getEl("profileLastLogin").textContent = selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString() : "--";
}

/*=========================================
EDIT USER
=========================================*/
document.getElementById("editUserBtn")?.addEventListener("click", openEditUser);

function openEditUser(){
  if(!selectedUser) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if(el) el.value = val ?? "";
  };

  setVal("editFullname", selectedUser.fullname || "");
  setVal("editPhone", selectedUser.phone || "");
  setVal("editEmail", selectedUser.email || "");
  setVal("editCountry", selectedUser.country || "");
  setVal("editMembership", selectedUser.membership || "Standard");
  setVal("editKycStatus", selectedUser.kyc_status || "Not Verified");
  setVal("editAccountStatus", selectedUser.account_status || (selectedUser.is_frozen ? "suspended" : "active"));
  setVal("editLevel", selectedUser.level || 1);
  setVal("editReferralCode", selectedUser.referral_code || "");

  document.getElementById("editUserModal")?.classList.remove("hidden");
}

document.getElementById("saveUserBtn")?.addEventListener("click", saveUser);

async function saveUser(){
  if(!selectedUser) return;

  const updates = {
    fullname: document.getElementById("editFullname").value.trim(),
    phone: document.getElementById("editPhone").value.trim(),
    email: document.getElementById("editEmail").value.trim(),
    country: document.getElementById("editCountry").value.trim(),
    membership: document.getElementById("editMembership").value,
    kyc_status: document.getElementById("editKycStatus").value,
    account_status: document.getElementById("editAccountStatus").value,
    level: Number(document.getElementById("editLevel").value || 1),
    referral_code: document.getElementById("editReferralCode").value.trim()
  };

  const { error } = await db
    .from("profiles")
    .update(updates)
    .eq("id", selectedUser.id);

  if(error){
    alert(error.message || error);
    return;
  }

  document.getElementById("editUserModal")?.classList.add("hidden");

  await loadUsers();

  selectedUser = users.find(u => u.id === selectedUser.id);
  loadUserProfile();

  showToast("User updated");
}

/*=========================================
FREEZE / UNFREEZE (SUSPEND / ACTIVATE)
=========================================*/
document.getElementById("freezeAccountBtn")?.addEventListener("click", freezeUser);

async function freezeUser(){
  if(!selectedUser) return;

  const frozen = !selectedUser.is_frozen;

  const { error } = await db
    .from("profiles")
    .update({ is_frozen: frozen })
    .eq("id", selectedUser.id);

  if(error){
    alert(error.message || error);
    return;
  }

  selectedUser.is_frozen = frozen;
  await loadUsers();
  loadUserProfile();

  showToast(frozen ? "Account Frozen" : "Account Activated");
}

/*=========================================
DELETE USER
=========================================*/
document.getElementById("deleteUserBtn")?.addEventListener("click", deleteUser);

async function deleteUser(){
  if(!selectedUser) return;
  if(!confirm("Delete this user? This cannot be undone.")) return;

  // delete profile
  const { error } = await db
    .from("profiles")
    .delete()
    .eq("id", selectedUser.id);

  if(error){
    alert(error.message || error);
    return;
  }

  // optionally: delete related user_machines, transactions, etc. (commented out; enable if desired)
  // await db.from("user_machines").delete().eq("user_id", selectedUser.id);
  // await db.from("transactions").delete().eq("user_id", selectedUser.id);

  selectedUser = null;
  await loadUsers();

  // hide profile sections
  document.getElementById("userProfileSection")?.classList.add("hidden");
  document.getElementById("machinesSection")?.classList.add("hidden");

  showToast("User deleted");
}

/*=========================================
VIP MANAGEMENT
=========================================*/
document.getElementById("makeVipBtn")?.addEventListener("click", makeVip);
document.getElementById("removeVipBtn")?.addEventListener("click", removeVip);

async function makeVip(){
  if(!selectedUser) return;
  const { error } = await db
    .from("profiles")
    .update({ membership: "VIP" })
    .eq("id", selectedUser.id);

  if(error){
    alert(error.message || error);
    return;
  }

  selectedUser.membership = "VIP";
  loadUserProfile();
  updateDashboard();
  showToast("User upgraded to VIP");
}

async function removeVip(){
  if(!selectedUser) return;
  const { error } = await db
    .from("profiles")
    .update({ membership: "Standard" })
    .eq("id", selectedUser.id);

  if(error){
    alert(error.message || error);
    return;
  }

  selectedUser.membership = "Standard";
  loadUserProfile();
  updateDashboard();
  showToast("VIP removed");
}

/*=========================================
WALLET MANAGEMENT
=========================================*/
document.getElementById("openWalletBtn")?.addEventListener("click", openWalletModal);

function openWalletModal(){
  if(!selectedUser) return;
  document.getElementById("walletUserName").textContent = selectedUser.fullname || selectedUser.email || "User";
  document.getElementById("walletAmount").value = "";
  document.getElementById("walletNote").value = "";
  document.getElementById("walletType").value = "credit";
  document.getElementById("walletModal")?.classList.remove("hidden");
}

document.getElementById("saveWalletBtn")?.addEventListener("click", saveWalletTransaction);

async function saveWalletTransaction(){
  if(!selectedUser) return;

  const type = document.getElementById("walletType").value;
  const amount = Number(document.getElementById("walletAmount").value || 0);
  const note = document.getElementById("walletNote").value || "";

  if(!amount || amount <= 0){
    alert("Enter a valid amount.");
    return;
  }

  // Update user's wallet balance (assumes a column wallet_balance)
  const currentBalance = Number(selectedUser.wallet_balance || selectedUser.balance || 0);
  const newBalance = type === "credit" ? currentBalance + amount : currentBalance - amount;

  // Begin update
  const { error: updateError } = await db
    .from("profiles")
    .update({ wallet_balance: newBalance })
    .eq("id", selectedUser.id);

  if(updateError){
    alert(updateError.message || updateError);
    return;
  }

  // Insert transaction record (assumes transactions table exists)
  const tx = {
    user_id: selectedUser.id,
    type: type === "credit" ? "wallet_credit" : "wallet_debit",
    amount: amount,
    note,
    created_at: new Date().toISOString()
  };

  const { error: txError } = await db
    .from("transactions")
    .insert(tx);

  if(txError){
    // roll back balance update? (skip rollback here, but you can implement)
    alert(txError.message || txError);
    return;
  }

  // Update local selectedUser and UI
  selectedUser.wallet_balance = newBalance;
  loadUserProfile();
  document.getElementById("walletModal")?.classList.add("hidden");

  showToast("Wallet updated");
}

/*=========================================
RESET PASSWORD (UI-only guidance)
=========================================*/
document.getElementById("resetPasswordBtn")?.addEventListener("click", ()=>{
  document.getElementById("resetPasswordModal")?.classList.remove("hidden");
});

document.getElementById("confirmResetPasswordBtn")?.addEventListener("click", ()=>{
  // For security, password resets should be done via secure server-side function.
  alert("Supabase Auth passwords cannot be changed from JavaScript.\n\nUse a secure Admin API or Supabase Edge Function.");
});

/*=========================================
CLOSE MODALS
=========================================*/
document.getElementById("closeEditUserModal")?.addEventListener("click", ()=>{
  document.getElementById("editUserModal")?.classList.add("hidden");
});
document.getElementById("closeWalletModal")?.addEventListener("click", ()=>{
  document.getElementById("walletModal")?.classList.add("hidden");
});
document.getElementById("closeResetPasswordModal")?.addEventListener("click", ()=>{
  document.getElementById("resetPasswordModal")?.classList.add("hidden");
});

/*=========================================
WINDOW FUNCTIONS (for inline onclick)
=========================================*/
window.makeVip = makeVip;
window.removeVip = removeVip;
window.deleteUser = deleteUser;
window.freezeUser = freezeUser;
window.openEditUser = openEditUser;
window.openWalletModal = openWalletModal;

/*=========================================
FINAL LOG
=========================================*/
console.log("================================");
console.log("ADMIN USERS LOADED");
console.log("Version 1.0");
console.log("Supabase Connected");
console.log("================================");
