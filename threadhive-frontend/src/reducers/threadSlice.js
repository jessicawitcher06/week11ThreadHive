// src/reducers/threadSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchRecentThreads as fetchRecentThreadsAPI,
  upvoteThread,
  downvoteThread,
  createThread,
  generateSummary,
  rephraseText,
} from '../services/threadService';
import { handleApiError } from '../utils/handleApiError';

//Initial State
const initialState = {
  threads: [],
  loading: false,
  error: null,
  rephrasedText: '',
};

// Async Thunks
export const fetchThreads = createAsyncThunk(
  'threads/fetchThreads',
  async (_, thunkAPI) => {
    try {
      return await fetchRecentThreadsAPI();
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  }
);

export const createThreadThunk = createAsyncThunk(
  'threads/createThread',
  async (data, thunkAPI) => {
    try {
      const newThread = await createThread(data);
      return newThread;
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  }
);

export const upvoteThreadThunk = createAsyncThunk(
  'threads/upvote',
  async (threadId, thunkAPI) => {
    try {
      return await upvoteThread(threadId);
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  }
);

export const downvoteThreadThunk = createAsyncThunk(
  'threads/downvote',
  async (threadId, thunkAPI) => {
    try {
      return await downvoteThread(threadId);
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  }
);

export const generateSummaryThunk = createAsyncThunk(
  'threads/generateSummary',
  async (threadId, thunkAPI) => {
    try {
      const data = await generateSummary(threadId);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || 'Failed to generate summary'
      );
    }
  }
);

export const rephraseTextThunk = createAsyncThunk(
  'threads/rephrase',
  async (text, thunkAPI) => {
    try {
      const rephrased = await rephraseText(text);
      return rephrased;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || 'Failed to rephrase text'
      );
    }
  }
);

//Slice
const threadSlice = createSlice({
  name: 'threads',
  initialState,
  reducers: {
    addThread: (state, action) => {
      state.threads.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchThreads
      .addCase(fetchThreads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.loading = false;
        state.threads = action.payload;
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(createThreadThunk.fulfilled, (state, action) => {
        // Add new thread to the top
        state.threads.unshift(action.payload);
      })
      .addCase(createThreadThunk.rejected, (state, action) => {
        state.error = action.payload;
      })

      // upvoteThreadThunk
      .addCase(upvoteThreadThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.threads.findIndex(t => t._id === updated._id);

        if (index !== -1) {
          state.threads[index] = {
            ...state.threads[index],
            ...updated
          };
        }
      })

      // downvoteThreadThunk
      .addCase(downvoteThreadThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.threads.findIndex(t => t._id === updated._id);

        if (index !== -1) {
          state.threads[index] = {
            ...state.threads[index],
            ...updated
          };
        }
      })

      // generateSummaryThunk
      .addCase(generateSummaryThunk.fulfilled, (state, action) => {
        const { threadId, summary } = action.payload;
        const thread = state.threads.find((t) => t._id === threadId);
        if (thread) {
          thread.summary = summary;
        }
      })

      // rephraseTextThunk
      .addCase(rephraseTextThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(rephraseTextThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.rephrasedText = action.payload;
      })
      .addCase(rephraseTextThunk.rejected, (state) => {
        state.loading = false;
      });
  },
});

// Export actions and reducer
export const { addThread } = threadSlice.actions;
export const { threadReducer } = threadSlice;
export default threadSlice.reducer;
