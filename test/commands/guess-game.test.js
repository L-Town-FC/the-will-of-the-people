const { describe, expect, test } = require('@jest/globals');
const fs = require('fs');
const guessGame = require('../../commands/guess_game');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  tracker1: jest.fn(),
  tracker3: jest.fn(),
}));

jest.mock('../../commands/Functions/stats_functions', () => ({
  tracker: jest.fn(),
}));

const unlock = require('../../commands/Functions/Achievement_Functions');
const stats = require('../../commands/Functions/stats_functions');

assertBasicCommandModule(guessGame, 'gg');

function createMaster() {
  return { user1: { name: 'Alice', gbp: 1000 } };
}

function createGameMessage() {
  const message = createMessage();
  message.author = { id: 'user1', bot: false };
  message.member = null;
  return message;
}

function setFile(content) {
  fs.readFileSync.mockReturnValue(content);
}

describe('guess_game execute', () => {
  beforeEach(() => {
    fs.readFileSync.mockReset();
    fs.writeFileSync.mockReset();
    unlock.tracker1.mockReset();
    unlock.tracker3.mockReset();
    stats.tracker.mockReset();
    setFile('0 0 0 0');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('accepts a valid bet and starts a game', () => {
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', 'bet', '10'], '1000', master, {}, {});

    expect(message.channel.send.calls[0][0]).toContain('Your bet is accepted');
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(master.user1.gbp).toBe(990);
  });

  test('reports an ongoing game', () => {
    setFile('2 50 user1 10');
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', 'bet', '10'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Alice is currently playing and is on guess 2']);
  });

  test('rejects a bet larger than the balance', () => {
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', 'bet', '5000'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual(["You don't have enough gbp for that bet"]);
  });

  test('accepts an "all" bet', () => {
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', 'bet', 'all'], '1000', master, {}, {});

    expect(message.channel.send.calls[0][0]).toContain('Your bet was 1000');
    expect(master.user1.gbp).toBe(0);
  });

  test('rejects a bet below the minimum', () => {
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', 'bet', '2'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Please place a valid bet of 5 gbp or greater']);
  });

  test('sends an error message when betting fails', () => {
    const message = createGameMessage();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    guessGame.execute(message, ['!gg', 'bet', '10'], '1000', {}, {}, {});

    expect(message.channel.send.calls).toContainEqual(['Error occurred in guessgame.js Bet']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('plays a correct guess and pays out', () => {
    setFile('1 50 user1 10');
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', '50'], '1000', master, {}, {});

    expect(message.channel.send.calls).toContainEqual(['Congratulations. You guessed the correct number']);
    expect(message.channel.send.calls).toContainEqual(['You win 200 gbp']);
    expect(unlock.tracker1).toHaveBeenCalledWith('user1', 33, 200, message, master, {});
    expect(stats.tracker).toHaveBeenCalledWith('user1', 5, 1, {});
  });

  test('loses when out of guesses', () => {
    setFile('4 50 user1 10');
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', '60'], '1000', master, {}, {});

    expect(message.channel.send.calls).toContainEqual([
      'You are out of guesses. You lose. The correct number was 50',
    ]);
    expect(unlock.tracker1).toHaveBeenCalledWith('user1', 32, 10, message, master, {});
    expect(stats.tracker).toHaveBeenCalledWith('user1', 6, 1, {});
  });

  test('reports no active game when guessing', () => {
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', '50'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Noone is currently playing']);
  });

  test('tells the player to guess lower with plural guesses', () => {
    setFile('1 50 user1 10');
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', '60'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual([
      'The correct number is lower than your guess. You have 2 guesses remaining',
    ]);
  });

  test('tells the player to guess higher', () => {
    setFile('1 50 user1 10');
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', '40'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual([
      'The correct number is higher than your guess. You have 2 guesses remaining',
    ]);
  });

  test('uses singular guesses remaining on the final higher hint', () => {
    setFile('4 50 user1 10');
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', '40'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual([
      'The correct number is higher than your guess. You have -1 guess remaining',
    ]);
  });

  test('rejects an out-of-range guess', () => {
    setFile('1 50 user1 10');
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', 'guess'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Please guess a valid number between 0 and 100']);
  });

  test('shows status when no game is active', () => {
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', 'status'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Noone is currently playing']);
  });

  test('shows status of an active game', () => {
    setFile('2 50 user1 10');
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', 'status'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual([
      'Alice is currently playing and is on guess number 2',
    ]);
  });

  test('shows help', () => {
    setFile('0 0 0 0 commands');
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', 'help'], '1000', master, {}, {});

    const embed = message.channel.send.calls[0][0].embeds[0].data;
    expect(embed.fields[0].name).toBe('List of Commands');
  });

  test('shows a hint for unknown subcommands', () => {
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', 'xyz'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Use the command "!gg help" for a list of commands']);
  });

  test('treats a non-positive number as an unknown subcommand', () => {
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg', '0'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Use the command "!gg help" for a list of commands']);
  });

  test('defaults to an unknown subcommand when no argument is given', () => {
    const message = createGameMessage();
    const master = createMaster();

    guessGame.execute(message, ['!gg'], '1000', master, {}, {});

    expect(message.channel.send.calls[0]).toEqual(['Use the command "!gg help" for a list of commands']);
  });

  test('sends an error message when saving the first guess fails', () => {
    const message = createGameMessage();
    const master = createMaster();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    fs.writeFileSync.mockImplementationOnce(() => {
      throw new Error('disk full');
    });

    guessGame.execute(message, ['!gg', 'bet', '10'], '1000', master, {}, {});

    expect(message.channel.send.calls[0][0]).toContain('Your bet is accepted');
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when updating guesses fails', () => {
    setFile('1 50 user1 10');
    const message = createGameMessage();
    message.channel.send = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('boom');
      })
      .mockImplementation(() => {});
    const master = createMaster();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    guessGame.execute(message, ['!gg', '60'], '1000', master, {}, {});

    expect(message.channel.send).toHaveBeenCalledWith(
      'Error occurred in guessgame.js Update_Guesses'
    );
    expect(logSpy).toHaveBeenCalled();
  });

  test('handles read failures during a guess', () => {
    fs.readFileSync
      .mockReturnValueOnce('1 50 user1 10')
      .mockReturnValueOnce('1 50 user1 10')
      .mockReturnValueOnce('1 50 user1 10')
      .mockImplementation(() => {
        throw new Error('read fail');
      });
    const message = createGameMessage();
    const master = createMaster();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    guessGame.execute(message, ['!gg', '60'], '1000', master, {}, {});

    expect(message.channel.send.calls).toContainEqual(['Error occurred in guessgame.js Guess']);
    expect(message.channel.send.calls).toContainEqual(['Error occurred in guessgame.js']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('handles read failures during status', () => {
    fs.readFileSync
      .mockReturnValueOnce('0 0 0 0')
      .mockReturnValueOnce('0 0 0 0')
      .mockReturnValueOnce('0 0 0 0')
      .mockImplementation(() => {
        throw new Error('read fail');
      });
    const message = createGameMessage();
    const master = createMaster();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    guessGame.execute(message, ['!gg', 'status'], '1000', master, {}, {});

    expect(message.channel.send.calls).toContainEqual(['Error occurred in guessgame.js Bet']);
    expect(message.channel.send.calls).toContainEqual(['Error occurred in guessgame.js']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('handles read failures while loading help', () => {
    fs.readFileSync
      .mockReturnValueOnce('0 0 0 0')
      .mockReturnValueOnce('0 0 0 0')
      .mockReturnValueOnce('0 0 0 0')
      .mockImplementation(() => {
        throw new Error('read fail');
      });
    const message = createGameMessage();
    const master = createMaster();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    guessGame.execute(message, ['!gg', 'help'], '1000', master, {}, {});

    expect(message.channel.send.calls).toContainEqual(['Error occurred in guessgame.js Help']);
    expect(logSpy).toHaveBeenCalled();
  });

  test('sends an error message when the payout tracker fails', () => {
    setFile('1 50 user1 10');
    unlock.tracker1.mockImplementationOnce(() => {
      throw new Error('tracker boom');
    });
    const message = createGameMessage();
    const master = createMaster();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    guessGame.execute(message, ['!gg', '50'], '1000', master, {}, {});

    expect(message.channel.send.calls).toContainEqual(['Error occurred in guessgame.js']);
    expect(logSpy).toHaveBeenCalled();
  });
});
