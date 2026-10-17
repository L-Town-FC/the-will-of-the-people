const { describe, expect, test } = require('@jest/globals');
const moreMoney = require('../../commands/more_money');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  unlock: jest.fn(),
  tracker1: jest.fn(),
  tracker2: jest.fn(),
}));

jest.mock('../../commands/Functions/stats_functions', () => ({
  tracker: jest.fn(),
}));

const unlock = require('../../commands/Functions/Achievement_Functions');
const stats = require('../../commands/Functions/stats_functions');

assertBasicCommandModule(moreMoney, 'more_money');

function createMessage(channelId = 'normalChannel', type = 'text') {
  return {
    author: { id: 'user1', discriminator: '0001' },
    content: 'hello world',
    channel: { id: channelId, type, send: jest.fn() },
    member: { roles: { cache: { find: () => undefined } } },
  };
}

function createMaster(gbp) {
  return { user1: { name: 'Alice', gbp } };
}

describe('more_money execute', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('ignores command messages', () => {
    const message = createMessage();
    message.content = '!bank';
    const master = createMaster(1000);

    moreMoney.execute(message, master, {}, {});

    expect(master.user1.gbp).toBe(1000);
  });

  test('awards gbp to the author on a normal message', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const message = createMessage();
    const master = createMaster(1000);

    moreMoney.execute(message, master, {}, {});

    expect(master.user1.gbp).toBe(1001);
    expect(stats.tracker).toHaveBeenCalledWith('user1', 10, 1, {});
  });

  test.each([
    [100, 3],
    [300, 2],
    [600, 1],
    [2000, 1],
    [-20001, 200],
    [-10100, 50],
    [-2600, 20],
    [-1100, 10],
  ])('awards the correct amount for a balance of %i', (start, expectedDelta) => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const message = createMessage();
    const master = createMaster(start);

    moreMoney.execute(message, master, {}, {});

    expect(master.user1.gbp).toBe(start + expectedDelta);
  });

  test('repairs a non-numeric balance before awarding gbp', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const message = createMessage();
    const master = { user1: { name: 'Alice', gbp: 'corrupted' } };

    moreMoney.execute(message, master, {}, {});

    expect(master.user1.gbp).toBe(3);
  });

  test('unlocks the L achievement when the balance is negative', () => {
    const message = createMessage();
    const master = createMaster(-50);

    moreMoney.execute(message, master, {}, {});

    expect(master.user1.gbp).toBe(-45);
    expect(unlock.unlock).toHaveBeenCalledWith('user1', 3, message, master);
  });

  test('unlocks the deep dark hole achievement at -250 or below', () => {
    const message = createMessage();
    const master = createMaster(-300);

    moreMoney.execute(message, master, {}, {});

    expect(unlock.unlock).toHaveBeenCalledWith('user1', 34, message, master);
  });

  test('unlocks the nice achievement at exactly 69 gbp', () => {
    const message = createMessage();
    const master = createMaster(69);

    moreMoney.execute(message, master, {}, {});

    expect(unlock.unlock).toHaveBeenCalledWith('user1', 40, message, master);
  });

  test('unlocks the too big to fail achievement at 10000 or more', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const message = createMessage();
    const master = createMaster(10000);

    moreMoney.execute(message, master, {}, {});

    expect(unlock.unlock).toHaveBeenCalledWith('user1', 6, message, master);
  });

  test('unlocks the large and in charge achievement for representatives', () => {
    const message = createMessage();
    message.member.roles.cache.find = (predicate) => (predicate({ name: 'Dogcatcher' }) ? { name: 'Dogcatcher' } : undefined);
    const master = createMaster(1000);

    moreMoney.execute(message, master, {}, {});

    expect(unlock.unlock).toHaveBeenCalledWith('user1', 24, message, master);
  });

  test('tracks pugilism messages in the dedicated channel', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const message = createMessage('590585423202484227');
    const master = createMaster(1000);

    moreMoney.execute(message, master, {}, {});

    expect(stats.tracker).toHaveBeenCalledWith('user1', 9, 1, {});
    expect(unlock.tracker1).toHaveBeenCalledWith('user1', 9, 1, message, master, {});
  });

  test('tracks aggregated messages in a DM', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const message = createMessage('normalChannel', 'dm');
    const master = createMaster(1000);

    moreMoney.execute(message, master, {}, {});

    expect(stats.tracker).toHaveBeenCalledWith('user1', 9, 1, {});
  });

  test.each([
    ['590583268961812500', 17],
    ['590583073595457547', 28],
    ['590583125445181469', 29],
    ['664241953973731328', 27],
    ['606515956826636288', 26],
    ['712755269863473252', 9],
  ])('routes channel %s to achievement %i', (channelId, achievement) => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const message = createMessage(channelId);
    const master = createMaster(5000);

    moreMoney.execute(message, master, {}, {});

    expect(unlock.tracker1).toHaveBeenCalledWith('user1', achievement, 1, message, master, {});
  });

  test('tracks the fetishist achievement in the feet channel', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const message = createMessage('664241953973731328');
    const master = createMaster(5000);

    moreMoney.execute(message, master, {}, {});

    expect(unlock.tracker2).toHaveBeenCalledWith('user1', 15, 0, message, master, {});
  });

  test('sends an error message when the author is missing from master', () => {
    const message = createMessage('normalChannel', 1);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    moreMoney.execute(message, {}, {}, {});

    expect(message.channel.send).toHaveBeenCalledWith('Error occurred in More_money.js');
    expect(logSpy).toHaveBeenCalled();
  });
});
