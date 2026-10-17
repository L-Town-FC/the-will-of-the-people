const { describe, expect, test } = require('@jest/globals');
const msg = require('../../commands/msg');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  unlock: jest.fn(),
}));

const unlock = require('../../commands/Functions/Achievement_Functions');

assertBasicCommandModule(msg, 'msg');

function createRecipient() {
  return { id: 'user2', send: jest.fn() };
}

function createMsgMessage(attachments = []) {
  const recipient = createRecipient();
  const bot = {
    users: { cache: { find: (predicate) => (predicate(recipient) ? recipient : null) } },
  };
  return {
    recipient,
    bot,
    message: {
      author: { id: 'user1' },
      channel: { send: jest.fn() },
      attachments: {
        size: attachments.length,
        first: () => attachments[0],
      },
    },
  };
}

function createMaster() {
  return {
    user1: { name: 'Alice', gbp: 1000 },
    user2: { name: 'Bob', gbp: 500 },
  };
}

describe('msg execute', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('sends an anonymous message to the target', () => {
    const { message, bot, recipient } = createMsgMessage();
    const master = createMaster();

    msg.execute(message, ['!msg', 'Bob', 'hello', 'there'], master, bot);

    expect(master.user1.gbp).toBe(950);
    expect(recipient.send).toHaveBeenCalledWith('hello there ');
  });

  test('shows prices when help is requested', () => {
    const { message, bot } = createMsgMessage();
    const master = createMaster();

    msg.execute(message, ['!msg', 'help'], master, bot);

    const firstSend = message.channel.send.mock.calls[0][0];
    expect(firstSend.embeds[0].data.title).toBe('!msg Help');
  });

  test('rejects an empty message', () => {
    const { message, bot } = createMsgMessage();
    const master = createMaster();

    msg.execute(message, ['!msg', 'Bob'], master, bot);

    expect(message.channel.send).toHaveBeenCalledWith("You can't send an empty message");
  });

  test('rejects sending a command', () => {
    const { message, bot } = createMsgMessage();
    const master = createMaster();

    msg.execute(message, ['!msg', 'Bob', '!ping'], master, bot);

    expect(message.channel.send).toHaveBeenCalledWith("You can't send someone a command");
  });

  test('rejects more than one attachment', () => {
    const { message, bot } = createMsgMessage([{ url: 'a.png' }, { url: 'b.png' }]);
    const master = createMaster();

    msg.execute(message, ['!msg', 'Bob', 'hi'], master, bot);

    expect(message.channel.send).toHaveBeenCalledWith("You can't send more than 1 attachment");
  });

  test('sends a single attachment', () => {
    const { message, bot, recipient } = createMsgMessage([{ url: 'a.png' }]);
    const master = createMaster();

    msg.execute(message, ['!msg', 'Bob', 'pic'], master, bot);

    expect(recipient.send).toHaveBeenCalledTimes(1);
    const payload = recipient.send.mock.calls[0][0];
    expect(payload.content).toBe('pic ');
    expect(payload.files).toHaveLength(1);
  });

  test('unlocks the schizophrenic achievement when messaging yourself', () => {
    const { message } = createMsgMessage();
    const master = createMaster();
    const selfBot = {
      users: {
        cache: {
          find: (predicate) => (predicate({ id: 'user1' }) ? { id: 'user1', send: jest.fn() } : null),
        },
      },
    };

    msg.execute(message, ['!msg', 'Alice', 'hey'], master, selfBot);

    expect(unlock.unlock).toHaveBeenCalledWith('user1', 45, message, master);
  });

  test('defaults to an invalid target when no name is given', () => {
    const { message, bot } = createMsgMessage();
    const master = createMaster();

    msg.execute(message, ['!msg'], master, bot);

    expect(message.channel.send).toHaveBeenCalledWith("That person doesn't exist");
  });

  test('reports when the target does not exist', () => {
    const { message, bot } = createMsgMessage();
    const master = createMaster();

    msg.execute(message, ['!msg', 'Nobody', 'hi'], master, bot);

    expect(message.channel.send).toHaveBeenCalledWith("That person doesn't exist");
  });

  test('sends an error message when the message fails', () => {
    const { message, bot } = createMsgMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    msg.execute(message, ['!msg', 'Bob', 'hi'], {}, bot);

    expect(message.channel.send).toHaveBeenCalledWith('Error occurred in msg.js');
    expect(logSpy).toHaveBeenCalled();
  });
});
