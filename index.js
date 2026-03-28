const Discord = require('discord.js');
const {GatewayIntentBits, Partials, Client } = require('discord.js');
const bot = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildEmojisAndStickers
],
partials: [
    Partials.Channel,
    Partials.Message
  ] })
//used to select if the dev bot is being run or the production bot is being run
const token = process.env.NODE_ENV === 'local' ? process.env.DEVBOTTOKEN : process.env.PRODBOTTOKEN;
const PREFIX = "!";

const fs = require('fs');
const cron = require('cron')
var master = {}
var stats_list = {}
var command_stats = {}
var tracker = {}
var emojisList = {}
var buttonJSON = {}
var blackJackHands = {}
var betsOpen = {value: false}
var approvedBets = {value: []}

//Checks if the outside container path exists for the RaspberryPi
//creates it if it doesnt exist
var DATABASEPATH = process.env.JSONPATH

//checks if the environmental variable has been set up
//if not, default to using the local path and notify the user
if(DATABASEPATH == null){
    DATABASEPATH = "./JSON"
    console.log("Null database path found")
}

if(!fs.existsSync(DATABASEPATH)){
    //dir is made
    fs.mkdirSync(DATABASEPATH)

    //local JSONs are used to get initial values for variables
    var localPath = './JSON'
    master = GetJSONValue("master", localPath)
    stats_list = GetJSONValue("stats", localPath)
    command_stats = GetJSONValue( "command_stats", localPath)
    tracker = GetJSONValue("tracker", localPath)
    emojisList = GetJSONValue("emojis", localPath)

    //variables are then used to write JSONs to DATABASE location
    JSON_Overwrite(master, stats_list, tracker, command_stats, emojisList, DATABASEPATH)
}

var teamsData = []//variable for holding teams for the teams command

bot.commands = new Discord.Collection();

const stats = require('./commands/Functions/stats_functions');
const unlock = require('./commands/Functions/Achievement_Functions');
const general = require('./commands/Functions/GeneralFunctions')

//Pulling data from local jsons that will be written to persistent docker volumes

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for(const file of commandFiles){
    const command = require(`./commands/${file}`);

    bot.commands.set(command.name, command);
}


bot.on('ready', () => {
    //different channels depending on if its the dev bot or the prod bot being run
    var channel = bot.channels.cache.find(channel => channel.id === '611276436145438769') || bot.channels.cache.find(channel => channel.id === '590585423202484227')
    var bot_tinkering = bot.channels.cache.find(channel => channel.id === '611276436145438769') || bot.channels.cache.find(channel => channel.id === '711634711281401867')

    //updates all variables with data from the database
    master = GetJSONValue("master", DATABASEPATH)
    stats_list = GetJSONValue("stats", DATABASEPATH)
    command_stats = GetJSONValue( "command_stats", DATABASEPATH)
    tracker = GetJSONValue("tracker", DATABASEPATH)
    emojisList = GetJSONValue("emojis", DATABASEPATH)

    console.log('This bot is online')
    UpdateEmojiList(emojisList, DATABASEPATH)
    bot_tinkering.send('The bot is online')    
    new cron.CronJob('0 9 * * *', function(){
        Daily_Functions(channel, master, unlock)
        //590585423202484227 - pugilism
        //611276436145438769 - test
        //743269381768872087 - stonks
        //711634711281401867 bot-tinkering            
    }, null, true, 'America/New_York')

    //updates database json values with bot values
    new cron.CronJob('0 * * * *', function(){
        //'0 * * * * *'
        setTimeout(function(){
            JSON_Overwrite(master, stats_list, tracker, command_stats, emojisList, DATABASEPATH)
        },2000)
    }, null, true)
})

//event that triggers when a user leaves the server
bot.on('guildMemberRemove', member =>{
    try{
        //sends message when a server member leaves the server
        var channel = bot.channels.cache.find(channel => channel.id === '611276436145438769') || bot.channels.cache.find(channel => channel.id === '590585423202484227')
        channel.send(`${master[member.id].name} has left the server`)
    }catch(err){
        console.log('Error occured in user remover log')
        console.log(err)
    }
})

//event that triggers every time a message is sent
bot.on('messageCreate', message =>{
    try{
        if(!message.author.bot){ //filters out bot messages from tracking
            //commmands that ary run every time someone sends a message
            bot.commands.get('more_money').execute(message, master, stats_list, tracker);
            bot.commands.get('insults_counter').execute(message, master, stats_list);
            bot.commands.get('boo_trigger').execute(message, command_stats);
            if(message.author.id !== '712114529458192495' && message.author.id !== '668996755211288595'){
                stats.tracker(message.author.id, 7, 1, stats_list)
            }

            ['712755269863473252', '611276436145438769'].includes(message.channel.id) == true //not sure what this is for. can probably delete this line
            if(betsOpen.value && ['712755269863473252', '611276436145438769'].includes(message.channel.id) == true){ //checks if a roulette round has started and that the user is in the appropriate channel to play
                Roulette_bets(message, master[message.author.id].gbp, master, stats_list, approvedBets)
            }
        }
    }catch(err){
        console.log(err)
        message.channel.send("Error occurred in message parser")
    }
})

bot.on('messageCreate', message =>{    
    try{
        let args = message.content.substring(PREFIX.length).split(" ");
        if (message.content.startsWith("!") == true){ //only runs a command if it starts with an "!"
            if(message.author.id !== '712114529458192495' && message.author.id !== '668996755211288595'){ //668996755211288595 is the prod bot, 712114529458192495 is dev bot. only commands run by actual users are stat tracked
                stats.tracker(message.author.id, 8, 1, stats_list) //total commands stat tracker
            }
            switch(args[0].toLowerCase()){
                case 'ping': //lets you ping the bot to see if its running
                    bot.commands.get('ping').execute(message, buttonJSON);
                break;
                case 'pug': //sends pic of a pug
                    bot.commands.get('pug').execute(message,master, tracker); 
                break;
                case '21': //blackjack
                    bot.commands.get('21').execute(message, args, master, blackJackHands, tracker, stats_list);
                    //Gambling Addict Achievement
                    unlock.tracker1(message.author.id, 46, 1, message, master, tracker)
                break;
                case 'flip': //flips a coin
                    bot.commands.get('flip').execute(message, master, tracker);
                break;
                case 'council': //lets you ask the council a question
                    bot.commands.get('council').execute(message,master,tracker);
                break;
                case 'bank': //users can check their gbp and the gbp of others
                    bot.commands.get('bank').execute(message,args, master);
                break;
                case 'insults': //lets a user check who is being insulted, lets them add and remove people from being insulted
                    bot.commands.get('insults').execute(message,args, master, tracker);
                break;
                case 'delete': //lets a user delete messages
                    bot.commands.get('delete').execute(message,args,master[message.author.id].gbp, master, tracker);
                break;
                case 'gg': //game where the user gets three tries to guess a number between 1 and 100
                    bot.commands.get('gg').execute(message,args,master[message.author.id].gbp, master, stats_list, tracker);
                    //Gambling Addict Achievement
                    unlock.tracker1(message.author.id, 46, 1, message, master, tracker)
                break;
                case 'transfer': //lets users transfer gbp between eachother
                    bot.commands.get('transfer').execute(message,args, master);
                break;
                case 'kumiko': //sends the user a picture of kumiko from the Sound Euphonium
                    bot.commands.get('kumiko').execute(message, master, tracker);
                break;
                case 'powerball': //lets users buy lottery tickets and check stats on it
                    bot.commands.get('powerball').execute(message,args, master[message.author.id].gbp, master, stats_list, tracker, command_stats)
                    //Gambling Addict Achievement
                    unlock.tracker1(message.author.id, 46, 1, message, master, tracker)
                break;
                case 'names': //lists the names of all users on server
                    bot.commands.get('names').execute(message,master)
                break;
                case 'roles': //lists the current role holders on the server
                    bot.commands.get('roles').execute(message, master)
                break;
                case 'changelog': //lists the most recent changes to the bot
                    bot.commands.get('changelog').execute(message)
                break;
                case 'roulette': //lets users play roulette
                    bot.commands.get('roulette').execute(message,args,master, tracker, stats_list, betsOpen, approvedBets)
                    //Gambling Addict Achievement
                    unlock.tracker1(message.author.id, 46, 1, message, master, tracker)
                break;
                case 'help': //gives a list of all commands
                    bot.commands.get('help').execute(message, args);
                break;
                case 'set': //lets me set others gbp values
                    bot.commands.get('set').execute(message,args, master);
                break;
                case 'boo': //lets users set who is currently being booed by the bot
                    bot.commands.get('boo').execute(message,args, master, tracker, command_stats);
                break;
                case 'steal': //lets users steal gbp from eachother
                    bot.commands.get('steal').execute(message,args, master, tracker, bot);
                break;
                case 'achievements': //lists all the achievements on the server
                    bot.commands.get('achievements').execute(message,args, master, tracker);
                break;
                case 'stats': //lets users check stats associated with their server activity 
                    bot.commands.get('stats').execute(message,args, master, stats_list);
                break;
                case 'uptime': //shows how long the bot has been online
                    bot.commands.get('uptime').execute(message, bot);
                break;
                case 'msgcount': //shows message count leaderboard
                    bot.commands.get('msgcount').execute(message, args, stats_list);
                break;
                case 'button': //lets users push a button for a chance of winning 100 gbp or losing 1000 gbp
                    bot.commands.get('button').execute(message,args, master, buttonJSON, command_stats);
                    //Gambling Addict Achievement
                    unlock.tracker1(message.author.id, 46, 1, message, master, tracker)
                break;
                case 'msg': //lets users make the bot dm a different user
                    bot.commands.get('msg').execute(message, args, master, bot)
                break;
                case '=': //basic calculator
                    bot.commands.get('=').execute(message, args)
                break;
                case 'kumikosays': //creates image of kumiko with a speak bubble with user inputted text
                    bot.commands.get('kumikosays').execute(message, args, bot)
                break;
                case 'changename': //lets me change someones name in the bot functions
                    bot.commands.get('changename').execute(message, args, master, stats_list, tracker)
                break;
                case 'teams': //lets users randomly generate teams
                    bot.commands.get('teams').execute(message, args, teamsData)
                break;
                case 'emojis':
                    bot.commands.get('emojis').execute(message, args, emojisList, bot)
                break;
                case 'push': //command that pushes current bot json values to the database
                    //only lets Colin's discord account run this command
                    if(message.author.id == '450001712305143869'){
                        JSON_Overwrite(master, stats_list, tracker, command_stats, emojisList, DATABASEPATH)
                        message.channel.send("Database has been updated with current values")
                    }
                break;
                case 'pull': //command that pulls database values and overwrites current bot values
                    //only lets Colin's discord account run this command
                    if(message.author.id == '450001712305143869'){
                        master = GetJSONValue("master", localPath)
                        stats_list = GetJSONValue("stats", localPath)
                        command_stats = GetJSONValue( "command_stats", localPath)
                        tracker = GetJSONValue("tracker", localPath)
                        emojisList = GetJSONValue("emojis", localPath)
                        message.channel.send("Bot values have been updated with current Database values")
                    }
                break;
                case 'test': //another command for testing purposes only
                    //bot.commands.get('test').execute(message, args, master, blackJackHands, tracker, stats_list);
                    console.log("Dont worry about it")
                break;
                default:
                    message.channel.send('Use command !help for a list of commands');
            }
        }
    }catch(err){
        console.log(err)
        message.channel.send("Error Occured in Index.js Comand Handler");
    }

})

bot.login(token);

bot.on('shardError', error => {
	console.error('A websocket connection encountered an error:', error);
});

bot.on('error', (err) => {
    console.error(err.message)
});

bot.on('messageReactionAdd', reaction => {
    try{
        UpdateEmojiListCount(reaction._emoji.id, 1, reaction, true)
    }catch(err){
        console.log(err)
    }
})

bot.on('messageReactionRemove', reaction => {
    try{
        UpdateEmojiListCount(reaction._emoji.id, -1, reaction, false)
    }catch(err){
        console.log(err)
    }
})

bot.on('emojiCreate', emojiCreate => {
    try{
        console.log(emojiCreate)
        UpdateEmojiList(emojisList, DATABASEPATH)
    }catch(err){
        console.log(err)
    }
})

bot.on('emojiDelete', emojiDelete => {
    try{
        console.log(emojiDelete)
        RemoveEmojiFromList(emojisList, DATABASEPATH)
    }catch(err){
        console.log(err)
    }
})

bot.on('interactionCreate', interaction => {
    try{
        ButtonInteractions(interaction, buttonJSON, command_stats, stats_list, master, tracker)
    }catch(err){
        console.log(err)
        interaction.message.channel.send('Error occurred with button interaction')
    }
})


//adds 250 gbp or sets them to 250 gbp if they are above 0 gbp
function Welfare(channel, master){
    try{
        for(var i in master){
            if(isNaN(master[i].gbp) == true){
                master[i].gbp = 0;
            }
            if(master[i].gbp + master[i].account < 0){
                master[i].gbp = master[i].gbp + 250
            }else if(master[i].gbp + master[i].account < 250){
                master[i].gbp = 250 - parseFloat(master[i].account)
            }
        }
        channel.send("Welfare has been distributed")
    }catch(err){
        console.log(err)
        channel.send('Error Occured in Welfare')
    }
}

//function used to track users bets when a round a roulette has started
function Roulette_bets(message, money, master, stats_list, approvedBets){
    var args = message.content.split(" ")
    var possible_bets = fs.readFileSync('./text_files/roulette/roulette_bets','utf-8').split(",") //a list of all bets that a user can make
    var min_bet = 10;
    var bet = false

    try{
        if(isNaN(args[0]) == false && args[0] >= min_bet){
            if(possible_bets.includes(args[1].toLowerCase()) == true){
                if(money >= args[0]){
                    general.CommandPurchase(message, master, args[0], general.defaultRecipient)
                    bet = [args[0], args[1], message.author.id]
                    approvedBets.value.push(bet)
                    message.channel.send(`${master[message.author.id].name} Bet accepted`)
                    stats_list[message.author.id].roulette_bets += 1
                    if(Math.round(money) == args[0] && money >= 1000 && args[1].toLowerCase() == 'black'){
                        //Bet it All on Black Achievement
                        unlock.unlock(message.author.id, 38, message, master)
                    }
                }else{
                    message.channel.send(`${master[message.author.id].name} doesn't have enough gbp for that bet`)
                }
            }
        }else if(args[0].toLowerCase() == 'all' && master[message.author.id].gbp >= min_bet){
            if(possible_bets.includes(args[1].toLowerCase()) == true){
                general.CommandPurchase(message, master, args[0], general.defaultRecipient)
                bet = [args[0], args[1], message.author.id]
                approvedBets.value.push(bet)
                message.channel.send(`${master[message.author.id].name} Bet accepted`)
                stats_list[message.author.id].roulette_bets += 1
                if(args[1].toLowerCase() == 'black'){
                    //Bet it all on Black Achievement
                    unlock.unlock(message.author.id, 38, message, master)
                }
            }
        }
    }catch(err){
        console.log(err)
        message.channel.send('Error Occured in Roulette_bets.js')
    }
}

function Lottery(channel, master, unlock){
    var odds = 250
    var number = Math.ceil(Math.random()*odds);
    var pot = 1000
    var success = false
    channel.send("The Daily Lottery Drawing is occuring...")
    for(var i in master){
        var guess = Math.ceil(Math.random()*odds);
        if(guess == number){
            master[i].gbp = pot + master[i].gbp
            channel.send(`Congratulations! ${master[i].name} won the Daily lottery of ${pot} gbp`)
            //Jackpot Achievement
            unlock.index_unlock(i, 10, channel, master)
            success = true
        }
    }
    if(success == false){
        channel.send('No winners')
    }
}

async function JSON_Overwrite(master, stats_list, tracker, command_stats, emojiList, path){
    const fs = require('fs')
    try {
        fs.writeFileSync(path + `/master.json`, JSON.stringify(master, null, 2));
        fs.writeFileSync(path + `/stats.json`, JSON.stringify(stats_list, null, 2));
        fs.writeFileSync(path + `/tracker.json`, JSON.stringify(tracker, null, 2));
        fs.writeFileSync(path + `/command_stats.json`, JSON.stringify(command_stats, null, 2));
        fs.writeFileSync(path + `/emojis.json`, JSON.stringify(emojiList, null, 2));
    } catch (err) {
        console.error('Error writing JSON files:', err);
    }
}

function gbp_farm_reset(channel, master){
    var deletes = JSON.parse(fs.readFileSync("./JSON/delete_tracker.json", "utf-8"))
    try{
        for(var j in master){
            master[j].steal.insurance -= 1
            if(master[j].steal.insurance < 0){
                master[j].steal.insurance = 0
            }
            if(master[j].steal.caught == true){
                master[j].steal.caught = false
                master[j].steal.attempts = 0
            }
        }
 
        for(var i in deletes){
            deletes[i].deletes = 0
        }
        fs.writeFileSync ("./JSON/delete_tracker.json", JSON.stringify(deletes, null, 2), function(err) {
            if (err) throw err;
            console.log('complete');
            }
        );
    }catch(err){
        console.log(err)
        channel.send("Error occurred in gbp_farm_reset")
    }
}

async function Daily_Functions(channel, master, unlock){
    await Welfare(channel, master)
    await Lottery(channel, master, unlock)
    await gbp_farm_reset(channel, master)
}

function GetJSONValue(location, path){
    const fs = require('fs')
    try {
        return JSON.parse(fs.readFileSync(path + `/${location}.json`, "utf-8"))
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.warn(`File ` + path + `/${location}.json not found, returning empty object`)
            return {}
        } else {
            throw err
        }
    }
}

function UpdateEmojiList(emojisList, path){
    //takes emoji list tracked by discord and adds them to bot list if they werent there already
    const fs = require('fs')
    bot.emojis.cache.forEach(emoji => {
        if(!(emoji.id in emojisList)){
            emojisList[emoji.id] = {name: emoji.name, count: 0}
        }
    })
    fs.writeFileSync(`${path}/emojis.json`, JSON.stringify(emojisList, null, 2))
    return
}

function RemoveEmojiFromList(emojisList, path){
    const fs = require('fs')

    //when an emoji is removed the entire list of tracked emojis is checked for changes
    //if emoji that triggered this event was checked then invalid emojis could acculmate if the bot was down when an emoji was added/removed
    for(var emoji in emojisList){
        
        var foundEmoji = bot.emojis.cache.find(e => e.id === emoji)
        if(!foundEmoji){
            delete emojisList[emoji]
        }
    }

    fs.writeFileSync(path + "/emojis.json", JSON.stringify(emojisList, null, 2))
    return
}

function UpdateEmojiListCount(emojiID, increment, reaction){
    if(emojisList[emojiID] == undefined){
        return
    }

    //if there is no cache it means the last reaction was removed. That means there was no bot reaction and it can be counted as a removal
    if(reaction.users.cache.size == 0){
        emojisList[emojiID].count += increment;
        return
    }

    //if the first and only reaction is a bot then it is ignored from counting
    if((reaction.users.cache.first().bot && increment == 1 && reaction.users.cache.size == 1)){
        return
    }

    //if the emojis is not in the emoji list (such as a non-custom emoji) it is ignored 
    //NEED TO DOUBLE CHECK THIS WITH CUSTOM EMOJIS NOT NATIVE TO THE SERVER
    if(!(emojiID in emojisList)){
        return
    }
    emojisList[emojiID].count += increment;
    return
}

function ButtonInteractions(interaction, buttonJSON, command_stats, stats_list, master, tracker){
    const embed = require('./commands/Functions/embed_functions')
    const unlock = require('./commands/Functions/Achievement_Functions')

    if(!["button", "bigButton"].includes(interaction.customId)){
        return
    }

    var userID = String(interaction.user.id)

    if(buttonJSON[userID] == null){
        return
    }

    if(buttonJSON[userID].currentMessageID != interaction.message.id){
        return
    }

    var buttonPayout = Math.floor(Math.random() * 10)

    //Gives a 1 in 10 chance of losing for either Button or Big Button
    if(interaction.customId == "button"){
        if(buttonPayout == 5){
            buttonPayout = -1000
            command_stats.button.Total_Losses = command_stats.button.Total_Losses + 1
            command_stats.button.Last_loss = 0
            stats_list[interaction.user.id].button_losses += 1
        }else{
            buttonPayout = 100
            command_stats.button.Last_loss = command_stats.button.Last_loss + 1
        }
    }else{
        if(buttonPayout == 7){
            buttonPayout = -10000
            command_stats.button.Total_Losses = command_stats.button.Total_Losses + 1
            command_stats.button.Last_loss = 0
            stats_list[interaction.user.id].button_losses += 1
        }else{
            buttonPayout = 1000
            command_stats.button.Last_loss = command_stats.button.Last_loss + 1
        }
    }

    stats_list[userID].button_presses = stats_list[userID].button_presses + 1
    command_stats.button.Total_Presses = command_stats.button.Total_Presses + 1
    
    //Wyatt Achievement
    unlock.tracker1(interaction.user.id, 44, 1, interaction.message, master, tracker)

    buttonJSON[userID].currentSessionAmount += buttonPayout
    buttonJSON[userID].currentSessionPresses += 1
    master[userID].gbp += buttonPayout   //this and other interactions should be the only place "Command Purchase" isn't used because the message sender is the bot not the user

    var title = `${master[interaction.user.id].name} current Button Session`
    var description = [`Last Button Payout: ${buttonPayout}`, `Total GBP earned: ${buttonJSON[userID].currentSessionAmount}`, `Total button presses: ${buttonJSON[userID].currentSessionPresses}`]

    //add embed message that updates with last payout and cum payout on message
    const embedMessage = embed.EmbedCreator(interaction.message, title, description, embed.emptyValue)

    interaction.update({
        //content: 'Button'
        embeds: [embedMessage]
    })
}