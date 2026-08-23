/* Marathon Digital Hub — Admin User Machines
 * Stable rebuild: users, profiles, machine plans and user_machines.
 */
(() => {
  "use strict";

  const db = window.supabaseClient;
  if (!db) {
    console.error("Supabase client missing. Check supabase-config.js");
    return;
  }

  const $ = id => document.getElementById(id);
  const state = {
    users: [], plans: [], machines: [], user: null,
    filter: "all", editing: null, busy: false
  };

  const money = n => `UGX ${Number(n || 0).toLocaleString()}`;
  const esc = v => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
  const dateOnly = v => v ? new Date(v).toISOString().slice(0,10) : "";
  const isoFromDate = v => v ? new Date(`${v}T00:00:00`).toISOString() : null;
  const today = () => new Date().toISOString().slice(0,10);

  function loading(on) {
    state.busy = on;
    const el = $("loadingScreen");
    if (el) el.classList.toggle("hidden", !on);
  }

  function toast(message, type = "success") {
    const el = $("toast"), text = $("toastText");
    if (!el || !text) return;
    text.textContent = message;
    el.className = `toast show ${type}`;
    el.style.background = type === "error" ? "#ff4d4f" : "#00b95e";
    clearTimeout(window.__mdhToast);
    window.__mdhToast = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function show(id) { $(id)?.classList.remove("hidden"); }
  function hide(id) { $(id)?.classList.add("hidden"); }

  async function safe(action, successMessage = "") {
    try {
      loading(true);
      const result = await action();
      if (result?.error) throw result.error;
      if (successMessage) toast(successMessage);
      return result;
    } catch (e) {
      console.error(e);
      toast(e?.message || "Something went wrong", "error");
      return null;
    } finally { loading(false); }
  }

  async function loadUsers() {
    const { data, error } = await db.from("profiles")
      .select("*").order("created_at", { ascending: false });
    if (error) throw error;
    state.users = data || [];
    renderUsers();
    updateOverview();
  }

  async function loadPlans() {
    const { data, error } = await db.from("machines")
      .select("*").order("display_order", { ascending: true });
    if (error) throw error;
    state.plans = data || [];
    fillMachineSelect();
    updateOverview();
  }

  async function refreshAll() {
    await safe(async () => {
      await Promise.all([loadUsers(), loadPlans()]);
      if (state.user) await loadUserMachines();
    }, "Data refreshed");
  }

  function updateOverview() {
    if ($("totalUsers")) $("totalUsers").textContent = state.users.length;
    if ($("activeUsers")) $("activeUsers").textContent = state.users.filter(u => !u.is_frozen && u.account_status !== "suspended").length;
    if ($("totalMachines")) $("totalMachines").textContent = state.plans.length;
    if ($("vipMachines")) $("vipMachines").textContent = state.plans.filter(m => m.is_vip).length;
  }

  function renderUsers(list = state.users) {
    const box = $("usersList");
    if (!box) return;
    if (!list.length) {
      box.innerHTML = `<div class="emptyCard"><h3>No Users Found</h3><p>Try another name, phone or email.</p></div>`;
      return;
    }
    box.innerHTML = list.map(u => `
      <div class="userCard ${state.user?.id === u.id ? "active" : ""}" data-user="${u.id}">
        <div class="userLeft">
          <img class="userAvatar" src="${esc(u.avatar_url || "images/default-avatar.png")}" alt="">
          <div class="userInfo">
            <h3>${esc(u.fullname || "Unnamed User")}</h3>
            <p>${esc(u.phone || "No phone")}</p>
            <p>${esc(u.email || "No email")}</p>
          </div>
        </div>
        <div class="userRight">
          <span class="badge membershipBadge">${esc(u.membership || "Standard")}</span>
          <span class="userStatus ${u.is_frozen ? "frozen" : ""}">${u.is_frozen ? "Frozen" : esc(u.account_status || "Active")}</span>
        </div>
      </div>`).join("");
    box.querySelectorAll("[data-user]").forEach(card => card.addEventListener("click", () => selectUser(card.dataset.user)));
  }

  function searchUsers() {
    const q = ($( "searchInput")?.value || "").trim().toLowerCase();
    const list = !q ? state.users : state.users.filter(u =>
      [u.fullname, u.phone, u.email, u.referral_code].some(v => String(v || "").toLowerCase().includes(q))
    );
    renderUsers(list);
  }

  async function selectUser(id) {
    const user = state.users.find(u => String(u.id) === String(id));
    if (!user) return;
    state.user = user;
    renderUsers();
    show("userProfileSection");
    show("machinesSection");
    renderProfile();
    await loadUserMachines();
  }

  function renderProfile() {
    const u = state.user;
    if (!u) return;
    const set = (id, value) => { if ($(id)) $(id).textContent = value; };
    if ($("profileAvatar")) $("profileAvatar").src = u.avatar_url || "images/default-avatar.png";
    set("profileName", u.fullname || "Unknown User");
    set("profilePhone", u.phone || "No phone number");
    set("profileEmail", u.email || "No email");
    set("membershipBadge", u.membership || "Standard");
    set("statusBadge", u.is_frozen ? "Frozen" : (u.account_status || "Active"));
    set("kycBadge", u.kyc_status || "Not Verified");
    set("profileWallet", money(u.wallet_balance));
    set("profileInvested", money(u.total_invested));
    set("profileProfit", money(u.total_profit));
    set("profileReferralBonus", money(u.total_referral_bonus));
    const freeze = $("freezeUserBtn");
    if (freeze) freeze.textContent = u.is_frozen ? "✅ Unfreeze" : "❄ Freeze";
  }

  async function loadUserMachines() {
    if (!state.user) return;
    const { data, error } = await db.from("user_machines").select("*")
      .eq("user_id", state.user.id).order("purchase_date", { ascending: false });
    if (error) throw error;
    state.machines = data || [];
    renderMachineStats();
    renderMachines();
    if ($("profileMachineCount")) $("profileMachineCount").textContent = state.machines.length;
  }

  function renderMachineStats() {
    const count = s => state.machines.filter(m => m.status === s).length;
    if ($("activeMachineCount")) $("activeMachineCount").textContent = count("active");
    if ($("completedMachineCount")) $("completedMachineCount").textContent = state.machines.filter(m => m.completed || m.status === "completed").length;
    if ($("expiredMachineCount")) $("expiredMachineCount").textContent = count("expired");
    if ($("pausedMachineCount")) $("pausedMachineCount").textContent = state.machines.filter(m => m.paused || m.status === "paused").length;
  }

  function daysLeft(m) {
    if (Number.isFinite(Number(m.remaining_days))) return Math.max(0, Number(m.remaining_days));
    if (!m.expiry_date) return 0;
    return Math.max(0, Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000));
  }

  function renderMachines() {
    const box = $("machinesList");
    if (!box) return;
    let list = state.machines.slice();
    if (state.filter === "vip") list = list.filter(m => m.is_vip);
    else if (state.filter === "active") list = list.filter(m => m.status === "active" && !m.paused);
    else if (state.filter === "paused") list = list.filter(m => m.paused || m.status === "paused");
    else if (state.filter === "completed") list = list.filter(m => m.completed || m.status === "completed");
    if (!list.length) {
      box.innerHTML = `<div class="emptyCard"><h3>No Machines</h3><p>This user has no machines matching this filter.</p></div>`;
      return;
    }
    box.innerHTML = list.map(m => {
      const plan = state.plans.find(p => String(p.id) === String(m.machine_id));
      const name = m.machine_name || plan?.name || "Mining Machine";
      const image = m.machine_image || plan?.image_url || "images/default-machine.png";
      const duration = Number(m.duration_days || plan?.duration_days || 0);
      const current = Number(m.current_day || 0);
      const progress = duration ? Math.min(100, Math.round(current / duration * 100)) : 0;
      const status = m.paused ? "paused" : (m.status || (m.completed ? "completed" : "active"));
      return `<article class="machineCard" data-machine="${m.id}">
        <div class="machineTop">
          <img class="machineImage" src="${esc(image)}" alt="">
          <div class="machineInfo"><h3>${esc(name)}</h3><p>${esc(m.machine_series || plan?.series || "Machine")}</p></div>
          <span class="machineStatus ${status}">${esc(status.toUpperCase())}</span>
        </div>
        <div class="machineMeta">
          <span>${m.is_vip ? "⭐ VIP" : "Standard"}</span><span>${money(m.amount_paid)}</span><span>${daysLeft(m)} days left</span>
        </div>
        <div class="progressWrap"><div class="progressBar"><span style="width:${progress}%"></span></div><small>Day ${current}/${duration || "—"} • ${progress}%</small></div>
        <div class="machineFinancials">
          <div><small>Daily</small><b>${money(m.daily_income)}</b></div>
          <div><small>Earned</small><b>${money(m.earned_amount)}</b></div>
          <div><small>Return</small><b>${money(m.total_return)}</b></div>
        </div>
        <div class="machineActions">
          <button class="secondaryBtn editMachine" data-id="${m.id}">✏ Edit</button>
          <button class="secondaryBtn togglePause" data-id="${m.id}">${m.paused || status === "paused" ? "▶ Resume" : "⏸ Pause"}</button>
          <button class="dangerBtn deleteMachine" data-id="${m.id}">🗑 Delete</button>
        </div>
      </article>`;
    }).join("");
    box.querySelectorAll(".editMachine").forEach(b => b.onclick = () => openMachineModal(b.dataset.id));
    box.querySelectorAll(".togglePause").forEach(b => b.onclick = () => togglePause(b.dataset.id));
    box.querySelectorAll(".deleteMachine").forEach(b => b.onclick = () => deleteMachine(b.dataset.id));
  }

  function fillMachineSelect() {
    const s = $("machineSelect");
    if (!s) return;
    s.innerHTML = `<option value="">Select Machine</option>` + state.plans.map(p =>
      `<option value="${p.id}">${esc(p.name)} — ${money(p.price)}${p.is_vip ? " ⭐" : ""}</option>`
    ).join("");
  }

  function val(id, fallback = "") { return $(id)?.value ?? fallback; }
  function setVal(id, value) { if ($(id)) $(id).value = value ?? ""; }

  function openMachineModal(id = null) {
    if (!state.user) return toast("Select a user first", "error");
    state.editing = id ? state.machines.find(m => String(m.id) === String(id)) : null;
    const m = state.editing;
    const plan = m ? state.plans.find(p => String(p.id) === String(m.machine_id)) : null;
    if ($("machineModalTitle")) $("machineModalTitle").textContent = m ? "Edit Machine" : "Assign Machine";
    setVal("machineSelect", m?.machine_id || "");
    setVal("machineStatus", m?.status || "active");
    setVal("machineVip", String(Boolean(m?.is_vip)));
    setVal("machineAmountPaid", m?.amount_paid ?? plan?.price ?? 0);
    setVal("machineDailyIncome", m?.daily_income ?? plan?.daily_income ?? 0);
    setVal("machineTotalReturn", m?.total_return ?? plan?.total_return ?? 0);
    setVal("machineEarnedAmount", m?.earned_amount ?? 0);
    setVal("machinePurchaseDate", dateOnly(m?.purchase_date) || today());
    setVal("machineExpiryDate", dateOnly(m?.expiry_date));
    setVal("machineDurationDays", m?.duration_days ?? plan?.duration_days ?? 30);
    setVal("machineRemainingDays", m?.remaining_days ?? plan?.duration_days ?? 30);
    setVal("machineCurrentDay", m?.current_day ?? 0);
    setProgress();
    show("machineModal");
  }

  function setProgress() {
    const d = Number(val("machineDurationDays", 0)), c = Number(val("machineCurrentDay", 0));
    const pct = d ? Math.min(100, Math.max(0, c / d * 100)) : 0;
    if ($("machineProgress")) $("machineProgress").value = pct;
  }

  function closeMachineModal() { hide("machineModal"); state.editing = null; }

  function applyPlanDefaults() {
    const p = state.plans.find(x => String(x.id) === String(val("machineSelect")));
    if (!p || state.editing) return;
    setVal("machineAmountPaid", p.price);
    setVal("machineDailyIncome", p.daily_income);
    setVal("machineTotalReturn", p.total_return);
    setVal("machineDurationDays", p.duration_days);
    setVal("machineRemainingDays", p.duration_days);
    setVal("machineVip", String(Boolean(p.is_vip)));
    setVal("machinePurchaseDate", today());
    const expiry = new Date(); expiry.setDate(expiry.getDate() + Number(p.duration_days || 0));
    setVal("machineExpiryDate", expiry.toISOString().slice(0,10));
    setProgress();
  }

  async function saveMachine() {
    if (!state.user) return toast("Select a user first", "error");
    const plan = state.plans.find(p => String(p.id) === String(val("machineSelect")));
    if (!plan && !state.editing) return toast("Select a machine plan", "error");
    const old = state.editing;
    const duration = Number(val("machineDurationDays", plan?.duration_days || 0));
    const purchase = val("machinePurchaseDate", today());
    let expiry = val("machineExpiryDate");
    if (!expiry && duration) { const d = new Date(`${purchase}T00:00:00`); d.setDate(d.getDate()+duration); expiry = d.toISOString().slice(0,10); }
    const row = {
      user_id: state.user.id,
      machine_id: val("machineSelect") || old?.machine_id,
      amount_paid: Number(val("machineAmountPaid", 0)),
      purchase_date: isoFromDate(purchase), expiry_date: isoFromDate(expiry),
      status: val("machineStatus", "active"),
      machine_name: plan?.name || old?.machine_name || "Mining Machine",
      machine_image: plan?.image_url || old?.machine_image || null,
      is_vip: val("machineVip") === "true",
      earned_amount: Number(val("machineEarnedAmount", 0)),
      completed: val("machineStatus") === "completed",
      duration_days: duration,
      daily_income: Number(val("machineDailyIncome", 0)),
      total_return: Number(val("machineTotalReturn", 0)),
      machine_series: plan?.series || old?.machine_series || null,
      current_day: Math.max(0, Number(val("machineCurrentDay", 0))),
      remaining_days: Math.max(0, Number(val("machineRemainingDays", 0))),
      paused: val("machineStatus") === "paused",
      updated_at: new Date().toISOString()
    };
    const result = await safe(async () => old
      ? db.from("user_machines").update(row).eq("id", old.id).select().single()
      : db.from("user_machines").insert(row).select().single(),
      old ? "Machine updated" : "Machine assigned");
    if (result) { closeMachineModal(); await loadUserMachines(); }
  }

  async function togglePause(id) {
    const m = state.machines.find(x => String(x.id) === String(id));
    if (!m) return;
    const pause = !(m.paused || m.status === "paused");
    const result = await safe(() => db.from("user_machines").update({
      paused: pause, status: pause ? "paused" : "active",
      paused_at: pause ? new Date().toISOString() : null,
      resumed_at: pause ? null : new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq("id", m.id), pause ? "Machine paused" : "Machine resumed");
    if (result) await loadUserMachines();
  }

  async function deleteMachine(id) {
    const m = state.machines.find(x => String(x.id) === String(id));
    if (!m || !confirm("Delete this user's machine assignment? This cannot be undone.")) return;
    const result = await safe(() => db.from("user_machines").delete().eq("id", m.id), "Machine deleted");
    if (result) await loadUserMachines();
  }

  function openEditUser() {
    const u = state.user;
    if (!u) return toast("Select a user first", "error");
    show("editUserModal");
    const map = {
      editFullname:u.fullname, editPhone:u.phone, editEmail:u.email, editCountry:u.country,
      editGender:u.gender, editMembership:u.membership || "Standard", editLevel:u.level || 1,
      editAccountStatus:u.account_status || "active", editKycStatus:u.kyc_status || "Not Verified",
      editReferralCode:u.referral_code
    };
    Object.entries(map).forEach(([id,v]) => setVal(id,v));
    if ($("editUserAvatar")) $("editUserAvatar").src = u.avatar_url || "images/default-avatar.png";
    if ($("editPreviewName")) $("editPreviewName").textContent = u.fullname || "Unknown User";
    if ($("editPreviewPhone")) $("editPreviewPhone").textContent = u.phone || "";
  }

  async function saveUser() {
    if (!state.user) return toast("Select a user first", "error");
    const updates = {
      fullname:val("editFullname").trim(), phone:val("editPhone").trim(), email:val("editEmail").trim(),
      country:val("editCountry").trim(), gender:val("editGender"), membership:val("editMembership"),
      level:Number(val("editLevel",1)), account_status:val("editAccountStatus","active"),
      kyc_status:val("editKycStatus","Not Verified"), referral_code:val("editReferralCode").trim(),
      updated_at:new Date().toISOString()
    };
    const result = await safe(() => db.from("profiles").update(updates).eq("id",state.user.id), "User updated");
    if (result) {
      Object.assign(state.user, updates);
      const i = state.users.findIndex(u => u.id === state.user.id); if (i >= 0) Object.assign(state.users[i], updates);
      renderUsers(); renderProfile(); hide("editUserModal");
    }
  }

  async function toggleFreeze() {
    if (!state.user) return toast("Select a user first", "error");
    const freeze = !Boolean(state.user.is_frozen);
    const result = await safe(() => db.from("profiles").update({is_frozen:freeze,updated_at:new Date().toISOString()}).eq("id",state.user.id), freeze ? "Account frozen" : "Account unfrozen");
    if (result) { state.user.is_frozen = freeze; renderUsers(); renderProfile(); updateOverview(); }
  }

  async function resetPassword() {
    if (!state.user?.email) return toast("This user has no email address", "error");
    const result = await safe(() => db.auth.resetPasswordForEmail(state.user.email, {redirectTo:`${location.origin}/reset-password.html`}), "Password reset email sent");
  }

  function bind() {
    $("refreshBtn")?.addEventListener("click", refreshAll);
    $("refreshMachinesBtn")?.addEventListener("click", () => safe(loadUserMachines, "Machines refreshed"));
    $("searchInput")?.addEventListener("input", searchUsers);
    $("searchBtn")?.addEventListener("click", searchUsers);
    $("assignMachineBtn")?.addEventListener("click", () => openMachineModal());
    $("saveMachineBtn")?.addEventListener("click", saveMachine);
    $("closeMachineModal")?.addEventListener("click", closeMachineModal);
    $("cancelMachineBtn")?.addEventListener("click", closeMachineModal);
    $("editUserBtn")?.addEventListener("click", openEditUser);
    $("saveUserBtn")?.addEventListener("click", saveUser);
    $("freezeUserBtn")?.addEventListener("click", toggleFreeze);
    $("resetPasswordBtn")?.addEventListener("click", resetPassword);
    $("cancelEditUserBtn")?.addEventListener("click", () => hide("editUserModal"));
    $("closeEditUserModal")?.addEventListener("click", () => hide("editUserModal"));
    $("machineSelect")?.addEventListener("change", applyPlanDefaults);
    ["machineDurationDays","machineCurrentDay"].forEach(id => $(id)?.addEventListener("input", setProgress));
    document.querySelectorAll(".filterBtn").forEach(btn => btn.addEventListener("click", () => {
      document.querySelectorAll(".filterBtn").forEach(x => x.classList.remove("active"));
      btn.classList.add("active"); state.filter = btn.dataset.filter || "all"; renderMachines();
    }));
    $("logoutBtn")?.addEventListener("click", async () => { await db.auth.signOut(); location.href = "login.html"; });
    window.addEventListener("click", e => { if (e.target === $("machineModal")) closeMachineModal(); if (e.target === $("editUserModal")) hide("editUserModal"); });
  }

  async function init() {
    bind();
    hide("userProfileSection"); hide("machinesSection");
    await safe(async () => { await Promise.all([loadUsers(), loadPlans()]); }, "");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();