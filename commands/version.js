module.exports = {
    name: 'version',
    description: 'Displays the bot version baked into the running container',
    execute(message){
        const appVersion = process.env.APP_VERSION || 'unknown';

        message.channel.send(`Bot version: ${appVersion}`);
    }
}
