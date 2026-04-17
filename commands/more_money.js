module.exports = {
    name: 'more_money',
    description: 'gives 1 gbp every message',
    execute(message, master, stats_list, tracker){
        const unlock = require('./Functions/Achievement_Functions')
        const stats = require('./Functions/stats_functions')
        var amount = 0
        var person = message.author.id
        var dmChannelEnum = 1
        try{
            if(!master[person]){
                //addPerson(message, master, tracker, stats_list)
            }
            for(var i in master){
                if(isNaN(master[i].gbp) == true){
                    master[i].gbp = 0;
                }
            }
            
            //these are bot discriminators. should make a bot check instead of hardcoding these values tho
            if(message.author.discriminator == '9509' && message.author.discriminator == '0250'){
                return
            }

            //commands dont get gbp
            if(message.content.startsWith("!")){
                return
            }

            //1 is the enum for DM
            if(message.channel.type !== dmChannelEnum){
                if(message.member.roles.cache.find(r => r.name === "Junior Representative Assistant") || message.member.roles.cache.find(r => r.name === "Senior Representative Assistant") || message.member.roles.cache.find(r => r.name === "The People's Representative") ||message.member.roles.cache.find(r => r.name === "Dogcatcher") || message.member.roles.cache.find(r => r.name === "Soupmaker") || message.member.roles.cache.find(r => r.name === "Viceroy!")){
                    //Large and In Charge Achievement
                    unlock.unlock(message.author.id, 24, message, master)
                }
            }
            if(['590585423202484227','712755269863473252', '672846614410428416'].includes(message.channel.id) || message.channel.type === 'dm'){
                stats.tracker(person, 9, 1, stats_list)
            }else{
                stats.tracker(person, 10, 1, stats_list)
            }
            
            var scaling_modifier = -0.1 * master[person].gbp + 175
            Achievement_Switch(person, message.channel.id, message, master, tracker)
            Random_Achievements(person, message, master)
            amount = 1
            if(master[person].gbp < -20000){
                amount = 200
            }else if(master[person].gbp < -10000){
                amount = 50
            }else if(master[person].gbp < -2500){
                amount = 20
            }else if(master[person].gbp < -1000){
                amount = 10
            }else if(master[person].gbp < 0){
                amount = 5
                //L Achievement
                unlock.unlock(person, 3, message, master)
            }else if(master[person].gbp < 250){
                amount = 3
            }else if(master[person].gbp < 500){
                amount = 2
            }else if(master[person].gbp < 750){
                amount = 1
            }else if(master[person].gbp < 1500){
                var chance = Math.random() * 100
                if(chance > scaling_modifier){
                    amount = 0
                }
            }else{
                chance = Math.random() * 100
                if(chance > 25){
                    amount = 0
                }
                console.log(chance)
            }
            if(amount == 0 && ['712755269863473252', '590585423202484227', '611276436145438769'].includes(message.channel.id) == false){
                //1 is dm enum
                if(message.channel.type !== dmChannelEnum){
                    amount = 1
                }
            }
            master[person].gbp = Math.round((parseFloat(master[person].gbp) + amount) * 100)/100
        }catch(err){
            console.log(err)
            message.channel.send("Error occurred in More_money.js");
        }
        
    }

}

function Achievement_Switch(user, channel, message, master, tracker){
    const unlock = require('./Functions/Achievement_Functions')

    switch(channel){
        case '590583268961812500':
            //politics
            //Fucking Liberal Achievement
            unlock.tracker1(user, 17, 1, message, master, tracker)
        break;
        case '590583073595457547':
            //gaming
            //We Live In A Society Achievement
            unlock.tracker1(user, 28, 1, message, master, tracker)
        break;
        case '590585423202484227':
            //pugilism
            //It Aint Easy but Its Honest Work Achievement
            unlock.tracker1(user, 9, 1, message, master, tracker)
        break;
        case '712755269863473252':
            //blackjack
            //It Aint Easy but Its Honest Work Achievement
            unlock.tracker1(user, 9, 1, message, master, tracker)
        break;
        case '590583125445181469':
            //anime
            //Enlightened Achievement
            unlock.tracker1(user, 29, 1, message, master, tracker)
        break;
        case '664241953973731328':
            //feet 664241953973731328

            //I love some Porkie Piggies Achievement
            unlock.tracker1(user, 27, 1, message, master, tracker)
            
            //Fetishist Achievement
            unlock.tracker2(user, 15, 0, message, master, tracker)
        break;
        case '606515956826636288':
            //dobans 606515956826636288
            //Massive Dobonhonerkeros Achievement
            unlock.tracker1(user, 26, 1, message, master, tracker)
            
            //Fetishist Achievement
            unlock.tracker2(user, 15, 1, message, master, tracker)
        break;
    }
}

function Random_Achievements(user, message, master){
    const unlock = require('./Functions/Achievement_Functions')
    if(master[user].gbp <= -250){
        //Deep Dark Hole Achievement
        unlock.unlock(user, 34, message, master)
    }else if(master[user].gbp == 69){
        //Nice Achievement
        unlock.unlock(user, 40, message, master)
    }else if(master[user].gbp >= 10000){
        //Too Big Too Fail Achievement
        unlock.unlock(user, 6, message, master)
    }
}