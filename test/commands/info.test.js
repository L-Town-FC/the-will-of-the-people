const { describe, expect, test } = require('@jest/globals');
const info = require('../../commands/info');
const { createMessage } = require('../helpers/createMessage');

describe('info command', () => {
  test('shows bot info', () => {
    const message = createMessage();
    const previousVersion = process.env.APP_VERSION;
    process.env.APP_VERSION = 'v2.2.3';

    info.execute(message, []);

    expect(message.channel.send.calls).toHaveLength(1);
    const embed = message.channel.send.calls[0][0];
    expect(embed.embeds).toBeDefined();
    expect(embed.embeds[0].fields).toHaveLength(3);
    expect(embed.embeds[0].fields[0].name).toBe('Bot Info');
    expect(embed.embeds[0].fields[0].value).toContain('v2.2.3');

    if (previousVersion === undefined) {
      delete process.env.APP_VERSION;
    } else {
      process.env.APP_VERSION = previousVersion;
    }
  });

  test('shows system information', () => {
    const message = createMessage();

    info.execute(message, []);

    expect(message.channel.send.calls).toHaveLength(1);
    const embed = message.channel.send.calls[0][0];
    const systemField = embed.embeds[0].fields.find(f => f.name === 'System');
    expect(systemField).toBeDefined();
    expect(systemField.value).toContain('Node:');
    expect(systemField.value).toContain('Platform:');
  });

  test('shows memory information', () => {
    const message = createMessage();

    info.execute(message, []);

    expect(message.channel.send.calls).toHaveLength(1);
    const embed = message.channel.send.calls[0][0];
    const memField = embed.embeds[0].fields.find(f => f.name === 'Memory');
    expect(memField).toBeDefined();
    expect(memField.value).toContain('RSS:');
    expect(memField.value).toContain('Heap Used:');
  });
});
