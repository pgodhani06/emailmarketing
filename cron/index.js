

import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import campaignRouter from "./router/campaign.js";
import "./jobs/index.js";
import dotenv from "dotenv";
dotenv.config();


const app = express();
app.use(bodyParser.json());
app.use("/", campaignRouter);

await mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("mongoes connect successfully");
    app.listen(process.env.SERVER_PORT || 5005, async () => {
      console.log("running port:", process.env.SERVER_PORT || 5005);
    });
  })
  .catch((err) => {
    console.log("error:", err);
  });
