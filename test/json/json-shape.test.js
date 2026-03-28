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

  const sortIds = (ids) => [...ids].sort();

  const masterIds = Object.keys(master);
  const statsIds = Object.keys(stats);
  const trackerIds = Object.keys(tracker);

  test('stats.json user ids match master.json user ids', () => {
    expect(sortIds(statsIds)).toEqual(sortIds(masterIds));
  });

  test('tracker.json user ids match master.json user ids', () => {
    expect(sortIds(trackerIds)).toEqual(sortIds(masterIds));
  });

  test('all files include the required core fields', () => {
    for (const userId of masterIds) {
      expect(typeof master[userId].name).toBe('string');
      expect(typeof master[userId].gbp).toBe('number');

      expect(typeof stats[userId].name).toBe('string');
      expect(typeof stats[userId].total_msgs).toBe('number');
      expect(typeof stats[userId].total_commands).toBe('number');

      expect(typeof tracker[userId].name).toBe('string');
    }
  });
});
