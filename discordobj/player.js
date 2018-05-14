function Player(member) {
  this.member = member;
  this.wins = 0;
  this.score = 0;
  this.guess = "";
  this.final = false;
}

module.exports = Player;
