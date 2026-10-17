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

    test('truncates release notes longer than the embed limit', (done) => {
        var longBody = 'a'.repeat(2000);
        var mockRelease = {
            tag_name: 'v2.4.12',
            body: longBody,
            published_at: '2026-04-28T00:00:00Z'
        };

        var mockRes = {
            on: jest.fn((event, cb) => {
                if (event === 'data') cb(JSON.stringify(mockRelease));
                if (event === 'end') {
                    cb();
                    setTimeout(() => {
                        try {
                            expect(mockSend).toHaveBeenCalled();
                            var field = mockSend.mock.calls[0][0].embeds[0].fields;
                            expect(field.value.length).toBe(1024);
                            expect(field.value.endsWith('...')).toBe(true);
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

    test('handles malformed release JSON', (done) => {
        var mockRes = {
            on: jest.fn((event, cb) => {
                if (event === 'data') cb('not valid json');
                if (event === 'end') {
                    cb();
                    setTimeout(() => {
                        try {
                            expect(mockSend).toHaveBeenCalledWith('Error parsing release data.');
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

    test('handles a network error from the releases API', () => {
        https.get.mockImplementation(() => ({
            on: jest.fn((event, cb) => {
                if (event === 'error') cb(new Error('network down'));
            })
        }));

        changelog.execute(mockMessage);

        expect(mockSend).toHaveBeenCalledWith('Error fetching changelog.');
    });

    test('handles an unexpected top-level error', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        https.get.mockImplementation(() => {
            throw new Error('boom');
        });

        changelog.execute(mockMessage);

        expect(consoleSpy).toHaveBeenCalled();
        expect(mockSend).toHaveBeenCalledWith('Error occurred in changelog.js');

        consoleSpy.mockRestore();
    });

    test('falls back to the default repo when the remote is not a github URL', (done) => {
        var mockRelease = { tag_name: 'v2.4.13', body: 'notes', published_at: '2026-04-28T00:00:00Z' };
        var mockRes = {
            on: jest.fn((event, cb) => {
                if (event === 'data') cb(JSON.stringify(mockRelease));
                if (event === 'end') {
                    cb();
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
        execSync.mockReturnValue('ssh://git@example.com/whatever.git');

        changelog.execute(mockMessage);
    });

    test('falls back to the default repo when git remote lookup fails', (done) => {
        var mockRelease = { tag_name: 'v2.4.14', body: 'notes', published_at: '2026-04-28T00:00:00Z' };
        var mockRes = {
            on: jest.fn((event, cb) => {
                if (event === 'data') cb(JSON.stringify(mockRelease));
                if (event === 'end') {
                    cb();
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
        execSync.mockImplementation(() => {
            throw new Error('no git');
        });

        changelog.execute(mockMessage);
    });

    test('shows a placeholder when the release has no body', (done) => {
        var mockRelease = { tag_name: 'v2.4.15', body: null, published_at: '2026-04-28T00:00:00Z' };
        var mockRes = {
            on: jest.fn((event, cb) => {
                if (event === 'data') cb(JSON.stringify(mockRelease));
                if (event === 'end') {
                    cb();
                    setTimeout(() => {
                        try {
                            var field = mockSend.mock.calls[0][0].embeds[0].fields;
                            expect(field.value).toBe('No changelog available.');
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
});