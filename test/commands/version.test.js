const { describe, expect, test } = require('@jest/globals');
const version = require('../../commands/version');
const { createMessage } = require('../helpers/createMessage');

describe('version command', () => {
  test('responds with the baked-in app version', () => {
    const message = createMessage();
    const previousVersion = process.env.APP_VERSION;

    process.env.APP_VERSION = 'v2.2.3';

    version.execute(message);

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual(['Bot version: v2.2.3']);

    restoreAppVersion(previousVersion);
  });

  test('falls back to unknown when no app version is set', () => {
    const message = createMessage();
    const previousVersion = process.env.APP_VERSION;

    delete process.env.APP_VERSION;

    version.execute(message);

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual(['Bot version: unknown']);

    restoreAppVersion(previousVersion);
  });
});

function restoreAppVersion(previousVersion) {
  if (previousVersion === undefined) {
    delete process.env.APP_VERSION;
    return;
  }

  process.env.APP_VERSION = previousVersion;
}
