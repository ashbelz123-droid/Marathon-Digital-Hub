/*=========================================
MARATHON DIGITAL HUB
MACHINES PAGE
=========================================*/

const db = window.supabaseClient;
let currentUser = null;
let allMachines = [];
let purchasedMachines = [];
let currentSeries = "All";

document.addEventListener("DOMContentLoaded", startPage);

async function startPage() {
    try {
        showLoading(true);
        const { data, error } = await db.auth.getUser();
        if (error) throw error;
        if (!data.user) {
            window.location.href = "login.html";
            return;
        }
        currentUser = data.user;
        await loadPurchasedMachines();
        await loadMachines();
    } catch (error) {
        console.error(error);
        const container = document.getElementById("machinesContainer");
        if (container) container.innerHTML = `<div class="loading">Failed to load machines.</div>`;
    } finally {
        showLoading(false);
    }
}

function showLoading(show = true) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = show ? "flex" : "none";
}
function hideLoading() { showLoading(false); }

async function loadPurchasedMachines() {
    purchasedMachines = [];
    const { data, error } = await db
        .from("user_machines")
        .select("machine_id")
        .eq("user_id", currentUser.id)
        .eq("status", "active");
    if (error) {
        console.error("Purchased Machines:", error);
        return;
    }
    purchasedMachines = (data || []).map(item => item.machine_id);
}

async function loadMachines() {
    const container = document.getElementById("machinesContainer");
    container.innerHTML = `<div class="loading">Loading machines...</div>`;

    const { data, error } = await db
        .from("machines")
        .select("*")
        .eq("status", true)
        .order("display_order", { ascending: true })
        .order("price", { ascending: true });

    if (error) {
        console.error("Machines:", error);
        container.innerHTML = `<div class="loading">Failed to load machines.</div>`;
        return;
    }

    allMachines = data || [];
    if (!allMachines.length) {
        container.style.display = "none";
        document.getElementById("emptyState").style.display = "block";
        return;
    }

    document.getElementById("emptyState").style.display = "none";
    container.style.display = "flex";
    buildSeriesTabs();
    renderMachines(currentSeries);
}

function buildSeriesTabs() {
    const tabs = document.getElementById("seriesTabs");
    tabs.innerHTML = "";
    createSeriesTab("All");
    const groups = [];
    allMachines.forEach(machine => {
        const group = getSeriesGroup(machine.series);
        if (!groups.includes(group)) groups.push(group);
    });
    groups.sort((a, b) => seriesRank(a) - seriesRank(b) || a.localeCompare(b));
    groups.forEach(createSeriesTab);
}

function seriesRank(series) {
    const value = String(series || "").toUpperCase();
    if (value.includes("VIP PRO")) return 1;
    if (value.includes("VIP")) return 2;
    if (value.startsWith("B")) return 3;
    return 4;
}

function getSeriesGroup(series) {
    if (!series) return "General";
    return String(series).replace(/[0-9]/g, "").trim().toUpperCase();
}

function createSeriesTab(name) {
    const button = document.createElement("button");
    button.textContent = name;
    if (name === currentSeries) button.classList.add("active");
    button.onclick = () => {
        currentSeries = name;
        document.querySelectorAll("#seriesTabs button").forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        renderMachines(name);
    };
    document.getElementById("seriesTabs").appendChild(button);
}

function renderMachines(series) {
    const container = document.getElementById("machinesContainer");
    container.innerHTML = "";
    const machines = series === "All" ? allMachines : allMachines.filter(machine => getSeriesGroup(machine.series) === series);
    if (!machines.length) {
        container.innerHTML = `<div class="loading">No machines available.</div>`;
        return;
    }
    machines.forEach(machine => {
        const purchased = purchasedMachines.includes(machine.id);
        container.innerHTML += createMachineCard(machine, purchased);
    });
}

function createMachineCard(machine, purchased) {
    const image = machine.image_url && machine.image_url !== "" ? machine.image_url : "images/default-machine.png";
    return `
    <div class="machine-card">
        <div class="machine-top">
            <img src="${escapeHtml(image)}" class="machine-image" loading="lazy" onerror="this.src='images/default-machine.png'">
            <div class="machine-details">
                <div class="machine-name">${escapeHtml(machine.name || "Machine")}</div>
                <div class="machine-row"><span>Price</span><strong>UGX ${Number(machine.price || 0).toLocaleString()}</strong></div>
                <div class="machine-row"><span>Total Return</span><strong>UGX ${Number(machine.total_return || 0).toLocaleString()}</strong></div>
                <div class="machine-row"><span>Duration</span><strong>${Number(machine.duration_days || 0)} Days</strong></div>
            </div>
        </div>
        <button class="buy-btn" ${purchased ? "disabled" : ""} onclick="buyMachine('${machine.id}', this)">${purchased ? "PURCHASED ✓" : "BUY MACHINE"}</button>
    </div>`;
}

async function buyMachine(machineId, button) {
    if (!currentUser) return;
    const originalText = button ? button.innerText : "BUY MACHINE";
    try {
        if (button) {
            button.disabled = true;
            button.innerText = "Processing...";
        }
        showLoading(true);

        if (purchasedMachines.includes(machineId)) {
            showError("You already own this machine.");
            return;
        }

        const { data, error } = await db.rpc("purchase_machine", { p_machine_id: machineId });
        if (error) throw error;
        if (!data || data.success !== true) throw new Error("Purchase could not be completed.");

        await loadPurchasedMachines();
        renderMachines(currentSeries);
        showSuccess("Machine purchased successfully.");
    } catch (error) {
        console.error("Machine purchase:", error);
        const messages = {
            AUTH_REQUIRED: "Please log in again.",
            PROFILE_NOT_FOUND: "Your account profile could not be found.",
            ACCOUNT_RESTRICTED: "Your account is restricted from purchasing machines.",
            MACHINE_UNAVAILABLE: "This machine is no longer available.",
            INVALID_MACHINE_PRICE: "This machine has an invalid price.",
            MACHINE_ALREADY_OWNED: "You already own this machine.",
            INSUFFICIENT_BALANCE: "Insufficient wallet balance."
        };
        showError(messages[error.message] || "Purchase failed. Please try again.");
    } finally {
        hideLoading();
        if (button && button.disabled && !purchasedMachines.includes(machineId)) {
            button.disabled = false;
            button.innerText = originalText;
        }
    }
}

function showSuccess(message) {
    const popup = document.getElementById("successPopup");
    const text = document.getElementById("successMessage");
    if (text) text.textContent = message;
    if (popup) {
        popup.style.display = "flex";
        setTimeout(() => { popup.style.display = "none"; }, 2500);
    } else alert(message);
}

function showError(message) { alert(message); }

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
}

document.addEventListener("error", event => {
    if (event.target.tagName === "IMG" && !event.target.dataset.fallback) {
        event.target.dataset.fallback = "1";
        event.target.src = "images/default-machine.png";
    }
}, true);

document.addEventListener("visibilitychange", async () => {
    if (document.hidden || !currentUser) return;
    await loadPurchasedMachines();
    renderMachines(currentSeries);
});
