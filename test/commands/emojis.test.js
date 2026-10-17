const { describe, expect, test } = require('@jest/globals');
const emojis = require('../../commands/emojis');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

assertBasicCommandModule(emojis, 'emojis');

function createBot() {
  return {
    emojis: {
      cache: {
        get: (id) => `<:${id}:0>`,
      },
    },
  };
}

function createEmojiList(count) {
  const list = {};
  for (let i = 0; i < count; i++) {
    list[`emoji${i}`] = { count: count - i };
  }
  return list;
}

describe('emojis execute', () => {
  test('shows top and bottom five reactions by default', () => {
    const message = createMessage();
    message.author = { bot: false };
    message.member = null;

    emojis.execute(message, ['!emojis'], createEmojiList(12), createBot());

    expect(message.channel.send.calls).toHaveLength(1);
    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('Top and Bottom 5 emoji reactions');
    expect(embed.description).toBeUndefined();
  });

  test('shows all reactions in a single embed when under the cutoff', () => {
    const message = createMessage();
    message.author = { bot: false };
    message.member = null;

    emojis.execute(message, ['!emojis', 'all'], createEmojiList(12), createBot());

    expect(message.channel.send.calls).toHaveLength(1);
    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('All Emoji Reactions Usage Ranked');
  });

  test('splits all reactions into two embeds when over the cutoff', () => {
    const message = createMessage();
    message.author = { bot: false };
    message.member = null;

    emojis.execute(message, ['!emojis', 'all'], createEmojiList(55), createBot());

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0][0].embeds).toHaveLength(2);
  });

  test('shows help for an unknown argument', () => {
    const message = createMessage();
    message.author = { bot: false };
    message.member = null;

    emojis.execute(message, ['!emojis', 'info'], createEmojiList(12), createBot());

    expect(message.channel.send.calls).toHaveLength(1);
    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('List of Emoji Commands');
  });
});
