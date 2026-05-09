const { describe, expect, test } = require('@jest/globals');
const { tracker } = require('../../../commands/Functions/stats_functions');

describe('stats_functions tracker', () => {
  const user = '123';
  const makeStats = () => ({
    [user]: {
      lottery_tickets: 0,
      bj_wins: 0,
      bj_pushes: 0,
      bj_losses: 0,
      gg_wins: 0,
      gg_losses: 0,
      total_msgs: 0,
      total_commands: 0,
      farm_messages: 0,
      non_farm_messages: 0,
    },
  });

  test.each([
    [1, 'lottery_tickets', 5],
    [2, 'bj_wins', 1],
    [3, 'bj_pushes', 2],
    [4, 'bj_losses', 3],
    [5, 'gg_wins', 4],
    [6, 'gg_losses', 5],
    [7, 'total_msgs', 10],
    [8, 'total_commands', 7],
    [9, 'farm_messages', 8],
    [10, 'non_farm_messages', 9],
  ])('stat %i increments %s by %i', (stat, field, increment) => {
    const stats = makeStats();
    tracker(user, stat, increment, stats);
    expect(stats[user][field]).toBe(increment);
  });

  test('accumulates multiple increments on the same stat', () => {
    const stats = makeStats();
    tracker(user, 1, 3, stats);
    tracker(user, 1, 7, stats);
    expect(stats[user].lottery_tickets).toBe(10);
  });

  test('does nothing for unknown stat value', () => {
    const stats = makeStats();
    tracker(user, 99, 10, stats);
    expect(stats[user]).toEqual(makeStats()[user]);
  });
});
