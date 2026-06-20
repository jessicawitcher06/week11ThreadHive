import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchThreadById as fetchThreadByIdAPI } from "../services/threadService";
import { upvoteThreadThunk, downvoteThreadThunk } from "./threadSlice";
import { handleApiError } from '../utils/handleApiError';

const initialState = {
  currentThread: null,
  loading: false,
  error: null,
};

// Async thunk
export const fetchThreadById = createAsyncThunk(
  "selectedThread/fetchById",
  async (threadId, { rejectWithValue }) => {
    try {
      const thread = await fetchThreadByIdAPI(threadId);
      return thread;
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  }
);

const selectedThreadSlice = createSlice({
  name: "selectedThread",
  initialState,
  reducers: {
    clearThread: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThreadById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThreadById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentThread = action.payload;
      })
      .addCase(fetchThreadById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(upvoteThreadThunk.fulfilled, (state, action) => {
        if (state.currentThread && state.currentThread._id === action.payload._id) {
          state.currentThread = {
            ...state.currentThread,
            voteCount: action.payload.voteCount,
          };
        }
      })
      .addCase(downvoteThreadThunk.fulfilled, (state, action) => {
        if (state.currentThread && state.currentThread._id === action.payload._id) {
          state.currentThread = {
            ...state.currentThread,
            voteCount: action.payload.voteCount,
          };
        }
      });

  },
});

export default selectedThreadSlice.reducer;
export const { clearThread } = selectedThreadSlice.actions;
