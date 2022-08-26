#!/usr/bin/env node

const Http = require("./classes/Http");
const Parser = require("./classes/Parser");
const TIME_TYPE_END = require("./classes/Parser").TIME_TYPE_END;
const TIME_TYPE_START = require("./classes/Parser").TIME_TYPE_START;
const {
  formatDate,
  checkDateFormat,
  minutesToHours,
  durationText,
  minutesToTime,
} = require("./utils/dateTime");

const scriptArgs = process.argv.slice(2);

let config = {
  timewebUrl: null,
  username: null,
  password: null,
  justificationTypes: [
    "SMART WORKING",
    "23TELE TELEARBEIT",
    "02DIGA AUSSENDIENST",
    "04SCHU SCHULUNG PASSIV",
    "S-FEÜB FEIERTAGSÜBERSTUNDEN",
    "SCHULUNG AKTIV",
    "ZUSÄTZLICHE ARBEITSZEIT",
  ],
  justificationTypesToIgnore: [
    "06ZAOA ZEITAUSGLEICH o. ABZUG",
  ],
  targetWorkingHours: 7.5,
  targetBreakMinutes: 60,
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
  justificationTypesToIgnore: config.justificationTypesToIgnore
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

  const totals = {
    workingMinutes: 0,
    freeMinutes: 0,
    relativeMinutes: 0,
  };

  const table = parser.getWorkingTimes().map((dateTime) => {
    const relativeMinutes =
      dateTime.workingMinutes +
      dateTime.freeMinutes -
      config.targetWorkingHours * 60;

    totals.workingMinutes += dateTime.workingMinutes;
    totals.freeMinutes += dateTime.freeMinutes;
    totals.relativeMinutes += relativeMinutes;

    return {
      Date: dateTime.date,
      "Working Hours": minutesToHours(dateTime.workingMinutes),
      "Working Time": durationText(dateTime.workingMinutes),
      "Free Time": durationText(dateTime.freeMinutes),
      "Diff Hours": minutesToHours(relativeMinutes),
      Diff: durationText(relativeMinutes),
      "Clock Out": minutesToTime(getClockOutTime(dateTime)),
    };
  });

  table.push(
    {},
    {
      Date: "TOTAL",
      "Working Hours": minutesToHours(totals.workingMinutes),
      "Working Time": durationText(totals.workingMinutes),
      "Diff Hours": minutesToHours(totals.relativeMinutes),
      Diff: durationText(totals.relativeMinutes),
    }
  );

  console.table(table);
})();

// TODO: move to own utility lib or class?
function getClockOutTime({ workingTimes, workingMinutes, freeMinutes }) {
  let time = null;

  if (workingTimes && workingTimes.length > 0) {
    const workingTime = workingTimes[workingTimes.length - 1];
    if (workingTime.type === TIME_TYPE_END) {
      time = workingTime.time;
    }
    if (workingTime.type === TIME_TYPE_START) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      time =
        nowMinutes +
        (config.targetWorkingHours * 60 - workingMinutes) +
        (nowMinutes < 720 || workingTimes.length < 2
          ? config.targetBreakMinutes
          : 0) +
        freeMinutes;
    }
  }

  return time;
}
