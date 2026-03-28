const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readJson(relativePath) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8')
  );
}

const master = readJson('JSON/master.json');
const stats = readJson('JSON/stats.json');
const tracker = readJson('JSON/tracker.json');

const sortIds = (ids) => [...ids].sort();

const masterIds = Object.keys(master);
const statsIds = Object.keys(stats);
const trackerIds = Object.keys(tracker);

assert.deepStrictEqual(
  sortIds(statsIds),
  sortIds(masterIds),
  'stats.json user ids must match master.json user ids'
);

assert.deepStrictEqual(
  sortIds(trackerIds),
  sortIds(masterIds),
  'tracker.json user ids must match master.json user ids'
);

for (const userId of masterIds) {
  assert.equal(typeof master[userId].name, 'string', `master.json missing valid name for ${userId}`);
  assert.equal(typeof master[userId].gbp, 'number', `master.json missing valid gbp for ${userId}`);

  assert.equal(typeof stats[userId].name, 'string', `stats.json missing valid name for ${userId}`);
  assert.equal(typeof stats[userId].total_msgs, 'number', `stats.json missing total_msgs for ${userId}`);
  assert.equal(typeof stats[userId].total_commands, 'number', `stats.json missing total_commands for ${userId}`);

  assert.equal(typeof tracker[userId].name, 'string', `tracker.json missing valid name for ${userId}`);
}

console.log('JSON id sets and core fields are consistent.');
