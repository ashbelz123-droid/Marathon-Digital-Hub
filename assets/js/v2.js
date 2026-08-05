const marathonUser = localStorage.getItem("marathonName") || "Investor";
const returning = localStorage.getItem("marathonReturning") === "yes";
localStorage.setItem("marathonReturning", "yes");
document.querySelectorAll("[data-user-name]").forEach((el) => {
  el.textContent = marathonUser;
});
document.querySelectorAll("[data-ai-greeting]").forEach((el) => {
  el.textContent = returning
    ? `Welcome back, ${marathonUser}. I can help with deposits, machines, withdrawals, and account questions.`
    : `Welcome to Marathon Digital Hub, ${marathonUser}. I am Marathon AI, your guided investment assistant.`;
});
document.querySelectorAll("[data-set-name]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = form.querySelector('input[name="name"]');
    if (input && input.value.trim()) {
      localStorage.setItem("marathonName", input.value.trim());
      location.reload();
    }
  });
});
document.querySelectorAll("[data-prompt]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.querySelector("[data-ai-answer]");
    if (!target) return;
    const value = btn.dataset.prompt;
    const answers = {
      faq: "Marathon AI can answer FAQs about deposits, withdrawals, machines, referrals, wallet balances, KYC, and support tickets.",
      guide:
        "Start by registering, funding your wallet, choosing a machine, then tracking ROI from the Dashboard and Wallet pages.",
      support:
        "For support, open the Support page, describe your issue, and an admin can follow up while Marathon AI suggests next steps.",
    };
    target.textContent =
      answers[value] || "I am ready to guide you through Marathon Digital Hub.";
  });
});
