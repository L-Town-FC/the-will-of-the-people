const { describe, expect, test } = require('@jest/globals');
const update = require('../../commands/update');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('fs');
const fs = require('fs');

assertBasicCommandModule(update, 'update');

describe('update execute', () => {
  const ADMIN_ID = '450001712305143869';
  const makeMsg = (id) => Object.assign(createMessage(), { author: { id } });
  const path = '/data';
  const data = { key: 'value' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('writes all five JSON files for admin user', async () => {
    const msg = makeMsg(ADMIN_ID);
    await update.execute(msg, 'local', data, data, data, data, data, path);

    expect(msg.channel.send.calls).toEqual([['Update Successful']]);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(5);

    const names = ['master', 'stats', 'tracker', 'command_stats', 'emojis'];
    names.forEach((name, i) => {
      const call = fs.writeFileSync.mock.calls[i];
      expect(call[0]).toBe(`${path}/${name}.dev.json`);
      expect(call[1]).toBe(JSON.stringify({ [name]: data }, null, 2));
      expect(call[2]).toBe('utf-8');
    });
  });

  test('uses prod prefix when location is not local', async () => {
    const msg = makeMsg(ADMIN_ID);
    await update.execute(msg, 'prod', data, data, data, data, data, path);

    expect(fs.writeFileSync).toHaveBeenCalledTimes(5);
    const call = fs.writeFileSync.mock.calls[0];
    expect(call[0]).toBe(`${path}/master.prod.json`);
  });

  test('does nothing for non-admin user', async () => {
    const msg = makeMsg('user123');
    await update.execute(msg, 'local', data, data, data, data, data, path);

    expect(msg.channel.send.calls).toHaveLength(0);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('reads data from file when data argument is null', async () => {
    const msg = makeMsg(ADMIN_ID);
    fs.readFileSync.mockReturnValue('{"stats": {"gbp": 100}}');

    await update.execute(msg, 'local', data, null, data, data, data, path);

    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledWith(`${path}/stats.dev.json`, 'utf-8');
    expect(fs.writeFileSync).toHaveBeenCalledTimes(4);
    expect(msg.channel.send.calls).toEqual([['Update Successful']]);
  });
});
