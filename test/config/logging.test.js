const { describe, expect, test, beforeEach, afterEach } = require('@jest/globals');

describe('logging configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('DEBUG is true when NODE_ENV is local', () => {
    process.env.NODE_ENV = 'local';
    delete process.env.DEBUG;
    delete process.env.DEVBOTTOKEN;
    // Mock dependencies that might try to connect
    jest.mock('discord.js', () => {
      const actual = jest.requireActual('discord.js');
      return {
        ...actual,
        Client: jest.fn().mockImplementation(() => ({
          on: jest.fn(),
          login: jest.fn(),
          commands: new Map(),
          channels: { cache: { find: jest.fn() } }
        }))
      };
    });
    const index = require('../../index');
    expect(index.DEBUG).toBe(true);
  });

  test('DEBUG is true when DEBUG env var is true', () => {
    process.env.NODE_ENV = 'production';
    process.env.DEBUG = 'true';
    delete process.env.PRODBOTTOKEN;
    jest.mock('discord.js', () => {
      const actual = jest.requireActual('discord.js');
      return {
        ...actual,
        Client: jest.fn().mockImplementation(() => ({
          on: jest.fn(),
          login: jest.fn(),
          commands: new Map(),
          channels: { cache: { find: jest.fn() } }
        }))
      };
    });
    const index = require('../../index');
    expect(index.DEBUG).toBe(true);
  });

  test('DEBUG is false by default in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DEBUG;
    delete process.env.PRODBOTTOKEN;
    jest.mock('discord.js', () => {
      const actual = jest.requireActual('discord.js');
      return {
        ...actual,
        Client: jest.fn().mockImplementation(() => ({
          on: jest.fn(),
          login: jest.fn(),
          commands: new Map(),
          channels: { cache: { find: jest.fn() } }
        }))
      };
    });
    const index = require('../../index');
    expect(index.DEBUG).toBe(false);
  });

  test('DEBUG is false when DEBUG is not "true"', () => {
    process.env.NODE_ENV = 'production';
    process.env.DEBUG = 'false';
    delete process.env.PRODBOTTOKEN;
    jest.mock('discord.js', () => {
      const actual = jest.requireActual('discord.js');
      return {
        ...actual,
        Client: jest.fn().mockImplementation(() => ({
          on: jest.fn(),
          login: jest.fn(),
          commands: new Map(),
          channels: { cache: { find: jest.fn() } }
        }))
      };
    });
    const index = require('../../index');
    expect(index.DEBUG).toBe(false);
  });
});
