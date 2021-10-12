const TIME_TYPE_START = "start";
const TIME_TYPE_END = "end";

class Parser {
  constructor(config = null) {
    this.justificationTypes = config.justificationTypes;
    this.dateTimes = [];
  }

  parseTimeCard(timeCardHtml) {
    this.dateTimes = this.#parseDateTimes(timeCardHtml);
  }

  getWorkingTimes() {
    return this.dateTimes.map(({ date, times }) => {
      let workingMinutes = null;
      try {
        workingMinutes = calculateWorkingTime(times);
      } catch (e) {
        console.error(e.message);
      }

      return {
        date,
        times,
        workingMinutes,
      };
    });
  }

  #parseDateTimes(timeCardHtml) {
    let dateTimes = [];

    const rowRegex =
      /<td[^>]+>(?:<font[^>]+>)?(\d{2}.\d{2}.\d{2})[^<]+(?:<\/font>)?<\/td>[\S\s]+?<\/tr>(?:<tr style="background-color:#EEEEEE"|<\/table>\W+<\/div>)/gi
    let rowMatches;

    while ((rowMatches = rowRegex.exec(timeCardHtml))) {
      const date = rowMatches[1];
      const row = rowMatches[0];

      const times = this.#parseRow(row);

      if (times.length) {
        dateTimes.push({
          date,
          times,
        });
      }
    }

    return dateTimes;
  }

  #parseRow(row) {
    const clockedTimes = this.#parseClockedTimes(row);
    const justificationTimes = this.#parseJustificationTimes(row);

    return mergeTimes(clockedTimes, justificationTimes);
  }

  #parseClockedTimes(row) {
    let times = [];

    const colRegex = /<td[^>]+>((?:[EU]\d{2}:\d{2}[\W<br>]+)+)<\/td>/i;
    let timesColMatches = colRegex.exec(row);

    if (timesColMatches) {
      const timesCol = timesColMatches[1];
      const timesRegex = /([EU])(\d{2}:\d{2})/g;

      let timesMatches;
      while ((timesMatches = timesRegex.exec(timesCol))) {
        times.push({
          type: timesMatches[1] === "E" ? TIME_TYPE_START : TIME_TYPE_END,
          time: timeHHMMToMinutes(timesMatches[2]),
        });
      }
    }

    return times;
  }

  #parseJustificationTimes(row) {
    let times = [];

    const htmlRegex = /onmouseover="return overlib\(event,(.*?),/i;
    const htmlMatches = htmlRegex.exec(row);

    if (htmlMatches) {
      const popupHtml = htmlMatches[1];
      const rowRegex = /<TR(.*?)<\/TR>/gi;

      let rowMatches;
      while ((rowMatches = rowRegex.exec(popupHtml))) {
        const row = rowMatches[1];

        const foundType = this.justificationTypes.find((type) =>
          row.includes(type)
        );

        if (foundType) {
          const timesRegex = /<TD>(\d{2}:\d{2})<\/TD>/gi;

          const timesMatchesStart = timesRegex.exec(row);
          const timesMatchesEnd = timesRegex.exec(row);

          times.push({
            type: TIME_TYPE_START,
            time: timeHHMMToMinutes(timesMatchesStart[1]),
          });
          times.push({
            type: TIME_TYPE_END,
            time: timeHHMMToMinutes(timesMatchesEnd[1]),
          });
        }
      }
    }

    return times;
  }
};

function timeHHMMToMinutes(time) {
  const parts = time.split(":");
  return +parts[0] * 60 + +parts[1];
}

function mergeTimes(time1, ...mergeTimes) {
  return time1
    .concat(...mergeTimes)
    .sort((timeA, timeB) => timeA.time - timeB.time);
}

function calculateWorkingTime(times) {
  let currentType = TIME_TYPE_END;
  let currentTime = 0;

  let time = times.reduce((workingTime, { type, time }) => {
    if (currentType === TIME_TYPE_END && type === TIME_TYPE_START) {
      currentTime = time;
      currentType = type;
      return workingTime;
    }
    if (currentType === TIME_TYPE_START && type === TIME_TYPE_END) {
      currentType = type;
      return workingTime + (time - currentTime);
    }
    throw new Error("Start and end times not matching");
  }, 0);

  // Use current time as end time, if last logged is a start time (= currently working)
  if (currentType === TIME_TYPE_START) {
    const now = new Date();
    time += (times[times.length - 1].time - now.getHours() * 60 + now.getMinutes())
  }

  return time
}

module.exports = Parser;
module.exports.TIME_TYPE_END = TIME_TYPE_END;
module.exports.TIME_TYPE_START = TIME_TYPE_START;
