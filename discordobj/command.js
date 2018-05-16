function DiscordCommand(alias, cmdevent){
  this.alias = []
  this.alias.push(alias);
  this.cmdevent = cmdevent;
  this.whitelist = false;
  this.users = [];
}

DiscordCommand.prototype.addAlias = function (newalias) {
  this.alias.push(newalias);
};

DiscordCommand.prototype.addUser = function (newuser) {
  this.whitelist = true;
  this.users.push(newuser)
};
DiscordCommand.prototype.removeUser = function (id) {
  this.users[id] = null;
  if (this.users == []) {
    this.whitelist = false;
  }
};

DiscordCommand.prototype.execute = function (message) {
  var usercommand = message.content.split(" ");

  if (this.alias.includes(usercommand[0].substr(1))) {
    if (this.whitelist && !this.users.includes(message.member)) {
      var getUserList = function(index) {
        if (this.users==undefined || index == this.users.length) {
          return "";
        }
        if (index == this.resetUsers.length -1) {
          return " and " + this.users[index].toString() + getUserList(index+1);
        }
        if (index == 0) {
          return this.users[index].toString() + getUserList(index+1);
        }
        return ", " + this.users[index].toString() + getUserList(index+1);
      }
      message.channel.send("Only " + getUserList(0) + " can run this command.")
      return;
    }
    usercommand.shift();
    this.cmdevent(message, usercommand);
    return true;
  }
  return false;
};

module.exports = DiscordCommand;
