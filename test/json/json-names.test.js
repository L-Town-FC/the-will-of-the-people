const { describe, expect, test } = require('@jest/globals');
const fs = require('node:fs');
const path = require('node:path');

const masterExpectedNames = [
  '940313859867172885',
  'Andrew',
  'Colin',
  'Ian',
  'Wyatt',
];

const expectedByFile = {
  'JSON/master.json': masterExpectedNames,
  'JSON/stats.json': [
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
  ],
  'JSON/tracker.json': [
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
  ],
};

describe('JSON name roster', () => {
  test.each(Object.entries(expectedByFile))(
    '%s matches the approved roster',
    (relativePath, expected) => {
      const filePath = path.join(__dirname, '..', '..', relativePath);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const actualNames = Object.values(data)
        .map((entry) => entry.name)
        .sort();

      expect(actualNames).toEqual([...expected].sort());
    }
  );
});
