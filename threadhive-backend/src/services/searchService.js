import Thread from "../models/Thread.js";
import User from "../models/User.js";
import Subreddit from "../models/Subreddit.js";

// Neutralize MongoDB $text search operators so user input is treated as plain
// terms: double quotes delimit phrases and a leading "-" negates a term.
const sanitizeQuery = (query) =>
  query.replace(/"/g, " ").replace(/(^|\s)-+/g, "$1").trim();

export const searchThreads = async (query) => {
  const sanitized = sanitizeQuery(query);

  // If the query was nothing but operator characters there is nothing to match.
  if (sanitized === "") {
    return [];
  }

  const results = await Thread.find(
    { $text: { $search: sanitized } },
    { score: { $meta: "textScore" } },
  )
    .sort({ score: { $meta: "textScore" } })
    .populate({ path: "author", model: User, select: "name" })
    .populate({ path: "subreddit", model: Subreddit, select: "name" })
    .select("title content voteCount createdAt author subreddit")
    .limit(10);

  return results;
};
