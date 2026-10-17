const { describe, expect, test } = require('@jest/globals');
const fs = require('fs');
const achievementsCommand = require('../../commands/achievements');
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

const unlock = require('../../commands/Functions/Achievement_Functions');

assertBasicCommandModule(achievementsCommand, 'achievements');

const ACH = {
  1: { name: 'First', description: 'first desc', threshold: 1, tracker: 1, secret: false },
  2: { name: 'Second', description: 'second desc', tracker: 2, secret: false },
  3: { name: 'Third', description: 'third desc', threshold: 10, tracker: 3, labels: ['a', 'b'], secret: false },
  4: { name: 'Secret One', description: 'secret desc', threshold: 1, tracker: 4, secret: true },
  5: { name: 'Secret T1', description: 'st1', threshold: 1, tracker: 1, secret: true },
  6: { name: 'Secret T2', description: 'st2', tracker: 2, secret: true },
  7: { name: 'Secret T3', description: 'st3', threshold: 10, tracker: 3, labels: ['a'], secret: true },
};

function createAchievementMessage() {
  const message = createMessage();
  message.author = { id: 'user1', bot: false };
  message.member = null;
  return message;
}

function createMaster() {
  return {
    user1: { name: 'Alice', achievements: [1] },
    user2: { name: 'Bob', achievements: [] },
  };
}

describe('achievements execute', () => {
  beforeEach(() => {
    fs.readFileSync.mockReset();
    fs.readFileSync.mockImplementation((path) =>
      String(path).includes('achievements.json') ? JSON.stringify(ACH) : 'command list'
    );
    unlock.tracker1.mockReset();
    unlock.unlock.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the author achievements by default', () => {
    const message = createAchievementMessage();
    const master = createMaster();

    achievementsCommand.execute(message, ['!achievements'], master, {});

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("Alice's Achievements");
    expect(unlock.tracker1).toHaveBeenCalledWith('user1', 43, 1, message, master, {});
  });

  test('shows the author achievements for a named user', () => {
    const message = createAchievementMessage();
    const master = createMaster();

    achievementsCommand.execute(message, ['!achievements', 'bob'], master, {});

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe("Alice's Achievements");
  });

  test('lists all achievements', () => {
    const message = createAchievementMessage();
    const master = createMaster();

    achievementsCommand.execute(message, ['!achievements', 'list'], master, {});

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('List of All Achievements');
    expect(embed.description).toContain('First');
  });

  test('shows a tracker 1 achievement', () => {
    const message = createAchievementMessage();
    const master = createMaster();
    const tracker = { user1: { 1: 1 } };

    achievementsCommand.execute(message, ['!achievements', 'list', '1'], master, tracker);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('First');
    expect(embed.description).toBe('first desc');
  });

  test('shows a tracker 2 achievement', () => {
    const message = createAchievementMessage();
    const master = createMaster();
    const tracker = { user1: { 2: [true, false] } };

    achievementsCommand.execute(message, ['!achievements', 'list', '2'], master, tracker);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('Second');
    expect(embed.description).toBe('second desc');
  });

  test('shows a tracker 3 achievement', () => {
    const message = createAchievementMessage();
    const master = createMaster();
    const tracker = { user1: { 3: [5, 10] } };

    achievementsCommand.execute(message, ['!achievements', 'list', '3'], master, tracker);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('Third');
    expect(embed.fields).toHaveLength(2);
  });

  test('hides a secret achievement that has not been unlocked', () => {
    const message = createAchievementMessage();
    const master = createMaster();
    const tracker = { user1: { 4: 0 } };

    achievementsCommand.execute(message, ['!achievements', 'list', '4'], master, tracker);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.description).toBe('Secret Achievement');
  });

  test('shows the command list for an unknown name', () => {
    const message = createAchievementMessage();
    const master = createMaster();

    achievementsCommand.execute(message, ['!achievements', 'nobody'], master, {});

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('List of Commands');
  });

  test('shows a single-value achievement that has been unlocked', () => {
    const message = createAchievementMessage();
    const master = createMaster();
    master.user1.achievements.push(4);
    const tracker = { user1: { 4: 1 } };

    achievementsCommand.execute(message, ['!achievements', 'list', '4'], master, tracker);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.description).toBe('secret desc');
  });

  test('hides a secret tracker 1 achievement when locked', () => {
    const message = createAchievementMessage();
    const master = createMaster();
    const tracker = { user1: { 5: 0 } };

    achievementsCommand.execute(message, ['!achievements', 'list', '5'], master, tracker);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.description).toBe('Secret Achievement');
  });

  test('completes a tracker 2 achievement that has been unlocked', () => {
    const message = createAchievementMessage();
    const master = createMaster();
    master.user1.achievements.push(2);
    const tracker = { user1: { 2: [true, false] } };

    achievementsCommand.execute(message, ['!achievements', 'list', '2'], master, tracker);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.description).toBe('second desc');
  });

  test('hides a secret tracker 2 achievement when locked', () => {
    const message = createAchievementMessage();
    const master = createMaster();
    const tracker = { user1: { 6: [true, false] } };

    achievementsCommand.execute(message, ['!achievements', 'list', '6'], master, tracker);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.description).toBe('Secret Achievement');
  });

  test('hides a secret tracker 3 achievement', () => {
    const message = createAchievementMessage();
    const master = createMaster();
    const tracker = { user1: { 7: [5] } };

    achievementsCommand.execute(message, ['!achievements', 'list', '7'], master, tracker);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.description).toBe('Secret Achievement');
  });

  test('sends an error message when a user record is missing', () => {
    const message = createAchievementMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    achievementsCommand.execute(message, ['!achievements'], {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Error Occurred in achievements.js']);
    expect(logSpy).toHaveBeenCalled();
  });
});
