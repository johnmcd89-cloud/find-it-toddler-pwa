import { buildRound, MODE_INACTIVITY_MS } from '../core/rounds';
import { loadSettings, saveSettings } from '../core/settings';
import { ToddlerTTS } from '../core/tts';
import type { Item, Round, Settings } from '../core/types';

export class FindItApp {
  private root: HTMLElement;
  private items: Item[];
  private tts = new ToddlerTTS();
  private readonly promptTemplates = ['Find the {item}.', 'Where is the {item}?', 'Tap the {item}.'];
  private settings: Settings = loadSettings();
  private round: Round | null = null;
  private lastTargetId: string | undefined;
  private inactivityTimer: number | null = null;
  private unlocked = false;
  private holdTimer: number | null = null;
  private holdStart = 0;
  private holdAnim: number | null = null;

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

    modeSelect.value = this.settings.mode;
    voiceToggle.checked = this.settings.voiceEnabled;

    startBtn.addEventListener('click', () => {
      this.unlocked = true;
      this.el('#startLayer').classList.add('hidden');
      this.nextRound();
    });

    const holdStart = () => this.beginHold();
    const holdStop = () => this.endHold();

    hotspot.addEventListener('pointerdown', holdStart);
    hotspot.addEventListener('pointerup', holdStop);
    hotspot.addEventListener('pointerleave', holdStop);
    hotspot.addEventListener('pointercancel', holdStop);

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

  private openSettings(): void {
    this.el('#settingsPanel').classList.remove('hidden');
  }

  private closeSettings(): void {
    this.el('#settingsPanel').classList.add('hidden');
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
      btn.innerHTML = `<span class="emoji">${card.item.emoji}</span><span class="label">${card.item.label}</span>`;
      btn.addEventListener('click', () => this.handleGuess(card.item.id));
      board.appendChild(btn);
    });
  }

  private handleGuess(itemId: string): void {
    if (!this.round) return;
    const statusText = this.el('#statusText');

    if (itemId === this.round.target.id) {
      statusText.textContent = 'Great job!';
      this.tts.speak('Great job!', { enabled: this.settings.voiceEnabled });
      window.setTimeout(() => this.nextRound(), 400);
      return;
    }

    const retryPrompt = this.makePrompt(this.round.target.label);
    statusText.textContent = `Try again. ${retryPrompt}`;
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

  private el<T extends HTMLElement = HTMLElement>(selector: string): T {
    const found = this.root.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element: ${selector}`);
    return found;
  }
}
