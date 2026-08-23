/* Marathon Digital Hub — Admin User Machines V3
 * Inspected against the live Supabase schema and page HTML.
 */
(() => {
  "use strict";

  const db = window.supabaseClient;
  if (!db) return console.error("Supabase client missing. Check supabase-config.js");

  const $ = id => document.getElementById(id);
  const state = { users: [], plans: [], machines: [], user: null, filter: "all", editing: null };
  const money = n => `UGX ${Number(n || 0).toLocaleString()}`;
  const esc = v => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
  const today = () => new Date().toISOString().slice(0,10);
  const dateOnly = v => v ? new Date(v).toISOString().slice(0,10) : "";
  const iso = v => v ? new Date(`${v}T00:00:00`).toISOString() : null;
  const val = (id, fallback="") => $(id)?.value ?? fallback;
  const setVal = (id, value) => { if ($(id)) $(id).value = value ?? ""; };
  const show = id => $(id)?.classList.remove("hidden");
  const hide = id => $(id)?.classList.add("hidden");

  function toast(message, type="success") {
    const el=$("toast"), text=$("toastText"); if(!el||!text) return;
    text.textContent=message; el.className=`toast show ${type}`;
    el.style.background=type==="error"?"#ff4d4f":"#00b95e";
    clearTimeout(window.__mdhToast); window.__mdhToast=setTimeout(()=>el.classList.remove("show"),3200);
  }

  async function safe(action, message="") {
    try {
      $("loadingScreen")?.classList.remove("hidden");
      const r=await action();
      if(r?.error) throw r.error;
      if(message) toast(message);
      return r;
    } catch(e) { console.error(e); toast(e?.message||"Operation failed","error"); return null; }
    finally { $("loadingScreen")?.classList.add("hidden"); }
  }

  async function loadUsers() {
    const {data,error}=await db.from("profiles").select("*").order("created_at",{ascending:false});
    if(error) throw error; state.users=data||[]; renderUsers(); updateOverview();
  }

  async function loadPlans() {
    const {data,error}=await db.from("machines").select("*").order("display_order",{ascending:true});
    if(error) throw error; state.plans=data||[]; fillMachineSelect(); updateOverview();
  }

  function updateOverview(){
    if($("totalUsers")) $("totalUsers").textContent=state.users.length;
    if($("activeUsers")) $("activeUsers").textContent=state.users.filter(u=>!u.is_frozen&&u.account_status!=="suspended").length;
    if($("totalMachines")) $("totalMachines").textContent=state.plans.length;
    if($("vipMachines")) $("vipMachines").textContent=state.plans.filter(m=>m.is_vip).length;
  }

  function renderUsers(list=state.users){
    const box=$("usersList"); if(!box) return;
    if(!list.length){box.innerHTML='<div class="emptyCard"><h3>No Users Found</h3><p>Try another name, phone, email or referral code.</p></div>';return;}
    box.innerHTML=list.map(u=>`<div class="userCard ${state.user?.id===u.id?"active":""}" data-user="${esc(u.id)}">
      <div class="userLeft"><img class="userAvatar" src="${esc(u.avatar_url||"images/default-avatar.png")}" alt="">
      <div class="userInfo"><h3>${esc(u.fullname||"Unnamed User")}</h3><p>${esc(u.phone||"No phone")}</p><p>${esc(u.email||"No email")}</p></div></div>
      <div class="userRight"><span class="badge membershipBadge">${esc(u.membership||"Standard")}</span><span class="userStatus ${u.is_frozen?"frozen":u.account_status==="suspended"?"suspended":""}">${u.is_frozen?"Frozen":esc(u.account_status||"Active")}</span></div>
    </div>`).join("");
    box.querySelectorAll("[data-user]").forEach(c=>c.onclick=()=>selectUser(c.dataset.user));
  }

  function searchUsers(){
    const q=(val("searchInput").trim()).toLowerCase();
    renderUsers(!q?state.users:state.users.filter(u=>[u.fullname,u.phone,u.email,u.referral_code].some(v=>String(v||"").toLowerCase().includes(q))));
  }

  async function selectUser(id){
    state.user=state.users.find(u=>String(u.id)===String(id)); if(!state.user) return;
    renderUsers(); show("userProfileSection"); show("machinesSection"); renderProfile(); await safe(loadUserMachines);
  }

  function renderProfile(){
    const u=state.user;if(!u)return;
    const set=(id,v)=>{if($(id))$(id).textContent=v;};
    if($("profileAvatar"))$("profileAvatar").src=u.avatar_url||"images/default-avatar.png";
    set("profileName",u.fullname||"Unknown User");set("profilePhone",u.phone||"No phone number");set("profileEmail",u.email||"No email");
    set("membershipBadge",u.membership||"Standard");set("statusBadge",u.is_frozen?"Frozen":(u.account_status||"Active"));set("kycBadge",u.kyc_status||"Not Verified");
    set("profileWallet",money(u.wallet_balance));set("profileInvested",money(u.total_invested));set("profileProfit",money(u.total_profit));set("profileReferralBonus",money(u.total_referral_bonus));
    if($("freezeUserBtn"))$("freezeUserBtn").textContent=u.is_frozen?"✅ Unfreeze":"❄ Freeze";
  }

  async function loadUserMachines(){
    if(!state.user)return;
    const {data,error}=await db.from("user_machines").select("*").eq("user_id",state.user.id).order("purchase_date",{ascending:false});
    if(error)throw error;state.machines=data||[];renderMachineStats();renderMachines();
    if($("profileMachineCount"))$("profileMachineCount").textContent=state.machines.length;
  }

  function renderMachineStats(){
    const active=state.machines.filter(m=>m.status==="active"&&!m.paused&&!m.completed).length;
    const completed=state.machines.filter(m=>m.completed||m.status==="completed").length;
    const expired=state.machines.filter(m=>m.status==="expired").length;
    const paused=state.machines.filter(m=>m.paused||m.status==="paused").length;
    ["activeMachineCount","completedMachineCount","expiredMachineCount","pausedMachineCount"].forEach((id,i)=>{if($(id))$(id).textContent=[active,completed,expired,paused][i];});
  }

  function daysLeft(m){
    if(m.remaining_days!==null&&m.remaining_days!==undefined)return Math.max(0,Number(m.remaining_days)||0);
    return m.expiry_date?Math.max(0,Math.ceil((new Date(m.expiry_date)-Date.now())/86400000)):0;
  }

  function renderMachines(){
    const box=$("machinesList");if(!box)return;let list=state.machines.slice();
    if(state.filter==="vip")list=list.filter(m=>m.is_vip);
    if(state.filter==="active")list=list.filter(m=>m.status==="active"&&!m.paused&&!m.completed);
    if(state.filter==="paused")list=list.filter(m=>m.paused||m.status==="paused");
    if(state.filter==="completed")list=list.filter(m=>m.completed||m.status==="completed");
    if(!list.length){box.innerHTML='<div class="emptyCard"><h3>No Machines</h3><p>No machine assignments match this filter.</p></div>';return;}
    box.innerHTML=list.map(m=>{
      const p=state.plans.find(x=>String(x.id)===String(m.machine_id));const duration=Number(m.duration_days||p?.duration_days||0);const current=Number(m.current_day||0);const pct=duration?Math.min(100,Math.round(current/duration*100)):0;
      const status=m.paused?"paused":(m.status||(m.completed?"completed":"active"));
      return `<article class="machineCard"><div class="machineTop"><img class="machineImage" src="${esc(m.machine_image||p?.image_url||"images/default-machine.png")}" alt=""><div class="machineInfo"><h3>${esc(m.machine_name||p?.name||"Mining Machine")}</h3><p>${esc(m.machine_series||p?.series||"Machine")}</p></div><span class="machineStatus ${esc(status)}">${esc(status.toUpperCase())}</span></div>
      <div class="machineMeta"><span>${m.is_vip?"⭐ VIP":"Standard"}</span><span>${money(m.amount_paid)}</span><span>${daysLeft(m)} days left</span></div>
      <div class="progressWrap"><div class="progressBar"><span style="width:${pct}%"></span></div><small>Day ${current}/${duration||"—"} • ${pct}%</small></div>
      <div class="machineFinancials"><div><small>Daily</small><b>${money(m.daily_income)}</b></div><div><small>Earned</small><b>${money(m.earned_amount)}</b></div><div><small>Return</small><b>${money(m.total_return)}</b></div></div>
      <div class="machineActions"><button class="secondaryBtn editMachine" data-id="${m.id}">✏ Edit</button><button class="secondaryBtn togglePause" data-id="${m.id}">${m.paused||status==="paused"?"▶ Resume":"⏸ Pause"}</button><button class="dangerBtn deleteMachine" data-id="${m.id}">🗑 Delete</button></div></article>`;
    }).join("");
    box.querySelectorAll(".editMachine").forEach(b=>b.onclick=()=>openMachineModal(b.dataset.id));
    box.querySelectorAll(".togglePause").forEach(b=>b.onclick=()=>togglePause(b.dataset.id));
    box.querySelectorAll(".deleteMachine").forEach(b=>b.onclick=()=>deleteMachine(b.dataset.id));
  }

  function fillMachineSelect(){
    const s=$("machineSelect");if(!s)return;s.innerHTML='<option value="">Select Machine</option>'+state.plans.map(p=>`<option value="${p.id}">${esc(p.name)} — ${money(p.price)}${p.is_vip?" ⭐":""}</option>`).join("");
  }

  function openMachineModal(id=null){
    if(!state.user)return toast("Select a user first","error");
    state.editing=id?state.machines.find(m=>String(m.id)===String(id)):null;const m=state.editing;const p=m?state.plans.find(x=>String(x.id)===String(m.machine_id)):null;
    if($("machineModalTitle"))$("machineModalTitle").textContent=m?"Edit Machine":"Assign Machine";
    setVal("machineSelect",m?.machine_id||"");setVal("machineStatus",m?.status||"active");setVal("machineVip",String(Boolean(m?.is_vip)));
    setVal("machineAmountPaid",m?.amount_paid??p?.price??0);setVal("machineDailyIncome",m?.daily_income??p?.daily_income??0);setVal("machineTotalReturn",m?.total_return??p?.total_return??0);setVal("machineEarnedAmount",m?.earned_amount??0);
    setVal("machinePurchaseDate",dateOnly(m?.purchase_date)||today());setVal("machineExpiryDate",dateOnly(m?.expiry_date));setVal("machineDurationDays",m?.duration_days??p?.duration_days??30);setVal("machineRemainingDays",m?.remaining_days??p?.duration_days??30);setVal("machineCurrentDay",m?.current_day??0);setVal("machineNotes",m?.admin_notes||m?.notes||"");setVal("customDays","");
    setProgress();show("machineModal");
  }

  function setProgress(){const d=Number(val("machineDurationDays",0)),c=Number(val("machineCurrentDay",0));if($("machineProgress"))$("machineProgress").value=d?Math.min(100,Math.max(0,c/d*100)):0;}
  function closeMachineModal(){hide("machineModal");state.editing=null;}

  function applyPlanDefaults(){
    const p=state.plans.find(x=>String(x.id)===String(val("machineSelect")));if(!p||state.editing)return;
    setVal("machineAmountPaid",p.price);setVal("machineDailyIncome",p.daily_income);setVal("machineTotalReturn",p.total_return);setVal("machineDurationDays",p.duration_days);setVal("machineRemainingDays",p.duration_days);setVal("machineVip",String(Boolean(p.is_vip)));setVal("machinePurchaseDate",today());
    const d=new Date();d.setDate(d.getDate()+Number(p.duration_days||0));setVal("machineExpiryDate",d.toISOString().slice(0,10));setProgress();
  }

  function adjustDays(amount){
    const next=Math.max(0,Number(val("machineRemainingDays",0))+Number(amount||0));setVal("machineRemainingDays",next);
    const purchase=val("machinePurchaseDate",today());const d=new Date(`${purchase}T00:00:00`);d.setDate(d.getDate()+next);setVal("machineExpiryDate",d.toISOString().slice(0,10));
    toast(`${amount>=0?"Added":"Removed"} ${Math.abs(amount)} day${Math.abs(amount)===1?"":"s"}`);
  }

  async function saveMachine(){
    if(!state.user)return toast("Select a user first","error");const p=state.plans.find(x=>String(x.id)===String(val("machineSelect")));const old=state.editing;
    if(!p&&!old)return toast("Select a machine plan","error");
    const duration=Math.max(0,Number(val("machineDurationDays",p?.duration_days||0)));const purchase=val("machinePurchaseDate",today());let expiry=val("machineExpiryDate");
    if(!expiry&&duration){const d=new Date(`${purchase}T00:00:00`);d.setDate(d.getDate()+duration);expiry=d.toISOString().slice(0,10);}
    const status=val("machineStatus","active");
    const row={user_id:state.user.id,machine_id:val("machineSelect")||old?.machine_id,amount_paid:Number(val("machineAmountPaid",0)),purchase_date:iso(purchase),expiry_date:iso(expiry),status,
      machine_name:p?.name||old?.machine_name||"Mining Machine",machine_image:p?.image_url||old?.machine_image||null,is_vip:val("machineVip")==="true",earned_amount:Number(val("machineEarnedAmount",0)),completed:status==="completed",duration_days:duration,daily_income:Number(val("machineDailyIncome",0)),total_return:Number(val("machineTotalReturn",0)),machine_series:p?.series||old?.machine_series||null,current_day:Math.max(0,Number(val("machineCurrentDay",0))),remaining_days:Math.max(0,Number(val("machineRemainingDays",0))),paused:status==="paused",admin_notes:val("machineNotes").trim(),updated_at:new Date().toISOString()};
    const r=await safe(()=>old?db.from("user_machines").update(row).eq("id",old.id).select().single():db.from("user_machines").insert(row).select().single(),old?"Machine updated":"Machine assigned");
    if(r){closeMachineModal();await safe(loadUserMachines);}
  }

  async function togglePause(id){
    const m=state.machines.find(x=>String(x.id)===String(id));if(!m)return;const pause=!(m.paused||m.status==="paused");
    const r=await safe(()=>db.from("user_machines").update({paused:pause,status:pause?"paused":"active",paused_at:pause?new Date().toISOString():null,resumed_at:pause?null:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",m.id),pause?"Machine paused":"Machine resumed");if(r)await safe(loadUserMachines);
  }

  async function deleteMachine(id){
    const m=state.machines.find(x=>String(x.id)===String(id));if(!m||!confirm("Delete this user's machine assignment? This cannot be undone."))return;
    const r=await safe(()=>db.from("user_machines").delete().eq("id",m.id),"Machine deleted");if(r)await safe(loadUserMachines);
  }

  function openEditUser(){
    const u=state.user;if(!u)return toast("Select a user first","error");show("editUserModal");
    [["editFullname",u.fullname],["editPhone",u.phone],["editEmail",u.email],["editCountry",u.country],["editGender",u.gender],["editMembership",u.membership||"Standard"],["editLevel",u.level||1],["editAccountStatus",u.account_status||"active"],["editKycStatus",u.kyc_status||"Not Verified"],["editReferralCode",u.referral_code]].forEach(([id,v])=>setVal(id,v));
    if($("editUserAvatar"))$("editUserAvatar").src=u.avatar_url||"images/default-avatar.png";if($("editPreviewName"))$("editPreviewName").textContent=u.fullname||"Unknown User";if($("editPreviewPhone"))$("editPreviewPhone").textContent=u.phone||"";
  }

  async function saveUser(){
    if(!state.user)return toast("Select a user first","error");
    const updates={fullname:val("editFullname").trim(),phone:val("editPhone").trim(),email:val("editEmail").trim(),country:val("editCountry").trim(),gender:val("editGender"),membership:val("editMembership"),level:Number(val("editLevel",1)),account_status:val("editAccountStatus","active"),kyc_status:val("editKycStatus","Not Verified"),referral_code:val("editReferralCode").trim(),updated_at:new Date().toISOString()};
    const r=await safe(()=>db.from("profiles").update(updates).eq("id",state.user.id),"User updated");if(r){Object.assign(state.user,updates);const i=state.users.findIndex(u=>u.id===state.user.id);if(i>=0)Object.assign(state.users[i],updates);renderUsers();renderProfile();hide("editUserModal");}
  }

  async function toggleFreeze(){
    if(!state.user)return toast("Select a user first","error");const freeze=!Boolean(state.user.is_frozen);const r=await safe(()=>db.from("profiles").update({is_frozen:freeze,updated_at:new Date().toISOString()}).eq("id",state.user.id),freeze?"Account frozen":"Account unfrozen");if(r){state.user.is_frozen=freeze;renderUsers();renderProfile();updateOverview();}
  }

  async function sendPasswordReset(){
    if(!state.user?.email)return toast("This user has no email address","error");
    const r=await safe(()=>db.auth.resetPasswordForEmail(state.user.email,{redirectTo:`${location.origin}/reset-password.html`}),"Password reset email sent");if(r)hide("resetPasswordModal");
  }

  function bind(){
    $("refreshBtn")?.addEventListener("click",()=>safe(async()=>{await Promise.all([loadUsers(),loadPlans()]);if(state.user)await loadUserMachines();},"Data refreshed"));
    $("refreshMachinesBtn")?.addEventListener("click",()=>safe(loadUserMachines,"Machines refreshed"));$("searchInput")?.addEventListener("input",searchUsers);$("searchBtn")?.addEventListener("click",searchUsers);
    $("assignMachineBtn")?.addEventListener("click",()=>openMachineModal());$("saveMachineBtn")?.addEventListener("click",saveMachine);$("closeMachineModal")?.addEventListener("click",closeMachineModal);
    $("cancelMachineBtn")?.addEventListener("click",closeMachineModal);$("deleteMachineBtn")?.addEventListener("click",()=>state.editing&&deleteMachine(state.editing.id).then(closeMachineModal));$("machineSelect")?.addEventListener("change",applyPlanDefaults);
    ["machineDurationDays","machineCurrentDay"].forEach(id=>$(id)?.addEventListener("input",setProgress));
    document.querySelectorAll(".addDay,.removeDay").forEach(b=>b.addEventListener("click",()=>adjustDays(Number(b.dataset.days))));$("applyCustomDays")?.addEventListener("click",()=>{const n=Number(val("customDays",0));if(!Number.isFinite(n)||n===0)return toast("Enter a non-zero number of days","error");adjustDays(n);setVal("customDays","");});
    $("editUserBtn")?.addEventListener("click",openEditUser);$("saveUserBtn")?.addEventListener("click",saveUser);$("freezeUserBtn")?.addEventListener("click",toggleFreeze);$("resetPasswordBtn")?.addEventListener("click",()=>{if(!state.user?.email)return toast("This user has no email address","error");show("resetPasswordModal");});
    $("closeResetPasswordModal")?.addEventListener("click",()=>hide("resetPasswordModal"));$("confirmResetPasswordBtn")?.addEventListener("click",sendPasswordReset);$("cancelEditUserBtn")?.addEventListener("click",()=>hide("editUserModal"));$("closeEditUserModal")?.addEventListener("click",()=>hide("editUserModal"));
    document.querySelectorAll(".filterBtn").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".filterBtn").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.filter=b.dataset.filter||"all";renderMachines();}));
    $("logoutBtn")?.addEventListener("click",async()=>{await db.auth.signOut();location.href="admin-login.html";});
    $("homeBtn")?.addEventListener("click",()=>location.href="admin.html");$("usersBtn")?.addEventListener("click",()=>location.href="admin-users.html");$("machinesBtn")?.addEventListener("click",()=>location.href="admin-machines.html");$("supportBtn")?.addEventListener("click",()=>location.href="admin-support.html");$("settingsBtn")?.addEventListener("click",()=>location.href="admin.html#settings");
    window.addEventListener("click",e=>{if(e.target===$("machineModal"))closeMachineModal();if(e.target===$("editUserModal"))hide("editUserModal");if(e.target===$("resetPasswordModal"))hide("resetPasswordModal");});
  }

  async function init(){
    bind();hide("userProfileSection");hide("machinesSection");
    const session=await db.auth.getSession();if(!session.data?.session){location.href="admin-login.html";return;}
    await safe(async()=>{await Promise.all([loadUsers(),loadPlans()]);});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();