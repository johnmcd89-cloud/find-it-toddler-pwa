export type GameMode = 'easy' | 'medium';

export interface Item {
  id: string;
  label: string;
  emoji: string;
}

export interface Card {
  id: string;
  item: Item;
}

export interface Round {
  target: Item;
  cards: [Card, Card];
}

export interface Settings {
  mode: GameMode;
  voiceEnabled: boolean;
  inactivityMs: number;
}
