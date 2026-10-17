const { describe, expect, test } = require('@jest/globals');
const button = require('../../commands/button');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

assertBasicCommandModule(button, 'button');

function createButtonMessage() {
  const message = createMessage();
  message.author = { id: 'user1', bot: false };
  message.member = null;
  message.reply = jest.fn().mockResolvedValue({
    id: 'msg1',
    edit: jest.fn(),
  });
  return message;
}

describe('button execute', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('starts a new button session and registers it', async () => {
    const message = createButtonMessage();
    const buttonJSON = {};
    const master = { user1: { name: 'Alice' } };

    button.execute(message, ['!button'], master, buttonJSON, {});

    expect(message.reply).toHaveBeenCalledTimes(1);
    const payload = message.reply.mock.calls[0][0];
    expect(payload.embeds[0].data.title).toBe('Alice current Button Session');
    expect(payload.components).toHaveLength(1);

    await jest.advanceTimersByTimeAsync(120000);

    expect(buttonJSON.user1.currentMessageID).toBe('msg1');
    expect(buttonJSON.user1.currentSessionAmount).toBe(0);
  });

  test('resets an existing button session', async () => {
    const message = createButtonMessage();
    const buttonJSON = {
      user1: { currentSessionAmount: 99, currentMessageID: 'old', currentSessionPresses: 7 },
    };
    const master = { user1: { name: 'Alice' } };

    button.execute(message, ['!button'], master, buttonJSON, {});
    await jest.advanceTimersByTimeAsync(120000);

    expect(buttonJSON.user1.currentSessionAmount).toBe(0);
    expect(buttonJSON.user1.currentSessionPresses).toBe(0);
    expect(buttonJSON.user1.currentMessageID).toBe('msg1');
  });

  test('shows button stats', () => {
    const message = createButtonMessage();
    const commandStats = { button: { Total_Presses: 3, Last_loss: 1, Total_Losses: 2 } };

    button.execute(message, ['!button', 'stats'], {}, {}, commandStats);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('Button Stats');
    expect(embed.description).toContain('Total Presses: 3');
  });

  test('shows button help', () => {
    const message = createButtonMessage();

    button.execute(message, ['!button', 'help'], {}, {}, {});

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('!button Commands');
  });

  test('shows a hint for an unknown argument', () => {
    const message = createButtonMessage();

    button.execute(message, ['!button', 'nonsense'], {}, {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Use "!button help" for a list of commands']);
  });

  test('sends an error message when starting a session fails', () => {
    const message = createButtonMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    button.execute(message, ['!button'], {}, {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in button.js']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when stats fail', () => {
    const message = createButtonMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    button.execute(message, ['!button', 'stats'], {}, {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in button.js stats']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when help fails', () => {
    const message = createButtonMessage();
    message.channel.send = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('boom');
      })
      .mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    button.execute(message, ['!button', 'help'], {}, {}, {});

    expect(message.channel.send).toHaveBeenNthCalledWith(2, 'Error occurred in button.js help');
    expect(logSpy).toHaveBeenCalled();
  });
});
