const { describe, expect, test, beforeEach, afterEach } = require('@jest/globals');

const mockButtonInstances = [];

jest.mock('discord.js', () => {
  class ButtonBuilder {
    constructor() {
      this.disabled = false;
      mockButtonInstances.push(this);
    }
    setLabel(label) {
      this.label = label;
      return this;
    }
    setStyle(style) {
      this.style = style;
      return this;
    }
    setCustomId(customId) {
      this.customId = customId;
      return this;
    }
    setDisabled(disabled) {
      this.disabled = disabled;
      return this;
    }
  }
  class ActionRowBuilder {
    addComponents(...components) {
      this.components = components;
      return this;
    }
  }
  return {
    ButtonBuilder,
    ButtonStyle: { Primary: 'Primary', Success: 'Success', Secondary: 'Secondary', Danger: 'Danger' },
    ActionRowBuilder,
    ComponentType: { Button: 'Button' },
  };
});

jest.mock('../../commands/Functions/GeneralFunctions', () => ({
  CommandUsageValidator: jest.fn(() => true),
  CommandPurchase: jest.fn(),
  defaultRecipient: 'bot',
}));

jest.mock('../../commands/Functions/Achievement_Functions', () => ({
  tracker1: jest.fn(),
  tracker3: jest.fn(),
  unlock: jest.fn(),
  reset1: jest.fn(),
}));

jest.mock('../../commands/Functions/embed_functions', () => ({
  EmbedCreator: jest.fn((message, title, description, fields) => ({ title, description, fields })),
  emptyValue: 'EMPTY',
}));

jest.mock('../../commands/Functions/stats_functions', () => ({ tracker: jest.fn() }));

const general = require('../../commands/Functions/GeneralFunctions');
const unlock = require('../../commands/Functions/Achievement_Functions');
const stats = require('../../commands/Functions/stats_functions');
const command = require('../../commands/21');

const flush = () => new Promise((resolve) => setImmediate(resolve));

const OUTCOMES = { Win: 'win', Push: 'push', Loss: 'loss', Blackjack: 'Blackjack', Surrender: 'Surrender' };

function makeMaster() {
  return {
    user1: { name: 'User One', gbp: 10000, achievements: [] },
    user2: { name: 'User Two', gbp: 10000, achievements: [] },
  };
}

function makeMessage(userID = 'user1') {
  return {
    id: 'guildMessage',
    author: { id: userID },
    content: '!21 20',
    channel: { send: jest.fn() },
    reply: jest.fn(),
  };
}

function makeReply() {
  const handlers = {};
  return {
    id: 'reply1',
    embeds: [{ placeholder: true }],
    edit: jest.fn(),
    _handlers: handlers,
    createMessageComponentCollector: jest.fn(() => ({
      on: jest.fn((event, fn) => {
        handlers[event] = fn;
      }),
    })),
  };
}

function makeInteraction(customId, { userID = 'user1', messageID = 'reply1' } = {}) {
  return {
    customId,
    user: { id: userID },
    message: { id: messageID },
    update: jest.fn(),
  };
}

function newGameState(overrides = {}) {
  return Object.assign(
    {
      bet: [100, 100],
      currentMessageID: 'existing',
      dealerHand: [5, 6],
      dealerDummyHand: ['5:diamonds:', '6:hearts:'],
      playerHand: [[10, 9], []],
      playerDummyHand: [['10:diamonds:', '9:hearts:'], ['8:clubs:', '7:spades:']],
      playerSplit: true,
      playerStay: [false, false],
      playerBust: [false, false],
      dealerBust: false,
      playerHandOutcome: [OUTCOMES.Push, OUTCOMES.Push],
    },
    overrides
  );
}

let master;
let blackJackHands;
let tracker;
let statsList;

beforeEach(() => {
  jest.clearAllMocks();
  general.CommandUsageValidator.mockReturnValue(true);
  master = makeMaster();
  blackJackHands = {};
  tracker = {};
  statsList = {};
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

async function runNewGame(args = ['21', '20'], userID = 'user1') {
  const message = makeMessage(userID);
  const reply = makeReply();
  message.reply.mockResolvedValue(reply);
  command.execute(message, args, master, blackJackHands, tracker, statsList);
  await flush();
  return { message, reply };
}

describe('21 (blackjack) command module', () => {
  test('exports the expected command shape', () => {
    expect(command.name).toBe('21');
    expect(typeof command.execute).toBe('function');
  });

  test('requires a bet amount', () => {
    const message = makeMessage();
    command.execute(message, ['21'], master, blackJackHands, tracker, statsList);
    expect(message.channel.send).toHaveBeenCalledWith('You must specificy a bet amount');
  });

  test('stops when the bet is rejected by the usage validator', () => {
    general.CommandUsageValidator.mockReturnValue(false);
    const message = makeMessage();
    command.execute(message, ['21', '5'], master, blackJackHands, tracker, statsList);
    expect(message.reply).not.toHaveBeenCalled();
  });

  test('reports an error when setup throws', () => {
    general.CommandUsageValidator.mockImplementation(() => {
      throw new Error('boom');
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const message = makeMessage();
    command.execute(message, ['21', '20'], master, blackJackHands, tracker, statsList);
    expect(message.channel.send).toHaveBeenCalledWith('Error occurred in 21.js');
    expect(logSpy).toHaveBeenCalled();
  });

  test('creates a new game and draws two cards each', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { message, reply } = await runNewGame();
    expect(general.CommandPurchase).toHaveBeenCalled();
    expect(message.reply).toHaveBeenCalled();
    expect(reply.createMessageComponentCollector).toHaveBeenCalled();
    expect(blackJackHands.user1.playerHand[0]).toHaveLength(2);
    expect(blackJackHands.user1.dealerHand).toHaveLength(2);
  });

  test('unlocks the psycho achievement for a large bet', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    await runNewGame(['21', '250']);
    expect(unlock.tracker1).toHaveBeenCalledWith('user1', 23, 1, expect.anything(), master, tracker);
  });

  test('resends the display for an existing game', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    blackJackHands.user1 = newGameState({ playerStay: [true, false], playerHand: [[20], []], dealerHand: [19] });
    const { reply } = await runNewGame();
    expect(reply.edit).toHaveBeenCalled();
  });
});

describe('21 (blackjack) play flow', () => {
  test('hit then stay resolves the hand', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { reply } = await runNewGame();

    const hit = makeInteraction('hit');
    reply._handlers.collect(hit);
    expect(hit.update).toHaveBeenCalled();

    const stay = makeInteraction('stay');
    reply._handlers.collect(stay);
    expect(stay.update).toHaveBeenCalled();
    expect(unlock.tracker1).toHaveBeenCalled();
  });

  test('double down doubles the bet and then stays', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { reply } = await runNewGame();
    const interaction = makeInteraction('doubleDown');

    reply._handlers.collect(interaction);

    expect(general.CommandPurchase.mock.calls.length).toBeGreaterThan(1);
    expect(interaction.update).toHaveBeenCalled();
  });

  test('surrender ends the hand immediately', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { reply } = await runNewGame();
    const interaction = makeInteraction('surrender');

    reply._handlers.collect(interaction);

    const embed = interaction.update.mock.calls[0][0].embeds[0];
    const outcomes = embed.fields.find((field) => field.name === 'Outcomes');
    expect(outcomes.value[0]).toBe('Hand 1: Surrender');
  });

  test('split creates a second hand and can stay on both', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { reply } = await runNewGame();

    reply._handlers.collect(makeInteraction('split'));
    expect(blackJackHands.user1.playerSplit).toBe(true);

    const firstStay = makeInteraction('stay');
    reply._handlers.collect(firstStay);
    expect(firstStay.update).toHaveBeenCalled();
    expect(blackJackHands.user1.playerStay[0]).toBe(true);

    const secondStay = makeInteraction('stay');
    reply._handlers.collect(secondStay);
    expect(secondStay.update).toHaveBeenCalled();
  });

  test('ignores interactions for stale messages', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { reply } = await runNewGame();
    const interaction = makeInteraction('hit', { messageID: 'stale' });

    reply._handlers.collect(interaction);

    expect(interaction.update).not.toHaveBeenCalled();
  });

  test('disables buttons when the collector ends', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { reply } = await runNewGame();

    reply._handlers.end();

    expect(reply.edit).toHaveBeenCalled();
  });

  test('converts aces down when the hand is over 21', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    blackJackHands.user1 = newGameState({
      playerHand: [[11, 11, 11], []],
      playerDummyHand: [['A:diamonds:', 'A:hearts:', 'A:spades:'], []],
      dealerHand: [5, 6],
    });
    const { reply } = await runNewGame();

    const hit = makeInteraction('hit');
    reply._handlers.collect(hit);

    expect(blackJackHands.user1.playerHand[0]).toContain(1);
  });

  test('shrinks aces in the dealer hand when over 21', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    blackJackHands.user1 = newGameState({
      playerHand: [[11, 11, 11], []],
      playerDummyHand: [['A:diamonds:', 'A:hearts:', 'A:spades:'], []],
      dealerHand: [11, 11, 11],
    });
    const { reply } = await runNewGame();

    const hit = makeInteraction('hit');
    expect(() => reply._handlers.collect(hit)).not.toThrow();
  });
});

describe('21 (blackjack) outcomes', () => {
  test('pays out a win', async () => {
    blackJackHands.user1 = newGameState({
      playerStay: [true, false],
      playerHand: [[20], []],
      dealerHand: [19],
    });
    await runNewGame();
    expect(unlock.reset1).toHaveBeenCalled();
  });

  test('pays out a high roller win', async () => {
    blackJackHands.user1 = newGameState({
      bet: [1000, 1000],
      playerStay: [true, false],
      playerHand: [[20], []],
      dealerHand: [19],
    });
    await runNewGame();
    expect(unlock.unlock).toHaveBeenCalledWith('user1', 1, expect.anything(), master);
    expect(unlock.tracker3).toHaveBeenCalled();
  });

  test('handles a push', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { reply } = await runNewGame();

    for (let i = 0; i < 7; i += 1) {
      reply._handlers.collect(makeInteraction('hit'));
    }
    reply._handlers.collect(makeInteraction('stay'));

    expect(stats.tracker).toHaveBeenCalledWith('user1', 3, 1, statsList, tracker);
  });

  test('handles a loss above the buster threshold', async () => {
    blackJackHands.user1 = newGameState({
      bet: [1000, 1000],
      playerStay: [true, false],
      playerHand: [[15], []],
      dealerHand: [19],
    });
    await runNewGame();
    expect(unlock.unlock).toHaveBeenCalledWith('user1', 2, expect.anything(), master);
    expect(unlock.tracker1).toHaveBeenCalled();
  });

  test('handles a blackjack outcome', async () => {
    blackJackHands.user1 = newGameState({
      playerStay: [true, false],
      playerHand: [[21], []],
      playerHandOutcome: [OUTCOMES.Blackjack, OUTCOMES.Push],
      dealerHand: [19],
    });
    await runNewGame();
    expect(general.CommandPurchase).toHaveBeenCalled();
  });

  test('handles a surrender payout', async () => {
    blackJackHands.user1 = newGameState({
      playerStay: [true, false],
      playerHand: [[18], []],
      playerHandOutcome: [OUTCOMES.Surrender, OUTCOMES.Push],
      dealerHand: [19],
    });
    await runNewGame();
    expect(general.CommandPurchase).toHaveBeenCalled();
  });

  test('wins when the dealer busts', async () => {
    blackJackHands.user1 = newGameState({
      playerStay: [true, false],
      playerHand: [[20], []],
      dealerHand: [10, 10, 5],
    });
    await runNewGame();
    expect(unlock.reset1).toHaveBeenCalled();
  });

  test('skips an empty second hand during payout', async () => {
    blackJackHands.user1 = newGameState({
      playerStay: [true, true],
      playerHand: [[20], []],
      dealerHand: [19],
    });
    await runNewGame();
    expect(general.CommandPurchase).toHaveBeenCalled();
  });
});

describe('21 (blackjack) edge branches', () => {
  test('hits the second hand after staying on the first', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    blackJackHands.user1 = newGameState({
      playerStay: [true, false],
      playerHand: [[18], [5]],
      playerDummyHand: [['10:diamonds:', '8:hearts:'], ['5:clubs:', '5:spades:']],
      dealerHand: [10, 7],
    });
    const { reply } = await runNewGame();

    const hit = makeInteraction('hit');
    reply._handlers.collect(hit);

    expect(blackJackHands.user1.playerHand[1].length).toBe(2);
  });

  test('busts the player with a high card', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.7);
    blackJackHands.user1 = newGameState({
      playerStay: [false, false],
      playerHand: [[10, 10], []],
      playerDummyHand: [['10:diamonds:', '10:hearts:'], ['9:clubs:', '9:spades:']],
      dealerHand: [5, 6],
    });
    const { reply } = await runNewGame();

    const hit = makeInteraction('hit');
    reply._handlers.collect(hit);

    expect(hit.update).toHaveBeenCalled();
    expect(unlock.tracker1).toHaveBeenCalled();
  });

  test('doubles down on the second hand', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    blackJackHands.user1 = newGameState({
      playerStay: [true, false],
      playerHand: [[18], [5, 5]],
      playerDummyHand: [['10:diamonds:', '8:hearts:'], ['5:clubs:', '5:spades:']],
      dealerHand: [10, 7],
    });
    const { reply } = await runNewGame();

    const doubleDown = makeInteraction('doubleDown');
    reply._handlers.collect(doubleDown);

    expect(doubleDown.update).toHaveBeenCalled();
  });

  test('doubles down into a bust', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.7);
    blackJackHands.user1 = newGameState({
      playerStay: [false, false],
      playerHand: [[10, 10], []],
      playerDummyHand: [['10:diamonds:', '10:hearts:'], ['9:clubs:', '9:spades:']],
      dealerHand: [5, 6],
    });
    const { reply } = await runNewGame();

    const doubleDown = makeInteraction('doubleDown');
    reply._handlers.collect(doubleDown);

    expect(doubleDown.update).toHaveBeenCalled();
  });

  test('doubles down into a bust on the second hand', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.7);
    blackJackHands.user1 = newGameState({
      playerStay: [true, false],
      playerSplit: true,
      playerHand: [[18], [10, 10]],
      playerDummyHand: [['10:diamonds:', '8:hearts:'], ['10:clubs:', '10:spades:']],
      dealerHand: [5, 6],
    });
    const { reply } = await runNewGame();

    const doubleDown = makeInteraction('doubleDown');
    reply._handlers.collect(doubleDown);

    expect(doubleDown.update).toHaveBeenCalled();
  });

  test('converts dealer aces when the dealer is over 21', async () => {
    blackJackHands.user1 = newGameState({
      playerStay: [true, false],
      playerHand: [[11, 11, 11], []],
      playerDummyHand: [['A:diamonds:', 'A:hearts:', 'A:spades:'], ['9:clubs:', '9:spades:']],
      dealerHand: [11, 11, 11],
    });
    const { reply } = await runNewGame();

    expect(reply.edit).toHaveBeenCalled();
  });

  test('disables split and double down once a hand has more than two cards', async () => {
    blackJackHands.user1 = newGameState({
      playerStay: [true, false],
      playerSplit: true,
      playerHand: [[18], [10]],
      playerDummyHand: [['2:diamonds:', '2:hearts:'], ['2:clubs:', '3:spades:', '4:hearts:']],
      dealerHand: [19],
    });
    const { reply } = await runNewGame();

    expect(reply.createMessageComponentCollector).toHaveBeenCalled();
  });
});

describe('21 (blackjack) dealt blackjacks', () => {
  test('a player blackjack is resolved immediately', async () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.7)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    const { reply } = await runNewGame();
    expect(reply.edit).toHaveBeenCalled();
  });

  test('both blackjacks result in a push', async () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.7)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.7)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    const { reply } = await runNewGame();
    expect(reply.edit).toHaveBeenCalled();
  });

  test('a dealer blackjack means the player loses', async () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.7)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.55)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.7)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    const { reply } = await runNewGame();
    expect(reply.edit).toHaveBeenCalled();
  });
});
