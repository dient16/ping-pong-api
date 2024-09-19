import express from "express";
import axios from "axios";
import pLimit from "p-limit";
import dotenv from "dotenv";
import cron from "node-cron";
import morgan from "morgan";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8058;

const apiURLs = process.env.API_URLS ? process.env.API_URLS.split("|") : [];
const otherServerURL = process.env.OTHER_SERVER_URL;
const cronInterval = process.env.CRON_INTERVAL || 20;

const limit = pLimit(Number.parseInt(process.env.LIMIT, 10) || 5);

app.use(morgan("combined"));

let requestCount = 0;

const callApis = async () => {
  try {
    const apiCalls = apiURLs.map((apiURL) =>
      limit(async () => {
        try {
          const response = await axios.get(apiURL, { timeout: 5000 });
          requestCount++;
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
    requestCount++;
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
  res.send(`pong - Total requests made: ${requestCount}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  cron.schedule(`*/${cronInterval} * * * * *`, async () => {
    console.log(
      `Calling other server and APIs every ${cronInterval} seconds...`
    );
    await callOtherServerAndApis();
  });
});
