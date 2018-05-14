const Discord = require('discord.js');
const client = new Discord.Client();

const DiscordOBJ = require('./discordobj');
const DiscordServer = DiscordOBJ("server");

var discordServers = [];

function registerServer(server){
  discordServers.push(new DiscordServer(server.id,server.name, server));
}

function getServer(guildID, callback){
  discordServers.forEach(server =>{
    if (guildID===server.id) {
      callback(server.guild);
    }
  });
}
function getChannel(guild, channelid, callback){
  guild.channels.forEach(function (channel) {
    if (channel.id == channelid) {
      callback(channel);
    }
  })
}

client.on('ready', () => {
  console.log('I am ready!');

  client.guilds.forEach(guild =>{
    guild.me.setNickname("SFX");
    registerServer(guild);
  });

});
const token = process.env.DISCORD_SFX_TOKEN || require('./config/token.js').sfxtoken;
client.login(token).then (
  module.exports = {
    play:function functionName(channelref, filename,callback) {
      getServer(channelref.guild.id,function (server) {
        getChannel(server,channelref.id,function (channel) {
          channel.join().then(function (connection) {
            console.log("sfx: " + filename);
            const dispatcher = connection.playFile(filename);
            dispatcher.on("end", function () {
              callback();
            })
          }).catch(console.log);
        });
      })
    },
    client:client
  }
);
