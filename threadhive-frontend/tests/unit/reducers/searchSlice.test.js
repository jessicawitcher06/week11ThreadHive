import { describe, it, expect } from 'vitest';
import searchReducer, {
  searchThreadsThunk,
  clearSearch,
} from '../../../src/reducers/searchSlice';

describe('searchSlice', () => {
  const initialState = {
    results: [],
    query: '',
    loading: false,
    error: null,
  };

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = searchReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('searchThreadsThunk async thunk', () => {
    it('should handle pending state', () => {
      const action = searchThreadsThunk.pending('reqId', 'hello');
      const state = searchReducer(
        { ...initialState, results: [{ _id: '1' }], error: 'old' },
        action
      );

      expect(state.loading).toBe(true);
      expect(state.results).toEqual([]);
      expect(state.query).toBe('hello');
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const mockResults = [
        { _id: '1', title: 'First', subreddit: { name: 'webdev' } },
        { _id: '2', title: 'Second', subreddit: { name: 'react' } },
      ];

      const state = searchReducer(
        { ...initialState, loading: true, query: 'first' },
        searchThreadsThunk.fulfilled(mockResults, 'reqId', 'first')
      );

      expect(state.loading).toBe(false);
      expect(state.results).toEqual(mockResults);
      expect(state.results).toHaveLength(2);
    });

    it('should ignore a stale fulfilled response whose query no longer matches', () => {
      const stale = [{ _id: '1', title: 'Old', subreddit: { name: 'old' } }];

      // Current query has moved on to 'new'; a response for 'old' must be dropped.
      const state = searchReducer(
        { ...initialState, loading: true, query: 'new' },
        searchThreadsThunk.fulfilled(stale, 'reqId', 'old')
      );

      expect(state.results).toEqual([]);
      expect(state.loading).toBe(true);
    });

    it('should handle rejected state', () => {
      const errorMessage = 'Search failed';
      const state = searchReducer(
        { ...initialState, loading: true, query: 'query' },
        searchThreadsThunk.rejected(null, 'reqId', 'query', errorMessage)
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('clearSearch action', () => {
    it('should reset results, query, and error', () => {
      const previousState = {
        results: [{ _id: '1', title: 'Something' }],
        query: 'something',
        loading: false,
        error: 'Some error',
      };

      const state = searchReducer(previousState, clearSearch());

      expect(state.results).toEqual([]);
      expect(state.query).toBe('');
      expect(state.error).toBeNull();
    });
  });
});
