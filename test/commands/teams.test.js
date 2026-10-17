const { describe, expect, test } = require('@jest/globals');
const fs = require('fs');
const teams = require('../../commands/teams');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

assertBasicCommandModule(teams, 'teams');

function createTeamsMessage() {
  const message = createMessage();
  message.author = { bot: false };
  message.member = null;
  return message;
}

describe('teams execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('adds people to the list', () => {
    const message = createTeamsMessage();
    const data = [];

    teams.execute(message, ['!teams', 'add', 'Colin', 'Wyatt'], data);

    expect(data).toEqual(['Colin', 'Wyatt']);
    expect(message.channel.send.calls[0]).toEqual(['List updated']);
  });

  test('lists the current people', () => {
    const message = createTeamsMessage();

    teams.execute(message, ['!teams', 'people'], ['Colin', 'Wyatt']);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('Current People');
    expect(embed.description).toContain('Colin');
  });

  test('randomizes a number of teams', () => {
    const message = createTeamsMessage();
    jest.spyOn(Math, 'random').mockReturnValue(0);

    teams.execute(message, ['!teams', '2'], ['a', 'b', 'c', 'd']);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('Teams');
    expect(embed.fields).toHaveLength(2);
  });

  test('caps the number of teams at ten', () => {
    const message = createTeamsMessage();
    const data = Array.from({ length: 12 }, (_, i) => `p${i}`);

    teams.execute(message, ['!teams', '11'], data);

    expect(message.channel.send.calls[0]).toEqual(['You can only have a maximum number of 10 teams']);
  });

  test('reports an empty team list', () => {
    const message = createTeamsMessage();

    teams.execute(message, ['!teams', '2'], []);

    expect(message.channel.send.calls[0]).toEqual(['The team list is empty']);
  });

  test('reports when there are not enough people', () => {
    const message = createTeamsMessage();
    jest.spyOn(Math, 'random').mockReturnValue(0);

    teams.execute(message, ['!teams', '5'], ['a', 'b']);

    expect(message.channel.send.calls[0]).toEqual(['Not enough people to make teams']);
  });

  test('clears the list', () => {
    const message = createTeamsMessage();
    const data = ['a', 'b'];

    teams.execute(message, ['!teams', 'clear'], data);

    expect(data).toEqual([]);
    expect(message.channel.send.calls[0]).toEqual(['List cleared']);
  });

  test('shows help', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('!teams add ...\n!teams people');
    const message = createTeamsMessage();

    teams.execute(message, ['!teams', 'help'], []);

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('List of Commands');
  });

  test('shows a hint for unknown subcommands', () => {
    const message = createTeamsMessage();

    teams.execute(message, ['!teams', 'nonsense'], []);

    expect(message.channel.send.calls[0]).toEqual(['Use "!teams help" for a list of commands']);
  });

  test('handles failures in each subcommand', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const addMessage = createTeamsMessage();
    teams.execute(addMessage, ['!teams', 'add', 'x'], undefined);
    expect(addMessage.channel.send.calls[0]).toEqual(['Error occurred in teams.js Add']);

    const numberMessage = createTeamsMessage();
    teams.execute(numberMessage, ['!teams', '2'], null);
    expect(numberMessage.channel.send.calls[0]).toEqual(['Error occurred in teams.js Number']);

    const clearMessage = createTeamsMessage();
    teams.execute(clearMessage, ['!teams', 'clear'], null);
    expect(clearMessage.channel.send.calls[0]).toEqual(['Error occurred in teams.js Clear']);

    const peopleMessage = createTeamsMessage();
    teams.execute(peopleMessage, ['!teams', 'people'], {
      valueOf() {
        throw new Error('boom');
      },
    });
    expect(peopleMessage.channel.send.calls[0]).toEqual(['Error occurred in teams.js People']);

    expect(logSpy).toHaveBeenCalled();

    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('missing file');
    });
    const helpMessage = createTeamsMessage();
    teams.execute(helpMessage, ['!teams', 'help'], []);
    expect(helpMessage.channel.send.calls[0]).toEqual(['Error occurred in teams.js Help']);
  });

  test('sends an error message when the command cannot be processed', () => {
    const message = createTeamsMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    teams.execute(message, null, []);

    expect(message.channel.send.calls[0]).toEqual(['Error occurred in teams.js']);
    expect(logSpy).toHaveBeenCalled();
  });
});
