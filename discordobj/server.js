function DiscordServer(serverid, servername,server=undefined){
  this.id = serverid;
  this.name = servername;
  this.prefix = "!";
  this.commands = []
  this.guild = server;
}

DiscordServer.prototype.setPrefix = function (newPrefix) {
  this.oldprefix = this.prefix;
  this.prefix = newPrefix;
};

module.exports = DiscordServer;
