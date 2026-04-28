const emojis = require('../../commands/emojis');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');

assertBasicCommandModule(emojis, 'emojis');

describe('emojis command', () => {
    describe('EmojiListSort', () => {
        test('sorts emojis by count descending', () => {
            const input = {
                'emoji1': { name: 'emoji1', count: 5 },
                'emoji2': { name: 'emoji2', count: 10 },
                'emoji3': { name: 'emoji3', count: 3 }
            };
            const sorted = emojis.EmojiListSort(input);
            expect(sorted[0][1].count).toBe(10);
            expect(sorted[1][1].count).toBe(5);
            expect(sorted[2][1].count).toBe(3);
        });
    });

    describe('UnusedEmojiList logic', () => {
        test('filters emojis with 0 count', () => {
            const emojiListArray = [
                ['id1', { name: 'emoji1', count: 0 }],
                ['id2', { name: 'emoji2', count: 5 }],
                ['id3', { name: 'emoji3', count: 0 }],
                ['id4', { name: 'emoji4', count: 10 }]
            ];

            const unused = [];
            for (var i = emojiListArray.length - 1; i >= 0; i--) {
                if (emojiListArray[i][1].count === 0) {
                    unused.push(emojiListArray[i]);
                }
            }

            expect(unused.length).toBe(2);
            expect(unused[0][1].name).toBe('emoji3');
            expect(unused[1][1].name).toBe('emoji1');
        });
    });
});
