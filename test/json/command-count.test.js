const { describe, expect, test } = require('@jest/globals');
const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_COMMAND_COUNT = 29;

describe('Command registration', () => {
  test('help.json has correct number of commands', () => {
    const helpPath = path.join(__dirname, '..', '..', 'JSON/help.json');
    const helpData = JSON.parse(fs.readFileSync(helpPath, 'utf8'));
    const helpCommandCount = Object.keys(helpData).length;

    expect(helpCommandCount).toBe(EXPECTED_COMMAND_COUNT);
  });

  test('help.json command numbers are sequential', () => {
    const helpPath = path.join(__dirname, '..', '..', 'JSON/help.json');
    const helpData = JSON.parse(fs.readFileSync(helpPath, 'utf8'));
    const keys = Object.keys(helpData).map(k => parseInt(k)).sort((a, b) => a - b);

    for (let i = 0; i < keys.length; i++) {
      expect(keys[i]).toBe(i + 1);
    }
  });
});
