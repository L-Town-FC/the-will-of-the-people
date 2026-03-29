const LOG_BUFFER_SIZE = 50;
const logBuffer = [];

function addLogEntry(level, message) {
    const timestamp = new Date().toISOString();
    logBuffer.push({ timestamp, level, message });
    if (logBuffer.length > LOG_BUFFER_SIZE) {
        logBuffer.shift();
    }
}

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = function(...args) {
    originalConsoleLog.apply(console, args);
    addLogEntry('INFO', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
};

console.error = function(...args) {
    originalConsoleError.apply(console, args);
    addLogEntry('ERROR', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
};

console.warn = function(...args) {
    originalConsoleWarn.apply(console, args);
    addLogEntry('WARN', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
};

module.exports = {
    name: 'logs',
    description: 'Shows recent bot logs for debugging issues',
    aliases: ['l'],
    execute(message, _args) {
        const lines = logBuffer.slice(-10).map(l => `[${l.timestamp.split('T')[1].split('.')[0]}] ${l.level}: ${l.message}`).join('\n');

        const embed = {
            color: 0x7289da,
            title: 'Recent Bot Logs',
            description: lines || 'No logs yet',
            footer: {
                text: 'Last 10 entries'
            }
        };

        message.channel.send({ embeds: [embed] });
    }
};
