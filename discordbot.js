const Discord = require('discord.js');
const client = new Discord.Client();
const SFXBot = require('./sfx.js');
const Saving = require('./saving.js');
const Questions = require('./questions.js');

const DiscordOBJ = require('./discordobj');
const DiscordServer = DiscordOBJ("server");
const DiscordCommand = DiscordOBJ("command");
const DiscordPlayer = DiscordOBJ("player");

const GUILD_ID = "445354780873850881";

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
var questionGenerated = false;
var money = [0,100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000];
var loosemoney = [0,0,0,0,0,1000,1000,1000,1000,1000,32000,32000,32000,32000,32000,32000];

var quizmasteronly = [];
var serveradmins = [];
var serveradminonly = [];

// setInterval(function () {
//   console.log("SAVING DATA...");
//   Save();
// },10000)

function registerServer(server){
  console.log("Registrating [SERVER]: \"" + server.name + "\" (" + server.id + ")");
  discordServers.push(new DiscordServer(server.id,server.name,server));
}
function registerCommand(alias,cmdevent){
  var command = new DiscordCommand(alias,cmdevent);
  console.log("Registrating [COMMAND]: \"" + command.alias[0] + "\"");
  discordCommands.push(command);
  return command;
}

function registerPlayer(member){
  if (isPlayerRegistered(member)) {
    return;
  }
  while (!isPlayerRegistered(member)) {
    var player = new DiscordPlayer(member)
    console.log("Registrating [PLAYER]: \"" + member.displayName + "\" (" + member.id + ")");
    discordPlayers.push(player);
  }
}

function isPlayerRegistered(member) {
  var found = false;
  if (discordPlayers == undefined) {
    return false;
  }
  for(var i = 0; i < discordPlayers.length; i++) {
      if (discordPlayers[i].member.id == member.id) {
          found = true;
          break;
      }
  }
  return found;
}

function getServer(guildID, callback){
  discordServers.forEach(server =>{
    if (guildID===server.guild.id) {
      callback(server);
    }
  });
}
function getPlayer(member, callback) {
  if (!isPlayerRegistered(member)) {
    return;
  }
  discordPlayers.forEach(user => {
    if (member.id===user.member.id) {
      callback(user);
      return;
    }
  });
}

function getMemberFromID(guildid,memberid, callback) {
  getServer(guildid, function (server) {
    server.guild.members.forEach(function (member) {
      if (member.id == memberid) {
        callback(member);
      }
    })
  });
}
function getChannelFromID(guildid,channelid, callback) {
  getServer(guildid, function (server) {
    server.guild.channels.forEach(function (channel) {
      if (channel.id == channelid) {
        callback(channel);
      }
    })
  });
}

function Load() {
  Saving.LoadPlayerData(function (data) {
    getMemberFromID(GUILD_ID, data.quizmaster, function (member) {
      quizmaster = member;
    });
    var players = [];
    if (data.playerdata == undefined) {
      return;
    }
    data.playerdata.forEach(function (player,index,array) {
      var tmpplayer = player;

      getMemberFromID(GUILD_ID,tmpplayer.member,function (member) {
        tmpplayer.member = member;
        players.push(tmpplayer);
      });

      if (index == array.length-1) {
        discordPlayers = players
      }
    });
  });
  Saving.LoadChannelData(function (data) {
    getChannelFromID(GUILD_ID, data.question,function (channel) {
      questionchannel = channel;
    });
    getChannelFromID(GUILD_ID, data.guessing,function (channel) {
      guessingchannel = data.guessing;
    });
    getChannelFromID(GUILD_ID, data.voice,function (channel) {
      voicechannel = data.voice;
    });
  });
}

function Save() {
  var saving = {
    quizmaster: quizmaster,
    playerdata: discordPlayers
  }
  var id = "";
  if (saving.quizmaster != undefined) {
    id = saving.quizmaster.id || "";
    saving.quizmaster = id;
  }
  id = "";

  for (var i = 0; i < saving.playerdata.length; i++) {
    if (saving.playerdata[i].member == undefined) {
      continue;
    }
    id = "";
    id = saving.playerdata[i].member.id || ""
    saving.playerdata[i].member = id ;
  }
  Saving.SavePlayerData(saving);

  saving = {
    question: questionchannel,
    guessing: guessingchannel,
    voice: voicechannel
  }

  id = "";
  if (questionchannel != undefined) {
    id = questionchannel.id || "";
    saving.questionchannel = id;
  }
  id = "";
  if (guessingchannel != undefined) {
    id = guessingchannel.id || "";
    saving.guessingchannel = id;
  }
  id = "";
  if (voicechannel != undefined) {
    id = voicechannel.id || "";
    saving.voicechannel = id;
  }

  Saving.SaveChannelData(saving);
}

function UpdateAdmins() {
  serveradmins = [];
  client.guilds.forEach(guild =>{
    guild.members.forEach(member =>{
      if (member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR,undefined,true,true)) {
        serveradmins.push(member)
      }
    });
  });
}

function UpdatePermissions() {
  UpdateAdmins();
  serveradminonly.forEach(function (command) {
    command.users = [];
      command.whitelist = true;
    serveradmins.forEach(function (serveradmin) {
      if (command.users.includes(serveradmin)) {
        return;
      }
      command.addUser(serveradmin);
    })
  });
  quizmasteronly.forEach(function (command) {
    command.users = []
    command.whitelist = true
    if (quizmaster != undefined) {
      command.addUser(quizmaster)
    }
    serveradmins.forEach(function (serveradmin) {
      if (command.users.includes(serveradmin)) {
        return;
      }
      command.addUser(serveradmin);
    })
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
  if (started) {
    return "Already started";
  }
  if (quizmaster == undefined) {
    return "Please set a quiz master with `!qm`";
  }
  if (questionchannel == undefined) {
    return "Please set a question channel with `!c q`";
  }
  if (voiceconnection == undefined) {
    return "Please set a voice channel with `!c v`";
  }
  Questions.GenerateQuestions();
  client.user.setPresence({ game: { name: 'Starting' }, status: 'dnd' })
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

function resetUsers() {
  discordPlayers.forEach(function (player) {
    player.guess = "";
    player.final = false;
  });
}

function End() {
  client.user.setPresence({ game: { name: 'Ending' }, status: 'dnd' })
  if (!started) {
    return;
  }
  started = false;
  currentquestion = 0;
  playing = false;

  discordPlayers.forEach(function (player) {
    player.score += player.gamescore;
    player.gamescore = 0;
  });
  PlaySong(__dirname + '/media/end.mp3', function () {
    resetUsers();
    client.user.setPresence({ game: { name: '!help' }, status: 'idle' })
    clearInterval(questionSongInterval);
    StopSong();
    if (voicecurrent != undefined) {
    voicecurrent.end();
    }
  });

}

function NextQuestion() {
  Questions.LoadQuestion();
  questionchannel.send("**Heres the question for $" + money[currentquestion] + " **");
  console.log("Current Question: " + currentquestion);
  playing = true;
  resetUsers();
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
  questionGenerated = false;
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

function Win(player) {
  player.wins ++;
  player.gamescore = money[currentquestion];
  if (player.member.voiceChannel == voicechannel) {

    player.member.guild.createChannel("lose-" + player.member.id, 'voice').then(function (channel) {
      player.member.setVoiceChannel(channel).then(function () {
        var filename = "win-q" + currentquestion;
        if (currentquestion < 5) {
          filename = "win-q5";
        }
        SFXBot.play(channel ,__dirname + "/media/win/" + filename + ".mp3",() => {
          player.member.setVoiceChannel(voicechannel).then(function () {
            channel.delete().then(function () {
              console.log("channel deleted");
            }).catch(console.log);
          }).catch(console.log);
        });
      }).catch(console.log);
    }).catch(console.log);
  }

  return player.member.toString() + " gets " + money[currentquestion];
}

function Loose(player) {
  player.loses++;
  player.gamescore = loosemoney[currentquestion];


  if (player.member.voiceChannel == voicechannel) {

    player.member.guild.createChannel("lose-" + player.member.id, 'voice').then(function (channel) {
      player.member.setVoiceChannel(channel).then(function () {
        var filename = "lose-q" + currentquestion;
        if (currentquestion < 6) {
          filename = "lose-q6";
        }
        SFXBot.play(channel ,__dirname + "/media/lose/" + filename + ".mp3",() => {
          player.member.setVoiceChannel(voicechannel).then(function () {
            channel.delete().then(function () {
              console.log("channel deleted");
            }).catch(console.log);
          }).catch(console.log);
        });
      }).catch(console.log);
    }).catch(console.log);
  }



  return player.member.toString() + " walks away with " + loosemoney[currentquestion];
}
serveradminonly.push(registerCommand("ping",function (message, param) {
  message.reply('pong');
}));

// serveradminonly.push(registerCommand("save",function (message, param) {
//   Save();
//   message.reply("Data saved");
// }));

serveradminonly.push(registerCommand("qm", function (message, param) {
  if (param.length == 0) {
    if (quizmaster == undefined) {
      message.channel.send("Please set a quizmaster. `!qm [mention]`");
      return;
    }
    message.channel.send("Current Quizmaster is: " + quizmaster.toString());
    return;
  }
  quizmaster = message.mentions.users.first(1);
  message.channel.send("Quizmaster is set to " + message.mentions.users.first(1).toString());
  message.channel.send(updateTopics());
  UpdatePermissions();
}));

registerCommand("me", function (message, param) {
  if (param.length !== 0) {
    var member = message.mentions.users.first(1);
  }else{
    var member = message.member;
  }
  var player = getPlayer(message.member,function (player) {
    message.channel.send("**" + member.toString() + "**\nWins:" + player.wins + "\nScore:" + player.score + (started ? ("\nCurrentGameScore: " + player.gamescore):""))
  });
});
registerCommand("guess", function (message, param) {
  if (param.length !== 0) {
    var member = message.mentions.users.first(1);
  }else{
    var member = message.member;
  }
  var player = getPlayer(message.member,function (player) {
    message.channel.send("**" + member.toString() + "**\nGuess:" + player.guess);
  });
});

quizmasteronly.push(registerCommand("setup", function (message, param) {
  message.channel.send(updateTopics());
}));


quizmasteronly.push(registerCommand("start", function (message, param) {
 message.channel.send(Start());
}));


quizmasteronly.push(registerCommand("tmp", function (message, param) {
  var tmp = discordPlayers;
  message.channel.send(JSON.stringify(discordPlayers, null, '\t'));
}));

quizmasteronly.push(registerCommand("lp", function (message, param) {
  message.channel.send(LetsPlay());
}));

quizmasteronly.push(registerCommand("end", function (message, param) {
  clearInterval(questionSongInterval);
  End();

}));

serveradminonly.push(registerCommand("vol", function (message, param) {
  var volume = param.shift(1) %100;
  if (voicecurrent == undefined) {
    message.channel.send("Nothing is playing ");
  }
  voicecurrent.setVolume(volume/100)
  message.channel.send("Volume set to " + volume + "%");
}));

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
      if (message.member.voiceChannel ===undefined) {
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
quizmasteronly.push(channelcmd);

quizmasteronly.push(registerCommand("question", function (message, param) {
  questionGenerated = true;
  var question = Questions.GetQuestion(currentquestion-1);
  var answers = Questions.GetAnswers()
  message.channel.send(question + "\n\n**A**: " + answers[0] + "\n**B**: " + answers[1] + "\n**C**: " + answers[2] + "\n**D**: " + answers[3]);
}));

quizmasteronly.push(registerCommand("answer", function (message, param) {
  if (questionchannel == undefined) {
    message.channel.send("Please set a question channel with `!c q`");
    return;
  }
  var answer = ""
  if (questionGenerated) {
    answer = Questions.getAnswer();
  } else{
    answer = param.shift(1);
  }
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
    if (player.member.id == quizmaster.id) {
      return;
    }
    if (!player.final) {
      questionchannel.send(player.member.toString() + " did not answer.");
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
}));

function getcommandsString(id,member){
  if (id == discordCommands.length) {
    return "";
  }
  if (discordCommands[id].whitelist && !discordCommands[id].users.includes(member)) {
    return getcommandsString(id+1,member);
  }
  return "\n"  + " * " + discordCommands[id].alias[0] + getcommandsString(id+1,member);
}

function getusersString(id){
  if (id == discordPlayers.length) {
    return "";
  }
  return "\n" + " * " + discordPlayers[id].alias + getusersString(id+1);
}

registerCommand("help", function (message, param) {
  UpdatePermissions();
  message.reply("\n**Commands**\n```" + getcommandsString(0, message.member) + "```");
});
registerCommand("paf", function (message, param) {
});

registerCommand("avatar", function (message, param) {
  var avatar = param.shift();
  if (avatar == undefined) {
    message.reply("Specify url.")
    return;
  }
  client.user.setAvatar(avatar).then((user) =>{
    message.reply("Avatar set");
  }).catch(message.reply);
  SFXBot.setAvatar(avatar).then((user)=> {
    message.reply("Avatar set");
  }).catch(message.reply);
});

serveradminonly.push(registerCommand("admins", function (message, param) {
  UpdateAdmins();
  function getadminsString(id){
    if (id == serveradmins.length) {
      return "";
    }
    return "\n" + " * " + serveradmins[id].displayName + getadminsString(id+1);
  }

  message.reply("\n**Admins**\n```" + getadminsString(0, message.member) + "```");
}));

client.on('ready', () => {
  console.log('I am ready!');
  client.user.setPresence({ game: { name: 'WWTBAM' }, status: 'invisible' });
  //Load();
  client.guilds.forEach(guild =>{
    guild.me.setNickname("WhoWantsToBeAMillionare");
    registerServer(guild);
    guild.members.forEach(member =>{
      if (member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR,undefined,true,true)) {
        serveradmins.push(member)
      }
      if (member.id == client.user.id || member.id == "445655382954868737") {
        return;
      }
      registerPlayer(member);
    });
    UpdatePermissions();
  });
  client.user.setPresence({ game: { name: '!help' }, status: 'idle' });
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
      function commandExecuter(command,message) {
        var output = false;
        try {
          output = command.execute(message);
        } catch (e) {
          output = false;
          message.reply(e);
        } finally {

        }
        return output;
      }

      var itemsProcessed = 0;
      discordCommands.forEach((command,index,array) => {
        if (commandWorked) {
          return;
        }
        commandWorked = commandWorked || commandExecuter(command,message);
        itemsProcessed++;
        if(itemsProcessed === array.length) {
          callback(message.content);
        }
      });
    }
  });
  if (message.channel == guessingchannel) {
    var user = getPlayer(message.member, function (player) {
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
