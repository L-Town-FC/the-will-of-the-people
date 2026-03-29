const os = require('os');

module.exports = {
    name: 'info',
    description: 'Shows bot information and system status',
    aliases: ['status', 'botinfo'],
    execute(message, _args) {
        const memUsage = process.memoryUsage();
        const uptime = process.uptime();
        const appVersion = process.env.APP_VERSION || 'unknown';

        const formatUptime = (seconds) => {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${days}d ${hours}h ${mins}m ${secs}s`;
        };

        const embed = {
            color: 0x7289da,
            fields: [
                {
                    name: 'Bot Info',
                    value: `**Version:** ${appVersion}\n**Uptime:** ${formatUptime(uptime)}`,
                    inline: true
                },
                {
                    name: 'System',
                    value: `**Node:** ${process.version}\n**Platform:** ${os.platform()}`,
                    inline: true
                },
                {
                    name: 'Memory',
                    value: `**RSS:** ${Math.round(memUsage.rss / 1024 / 1024)}MB\n**Heap Used:** ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                    inline: true
                }
            ],
            footer: {
                text: 'Use !logs to see recent log entries'
            }
        };

        message.channel.send({ embeds: [embed] });
    }
};
