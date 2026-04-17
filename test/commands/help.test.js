const { describe, expect, test } = require('@jest/globals');
const help = require('../../commands/help');
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

assertBasicCommandModule(help, 'help');

describe('help command', () => {
  test('sends the command list embed when no specific command is requested', () => {
    const message = createMessage();
    help.execute(message, ['!help']);

    expect(embed.EmbedCreator).toHaveBeenCalledWith(
      message,
      'List of Commands',
      'Use "!help [number]" for more detailed info on a command',
      expect.objectContaining({
        name: 'Commands',
        value: expect.stringContaining('1. !'),
      }),
    );
    expect(message.channel.send.calls.length).toBe(1);
    const sendCall = message.channel.send.calls[0][0];
    expect(sendCall.embeds).toHaveLength(1);
  });

  test('sends command-specific help for a valid command number', () => {
    const message = createMessage();
    help.execute(message, ['!help', '19']);

    expect(embed.EmbedCreator).toHaveBeenCalledWith(
      message,
      '**!msgcount**',
      'Shows users ranked by total messages and can show all users',
      expect.objectContaining({
        name: '**Commands**',
        value: expect.stringContaining('!msgcount'),
      }),
    );
    expect(message.channel.send.calls.length).toBe(1);
    const sendCall = message.channel.send.calls[0][0];
    expect(sendCall.embeds).toHaveLength(1);
  });

  test('shows usage text for an invalid help target', () => {
    const message = createMessage();
    help.execute(message, ['!help', '999']);

    expect(message.channel.send.calls.length).toBe(1);
    expect(message.channel.send.calls[0][0]).toEqual(
      'Use !help for a list of all commands. Use !help [command number] for a more detailed list of the specified command',
    );
  });

  test('shows usage text for !help menu (removed feature)', () => {
    const message = createMessage();
    help.execute(message, ['!help', 'menu']);

    expect(message.channel.send.calls.length).toBe(1);
    expect(message.channel.send.calls[0][0]).toEqual(
      'Use !help for a list of all commands. Use !help [command number] for a more detailed list of the specified command',
    );
  });

  test('HelpEmbed function exports work correctly', () => {
    const message = createMessage();
    const testHelp = {
      '1': { name: '!test', description: 'Test command', rules: ['!test: does stuff'] }
    };

    help.HelpEmbed(message, testHelp);

    expect(embed.EmbedCreator).toHaveBeenCalled();
    expect(message.channel.send.calls.length).toBe(1);
  });

  test('CommandHelpEmbed function exports work correctly', () => {
    const message = createMessage();
    const testHelp = {
      '1': { name: '!test', description: 'Test command', rules: ['!test: does stuff'] }
    };

    help.CommandHelpEmbed(message, testHelp, ['!help', '1']);

    expect(embed.EmbedCreator).toHaveBeenCalledWith(
      message,
      '**!test**',
      'Test command',
      expect.objectContaining({ name: '**Commands**' })
    );
    expect(message.channel.send.calls.length).toBe(1);
  });
});
