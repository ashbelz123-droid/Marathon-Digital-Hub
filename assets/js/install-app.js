(() => {
  let deferredPrompt = null;
  const install = document.querySelectorAll('[data-install-app]');
  const banner = document.querySelector('[data-install-banner]');
  const close = document.querySelector('[data-install-close]');
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (standalone) return;

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    banner?.removeAttribute('hidden');
  });

  async function installApp() {
    if (!deferredPrompt) {
      document.querySelector('[data-install-help]')?.removeAttribute('hidden');
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    banner?.setAttribute('hidden', '');
  }

  install.forEach(button => button.addEventListener('click', installApp));
  close?.addEventListener('click', () => banner?.setAttribute('hidden', ''));
  window.addEventListener('appinstalled', () => banner?.setAttribute('hidden', ''));
})();
