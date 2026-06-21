import { searchThreads } from "../services/searchService.js";
import { createAppError } from "../utils/createAppError.js";

// GET /api/search?q=<query>
export const search = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    throw createAppError("Search query is required", 400);
  }

  if (q.trim().length > 200) {
    throw createAppError("Query too long", 400);
  }

  const results = await searchThreads(q.trim());

  res.status(200).json({
    success: true,
    message: "Search results fetched successfully",
    data: results,
  });
};
