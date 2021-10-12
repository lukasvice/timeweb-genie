module.exports = {
  formatDate(date) {
    return (
      ("0" + date.getDate()).slice(-2) +
      "/" +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      "/" +
      date.getFullYear()
    );
  },

  checkDateFormat(dateStr) {
    return /\d{2}\/\d{2}\/\d{4}/.test(dateStr);
  },

  minutesToHours(minutes) {
    return Math.round((minutes / 60 + Number.EPSILON) * 100) / 100;
  },

  durationText(minutes) {
    const hours = Math.trunc(minutes / 60);
    minutes = minutes - 60 * hours;

    return [`${hours}h`, `${minutes}m`].filter((n) => parseInt(n)).join(" ");
  },

  minutesToTime(minutes) {
    const hours = Math.trunc(minutes / 60);
    minutes = minutes - 60 * hours;

    return `${("0" + hours).slice(-2)}:${("0" + minutes).slice(-2)}`;
  },
};
