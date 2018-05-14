const webserverlog = require('webserver-log');

const discordbot = require('./discordbot.js');

const token = process.env.DISCORD_TOKEN || require('./config/token.js').token;

discordbot.login(token);
