import express from "express";
import {
  getAllThreads,
  getThreadByID,
  createThread,
  updateThread,
  deleteThread,
  generateThreadSummary,
  rephraseText,
} from "../controllers/threadController.js";

import authHandler from "../middleware/authHandler.js";

const router = express.Router();

router.get("/", authHandler, getAllThreads);
router.post("/rephrase", authHandler, rephraseText);
router.get("/:id", authHandler, getThreadByID);
router.post("/", authHandler, createThread);
router.put("/:id", authHandler, updateThread);
router.delete("/:id", authHandler, deleteThread);
router.get("/:id/summary", authHandler, generateThreadSummary);

export default router;
