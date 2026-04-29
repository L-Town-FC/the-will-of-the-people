module.exports = {
    name: 'changelog',
    description: 'shows list of changes that were made in previous update with links to commits',
    execute(message) {
        try {
            var embed = require('./Functions/embed_functions');
            var https = require('https');
            var { execSync } = require('child_process');
            
            // Get repo info from git remote
            var repo = 'L-Town-FC/the-will-of-the-people';
            try {
                var remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
                var match = remote.match(/github\.com[:/](.+?)\.git$/);
                if (match) repo = match[1];
            } catch (e) {
                // Use default repo
            }
            
            // Fetch latest release via API
            var apiUrl = 'https://api.github.com/repos/' + repo + '/releases/latest';
            
            https.get(apiUrl, { headers: { 'User-Agent': 'Discord-Bot' } }, function(res) {
                var body = '';
                res.on('data', function(chunk) { body += chunk; });
                res.on('end', function() {
                    try {
                        var release = JSON.parse(body);
                        
                        if (!release.tag_name) {
                            return message.channel.send('No releases found.');
                        }
                        
                        // Extract changelog from release body
                        var changelogText = release.body || 'No changelog available.';
                        
                        // Truncate if too long for Discord embed
                        if (changelogText.length > 1024) {
                            changelogText = changelogText.substring(0, 1021) + '...';
                        }
                        
                        var fields = [{
                            name: 'Changes in ' + release.tag_name,
                            value: changelogText
                        }];
                        
                        var embedMessage = embed.EmbedCreator(message, 'Changelog', 'Released on ' + new Date(release.published_at).toLocaleDateString(), fields);
                        
                        message.channel.send({ embeds: [embedMessage] });
                        
                    } catch (parseErr) {
                        console.log(parseErr);
                        message.channel.send('Error parsing release data.');
                    }
                });
            }).on('error', function(err) {
                console.log(err);
                message.channel.send('Error fetching changelog.');
            });
            
        } catch (err) {
            console.log(err);
            message.channel.send('Error occurred in changelog.js');
        }
    }
};