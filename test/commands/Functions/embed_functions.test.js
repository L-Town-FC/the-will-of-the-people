const { describe, expect, test } = require('@jest/globals');
const { Color, EmbedCreator, emptyValue } = require('../../../commands/Functions/embed_functions');

jest.mock('discord.js', () => ({
  EmbedBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis(),
    setFields: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
  })),
}));

describe('Color', () => {
  test('returns 0 for bot authors', () => {
    const message = { author: { bot: true } };
    expect(Color(message)).toBe(0);
  });

  test('returns 0 when member is null', () => {
    const message = { author: { bot: false }, member: null };
    expect(Color(message)).toBe(0);
  });

  test('returns 0 when member has no color role', () => {
    const message = { author: { bot: false }, member: { roles: { color: null } } };
    expect(Color(message)).toBe(0);
  });

  test('returns the role color when member has a color role', () => {
    const message = { author: { bot: false }, member: { roles: { color: { color: 0x00ff00 } } } };
    expect(Color(message)).toBe(0x00ff00);
  });
});

describe('EmbedCreator', () => {
  test('creates embed with title, description, and single field object', () => {
    const message = { author: { bot: false }, member: { roles: { color: { color: 0 } } } };
    const embed = EmbedCreator(message, 'Test Title', 'Test Desc', { name: 'Field', value: 'Value' });

    expect(embed.setTitle).toHaveBeenCalledWith('Test Title');
    expect(embed.setDescription).toHaveBeenCalledWith('Test Desc');
    expect(embed.setFields).toHaveBeenCalledWith({ name: 'Field', value: 'Value' });
    expect(embed.setColor).toHaveBeenCalled();
  });

  test('omits title when emptyValue', () => {
    const embed = EmbedCreator({ author: { bot: false }, member: { roles: { color: { color: 0 } } } }, emptyValue, 'Desc', emptyValue);
    expect(embed.setTitle).not.toHaveBeenCalled();
  });

  test('joins description array into string', () => {
    const embed = EmbedCreator({ author: { bot: false }, member: { roles: { color: { color: 0 } } } }, 'Title', ['line1', 'line2'], emptyValue);
    expect(embed.setDescription).toHaveBeenCalledWith('line1\nline2\n');
  });

  test('adds multiple fields with string values', () => {
    const embed = EmbedCreator(
      { author: { bot: false }, member: { roles: { color: { color: 0 } } } },
      'Title', 'Desc',
      [{ name: 'A', value: '1' }, { name: 'B', value: '2' }],
    );
    expect(embed.addFields).toHaveBeenCalledTimes(2);
  });

  test('converts field value array to string when multiple fields', () => {
    const embed = EmbedCreator(
      { author: { bot: false }, member: { roles: { color: { color: 0 } } } },
      'Title', 'Desc',
      [{ name: 'A', value: ['a', 'b'] }, { name: 'B', value: 'c' }],
    );
    expect(embed.addFields).toHaveBeenCalledWith({ name: 'A', value: 'a\nb\n' });
    expect(embed.addFields).toHaveBeenCalledWith({ name: 'B', value: 'c' });
  });

  test('converts single-field value array to string', () => {
    const embed = EmbedCreator(
      { author: { bot: false }, member: { roles: { color: { color: 0 } } } },
      'Title', 'Desc',
      { name: 'List', value: ['x', 'y'] },
    );
    expect(embed.setFields).toHaveBeenCalledWith({ name: 'List', value: 'x\ny\n' });
  });
});
