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

  test('captures console.error and console.warn output', () => {
    console.error('an error entry');
    console.warn('a warning entry');

    const message = createMessage();
    logs.execute(message, []);

    const embed = message.channel.send.calls[0][0].embeds[0];
    expect(embed.description).toContain('ERROR: an error entry');
    expect(embed.description).toContain('WARN: a warning entry');
  });

  test('serializes object arguments with JSON', () => {
    console.log({ info: true });
    console.error({ err: 'x' });
    console.warn({ warn: 'y' });

    const message = createMessage();
    logs.execute(message, []);

    const embed = message.channel.send.calls[0][0].embeds[0];
    expect(embed.description).toContain('INFO: {"info":true}');
    expect(embed.description).toContain('ERROR: {"err":"x"}');
    expect(embed.description).toContain('WARN: {"warn":"y"}');
  });

  test('trims the log buffer once it exceeds the maximum size', () => {
    for (let i = 0; i < 55; i++) {
      console.log('entry ' + i);
    }

    const message = createMessage();
    logs.execute(message, []);

    const embed = message.channel.send.calls[0][0].embeds[0];
    expect(embed.description).toContain('entry 54');
    expect(embed.description).not.toContain('entry 0');
  });
});
