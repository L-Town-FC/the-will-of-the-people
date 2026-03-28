const { describe, expect, test } = require('@jest/globals');

function assertBasicCommandModule(commandModule, expectedName) {
  describe(`${expectedName} command module`, () => {
    test('exports the expected command shape', () => {
      expect(commandModule).toBeDefined();
      expect(commandModule.name).toBe(expectedName);
      expect(typeof commandModule.description).toBe('string');
      expect(typeof commandModule.execute).toBe('function');
    });
  });
}

module.exports = {
  assertBasicCommandModule,
};
