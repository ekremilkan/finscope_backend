"use strict";

const { StatusCodes } = require("http-status-codes");
const baseResponse = require("../dto/baseresponse.dto");
const UserSegment = require("../models/userSegment.model");
const segmentationService = require("../services/segmentation.service");

exports.recompute = async (req, res) => {
  try {
    const windowParam = req.query.period || `${process.env.SEGMENT_WINDOW_DAYS || 90}d`;
    const windowDays = parseInt(String(windowParam).replace("d", ""), 10) || 90;
    const result = await segmentationService.recomputeAllUsers({ windowDays });
    return res.status(StatusCodes.OK).json({
      ...baseResponse,
      code: StatusCodes.OK,
      data: result,
      message: "Segments recompute completed",
      timestamp: new Date(),
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message || "Recompute failed",
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      timestamp: new Date(),
    });
  }
};

exports.getUserSegment = async (req, res) => {
  try {
    const userId = req.params.userId;
    const windowParam = req.query.period || `${process.env.SEGMENT_WINDOW_DAYS || 90}d`;
    const window = String(windowParam);
    const seg = await UserSegment.findOne({ userId, chain: "ethereum", window }).lean();
    if (!seg) {
      return res.status(StatusCodes.NOT_FOUND).json({
        ...baseResponse,
        success: false,
        error: true,
        message: "Segment not found",
        code: StatusCodes.NOT_FOUND,
      });
    }
    return res.status(StatusCodes.OK).json({
      ...baseResponse,
      code: StatusCodes.OK,
      data: seg,
      message: "User segment fetched",
      timestamp: new Date(),
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message || "Fetch failed",
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      timestamp: new Date(),
    });
  }
};

exports.getDistribution = async (req, res) => {
  try {
    const windowParam = req.query.period || `${process.env.SEGMENT_WINDOW_DAYS || 90}d`;
    const window = String(windowParam);
    const docs = await UserSegment.find({ chain: "ethereum", window })
      .select("compositeScore class")
      .lean();

    const counts = { A: 0, B: 0, C: 0, D: 0 };
    const scores = [];
    for (const d of docs) {
      scores.push(d.compositeScore || 0);
      if (d.class && counts[d.class] !== undefined) counts[d.class] += 1;
    }

    return res.status(StatusCodes.OK).json({
      ...baseResponse,
      code: StatusCodes.OK,
      data: { total: docs.length, counts, scores },
      message: "Distribution fetched",
      timestamp: new Date(),
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ...baseResponse,
      success: false,
      error: true,
      message: error.message || "Distribution failed",
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      timestamp: new Date(),
    });
  }
}; 