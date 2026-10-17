const { describe, expect, test } = require('@jest/globals');
const changename = require('../../commands/changename');
const { createMessage } = require('../helpers/createMessage');

describe('changename command', () => {
  test('updates the user name across tracked json objects', () => {
    const message = createMessage();
    message.author = { id: '450001712305143869' };

    const master = {
      user1: { name: 'Andrew' },
      user2: { name: 'Ben' },
    };
    const stats = {
      user1: { name: 'Andrew' },
      user2: { name: 'Ben' },
    };
    const tracker = {
      user1: { name: 'Andrew' },
      user2: { name: 'Ben' },
    };

    changename.execute(message, ['!changename', 'user1', 'Drew'], master, stats, tracker);

    expect(master.user1.name).toBe('Drew');
    expect(stats.user1.name).toBe('Drew');
    expect(tracker.user1.name).toBe('Drew');
    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual(['Name updated']);
  });

  test('lets the owner know when the target user does not exist', () => {
    const message = createMessage();
    message.author = { id: '450001712305143869' };

    changename.execute(message, ['!changename', 'ghost', 'Drew'], {}, {}, {});

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual(["That user doesn't exist"]);
  });

  test('reports an error when the tracked objects are out of sync', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const message = createMessage();
    message.author = { id: '450001712305143869' };

    changename.execute(
      message,
      ['!changename', 'user1', 'Drew'],
      { user1: { name: 'Andrew' } },
      {},
      {},
    );

    expect(consoleSpy).toHaveBeenCalled();
    expect(message.channel.send.calls[0]).toEqual(['Error occurred in changenames.js']);

    consoleSpy.mockRestore();
  });

  test('does nothing for non-owner users', () => {
    const message = createMessage();
    message.author = { id: 'someone-else' };

    changename.execute(message, ['!changename', 'user1', 'Drew'], {}, {}, {});

    expect(message.channel.send.calls).toHaveLength(0);
  });
});
