const { describe, expect, test } = require('@jest/globals');
const council = require('../../commands/council');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  tracker1: jest.fn(),
}));

assertBasicCommandModule(council, 'council');

describe('council execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sends default message when random does not hit 50', () => {
    const msg = createMessage();
    msg.author = { id: 'user1' };
    jest.spyOn(Math, 'random').mockReturnValue(0.49);

    council.execute(msg, {}, {});

    expect(msg.channel.send.calls).toHaveLength(1);
    expect(msg.channel.send.calls[0]).toEqual(['Play one more game of melee and ask again']);
  });

  test('sends special message when random hits exactly 50', () => {
    const msg = createMessage();
    msg.author = { id: 'user2' };
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    council.execute(msg, {}, {});

    expect(msg.channel.send.calls).toHaveLength(1);
    expect(msg.channel.send.calls[0]).toEqual(['lol Alex gay']);
  });

  test('reports an error when sending fails', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const msg = createMessage();
    msg.author = { id: 'user3' };
    jest.spyOn(Math, 'random').mockReturnValue(0.49);
    let first = true;
    msg.channel.send = jest.fn(() => {
      if (first) {
        first = false;
        throw new Error('boom');
      }
    });

    council.execute(msg, {}, {});

    expect(consoleSpy).toHaveBeenCalled();
    expect(msg.channel.send).toHaveBeenLastCalledWith('Error Occurred in council.js');

    consoleSpy.mockRestore();
  });
});
