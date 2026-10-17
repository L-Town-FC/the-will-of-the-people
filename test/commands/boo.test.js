const { describe, expect, test } = require('@jest/globals');
const boo = require('../../commands/boo');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  tracker1: jest.fn(),
  tracker2: jest.fn(),
  reset2: jest.fn(),
  unlock: jest.fn(),
}));

const unlock = require('../../commands/Functions/Achievement_Functions');

assertBasicCommandModule(boo, 'boo');

function createMaster() {
  return {
    user1: { name: 'Alice', gbp: 1000, achievements: [] },
    user2: { name: 'Bob', gbp: 1000, achievements: [] },
  };
}

describe('boo execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('lists the current boo target when the given name is unknown', () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    const master = createMaster();
    const commandStats = { boo: 'user2' };

    boo.execute(message, ['!boo', 'nobody'], master, {}, commandStats);

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual(['Bob is currently being booed']);
    expect(commandStats.boo).toBe('user2');
  });

  test('defaults the target when no name is given', () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    const master = createMaster();
    const commandStats = { boo: 'user2' };

    boo.execute(message, ['!boo'], master, {}, commandStats);

    expect(message.channel.send.calls[0]).toEqual(['Bob is currently being booed']);
  });

  test('boos the target, charges the author, and announces it', () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    const master = createMaster();
    const tracker = {};
    const commandStats = { boo: 'user1' };

    boo.execute(message, ['!boo', 'Bob'], master, tracker, commandStats);

    expect(commandStats.boo).toBe('user2');
    expect(master.user1.gbp).toBe(500);
    expect(message.channel.send.calls).toContainEqual(['Bob is now being booed']);
    expect(unlock.tracker1).toHaveBeenCalledWith('user1', 13, 1, message, master, tracker);
    expect(unlock.reset2).toHaveBeenCalledWith('user2', 20, 0, tracker, message);
    expect(unlock.tracker2).toHaveBeenCalledWith('user2', 20, 0, message, master, tracker);
  });

  test('does not boo when the author cannot afford it', () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    const master = createMaster();
    master.user1.gbp = 100;
    const commandStats = { boo: 'user1' };

    boo.execute(message, ['!boo', 'Bob'], master, {}, commandStats);

    expect(commandStats.boo).toBe('user1');
    expect(master.user1.gbp).toBe(100);
    expect(message.channel.send.calls).toContainEqual(["You don't have that much GBP"]);
    expect(unlock.tracker1).not.toHaveBeenCalled();
  });

  test('unlocks the masochist achievement when the author boos themselves', () => {
    const message = createMessage();
    message.author = { id: 'user2' };
    const master = createMaster();
    const commandStats = { boo: 'user1' };

    boo.execute(message, ['!boo', 'Bob'], master, {}, commandStats);

    expect(unlock.unlock).toHaveBeenCalledWith('user2', 22, message, master);
  });

  test('sends an error message when the command fails unexpectedly', () => {
    const message = createMessage();
    message.author = { id: 'ghost' };
    const master = createMaster();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    boo.execute(message, ['!boo', 'Bob'], master, {}, { boo: 'user1' });

    expect(message.channel.send.calls).toContainEqual(['Error occurred in Boo.js']);
    expect(logSpy).toHaveBeenCalled();
  });
});
