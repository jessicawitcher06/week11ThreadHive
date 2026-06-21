import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { upvoteThreadThunk, downvoteThreadThunk, generateSummaryThunk } from '../../reducers/threadSlice';
import { saveThreadThunk, unsaveThreadThunk } from '../../reducers/bookmarkSlice';
import { Card, Button, Row, Col, Stack } from "react-bootstrap";
import VoteButtons from '../Shared/VoteButtons';
import ThreadSummary from './ThreadSummary';
import './ThreadCard.css';

export default function ThreadCard({ thread, goBack }) {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.token ?? null);
  const savedThreadIds = useSelector(
    (state) => state.bookmarks?.savedThreadIds ?? [],
  );
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  if (!thread) return <div>No thread found</div>;

  const isSaved = savedThreadIds.includes(thread._id);

  const handleUpvote = () => {
    dispatch(upvoteThreadThunk(thread._id));
  };

  const handleDownvote = () => {
    dispatch(downvoteThreadThunk(thread._id));
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const action = await dispatch(generateSummaryThunk(thread._id));
      if (generateSummaryThunk.fulfilled.match(action)) {
        setSummary(action.payload.summary);
      }
    } catch (err) {
      // summary generation failed silently
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleBookmarkToggle = () => {
    if (isSaved) {
      dispatch(unsaveThreadThunk(thread._id));
    } else {
      dispatch(saveThreadThunk(thread._id));
    }
  };

  return (
    <Card className="single-thread-card">
      <Card.Body>
        {goBack && (
          <Button
            onClick={goBack}
            variant="link"
            size="sm"
            className="back-to-home-btn text-decoration-none"
          >
            <i className="bi bi-arrow-left me-2"></i>Back to Home
          </Button>
        )}

        <Row className="g-3">
          {/* Voting UI */}
          <Col xs="auto">
            <Stack gap={2} className="text-center vote-column">
              <VoteButtons
                count={thread.voteCount}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
              />
            </Stack>
          </Col>

          {/* Thread content */}
          <Col>
            <h3 className="thread-title">
              {thread.title}
            </h3>
            <p className="thread-content">
              {thread.content}
            </p>

            {/* Action buttons */}
            <div className="d-flex gap-2 mb-3 flex-wrap">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
              >
                <i className="bi bi-robot me-1"></i>
                {loadingSummary ? 'Generating...' : 'Generate Summary'}
              </Button>

              {token && (
                <Button
                  variant={isSaved ? 'secondary' : 'outline-secondary'}
                  size="sm"
                  onClick={handleBookmarkToggle}
                  aria-label={isSaved ? 'Unsave thread' : 'Save thread'}
                >
                  <i className={`bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'} me-1`}></i>
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
              )}
            </div>

            {/* AI Summary display */}
            {summary && <ThreadSummary summary={summary} />}

            <div className="d-flex gap-4 flex-wrap thread-meta mt-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-circle thread-meta-icon"></i>
                <span>
                  <strong className="thread-meta-author">{thread.author?.name ?? "Unknown"}</strong>
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-collection thread-meta-icon"></i>
                <span className="badge thread-meta-badge">
                  r/{thread.subreddit?.name ?? "unknown"}
                </span>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
