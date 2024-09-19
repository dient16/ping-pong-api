import express from "express";
import axios from "axios";
import pLimit from "p-limit";
import dotenv from "dotenv";
import morgan from "morgan";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8058;

const apiURLs = process.env.API_URLS ? process.env.API_URLS.split("|") : [];
const otherServerURL = process.env.OTHER_SERVER_URL;
const cronInterval = process.env.CRON_INTERVAL || 20;

const limit = pLimit(Number.parseInt(process.env.LIMIT, 10) || 5);

app.use(morgan("dev"));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const callApis = async () => {
  try {
    const apiCalls = apiURLs.map((apiURL) =>
      limit(async () => {
        try {
          const response = await axios.get(apiURL);
          console.log(`Response from ${apiURL}:`, response.data);
        } catch (error) {
          console.error(`Error calling ${apiURL}:`, error.message);
        }
      })
    );

    await Promise.all(apiCalls);
    console.log("All API calls completed.");
  } catch (error) {
    console.error("Error in API calls:", error.message);
  }
};

const callOtherServerAndApis = async () => {
  try {
    const response = await axios.get(otherServerURL);
    console.log(
      `Response from other server (${otherServerURL}):`,
      response.data
    );
    await callApis();
  } catch (error) {
    console.error(
      `Error during communication with other server:`,
      error.message
    );
  }
};

app.get("/ping", async (req, res) => {
  await delay(cronInterval * 1000);
  res.send("pong ");
  await callOtherServerAndApis();
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
