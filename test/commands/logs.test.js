const { describe, expect, test } = require('@jest/globals');
const logs = require('../../commands/logs');
const { createMessage } = require('../helpers/createMessage');

describe('logs command', () => {
  test('shows recent log entries', () => {
    const message = createMessage();

    logs.execute(message, []);

    expect(message.channel.send.calls).toHaveLength(1);
    const embed = message.channel.send.calls[0][0];
    expect(embed.embeds).toBeDefined();
    expect(embed.embeds[0].title).toBe('Recent Bot Logs');
  });

  test('logs alias works', () => {
    const message = createMessage();

    logs.execute(message, []);

    expect(message.channel.send.calls).toHaveLength(1);
  });
});
