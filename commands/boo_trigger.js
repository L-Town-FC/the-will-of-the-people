module.exports = {
    name: 'boo_trigger',
    description: 'says pong',
    execute(message, command_stats){
        const boo = command_stats.boo
        var chance = 4
        try{
            if(message.author.id == boo){
                if(!message.content.startsWith("!")){
                    var rand = Math.ceil(Math.random() * chance)
                    if(rand == 4){
                        Trigger(message)
                    }
                }
            }
        }catch(err){
            console.log(err)
            message.channel.send("Error occurred in boo_trigger.js")
        }
    }
}

async function Trigger(message){
    try{
        await message.react('591022023489355787')
    }catch(err){
        try{
            //await message.react('👎')
            message.react('714888403346391110')
        }catch(err){
            console.log(err)
            message.channel.send('Error Occurred in Boo Trigger')
        }
        console.log(err)
    }
}