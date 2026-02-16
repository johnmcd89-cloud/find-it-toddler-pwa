import { buildRound, MODE_INACTIVITY_MS } from '../core/rounds';
import { loadSettings, saveSettings } from '../core/settings';
import { ToddlerTTS } from '../core/tts';
import type { Item, Round, Settings } from '../core/types';

export class FindItApp {
  private root: HTMLElement;
  private items: Item[];
  private tts = new ToddlerTTS();
  private readonly promptTemplates = ['Find the {item}.', 'Where is the {item}?', 'Tap the {item}.'];
  private readonly correctPhrases = [
    'Great job!',
    "That\'s right!",
    'You found it!',
    'Nice work!',
    'Yes! You did it!'
  ];
  private settings: Settings = loadSettings();
  private round: Round | null = null;
  private lastTargetId: string | undefined;
  private inactivityTimer: number | null = null;
  private unlocked = false;
  private holdTimer: number | null = null;
  private holdStart = 0;
  private holdAnim: number | null = null;
  private exitHoldTimer: number | null = null;
  private exitHoldStart = 0;
  private exitHoldAnim: number | null = null;
  private isFullscreen = false;

  constructor(root: HTMLElement, items: Item[]) {
    this.root = root;
    this.items = items;
  }

  init(): void {
    const startBtn = this.el<HTMLButtonElement>('#startBtn');
    const hotspot = this.el<HTMLButtonElement>('.parent-hotspot');
    const closeSettingsBtn = this.el<HTMLButtonElement>('#closeSettings');
    const modeSelect = this.el<HTMLSelectElement>('#modeSelect');
    const voiceToggle = this.el<HTMLInputElement>('#voiceToggle');
    const fullscreenBtn = this.el<HTMLButtonElement>('#fullscreenBtn');
    const exitHotspot = this.el<HTMLButtonElement>('#exitHotspot');

    modeSelect.value = this.settings.mode;
    voiceToggle.checked = this.settings.voiceEnabled;

    startBtn.addEventListener('click', async () => {
      this.unlocked = true;
      this.el('#startLayer').classList.add('hidden');
      await this.enterFullscreen();
      this.nextRound();
    });

    const holdStart = () => this.beginHold();
    const holdStop = () => this.endHold();

    hotspot.addEventListener('pointerdown', holdStart);
    hotspot.addEventListener('pointerup', holdStop);
    hotspot.addEventListener('pointerleave', holdStop);
    hotspot.addEventListener('pointercancel', holdStop);

    fullscreenBtn.addEventListener('click', async () => {
      await this.enterFullscreen();
    });

    const exitHoldStart = () => this.beginExitHold();
    const exitHoldStop = () => this.endExitHold();
    exitHotspot.addEventListener('pointerdown', exitHoldStart);
    exitHotspot.addEventListener('pointerup', exitHoldStop);
    exitHotspot.addEventListener('pointerleave', exitHoldStop);
    exitHotspot.addEventListener('pointercancel', exitHoldStop);

    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = Boolean(document.fullscreenElement);
      this.syncFullscreenUi();
    });
    this.syncFullscreenUi();

    closeSettingsBtn.addEventListener('click', () => this.closeSettings());

    modeSelect.addEventListener('change', () => {
      this.settings.mode = modeSelect.value as Settings['mode'];
      this.settings.inactivityMs = MODE_INACTIVITY_MS[this.settings.mode];
      saveSettings(this.settings);
      if (this.unlocked) this.nextRound();
    });

    voiceToggle.addEventListener('change', () => {
      this.settings.voiceEnabled = voiceToggle.checked;
      saveSettings(this.settings);
    });
  }

  private beginHold(): void {
    const duration = 2000;
    this.holdStart = performance.now();
    this.holdTimer = window.setTimeout(() => {
      this.openSettings();
      this.endHold();
    }, duration);

    const ring = this.el('.parent-progress');
    ring.classList.add('show');

    const tick = (time: number) => {
      const p = Math.min((time - this.holdStart) / duration, 1);
      ring.style.setProperty('--hold-progress', `${p}`);
      if (p < 1) this.holdAnim = requestAnimationFrame(tick);
    };

    this.holdAnim = requestAnimationFrame(tick);
  }

  private endHold(): void {
    if (this.holdTimer !== null) window.clearTimeout(this.holdTimer);
    if (this.holdAnim !== null) cancelAnimationFrame(this.holdAnim);
    this.holdTimer = null;
    this.holdAnim = null;
    const ring = this.el('.parent-progress');
    ring.classList.remove('show');
    ring.style.setProperty('--hold-progress', '0');
  }

  private beginExitHold(): void {
    const duration = 2000;
    this.exitHoldStart = performance.now();
    this.exitHoldTimer = window.setTimeout(async () => {
      await this.exitFullscreen();
      this.endExitHold();
    }, duration);

    const ring = this.el('#exitProgress');
    ring.classList.add('show');

    const tick = (time: number) => {
      const p = Math.min((time - this.exitHoldStart) / duration, 1);
      ring.style.setProperty('--hold-progress', `${p}`);
      if (p < 1) this.exitHoldAnim = requestAnimationFrame(tick);
    };

    this.exitHoldAnim = requestAnimationFrame(tick);
  }

  private endExitHold(): void {
    if (this.exitHoldTimer !== null) window.clearTimeout(this.exitHoldTimer);
    if (this.exitHoldAnim !== null) cancelAnimationFrame(this.exitHoldAnim);
    this.exitHoldTimer = null;
    this.exitHoldAnim = null;
    const ring = this.el('#exitProgress');
    ring.classList.remove('show');
    ring.style.setProperty('--hold-progress', '0');
  }

  private openSettings(): void {
    this.el('#settingsPanel').classList.remove('hidden');
  }

  private closeSettings(): void {
    this.el('#settingsPanel').classList.add('hidden');
  }

  private async enterFullscreen(): Promise<void> {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignore failures (platform/browser may block fullscreen).
    }
    this.isFullscreen = Boolean(document.fullscreenElement);
    this.syncFullscreenUi();
  }

  private async exitFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore failures.
    }
    this.isFullscreen = Boolean(document.fullscreenElement);
    this.syncFullscreenUi();
  }

  private syncFullscreenUi(): void {
    const fullscreenBtn = this.el<HTMLButtonElement>('#fullscreenBtn');
    const exitHotspot = this.el<HTMLButtonElement>('#exitHotspot');
    fullscreenBtn.classList.toggle('hidden', this.isFullscreen);
    exitHotspot.classList.toggle('hidden', !this.isFullscreen);
    this.el('#exitProgress').classList.toggle('show', false);
  }

  private nextRound(): void {
    this.round = buildRound(this.items, this.settings.mode, this.lastTargetId);
    this.lastTargetId = this.round.target.id;

    this.renderCards();
    this.announcePrompt();
    this.resetInactivityTimer();
  }

  private renderCards(): void {
    if (!this.round) return;

    const board = this.el('#board');
    board.innerHTML = '';

    this.round.cards.forEach((card) => {
      const btn = document.createElement('button');
      btn.className = 'card';
      btn.dataset.itemId = card.item.id;
      btn.innerHTML = `<span class="emoji">${card.item.emoji}</span><span class="label">${card.item.label}</span>`;
      btn.addEventListener('click', () => this.handleGuess(card.item.id));
      board.appendChild(btn);
    });
  }

  private handleGuess(itemId: string): void {
    if (!this.round) return;
    const statusText = this.el('#statusText');

    if (itemId === this.round.target.id) {
      const praise = this.correctPhrases[Math.floor(Math.random() * this.correctPhrases.length)] ?? 'Great job!';
      const confirm = `${praise} That is the ${this.round.target.label}.`;
      statusText.textContent = confirm;
      this.markCardFeedback(itemId, true);
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
      this.tts.speak(confirm, { enabled: this.settings.voiceEnabled });
      // Leave a longer pause so praise fully finishes before next prompt.
      window.setTimeout(() => this.nextRound(), 3200);
      return;
    }

    const retryPrompt = this.makePrompt(this.round.target.label);
    statusText.textContent = `Try again. ${retryPrompt}`;
    this.markCardFeedback(itemId, false);
    this.tts.speak(`Try again. ${retryPrompt}`, { enabled: this.settings.voiceEnabled });
    this.resetInactivityTimer();
  }

  private makePrompt(itemLabel: string): string {
    const template = this.promptTemplates[Math.floor(Math.random() * this.promptTemplates.length)] ?? 'Find the {item}.';
    return template.replace('{item}', itemLabel);
  }

  private announcePrompt(): void {
    if (!this.round) return;
    const prompt = this.makePrompt(this.round.target.label);
    this.el('#statusText').textContent = prompt;
    this.tts.speak(prompt, { enabled: this.settings.voiceEnabled });
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer !== null) window.clearTimeout(this.inactivityTimer);

    this.inactivityTimer = window.setTimeout(() => {
      this.announcePrompt();
      this.resetInactivityTimer();
    }, this.settings.inactivityMs);
  }

  private markCardFeedback(itemId: string, isCorrect: boolean): void {
    const board = this.el('#board');
    const card = board.querySelector<HTMLButtonElement>(`.card[data-item-id="${itemId}"]`);
    if (!card) return;

    card.classList.remove('correct', 'incorrect');
    card.classList.add(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      const board = this.el('#board');
      board.classList.remove('celebrate');
      // restart animation reliably
      void board.offsetWidth;
      board.classList.add('celebrate');
      window.setTimeout(() => board.classList.remove('celebrate'), 1300);
    }

    window.setTimeout(() => {
      card.classList.remove('correct', 'incorrect');
    }, 500);
  }

  private el<T extends HTMLElement = HTMLElement>(selector: string): T {
    const found = this.root.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element: ${selector}`);
    return found;
  }
}
