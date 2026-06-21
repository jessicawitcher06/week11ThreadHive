import {
  saveThread,
  unsaveThread,
  getSavedThreads,
} from '../services/bookmarkService.js';

export const saveBookmark = async (req, res) => {
  const savedThreads = await saveThread(req.user.userId, req.params.threadId);
  res.status(200).json({
    success: true,
    message: 'Thread saved successfully',
    data: { savedThreads },
  });
};

export const unsaveBookmark = async (req, res) => {
  const savedThreads = await unsaveThread(req.user.userId, req.params.threadId);
  res.status(200).json({
    success: true,
    message: 'Thread unsaved successfully',
    data: { savedThreads },
  });
};

export const getBookmarks = async (req, res) => {
  const threads = await getSavedThreads(req.user.userId);
  res.status(200).json({
    success: true,
    message: 'Saved threads fetched successfully',
    data: threads,
  });
};
