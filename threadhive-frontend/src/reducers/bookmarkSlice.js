import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  saveThread,
  unsaveThread,
  fetchSavedThreads,
} from '../services/bookmarkService';
import { handleApiError } from '../utils/handleApiError';

const initialState = {
  savedThreadIds: [],
  savedThreads: [],
  loading: false,
  error: null,
};

export const saveThreadThunk = createAsyncThunk(
  'bookmarks/saveThread',
  async (threadId, thunkAPI) => {
    try {
      return await saveThread(threadId);
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  }
);

export const unsaveThreadThunk = createAsyncThunk(
  'bookmarks/unsaveThread',
  async (threadId, thunkAPI) => {
    try {
      return await unsaveThread(threadId);
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  }
);

export const fetchSavedThreadsThunk = createAsyncThunk(
  'bookmarks/fetchSavedThreads',
  async (_, thunkAPI) => {
    try {
      return await fetchSavedThreads();
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  }
);

const bookmarkSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {
    clearBookmarkError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // saveThreadThunk — optimistic add on pending, confirm on fulfilled, rollback on rejected
      .addCase(saveThreadThunk.pending, (state, action) => {
        const threadId = action.meta.arg;
        if (!state.savedThreadIds.includes(threadId)) {
          state.savedThreadIds.push(threadId);
        }
      })
      .addCase(saveThreadThunk.fulfilled, (state, action) => {
        state.savedThreadIds = action.payload.map((id) => id.toString());
      })
      .addCase(saveThreadThunk.rejected, (state, action) => {
        const threadId = action.meta.arg;
        state.savedThreadIds = state.savedThreadIds.filter(
          (id) => id !== threadId,
        );
        state.error = action.payload;
      })

      // unsaveThreadThunk — optimistic remove on pending, confirm on fulfilled, rollback on rejected
      .addCase(unsaveThreadThunk.pending, (state, action) => {
        const threadId = action.meta.arg;
        state.savedThreadIds = state.savedThreadIds.filter(
          (id) => id !== threadId,
        );
      })
      .addCase(unsaveThreadThunk.fulfilled, (state, action) => {
        state.savedThreadIds = action.payload.map((id) => id.toString());
      })
      .addCase(unsaveThreadThunk.rejected, (state, action) => {
        const threadId = action.meta.arg;
        if (!state.savedThreadIds.includes(threadId)) {
          state.savedThreadIds.push(threadId);
        }
        state.error = action.payload;
      })

      // fetchSavedThreadsThunk
      .addCase(fetchSavedThreadsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavedThreadsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.savedThreads = action.payload;
        state.savedThreadIds = action.payload.map((t) => t._id.toString());
      })
      .addCase(fetchSavedThreadsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Clear saved-thread state on logout so the next user on the same
      // browser never sees the previous user's bookmarks.
      .addCase('auth/logout', (state) => {
        state.savedThreadIds = [];
        state.savedThreads = [];
        state.error = null;
      });
  },
});

export const { clearBookmarkError } = bookmarkSlice.actions;
export default bookmarkSlice.reducer;
