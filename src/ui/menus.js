export class MenuSystem {
  constructor() {
    this._loadingEl  = document.getElementById('loading');
    this._loadingBar = document.getElementById('loading-bar');
    this._startEl    = document.getElementById('start');
    this._loadingText = document.getElementById('loading-text');
    // PWA install prompt
    this._installBtn = document.getElementById('install-btn');
    this._deferredPrompt = null;
    this._setupPWAInstall();
  }

  _setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      this._deferredPrompt = e;
      if (this._installBtn) {
        this._installBtn.style.display = 'flex';
        this._installBtn.addEventListener('click', () => this._installPWA());
      }
    });
    window.addEventListener('appinstalled', () => {
      if (this._installBtn) this._installBtn.style.display = 'none';
      this._deferredPrompt = null;
    });
  }

  async _installPWA() {
    if (!this._deferredPrompt) return;
    this._deferredPrompt.prompt();
    const { outcome } = await this._deferredPrompt.userChoice;
    this._deferredPrompt = null;
    if (this._installBtn) this._installBtn.style.display = 'none';
  }

  runLoadingScreen(onBuildCity) {
    return new Promise(resolve => {
      let pct = 0;
      const messages = ['LOADING APEX CITY', 'GENERATING ROADS', 'SPAWNING TRAFFIC', 'READY'];
      onBuildCity();
      const interval = setInterval(() => {
        pct += Math.random() * 15 + 5;
        const clamped = Math.min(pct, 100);
        this._loadingBar.style.width = clamped + '%';
        const msgIdx = Math.floor((clamped / 100) * (messages.length - 1));
        if (this._loadingText) this._loadingText.textContent = messages[msgIdx] || messages[0];
        if (pct >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            this._loadingEl.style.display = 'none';
            this._startEl.style.display   = 'flex';
            resolve();
          }, 400);
        }
      }, 120);
    });
  }

  waitForStart() {
    return new Promise(resolve => {
      this._startEl.addEventListener('click', () => {
        this._startEl.style.opacity = '0';
        setTimeout(() => { this._startEl.style.display = 'none'; resolve(); }, 700);
      }, { once: true });
    });
  }
}
