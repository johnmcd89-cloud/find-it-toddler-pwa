import type { GameMode, Item, Round } from './types';

export const MODE_INACTIVITY_MS: Record<GameMode, number> = {
  easy: 7000,
  medium: 4500
};

const shuffle = <T>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const nextTarget = (items: Item[], previousTargetId?: string): Item => {
  if (items.length < 2) throw new Error('Need at least 2 items');
  const pool = previousTargetId ? items.filter((item) => item.id !== previousTargetId) : items;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const buildRound = (items: Item[], mode: GameMode, previousTargetId?: string): Round => {
  if (items.length < 2) throw new Error('Need at least 2 items');

  const target = nextTarget(items, previousTargetId);

  const distractorPool =
    mode === 'easy'
      ? items.filter((i) => i.id !== target.id)
      : shuffle(items.filter((i) => i.id !== target.id));

  const distractor = distractorPool[0];
  const cards = shuffle([
    { id: `card-${target.id}`, item: target },
    { id: `card-${distractor.id}`, item: distractor }
  ]) as Round['cards'];

  return { target, cards };
};
