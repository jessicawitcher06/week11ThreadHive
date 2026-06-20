// API Endpoints Configuration
// All paths are relative - the base URL is handled by axiosInstance.js

// Authentication API Endpoints
export const AUTH_API = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
};

// Thread API Endpoints
export const THREAD_API = {
  GET_ALL: "/threads",
  GET_BY_ID: (id) => `/threads/${id}`,
  CREATE: "/threads",
  UPVOTE: (id) => `/threads/${id}/upvote`,
  DOWNVOTE: (id) => `/threads/${id}/downvote`,
  SUMMARY: (id) => `/threads/${id}/summary`,
  REPHRASE: "/threads/rephrase",
};

// Comment API Endpoints
export const COMMENT_API = {
  GET_BY_THREAD: (threadId) => `/comments/thread/${threadId}`,
  CREATE: "/comments",
  UPVOTE: (id) => `/comments/${id}/upvote`,
  DOWNVOTE: (id) => `/comments/${id}/downvote`,
};

// Subreddit API Endpoints
export const SUBREDDIT_API = {
  GET_ALL: "/subreddits",
  GET_BY_ID: (id) => `/subreddits/${id}`,
  GET_WITH_THREADS: (id) => `/subreddits/${id}/threads`,
  CREATE: "/subreddits",
};
