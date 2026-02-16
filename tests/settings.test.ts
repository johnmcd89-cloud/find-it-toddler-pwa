import { beforeEach, describe, expect, it } from 'vitest';
import { defaultSettings, loadSettings, saveSettings } from '../src/core/settings';

const store = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => store.clear()
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true
});

describe('settings persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('returns defaults when storage is empty', () => {
    expect(loadSettings()).toEqual(defaultSettings());
  });

  it('saves and reloads settings', () => {
    const settings = { mode: 'medium' as const, voiceEnabled: false, inactivityMs: 4500 };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });
});
