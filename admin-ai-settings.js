const AI_SETTINGS_KEY = "marathonAiSettings";
const statusEl = document.getElementById("aiSettingsStatus");
const form = document.getElementById("aiSettingsForm");
const fields = {
  newUserGreeting: document.getElementById("newUserGreeting"),
  returningUserGreeting: document.getElementById("returningUserGreeting"),
  escalationRoute: document.getElementById("escalationRoute"),
  faqKnowledge: document.getElementById("faqKnowledge"),
};

const defaults = {
  newUserGreeting: "Welcome to Marathon Digital Hub, {name}. I am Marathon AI.",
  returningUserGreeting: "Welcome back, {name}. How can I help today?",
  escalationRoute: "support_tickets",
  faqKnowledge:
    "Deposits, withdrawals, machines, wallet, referrals, security, KYC, installation.",
};

function setStatus(message, tone = "success") {
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
}

function readStoredSettings() {
  try {
    return JSON.parse(localStorage.getItem(AI_SETTINGS_KEY)) || defaults;
  } catch (error) {
    return defaults;
  }
}

function hydrateForm() {
  const settings = { ...defaults, ...readStoredSettings() };
  Object.entries(fields).forEach(([key, field]) => {
    field.value = settings[key];
  });
}

function collectFormSettings() {
  return Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, field.value.trim()]),
  );
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const settings = collectFormSettings();

  if (!settings.newUserGreeting || !settings.returningUserGreeting) {
    setStatus("Both greeting messages are required before saving.", "error");
    return;
  }

  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
  setStatus(
    "AI settings saved on this device. Connect a Supabase settings table to sync them globally.",
  );
});

hydrateForm();
setStatus("AI settings loaded. Review and save changes when ready.");
