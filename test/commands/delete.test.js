const { describe, expect, test } = require('@jest/globals');
const fs = require('fs');
const deleteCommand = require('../../commands/delete');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  tracker1: jest.fn(),
}));

const unlock = require('../../commands/Functions/Achievement_Functions');

assertBasicCommandModule(deleteCommand, 'delete');

function createMaster() {
  return { user1: { name: 'Alice', gbp: 10000 } };
}

function createDeleteMessage() {
  const message = createMessage();
  message.author = { id: 'user1' };
  message.channel.bulkDelete = jest.fn();
  return message;
}

describe('delete execute', () => {
  beforeEach(() => {
    fs.readFileSync.mockReturnValue(JSON.stringify({ user1: { deletes: 0 } }));
    fs.writeFileSync.mockImplementation((path, data, callback) => {
      if (callback) callback();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deletes a single message by default and records usage', () => {
    const message = createDeleteMessage();
    const master = createMaster();

    deleteCommand.execute(message, ['!delete'], 10000, master, {});

    expect(master.user1.gbp).toBe(8500);
    expect(message.channel.bulkDelete).toHaveBeenCalledWith(2);
    expect(message.channel.send.calls[0]).toEqual(['1 message has been deleted']);
    expect(unlock.tracker1).toHaveBeenCalledWith('user1', 25, 1, message, master, {});
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('deletes a specified number of messages', () => {
    const message = createDeleteMessage();
    const master = createMaster();

    deleteCommand.execute(message, ['!delete', '3'], 10000, master, {});

    expect(master.user1.gbp).toBe(5500);
    expect(message.channel.bulkDelete).toHaveBeenCalledWith(4);
    expect(message.channel.send.calls[0]).toEqual(['3 message(s) has/have been deleted']);
  });

  test('reports the cost when the author cannot afford it', () => {
    const message = createDeleteMessage();
    const master = createMaster();

    deleteCommand.execute(message, ['!delete'], 10, master, {});

    expect(master.user1.gbp).toBe(10000);
    expect(message.channel.send.calls[0]).toEqual(['This command costs 1500 gbp']);
  });

  test('blocks usage once the daily limit is reached', () => {
    fs.readFileSync.mockReturnValue(JSON.stringify({ user1: { deletes: 5 } }));
    const message = createDeleteMessage();
    const master = createMaster();

    deleteCommand.execute(message, ['!delete'], 10000, master, {});

    expect(message.channel.send.calls[0]).toEqual(['You can only use this command 5 times per day']);
  });

  test('blocks a requested amount that would exceed the daily limit', () => {
    fs.readFileSync.mockReturnValue(JSON.stringify({ user1: { deletes: 4 } }));
    const message = createDeleteMessage();
    const master = createMaster();

    deleteCommand.execute(message, ['!delete', '3'], 10000, master, {});

    expect(message.channel.send.calls[0]).toEqual(['You can only use this command 5 times per day']);
  });

  test('reports the cost when the author cannot afford a specified amount', () => {
    const message = createDeleteMessage();
    const master = createMaster();

    deleteCommand.execute(message, ['!delete', '3'], 100, master, {});

    expect(master.user1.gbp).toBe(10000);
    expect(message.channel.send.calls[0]).toEqual(['This command costs 4500 gbp']);
  });

  test('shows usage instructions for an invalid count', () => {
    const message = createDeleteMessage();
    const master = createMaster();

    deleteCommand.execute(message, ['!delete', '0'], 10000, master, {});

    expect(message.channel.send.calls[0][0]).toContain('Use the commmand as the following');
    expect(master.user1.gbp).toBe(10000);
  });

  test('sends an error message when the delete tracker lookup fails', () => {
    const message = createDeleteMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    deleteCommand.execute(message, ['!delete'], 10000, {}, {});

    expect(message.channel.send.calls[0]).toEqual(["Can't delete DMs"]);
    expect(logSpy).toHaveBeenCalled();
  });

  test('reports an error when the write callback receives an error (default count)', () => {
    fs.writeFileSync.mockImplementation((path, data, callback) => {
      if (callback) callback(new Error('disk full'));
    });
    const message = createDeleteMessage();
    const master = createMaster();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    deleteCommand.execute(message, ['!delete'], 10000, master, {});

    expect(message.channel.send.calls).toHaveLength(2);
    expect(message.channel.send.calls[1]).toEqual(["Can't delete DMs"]);
    expect(logSpy).toHaveBeenCalled();
  });

  test('reports an error when the write callback receives an error (specified count)', () => {
    fs.writeFileSync.mockImplementation((path, data, callback) => {
      if (callback) callback(new Error('disk full'));
    });
    const message = createDeleteMessage();
    const master = createMaster();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    deleteCommand.execute(message, ['!delete', '3'], 10000, master, {});

    expect(message.channel.send.calls).toHaveLength(2);
    expect(message.channel.send.calls[1]).toEqual(["Can't delete DMs"]);
    expect(logSpy).toHaveBeenCalled();
  });
});
