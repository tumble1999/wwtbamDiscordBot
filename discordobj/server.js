function DiscordServer(serverid, servername){
  this.id = serverid;
  this.name = servername;
  this.prefix = "!";
  this.commands = []
}

DiscordServer.prototype.setPrefix = function (newPrefix) {
  this.oldprefix = this.prefix;
  this.prefix = newPrefix;
};

module.exports = DiscordServer;
