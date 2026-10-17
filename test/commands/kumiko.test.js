const { describe, expect, test } = require('@jest/globals');
const fs = require('fs');
const kumiko = require('../../commands/kumiko');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('../../commands/Functions/GeneralFunctions', () => ({
  CommandPurchase: jest.fn(),
}));

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  tracker1: jest.fn(),
}));

const general = require('../../commands/Functions/GeneralFunctions');
const unlock = require('../../commands/Functions/Achievement_Functions');

assertBasicCommandModule(kumiko, 'kumiko');

describe('kumiko execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('charges the author and sends a random kumiko image', () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    message.channel.id = 'someChannel';
    const master = { user1: { gbp: 100 } };
    jest.spyOn(fs, 'readdirSync').mockReturnValue(['a.png', 'b.png', 'c.png']);
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    kumiko.execute(message, master, {});

    expect(general.CommandPurchase).toHaveBeenCalledWith(message, master, 15, 'user1');
    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0][0].files[0].attachment).toBe('./kumiko_pics/b.png');
    expect(unlock.tracker1).toHaveBeenCalledWith('user1', 14, 1, message, master, {});
  });

  test('does not send an image in the no-kumiko channel', () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    message.channel.id = '711634711281401867';
    const master = { user1: { gbp: 100 } };
    jest.spyOn(fs, 'readdirSync').mockReturnValue(['a.png']);
    jest.spyOn(Math, 'random').mockReturnValue(0.1);

    kumiko.execute(message, master, {});

    expect(general.CommandPurchase).toHaveBeenCalled();
    expect(message.channel.send.calls).toHaveLength(0);
    expect(unlock.tracker1).not.toHaveBeenCalled();
  });

  test('sends an error message when the purchase fails', () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    message.channel.id = 'someChannel';
    const master = { user1: { gbp: 100 } };
    jest.spyOn(fs, 'readdirSync').mockReturnValue(['a.png']);
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    general.CommandPurchase.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    kumiko.execute(message, master, {});

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in Kumiko.js']);
    expect(logSpy).toHaveBeenCalled();
  });
});
