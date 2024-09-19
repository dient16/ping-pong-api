import express from "express";
import axios from "axios";
import pLimit from "p-limit";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8058;

const apiURLs = process.env.API_URLS ? process.env.API_URLS.split("|") : [];

const callApi = async (apiURL) => {
  try {
    const response = await axios.get(apiURL);
    console.log(`Response from ${apiURL}:`, response.data);
  } catch (error) {
    console.error(`Error calling ${apiURL}:`, error.message);
  }
};

const limit = pLimit(Number.parseInt(process.env.LIMIT, 10) || 5);

const callApisSimultaneouslyWithLimit = () => {
  setTimeout(() => {
    Promise.all(apiURLs.map((apiURL) => limit(() => callApi(apiURL))))
      .then(() => console.log("All API calls completed"))
      .catch((error) => console.error("Error in API calls:", error.message));
  }, 5000);
};
app.get("/ping", (req, res) => {
  callApisSimultaneouslyWithLimit();
  res.send("pong");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  callApisSimultaneouslyWithLimit();
});
