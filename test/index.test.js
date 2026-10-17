const { describe, expect, test, beforeEach, afterEach } = require('@jest/globals');

const clientInstances = [];

jest.mock('discord.js', () => {
  class Collection extends Map {}
  class Client {
    constructor() {
      this.commands = new Collection();
      this.handlers = {};
      this.channels = { cache: { find: jest.fn(() => ({ send: jest.fn() })) } };
      this.guilds = { cache: { first: () => ({ members: { fetch: jest.fn(async () => []) } }) } };
      this.emojis = { cache: { forEach: jest.fn(), find: jest.fn(() => undefined) } };
      this.users = { cache: { find: jest.fn(() => ({ send: jest.fn() })) } };
      clientInstances.push(this);
    }
    on(event, handler) {
      if (!this.handlers[event]) {
        this.handlers[event] = [];
      }
      this.handlers[event].push(handler);
      return this;
    }
    login() {
      return Promise.resolve();
    }
  }
  Client.instances = clientInstances;
  return {
    Client,
    Collection,
    GatewayIntentBits: {},
    Partials: {},
    EmbedBuilder: class {},
    ButtonBuilder: class {},
    ButtonStyle: {},
    ActionRowBuilder: class {},
    ComponentType: {},
    AttachmentBuilder: class {},
  };
});

jest.mock('cron', () => ({
  CronJob: jest.fn(function (expr, callback) {
    this.expr = expr;
    this.callback = callback;
    return this;
  }),
}));

jest.mock('dotenv', () => ({ config: jest.fn() }));

jest.mock('../commands/Functions/stats_functions', () => ({ tracker: jest.fn() }));
jest.mock('../commands/Functions/embed_functions', () => ({
  emptyValue: 'emptyValue',
  EmbedCreator: jest.fn(() => ({ data: {} })),
}));
jest.mock('../commands/Functions/Achievement_Functions', () => ({
  tracker1: jest.fn(),
  tracker2: jest.fn(),
  tracker3: jest.fn(),
  unlock: jest.fn(),
  index_unlock: jest.fn(),
  reset1: jest.fn(),
}));
jest.mock('../commands/Functions/GeneralFunctions', () => ({
  CommandPurchase: jest.fn(),
  defaultRecipient: 'bot',
  invalid: 'invalid',
  NameToUserID: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(() => []),
  readFileSync: jest.fn(() => '{}'),
  writeFileSync: jest.fn(),
}));

const fs = require('fs');
const cron = require('cron');
const stats = require('../commands/Functions/stats_functions');
const unlock = require('../commands/Functions/Achievement_Functions');

const MASTER_JSON = JSON.stringify({
  userX: { name: 'X', gbp: 1000, achievements: [], steal: { insurance: 0, attempts: 0, caught: false } },
  richUser: { name: 'Rich', gbp: -50, achievements: [], steal: { insurance: 2, attempts: 3, caught: true } },
  nanUser: { name: 'Nan', gbp: 'abc', achievements: [], steal: { insurance: 0, attempts: 0, caught: false } },
  lowUser: { name: 'Low', gbp: 100, achievements: [], steal: { insurance: 0, attempts: 0, caught: false } },
});
const STATS_JSON = JSON.stringify({
  userX: { name: 'X', roulette_bets: 0, roulette_wins: 0, button_presses: 0, button_losses: 0 },
});
const COMMAND_STATS_JSON = JSON.stringify({
  button: { Total_Losses: 0, Last_loss: 0, Total_Presses: 0 },
  powerball: { tickets: 0, pot: 10000 },
});
const EMOJIS_JSON = JSON.stringify({
  keep: { name: 'K', count: 0 },
  gone: { name: 'G', count: 3 },
  e1: { name: 'E1', count: 0 },
});

function primeReads() {
  fs.readFileSync.mockImplementation((path) => {
    const p = String(path);
    if (p.includes('master.json')) return MASTER_JSON;
    if (p.includes('command_stats.json')) return COMMAND_STATS_JSON;
    if (p.includes('stats.json')) return STATS_JSON;
    if (p.includes('delete_tracker.json')) return '{"a":{"deletes":5}}';
    if (p.includes('tracker.json')) return '{}';
    if (p.includes('emojis.json')) return EMOJIS_JSON;
    if (p.includes('roulette_bets')) return 'red,black,even,odd';
    return '{}';
  });
}

require('../index');

const bot = clientInstances[0];

beforeEach(() => {
  fs.existsSync.mockReset().mockReturnValue(true);
  fs.mkdirSync.mockReset().mockReturnValue(undefined);
  fs.readdirSync.mockReset().mockReturnValue([]);
  fs.readFileSync.mockReset().mockReturnValue('{}');
  fs.writeFileSync.mockReset().mockReturnValue(undefined);
});

function createMessage(content, options = {}) {
  const send = jest.fn();
  return {
    author: { id: options.id || 'userX', bot: options.bot || false },
    channel: { id: options.channelId || 'chan1', send },
    content,
    reply: jest.fn(() => ({
      id: 'm1',
      edit: jest.fn(),
      createMessageComponentCollector: jest.fn(() => ({ on: jest.fn() })),
    })),
    member: null,
  };
}

describe('index.js', () => {
  beforeEach(() => {
    primeReads();
    fs.mkdirSync.mockReset();
    fs.writeFileSync.mockReset();
    fs.readdirSync.mockReturnValue([]);
    cron.CronJob.mockClear();
    stats.tracker.mockReset();
    unlock.tracker1.mockReset();
    unlock.unlock.mockReset();
    unlock.index_unlock.mockReset();
    bot.commands.get = jest.fn(() => ({ execute: jest.fn() }));
    bot.channels.cache.find = jest.fn(() => ({ send: jest.fn() }));
    bot.guilds.cache.first = () => ({ members: { fetch: jest.fn(async () => []) } });
    bot.emojis.cache.forEach = jest.fn();
    bot.emojis.cache.find = jest.fn(() => undefined);
  });

  afterEach(async () => {
    jest.useRealTimers();
    fs.writeFileSync.mockReset().mockReturnValue(undefined);
    fs.readFileSync.mockReset().mockReturnValue('{}');
    await new Promise((resolve) => setImmediate(resolve));
    jest.restoreAllMocks();
  });

  const getHandler = (event) => bot.handlers[event][0];

  test('reports being online on ready', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    getHandler('ready')();

    expect(logSpy).toHaveBeenCalledWith('This bot is online');
    expect(cron.CronJob).toHaveBeenCalled();
  });

  test('tracks messages from real users', () => {
    getHandler('ready')();
    const message = createMessage('hello');

    getHandler('messageCreate')(message);

    expect(bot.commands.get).toHaveBeenCalledWith('more_money');
    expect(bot.commands.get).toHaveBeenCalledWith('insults_counter');
    expect(bot.commands.get).toHaveBeenCalledWith('boo_trigger');
    expect(stats.tracker).toHaveBeenCalled();
  });

  test('ignores messages from bots', () => {
    getHandler('ready')();
    const message = createMessage('hello', { bot: true });

    getHandler('messageCreate')(message);

    expect(bot.commands.get).not.toHaveBeenCalled();
  });

  test('sends an error message when message parsing fails', () => {
    getHandler('ready')();
    bot.commands.get.mockImplementationOnce(() => ({
      execute: () => {
        throw new Error('boom');
      },
    }));
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const message = createMessage('hello');

    getHandler('messageCreate')(message);

    expect(message.channel.send).toHaveBeenCalledWith('Error occurred in message parser');
    expect(logSpy).toHaveBeenCalled();
  });

  test.each([
    ['!21 20', '21'],
    ['!achievements', 'achievements'],
    ['!bank', 'bank'],
    ['!boo', 'boo'],
    ['!button', 'button'],
    ['!changelog', 'changelog'],
    ['!changename X', 'changename'],
    ['!council', 'council'],
    ['!logs', 'logs'],
    ['!l', 'logs'],
    ['!info', 'info'],
    ['!status', 'info'],
    ['!botinfo', 'info'],
    ['!delete 1', 'delete'],
    ['!emojis', 'emojis'],
    ['!flip', 'flip'],
    ['!gg 10', 'gg'],
    ['!help', 'help'],
    ['!insults', 'insults'],
    ['!kumiko', 'kumiko'],
    ['!kumikosays hi', 'kumikosays'],
    ['!msg X hi', 'msg'],
    ['!msgcount', 'msgcount'],
    ['!names', 'names'],
    ['!ping', 'ping'],
    ['!powerball', 'powerball'],
    ['!pug', 'pug'],
    ['!roles', 'roles'],
    ['!roulette', 'roulette'],
    ['!set X 5', 'set'],
    ['!stats', 'stats'],
    ['!steal X 25', 'steal'],
    ['!teams', 'teams'],
    ['!transfer X 5', 'transfer'],
    ['!uptime', 'uptime'],
    ['!version', 'version'],
    ['!= 1 + 1', '='],
  ])('routes %s to the %s command', (content, commandName) => {
    getHandler('ready')();
    const message = createMessage(content);
    const routingHandler = bot.handlers.messageCreate[1];

    routingHandler(message);

    expect(bot.commands.get).toHaveBeenCalledWith(commandName);
  });

  test('ignores the test command', () => {
    getHandler('ready')();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const message = createMessage('!test');
    const routingHandler = bot.handlers.messageCreate[1];

    routingHandler(message);

    expect(bot.commands.get).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Dont worry about it');
  });

  test('sends a hint for unknown commands', () => {
    getHandler('ready')();
    const message = createMessage('!nonsense');
    const routingHandler = bot.handlers.messageCreate[1];

    routingHandler(message);

    expect(message.channel.send).toHaveBeenCalledWith('Use command !help for a list of commands');
  });

  test('lets the owner pull database values', () => {
    getHandler('ready')();
    const message = createMessage('!pull', { id: '450001712305143869' });
    const routingHandler = bot.handlers.messageCreate[1];

    routingHandler(message);

    expect(message.channel.send).toHaveBeenCalledWith(
      'Bot values have been updated with current Database values'
    );
  });

  test('lets the owner push database values', () => {
    getHandler('ready')();
    const message = createMessage('!push', { id: '450001712305143869' });
    const routingHandler = bot.handlers.messageCreate[1];

    routingHandler(message);

    expect(message.channel.send).toHaveBeenCalledWith('Database has been updated with current values');
  });

  test('sends an error message when command handling fails', () => {
    getHandler('ready')();
    stats.tracker.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const message = createMessage('!help');
    const routingHandler = bot.handlers.messageCreate[1];

    routingHandler(message);

    expect(message.channel.send).toHaveBeenCalledWith('Error Occured in Index.js Comand Handler');
    expect(logSpy).toHaveBeenCalled();
  });

  test('handles a new member joining', () => {
    getHandler('ready')();

    getHandler('guildMemberAdd')({ id: 'userX' });

    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('announces when a member leaves', () => {
    getHandler('ready')();
    const channel = { send: jest.fn() };
    bot.channels.cache.find = jest.fn(() => channel);

    getHandler('guildMemberRemove')({ id: 'userX' });

    expect(channel.send).toHaveBeenCalledWith('X has left the server');
  });

  test('logs an error when removing an unknown member fails', () => {
    getHandler('ready')();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    getHandler('guildMemberRemove')({ id: 'ghost' });

    expect(logSpy).toHaveBeenCalledWith('Error occured in user remover log');
  });

  const keepAllMembers = () =>
    (bot.guilds.cache.first = () => ({
      members: {
        fetch: jest.fn(async () =>
          ['userX', 'richUser', 'nanUser', 'lowUser'].map((id) => ({ id, user: { bot: false } }))
        ),
      },
    }));

  test('runs the daily cron functions', async () => {
    const channel = { send: jest.fn() };
    bot.channels.cache.find = jest.fn(() => channel);
    keepAllMembers();
    getHandler('ready')();
    const daily = cron.CronJob.mock.calls.find((c) => c[0] === '0 9 * * *');
    jest.spyOn(Math, 'random').mockReturnValue(0);

    daily[1]();
    await new Promise((resolve) => setImmediate(resolve));

    expect(channel.send).toHaveBeenCalledWith('Welfare has been distributed');
    expect(channel.send).toHaveBeenCalledWith(
      'Congratulations! X won the Daily lottery of 1000 gbp'
    );
  });

  test('reports no lottery winners', async () => {
    const channel = { send: jest.fn() };
    bot.channels.cache.find = jest.fn(() => channel);
    keepAllMembers();
    getHandler('ready')();
    const daily = cron.CronJob.mock.calls.find((c) => c[0] === '0 9 * * *');
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValue(0);

    daily[1]();
    await new Promise((resolve) => setImmediate(resolve));

    expect(channel.send).toHaveBeenCalledWith('No winners');
  });

  test('reports an error when welfare distribution fails', async () => {
    const send = jest.fn((msg) => {
      if (msg === 'Welfare has been distributed') {
        throw new Error('boom');
      }
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    bot.channels.cache.find = jest.fn(() => ({ send }));
    keepAllMembers();
    getHandler('ready')();
    const daily = cron.CronJob.mock.calls.find((c) => c[0] === '0 9 * * *');
    jest.spyOn(Math, 'random').mockReturnValue(0);

    daily[1]();
    await new Promise((resolve) => setImmediate(resolve));

    expect(send).toHaveBeenCalledWith('Error Occured in Welfare');
    expect(logSpy).toHaveBeenCalled();
  });

  test('resets gbp farm data daily', async () => {
    const channel = { send: jest.fn() };
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    bot.channels.cache.find = jest.fn(() => channel);
    keepAllMembers();
    getHandler('ready')();
    await new Promise((resolve) => setImmediate(resolve));
    const daily = cron.CronJob.mock.calls.find((c) => c[0] === '0 9 * * *');
    fs.writeFileSync.mockImplementation((path, data, cb) => {
      if (typeof cb === 'function') cb(null);
    });

    daily[1]();
    await new Promise((resolve) => setImmediate(resolve));

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './JSON/delete_tracker.json',
      expect.any(String),
      expect.any(Function)
    );
    expect(logSpy).toHaveBeenCalledWith('complete');
  });

  test('records an error when the gbp farm reset write fails', async () => {
    const channel = { send: jest.fn() };
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    bot.channels.cache.find = jest.fn(() => channel);
    keepAllMembers();
    getHandler('ready')();
    await new Promise((resolve) => setImmediate(resolve));
    const daily = cron.CronJob.mock.calls.find((c) => c[0] === '0 9 * * *');
    fs.writeFileSync.mockImplementation((path, data, cb) => {
      if (typeof cb === 'function') cb(new Error('write failed'));
    });

    daily[1]();
    await new Promise((resolve) => setImmediate(resolve));

    expect(channel.send).toHaveBeenCalledWith('Error occurred in gbp_farm_reset');
    expect(logSpy).toHaveBeenCalledWith(expect.anything());
  });

  test('runs the hourly cron overwrite', () => {
    jest.useFakeTimers();
    getHandler('ready')();
    const hourly = cron.CronJob.mock.calls.find((c) => c[0] === '0 * * * *');

    hourly[1]();
    jest.advanceTimersByTime(2000);

    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('logs an error when the hourly overwrite fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getHandler('ready')();
    await new Promise((resolve) => setImmediate(resolve));
    jest.useFakeTimers();
    const hourly = cron.CronJob.mock.calls.find((c) => c[0] === '0 * * * *');
    fs.writeFileSync.mockImplementation(() => {
      throw new Error('write failed');
    });

    hourly[1]();
    jest.advanceTimersByTime(2000);

    expect(errorSpy).toHaveBeenCalledWith('Error writing JSON files:', expect.anything());
  });

  test('handles reactions being added and removed', () => {
    getHandler('ready')();
    const reaction = { _emoji: { id: 'e-missing' }, users: { cache: { size: 0 } } };

    expect(() => getHandler('messageReactionAdd')(reaction)).not.toThrow();
    expect(() => getHandler('messageReactionRemove')(reaction)).not.toThrow();
  });

  test('counts reactions for tracked emojis', () => {
    bot.emojis.cache.find = jest.fn((id) => (id === 'gone' ? undefined : { id }));
    getHandler('ready')();

    expect(() =>
      getHandler('messageReactionAdd')({ _emoji: { id: 'e1' }, users: { cache: { size: 0 } } })
    ).not.toThrow();
    expect(() =>
      getHandler('messageReactionRemove')({ _emoji: { id: 'e1' }, users: { cache: { size: 0 } } })
    ).not.toThrow();
    expect(() =>
      getHandler('messageReactionAdd')({
        _emoji: { id: 'e1' },
        users: { cache: { size: 1, first: () => ({ bot: true }) } },
      })
    ).not.toThrow();
    expect(() =>
      getHandler('messageReactionAdd')({
        _emoji: { id: 'e1' },
        users: { cache: { size: 1, first: () => ({ bot: false }) } },
      })
    ).not.toThrow();
  });

  test('logs errors from reaction handlers', () => {
    getHandler('ready')();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    getHandler('messageReactionAdd')({ _emoji: null });
    getHandler('messageReactionRemove')({ _emoji: null });

    expect(logSpy).toHaveBeenCalledWith(expect.anything());
  });

  test('handles emoji creation and deletion', () => {
    bot.emojis.cache.forEach = jest.fn((cb) => cb({ id: 'brandNew', name: 'Brand New' }));
    getHandler('ready')();

    expect(() => getHandler('emojiCreate')({ id: 'new' })).not.toThrow();
    expect(() => getHandler('emojiDelete')({ id: 'gone' })).not.toThrow();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('logs errors when emoji lists fail to write', async () => {
    getHandler('ready')();
    await new Promise((resolve) => setImmediate(resolve));
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {
      throw new Error('disk full');
    });

    getHandler('emojiCreate')({ id: 'new' });
    getHandler('emojiDelete')({ id: 'gone' });

    expect(logSpy).toHaveBeenCalled();
  });

  test('ignores unrelated interactions', () => {
    getHandler('ready')();
    const interaction = { customId: 'other', user: { id: 'userX' } };

    expect(() => getHandler('interactionCreate')(interaction)).not.toThrow();
  });

  test('reports button interaction errors', () => {
    getHandler('ready')();
    const send = jest.fn();
    const interaction = { customId: 'button', user: null, message: { channel: { send } } };

    getHandler('interactionCreate')(interaction);

    expect(send).toHaveBeenCalledWith('Error occurred with button interaction');
  });

  test('handles shard and client errors', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    getHandler('shardError')(new Error('shard'));
    getHandler('error')(new Error('client'));

    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  test('adds new members and skips bots during user list update', async () => {
    const members = [
      { id: 'newbie', user: { bot: false } },
      { id: 'somebot', user: { bot: true } },
    ];
    bot.guilds.cache.first = () => ({ members: { fetch: jest.fn(async () => members) } });

    getHandler('ready')();
    await new Promise((resolve) => setImmediate(resolve));

    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('returns empty object when a JSON file is missing', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    fs.readFileSync.mockImplementation((path) => {
      if (String(path).includes('master.json')) {
        const err = new Error('missing');
        err.code = 'ENOENT';
        throw err;
      }
      return '{}';
    });

    expect(() => getHandler('ready')()).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });

  test('rethrows unexpected JSON read errors', () => {
    fs.readFileSync.mockImplementation(() => {
      const err = new Error('denied');
      err.code = 'EACCES';
      throw err;
    });

    expect(() => getHandler('ready')()).toThrow('denied');
  });

  describe('roulette bets', () => {
    let betsOpen;
    let approvedBets;

    function primeRoulette() {
      const rouletteExec = jest.fn();
      bot.commands.get = jest.fn((name) =>
        name === 'roulette' ? { execute: rouletteExec } : { execute: jest.fn() }
      );
      getHandler('ready')();
      bot.handlers.messageCreate[1](createMessage('!roulette'));
      betsOpen = rouletteExec.mock.calls[0][5];
      approvedBets = rouletteExec.mock.calls[0][6];
      betsOpen.value = true;
      approvedBets.value = [];
    }

    afterEach(() => {
      if (betsOpen) betsOpen.value = false;
    });

    test('accepts a numeric bet in the roulette channel', () => {
      primeRoulette();
      const message = createMessage('10 red', { channelId: '712755269863473252' });

      bot.handlers.messageCreate[0](message);

      expect(message.channel.send).toHaveBeenCalledWith('X Bet accepted');
      expect(approvedBets.value.length).toBe(1);
    });

    test('unlocks bet it all on black when risking the whole balance', () => {
      primeRoulette();
      const message = createMessage('1000 black', { channelId: '712755269863473252' });

      bot.handlers.messageCreate[0](message);

      expect(unlock.unlock).toHaveBeenCalledWith('userX', 38, message, expect.anything());
    });

    test('rejects a numeric bet the player cannot afford', () => {
      primeRoulette();
      const message = createMessage('5000 red', { channelId: '712755269863473252' });

      bot.handlers.messageCreate[0](message);

      expect(message.channel.send).toHaveBeenCalledWith(
        "X doesn't have enough gbp for that bet"
      );
    });

    test('ignores an unrecognised numeric bet type', () => {
      primeRoulette();
      const message = createMessage('10 purple', { channelId: '712755269863473252' });

      bot.handlers.messageCreate[0](message);

      expect(message.channel.send).not.toHaveBeenCalledWith('X Bet accepted');
      expect(approvedBets.value.length).toBe(0);
    });

    test('accepts an "all" bet and unlocks black', () => {
      primeRoulette();
      const message = createMessage('all black', { channelId: '712755269863473252' });

      bot.handlers.messageCreate[0](message);

      expect(message.channel.send).toHaveBeenCalledWith('X Bet accepted');
      expect(unlock.unlock).toHaveBeenCalledWith('userX', 38, message, expect.anything());
    });

    test('ignores non-bet chatter in the roulette channel', () => {
      primeRoulette();
      const message = createMessage('hello red', { channelId: '712755269863473252' });

      bot.handlers.messageCreate[0](message);

      expect(approvedBets.value.length).toBe(0);
    });

    test('reports an error when the bet cannot be recorded', () => {
      primeRoulette();
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const message = createMessage('10 red', {
        id: 'lowUser',
        channelId: '712755269863473252',
      });

      bot.handlers.messageCreate[0](message);

      expect(message.channel.send).toHaveBeenCalledWith('Error Occured in Roulette_bets.js');
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('button interactions', () => {
    let buttonJSON;

    function primeButton() {
      const buttonExec = jest.fn();
      bot.commands.get = jest.fn((name) =>
        name === 'button' ? { execute: buttonExec } : { execute: jest.fn() }
      );
      getHandler('ready')();
      bot.handlers.messageCreate[1](createMessage('!button', { id: 'userX' }));
      buttonJSON = buttonExec.mock.calls[0][3];
      Object.keys(buttonJSON).forEach((key) => delete buttonJSON[key]);
    }

    function primeSession(buttonJSON) {
      buttonJSON.userX = {
        currentMessageID: 'msg1',
        currentSessionAmount: 0,
        currentSessionPresses: 0,
      };
    }

    test('pays out a winning button press', () => {
      primeButton();
      primeSession(buttonJSON);
      jest.spyOn(Math, 'random').mockReturnValue(0.0);
      const interaction = {
        customId: 'button',
        user: { id: 'userX' },
        message: { id: 'msg1' },
        update: jest.fn(),
      };

      getHandler('interactionCreate')(interaction);

      expect(interaction.update).toHaveBeenCalled();
      expect(buttonJSON.userX.currentSessionAmount).toBe(100);
      expect(buttonJSON.userX.currentSessionPresses).toBe(1);
    });

    test('records a losing button press', () => {
      primeButton();
      primeSession(buttonJSON);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const interaction = {
        customId: 'button',
        user: { id: 'userX' },
        message: { id: 'msg1' },
        update: jest.fn(),
      };

      getHandler('interactionCreate')(interaction);

      expect(buttonJSON.userX.currentSessionAmount).toBe(-1000);
    });

    test('pays out a winning big button press', () => {
      primeButton();
      primeSession(buttonJSON);
      jest.spyOn(Math, 'random').mockReturnValue(0.0);
      const interaction = {
        customId: 'bigButton',
        user: { id: 'userX' },
        message: { id: 'msg1' },
        update: jest.fn(),
      };

      getHandler('interactionCreate')(interaction);

      expect(buttonJSON.userX.currentSessionAmount).toBe(1000);
    });

    test('records a losing big button press', () => {
      primeButton();
      primeSession(buttonJSON);
      jest.spyOn(Math, 'random').mockReturnValue(0.7);
      const interaction = {
        customId: 'bigButton',
        user: { id: 'userX' },
        message: { id: 'msg1' },
        update: jest.fn(),
      };

      getHandler('interactionCreate')(interaction);

      expect(buttonJSON.userX.currentSessionAmount).toBe(-10000);
    });

    test('ignores interactions without an active button session', () => {
      primeButton();
      const interaction = {
        customId: 'button',
        user: { id: 'userX' },
        message: { id: 'msg1' },
        update: jest.fn(),
      };

      getHandler('interactionCreate')(interaction);

      expect(interaction.update).not.toHaveBeenCalled();
    });

    test('ignores interactions for a stale message id', () => {
      primeButton();
      primeSession(buttonJSON);
      buttonJSON.userX.currentMessageID = 'other';
      const interaction = {
        customId: 'button',
        user: { id: 'userX' },
        message: { id: 'msg1' },
        update: jest.fn(),
      };

      getHandler('interactionCreate')(interaction);

      expect(interaction.update).not.toHaveBeenCalled();
    });
  });
});

describe('index.js bootstrap', () => {
  test('creates the database directory when it is missing', () => {
    const originalPath = process.env.JSONPATH;
    process.env.JSONPATH = '/tmp/bot-db';
    fs.existsSync.mockReturnValue(false);
    fs.readdirSync.mockReturnValue([]);

    jest.isolateModules(() => {
      require('../index');
    });

    expect(fs.mkdirSync).toHaveBeenCalledWith('/tmp/bot-db');
    expect(fs.writeFileSync).toHaveBeenCalled();

    if (originalPath === undefined) {
      delete process.env.JSONPATH;
    } else {
      process.env.JSONPATH = originalPath;
    }
    fs.existsSync.mockReturnValue(true);
  });

  test('logs debug information when DEBUG is enabled', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    process.env.DEBUG = 'true';
    fs.readdirSync.mockReturnValue([]);

    jest.isolateModules(() => {
      require('../index');
    });

    const instance = clientInstances[clientInstances.length - 1];
    instance.commands.get = jest.fn(() => ({ execute: jest.fn() }));
    instance.handlers.ready[0]();
    instance.handlers.messageCreate[0](createMessage('hello'));
    instance.handlers.messageCreate[1](createMessage('!help'));

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Message from'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Processing command'));

    delete process.env.DEBUG;
  });
});
