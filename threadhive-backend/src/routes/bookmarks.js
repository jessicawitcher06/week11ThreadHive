import express from 'express';
import {
  saveBookmark,
  unsaveBookmark,
  getBookmarks,
} from '../controllers/bookmarkController.js';
import authHandler from '../middleware/authHandler.js';

const router = express.Router();

router.get('/', authHandler, getBookmarks);
router.post('/:threadId', authHandler, saveBookmark);
router.delete('/:threadId', authHandler, unsaveBookmark);

export default router;
