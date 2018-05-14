const Discord = require('discord.js');
const client = new Discord.Client();
const SFXBot = require('./sfx.js');

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
var songPlaying = false;
var questionSongInterval = undefined;

var currentquestion = 0;
var questionnumber = 15;
var started = false;
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

      client.user.setPresence({ game: { name: 'for $' + money[currentquestion] }, status: 'online' })
  if (voiceconnection == undefined) {
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

function StopSong() {
  if (voicecurrent != undefined) {
    voicecurrent.end();
  }
}

function PlaySong(path, callback=function () {}) {
  if (voicecurrent != undefined) {
    StopSong();
  }
  voicecurrent = voiceconnection.playFile(path);
  voicecurrent.on("start",function () {
    songPlaying = true;
    console.log("Playing " + path + "...");
  });
  voicecurrent.on("end",function () {
    songPlaying = false;
    callback();
  });
}

function UpdateMusic() {
  if (songPlaying) {
    return;
  }
  if (!playing) {
    return;
  }
  if (currentquestion == 0) {
    PlaySong(__dirname + './media/collect-players.mp3');
    return;
  }
  if (currentquestion < 6) {
      PlaySong(__dirname + './media/question/q1-5.mp3');
      return;
  }
  if (currentquestion < 16) {
    PlaySong(__dirname + "./media/question/q" + currentquestion + ".mp3");
    return;
  }
}

function questionMusic() {
  questionSongInterval = setInterval(UpdateMusic, 1000)
}

function Start() {
  if (quizmaster == undefined) {
    return "Please set a quiz master with `!qm`";
  }
  if (questionchannel == undefined) {
    return "Please set a question channel with `!c q`";
  }
  if (voiceconnection == undefined) {
    return "Please set a voice channel with `!c v`";
  }
  started = true;
  currentquestion = 0;
  playing = true;
  updateTopics();
  client.user.setPresence({ game: { name: 'Collecting Players' }, status: 'idle' })
  PlaySong(__dirname + '/media/start.mp3', function () {
    questionchannel.send(quizmaster.toString() + " now please wait for players to join. then run `!lp`");
    questionMusic();
  });
  return "Starting Game";
}

function End() {
  client.user.setPresence({ game: { name: 'WWTBAM' }, status: 'idle' })
  clearInterval(questionSongInterval);
  StopSong();
  if (voicecurrent != undefined) {
  voicecurrent.end();
  }

  if (voiceconnection != undefined) {
  try {
    voiceconnection.disconect();
  } catch (e) {

  } finally {

  }
  }
}

function NextQuestion() {
  questionchannel.send("**Heres the question for $" + money[currentquestion] + " **");
  console.log("Current Question: " + currentquestion);
  playing = true;
  updateTopics();
  questionMusic();
}

function LetsPlay(message) {
  if (!started) {
    return "Please start the game with `!start`";
  }
  if (voiceconnection == undefined) {
    return "Please set a voice channel with `!c v`";
  }
  if (currentquestion==questionnumber+1) {
    End();
  }
  clearInterval(questionSongInterval);
  playing = false;
  StopSong();
  currentquestion++;

  var filename = "lets-play";
  if (currentquestion > 5) {
    filename = "lp-q" + currentquestion;
  }

  PlaySong(__dirname + "./media/letsplay/" + filename + ".mp3", function () {
    NextQuestion();
  });
  return "lets play";
}

function Idle(){
  playing = false;
}

function Win(player) {
  player.wins ++;
  // if (player.member.voiceChannel) {
  //   var channel = player.member.guild.createChannel("win-" + player.member.displayname, 'voice');
  //   player.member.setVoiceChannel(channel);
  //   var filename = "-q" + currentquestion;
  //   if (currentquestion < 5) {
  //     filename = "-q5";
  //   }
  //
  //   SFXBot.play(channel,"/win/" + filename + ".mp3",function () {
  //     player.member.setVoiceChannel(voiceChannel);
  //     channel.delete()
  //   });
  // }

  return "`" + player.member.toString() + "` gets " + money[currentquestion];
}

function Loose(player) {
  player.loses++;
  player.score += loosemoney[currentquestion];


  if (player.member.voiceChannel == voicechannel) {

    player.member.guild.createChannel("lose-" + player.member.id, 'voice').then(function (channel) {
      player.member.setVoiceChannel(channel).then(function () {
        var filename = "-q" + currentquestion;
        if (currentquestion < 5) {
          filename = "-q5";
        }
        SFXBot.play(channel ,__dirname + "/media/lose/" + filename + ".mp3",function () {
          channel.delete().then(function () {
            console.log("channel deleted");
          }).catch(console.log);
        });
      }).catch(function () {
        channel.delete().then(function () {
          console.log("channel deleted");
        }).catch(console.log);
      });
    }).catch(console.log);
  }



  return "`" + player.member.toString() + "` walks away with " + loosemoney[currentquestion];
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
registerCommand("lp", function (message, param) {
  message.channel.send(LetsPlay());
});

registerCommand("stop", function (message, param) {
  clearInterval(questionSongInterval);
  End();
  if (voicecurrent != undefined) {
  voicecurrent.end();
  }

  if (voiceconnection != undefined) {
    voiceconnection.disconect();
  }

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
      if (message.member.voiceChannel === null) {
        message.channel.send("Please join a voice channel.");
      }
      voicechannel = message.member.voiceChannel;
      message.member.voiceChannel.join().then(function (connection) {
        voiceconnection = connection;
        message.channel.send("Voice channel set to " + message.member.voiceChannel.name);
        message.channel.send("Raw voice channel: " + JSON.stringify(message.member.voiceChannel));
      });
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
  clearInterval(questionSongInterval);
  playing = false;
  StopSong();

  var filename = "fa-q" + currentquestion;
  if (currentquestion < 6) {
    filename = "fa-q6";
  }
  if (voiceconnection != undefined) {
    PlaySong(__dirname + "./media/fa/" + filename + ".mp3")
  }

  client.user.setPresence({ game: { name: 'Tallying answers' }, status: 'dnd' })

  discordPlayers.forEach(function (player) {
    if (player.member.voiceChannel != voicechannel) {
      return;
    }
    if (!player.final) {
      questionchannel.send("`" + player.member.toString() + "` did not answer.");
      questionchannel.send(Loose(player));
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
  client.user.setPresence({ game: { name: 'WWTBAM' }, status: 'invisible' });
  client.guilds.forEach(guild =>{
    guild.me.setNickname("WhoWantsToBeAMillionare");
    registerServer(guild);
    guild.members.forEach(member =>{
      if (member.id == client.user.id | member.id == SFXBot.client.user.id) {
        return;
      }
      registerPlayer(member);
    });
  });
  client.user.setPresence({ game: { name: 'WWTBAM' }, status: 'idle' });
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
