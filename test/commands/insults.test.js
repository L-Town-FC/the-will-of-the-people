const { describe, expect, test } = require('@jest/globals');
const fs = require('fs');
const insults = require('../../commands/insults');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  unlock: jest.fn(),
  tracker1: jest.fn(),
  tracker2: jest.fn(),
}));

const unlock = require('../../commands/Functions/Achievement_Functions');

assertBasicCommandModule(insults, 'insults');

function createMaster() {
  return {
    user1: { name: 'Alice', gbp: 10000, insulted: false },
    user2: { name: 'Bob', gbp: 1000, insulted: false },
  };
}

function createInsultMessage() {
  const message = createMessage();
  message.author = { id: 'user1', bot: false };
  message.member = null;
  return message;
}

describe('insults execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('lists the people currently being insulted by default', () => {
    const message = createInsultMessage();
    const master = createMaster();
    master.user2.insulted = true;

    insults.execute(message, ['!insults'], master, {});

    expect(message.channel.send.calls).toHaveLength(1);
    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.description).toContain('Bob');
    expect(embed.description).not.toContain('Alice');
  });

  test('turns insults on for a target', () => {
    const message = createInsultMessage();
    const master = createMaster();

    insults.execute(message, ['!insults', 'on', 'bob'], master, {});

    expect(master.user2.insulted).toBe(true);
    expect(master.user1.gbp).toBe(8500);
    expect(message.channel.send.calls).toContainEqual(['Bob is now being insulted']);
    expect(unlock.tracker1).toHaveBeenCalledWith('user1', 13, 1, message, master, {});
    expect(unlock.tracker2).toHaveBeenCalledWith('user2', 20, 1, message, master, {});
  });

  test('reports when the target is already being insulted', () => {
    const message = createInsultMessage();
    const master = createMaster();
    master.user2.insulted = true;

    insults.execute(message, ['!insults', 'on', 'bob'], master, {});

    expect(message.channel.send.calls[0]).toEqual(['They are already being insulted']);
  });

  test('turns insults off for a target', () => {
    const message = createInsultMessage();
    const master = createMaster();
    master.user2.insulted = true;

    insults.execute(message, ['!insults', 'off', 'bob'], master, {});

    expect(master.user2.insulted).toBe(false);
    expect(master.user1.gbp).toBe(8500);
    expect(message.channel.send.calls).toContainEqual(['Bob is no longer being insulted']);
  });

  test('reports when the target is not being insulted', () => {
    const message = createInsultMessage();
    const master = createMaster();

    insults.execute(message, ['!insults', 'off', 'bob'], master, {});

    expect(message.channel.send.calls[0]).toEqual(['They are not being insulted']);
  });

  test('unlocks the masochist achievement when insulting yourself', () => {
    const message = createInsultMessage();
    const master = createMaster();

    insults.execute(message, ['!insults', 'on', 'alice'], master, {});

    expect(unlock.unlock).toHaveBeenCalledWith('user1', 22, message, master);
  });

  test('unlocks as-god-intended for the special recipient', () => {
    const message = createInsultMessage();
    const master = createMaster();
    master['462798271195119626'] = { name: 'Colin', gbp: 1000, insulted: false };

    insults.execute(message, ['!insults', 'on', 'colin'], master, {});

    expect(unlock.unlock).toHaveBeenCalledWith('user1', 19, message, master);
  });

  test('shows help when requested', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('!insults on [person]\n!insults off [person]');
    const message = createInsultMessage();
    const master = createMaster();

    insults.execute(message, ['!insults', 'help'], master, {});

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('List of Commands');
    expect(embed.description).toContain('!insults on [person]');
  });

  test('shows a hint for an unknown subcommand', () => {
    const message = createInsultMessage();
    const master = createMaster();

    insults.execute(message, ['!insults', 'nonsense'], master, {});

    expect(message.channel.send.calls[0]).toEqual(['Use "!insults help" for a list of commands']);
  });

  test('does nothing when the target for on is unknown', () => {
    const message = createInsultMessage();
    const master = createMaster();

    insults.execute(message, ['!insults', 'on', 'nobody'], master, {});

    expect(master.user1.gbp).toBe(10000);
    expect(message.channel.send.calls[0]).toEqual(["That person doesn't exist"]);
  });

  test('does nothing when the target for off is unknown', () => {
    const message = createInsultMessage();
    const master = createMaster();

    insults.execute(message, ['!insults', 'off', 'nobody'], master, {});

    expect(master.user1.gbp).toBe(10000);
    expect(message.channel.send.calls[0]).toEqual(["That person doesn't exist"]);
  });

  test('sends an error message when listing fails', () => {
    const message = createInsultMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const master = {
      user1: {
        name: 'Alice',
        get insulted() {
          throw new Error('boom');
        },
      },
    };

    insults.execute(message, ['!insults'], master, {});

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in insults.js list']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when enabling insults fails', () => {
    const message = createInsultMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    insults.execute(message, ['!insults', 'on', 'bob'], {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in insults.js on']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when disabling insults fails', () => {
    const message = createInsultMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    insults.execute(message, ['!insults', 'off', 'bob'], {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in insults.js off']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when loading help fails', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('missing file');
    });
    const message = createInsultMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    insults.execute(message, ['!insults', 'help'], createMaster(), {});

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in insults.js help']);
    expect(logSpy).toHaveBeenCalled();
  });
});
