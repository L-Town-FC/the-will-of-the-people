const { describe, expect, test } = require('@jest/globals');
const fs = require('fs');
const insultsCounter = require('../../commands/insults_counter');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

assertBasicCommandModule(insultsCounter, 'insults_counter');

function createMaster(insultedCount) {
  const master = {};
  for (let i = 0; i < insultedCount; i++) {
    master[`user${i + 1}`] = { name: `User${i + 1}`, insulted: true };
  }
  return master;
}

describe('insults_counter execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('ignores bot messages', () => {
    const message = createMessage();
    message.author = { id: 'user1', bot: true };
    message.content = 'hello';

    insultsCounter.execute(message, createMaster(4), {}, { value: 5 });

    expect(message.channel.send.calls).toHaveLength(0);
  });

  test('ignores command messages', () => {
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.content = '!ping';

    insultsCounter.execute(message, createMaster(4), {}, { value: 5 });

    expect(message.channel.send.calls).toHaveLength(0);
  });

  test('does nothing for users who are not being insulted', () => {
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.content = 'hello';

    insultsCounter.execute(message, { user1: { name: 'Alice' } }, {}, { value: 5 });

    expect(message.channel.send.calls).toHaveLength(0);
  });

  test('increments the cooldown counter without insulting', () => {
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.content = 'hello';
    const since = { value: 2 };

    insultsCounter.execute(message, createMaster(4), {}, since);

    expect(since.value).toBe(3);
    expect(message.channel.send.calls).toHaveLength(0);
  });

  test('sends a text insult when the chance check hits', () => {
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.content = 'hello';
    const since = { value: 5 };
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.7).mockReturnValueOnce(0);

    insultsCounter.execute(message, createMaster(4), { user1: { total_msgs: 42 } }, since);

    expect(since.value).toBe(0);
    expect(message.channel.send.calls[0]).toEqual(['Fuck You']);
  });

  test('sends an insult picture when the selected entry is numeric', () => {
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.content = 'hello';
    const since = { value: 5 };
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.7).mockReturnValueOnce(0.46);
    jest.spyOn(fs, 'readdirSync').mockReturnValue(['a.png', 'b.png']);

    insultsCounter.execute(message, createMaster(4), { user1: { total_msgs: 42 } }, since);

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0][0].files).toHaveLength(1);
  });

  test('does not insult when only a few users are being insulted', () => {
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.content = 'hello';
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    insultsCounter.execute(message, createMaster(1), {}, { value: 5 });

    expect(message.channel.send.calls).toHaveLength(0);
  });

  test('counts only users who are actively being insulted', () => {
    const message = createMessage();
    message.author = { id: 'user1', bot: false };
    message.content = 'hello';
    const master = createMaster(1);
    master.user9 = { name: 'Innocent', insulted: false };
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    insultsCounter.execute(message, master, {}, { value: 5 });

    expect(message.channel.send.calls).toHaveLength(0);
  });
});
