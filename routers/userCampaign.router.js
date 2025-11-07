const express = require("express");
const controller = require("../controllers/userCampaign.controller");
const middlewares = require("../middlewares/index");
const validation = require("../validations/userCampaign.validation");

const router = express.Router();

// Create
router.post(
  "/",
  middlewares.authMiddleware,
  validation.validateCreate,
  controller.create
);

// Get one by user and campaign
router.get(
  "/:userId/:campaignId",
  middlewares.authMiddleware,
  validation.validateGetOne,
  controller.getOne
);

// Update class
router.put(
  "/:userId/:campaignId/class",
  middlewares.authMiddleware,
  validation.validateUpdateClass,
  controller.updateClass
);

module.exports = { userCampaign: router };


