const guessGame = require('../../commands/guess_game');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');

assertBasicCommandModule(guessGame, 'gg');
