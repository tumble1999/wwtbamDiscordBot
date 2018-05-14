const Discord = require('discord.js');
const client = new Discord.Client();

module.exports = {
  play:function functionName(channel, filename,callback) {
    console.log("hi");
    channel.join().then(function (connection) {
      const dispatcher = connection.playFile(filename);
      dispatcher.on("end", function () {
        connection.disconect();
        callback();
      })
    }).catch(console.log);
  }
}


const token = process.env.DISCORD_SFX_TOKEN || require('./config/token.js').sfxtoken;
client.login(token);
