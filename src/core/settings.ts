import { MODE_INACTIVITY_MS } from './rounds';
import type { GameMode, Settings } from './types';

const SETTINGS_KEY = 'find-it-settings-v1';

export const defaultSettings = (): Settings => ({
  mode: 'easy',
  voiceEnabled: true,
  inactivityMs: MODE_INACTIVITY_MS.easy
});

const parseMode = (raw: unknown): GameMode => (raw === 'medium' ? 'medium' : 'easy');

export const loadSettings = (): Settings => {
  const fallback = defaultSettings();
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const mode = parseMode(parsed.mode);
    const inactivityMs =
      typeof parsed.inactivityMs === 'number' && parsed.inactivityMs > 1000
        ? parsed.inactivityMs
        : MODE_INACTIVITY_MS[mode];

    return {
      mode,
      voiceEnabled: parsed.voiceEnabled !== false,
      inactivityMs
    };
  } catch {
    return fallback;
  }
};

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
