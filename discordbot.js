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
var voicechannel = undefined;
var voiceconnection = undefined;
var voicecurrent = undefined;
var quizmaster = undefined;

var currentquestion = 0;
var questionnumber = 15;
var playing = false;
var money = [0,100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000];
var loosemoney = [0,0,0,0,0,1000,1000,1000,1000,1000,32000,32000,32000,32000,32000,32000];

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

function CheckIfPlayersAreDone() {
  var playersDone = 0;
  discordPlayers.forEach(function (player, index,array) {
    if (player.final) {
      playersDone++;
    }
    if (index == array.length-1) {
      questionchannel.send("**" + playersDone + "/" + array.length + " have answered.**")
    }
  });
}
function getTopic() {
  return "Quizmaster: " + quizmaster.toString()  +  " Question " + currentquestion + "/" + questionnumber + " for $" + money[currentquestion];
}
function updateTopics() {
  if (quizmaster == undefined) {
    return "Please set a quiz master with `!qm`";
  }
  if (voicechannel == undefined) {
    return "Please set a voice channel with `!c v`";
  }
  if (questionchannel == undefined) {
    return "Please set a question channel with `!c q`";
  }
  questionchannel.setTopic(getTopic());
  if (guessingchannel == undefined) {
    return "Please set a guessing channel with `!c g`";
  }
  guessingchannel.setTopic(getTopic());
  return "Topics updated";
}

function Start() {
  if (voicechannel == undefined) {
    return "Please set a voice channel with `!c v`";
  }
  voicechannel.join().then(function (connection) {
    voiceconnection = connection;
    const starttheme = voiceconnection.playFile('./media/start.mp3');
  });
}

function UpdateMusic() {

}

function Idle(){

}

function NextQuestion() {
  currentquestion++;
  UpdateMusic()
}

function Win(player) {
  player.wins ++;
  return player.member.toString() + "gets " + money[currentquestion];
}

function Loose(player) {
  player.loses++;
  player.score += loosemoney[currentquestion];
  return player.member.toString() + "walks away with " + loosemoney[currentquestion];
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
  message.channel.send(updateTopics());
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
registerCommand("guess", function (message, param) {
  if (param.length !== 0) {
    var member = message.mentions.users.first(1);
  }else{
    var member = message.member;
  }
  var player = getPlayer(message.member.id,function (player) {
    message.channel.send("**" + member.toString() + "**\nGuess:" + player.guess);
  });
});

registerCommand("check", function (message, param) {
  message.channel.send(updateTopics());
});

registerCommand("start", function (message, param) {
 message.channel.send(Start());
});

registerCommand("idle", function (message, param) {
  message.channel.send(Idle());
});

registerCommand("nq", function (message, param) {
  message.channel.send(NextQuestion());
});

registerCommand("vol", function (message, param) {
  var volume = param.shift(1) %100;
  if (voicecurrent == undefined) {
    message.channel.send("Nothing is playing ");
  }
  voicecurrent.setVolume(volume/100)
  message.channel.send("Volume set to " + volume + "%");
});

var channelcmd = registerCommand("channel", function (message, param) {
  var type = param.shift(1);
  switch (type) {
    case "q":
    case "question":
      questionchannel = message.channel;
      questionchannel.send("question channel is set to " + questionchannel);
      break;
    case "g":
    case "guessing":
      guessingchannel = message.channel;
      guessingchannel.send("Guessing channel is set to " + guessingchannel);
      break;
    case "v":
    case "voice":
      if (message.member.voicechannel === null) {
        message.channel.send("Please join a voice channel.");
      }
      voicechannel =  message.member.voicechannel;
      message.channel.send("Voice channel set to " + voicechannel.name);
    break;
    default:
      message.channel.send("question or guessing");
  }
  message.channel.send(updateTopics());
});
channelcmd.addAlias("c");

registerCommand("answer", function (message, param) {
  if (questionchannel == undefined) {
    message.channel.send("Please set a question channel with `!c q`");
    return;
  }
  var answer = param.shift(1);
  if (answer == undefined) {
    questionchannel.send("Please specify the correct answer");
    return;
  }
  discordPlayers.forEach(function (player) {
    if (!player.final) {
      questionchannel.send(player.member.toString() + " did not answer.")
      return;
    }
    if (player.guess == answer) {
      questionchannel.send(Win(player));
      return;
    }
    else {
      questionchannel.send(Loose(player));
      return;
    }
  });
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
  if (message.channel == guessingchannel) {
    var user = getPlayer(message.member.id, function (player) {
    if (!player.final) {
      switch (message.content) {
        case "A":
        case "a":
        player.guess = "a";
        break;
        case "B":
        case "b":
        player.guess = "b";
        break;
        case "C":
        case "c":
        player.guess = "c";
        break;
        case "D":
        case "d":
        player.guess = "d";
        break;
        case "Final":
        case "FINAL":
        case "yes":
        case "Yes":
        case "YES":
        case "final":
        if (player.guess) {
          player.final = true;
          CheckIfPlayersAreDone();
        } else {
          message.channel.send("You need to guess first.")
        }
        break;
        default:

      }
    }
    if (player.final) {
      message.channel.send(message.member.toString() + " guessed " + player.guess);
    } else if (player.guess) {
        message.channel.send(message.member.toString() + "is that your `final` answer? ");
    }
  });
  }
});

module.exports = client;
