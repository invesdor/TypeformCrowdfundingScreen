var https = require('https');
var express = require('express');
var app = express();
var moment = require('moment');

const FIRST_STARTUP_FIELD = "listimage_42546286_choice";
const SECOND_STARTUP_FIELD = "listimage_42546287_choice";
const FIRST_VALUE_FIELD = "list_42546284_choice";
const SECOND_VALUE_FIELD = "list_42546285_choice";

const TYPEFORM_API_DELAY_MS = 30 * 1000;

const data = {
  lastDataReceived: null,
  startups: {}
};

app.get("/GetSummary", function (req, res) {
  res.send(data);
});

app.use(express.static('public'))

app.listen((process.env.PORT || 5000), function () {
  console.log("Listening on port " + (process.env.PORT || 5000));
  fetchTypeFormData();
});

function fetchTypeFormData() {
  console.info("-----");
  console.info("Trying to fetch TypeForm data. " + moment().format('YYYY-MM-DD HH:mm:ss'));
  const url = `https://api.typeform.com/v1/form/${process.env.TYPEFORM_ID}?key=${process.env.TYPEFORM_KEY}&completed=true&limit=1000`;
  let req = https.get(url, onTypeFormResponse);
  setTimeout(fetchTypeFormData, TYPEFORM_API_DELAY_MS);
}

function onTypeFormResponse(response) {
  console.info(`Received response from TypeForm. StatusCode: ${response.statusCode}`);

  if (response.statusCode !== 200) {
    console.error("Error received from TypeForm");
    return;
  }

  data.lastDataReceived = moment().format('YYYY-MM-DD HH:mm:ss');

  let body = "";
  response.setEncoding("utf8");
  response.on("data", chunk => {
    body += chunk;
  })
  response.on("end", () => {
    let json = JSON.parse(body);
    data.startups = {};
    json.responses.forEach(parseResponse);
  })
}

function parseResponse(response) {
  console.info("Received response " + response.token);

  if (!response.answers) {
    console.warn("No answers.");
  }

  const answers = response.answers;

  const startup1 = answers[FIRST_STARTUP_FIELD];
  const startup2 = answers[SECOND_STARTUP_FIELD];
  const value1 = answers[FIRST_VALUE_FIELD];
  const value2 = answers[SECOND_VALUE_FIELD];

  if (startup1 && value1) {
    console.info(`    Pledge to ${startup1}: ${value1}`)
    if (!data.startups[startup1]) data.startups[startup1] = {};
    if (!data.startups[startup1][value1]) data.startups[startup1][value1] = 0;
    data.startups[startup1][value1]++;
  }

  if (startup2 && value2) {
    console.info(`    Pledge to ${startup2}: ${value2}`)
    if (!data.startups[startup2]) data.startups[startup2] = {};
    if (!data.startups[startup2][value2]) data.startups[startup2][value2] = 0;
    data.startups[startup2][value2]++;
  }
}
