const { describe, expect, test } = require('@jest/globals');
const setCommand = require('../../commands/set');
const { createMessage } = require('../helpers/createMessage');

describe('set command', () => {
  test('lets the owner set a users gbp', () => {
    const message = createMessage();
    message.author = { id: '450001712305143869' };

    const master = {
      user1: { name: 'Andrew', gbp: 12 },
    };

    setCommand.execute(message, ['!set', 'Andrew', '99'], master);

    expect(master.user1.gbp).toBe(99);
    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual([
      'Andrew has been set to 99 gbp',
    ]);
  });
});
