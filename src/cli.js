#!/usr/bin/env node

const Http = require("./classes/Http");
const Parser = require("./classes/Parser");
const {
  formatDate,
  checkDateFormat,
  minutesToHours,
  durationText,
} = require("./utils/dateTime");

const scriptArgs = process.argv.slice(2);

let config = {
  timewebUrl: null,
  username: null,
  password: null,
  justificationTypes: ["SMART WORKING", "23TELE TELEARBEIT"],
  targetWorkingHours: 7.5,
};

try {
  const homeDir = require("os").homedir();
  config = {
    ...config,
    ...require(`${homeDir}/.timeweb-genie.json`),
  };
} catch (e) {
  console.error("Could not open ~/.timeweb-genie.json - PLease see README.md!");
  process.exit(1);
}

const http = new Http({
  timewebUrl: config.timewebUrl,
});

const parser = new Parser({
  justificationTypes: config.justificationTypes,
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
  parser.parseTimeCard(timeCardHtml);

  const table = parser.getWorkingTimes().map((dateTime) => {
    const relativeMinutes =
      config.targetWorkingHours * 60 - dateTime.workingMinutes;

    return {
      Date: dateTime.date,
      Hours: minutesToHours(dateTime.workingMinutes),
      Time: durationText(dateTime.workingMinutes),
      "Diff Hours": minutesToHours(relativeMinutes),
      Diff: durationText(relativeMinutes),
    };
  });

  console.table(table);
})();
