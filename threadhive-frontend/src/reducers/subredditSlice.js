import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchSubreddits as fetchSubredditsAPI } from '../services/subredditService';
import { handleApiError } from '../utils/handleApiError';

const initialState = {
  subreddits: [],
  loading: false,
  error: null,
};

// Async thunk to fetch all subreddits
export const fetchSubreddits = createAsyncThunk(
  'subreddits/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchSubredditsAPI();
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  }
);

const subredditSlice = createSlice({
  name: 'subreddits',
  initialState,
  reducers: {
    clearSubreddits: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubreddits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubreddits.fulfilled, (state, action) => {
        state.loading = false;
        state.subreddits = action.payload;
      })
      .addCase(fetchSubreddits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSubreddits } = subredditSlice.actions;
export default subredditSlice.reducer;
