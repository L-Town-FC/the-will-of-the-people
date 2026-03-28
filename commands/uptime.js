module.exports = {
    name: 'uptime',
    description: 'shows how long the bot has been online',
    execute(message, bot){
        try{
            const uptimeMs = bot.uptime;
            
            // Convert milliseconds to days, hours, minutes, seconds
            const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000);
            
            const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            
            message.channel.send(`The monster has lurked in the realm for: **${uptimeString}**`);
        }catch(err){
            console.log(err)
            message.channel.send("Error Occurred in uptime.js");
        }
    }
}
