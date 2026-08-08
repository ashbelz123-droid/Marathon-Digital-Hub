(() => {
  const banner = document.querySelector('[data-mdh-install-banner]');
  const installButton = document.querySelector('[data-mdh-install]');
  const closeButton = document.querySelector('[data-mdh-install-close]');
  if (!banner || !installButton) return;

  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isInstalled || localStorage.getItem('mdh-install-dismissed') === '1') return;

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    banner.hidden = false;
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      banner.querySelector('[data-mdh-install-help]')?.removeAttribute('hidden');
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    banner.hidden = true;
  });

  closeButton?.addEventListener('click', () => {
    banner.hidden = true;
    localStorage.setItem('mdh-install-dismissed', '1');
  });
})();
