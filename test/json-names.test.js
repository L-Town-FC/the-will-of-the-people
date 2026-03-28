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

describe('JSON name roster', () => {
  test.each(Object.entries(expectedByFile))(
    '%s matches the approved roster',
    (relativePath, expected) => {
      const filePath = path.join(__dirname, '..', relativePath);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const actualNames = Object.values(data)
        .map((entry) => entry.name)
        .sort();

      expect(actualNames).toEqual([...expected].sort());
    }
  );
});
