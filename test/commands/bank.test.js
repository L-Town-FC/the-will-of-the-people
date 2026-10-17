const { describe, expect, test } = require('@jest/globals');
const fs = require('fs');
const bank = require('../../commands/bank');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  unlock: jest.fn(),
}));

const unlock = require('../../commands/Functions/Achievement_Functions');

assertBasicCommandModule(bank, 'bank');

describe('bank execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("shows the author's balance when no name is given", () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    message.channel.id = 'normalChannel';
    const master = { user1: { name: 'Alice', gbp: 1000 } };

    bank.execute(message, ['!bank'], master);

    expect(message.channel.send.calls[0]).toEqual(['Alice has 1000 gbp']);
  });

  test('shows a named user balance', () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    message.channel.id = 'normalChannel';
    const master = { user1: { name: 'Alice', gbp: 1000 }, user2: { name: 'Bob', gbp: 500 } };

    bank.execute(message, ['!bank', 'Bob'], master);

    expect(message.channel.send.calls[0]).toEqual(['Bob has 500 gbp']);
  });

  test('deletes the message and unlocks the dumbass achievement in bot tinkering', () => {
    const message = createMessage();
    message.author = { id: 'user1' };
    message.channel.id = '711634711281401867';
    message.channel.bulkDelete = jest.fn();
    const master = { user1: { name: 'Alice', gbp: 1000 } };

    bank.execute(message, ['!bank'], master);

    expect(message.channel.bulkDelete).toHaveBeenCalledWith(1);
    expect(unlock.unlock).toHaveBeenCalledWith('user1', 7, message, master);
    expect(message.channel.send.calls).toHaveLength(0);
  });

  test('lists all accounts with a total', () => {
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.member = null;
    message.channel.id = 'normalChannel';
    const master = {
      user1: { name: 'Alice', gbp: 1000 },
      user2: { name: 'Bob', gbp: 500.5 },
    };

    bank.execute(message, ['!bank', 'all'], master);

    expect(message.channel.send.calls).toHaveLength(1);
    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.description).toContain('Alice: 1000');
    expect(embed.description).toContain('Bob: 500.5');
    expect(embed.fields[0].value).toBe('1500.50');
  });

  test('lists the bank commands when help is requested', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('!bank - shows balance\n!bank all - shows all');
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.member = null;
    message.channel.id = 'normalChannel';
    const master = { user1: { name: 'Alice', gbp: 1000 } };

    bank.execute(message, ['!bank', 'help'], master);

    expect(message.channel.send.calls).toHaveLength(1);
    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('List of Commands');
    expect(embed.description).toContain('!bank - shows balance');
  });

  test('sends an error message when the balance lookup fails', () => {
    const message = createMessage();
    message.author = { id: 'ghost' };
    message.channel.id = 'normalChannel';
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    bank.execute(message, ['!bank'], {});

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in Bank.js']);
    expect(logSpy).toHaveBeenCalled();
  });
});
