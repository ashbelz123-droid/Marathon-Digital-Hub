const db = supabaseClient;
const DEPOSIT_LIMIT = 20000; // Maximum single deposit request
const MIN_DEPOSIT = 10000;
let currentUser = null;
let selectedMethod = "MTN";
let currentWalletBalance = 0;

window.addEventListener("DOMContentLoaded", async ()=>{
  await loadProfile();
  await loadPaymentAccounts();
  await loadLatestDeposit();
  await loadDepositHistory();
});

async function loadProfile(){
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError) console.warn(authError);
  if(!user){ location.href="login.html"; return; }
  currentUser=user;
  const {data,error}=await db.from("profiles").select("wallet_balance,fullname").eq("id",user.id).single();
  if(error){ console.warn(error); return; }
  currentWalletBalance=Number(data.wallet_balance||0);
  document.getElementById("walletBalance").textContent="UGX "+currentWalletBalance.toLocaleString();
}

async function refreshWalletBeforeDeposit(){
  const {data,error}=await db.from('profiles').select('wallet_balance').eq('id',currentUser.id).single();
  if(error)throw error;
  currentWalletBalance=Number(data.wallet_balance||0);
  document.getElementById("walletBalance").textContent="UGX "+currentWalletBalance.toLocaleString();
  return currentWalletBalance;
}

async function loadPaymentAccounts(){const {data,error}=await db.from("payment_settings").select("*").eq("is_active",true);if(error)return;data.forEach(item=>{if(item.method==="MTN"){document.getElementById("mtnName").textContent=item.account_name;document.getElementById("mtnNumber").textContent=item.phone_number;}if(item.method==="Airtel"){document.getElementById("airtelName").textContent=item.account_name;document.getElementById("airtelNumber").textContent=item.phone_number;}})}
document.getElementById("mtnMethod").onclick=()=>{selectedMethod="MTN";document.getElementById("mtnMethod").classList.add("active");document.getElementById("airtelMethod").classList.remove("active")};
document.getElementById("airtelMethod").onclick=()=>{selectedMethod="Airtel";document.getElementById("airtelMethod").classList.add("active");document.getElementById("mtnMethod").classList.remove("active")};
document.getElementById("copyMTN").onclick=()=>navigator.clipboard.writeText(document.getElementById("mtnNumber").innerText);
document.getElementById("copyAirtel").onclick=()=>navigator.clipboard.writeText(document.getElementById("airtelNumber").innerText);
document.getElementById("submitDeposit").onclick=submitDeposit;

async function submitDeposit(){
 const btn=document.getElementById("submitDeposit");btn.disabled=true;btn.textContent="Checking wallet...";
 try{
  await refreshWalletBeforeDeposit();
  const amount=Number(document.getElementById("depositAmount").value);
  const sender=document.getElementById("senderNumber").value.trim();
  const transaction=document.getElementById("transactionId").value.trim().toUpperCase();
  const message=document.getElementById("depositMessage").value.trim();
  if(!Number.isFinite(amount)||amount<MIN_DEPOSIT){alert("Minimum deposit is UGX 10,000.");return}
  if(amount>DEPOSIT_LIMIT){alert("Maximum single deposit is UGX 20,000.");return}
  if(sender===""){alert("Sender phone number is required.");return}
  if(!/^(\+256|0)7\d{8}$/.test(sender)){alert("Enter a valid Uganda mobile number.");return}
  if(transaction===""||transaction.length<6){alert("Enter a valid transaction ID.");return}
  const {data:pending}=await db.from("deposits").select("id").eq("user_id",currentUser.id).eq("status","pending");
  if(pending?.length){alert("You already have a pending deposit request.");return}
  const {data:duplicate}=await db.from("deposits").select("id").eq("transaction_id",transaction);
  if(duplicate?.length){alert("This Transaction ID has already been used.");return}
  const {error}=await db.from("deposits").insert({user_id:currentUser.id,amount,method:selectedMethod,phone_number:sender,transaction_id:transaction,payment_message:message,status:"pending"});
  if(error)throw error;
  alert("Deposit request submitted successfully.\n\nPlease wait while our finance team reviews your payment.");
  ["depositAmount","senderNumber","transactionId","depositMessage"].forEach(id=>{const e=document.getElementById(id);if(e)e.value=""});
  await loadLatestDeposit();await loadDepositHistory();
 }catch(e){console.error('Deposit submission:',e);alert(e.message||"Unable to submit deposit request.")}
 finally{resetButton()}
}
function resetButton(){const btn=document.getElementById("submitDeposit");if(btn){btn.disabled=false;btn.textContent="Submit Deposit Request"}}
async function loadLatestDeposit(){const {data,error}=await db.from("deposits").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(1);if(error)return;if(!data.length){document.getElementById("latestStatus").textContent="🟡 No Request";document.getElementById("latestAmount").textContent="UGX 0";document.getElementById("latestMethod").textContent="-";document.getElementById("latestSender").textContent="-";document.getElementById("latestTransaction").textContent="-";document.getElementById("latestTime").textContent="-";document.getElementById("cancelDeposit").style.display="none";return}const deposit=data[0],badge=document.getElementById("latestStatus");badge.className="status "+deposit.status;badge.textContent=deposit.status.charAt(0).toUpperCase()+deposit.status.slice(1);document.getElementById("latestAmount").textContent="UGX "+Number(deposit.amount).toLocaleString();document.getElementById("latestMethod").textContent=deposit.method||"-";document.getElementById("latestSender").textContent=deposit.phone_number||"-";document.getElementById("latestTransaction").textContent=deposit.transaction_id||"-";document.getElementById("latestTime").textContent=new Date(deposit.created_at).toLocaleString();if(deposit.status==="pending"){document.getElementById("cancelDeposit").style.display="block";document.getElementById("cancelDeposit").dataset.id=deposit.id}else document.getElementById("cancelDeposit").style.display="none"}
async function loadDepositHistory(){const box=document.getElementById("depositHistory"),{data,error}=await db.from("deposits").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false});if(error)return;if(!data.length){box.innerHTML='<div class="history-empty">No deposit history available.</div>';return}box.innerHTML=data.map(item=>`<div class="history-card"><div class="top"><h4>UGX ${Number(item.amount).toLocaleString()}</h4><span class="status ${item.status}">${item.status}</span></div><p><strong>Method:</strong> ${item.method}</p><p><strong>Sender:</strong> ${item.phone_number||"-"}</p><p><strong>Transaction ID:</strong> ${item.transaction_id||"-"}</p><p><strong>Date:</strong> ${new Date(item.created_at).toLocaleString()}</p></div>`).join('')}
document.getElementById("cancelDeposit").onclick=async function(){const id=this.dataset.id;if(!id)return;if(!confirm("Cancel this pending deposit request?"))return;const{error}=await db.from("deposits").update({status:"cancelled"}).eq("id",id).eq("user_id",currentUser.id);if(error){alert(error.message);return}alert("Deposit request cancelled.");await loadLatestDeposit();await loadDepositHistory()};
db.channel("deposit_updates").on("postgres_changes",{event:"UPDATE",schema:"public",table:"deposits"},payload=>{if(payload.new.user_id===currentUser.id){loadLatestDeposit();loadDepositHistory();loadProfile()}}).subscribe();