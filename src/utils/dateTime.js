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
    return Math.round((minutes / 60 + Number.EPSILON) * 100) / 100
  }
}
