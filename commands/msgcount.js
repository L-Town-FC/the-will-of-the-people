module.exports = {
    name: 'msgcount',
    description: 'shows message count stats',
    execute(message, args, stats_list){
        const command = args[1] ? args[1].toLowerCase() : 'leaderboard';
        try{
            if(command === 'leaderboard'){
                ShowTopN(stats_list, message, 3)
            }else if(command === 'all'){
                ShowAll(stats_list, message)
            }else{
                message.channel.send("Usage: `!msgcount leaderboard` or `!msgcount all`")
            }
        }catch(err){
            console.log(err)
            message.channel.send("Error occurred in msgcount.js");
        }
    }
}

function ShowTopN(stats_list, message, limit){
    const sorted = Object.values(stats_list)
        .sort((a, b) => b.total_msgs - a.total_msgs)
        .slice(0, limit);

    let leaderboard = "```\nMessage Count Leaderboard (Top " + limit + "):\n\n";
    sorted.forEach((user, index) => {
        leaderboard += `${index + 1}. ${user.name}: ${user.total_msgs}\n`;
    });
    leaderboard += "```";

    message.channel.send(leaderboard);
}

function ShowAll(stats_list, message){
    const sorted = Object.values(stats_list)
        .sort((a, b) => b.total_msgs - a.total_msgs);

    let leaderboard = "```\nMessage Count (All users):\n\n";
    sorted.forEach((user, index) => {
        leaderboard += `${index + 1}. ${user.name}: ${user.total_msgs}\n`;
    });
    leaderboard += "```";

    message.channel.send(leaderboard);
}
