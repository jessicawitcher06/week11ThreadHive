import {
  fetchAllThreads,
  fetchThreadById,
  createNewThread,
  updateThreadById,
  deleteThreadById,
  generateThreadSummaryService,
  rephraseTextService,
} from "../services/threadService.js";
import { createAppError } from "../utils/createAppError.js";

// GET /api/threads
export const getAllThreads = async (req, res) => {
  const threads = await fetchAllThreads();
  res.status(200).json({
    success: true,
    message: "Threads fetched successfully",
    data: threads,
  });
};

// GET /api/threads/:id
export const getThreadByID = async (req, res) => {
  const thread = await fetchThreadById(req.params.id);
  res.status(200).json({
    success: true,
    message: "Thread fetched successfully",
    data: thread,
  });
};

// POST /api/threads
export const createThread = async (req, res) => {
  const { title, content, subreddit } = req.body;
  const author = req.user.userId;

  if(!title || !content || !subreddit) {
    throw createAppError("Title, content, and subreddit are required.", 400);
  }

  const populatedThread = await createNewThread(
    title,
    content,
    author,
    subreddit,
  );
  res.status(201).json({
    success: true,
    message: "Thread created successfully",
    data: populatedThread,
  });
};

// PUT /api/threads/:id

export const updateThread = async (req, res) => {
  const updatedThread = await updateThreadById(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: "Thread updated successfully",
    data: updatedThread,
  });
};

// DELETE /api/threads/:id
export const deleteThread = async (req, res) => {
  const deletedThread = await deleteThreadById(req.params.id);
  res.status(200).json({
    success: true,
    message: "Thread deleted successfully",
    data: deletedThread,
  });
};

//GenAI
export const generateThreadSummary = async (req, res) => {
  const threadId = req.params.id;
  const summary = await generateThreadSummaryService(threadId);

  res.status(200).json({
    success: true,
    message: 'Summary generated successfully',
    data: summary,
  });
};

export const rephraseText = async (req, res) => {
  const { text } = req.body;
  const rephrased = await rephraseTextService(text);

  res.status(200).json({
    success: true,
    message: 'Text rephrased successfully',
    data: rephrased,
  });
};
