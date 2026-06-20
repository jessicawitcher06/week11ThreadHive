import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CommentForm from '../../../src/components/Comment/CommentForm';

describe('CommentForm Component', () => {
  it('renders the form title', () => {
    render(<CommentForm />);
    expect(screen.getByText(/add a comment/i)).toBeInTheDocument();
  });

  it('renders the comment textarea', () => {
    render(<CommentForm />);
    expect(screen.getByPlaceholderText(/write a comment.../i)).toBeInTheDocument();
  });

  it('renders the post comment button', () => {
    render(<CommentForm />);
    expect(screen.getByRole('button', { name: /post comment/i })).toBeInTheDocument();
  });

  it('textarea is required', () => {
    render(<CommentForm />);
    const textarea = screen.getByPlaceholderText(/write a comment.../i);
    expect(textarea).toBeRequired();
  });

  it('allows typing in textarea', async () => {
    render(<CommentForm />);
    const textarea = screen.getByPlaceholderText(/write a comment.../i);

    await userEvent.type(textarea, 'This is a test comment');
    expect(textarea).toHaveValue('This is a test comment');
  });

  it('calls onPostComment callback when form is submitted', async () => {
    const mockOnPostComment = vi.fn();
    const mockOnCommentChange = vi.fn();
    render(
      <CommentForm
        commentText="Test comment"
        onCommentChange={mockOnCommentChange}
        onPostComment={mockOnPostComment}
      />
    );

    const submitButton = screen.getByRole('button', { name: /post comment/i });
    await userEvent.click(submitButton);

    expect(mockOnPostComment).toHaveBeenCalledTimes(1);
  });

  it('has correct number of textarea rows', () => {
    render(<CommentForm />);
    const textarea = screen.getByPlaceholderText(/write a comment.../i);
    expect(textarea).toHaveAttribute('rows', '4');
  });

  describe('Rephrase with AI feature', () => {
    it('renders the rephrase button when onRephrase prop is provided', () => {
      render(<CommentForm commentText="hello" onRephrase={vi.fn()} />);
      expect(screen.getByTitle(/rephrase comment with ai/i)).toBeInTheDocument();
    });

    it('does not render the rephrase button when onRephrase prop is not provided', () => {
      render(<CommentForm commentText="hello" />);
      expect(screen.queryByTitle(/rephrase comment with ai/i)).not.toBeInTheDocument();
    });

    it('rephrase button is disabled when comment text is empty', () => {
      render(<CommentForm commentText="" onRephrase={vi.fn()} />);
      expect(screen.getByTitle(/rephrase comment with ai/i)).toBeDisabled();
    });

    it('rephrase button is enabled when comment text has content', () => {
      render(<CommentForm commentText="Some comment text" onRephrase={vi.fn()} />);
      expect(screen.getByTitle(/rephrase comment with ai/i)).not.toBeDisabled();
    });

    it('calls onRephrase when rephrase button is clicked', async () => {
      const mockOnRephrase = vi.fn();
      render(<CommentForm commentText="Test comment" onRephrase={mockOnRephrase} />);
      await userEvent.click(screen.getByTitle(/rephrase comment with ai/i));
      expect(mockOnRephrase).toHaveBeenCalledTimes(1);
    });

    it('rephrase button is disabled while rephrasing is in progress', () => {
      render(<CommentForm commentText="Test" onRephrase={vi.fn()} rephrasing={true} />);
      expect(screen.getByTitle(/rephrase comment with ai/i)).toBeDisabled();
    });

    it('shows loading spinner while rephrasing', () => {
      render(<CommentForm commentText="Test" onRephrase={vi.fn()} rephrasing={true} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
