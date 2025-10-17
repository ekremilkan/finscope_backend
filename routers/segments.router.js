"use strict";

const express = require("express");
const controller = require("../controllers/segments.controller");
const middlewares = require("../middlewares/index");

const router = express.Router();

router.post(
  "/recompute",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  controller.recompute
);

router.get(
  "/user/:userId",
  middlewares.authMiddleware,
  controller.getUserSegment
);

router.get(
  "/distribution",
  middlewares.authMiddleware,
  middlewares.roleMiddleware.requireAdmin,
  controller.getDistribution
);

module.exports = { segments: router }; 