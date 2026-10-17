const { describe, expect, test } = require('@jest/globals');
const kumikosays = require('../../commands/kumikosays');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('jimp', () => ({
  read: jest.fn(() =>
    Promise.resolve({
      print: jest.fn(),
      writeAsync: jest.fn(() => Promise.resolve()),
    })
  ),
  loadFont: jest.fn(() => Promise.resolve({})),
  FONT_SANS_32_BLACK: 'FONT_SANS_32_BLACK',
}));

const jimp = require('jimp');

assertBasicCommandModule(kumikosays, 'kumikosays');

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('kumikosays execute', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders text onto the template and sends it in a guild', async () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    message.guild = {};

    kumikosays.execute(message, ['!kumikosays', 'hello'], {});

    await flush();
    await flush();

    expect(jimp.read).toHaveBeenCalledWith('kumiko_template.png');
    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0][0].files).toHaveLength(1);
  });

  test('sends the image to the author in a DM', async () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    message.guild = null;
    const recipient = { id: 'user1', send: jest.fn() };
    const bot = { users: { cache: { find: () => recipient } } };

    kumikosays.execute(message, ['!kumikosays', 'hello'], bot);

    await flush();
    await flush();

    expect(message.channel.send.calls).toHaveLength(0);
    expect(recipient.send).toHaveBeenCalledTimes(1);
  });

  test('rejects text that is too long', async () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    message.guild = {};
    const longWord = 'a'.repeat(20);

    kumikosays.execute(message, ['!kumikosays', longWord, longWord, longWord, longWord, longWord, longWord], {});

    await flush();
    await flush();

    expect(message.channel.send.calls[0]).toEqual([
      'You have too many characters. The max is 5 lines of text or about 75 character',
    ]);
  });
});
