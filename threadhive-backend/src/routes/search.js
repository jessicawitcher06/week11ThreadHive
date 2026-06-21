import express from "express";
import { search } from "../controllers/searchController.js";
import authHandler from "../middleware/authHandler.js";

const router = express.Router();

router.get("/", authHandler, search);

export default router;
