import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BookmarkToast from '../../../src/components/Shared/BookmarkToast';
import bookmarkReducer from '../../../src/reducers/bookmarkSlice';

const createStore = (error = null) =>
  configureStore({
    reducer: { bookmarks: bookmarkReducer },
    preloadedState: {
      bookmarks: {
        savedThreadIds: [],
        savedThreads: [],
        loading: false,
        error,
      },
    },
  });

const renderToast = (error) =>
  render(
    <Provider store={createStore(error)}>
      <BookmarkToast />
    </Provider>,
  );

describe('BookmarkToast', () => {
  it('does not show a toast when there is no error', () => {
    renderToast(null);
    expect(screen.queryByText(/bookmark/i)).not.toBeInTheDocument();
  });

  it('shows the error message when bookmarks.error is set', () => {
    renderToast('Could not save bookmark');
    expect(screen.getByText('Could not save bookmark')).toBeInTheDocument();
  });

  it('clears the error from the store when dismissed', async () => {
    const store = createStore('Could not save bookmark');
    render(
      <Provider store={store}>
        <BookmarkToast />
      </Provider>,
    );

    await userEvent.click(screen.getByLabelText(/close/i));

    expect(store.getState().bookmarks.error).toBeNull();
  });
});
