const { describe, expect, test } = require('@jest/globals');
const unlock = require('../../../commands/Functions/Achievement_Functions');

jest.mock('fs');
const fs = require('fs');

const mockAchievements = {
  1: { name: 'First Steps', description: 'Send your first message', threshold: 5 },
  2: { name: 'Big Spender', description: 'Spend 1000 GBP', threshold: 3 },
};

const makeMsg = () => {
  const send = jest.fn();
  return { channel: { send } };
};

beforeEach(() => {
  jest.clearAllMocks();
  fs.readFileSync.mockReturnValue(JSON.stringify(mockAchievements));
});

describe('unlock', () => {
  test('unlocks achievement and sends message', () => {
    const msg = makeMsg();
    const master = { user1: { name: 'Alice', achievements: [] } };

    unlock.unlock('user1', 1, msg, master);

    expect(master.user1.achievements).toEqual([1]);
    expect(msg.channel.send).toHaveBeenCalledWith(
      'Alice Achievement Unlock: First Steps \nDescription: Send your first message',
    );
  });

  test('does not unlock already-earned achievement', () => {
    const msg = makeMsg();
    const master = { user1: { name: 'Alice', achievements: [1] } };

    unlock.unlock('user1', 1, msg, master);

    expect(master.user1.achievements).toEqual([1]);
    expect(msg.channel.send).not.toHaveBeenCalled();
  });
});

describe('index_unlock', () => {
  test('unlocks and sends to channel', () => {
    const send = jest.fn();
    const channel = { send };
    const master = { user1: { name: 'Alice', achievements: [] } };

    unlock.index_unlock('user1', 1, channel, master);

    expect(master.user1.achievements).toEqual([1]);
    expect(send).toHaveBeenCalledWith('Alice Achievement Unlock: First Steps');
  });
});

describe('reset1', () => {
  test('resets tracker value to 0', () => {
    const msg = makeMsg();
    const tracker = { user1: { 5: 3 } };

    unlock.reset1('user1', 5, tracker, msg);

    expect(tracker.user1[5]).toBe(0);
  });
});

describe('reset2', () => {
  test('resets all other users achievement index to false', () => {
    const msg = makeMsg();
    const tracker = {
      user1: { 10: [true, true] },
      user2: { 10: [true, true] },
    };

    unlock.reset2('user1', 10, 0, tracker, msg);

    expect(tracker.user1[10]).toEqual([true, true]);
    expect(tracker.user2[10]).toEqual([false, true]);
  });
});

describe('tracker1', () => {
  test('increments and unlocks when threshold reached', () => {
    const msg = makeMsg();
    const master = { user1: { name: 'Alice', achievements: [] } };
    const tracker = { user1: { 1: 4 } };

    unlock.tracker1('user1', 1, 1, msg, master, tracker);

    expect(tracker.user1[1]).toBe(5);
    expect(master.user1.achievements).toEqual([1]);
    expect(msg.channel.send).toHaveBeenCalledWith(
      'Alice Achievement Unlock: First Steps \nDescription: Send your first message',
    );
  });

  test('increments but does not unlock when threshold not met', () => {
    const msg = makeMsg();
    const master = { user1: { name: 'Alice', achievements: [] } };
    const tracker = { user1: { 1: 2 } };

    unlock.tracker1('user1', 1, 1, msg, master, tracker);

    expect(tracker.user1[1]).toBe(3);
    expect(master.user1.achievements).toEqual([]);
    expect(msg.channel.send).not.toHaveBeenCalled();
  });
});

describe('tracker2', () => {
  test('sets index true and unlocks when all true', () => {
    const msg = makeMsg();
    const master = { user1: { name: 'Alice', achievements: [] } };
    const tracker = { user1: { 2: [true, false] } };

    unlock.tracker2('user1', 2, 1, msg, master, tracker);

    expect(tracker.user1[2]).toEqual([true, true]);
    expect(master.user1.achievements).toEqual([2]);
  });

  test('does not unlock when not all true', () => {
    const msg = makeMsg();
    const master = { user1: { name: 'Alice', achievements: [] } };
    const tracker = { user1: { 2: [false, false] } };

    unlock.tracker2('user1', 2, 0, msg, master, tracker);

    expect(tracker.user1[2]).toEqual([true, false]);
    expect(master.user1.achievements).toEqual([]);
  });
});

describe('tracker3', () => {
  const achievement3 = { ...mockAchievements };
  achievement3[3] = { name: 'Persistent', description: 'Do it 5 times', threshold: 5 };

  test('increments by index and unlocks when all meet threshold', () => {
    fs.readFileSync.mockReturnValue(JSON.stringify(achievement3));

    const msg = makeMsg();
    const master = { user1: { name: 'Alice', achievements: [] } };
    const tracker = { user1: { 3: [4, 5] } };

    unlock.tracker3('user1', 3, 0, 1, msg, master, tracker);

    expect(tracker.user1[3]).toEqual([5, 5]);
    expect(master.user1.achievements).toEqual([3]);
  });

  test('does not unlock when not all meet threshold', () => {
    fs.readFileSync.mockReturnValue(JSON.stringify(achievement3));

    const msg = makeMsg();
    const master = { user1: { name: 'Alice', achievements: [] } };
    const tracker = { user1: { 3: [3, 5] } };

    unlock.tracker3('user1', 3, 0, 1, msg, master, tracker);

    expect(tracker.user1[3]).toEqual([4, 5]);
    expect(master.user1.achievements).toEqual([]);
  });
});
