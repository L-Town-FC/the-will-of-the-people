module.exports = {
    name: 'changename',
    description: 'lets me change someones name',
    execute(message, args, master, stats_list, tracker){
        try{
            if(message.author.id == "450001712305143869"){
                var id = args[1]
                var success = false
                for(var i in master){
                    if(i == id){
                        master[i].name = args[2]
                        stats_list[i].name = args[2]
                        tracker[i].name = args[2]
                        success = true
                    }
                }
                if(!success){
                    message.channel.send(`That user doesn't exist`)
                }else{
                    message.channel.send('Name updated')
                }
            }
        }catch(err){
            console.log(err)
            message.channel.send('Error occurred in changenames.js')
        }
    }
}