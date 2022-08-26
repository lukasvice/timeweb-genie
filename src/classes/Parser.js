const TIME_TYPE_START = "start";
const TIME_TYPE_END = "end";

class Parser {
  constructor(config = null) {
    this.justificationTypes = config.justificationTypes;
    this.justificationTypesToIgnore = config.justificationTypesToIgnore;
    this.dateTimes = [];
  }

  parseTimeCard(timeCardHtml) {
    this.dateTimes = this.#parseDateTimes(timeCardHtml);
  }

  getWorkingTimes() {
    return this.dateTimes.map(({ date, workingTimes, freeTimes }) => {
      let workingMinutes = null;
      let freeMinutes = null;

      try {
        workingMinutes = calculateWorkingTime(workingTimes);
        freeMinutes = calculateWorkingTime(freeTimes);
      } catch (e) {
        console.error(e.message);
      }

      return {
        date,
        workingTimes,
        freeTimes,
        workingMinutes,
        freeMinutes,
      };
    });
  }

  #parseDateTimes(timeCardHtml) {
    let dateTimes = [];

    const rowRegex =
      /<td[^>]+>(?:<font[^>]+>)?(\d{2}.\d{2}.\d{2})[^<]+(?:<\/font>)?<\/td>[\S\s]+?<\/tr>(?:<tr style="background-color:#EEEEEE"|<\/table>\W+<\/div>)/gi;
    let rowMatches;

    while ((rowMatches = rowRegex.exec(timeCardHtml))) {
      const date = rowMatches[1];
      const row = rowMatches[0];

      const { workingTimes, freeTimes } = this.#parseRow(row);

      if (workingTimes.length || freeTimes.length) {
        dateTimes.push({
          date,
          workingTimes,
          freeTimes,
        });
      }
    }

    return dateTimes;
  }

  #parseRow(row) {
    const clockedTimes = this.#parseClockedTimes(row);
    const { workingTimes, freeTimes } = this.#parseJustificationTimes(row);

    return {
      workingTimes: mergeTimes(clockedTimes, workingTimes),
      freeTimes,
    };
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
    let workingTimes = [];
    let freeTimes = [];

    const htmlRegex = /<th[^>]*>descrizione<\/th><th[^>]*>tipo<\/th>(.*?),/i;
    const htmlMatches = htmlRegex.exec(row);

    if (htmlMatches) {
      const popupHtml = htmlMatches[1];
      const rowRegex = /<TR(.*?)<\/TR>/gi;

      let rowMatches;
      while ((rowMatches = rowRegex.exec(popupHtml))) {
        const row = rowMatches[1];

        const timesRegex = /<TD>(\d{2}:\d{2})<\/TD><TD>(\d{2}:\d{2})<\/TD>/i;
        const timesMatches = timesRegex.exec(row);

        if (timesMatches) {
          const foundWorkingType = this.justificationTypes.find((type) =>
            row.includes(type)
          );

          const foundTypeToIgnore = this.justificationTypesToIgnore.find((type) =>
              row.includes(type)
          );

          if(foundTypeToIgnore){
            continue;
          }

          (foundWorkingType ? workingTimes : freeTimes).push(
            {
              type: TIME_TYPE_START,
              time: timeHHMMToMinutes(timesMatches[1]),
            },
            {
              type: TIME_TYPE_END,
              time: timeHHMMToMinutes(timesMatches[2]),
            }
          );
        }
      }
    }

    return {
      workingTimes,
      freeTimes,
    };
  }
}

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
    time +=
      now.getHours() * 60 + now.getMinutes() - times[times.length - 1].time;
  }

  return time;
}

module.exports = Parser;
module.exports.TIME_TYPE_END = TIME_TYPE_END;
module.exports.TIME_TYPE_START = TIME_TYPE_START;
