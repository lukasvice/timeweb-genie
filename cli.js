#!/usr/bin/env node

const Http = require("./classes/Http");
const Parser = require("./classes/Parser");
const { formatDate, checkDateFormat, minutesToHours } = require("./utils/dateTime");

const scriptArgs = process.argv.slice(2);

let config;

try {
  const homeDir = require("os").homedir();
  config = require(`${homeDir}/.timeweb-genie.json`);
} catch (e) {
  console.error("Could not open ~/.timeweb-genie.json - PLease see README.md!");
  process.exit(1);
}

const http = new Http({
  timewebUrl: config.timewebUrl
});

const parser = new Parser(http, {
  justificationTypes: config.justificationTypes?.split(",")
});

(async () => {
  try {
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
  parser.parseTimeCard(timeCardHtml)

  parser.getWorkingTimes().forEach((dateTime) => {
    console.log(
      dateTime.date,
      minutesToHours(dateTime.workingMinutes)
    );
  });
})();
