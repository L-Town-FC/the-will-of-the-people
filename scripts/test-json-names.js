const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const expectedNames = [
  'Alex',
  'Andrew',
  'Ben',
  'Brian',
  'Carl',
  'Chrisvan',
  'Colin',
  'Dan',
  'Default',
  'Derek',
  'Dylan',
  'Hayden',
  'Ian',
  'Jack',
  'Jacob',
  'Justin',
  'Mike',
  'Ramzi',
  'Slim',
  'Teddy',
  'Wyatt',
  'Zaid',
];

const expectedByFile = {
  'JSON/master.json': expectedNames,
  'JSON/stats.json': expectedNames,
  'JSON/tracker.json': expectedNames,
};

for (const [relativePath, expected] of Object.entries(expectedByFile)) {
  const filePath = path.join(__dirname, '..', relativePath);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const actualNames = Object.values(data)
    .map((entry) => entry.name)
    .sort();

  assert.deepStrictEqual(
    actualNames,
    [...expected].sort(),
    `${relativePath} names did not match the approved roster`
  );
}

console.log('JSON name roster matches expected values.');
