import express from "express";
import { getCampaignsController } from "../controller/campaign.controller.js";

const router = express.Router();

// GET /campaigns?date=YYYY-MM-DD
router.get("/campaigns", getCampaignsController);

export default router;
