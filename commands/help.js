module.exports = {
    name: 'help',
    description: 'Gives you a list of all commands',
    execute(message, args){
        const fs = require('fs')
        const help = JSON.parse(fs.readFileSync('./JSON/help.json', 'utf-8'))
        var length = Object.keys(help).length
        try{
            if(!args[1]){
                HelpEmbed(message, help)
            }else if(args[1] === 'menu'){
                HelpSelectMenu(message, help)
            }else if(parseInt(args[1]) == parseFloat(args[1]) && args[1] > 0 && args[1] <= length){
                CommandHelpEmbed(message, help, args)
            }else{
                message.channel.send('Use !help for a list of all commands. Use !help [command number] for a more detailed list of the specified command')
            }
        }catch(err){
            console.log(err)
            message.channel.send('Error occured in help.js')
        }
    },
    HelpEmbed,
    HelpSelectMenu,
    CommandHelpEmbed
}

function HelpEmbed(message, helpJSON){
    const embed = require('./Functions/embed_functions')
    const {ButtonBuilder, ButtonStyle, ActionRowBuilder} = require('discord.js')

    var list = ""

    for(var i in helpJSON){
        list += `${i}. ${helpJSON[i].name}\n`
    }

    var title = "List of Commands"
    var description = `Use "!help [number]" for more detailed info on a command`
    var fields = {name: "Commands", value: list}
    const embedMessage = embed.EmbedCreator(message, title, description, fields)
    
    const menuButton = new ButtonBuilder()
        .setLabel('Quick Select')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('help_menu')

    const row = new ActionRowBuilder().addComponents(menuButton)
    
    message.channel.send({ embeds: [embedMessage], components: [row] });
    return
}

function CommandHelpEmbed(message, helpJSON, args){
    const embed = require('./Functions/embed_functions')
    const {ButtonBuilder, ButtonStyle, ActionRowBuilder} = require('discord.js')
    var title = `**${helpJSON[args[1]].name}**`
    var description = helpJSON[args[1]].description
    var fields = {name: '**Commands**', value: ""}
    if(helpJSON[args[1]].rules !== ""){
        var temp = ""
        for(var i in helpJSON[args[1]].rules){
            temp += helpJSON[args[1]].rules[i] + "\n"
        }
        fields.value = temp

    }else{
        fields = embed.emptyValue
    }
    const embedMessage = embed.EmbedCreator(message, title, description, fields)

    const listButton = new ButtonBuilder()
        .setLabel('All Commands')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('help_list')

    const row = new ActionRowBuilder().addComponents(listButton)

    message.channel.send({embeds: [embedMessage], components: [row]})
    return
}

function HelpSelectMenu(message, helpJSON){
    const embed = require('./Functions/embed_functions')
    const {StringSelectMenuBuilder, ActionRowBuilder} = require('discord.js')

    var options = []
    for(var i in helpJSON){
        options.push({
            label: helpJSON[i].name,
            description: helpJSON[i].description.substring(0, 100),
            value: i
        })
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_select')
        .setPlaceholder('Select a command')
        .addOptions(options)

    const row = new ActionRowBuilder().addComponents(selectMenu)

    const title = "Quick Command Select"
    var description = "Choose a command to see its details"
    const embedMessage = embed.EmbedCreator(message, title, description, embed.emptyValue)

    message.channel.send({ embeds: [embedMessage], components: [row] })
    return
}