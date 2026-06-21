import { describe, it, expect } from 'vitest';
import bookmarkReducer, {
  saveThreadThunk,
  unsaveThreadThunk,
  fetchSavedThreadsThunk,
  clearBookmarkError,
} from '../../../src/reducers/bookmarkSlice';

describe('bookmarkSlice', () => {
  const initialState = {
    savedThreadIds: [],
    savedThreads: [],
    loading: false,
    error: null,
  };

  describe('initial state', () => {
    it('has correct initial state', () => {
      expect(bookmarkReducer(undefined, { type: 'unknown' })).toEqual(
        initialState,
      );
    });
  });

  describe('saveThreadThunk', () => {
    it('pending — optimistically adds threadId to savedThreadIds', () => {
      const action = saveThreadThunk.pending('', 'thread-1');
      const state = bookmarkReducer(initialState, action);
      expect(state.savedThreadIds).toContain('thread-1');
    });

    it('pending — does not duplicate if already present', () => {
      const existing = { ...initialState, savedThreadIds: ['thread-1'] };
      const action = saveThreadThunk.pending('', 'thread-1');
      const state = bookmarkReducer(existing, action);
      expect(state.savedThreadIds.filter((id) => id === 'thread-1')).toHaveLength(1);
    });

    it('fulfilled — replaces savedThreadIds with server response', () => {
      const serverIds = ['thread-1', 'thread-2'];
      const action = saveThreadThunk.fulfilled(serverIds, '', 'thread-2');
      const state = bookmarkReducer(initialState, action);
      expect(state.savedThreadIds).toEqual(['thread-1', 'thread-2']);
    });

    it('fulfilled — converts ObjectId objects to strings', () => {
      const serverIds = [{ toString: () => 'thread-abc' }];
      const action = saveThreadThunk.fulfilled(serverIds, '', 'thread-abc');
      const state = bookmarkReducer(initialState, action);
      expect(state.savedThreadIds).toEqual(['thread-abc']);
    });

    it('rejected — removes the threadId (rollback)', () => {
      const withOptimistic = { ...initialState, savedThreadIds: ['thread-1'] };
      const action = saveThreadThunk.rejected(null, '', 'thread-1', 'error');
      const state = bookmarkReducer(withOptimistic, action);
      expect(state.savedThreadIds).not.toContain('thread-1');
    });

    it('rejected — sets error', () => {
      const action = saveThreadThunk.rejected(null, '', 'thread-1', 'Network error');
      const state = bookmarkReducer(initialState, action);
      expect(state.error).toBe('Network error');
    });
  });

  describe('unsaveThreadThunk', () => {
    it('pending — optimistically removes threadId from savedThreadIds', () => {
      const existing = { ...initialState, savedThreadIds: ['thread-1', 'thread-2'] };
      const action = unsaveThreadThunk.pending('', 'thread-1');
      const state = bookmarkReducer(existing, action);
      expect(state.savedThreadIds).not.toContain('thread-1');
      expect(state.savedThreadIds).toContain('thread-2');
    });

    it('fulfilled — replaces savedThreadIds with server response', () => {
      const serverIds = ['thread-2'];
      const action = unsaveThreadThunk.fulfilled(serverIds, '', 'thread-1');
      const state = bookmarkReducer(initialState, action);
      expect(state.savedThreadIds).toEqual(['thread-2']);
    });

    it('rejected — adds the threadId back (rollback)', () => {
      const withoutId = { ...initialState, savedThreadIds: ['thread-2'] };
      const action = unsaveThreadThunk.rejected(null, '', 'thread-1', 'error');
      const state = bookmarkReducer(withoutId, action);
      expect(state.savedThreadIds).toContain('thread-1');
    });
  });

  describe('clearBookmarkError', () => {
    it('resets error to null', () => {
      const withError = { ...initialState, error: 'Something failed' };
      const state = bookmarkReducer(withError, clearBookmarkError());
      expect(state.error).toBeNull();
    });
  });

  describe('auth/logout', () => {
    it('clears saved-thread state when the user logs out', () => {
      const populated = {
        savedThreadIds: ['thread-1', 'thread-2'],
        savedThreads: [{ _id: 'thread-1' }, { _id: 'thread-2' }],
        loading: false,
        error: 'stale error',
      };
      const state = bookmarkReducer(populated, { type: 'auth/logout' });
      expect(state.savedThreadIds).toEqual([]);
      expect(state.savedThreads).toEqual([]);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchSavedThreadsThunk', () => {
    it('pending — sets loading true', () => {
      const state = bookmarkReducer(initialState, fetchSavedThreadsThunk.pending());
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('fulfilled — populates savedThreads and derives savedThreadIds', () => {
      const threads = [
        { _id: 'thread-1', title: 'First', content: 'A' },
        { _id: 'thread-2', title: 'Second', content: 'B' },
      ];
      const action = fetchSavedThreadsThunk.fulfilled(threads, '');
      const state = bookmarkReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.savedThreads).toEqual(threads);
      expect(state.savedThreadIds).toEqual(['thread-1', 'thread-2']);
    });

    it('fulfilled — empty array clears savedThreads', () => {
      const withData = {
        ...initialState,
        savedThreads: [{ _id: 'thread-1' }],
        savedThreadIds: ['thread-1'],
      };
      const action = fetchSavedThreadsThunk.fulfilled([], '');
      const state = bookmarkReducer(withData, action);
      expect(state.savedThreads).toEqual([]);
      expect(state.savedThreadIds).toEqual([]);
    });

    it('rejected — sets loading false and error', () => {
      const action = fetchSavedThreadsThunk.rejected(null, '', undefined, 'Fetch failed');
      const state = bookmarkReducer({ ...initialState, loading: true }, action);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Fetch failed');
    });
  });
});
