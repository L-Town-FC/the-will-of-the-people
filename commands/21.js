module.exports = {
    name: '21',
    description: 'blackjack with buttons',
    execute(message, args, master, blackJackHands, tracker, statsList){
        //TODO: ADD ACHIEVEMENTS AND STAT TRACKING
        const general = require('./Functions/GeneralFunctions')
        const MINBET = 15
        const OUTCOMES = {Win: "win", Push: "push", Loss: "loss", Blackjack: "Blackjack", Surrender: "Surrender"}
        //args = ['21', '20'] //for testing only
        try{
            //if the user is currently in an active game. just resend the ui with the current game status
            if(blackJackHands[message.author.id] != undefined){
                if(blackJackHands[message.author.id].currentMessageID != ""){
                    SendGameDisplay(message, blackJackHands, message.author.id, master, OUTCOMES)
                    return
                }
            }

            if(args.length < 2){
                message.channel.send("You must specificy a bet amount")
                return
            }

            if(!general.CommandUsageValidator(message, master, args[1], MINBET, master[message.author.id].gbp, general.defaultRecipient)){
                return
            }

            CreateNewGame(message, blackJackHands, message.author.id, parseFloat(args[1]), master, OUTCOMES, tracker, statsList)
        }catch(err){
            console.log(err)
            message.channel.send('Error occurred in 21.js')
        }
    }
}

//creates new game for player
function CreateNewGame(message, blackJackHands, userID, bet, master, OUTCOMES, tracker, statsList){
    const general = require('./Functions/GeneralFunctions')
    const unlock = require('./Functions/Achievement_Functions')
    AddPlayerToHandsArray(blackJackHands, userID, bet, OUTCOMES)
    general.CommandPurchase(message, master, bet, general.defaultRecipient)
    CreateHands(blackJackHands, userID, OUTCOMES)
    if(parseFloat(blackJackHands[userID].bet[0]) >= 200){
        //Psycho Achievement
        unlock.tracker1(message.author.id, 23, 1, message, master, tracker)
    }
    SendGameDisplay(message, blackJackHands, userID, master, OUTCOMES, tracker, statsList)
}

//sets various fields that need to be tracked to during play
function AddPlayerToHandsArray(blackJackHands, userID, bet, OUTCOMES){
    blackJackHands[userID] = {
        bet: [bet, bet],
        currentMessageID: "",
        dealerHand: [],
        dealerDummyHand: [],
        playerHand: [[],[]],
        playerDummyHand:[[],[]],
        playerSplit: false,
        playerStay: [false, false],
        playerBust: [false, false],
        dealerBust:false,
        playerHandOutcome: [OUTCOMES.Push, OUTCOMES.Push]
    }
}

async function SendGameDisplay(message, blackJackHands, userID, master, OUTCOMES, tracker, statsList){
    const {ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType} = require('discord.js')
    
    blackJackHands[userID].currentMessageID = message.id
    var maxSessionLengthInSeconds = 30

    const hitButton = new ButtonBuilder()
    .setLabel('Hit')
    .setStyle(ButtonStyle.Primary)
    .setCustomId('hit')

    const stayButton = new ButtonBuilder()
    .setLabel('Stay')
    .setStyle(ButtonStyle.Success)
    .setCustomId('stay')

    const doubleDownButton = new ButtonBuilder()
    .setLabel('Double Down')
    .setStyle(ButtonStyle.Secondary)
    .setCustomId('doubleDown')

    const splitButton = new ButtonBuilder()
    .setLabel('Split')
    .setStyle(ButtonStyle.Secondary)
    .setCustomId('split')

    const surrenderButton = new ButtonBuilder()
    .setLabel('Surrender')
    .setStyle(ButtonStyle.Danger)
    .setCustomId('surrender')

    HandChecker(blackJackHands, userID, splitButton, doubleDownButton, surrenderButton)

    const buttonRow = new ActionRowBuilder().addComponents(hitButton, stayButton, doubleDownButton, splitButton, surrenderButton);

    const reply = await message.reply({embeds: [UpdatedEmbedMessage(message, blackJackHands, userID, master, OUTCOMES)], components: [buttonRow]})

    blackJackHands[userID].currentMessageID = reply.id //makes it so the user can only interact with the most recent game theyve created

    if(isHandOver(blackJackHands, userID, OUTCOMES, hitButton, stayButton, doubleDownButton, splitButton, surrenderButton, message, master, reply, buttonRow, null, tracker, statsList)){
        return
    }

    const filter = (i) => i.user.id === message.author.id

    const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter,
        time: maxSessionLengthInSeconds * 1000
    })

    collector.on('collect', (interaction) =>{


        if(blackJackHands[userID].currentMessageID != interaction.message.id){
            return
        }

        if(interaction.customId === 'hit'){
            Hit(blackJackHands, userID, [splitButton, doubleDownButton, surrenderButton])
        }

        if(interaction.customId === 'stay'){
            Stay(blackJackHands, userID, [surrenderButton, splitButton], [hitButton, stayButton, doubleDownButton, splitButton, surrenderButton])
        }

        
        if(interaction.customId === 'split'){
            Split(blackJackHands, userID, [splitButton, surrenderButton], message, master)
        }

        
        if(interaction.customId === 'doubleDown'){
            DoubleDown(blackJackHands, userID, message, master)
        }

        
        if(interaction.customId === 'surrender'){
            Surrender(blackJackHands, userID, OUTCOMES)
        }

        if(isHandOver(blackJackHands, userID, OUTCOMES, hitButton, stayButton, doubleDownButton, splitButton, surrenderButton, message, master, reply, buttonRow, interaction, tracker, statsList)){
            return
        }

        interaction.update({
            embeds: [UpdatedEmbedMessage(reply, blackJackHands, userID, master, OUTCOMES)],
            components: [buttonRow]
        })
        
    })

    collector.on('end', () => {
        ChangeButtonState([hitButton, stayButton, splitButton, doubleDownButton, surrenderButton], true)

        reply.edit({
            embeds: [reply.embeds[0]],
            components: [buttonRow]
        })
    })
}

//creates hands for both player and dealer at the same time
function CreateHands(blackJackHands, userID, OUTCOMES){
    for (var i = 0; i < 2; i++) {
        var temp = AddCard()
        blackJackHands[userID].playerHand[0].push(temp[0])
        blackJackHands[userID].playerDummyHand[0].push(temp[1])
        
        var temp2 = AddCard()
        blackJackHands[userID].dealerHand.push(temp2[0])
        blackJackHands[userID].dealerDummyHand.push(temp2[1])
    }

    //used to check if either the player or dealer has blackjack or the player can split
    BlackJackChecker(blackJackHands, userID, OUTCOMES)
}

//creates a card to be used in a hand
//if the card is a 10 it is randomzied as a face card
//if the card is an 11 it becomes an ace
//also adds a random suit to each created card
function AddCard(){
    const CARDVALUES = [2,3,4,5,6,7,8,9,10,10,10,10,11]
    const TENS = ['10','J','Q','K']
    const SUITS = [':diamonds:',':hearts:',':spades:',':clubs:']

    var card = ""
    var dummyCard = ""
    card = dummyCard = CARDVALUES[Math.floor(Math.random()*CARDVALUES.length)];
    if(card == 11){
        dummyCard = "A"
    }

    if(card == 10){
        dummyCard = TENS[Math.floor(Math.random() * TENS.length)]
    }
    
    dummyCard += SUITS[Math.floor(Math.random()*SUITS.length)];
    return [card, dummyCard]
}

//adds card to player hand
function Hit(blackJackHands, userID, buttonArray){
    var newCard = AddCard()
    var handIndex = 0

    //determines if player is hitting their first or second hand
    //player can only hit their second hand if they have stayed on their first hand
    if(blackJackHands[userID].playerStay[0]){
        handIndex = 1
    }

    //adds numeric value to 'player hand' and card value plus suit to player dummy hand
    blackJackHands[userID].playerHand[handIndex].push(newCard[0])
    blackJackHands[userID].playerDummyHand[handIndex].push(newCard[1])


    //disables surrender, split, and double down because you arent allowed to do these actions after youve hit
    ChangeButtonState(buttonArray, true)

    //checks if players current active hand is over 21. sets them to bust if they are over
    if(PlayerHandValue(blackJackHands, userID, handIndex) > 21){
        blackJackHands[userID].playerStay[handIndex] = true
        blackJackHands[userID].playerBust[handIndex] = true
    }

}

//lets player stay on a hand
function Stay(blackJackHands, userID, disableButtonArray,  enableButtonArray){
    //if the player hasnt stood on their first hand, it goes here
    if(!blackJackHands[userID].playerStay[0]){
        //checks their hand value just in case
        PlayerHandValue(blackJackHands,userID,0)
        blackJackHands[userID].playerStay[0] = true
        if(blackJackHands[userID].playerSplit){
            //enables all buttons and then disables surrender and split
            ChangeButtonState(enableButtonArray, false)
            ChangeButtonState(disableButtonArray, true)
            return
        }

        return
    }
    PlayerHandValue(blackJackHands,userID,1)
    blackJackHands[userID].playerStay[1] = true
}

//splits the players hand
//this function is only callable when the player has two cards of the same dummy value i.e 10 10, A A, J J, etc
function Split(blackJackHands, userID, disableButtonArray, message, master){
    const general = require('./Functions/GeneralFunctions')
    blackJackHands[userID].playerSplit = true

    //takes the second card from the first hand and makes it the first card of the second hand
    blackJackHands[userID].playerHand[1][0] = blackJackHands[userID].playerHand[0][1]
    blackJackHands[userID].playerDummyHand[1][0] = blackJackHands[userID].playerDummyHand[0][1]

    //gets new cards and sets them to the second position in each hand
    for (var i = 0; i < blackJackHands[userID].playerHand.length; i++) {
        var newCard = AddCard()
        blackJackHands[userID].playerHand[i][1] = newCard[0]
        blackJackHands[userID].playerDummyHand[i][1] = newCard[1]
    }
    //disables surrender and split
    ChangeButtonState(disableButtonArray, true)

    general.CommandPurchase(message, master, blackJackHands[userID].bet[0], general.defaultRecipient)
}

//player hit and then stay but for double the bet
function DoubleDown(blackJackHands, userID, message, master){
    const general = require('./Functions/GeneralFunctions')

    //checks which hand should be doubled down. if the player has stayed on the first one and the game is still active they must have doubled the second hand
    var handIndex = 0
    if(blackJackHands[userID].playerStay[0]){
        handIndex = 1
    }

    Hit(blackJackHands, userID, [])

    //takes new bet from player
    general.CommandPurchase(message, master, blackJackHands[userID].bet[handIndex], general.defaultRecipient)
    blackJackHands[userID].bet[handIndex] = parseFloat(blackJackHands[userID].bet[handIndex]) * 2

    if(handIndex == 0 && blackJackHands[userID].playerStay[0]){
        return
    }

    if(handIndex == 1 && blackJackHands[userID].playerStay[1]){
        return
    }
    
    //makes players current hand stay
    Stay(blackJackHands, userID, [], [])

}

//ends game and sets players outcome to surrender for further processing
function Surrender(blackJackHands, userID, OUTCOMES){
    blackJackHands[userID].playerStay[0] = true
    blackJackHands[userID].playerHandOutcome[0] = OUTCOMES.Surrender
}

//pays out bets based on each hands outcome
//bet winning have to take into account paying back the initial bet + the winnings which is why they may look inflated
function PayoutBets(blackJackHands, userID, OUTCOMES, message, master, tracker, statsList){
    const general = require('./Functions/GeneralFunctions')
    const unlock = require('./Functions/Achievement_Functions')
    const stats = require('./Functions/stats_functions')

    var winnings = 0

    for (var i = 0; i < blackJackHands[userID].playerHand.length; i++) {
        if(blackJackHands[userID].playerHand[i].length == 0){
            break
        }        
        switch(blackJackHands[userID].playerHandOutcome[i]){
            case OUTCOMES.Win:
                winnings += 2 * parseFloat(blackJackHands[userID].bet[i])
                //This Bot is Rigged Achievement
                unlock.reset1(userID, 8, tracker, message)

                if(parseFloat(blackJackHands[userID].bet[i]) >= 1000){
                    //High Roller Achievement
                    unlock.unlock(userID, 1, message, master)
                }

                //Jack of All Trades Achievement
                unlock.tracker3(userID, 39, 0, parseFloat(blackJackHands[userID].bet[i]), message, master, tracker)
                stats.tracker(userID, 2, 1, statsList)
            break;
            case OUTCOMES.Push:
                winnings += parseFloat(blackJackHands[userID].bet[i])
                    //This Bot Is Rigged Achievement
                    unlock.reset1(userID, 8, tracker, message)
                    stats.tracker(userID, 3, 1, statsList, tracker)
            break;
            case OUTCOMES.Loss:
                winnings += 0
                if(parseFloat(blackJackHands[userID].bet[i]) >= 1000){
                    //Buster Achievement
                    unlock.unlock(userID, 2, message, master)
                }
                //The House Always Wins Achievement
                unlock.tracker1(userID, 32, parseFloat(blackJackHands[userID].bet[i]), message, master, tracker)
                stats.tracker(userID, 4, 1, statsList)
            break;
            case OUTCOMES.Surrender:
                winnings += 0.5 * parseFloat(blackJackHands[userID].bet[i])
            break;
            case OUTCOMES.Blackjack:
                winnings += 2.5 * parseFloat(blackJackHands[userID].bet[i])
                //This Bot is Rigged Achievement
                unlock.reset1(userID, 8, tracker, message)
            break
            default:
                winnings += 0
        }
    }

    general.CommandPurchase(message, master, -1 * winnings, general.defaultRecipient)

}

//can probably consolidate PlayerHandValue and DealerHandValue easily
//finds sum of players cards. converts 11s to 1s if they are over 21 and have any 11s
function PlayerHandValue(blackJackHands, userID, handIndex){
    //getting handvalue for specified hand
    var handValue = Sum(blackJackHands[userID].playerHand[handIndex])

    //returns either the index of the 11 if there is 1 or a -1 if there isnt
    var elevenIndex = blackJackHands[userID].playerHand[handIndex].indexOf(11)

    //if the player is over 21 and there is an 11 in the hand, turn it into a 1
    if(handValue > 21 && elevenIndex != -1){
        blackJackHands[userID].playerHand[handIndex][elevenIndex] = 1
        handValue -= 10
    }


    elevenIndex = blackJackHands[userID].playerHand[handIndex].indexOf(11)

    //need to check a second time in case player is dealt 2 aces and decides to hit
    if(handValue > 21 && elevenIndex != -1){
        blackJackHands[userID].playerHand[handIndex][elevenIndex] = 1
        handValue -= 10
    }

    return handValue
}

function DealerHandValue(blackJackHands, userID){

    var handValue = Sum(blackJackHands[userID].dealerHand)

    var elevenIndex = blackJackHands[userID].dealerHand.indexOf(11)

    if(handValue > 21 && elevenIndex != -1){
        blackJackHands[userID].dealerHand[elevenIndex] = 1
        handValue -= 10
    }

    elevenIndex = blackJackHands[userID].playerHand.indexOf(11)

    //need to check a second time in case player is dealth 2 aces and decides to hit
    if(handValue > 21 && elevenIndex != -1){
        blackJackHands[userID].dealerHand[elevenIndex] = 1
        handValue -= 10
    }

    return handValue
}

//determines outcomes of player hands relative to the dealer
function DealerHandResolved(blackJackHands, userID, OUTCOMES){

    if(blackJackHands[userID].playerHandOutcome[0] == OUTCOMES.Surrender){
        return true
    }

    if(blackJackHands[userID].playerHandOutcome[0] == OUTCOMES.Blackjack){
        return true
    }

    var gameOutcomesDecided = []

    for (var i = 0; i < blackJackHands[userID].playerHand.length; i++) {
        //the first hand will always have cards and the second hand will only have cards if the player has split
        if(blackJackHands[userID].playerHand[i].length != 0){
            gameOutcomesDecided[i] = OutcomeConditionCheck(blackJackHands, userID, i, OUTCOMES)
            continue
        }

        gameOutcomesDecided[i] = true
    }

    if(gameOutcomesDecided.includes(false)){
        return false
    }

    return true
}

//adds cards until dealer has atleast 17
function ResolveDealerTurn(blackJackHands, userID){
    while(DealerHandValue(blackJackHands, userID) < 17){
        var newCard = AddCard()

        blackJackHands[userID].dealerHand.push(newCard[0])
        blackJackHands[userID].dealerDummyHand.push(newCard[1])

        DealerHandValue(blackJackHands, userID)
    }

    //if the dealer has more than 21 they have busted. previous function will have checked for 11s and taken care of them so this is the true value
    if(Sum(blackJackHands[userID].dealerHand) > 21){
        blackJackHands[userID].dealerBust = true
    }

    return blackJackHands[userID].dealerBust
}

//used to create final game screen. Returns an embedded message
function GameEnd(blackJackHands, userID, buttonArray, master, message){
    const embed = require('./Functions/embed_functions')
    var title = `${master[userID].name} Game Outcome`
    var description = ""
    for (var i = 0; i < blackJackHands[userID].dealerDummyHand.length; i++) {
        description += `${blackJackHands[userID].dealerDummyHand[i] }`
    }

    description = ["**Dealer Hand**", description]
    var fields = []

    for (i = 0; i < blackJackHands[userID].playerHand.length; i++) {
        //if the hand actually has cards a field is made. The first hand always has cards so this only triggers when the player has split
        if(blackJackHands[userID].playerHand[i].length != 0){
            var singleDummyHandArray = GetHand(blackJackHands[userID].playerDummyHand[i])
            fields[i] = {name: `${master[userID].name} Hand ${i+1} (${blackJackHands[userID].bet[i]} gbp)`, value: singleDummyHandArray} 
        }        
    }

    var outcomeArray = []
    outcomeArray[0] = `Hand 1: ${blackJackHands[userID].playerHandOutcome[0]}`
    //only care about the outcome of the second hand if the player has split
    if(blackJackHands[userID].playerSplit){
        outcomeArray[1] = `Hand 2: ${blackJackHands[userID].playerHandOutcome[1]}`
    }

    fields[fields.length] = {name: 'Outcomes',value: outcomeArray}
    const embedMessage = embed.EmbedCreator(message, title, description, fields)
    ChangeButtonState(buttonArray, true)
    return embedMessage
}

//used to change enable/disable buttons
function ChangeButtonState(buttonArray, isDisabled){
    for (var i = 0; i < buttonArray.length; i++) {
       buttonArray[i].setDisabled(isDisabled)
    }
}

//sends an embedded message of the current state of the game
function UpdatedEmbedMessage(message, blackJackHands, userID, master, OUTCOMES){
    const embed = require('./Functions/embed_functions')

    var title = `${master[userID].name} Game Status`
    var description = ["**Dealer Hand**", `${blackJackHands[userID].dealerDummyHand[0]} ??`]

    var temp = blackJackHands[userID].playerDummyHand
    if(temp.length == 1){
        temp = blackJackHands[userID].playerDummyHand[0]
    }
    var fields = []
    for (var i = 0; i < blackJackHands[userID].playerDummyHand.length; i++) {
        if(blackJackHands[userID].playerDummyHand[i].length == 0){
            continue
        }        
    
        fields[i] = {name: `${master[userID].name} Hand ${i + 1} (${blackJackHands[userID].bet[i]} gbp)`, value: GetHand(blackJackHands[userID].playerDummyHand[i])}
    }

    if(!blackJackHands[userID].playerStay[0]){
        fields[0].name += "*"
    }else if(blackJackHands[userID].playerHandOutcome[0] == OUTCOMES.Blackjack){
        //idk
    }else if(DealerHandValue(blackJackHands, userID) == 21){
        //idk
    }else if(fields[1]){
        fields[1].name += "*"
    }


    if(fields.length == 1){
        fields = fields[0]
    }

    return embed.EmbedCreator(message, title, description, fields)
}

//sums values of array
function Sum(array){
    var sum = 0
    for (var i = 0; i < array.length; i++) {
        sum += array[i]
    }

    return sum
}

//compares the players hand to the dealers hand
//if player is greater it returns 1, if less -1, and if equal 0
function HandComparer(playerHand, dealerHand){
    return Math.sign(playerHand - dealerHand)
}

//used to convert hand array into a string that can be sent as an embedded message
function GetHand(handArray){
    var handString = ""
    for (var i = 0; i < handArray.length; i++) {
        handString += `${handArray[i]}`
    }

    return handString
}

//used to assign outcomes based on comparison of player and dealer hands
function OutcomeConditionCheck(blackJackHands, userID, index, OUTCOMES){

    if(blackJackHands[userID].playerHandOutcome[0] == OUTCOMES.Blackjack){
        return true
    }

    //if the player has busted, there is no reason to check the dealer hand
    if(blackJackHands[userID].playerBust[index]){
        blackJackHands[userID].playerHandOutcome[index] = OUTCOMES.Loss
        return true
    }

    //if player stayed on second hand. add cards until hard 17
    if(blackJackHands[userID].playerStay[index]){
        
        //ResolveDealerTurn returns true only when the dealer has busted
        if(ResolveDealerTurn(blackJackHands, userID)){
            blackJackHands[userID].playerHandOutcome[index] = OUTCOMES.Win
            return true
        }

        //if the player hand is greater than the dealer hand, the function returns a 1
        if(HandComparer(Sum(blackJackHands[userID].playerHand[index]), Sum(blackJackHands[userID].dealerHand)) == 1){
            blackJackHands[userID].playerHandOutcome[index] = OUTCOMES.Win
            return true
        }

        //if the player hand is equal to the dealer hand, the function returns a 0
        if(HandComparer(Sum(blackJackHands[userID].playerHand[index]), Sum(blackJackHands[userID].dealerHand)) == 0){
            blackJackHands[userID].playerHandOutcome[index] = OUTCOMES.Push
            return true
        }

        //if the player is greater than or equal to the dealer they must be less and the outcome is a loss
        blackJackHands[userID].playerHandOutcome[index] = OUTCOMES.Loss

        return true
    }

    //if the player hasnt stayed whether intentionally or via a bust, this returns false
    return false
}

//checks if player or dealer has blackjack when cards are dealt
function BlackJackChecker(blackJackHands, userID, OUTCOMES){
    var playerHandValue = PlayerHandValue(blackJackHands, userID, 0)
    var dealerHandValue = DealerHandValue(blackJackHands, userID)

    //if players both have it, its a push
    if(playerHandValue == dealerHandValue && playerHandValue == 21){
        blackJackHands[userID].playerStay[0] = true
        return
    }

    //if only player has it, they win and get a larger payout
    if(playerHandValue == 21){
        blackJackHands[userID].playerStay[0] = true
        blackJackHands[userID].playerHandOutcome[0] = OUTCOMES.Blackjack
        return
    }

    //if only dealer has it, player loses
    if(dealerHandValue == 21){
        blackJackHands[userID].playerStay[0] = true
        return
    }
}

//checks if player can split, double down, or surrender
function HandChecker(blackJackHands, userID, splitButton, doubleDownButton, surrenderButton){

    var dummyCard1 = blackJackHands[userID].playerDummyHand[0][0].slice(0, blackJackHands[userID].playerDummyHand[0][0].indexOf(":"))
    var dummyCard2 = blackJackHands[userID].playerDummyHand[0][1].slice(0, blackJackHands[userID].playerDummyHand[0][1].indexOf(":"))
    if(dummyCard1 != dummyCard2){
        ChangeButtonState([splitButton], true)
    }

    if(blackJackHands[userID].playerSplit){
        ChangeButtonState([splitButton, surrenderButton], true)
    }

    if(!blackJackHands[userID].playerStay[0]){
        if(blackJackHands[userID].playerDummyHand[0].length > 2){
            ChangeButtonState([splitButton, doubleDownButton, surrenderButton])
        }
    }else{
        if(blackJackHands[userID].playerDummyHand[1].length > 2){
            ChangeButtonState([splitButton, doubleDownButton, surrenderButton])
        }
    }
}

//checks if the hand is now over and if it is, sends game over message and clear game status
function isHandOver(blackJackHands, userID, OUTCOMES, hitButton, stayButton, doubleDownButton, splitButton, surrenderButton, message, master, reply, buttonRow, interaction, tracker, statsList){
    if(DealerHandResolved(blackJackHands, userID, OUTCOMES)){
        const gameOverEmbed = GameEnd(blackJackHands, userID, [hitButton, stayButton, doubleDownButton, splitButton, surrenderButton], master, reply)
        PayoutBets(blackJackHands, userID, OUTCOMES, message, master, tracker, statsList)
        if(interaction == null){
            reply.edit({
                embeds: [gameOverEmbed],
                components: [buttonRow]
            })
        }else{
            interaction.update({
                embeds: [gameOverEmbed],
                components: [buttonRow]
            })
        }
        //reset blackjack json for user so they can play a fresh game
        AddPlayerToHandsArray(blackJackHands, userID, 0, OUTCOMES)
        return true
    }

    return false
}