const { describe, expect, test } = require('@jest/globals');
const transfer = require('../../commands/transfer');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  unlock: jest.fn(),
}));

const unlock = require('../../commands/Functions/Achievement_Functions');

assertBasicCommandModule(transfer, 'transfer');

function createMaster() {
  return {
    user1: { name: 'Alice', gbp: 1000 },
    user2: { name: 'Bob', gbp: 500 },
  };
}

function createTransferMessage(channelId) {
  const message = createMessage();
  message.author = { id: 'user1' };
  message.channel.id = channelId || 'normalChannel';
  return message;
}

describe('transfer execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('asks for a person and amount when the command is empty', () => {
    const message = createTransferMessage();
    const master = createMaster();

    transfer.execute(message, ['!transfer'], master);

    expect(message.channel.send.calls[0]).toEqual([
      'You must specify a person and an amount. ex !transfer [person] [amount]',
    ]);
  });

  test('transfers the amount and confirms it', () => {
    const message = createTransferMessage();
    const master = createMaster();

    transfer.execute(message, ['!transfer', 'Bob', '100'], master);

    expect(master.user1.gbp).toBe(900);
    expect(master.user2.gbp).toBe(600);
    expect(message.channel.send.calls).toContainEqual(['Alice has transferred Bob 100 gbp']);
  });

  test('supports transferring the entire balance with "all"', () => {
    const message = createTransferMessage();
    const master = createMaster();

    transfer.execute(message, ['!transfer', 'Bob', 'all'], master);

    expect(master.user1.gbp).toBe(0);
    expect(master.user2.gbp).toBe(1500);
  });

  test('shows help text when help is requested', () => {
    const message = createTransferMessage();
    const master = createMaster();

    transfer.execute(message, ['!transfer', 'help'], master);

    expect(message.channel.send.calls).toHaveLength(2);
    expect(message.channel.send.calls[0]).toEqual(['!transfer [person] [amount] for basic']);
  });

  test('unlocks an achievement when used in bot tinkering', () => {
    const message = createTransferMessage('711634711281401867');
    message.channel.bulkDelete = jest.fn();
    const master = createMaster();

    transfer.execute(message, ['!transfer', 'Bob', '100'], master);

    expect(message.channel.bulkDelete).toHaveBeenCalledWith(1);
    expect(unlock.unlock).toHaveBeenCalledWith('user1', 7, message, master);
  });

  test('unlocks the easy money achievement in the stack your family channel', () => {
    const message = createTransferMessage('668600084052705290');
    const master = createMaster();

    transfer.execute(message, ['!transfer', 'Bob', '100'], master);

    expect(unlock.unlock).toHaveBeenCalledWith('user2', 16, message, master);
  });

  test('notifies the recipient when the transfer happens in a DM', () => {
    const message = createTransferMessage('dmChannel');
    message.channel.type = 'dm';
    const dmUser = { id: 'user2', send: jest.fn() };
    message.mentions = { _client: { users: { array: () => [dmUser] } } };
    const master = createMaster();

    transfer.execute(message, ['!transfer', 'Bob', '100'], master);

    expect(dmUser.send).toHaveBeenCalledWith('You have been transferred 100 gbp');
  });

  test('skips unrelated users when notifying in a DM', () => {
    const message = createTransferMessage('dmChannel');
    message.channel.type = 'dm';
    const otherUser = { id: 'user9', send: jest.fn() };
    const dmUser = { id: 'user2', send: jest.fn() };
    message.mentions = { _client: { users: { array: () => [otherUser, dmUser] } } };
    const master = createMaster();

    transfer.execute(message, ['!transfer', 'Bob', '100'], master);

    expect(otherUser.send).not.toHaveBeenCalled();
    expect(dmUser.send).toHaveBeenCalledWith('You have been transferred 100 gbp');
  });

  test('rejects a transfer the author cannot afford', () => {
    const message = createTransferMessage();
    const master = createMaster();
    master.user1.gbp = 50;

    transfer.execute(message, ['!transfer', 'Bob', '100'], master);

    expect(master.user1.gbp).toBe(50);
    expect(master.user2.gbp).toBe(500);
    expect(message.channel.send.calls).toContainEqual(["You don't have that much GBP"]);
  });

  test('sends an error message when the transfer fails', () => {
    const message = createTransferMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    transfer.execute(message, ['!transfer', 'Bob', '100'], {});

    expect(message.channel.send.calls).toContainEqual(['Error occurred in transfer.js']);
    expect(logSpy).toHaveBeenCalled();
  });
});

describe('transfer split', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('splits an amount between multiple recipients', () => {
    const message = createTransferMessage();
    const master = createMaster();

    transfer.execute(message, ['!transfer', 'split', '100', 'Bob'], master);

    expect(master.user1.gbp).toBe(900);
    expect(master.user2.gbp).toBe(600);
    expect(message.channel.send.calls[0][0]).toContain('Alice has transferred 100.00 gbp to:');
  });

  test('rejects an invalid split amount', () => {
    const message = createTransferMessage();
    const master = createMaster();

    transfer.execute(message, ['!transfer', 'split', 'abc', 'Bob'], master);

    expect(message.channel.send.calls[0]).toEqual(['You must choose a valid amount greater than 0']);
  });

  test('rejects a split larger than the author balance', () => {
    const message = createTransferMessage();
    const master = createMaster();

    transfer.execute(message, ['!transfer', 'split', '5000', 'Bob'], master);

    expect(message.channel.send.calls[0]).toEqual(["You can't transfer more gbp than you have"]);
  });

  test('reports when no recipients exist', () => {
    const message = createTransferMessage();
    const master = createMaster();

    transfer.execute(message, ['!transfer', 'split', '100', 'Nobody'], master);

    expect(message.channel.send.calls[0]).toEqual(["You didn't choose any existing recipients"]);
  });

  test('sends an error message when the split fails', () => {
    const message = createTransferMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    transfer.execute(message, ['!transfer', 'split', '100', 'Bob'], {});

    expect(message.channel.send.calls).toContainEqual(['Error occurred in transfer.js split']);
    expect(logSpy).toHaveBeenCalled();
  });
});
