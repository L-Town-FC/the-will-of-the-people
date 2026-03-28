const { describe, expect, test } = require('@jest/globals');
const names = require('../../commands/names');
const embed = require('../../commands/Functions/embed_functions');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('../../commands/Functions/embed_functions', () => ({
  emptyValue: 'emptyValue',
  EmbedCreator: jest.fn((message, title, description, fields) => ({
    title,
    description,
    fields,
  })),
}));

assertBasicCommandModule(names, 'names');

describe('names command', () => {
  test('sends an embed containing the server name list', () => {
    const message = createMessage();
    const master = {
      user1: { name: 'Andrew' },
      user2: { name: 'Ben' },
      user3: { name: 'Jack' },
    };

    names.execute(message, master);

    expect(embed.EmbedCreator).toHaveBeenCalledWith(
      message,
      'List of all names on the Server',
      ['Andrew', 'Ben', 'Jack'],
      embed.emptyValue,
    );
    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual([
      {
        embeds: [
          {
            title: 'List of all names on the Server',
            description: ['Andrew', 'Ben', 'Jack'],
            fields: embed.emptyValue,
          },
        ],
      },
    ]);
  });
});
