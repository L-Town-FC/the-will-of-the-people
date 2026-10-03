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
});
