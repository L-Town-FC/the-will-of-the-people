const { describe, expect, test } = require('@jest/globals');
const fs = require('fs');
const pug = require('../../commands/pug');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  tracker1: jest.fn(),
}));

const unlock = require('../../commands/Functions/Achievement_Functions');

assertBasicCommandModule(pug, 'pug');

describe('pug execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('sends a random pug image and tracks the achievement', () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    const master = {};
    jest.spyOn(fs, 'readdirSync').mockReturnValue(['a.png', 'b.png']);
    jest.spyOn(Math, 'random').mockReturnValue(0.75);

    pug.execute(message, master, {});

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0][0].files[0].attachment).toBe('./pug_pics/b.png');
    expect(unlock.tracker1).toHaveBeenCalledWith('user1', 5, 1, message, master, {});
  });

  test('sends an error message when sending the image fails', () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    message.channel.send = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('boom');
      })
      .mockImplementation(() => {});
    const master = {};
    jest.spyOn(fs, 'readdirSync').mockReturnValue(['a.png']);
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    pug.execute(message, master, {});

    expect(message.channel.send).toHaveBeenNthCalledWith(2, 'Error Occurred in Pug.js');
    expect(logSpy).toHaveBeenCalled();
  });
});
