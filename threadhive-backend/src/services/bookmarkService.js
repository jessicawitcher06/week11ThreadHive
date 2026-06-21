import Thread from '../models/Thread.js';
import User from '../models/User.js';
import { createAppError } from '../utils/createAppError.js';

export const saveThread = async (userId, threadId) => {
  const thread = await Thread.findById(threadId);
  if (!thread) {
    throw createAppError('Thread not found', 404);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { savedThreads: threadId } },
    { new: true },
  );

  return user.savedThreads;
};

export const unsaveThread = async (userId, threadId) => {
  const thread = await Thread.findById(threadId);
  if (!thread) {
    throw createAppError('Thread not found', 404);
  }

  const user = await User.findById(userId);
  const isSaved = user.savedThreads.some(
    (id) => id.toString() === threadId.toString(),
  );
  if (!isSaved) {
    throw createAppError('Thread not in saved list', 404);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $pull: { savedThreads: threadId } },
    { new: true },
  );

  return updatedUser.savedThreads;
};

export const getSavedThreads = async (userId) => {
  const user = await User.findById(userId).populate({
    path: 'savedThreads',
    select: 'title content voteCount createdAt author subreddit',
    populate: [
      { path: 'author', select: 'name' },
      { path: 'subreddit', select: 'name' },
    ],
  });

  return user.savedThreads.filter(Boolean);
};
