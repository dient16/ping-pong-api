import express from "express";
import axios from "axios";
import pLimit from "p-limit";
import dotenv from "dotenv";
import cron from "node-cron";
import chalk from "chalk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8058;

const apiURLs = process.env.API_URLS ? process.env.API_URLS.split("|") : [];
const otherServerURL = process.env.OTHER_SERVER_URL;

const limit = pLimit(Number.parseInt(process.env.LIMIT, 10) || 5);
let requestCount = 0;

const callApis = async () => {
  try {
    const apiCalls = apiURLs.map((apiURL) =>
      limit(async () => {
        try {
          const response = await axios.get(apiURL, { timeout: 5000 });

          console.log(chalk.green(`Response from ${apiURL}:`, response.data));
        } catch (error) {
          console.error(chalk.red(`Error calling ${apiURL}:`, error.message));
        }
      })
    );

    await Promise.all(apiCalls);
    console.log(chalk.blue("All API calls completed."));
  } catch (error) {
    console.error(chalk.red("Error in API calls:", error.message));
  }
};

const callOtherServerAndApis = async () => {
  try {
    const response = await axios.get(otherServerURL);
    requestCount++;
    console.log(
      chalk.green(
        `Response from other server (${otherServerURL}):`,
        response.data
      )
    );
    await callApis();
  } catch (error) {
    console.error(
      chalk.red(`Error during communication with other server:`, error.message)
    );
  }
};

app.get("/ping", async (req, res) => {
  console.log(chalk.yellow("Received ping"));

  res.send(chalk.magenta(`pong - Total requests made: ${requestCount}`));
});

app.listen(PORT, () => {
  console.log(chalk.cyan(`Server is running on http://localhost:${PORT}`));

  cron.schedule("*/5 * * * * *", async () => {
    console.log(
      chalk.yellow("Calling other server and APIs every 5 seconds...")
    );
    await callOtherServerAndApis();
  });
});
