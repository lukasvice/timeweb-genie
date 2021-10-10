const axios = require("axios");
const https = require("https");

module.exports = class {
  constructor(config) {
    this.timewebUrl = config.timewebUrl;

    this.httpsAgent = new https.Agent({
      rejectUnauthorized: config.disableSSL === false,
    });

    this.cookies = null;
  }

  async authenticate(username, password) {
    const response = await axios({
      url: this.timewebUrl,
      method: "post",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: encodeFormData({
        AZIONE: "RICHIESTAAUTENTIFICAZIONE",
        USERNAME: username,
        PASSWORD: password,
      }),
      httpsAgent: this.httpsAgent,
    });

    if (/name='USERNAME'/.test(response.data)) {
      throw new Error("Login failed");
    }

    this.cookies = response.headers["set-cookie"];
  }

  async loadTimeCardHtml(fromDate, toDate) {
    if (!this.cookies) {
      throw new Error("Not authenticated!");
    }

    const responseTimeCard = await axios({
      url: this.timewebUrl,
      method: "POST",
      headers: {
        Cookie: parseCookies(this.cookies),
      },
      data: encodeFormData({
        AZIONE: "CARTELLINO",
        DATAINIZIO: fromDate,
        DATAFINE: toDate,
      }),
      httpsAgent: this.httpsAgent,
    });

    const data = responseTimeCard.data;

    return data;
  }
};

function parseCookies(cookies) {
  return cookies
    .map((entry) => {
      const parts = entry.split(";");
      const cookiePart = parts[0];
      return cookiePart;
    })
    .join(";");
}

function encodeFormData(data) {
  return Object.keys(data).reduce(
    (str, key) => str + `&${key}=${encodeURIComponent(data[key])}`,
    ""
  );
}
