const { describe, expect, test } = require('@jest/globals');
const booTrigger = require('../../commands/boo_trigger');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');

assertBasicCommandModule(booTrigger, 'boo_trigger');

function createBooMessage() {
  return {
    author: { id: 'booUser' },
    content: 'hello there',
    react: jest.fn().mockResolvedValue(undefined),
    channel: { send: jest.fn() },
  };
}

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('boo_trigger execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('reacts when the booed user sends a non-command message and the roll hits 4', async () => {
    const message = createBooMessage();
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    booTrigger.execute(message, { boo: 'booUser' });
    await flush();

    expect(message.react).toHaveBeenCalledWith('591022023489355787');
  });

  test('does not react when the roll misses', () => {
    const message = createBooMessage();
    jest.spyOn(Math, 'random').mockReturnValue(0.1);

    booTrigger.execute(message, { boo: 'booUser' });

    expect(message.react).not.toHaveBeenCalled();
  });

  test('does not react when the message starts with an exclamation mark', () => {
    const message = createBooMessage();
    message.content = '!boo someone';
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    booTrigger.execute(message, { boo: 'booUser' });

    expect(message.react).not.toHaveBeenCalled();
  });

  test('does not react when a different user sent the message', () => {
    const message = createBooMessage();
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    booTrigger.execute(message, { boo: 'someoneElse' });

    expect(message.react).not.toHaveBeenCalled();
  });

  test('falls back to the secondary reaction when the primary reaction fails', async () => {
    const message = createBooMessage();
    message.react = jest
      .fn()
      .mockRejectedValueOnce(new Error('missing emoji'))
      .mockResolvedValue(undefined);
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    booTrigger.execute(message, { boo: 'booUser' });
    await flush();

    expect(message.react).toHaveBeenNthCalledWith(1, '591022023489355787');
    expect(message.react).toHaveBeenNthCalledWith(2, '714888403346391110');
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when the fallback reaction also fails', async () => {
    const message = createBooMessage();
    message.react = jest
      .fn()
      .mockRejectedValueOnce(new Error('missing emoji'))
      .mockImplementationOnce(() => {
        throw new Error('sync failure');
      });
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    booTrigger.execute(message, { boo: 'booUser' });
    await flush();

    expect(message.channel.send).toHaveBeenCalledWith('Error Occurred in Boo Trigger');
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when accessing the message author throws', () => {
    const message = { content: 'hi', channel: { send: jest.fn() } };
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    booTrigger.execute(message, { boo: 'booUser' });

    expect(message.channel.send).toHaveBeenCalledWith('Error occurred in boo_trigger.js');
    expect(logSpy).toHaveBeenCalled();
  });
});
