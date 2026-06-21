import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import SearchDropdown from '../../../src/components/Header/SearchDropdown';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createMockStore = (searchState) => {
  return configureStore({
    reducer: {
      search: () => searchState,
    },
  });
};

const renderDropdown = (searchState, onClose = vi.fn()) => {
  const store = createMockStore(searchState);
  render(
    <Provider store={store}>
      <BrowserRouter>
        <SearchDropdown onClose={onClose} />
      </BrowserRouter>
    </Provider>
  );
  return onClose;
};

describe('SearchDropdown Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders a spinner when loading', () => {
    renderDropdown({ results: [], query: 'react', loading: true, error: null });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows the empty-state message when there are no results', () => {
    renderDropdown({ results: [], query: 'nomatch', loading: false, error: null });
    expect(
      screen.getByText(/No results found for "nomatch"\./i)
    ).toBeInTheDocument();
  });

  it('shows an error message when error is set', () => {
    renderDropdown({
      results: [],
      query: 'react',
      loading: false,
      error: 'Search failed',
    });
    expect(
      screen.getByText(/Search failed, please try again/i)
    ).toBeInTheDocument();
  });

  it('navigates to the thread and calls onClose when a result is clicked', async () => {
    const onClose = renderDropdown({
      results: [
        { _id: 'abc123', title: 'A great thread', subreddit: { name: 'webdev' } },
      ],
      query: 'great',
      loading: false,
      error: null,
    });

    await userEvent.click(screen.getByText('A great thread'));

    expect(mockNavigate).toHaveBeenCalledWith('/thread/abc123');
    expect(onClose).toHaveBeenCalled();
  });
});
