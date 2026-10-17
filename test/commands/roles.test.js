const { describe, expect, test } = require('@jest/globals');
const roles = require('../../commands/roles');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

assertBasicCommandModule(roles, 'roles');

function createGuild(members) {
  return {
    members: {
      cache: {
        forEach: (callback) => members.forEach(callback),
      },
    },
  };
}

describe('roles execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('lists role owners for members that hold electable roles', () => {
    const message = createMessage();
    message.author = { bot: false };
    message.member = null;
    message.guild = createGuild([
      { id: 'user1', _roles: ['590576332350685194'] },
      { id: 'user2', _roles: ['669019379077218314'] },
      { id: 'user3', _roles: [] },
    ]);
    const master = {
      user1: { name: 'Alice' },
      user2: { name: 'Bob' },
    };

    roles.execute(message, master);

    expect(message.channel.send.calls).toHaveLength(1);
    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.fields[0].name).toBe('List of Electable Roles');
    expect(embed.fields[0].value).toContain("0. The People's Representative - Alice");
    expect(embed.fields[0].value).toContain('3. Dog Catcher - Bob');
    expect(embed.fields[0].value).toContain('1. Senior Representative Assistant - None');
  });

  test('sends an error message when a role owner is missing from master', () => {
    const message = createMessage();
    message.author = { bot: false };
    message.member = null;
    message.guild = createGuild([{ id: 'ghost', _roles: ['590576332350685194'] }]);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    roles.execute(message, {});

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in Roles.js']);
    expect(logSpy).toHaveBeenCalled();
  });
});
