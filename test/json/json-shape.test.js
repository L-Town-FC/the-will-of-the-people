const { describe, expect, test } = require('@jest/globals');
const fs = require('node:fs');
const path = require('node:path');

function readJson(relativePath) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '..', relativePath), 'utf8')
  );
}

describe('JSON shape consistency', () => {
  const master = readJson('JSON/master.json');
  const stats = readJson('JSON/stats.json');
  const tracker = readJson('JSON/tracker.json');

  const masterIds = Object.keys(master);
  const statsIds = Object.keys(stats);
  const trackerIds = Object.keys(tracker);

  const realMasterIds = masterIds.filter((id) => id !== '940313859867172885');

  test('master.json real user ids are in stats.json', () => {
    for (const userId of realMasterIds) {
      expect(statsIds).toContain(userId);
    }
  });

  test('master.json real user ids are in tracker.json', () => {
    for (const userId of realMasterIds) {
      expect(trackerIds).toContain(userId);
    }
  });

  test('master.json includes required core fields for all users', () => {
    for (const userId of masterIds) {
      expect(typeof master[userId].name).toBe('string');
      expect(typeof master[userId].gbp).toBe('number');
      expect(typeof master[userId].achievements).toBe('object');
      expect(typeof master[userId].insulted).toBe('boolean');
      expect(typeof master[userId].steal).toBe('object');
    }
  });

  test('stats.json includes required core fields for master users', () => {
    for (const userId of masterIds) {
      if (stats[userId]) {
        expect(typeof stats[userId].name).toBe('string');
        expect(typeof stats[userId].total_msgs).toBe('number');
        expect(typeof stats[userId].total_commands).toBe('number');
      }
    }
  });

  test('tracker.json includes required core fields for master users', () => {
    for (const userId of masterIds) {
      if (tracker[userId]) {
        expect(typeof tracker[userId].name).toBe('string');
      }
    }
  });
});
