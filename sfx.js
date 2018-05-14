const Discord = require('discord.js');
const client = new Discord.Client();

module.exports = {
  play:function functionName(channel, filename,callback) {
    channel.join().then(function (connection) {
      const dispatcher = connection.playFile(__dirname + "./media/" + filename + ".mp3");
      dispatcher.on("end", function () {
        connection.disconect();
        callback();
      })
    });
  }
}


const token = process.env.DISCORD_SFX_TOKEN || require('./config/token.js').sfxtoken;
client.login(token);
