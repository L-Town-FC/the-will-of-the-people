const { describe, expect, test } = require('@jest/globals');
const uptime = require('../../commands/uptime');
const { createMessage } = require('../helpers/createMessage');

describe('uptime command', () => {
  test('formats bot uptime into days, hours, minutes, and seconds', () => {
    const message = createMessage();
    const bot = {
      uptime: (((1 * 24 + 2) * 60 + 3) * 60 + 4) * 1000,
    };

    uptime.execute(message, bot);

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual([
      'The monster has lurked in the realm for: **1d 2h 3m 4s**',
    ]);
  });

  test('reports an error when sending fails', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const message = createMessage();
    let first = true;
    message.channel.send = jest.fn(() => {
      if (first) {
        first = false;
        throw new Error('boom');
      }
    });

    uptime.execute(message, { uptime: 1000 });

    expect(consoleSpy).toHaveBeenCalled();
    expect(message.channel.send).toHaveBeenLastCalledWith('Error Occurred in uptime.js');

    consoleSpy.mockRestore();
  });
});
