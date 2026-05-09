const { describe, expect, test } = require('@jest/globals');
const calculator = require('../../commands/=');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const { createMessage } = require('../helpers/createMessage');

assertBasicCommandModule(calculator, '=');

describe('= calculator execute', () => {
  const makeMsg = () => Object.assign(createMessage(), { author: { id: 'user1', bot: false } });
  const makeArgs = (a, op, b) => ['=', a, op, b];

  test('addition: 2 + 3 = 5', () => {
    const msg = makeMsg();
    calculator.execute(msg, makeArgs('2', '+', '3'));
    expect(msg.channel.send.calls).toEqual([[5]]);
  });

  test('subtraction: 10 - 4 = 6', () => {
    const msg = makeMsg();
    calculator.execute(msg, makeArgs('10', '-', '4'));
    expect(msg.channel.send.calls).toEqual([[6]]);
  });

  test('multiplication: 3 * 7 = 21', () => {
    const msg = makeMsg();
    calculator.execute(msg, makeArgs('3', '*', '7'));
    expect(msg.channel.send.calls).toEqual([[21]]);
  });

  test('division: 15 / 3 = 5', () => {
    const msg = makeMsg();
    calculator.execute(msg, makeArgs('15', '/', '3'));
    expect(msg.channel.send.calls).toEqual([[5]]);
  });

  test('exponentiation: 2 ^ 10 = 1024', () => {
    const msg = makeMsg();
    calculator.execute(msg, makeArgs('2', '^', '10'));
    expect(msg.channel.send.calls).toEqual([[1024]]);
  });

  test('does nothing for bot messages', () => {
    const msg = makeMsg();
    msg.author.bot = true;
    calculator.execute(msg, makeArgs('2', '+', '3'));
    expect(msg.channel.send.calls).toHaveLength(0);
  });

  test('sends error for non-numeric first arg', () => {
    const msg = makeMsg();
    calculator.execute(msg, makeArgs('abc', '+', '3'));
    expect(msg.channel.send.calls).toEqual([['!= [number] [operator] [number]. Operators are [+,-,*,/,^]']]);
  });

  test('sends error for non-numeric third arg', () => {
    const msg = makeMsg();
    calculator.execute(msg, makeArgs('2', '+', 'xyz'));
    expect(msg.channel.send.calls).toEqual([['You must choose two numbers']]);
  });

  test('sends error for invalid operator', () => {
    const msg = makeMsg();
    calculator.execute(msg, makeArgs('2', '%', '3'));
    expect(msg.channel.send.calls).toEqual([['You must use one of the following operators [+,-,*,/,^]']]);
  });
});
