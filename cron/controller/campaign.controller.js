import campaignModel from "../model/campaign.model.js";
import ApplicationError from "../utils/ApplicationError.js";

// Get all campaigns, optionally filtered by date (YYYY-MM-DD)
export const getCampaignsController = async (req, res) => {
  try {
    const { date } = req.query; // e.g., /campaigns?date=2026-01-26
    let filter = {};
    if (date) {
      // Match scheduledFor date (ignoring time)
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.scheduledFor = { $gte: start, $lt: end };
    }
    const data = await campaignModel.find(filter);
    res.status(200).json({
      success: true,
      mes: "Campaigns fetched successfully",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mes: "Get Campaigns Error",
      error: error,
    });
  }
};
