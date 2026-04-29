const changelog = require('../../commands/changelog');
const { assertBasicCommandModule } = require('../helpers/assertBasicCommandModule');
const https = require('https');
const { execSync } = require('child_process');

// Mock modules
jest.mock('https', () => ({
    get: jest.fn()
}));

jest.mock('child_process', () => ({
    execSync: jest.fn()
}));

jest.mock('../../commands/Functions/embed_functions', () => ({
    emptyValue: 'emptyValue',
    EmbedCreator: jest.fn((message, title, description, fields) => ({
        title: title,
        description: description,
        fields: fields
    }))
}));

assertBasicCommandModule(changelog, 'changelog');

describe('changelog command', () => {
    var mockMessage;
    var mockSend;

    beforeEach(() => {
        mockSend = jest.fn();
        mockMessage = {
            channel: {
                send: mockSend
            }
        };
        jest.clearAllMocks();
    });

    test('should have name and description', () => {
        expect(changelog.name).toBe('changelog');
        expect(changelog.description).toBeDefined();
    });

    test('should fetch and display release notes', (done) => {
        var mockRelease = {
            tag_name: 'v2.4.11',
            body: '## Changes\n- Fix bug [@user](https://github.com/user), [abc1234](https://github.com/repo/commit/abc1234)',
            published_at: '2026-04-28T00:00:00Z'
        };

        var mockRes = {
            on: jest.fn((event, cb) => {
                if (event === 'data') cb(JSON.stringify(mockRelease));
                if (event === 'end') {
                    cb();
                    // Allow event loop to complete
                    setTimeout(() => {
                        try {
                            expect(mockSend).toHaveBeenCalled();
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }, 0);
                }
            })
        };

        https.get.mockImplementation((url, options, callback) => {
            var cb = typeof options === 'function' ? options : callback;
            cb(mockRes);
            return { on: jest.fn() };
        });

        execSync.mockReturnValue('https://github.com/L-Town-FC/the-will-of-the-people.git');

        changelog.execute(mockMessage);
    });

    test('should handle missing releases', (done) => {
        var mockRes = {
            on: jest.fn((event, cb) => {
                if (event === 'data') cb('{}');
                if (event === 'end') {
                    cb();
                    setTimeout(() => {
                        try {
                            expect(mockSend).toHaveBeenCalledWith('No releases found.');
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }, 0);
                }
            })
        };

        https.get.mockImplementation((url, options, callback) => {
            var cb = typeof options === 'function' ? options : callback;
            cb(mockRes);
            return { on: jest.fn() };
        });

        changelog.execute(mockMessage);
    });
});