const { describe, expect, test } = require('@jest/globals');
const msgcount = require('../commands/msgcount');
const { createMessage } = require('./helpers/createMessage');

describe('msgcount command', () => {
  const statsList = {
    user1: { name: 'Wyatt', total_msgs: 10 },
    user2: { name: 'Ian', total_msgs: 25 },
    user3: { name: 'Andrew', total_msgs: 15 },
    user4: { name: 'Mike', total_msgs: 5 },
  };
  test('defaults to the top-3 leaderboard output', () => {
    const message = createMessage();

    msgcount.execute(message, ['!msgcount'], statsList);

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual([
      "```\nMessage Count Leaderboard (Top 3):\n\n1. Ian: 25\n2. Andrew: 15\n3. Wyatt: 10\n```"
    ]);
  });

  test('shows all users when passed the all argument', () => {
    const message = createMessage();

    msgcount.execute(message, ['!msgcount', 'all'], statsList);

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual([
      "```\nMessage Count (All users):\n\n1. Ian: 25\n2. Andrew: 15\n3. Wyatt: 10\n4. Mike: 5\n```"
    ]);
  });

  test('shows usage help for an unsupported subcommand', () => {
    const message = createMessage();

    msgcount.execute(message, ['!msgcount', 'weird'], statsList);

    expect(message.channel.send.calls).toHaveLength(1);
    expect(message.channel.send.calls[0]).toEqual([
      'Usage: `!msgcount leaderboard` or `!msgcount all`',
    ]);
  });
});
