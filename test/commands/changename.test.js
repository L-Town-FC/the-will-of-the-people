const { describe, expect, test } = require('@jest/globals');
const changename = require('../../commands/changename');
const { createMessage } = require('../helpers/createMessage');

describe('changename command', () => {
  test('updates the user name across tracked json objects', () => {
    const message = createMessage();
    message.author = { id: '450001712305143869' };

    const master = {
      user1: { name: 'Andrew' },
    };
    const stats = {
      user1: { name: 'Andrew' },
    };
    const tracker = {
      user1: { name: 'Andrew' },
    };

    changename.execute(message, ['!changename', 'user1', 'Drew'], master, stats, tracker);

    expect(master.user1.name).toBe('Drew');
    expect(stats.user1.name).toBe('Drew');
    expect(tracker.user1.name).toBe('Drew');
    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual(['Name updated']);
  });
});
