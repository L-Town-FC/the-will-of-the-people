const { describe, expect, test } = require('@jest/globals');
const fs = require('fs');
const stats = require('../../commands/stats');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

assertBasicCommandModule(stats, 'stats');

const ACHIEVEMENTS_JSON = JSON.stringify({
  1: { name: 'A', description: 'a' },
  2: { name: 'B', description: 'b' },
  3: { name: 'C', description: 'c' },
});

function createStats(name) {
  return {
    name,
    total_msgs: 10,
    total_commands: 2,
    non_farm_messages: 3,
    farm_messages: 7,
    bj_wins: 1,
    bj_pushes: 0,
    bj_losses: 0,
    gg_wins: 0,
    gg_losses: 0,
    lottery_tickets: 0,
    button_presses: 0,
    button_losses: 0,
    roulette_bets: 0,
    roulette_wins: 0,
  };
}

function mockAchievements() {
  jest.spyOn(fs, 'readFileSync').mockReturnValue(ACHIEVEMENTS_JSON);
}

describe('stats execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the author stats when no name is provided', () => {
    mockAchievements();
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.member = null;
    const master = { user1: { name: 'Alice', achievements: [1] } };
    const allStats = { user1: createStats('Alice') };
    jest.spyOn(Math, 'random').mockReturnValue(0);

    stats.execute(message, ['!stats'], master, allStats);

    expect(message.channel.send.calls).toHaveLength(1);
    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('Alice Stat List');
    expect(embed.description).toContain('Total Messages: 10');
    expect(embed.description).toContain('Achievements: 1/3');
  });

  test('shows aggregate stats when "all" is requested', () => {
    mockAchievements();
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.member = null;
    const allStats = { user1: createStats('Alice'), user2: createStats('Bob') };
    jest.spyOn(Math, 'random').mockReturnValue(0);

    stats.execute(message, ['!stats', 'all'], {}, allStats);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('All Stats List');
    expect(embed.description).toContain('Total Messages: 20');
    expect(embed.description).toContain('Blackjack Wins: 2');
  });

  test('shows stats for a named user', () => {
    mockAchievements();
    const message = createMessage();
    message.author = { id: 'user2', bot: false };
    message.member = null;
    const master = {
      user1: { name: 'Alice', achievements: [] },
      user2: { name: 'Bob', achievements: [] },
    };
    const allStats = { user1: createStats('Alice'), user2: createStats('Bob') };
    jest.spyOn(Math, 'random').mockReturnValue(0);

    stats.execute(message, ['!stats', 'Alice'], master, allStats);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('Alice Stat List');
  });

  test('reports when the requested user does not exist', () => {
    const message = createMessage();
    message.author = { id: 'user1' };

    stats.execute(message, ['!stats', 'Nobody'], {}, {});

    expect(message.channel.send.calls[0]).toEqual(['User does not exist']);
  });

  test('adds a farewell field when the random chance hits 5', () => {
    mockAchievements();
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.member = null;
    const master = { user1: { name: 'Alice', achievements: [] } };
    const allStats = { user1: createStats('Alice') };
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    stats.execute(message, ['!stats'], master, allStats);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.fields[0].name).toBe('===============');
    expect(embed.fields[0].value).toBe('END OF MESSAGE \n===============');
  });

  test('adds a farewell field to the aggregate list when the random chance hits 5', () => {
    mockAchievements();
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.member = null;
    const allStats = { user1: createStats('Alice') };
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    stats.execute(message, ['!stats', 'all'], {}, allStats);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.fields[0].name).toBe('===============');
  });

  test('sends an error message when the stats lookup fails', () => {
    mockAchievements();
    const message = createMessage();
    message.author = { id: 'ghost' };
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    stats.execute(message, ['!stats'], {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in stats.js']);
    expect(logSpy).toHaveBeenCalled();
  });
});
