const express = require("express");
const axios = require("axios");
const pLimit = require("p-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8058;

const apiURLs = process.env.API_URLS ? process.env.API_URLS.split("|") : [];

app.get("/ping", (req, res) => {
  res.send("pong");
});

const callApi = async (apiURL) => {
  try {
    const response = await axios.get(apiURL);
    console.log(`Response from ${apiURL}:`, response.data);
  } catch (error) {
    console.error(`Error calling ${apiURL}:`, error.message);
  }
};

const limit = pLimit(process.env.LIMIT || 10);

const callApisSimultaneouslyWithLimit = () => {
  setInterval(() => {
    Promise.all(apiURLs.map((apiURL) => limit(() => callApi(apiURL))))
      .then(() => console.log("All API calls completed"))
      .catch((error) => console.error("Error in API calls:", error.message));
  }, 5000);
};

callApisSimultaneouslyWithLimit();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
