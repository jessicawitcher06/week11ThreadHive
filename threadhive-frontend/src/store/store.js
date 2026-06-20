import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../reducers/authSlice';
import threadReducer from '../reducers/threadSlice';
import selectedThreadReducer from '../reducers/selectedThreadSlice';
import commentReducer from '../reducers/commentSlice';
import themeReducer from '../reducers/themeSlice';
import subredditReducer from '../reducers/subredditSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    threads: threadReducer,             // all recent threads
    selectedThread: selectedThreadReducer, // current thread view
    comments: commentReducer,           // comments for current thread
    theme: themeReducer,                // dark mode theme
    subreddits: subredditReducer,       // all subreddits
  },
});
