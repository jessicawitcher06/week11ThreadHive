import dotenv from 'dotenv';
dotenv.config();

import Thread from "../models/Thread.js";
import User from "../models/User.js";
import Subreddit from "../models/Subreddit.js";
import { createAppError } from "../utils/createAppError.js";
import Comment from '../models/Comment.js';
import { generateAIContent } from '../utils/aiProvider.js';

export const fetchAllThreads = async () => {
  const threads = await Thread.find()
    .populate({ path: "author", model: User })
    .populate({ path: "subreddit", model: Subreddit })
    .sort({ createdAt: -1 });

  return threads;
};

export const fetchThreadById = async (id) => {
  const thread = await Thread.findById(id)
    .populate({ path: "author" })
    .populate({ path: "subreddit" });

  if (!thread) {
    throw createAppError("Thread not found", 404);
  }

  return thread;
};

export const createNewThread = async (title, content, author, subreddit) => {
  const newThread = new Thread({ title, content, author, subreddit });
  await newThread.save();

  const populatedThread = await Thread.findById(newThread._id)
    .populate({ path: "subreddit", select: "name description" })
    .populate({ path: "author", select: "name" });

  if (!populatedThread) {
    throw createAppError("Failed to create thread", 500);
  }

  return populatedThread;
};

export const updateThreadById = async (id, updateData) => {
  const updatedThread = await Thread.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedThread) {
    throw createAppError("Thread not found", 404);
  }

  return updatedThread;
};

export const deleteThreadById = async (id) => {
  const deletedThread = await Thread.findByIdAndDelete(id);

  if (!deletedThread) {
    throw createAppError("Thread not found", 404);
  }

  return deletedThread;
};

//GenAI
export const generateThreadSummaryService = async (threadId) => {
  const thread = await Thread.findById(threadId);
  if (!thread) {
    throw createAppError('Thread not found', 404);
  }

  const comments = await Comment.find({ thread: threadId });

  const commentsText = comments
    .map((c, i) => `Comment ${i + 1} by ${c.user || 'Anonymous'}: ${c.content}`)
    .join('\n');

  const prompt = `You are an expert in summarizing online forum threads.
Summarize the following thread in one short line.
Return only the summary without additional commentary.

---
Title: ${thread.title}
Content: ${thread.content}
Comments:
${commentsText}`;

  const summary = await generateAIContent(prompt);

  if (!summary || summary.trim().length === 0) {
    throw createAppError('Failed to generate a valid thread summary', 500);
  }

  return summary.trim();
};

export const rephraseTextService = async (text) => {
  if (!text || typeof text !== 'string') {
    throw createAppError('Invalid or missing text input', 400);
  }

  const prompt = `You are an expert in rephrasing text.
Rephrase the following text in a clearer and more natural way.
Return only one improved version without explanations, lists, or formatting.
---
Text: "${text}"`;

  const result = await generateAIContent(prompt);

  if (!result || result.trim().length === 0) {
    throw createAppError('Failed to rephrase text', 500);
  }

  return result.trim();
};