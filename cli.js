#!/usr/bin/env node

const http = require("./libs/http");
const parser = require("./libs/parser");

const scriptArgs = process.argv.slice(2);

let config;

try {
  const homeDir = require("os").homedir();
  config = require(`${homeDir}/.timeweb-genie.json`);
} catch (e) {
  console.error("Could not open ~/.timeweb-genie.json - PLease see README.md!");
  process.exit(1);
}

if (config.justificationTypes) {
  parser.setJustificationTypes(config.justificationTypes.split(","));
}

(async () => {
  try {
    http.setTimewebUrl(config.timewebUrl);
    await http.authenticate(config.username, config.password);
  } catch (e) {
    console.error("Failed to sign in - please verify your credentials!");
    process.exit(2);
  }

  let fromDate;
  let toDate;

  if (checkDateFormat(scriptArgs[0]) && checkDateFormat(scriptArgs[1])) {
    fromDate = scriptArgs[0];
    toDate = scriptArgs[1];
  } else {
    const now = new Date();
    fromDate = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    toDate = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }

  const timeCardHtml = await http.loadTimeCardHtml(fromDate, toDate);
  const dateTimes = parser.parseDateTimes(timeCardHtml);

  dateTimes.forEach((dateTime) => {
    console.log(
      dateTime.date,
      Math.round((dateTime.workingMinutes / 60 + Number.EPSILON) * 100) / 100
    );
  });
})();

function formatDate(date) {
  return (
    ("0" + date.getDate()).slice(-2) +
    "/" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "/" +
    date.getFullYear()
  );
}

function checkDateFormat(dateStr) {
  return /\d{2}\/\d{2}\/\d{4}/.test(dateStr);
}
