const fs = require('fs');

var channelsFile = __dirname + "/data/channels.json";
var playersFile = __dirname + "/data/players.json";

function LoadPlayerData(callback=function (data) {}) {
  fs.readFile(playersFile,(err,data) => {
    if (err | data == "") {
      return {
        quizmaster: "",
        playerdata: []
      };
    }
    var playerdata = JSON.parse(data);
    callback(data);
  });
}

function SavePlayerData(playerData) {
  var data = JSON.stringify(playerData, null, '\t');
  fs.writeFile(playersFile, data, (err) => {
    if (err) {
      return "There was an error saving player data " + err;
    }
    return "Player data saved";
  });
}



function LoadChannelData(callback=function (data) {}) {
  fs.readFile(channelsFile,(err,data) => {
    if (err | data == "") {
      return {
        question: "",
        guessing: "",
        voice: ""
      };
    }
    var channelData = JSON.parse(data);
    callback(data);
  });
}

function SaveChannelData(channelData) {
  var data = JSON.stringify(channelData, null, '\t');
  fs.writeFile(channelsFile, data, (err) => {
    if (err) {
      return "There was an error saving channe; data " + err;
    }
    return "Channel data saved";
  });
}

function ExportData() {

}

function ImportData() {

}

module.exports = {
  LoadPlayerData:LoadPlayerData,
  SavePlayerData:SavePlayerData,
  LoadChannelData: LoadChannelData,
  SaveChannelData: SaveChannelData,
  ExportData:ExportData,
  ImportData: ImportData
}
