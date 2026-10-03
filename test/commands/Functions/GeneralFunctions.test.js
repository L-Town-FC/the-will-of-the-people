const { describe, expect, test } = require('@jest/globals');
const {
  NameToUserID,
  CommandPurchase,
  CommandUsageValidator,
  invalid,
  defaultRecipient,
} = require('../../../commands/Functions/GeneralFunctions');

describe('NameToUserID', () => {
  const master = {
    '123': { name: 'Alice' },
    '456': { name: 'Bob' },
  };

  test('returns "bot" when name is "bot"', () => {
    expect(NameToUserID('bot', master)).toBe('bot');
  });

  test('finds user when query matches lowercased stored name', () => {
    expect(NameToUserID('alice', master)).toBe('123');
  });

  test('returns invalid when query does not match', () => {
    expect(NameToUserID('charlie', master)).toBe(invalid);
  });
});

describe('CommandPurchase', () => {
  test('subtracts from sender and does not add to bot recipient', () => {
    const master = {
      user1: { gbp: 100 },
      bot: { gbp: 0 },
    };
    const message = { author: { id: 'user1' } };

    CommandPurchase(message, master, 30, defaultRecipient);

    expect(master.user1.gbp).toBe(70);
    expect(master.bot.gbp).toBe(0);
  });

  test('subtracts from sender and adds to non-bot recipient', () => {
    const master = {
      user1: { gbp: 100 },
      user2: { gbp: 50 },
    };
    const message = { author: { id: 'user1' } };

    CommandPurchase(message, master, 30, 'user2');

    expect(master.user1.gbp).toBe(70);
    expect(master.user2.gbp).toBe(80);
  });
});

describe('CommandUsageValidator', () => {
  const makeContext = () => {
    const send = jest.fn();
    const message = { channel: { send } };
    const master = {
      user1: { gbp: 100 },
      user2: { gbp: 200 },
    };
    return { send, message, master };
  };

  test('rejects NaN transaction amount', () => {
    const { send, message } = makeContext();
    expect(CommandUsageValidator(message, {}, 'abc', 10, 100, 'user2')).toBe(false);
    expect(send).toHaveBeenCalledWith('Value must be a positive number');
  });

  test('rejects negative transaction amount', () => {
    const { send, message } = makeContext();
    expect(CommandUsageValidator(message, {}, -5, 10, 100, 'user2')).toBe(false);
    expect(send).toHaveBeenCalledWith('Value must be a positive number');
  });

  test('rejects amount below minimum', () => {
    const { send, message } = makeContext();
    expect(CommandUsageValidator(message, {}, 5, 10, 100, 'user2')).toBe(false);
    expect(send).toHaveBeenCalledWith('You must use at least 10 gbp for this command');
  });

  test('rejects amount exceeding bankroll', () => {
    const { send, message } = makeContext();
    expect(CommandUsageValidator(message, {}, 150, 10, 100, 'user2')).toBe(false);
    expect(send).toHaveBeenCalledWith("You don't have that much GBP");
  });

  test('rejects invalid target', () => {
    const { send, message } = makeContext();
    expect(CommandUsageValidator(message, {}, 20, 10, 100, invalid)).toBe(false);
    expect(send).toHaveBeenCalledWith("That person doesn't exist");
  });

  test('returns true for valid usage', () => {
    const { send, message } = makeContext();
    expect(CommandUsageValidator(message, {}, 20, 10, 100, 'user2')).toBe(true);
    expect(send).not.toHaveBeenCalled();
  });
});
