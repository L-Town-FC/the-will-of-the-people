const { describe, expect, test } = require('@jest/globals');
const fs = require('fs');
const steal = require('../../commands/steal');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  unlock: jest.fn(),
  tracker1: jest.fn(),
}));

const unlock = require('../../commands/Functions/Achievement_Functions');

assertBasicCommandModule(steal, 'steal');

function createStealMessage() {
  const message = createMessage();
  message.author = { id: 'user1', bot: false };
  message.member = null;
  return message;
}

function createMaster() {
  return {
    user1: { name: 'Alice', gbp: 1000, account: 0, steal: { caught: false, attempts: 0, insurance: 0 } },
    user2: { name: 'Bob', gbp: 500, account: 0, steal: { caught: false, attempts: 0, insurance: 0 } },
  };
}

function createBot() {
  const send = jest.fn();
  return {
    users: { cache: { find: jest.fn(() => ({ send })) } },
    userSend: send,
  };
}

describe('steal execute', () => {
  beforeEach(() => {
    fs.readFileSync.mockReset();
    fs.readFileSync.mockReturnValue('text file');
    unlock.unlock.mockReset();
    unlock.tracker1.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('steals successfully from a target', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const message = createStealMessage();
    const master = createMaster();
    const bot = createBot();

    steal.execute(message, ['!steal', 'Bob', '50'], master, {}, bot);

    expect(master.user1.gbp).toBe(1050);
    expect(master.user2.gbp).toBe(450);
    expect(message.channel.send.calls[0]).toEqual(['You successfully stole 50 gbp from Bob']);
    expect(unlock.unlock).toHaveBeenCalled();
    expect(bot.userSend).toHaveBeenCalled();
  });

  test('steals successfully when the target has insurance', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    const message = createStealMessage();
    const master = createMaster();
    master.user2.steal.insurance = 1;

    steal.execute(message, ['!steal', 'Bob', '50'], master, {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['You successfully stole 50 gbp from Bob']);
  });

  test('gets caught stealing and pays damages', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const message = createStealMessage();
    const master = createMaster();
    master.user2.gbp = 100000;

    steal.execute(message, ['!steal', 'Bob', '100'], master, {}, createBot());

    expect(master.user1.gbp).toBe(875);
    expect(master.user2.gbp).toBe(100125);
    expect(master.user1.steal.caught).toBe(true);
    expect(message.channel.send.calls[0][0]).toContain('You were caught stealing');
  });

  test('robs the richest user (Robinhood achievement)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const message = createStealMessage();
    const master = createMaster();
    master.user2.gbp = 100000;

    steal.execute(message, ['!steal', 'Bob', '50'], master, {}, createBot());

    expect(unlock.unlock).toHaveBeenCalledWith('user1', 35, message, master);
  });

  test('robs the poorest user (trickle down achievement)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const message = createStealMessage();
    const master = createMaster();
    master.user2.gbp = 100;

    steal.execute(message, ['!steal', 'Bob', '50'], master, {}, createBot());

    expect(unlock.unlock).toHaveBeenCalledWith('user1', 30, message, master);
  });

  test('caps the failure chance at the maximum', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    const message = createStealMessage();
    const master = createMaster();

    steal.execute(message, ['!steal', 'Bob', '2500'], master, {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['You successfully stole 2500 gbp from Bob']);
  });

  test('rejects an amount below the minimum', () => {
    const message = createStealMessage();

    steal.execute(message, ['!steal', 'Bob', '10'], createMaster(), {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['You must choose an amount between 25 and 2500']);
  });

  test('rejects stealing when the user has no gbp', () => {
    const message = createStealMessage();
    const master = createMaster();
    master.user1.gbp = 0;

    steal.execute(message, ['!steal', 'Bob', '100'], master, {}, createBot());

    expect(message.channel.send.calls[0]).toEqual([
      "You can't steal from someone when you have 0 or less gbp",
    ]);
  });

  test('rejects stealing when already caught', () => {
    const message = createStealMessage();
    const master = createMaster();
    master.user1.steal.caught = true;

    steal.execute(message, ['!steal', 'Bob', '100'], master, {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['You have been caught today and cannot steal anymore']);
  });

  test('sends an error message when stealing fails', () => {
    const message = createStealMessage();
    const master = { user2: { name: 'Bob', gbp: 500, account: 0, steal: { caught: false, attempts: 0, insurance: 0 } } };
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    steal.execute(message, ['!steal', 'Bob', '100'], master, {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in steal.js person']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('buys insurance', () => {
    const message = createStealMessage();
    const master = createMaster();

    steal.execute(message, ['!steal', 'insurance', '2'], master, {}, createBot());

    expect(master.user1.steal.insurance).toBe(2);
    expect(master.user1.gbp).toBe(200);
    expect(message.channel.send.calls[0]).toEqual(['You successfully bought 2 day(s) of insurance']);
  });

  test('reports when insurance is too expensive', () => {
    const message = createStealMessage();
    const master = createMaster();
    master.user1.gbp = 100;

    steal.execute(message, ['!steal', 'insurance', '2'], master, {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['You need atleast 800 gbp to buy 2 day(s) of insurance']);
  });

  test('reports remaining insurance', () => {
    const message = createStealMessage();

    steal.execute(message, ['!steal', 'insurance'], createMaster(), {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['You have 0 day(s) of insurance left']);
  });

  test('shows a hint for an invalid insurance command', () => {
    const message = createStealMessage();

    steal.execute(message, ['!steal', 'insurance', 'abc'], createMaster(), {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['Use "!steal help" for a list of commands']);
  });

  test('sends an error message when insurance fails', () => {
    const message = createStealMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    steal.execute(message, ['!steal', 'insurance', '2'], {}, {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in steal.js insurance']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('shows the odds of stealing', () => {
    const message = createStealMessage();

    steal.execute(message, ['!steal', 'odds', 'Bob', '100'], createMaster(), {}, createBot());

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toContain('Failure Chance of Stealing from Bob');
  });

  test('shows the odds for a small amount', () => {
    const message = createStealMessage();

    steal.execute(message, ['!steal', 'odds', 'Bob', '25'], createMaster(), {}, createBot());

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toContain('Failure Chance of Stealing from Bob');
  });

  test('shows the odds for a large amount', () => {
    const message = createStealMessage();

    steal.execute(message, ['!steal', 'odds', 'Bob', '2500'], createMaster(), {}, createBot());

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toContain('Failure Chance of Stealing from Bob');
  });

  test('rejects an invalid odds amount', () => {
    const message = createStealMessage();

    steal.execute(message, ['!steal', 'odds', 'Bob', '10'], createMaster(), {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['You must choose a valid amount between 25 and 2500']);
  });

  test('routes an unknown odds target through the error path', () => {
    const message = createStealMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    steal.execute(message, ['!steal', 'odds', 'Nobody', '100'], createMaster(), {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in steal.js odds']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when odds fail', () => {
    const message = createStealMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    steal.execute(message, ['!steal', 'odds'], createMaster(), {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in steal.js odds']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('shows help', () => {
    const message = createStealMessage();

    steal.execute(message, ['!steal', 'help'], createMaster(), {}, createBot());

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('List of Commands');
  });

  test('shows the basics', () => {
    const message = createStealMessage();

    steal.execute(message, ['!steal', 'basics'], createMaster(), {}, createBot());

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('Steal Basics');
  });

  test('sends error messages when help and basics fail', () => {
    fs.readFileSync.mockImplementation(() => {
      throw new Error('missing file');
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const helpMessage = createStealMessage();
    steal.execute(helpMessage, ['!steal', 'help'], createMaster(), {}, createBot());
    expect(helpMessage.channel.send.calls[0]).toEqual(['Error occurred in steal.js help']);

    const basicsMessage = createStealMessage();
    steal.execute(basicsMessage, ['!steal', 'basics'], createMaster(), {}, createBot());
    expect(basicsMessage.channel.send.calls[0]).toEqual(['Error occurred in steal.js basics']);

    expect(logSpy).toHaveBeenCalled();
  });

  test('shows a hint for unknown subcommands', () => {
    const message = createStealMessage();

    steal.execute(message, ['!steal', 'xyz'], createMaster(), {}, createBot());

    expect(message.channel.send.calls[0]).toEqual(['Use "!steal help" for a list of commands']);
  });
});
