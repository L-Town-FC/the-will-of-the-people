const { describe, expect, test } = require('@jest/globals');
const fs = require('fs');
const powerball = require('../../commands/powerball');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  tracker1: jest.fn(),
  unlock: jest.fn(),
}));

jest.mock('../../commands/Functions/stats_functions', () => ({
  tracker: jest.fn(),
}));

const unlock = require('../../commands/Functions/Achievement_Functions');
const stats = require('../../commands/Functions/stats_functions');

assertBasicCommandModule(powerball, 'powerball');

function createPowerballMessage() {
  const message = createMessage();
  message.author = { id: 'user1', bot: false };
  message.member = null;
  return message;
}

function createMaster() {
  return { user1: { name: 'Alice', gbp: 1000, achievements: [] } };
}

function createCommandStats() {
  return { powerball: { tickets: 0, pot: 10000 } };
}

describe('powerball execute', () => {
  beforeEach(() => {
    fs.readFileSync.mockReset();
    fs.readFileSync.mockReturnValue('command list');
    unlock.tracker1.mockReset();
    unlock.unlock.mockReset();
    stats.tracker.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('rejects a non-positive number of tickets', () => {
    const message = createPowerballMessage();

    powerball.execute(message, ['!powerball', 'buy', '0'], '1000', createMaster(), {}, {}, createCommandStats());

    expect(message.channel.send.calls[0]).toEqual(['Please choose a number of tickets greater than 0']);
  });

  test('buys a single ticket and loses', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const message = createPowerballMessage();
    const master = createMaster();
    const command_stats = createCommandStats();

    powerball.execute(message, ['!powerball', 'buy'], '1000', master, {}, {}, command_stats);

    expect(message.channel.send.calls).toContainEqual(['Sorry. Try again']);
    expect(master.user1.gbp).toBe(995);
    expect(command_stats.powerball.tickets).toBe(1);
    expect(stats.tracker).toHaveBeenCalledWith('user1', 1, 1, {});
    expect(unlock.tracker1).toHaveBeenCalledWith('user1', 31, 1, message, master, {});
  });

  test('buys a single ticket and wins the jackpot', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.00005);
    const message = createPowerballMessage();
    const master = createMaster();
    const command_stats = createCommandStats();

    powerball.execute(message, ['!powerball', 'buy'], '1000', master, {}, {}, command_stats);

    expect(message.channel.send.calls[0][0]).toContain('You won Powerball');
    expect(unlock.unlock).toHaveBeenCalledWith('user1', 10, message, master);
    expect(command_stats.powerball.tickets).toBe(0);
    expect(command_stats.powerball.pot).toBe(10000);
  });

  test('requires enough gbp for a single ticket', () => {
    const message = createPowerballMessage();

    powerball.execute(message, ['!powerball', 'buy'], '1', createMaster(), {}, {}, createCommandStats());

    expect(message.channel.send.calls[0]).toEqual(['You need at least 5 gbp for this command']);
  });

  test('rejects a fractional number of tickets', () => {
    const message = createPowerballMessage();

    powerball.execute(message, ['!powerball', 'buy', '2.5'], '1000', createMaster(), {}, {}, createCommandStats());

    expect(message.channel.send.calls[0]).toEqual(['Please choose a whole number for the amount of tickets']);
  });

  test('buys multiple tickets and loses', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const message = createPowerballMessage();
    const master = createMaster();

    powerball.execute(message, ['!powerball', 'buy', '2'], '100', master, {}, {}, createCommandStats());

    expect(message.channel.send.calls).toContainEqual(['Sorry. Try again']);
    expect(master.user1.gbp).toBe(990);
  });

  test('buys multiple tickets and wins the jackpot', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.00005);
    const message = createPowerballMessage();
    const master = createMaster();
    const command_stats = createCommandStats();

    powerball.execute(message, ['!powerball', 'buy', '2'], '1000', master, {}, {}, command_stats);

    expect(message.channel.send.calls[0][0]).toContain('You won Powerball');
    expect(unlock.unlock).toHaveBeenCalledWith('user1', 10, message, master);
    expect(command_stats.powerball.tickets).toBe(0);
    expect(command_stats.powerball.pot).toBe(10000);
  });

  test('requires enough gbp for multiple tickets', () => {
    const message = createPowerballMessage();

    powerball.execute(message, ['!powerball', 'buy', '2'], '5', createMaster(), {}, {}, createCommandStats());

    expect(message.channel.send.calls[0]).toEqual(['You need at least 10 gbp to buy 2 tickets']);
  });

  test('shows the pot and ticket count', () => {
    const message = createPowerballMessage();
    const command_stats = { powerball: { tickets: 3, pot: 15000 } };

    powerball.execute(message, ['!powerball', 'stats'], '1000', createMaster(), {}, {}, command_stats);

    expect(message.channel.send.calls[0]).toEqual([
      'The pot is currently at 15000 gbp. 3 tickets have been bought.',
    ]);
  });

  test('shows help', () => {
    const message = createPowerballMessage();

    powerball.execute(message, ['!powerball', 'help'], '1000', createMaster(), {}, {}, createCommandStats());

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('List of Commands');
  });

  test('shows a hint for unknown subcommands', () => {
    const message = createPowerballMessage();

    powerball.execute(message, ['!powerball', 'xyz'], '1000', createMaster(), {}, {}, createCommandStats());

    expect(message.channel.send.calls[0]).toEqual(['Use !powerball help for a list of commands']);
  });

  test('sends an error message when buying fails', () => {
    const message = createPowerballMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    powerball.execute(message, ['!powerball', 'buy'], '1000', {}, {}, {}, createCommandStats());

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in Powerball.js Buy']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when stats fail', () => {
    const message = createPowerballMessage();
    message.channel.send = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('boom');
      })
      .mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    powerball.execute(message, ['!powerball', 'stats'], '1000', createMaster(), {}, {}, createCommandStats());

    expect(message.channel.send).toHaveBeenNthCalledWith(2, 'Error occurred in Powerball.js Stats');
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when help fails', () => {
    fs.readFileSync.mockImplementation(() => {
      throw new Error('missing file');
    });
    const message = createPowerballMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    powerball.execute(message, ['!powerball', 'help'], '1000', createMaster(), {}, {}, createCommandStats());

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in Powerball.js Help']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when the drawing fails', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const message = createPowerballMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    powerball.execute(message, ['!powerball', 'buy', '2'], '100', createMaster(), {}, {}, {});

    expect(message.channel.send.calls).toContainEqual(['Error occurred in Powerball.js Attempt']);
    expect(logSpy).toHaveBeenCalled();
  });
});
