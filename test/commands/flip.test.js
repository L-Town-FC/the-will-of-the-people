const { describe, expect, test } = require('@jest/globals');
const flip = require('../../commands/flip');
const unlock = require('../../commands/Functions/Achievement_Functions');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  tracker1: jest.fn(),
}));

assertBasicCommandModule(flip, 'flip');

describe('flip command', () => {
  test('sends heads when the coin flip resolves to 0 and tracks the attempt', () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.1);

    flip.execute(message, {}, {});

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual(['Heads']);
    expect(unlock.tracker1).toHaveBeenCalledWith('user1', 42, 1, message, {}, {});

    randomSpy.mockRestore();
  });

  test('sends tails when the coin flip resolves to 1', () => {
    const message = createMessage();
    message.author = { id: 'user2' };
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9);

    flip.execute(message, {}, {});

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual(['Tails']);

    randomSpy.mockRestore();
  });
});
