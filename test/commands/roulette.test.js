const { describe, expect, test, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const roulette = require('../../commands/roulette');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn(),
}));

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  tracker1: jest.fn(),
  tracker2: jest.fn(),
  tracker3: jest.fn(),
}));

const unlock = require('../../commands/Functions/Achievement_Functions');

assertBasicCommandModule(roulette, 'roulette');

const ROULETTE = {};
for (let n = 0; n < 37; n++) {
  ROULETTE[n] = { red: n % 2 === 1, even: n !== 0 && n % 2 === 0, row: '1', half: '1', third: '1', misc: [] };
}
ROULETTE[18].red = true;
ROULETTE[18].even = true;
ROULETTE[18].misc = ['r1', 'd1', 'c1'];

function createRouletteMessage() {
  const message = createMessage();
  message.author = { id: 'user1', bot: false };
  message.member = null;
  return message;
}

function createMaster() {
  return { user1: { name: 'Alice', gbp: 1000, account: 0 } };
}

function createStatsList() {
  return { user1: { roulette_wins: 0 } };
}

describe('roulette execute', () => {
  beforeEach(() => {
    fs.readFileSync.mockReset();
    fs.readFileSync.mockImplementation((path) =>
      String(path).includes('roulette.json') ? JSON.stringify(ROULETTE) : 'text'
    );
    fs.readdirSync.mockReset();
    fs.readdirSync.mockReturnValue(['roulette.jpg']);
    fs.writeFileSync.mockReset();
    unlock.tracker1.mockReset();
    unlock.tracker2.mockReset();
    unlock.tracker3.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('opens bets and cancels when none are placed', () => {
    jest.useFakeTimers();
    const message = createRouletteMessage();
    const betsOpen = { value: false };
    const approvedBets = { value: [] };

    roulette.execute(message, ['!roulette', 'bet', '30'], createMaster(), {}, {}, betsOpen, approvedBets);

    expect(betsOpen.value).toBe(true);
    jest.advanceTimersByTime(30000);
    expect(message.channel.send.calls).toContainEqual(['No bets were made, the game is cancelled']);
    expect(betsOpen.value).toBe(false);
  });

  test('resolves a winning red bet', () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const message = createRouletteMessage();
    const master = createMaster();
    const statsList = createStatsList();
    const betsOpen = { value: false };
    const approvedBets = { value: [[100, 'red', 'user1']] };

    roulette.execute(message, ['!roulette', 'bet', '15'], master, {}, statsList, betsOpen, approvedBets);
    jest.advanceTimersByTime(15000);
    jest.advanceTimersByTime(2000);

    expect(message.channel.send.calls).toContainEqual(['The number is: \n18:red_circle:']);
    expect(statsList.user1.roulette_wins).toBe(1);
    expect(unlock.tracker1).toHaveBeenCalled();
    expect(approvedBets.value).toEqual([]);
  });

  test('resolves a winning zero bet', () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const message = createRouletteMessage();
    const master = createMaster();
    const statsList = createStatsList();
    const betsOpen = { value: false };
    const approvedBets = { value: [[100, '0', 'user1']] };

    roulette.execute(message, ['!roulette', 'bet', '15'], master, {}, statsList, betsOpen, approvedBets);
    jest.advanceTimersByTime(15000);
    jest.advanceTimersByTime(2000);

    expect(message.channel.send.calls).toContainEqual(['The number is: \n0:green_circle:']);
    expect(statsList.user1.roulette_wins).toBe(1);
  });

  test('resolves a losing bet with no winners', () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const message = createRouletteMessage();
    const master = createMaster();
    const statsList = createStatsList();
    const betsOpen = { value: false };
    const approvedBets = { value: [[100, 'black', 'user1']] };

    roulette.execute(message, ['!roulette', 'bet', '15'], master, {}, statsList, betsOpen, approvedBets);
    jest.advanceTimersByTime(15000);
    jest.advanceTimersByTime(2000);

    expect(message.channel.send.calls).toContainEqual(['No Winners']);
  });

  test.each([
    ['number bet', '18', 18],
    ['even bet', 'even', 18],
    ['odd bet', 'odd', 17],
    ['black bet', 'black', 14],
    ['row bet', 'row1', 18],
    ['half bet', 'half1', 18],
    ['third bet', 'third1', 18],
    ['misc red bet', 'r1', 18],
    ['misc dozen bet', 'd1', 18],
    ['misc column bet', 'c1', 18],
  ])('resolves a winning %s', (_label, value, number) => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue((number + 0.5) / 37);
    const message = createRouletteMessage();
    const master = createMaster();
    const statsList = createStatsList();
    const betsOpen = { value: false };
    const approvedBets = { value: [[100, value, 'user1']] };

    roulette.execute(message, ['!roulette', 'bet', '15'], master, {}, statsList, betsOpen, approvedBets);
    jest.advanceTimersByTime(15000);
    jest.advanceTimersByTime(2000);

    expect(statsList.user1.roulette_wins).toBe(1);
  });

  test('rejects an invalid bet time', () => {
    const message = createRouletteMessage();

    roulette.execute(message, ['!roulette', 'bet', '5'], createMaster(), {}, {}, { value: false }, { value: [] });

    expect(message.channel.send.calls[0]).toEqual(['You must choose a time between 15 and 120 seconds']);
  });

  test('reports when bets are already open', () => {
    const message = createRouletteMessage();
    const betsOpen = { value: true };

    roulette.execute(message, ['!roulette', 'bet', '30'], createMaster(), {}, {}, betsOpen, { value: [] });

    expect(message.channel.send.calls[0]).toEqual(['Bets are already open']);
  });

  test('lists the last numbers', () => {
    const message = createRouletteMessage();

    roulette.execute(message, ['!roulette', 'numbers'], createMaster(), {}, {}, { value: false }, { value: [] });

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('Last 10 Numbers');
  });

  test('lists the bets and payouts', () => {
    const message = createRouletteMessage();

    roulette.execute(message, ['!roulette', 'list'], createMaster(), {}, {}, { value: false }, { value: [] });

    expect(message.channel.send.calls[0][0].files).toHaveLength(1);
    const embed = message.channel.send.calls[1][0].embeds[0].data;
    expect(embed.title).toBe('**Roulette**');
  });

  test('shows help', () => {
    const message = createRouletteMessage();

    roulette.execute(message, ['!roulette', 'help'], createMaster(), {}, {}, { value: false }, { value: [] });

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('List of Roulette Commands');
  });

  test('shows a hint for unknown subcommands', () => {
    const message = createRouletteMessage();

    roulette.execute(message, ['!roulette', 'xyz'], createMaster(), {}, {}, { value: false }, { value: [] });

    expect(message.channel.send.calls[0]).toEqual(['Use "!roulette help" for a list of commands']);
  });

  test('sends an error message when opening bets fails', () => {
    const message = createRouletteMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    roulette.execute(message, ['!roulette', 'bet', '30'], createMaster(), {}, {}, undefined, { value: [] });

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in Roulette.js bet']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when listing numbers fails', () => {
    const message = createRouletteMessage();
    message.channel.send = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('boom');
      })
      .mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    roulette.execute(message, ['!roulette', 'numbers'], createMaster(), {}, {}, { value: false }, { value: [] });

    expect(message.channel.send).toHaveBeenNthCalledWith(2, 'Error occurred in roulette.js numbers');
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when listing bets fails', () => {
    const message = createRouletteMessage();
    message.channel.send = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('boom');
      })
      .mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    roulette.execute(message, ['!roulette', 'list'], createMaster(), {}, {}, { value: false }, { value: [] });

    expect(message.channel.send).toHaveBeenNthCalledWith(2, 'Error occurred in roulette.js list');
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when help fails', () => {
    const message = createRouletteMessage();
    message.channel.send = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('boom');
      })
      .mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    roulette.execute(message, ['!roulette', 'help'], createMaster(), {}, {}, { value: false }, { value: [] });

    expect(message.channel.send).toHaveBeenNthCalledWith(2, 'Error occurred in roulette.js help');
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when the bet checker fails', () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const message = createRouletteMessage();
    const statsList = createStatsList();
    const betsOpen = { value: false };
    const approvedBets = { value: [[100, 'red', 'user1']] };
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    roulette.execute(message, ['!roulette', 'bet', '15'], {}, {}, statsList, betsOpen, approvedBets);
    jest.advanceTimersByTime(15000);
    jest.advanceTimersByTime(2000);

    expect(message.channel.send.calls).toContainEqual(['Error occurred in roulette.js bet checker']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when announcing the number fails', () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const message = createRouletteMessage();
    message.channel.send = jest.fn((arg) => {
      if (typeof arg === 'string' && arg.includes('The number is')) {
        throw new Error('boom');
      }
    });
    const statsList = createStatsList();
    const betsOpen = { value: false };
    const approvedBets = { value: [[100, 'red', 'user1']] };
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    roulette.execute(message, ['!roulette', 'bet', '15'], createMaster(), {}, statsList, betsOpen, approvedBets);
    jest.advanceTimersByTime(15000);
    jest.advanceTimersByTime(2000);

    expect(message.channel.send).toHaveBeenCalledWith('Error occurred in roulette.js');
    expect(logSpy).toHaveBeenCalled();
  });

  test('falls back to the uppercase board image name', () => {
    fs.readdirSync.mockReturnValue(['other.jpg']);
    const message = createRouletteMessage();

    roulette.execute(message, ['!roulette', 'list'], createMaster(), {}, {}, { value: false }, { value: [] });

    expect(message.channel.send.calls[0][0].files).toHaveLength(1);
  });

  test('ignores failures while saving the number history', () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    fs.writeFileSync.mockImplementation(() => {
      throw new Error('disk full');
    });
    const message = createRouletteMessage();
    const statsList = createStatsList();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    roulette.execute(message, ['!roulette', 'bet', '15'], createMaster(), {}, statsList, { value: false }, {
      value: [[100, 'red', 'user1']],
    });
    jest.advanceTimersByTime(15000);
    jest.advanceTimersByTime(2000);

    expect(logSpy).toHaveBeenCalled();
  });
});
