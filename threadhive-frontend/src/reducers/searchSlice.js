// src/reducers/searchSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { searchThreads } from '../services/searchService';
import { handleApiError } from '../utils/handleApiError';

const initialState = {
  results: [],
  query: '',
  loading: false,
  error: null,
};

export const searchThreadsThunk = createAsyncThunk(
  'search/searchThreads',
  async (query, thunkAPI) => {
    try {
      return await searchThreads(query);
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearSearch: (state) => {
      state.results = [];
      state.query = '';
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchThreadsThunk.pending, (state, action) => {
        state.loading = true;
        state.query = action.meta.arg;
        state.results = [];
        state.error = null;
      })
      .addCase(searchThreadsThunk.fulfilled, (state, action) => {
        // Ignore stale/cancelled responses (out-of-order resolves, or the
        // input was cleared while this request was in flight).
        if (action.meta.arg !== state.query) return;
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(searchThreadsThunk.rejected, (state, action) => {
        if (action.meta.arg !== state.query) return;
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
