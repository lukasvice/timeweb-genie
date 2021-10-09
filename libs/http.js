const axios = require("axios");
const https = require("https");

// Disable SSL verification
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

let timewebUrl = "";
let cookies = null;

module.exports = {
  setTimewebUrl,
  authenticate,
  loadTimeCardHtml,
};

async function setTimewebUrl(url) {
  timewebUrl = url;
}

async function authenticate(username, password) {
  const response = await axios({
    url: timewebUrl,
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data: encodeFormData({
      AZIONE: "RICHIESTAAUTENTIFICAZIONE",
      USERNAME: username,
      PASSWORD: password,
    }),
    httpsAgent,
  });

  cookies = response.headers["set-cookie"];

  if (/name='USERNAME'/.test(response.data)) {
    throw new Error("Login failed");
  }

  return true;
}

async function loadTimeCardHtml(fromDate, toDate) {
  if (!cookies) {
    throw new Error("Not authenticated!");
  }

  const responseTimeCard = await axios({
    url: timewebUrl,
    method: "POST",
    headers: {
      Cookie: parseCookies(cookies),
    },
    data: encodeFormData({
      AZIONE: "CARTELLINO",
      DATAINIZIO: fromDate,
      DATAFINE: toDate,
    }),
    httpsAgent,
  });

  const data = responseTimeCard.data;

  return data;
}

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
