import { useDispatch, useSelector } from 'react-redux';
import { upvoteThreadThunk, downvoteThreadThunk } from '../../reducers/threadSlice';
import { saveThreadThunk, unsaveThreadThunk } from '../../reducers/bookmarkSlice';
import { Link } from 'react-router-dom';
import { Container } from "react-bootstrap";
import VoteButtons from '../Shared/VoteButtons';
import './ThreadList.css';

export default function ThreadList({ threadsToDisplay }) {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.token ?? null);
  const savedThreadIds = useSelector(
    (state) => state.bookmarks?.savedThreadIds ?? [],
  );

  const handleUpvote = (threadId) => {
    dispatch(upvoteThreadThunk(threadId));
  };

  const handleDownvote = (threadId) => {
    dispatch(downvoteThreadThunk(threadId));
  };

  const handleBookmarkToggle = (threadId) => {
    if (savedThreadIds.includes(threadId)) {
      dispatch(unsaveThreadThunk(threadId));
    } else {
      dispatch(saveThreadThunk(threadId));
    }
  };

  return (
    <Container fluid className="px-0">
      {threadsToDisplay.map((thread) => {
        const isSaved = savedThreadIds.includes(thread._id);
        return (
          <div key={thread._id} className="thread-card">
            <div className="thread-card-body">
              {/* Voting Section */}
              <div className="vote-section">
                <VoteButtons
                  count={thread.voteCount}
                  onUpvote={() => handleUpvote(thread._id)}
                  onDownvote={() => handleDownvote(thread._id)}
                />
              </div>

              {/* Thread Info */}
              <div className="thread-content-section">
                <div className="thread-header">
                  <h5 className="thread-title">{thread.title}</h5>
                  <span className="subreddit-badge">
                    r/{thread.subreddit?.name || 'unknown'}
                  </span>
                </div>
                <p className="thread-text">{thread.content}</p>
                <div className="d-flex align-items-center gap-3">
                  <Link
                    to={`/thread/${thread._id}`}
                    className="view-thread-btn"
                  >
                    💬 View Comments
                  </Link>
                  {token && (
                    <button
                      className="bookmark-toggle-btn"
                      onClick={() => handleBookmarkToggle(thread._id)}
                      aria-label={isSaved ? 'Unsave thread' : 'Save thread'}
                    >
                      <i
                        className={`bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}`}
                      ></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </Container>
  );
}
