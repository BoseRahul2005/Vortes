const express = require("express");

const ragRouter = express.Router();

const { protectRoute } = require("../middleware/authMiddleware");

const { askRepository } = require("../controllers/ragController");

ragRouter.post("/ask", protectRoute, askRepository);

module.exports = ragRouter;
