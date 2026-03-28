const { describe, expect, test } = require('@jest/globals');
const ping = require('../../commands/ping');
const { createMessage } = require('../helpers/createMessage');

describe('ping command', () => {
  test('responds with pong', () => {
    const message = createMessage();

    ping.execute(message);

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual(['pong']);
  });
});
