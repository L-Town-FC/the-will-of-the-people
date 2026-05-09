var emptyValue = "emptyValue"
module.exports.emptyValue = emptyValue

//grabs the users color and sets the embeds color to match the users
//if no color is detected it defaults to black
function Color(message){
    try{
        {if(message.author.bot){
            return 0o0
        }
        if(message.member !== null){
            if(message.member.roles.color == null){
                return 0o0
            }
            return message.member.roles.color.color
        }else{
            return 0o0
        }}
    }catch(err){
        console.log(err)
        return 0o0
    }
}

module.exports.Color = Color

function EmbedCreator(message, title, description, fields){
    const Discord = require("discord.js")

    const embededMessage = new Discord.EmbedBuilder()
    try{
        //sets the title of the embedded message
        if(title != emptyValue){
            embededMessage.setTitle(title)
        }

        //sets the description of the embedded message
        if(description != emptyValue){
            //used to check if description is a string array because its directly taken from a text file
            if(typeof(description) == 'object'){
                var temp = ""
                for (let i = 0; i < description.length; i++) {
                    temp += description[i] +"\n";
                }
                description = temp
            }
            embededMessage.setDescription(description)
        }

        //set the fields of the embedded message
        //fields require a string as the "Name" component and a string as the "value" component
        //if the received fields value doesnt adhere to this it is edited until it does
        if(fields != emptyValue){
            //when there are multiple "fields" set as a single fields object they must be split up and set individually
            if(fields.length > 1){
                for (var i = 0; i < fields.length; i++) {
                    //the base case is that each sub field object has a string value and thus you just need the index to add each subfield to the embed
                    if(typeof(fields[i].value) == "string"){
                        embededMessage.addFields(fields[i])
                    }else{
                        //when the sub field is an object it needs to be converted into a string
                        //this goes through the indices of the subfield and appends them onto a string with a line break inbetween
                        temp = ""
                        for (let j = 0; j < fields[i].value.length; j++) {
                            temp += fields[i].value[j] + "\n"
                        }
                        fields[i].value = temp
                        //embededMessage.addFields(fields[0], fields[1])
                        embededMessage.addFields(fields[i])
                    }
                }
            }else{
                //base case is when the field is set up properly with only one field with a string name and a string value
                if(typeof(fields.value) == "string"){
                    embededMessage.setFields(fields)
                }else{
                    //if a field has only single subfield but its values are object the above process is done to ensure the value is a string
                    temp = ""
                    for (let j = 0; j < fields.value.length; j++) {
                        temp += fields.value[j] + "\n"
                    }
                    fields.value = temp
                    embededMessage.setFields(fields)
                }
            }
        }

        //sets the color of the embedded message based on the users name color
        embededMessage.setColor(Color(message))

        //console.log(embededMessage.data)

        return embededMessage
    }catch(err){
        console.log(err)
    }
}

module.exports.EmbedCreator = EmbedCreator