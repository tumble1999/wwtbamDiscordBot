const Discord = require('discord.js');
const client = new Discord.Client();

const DiscordOBJ = require('./discordobj');
const DiscordServer = DiscordOBJ("server");
const DiscordCommand = DiscordOBJ("command");
const DiscordPlayer = DiscordOBJ("player");

var discordServers = [];
var discordCommands = [];
var discordPlayers = [];
var questionchannel = undefined;
var guessingchannel = undefined;
var quizmaster = undefined;
var question = 0;

function registerServer(server){
  discordServers.push(new DiscordServer(server.id,server.name));
}
function registerCommand(alias,cmdevent){
  var command = new DiscordCommand(alias,cmdevent);
  discordCommands.push(command);
  return command;
}

function registerPlayer(member){
  discordPlayers.push(new DiscordPlayer(member));
}

function getServer(guildID, callback){
  discordServers.forEach(server =>{
    if (guildID===server.id) {
      callback(server);
    }
  });
}
function getPlayer(userID, callback){
  discordPlayers.forEach(user => {
    if (userID===user.member.id) {
      callback(user);
    }
  });
}

registerCommand("ping",function (message, param) {
  message.channel.send('pong');
});

registerCommand("qm", function (message, param) {
  if (param.length == 0) {
    if (quizmaster == undefined) {
      message.channel.send("Please set a quizmaster.");
      return;
    }
    message.channel.send("Current Quizmaster is: " + quizmaster.toString());
    return;
  }
  quizmaster = message.mentions.users.first(1);
  message.channel.send("Quizmaster is set to " + message.mentions.users.first(1).toString());
});

registerCommand("me", function (message, param) {
  if (param.length !== 0) {
    var member = message.mentions.users.first(1);
  }else{
    var member = message.member;
  }
  var player = getPlayer(message.member.id,function (player) {
    message.channel.send("**" + member.toString() + "**\nWins:" + player.wins + "\nScore:" + player.score)
  });
});

registerCommand("channel", function (message, param) {
  var type = param.shift(1);
  switch (type) {
    case "question":
      if (param.length == 0) {
        if (questionchannel == undefined) {
          message.channel.send("Please set a question channel.");
          return;
        }
        message.channel.send("Current question channel is: " + questionchannel.toString());
        return;
      }
      questionchannel = message.mentions.channels.first(1);
      message.channel.send("question channel is set to " + questionchannel);
      break;
    case "guessing":
      if (param.length == 0) {
        if (guessingchannel == undefined) {
          message.channel.send("Please set a guessing channel.");
          return;
        }
        message.channel.send("Current guessingchannel channel is: " + guessingchannel.toString());
        return;
      }
      guessingchannel = message.mentions.channels.first(1);
      message.channel.send("Quessing channel is set to " + guessingchannel);
      break;
    default:
      message.channel.send("question or guessing");
  }
});

function getcommandsString(id){
  if (id == discordCommands.length) {
    return "";
  }
  return " * " + discordCommands[id].alias[0] + "\n"  + getcommandsString(id+1);
}

function getusersString(id){
  if (id == discordPlayers.length) {
    return "";
  }
  return " * " + discordPlayers[id].alias + "\n"  + getcommandsString(id+1);
}

registerCommand("help", function (message, param) {
  message.channel.send("**Commands**");
  message.channel.send("```" + getcommandsString(0) + "```");
});

client.on('ready', () => {
  console.log('I am ready!');
  client.guilds.forEach(guild =>{
    guild.me.setNickname("WhoWantsToBeAMillionare");
    registerServer(guild);
    guild.members.forEach(member =>{
      registerPlayer(member);
    });
  });
});

client.on('message', message => {
  if (message.member == message.guild.me) {
    return;
  }
  getServer(message.guild.id,function (server) {

    if (message.content.charAt(0) == server.oldprefix) {
      message.channel.send("Server prefix changed from " + server.oldprefix + " to " + server.prefix);
    }
    if (message.content.charAt(0) == server.prefix) {
      var commandWorked = false;

      var callback = function (command) {
        if (!commandWorked) {
          message.channel.send("Invalid command: `" + command + "`")
        }
      }
      var itemsProcessed = 0;
      discordCommands.forEach((command,index,array) => {
        if (commandWorked) {
          return;
        }
        commandWorked = commandWorked || command.execute(message);
        itemsProcessed++;
        if(itemsProcessed === array.length) {
          callback(message.content);
        }
      });
    }
  });
  if (message.channe;) {

  }
});

module.exports = client;
