import { describe, expect, it } from 'vitest';
import { buildRound, nextTarget } from '../src/core/rounds';
import type { Item } from '../src/core/types';

const items: Item[] = [
  { id: 'a', label: 'apple', emoji: '🍎' },
  { id: 'b', label: 'ball', emoji: '⚽' },
  { id: 'c', label: 'cat', emoji: '🐱' }
];

describe('round logic', () => {
  it('never repeats immediate previous target', () => {
    for (let i = 0; i < 25; i += 1) {
      const t = nextTarget(items, 'a');
      expect(t.id).not.toBe('a');
    }
  });

  it('builds two-card rounds including target and one distractor', () => {
    const round = buildRound(items, 'easy');
    expect(round.cards).toHaveLength(2);
    expect(round.cards.some((c) => c.item.id === round.target.id)).toBe(true);
    const uniqueIds = new Set(round.cards.map((c) => c.item.id));
    expect(uniqueIds.size).toBe(2);
  });
});
