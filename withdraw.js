/* Marathon Digital Hub - secure withdrawal client */
const db = window.supabaseClient;
const walletBalance = document.getElementById("walletBalance");
const withdrawForm = document.getElementById("withdrawForm");
const pendingCard = document.getElementById("pendingCard");
const withdrawAmount = document.getElementById("withdrawAmount");
const withdrawMethod = document.getElementById("withdrawMethod");
const phoneNumber = document.getElementById("phoneNumber");
const summaryAmount = document.getElementById("summaryAmount");
const summaryFee = document.getElementById("summaryFee");
const summaryReceive = document.getElementById("summaryReceive");
const popupAmount = document.getElementById("popupAmount");
const popupFee = document.getElementById("popupFee");
const popupReceive = document.getElementById("popupReceive");
const confirmPopup = document.getElementById("confirmPopup");
const loadingScreen = document.getElementById("loadingScreen");
let currentUser = null;
let profile = null;

const money = n => "UGX " + Number(n || 0).toLocaleString();
function showLoading(){ loadingScreen.style.display="flex"; }
function hideLoading(){ loadingScreen.style.display="none"; }

async function loadUser(){
  showLoading();
  const {data:{user},error}=await db.auth.getUser();
  if(error || !user){ window.location.href="login.html"; return; }
  currentUser=user;
  await loadProfile();
}

async function loadProfile(){
  const {data,error}=await db.from("profiles").select("*").eq("id",currentUser.id).single();
  hideLoading();
  if(error){ alert("Unable to load your profile."); return; }
  profile=data;
  walletBalance.textContent=money(profile.wallet_balance);
  await checkPendingWithdrawal();
  await loadWithdrawalHistory();
}

function updateSummary(){
  const amount=Math.max(0,Number(withdrawAmount.value)||0);
  const fee=Math.round(amount*0.095*100)/100;
  const receive=Math.round((amount-fee)*100)/100;
  summaryAmount.textContent=money(amount);
  summaryFee.textContent=money(fee);
  summaryReceive.textContent=money(receive);
  popupAmount.textContent=money(amount);
  popupFee.textContent=money(fee);
  popupReceive.textContent=money(receive);
}
withdrawAmount.addEventListener("input",updateSummary);

async function checkPendingWithdrawal(){
  const {data,error}=await db.from("withdrawals").select("*").eq("user_id",currentUser.id).eq("status","pending").order("created_at",{ascending:false}).limit(1);
  if(error) return console.error(error);
  if(data?.length){
    const w=data[0];
    withdrawForm.style.display="none";
    pendingCard.style.display="block";
    document.getElementById("pendingAmount").textContent=money(w.amount);
    document.getElementById("pendingFee").textContent=money(w.fee);
    document.getElementById("pendingReceive").textContent=money(w.net_amount);
    document.getElementById("pendingPhone").textContent=w.phone_number || "-";
  } else {
    withdrawForm.style.display="block";
    pendingCard.style.display="none";
  }
}

document.getElementById("withdrawBtn").addEventListener("click",()=>{
  const amount=Number(withdrawAmount.value);
  if(!Number.isFinite(amount) || amount<=0) return alert("Enter a valid withdrawal amount.");
  if(amount>Number(profile.wallet_balance)) return alert("Insufficient wallet balance.");
  if(!withdrawMethod.value) return alert("Please select a payment method.");
  if(!phoneNumber.value.trim()) return alert("Please enter your phone number.");
  updateSummary();
  confirmPopup.style.display="flex";
});

document.getElementById("cancelPopup").addEventListener("click",()=>confirmPopup.style.display="none");

document.getElementById("confirmWithdrawal").addEventListener("click",async()=>{
  confirmPopup.style.display="none";
  showLoading();
  try{
    const amount=Number(withdrawAmount.value);
    const {data,error}=await db.rpc("create_withdrawal_request",{
      p_amount:amount,
      p_method:withdrawMethod.value,
      p_phone_number:phoneNumber.value.trim()
    });
    if(error) throw error;
    hideLoading();
    document.getElementById("successPopup").style.display="flex";
    withdrawAmount.value="";
    withdrawMethod.value="";
    phoneNumber.value="";
    updateSummary();
    await loadProfile();
  }catch(err){
    hideLoading();
    const msg=String(err?.message||"");
    const known={
      AUTH_REQUIRED:"Please log in again.",
      INVALID_AMOUNT:"Enter a valid withdrawal amount.",
      INVALID_NETWORK:"Select MTN or Airtel Mobile Money.",
      INVALID_PHONE:"Enter a valid Mobile Money phone number.",
      PROFILE_NOT_FOUND:"Your account profile could not be found.",
      ACCOUNT_RESTRICTED:"Withdrawals are currently restricted on your account.",
      INSUFFICIENT_BALANCE:"Insufficient wallet balance.",
      PENDING_WITHDRAWAL_EXISTS:"You already have a pending withdrawal.",
      AMOUNT_TOO_SMALL:"The withdrawal amount is too small after fees."
    };
    alert(known[msg] || "Unable to submit withdrawal. Please try again.");
  }
});

document.getElementById("successOk").addEventListener("click",()=>document.getElementById("successPopup").style.display="none");

/* Cancellation is intentionally disabled here: the previous client-side update could not safely refund the reserved balance. */
document.getElementById("cancelBtn").addEventListener("click",()=>alert("Pending withdrawals cannot be cancelled from this page yet. Please contact support."));

async function loadWithdrawalHistory(){
  const {data,error}=await db.from("withdrawals").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(10);
  const history=document.getElementById("withdrawHistory");
  history.innerHTML="";
  if(error || !data?.length){
    history.innerHTML='<div class="empty-history"><i class="fas fa-wallet"></i><p>No withdrawals yet.</p></div>';
    return;
  }
  data.forEach(item=>{
    history.insertAdjacentHTML("beforeend",`<div class="history-item"><div><strong>${money(item.amount)}</strong><br><small>${item.method || "Mobile Money"}</small></div><div><span class="status ${String(item.status||"").toLowerCase()}">${item.status}</span></div></div>`);
  });
}

document.getElementById("refreshBtn").addEventListener("click",async()=>{ await checkPendingWithdrawal(); await loadWithdrawalHistory(); });
document.addEventListener("DOMContentLoaded",loadUser);
