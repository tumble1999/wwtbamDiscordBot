const request = require('request');

var url = "https://opentdb.com/api.php?amount=16&type=multiple";
var questions = [];
var question = "";
var choices = "";
var choiceLabels = ["a","b","c","d"]
var answer = "";



function ShuffleAnswers(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function GenerateQuestions() {
  request({
    url: url,
    json: true,
    followAllRedirects: true
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {
      questions = body.results;
    }
  });
}

function LoadQuestion(id) {
  var questionData = questions[id];

  question = questionData.question;
  var options = questionData.incorrect_answers;
  options.push(questionData.correct_answer);
  ShuffleAnswers(options);
  choices = options;

  answer = choiceLabels[choices.indexOf(questionData.correct_answer)];
}

function GetQuestion() {
  return question;
}

function GetAnswers() {
  return choices;
}

function GetAnswer() {
  return answer;
}

module.exports = {
  GenerateQuestions: GenerateQuestions,
  LoadQuestion: LoadQuestion,
  GetQuestion: GetQuestion,
  GetAnswers: GetAnswers,
  GetAnswer: GetAnswer
};
