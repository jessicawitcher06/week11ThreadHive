import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./SearchDropdown.css";

function SearchDropdown({ onClose }) {
  const navigate = useNavigate();

  const results = useSelector((state) => state.search.results);
  const loading = useSelector((state) => state.search.loading);
  const error = useSelector((state) => state.search.error);
  const query = useSelector((state) => state.search.query);

  const handleResultClick = (threadId) => {
    navigate(`/thread/${threadId}`);
    onClose();
  };

  let body;

  if (loading) {
    body = (
      <div className="search-dropdown-status">
        <Spinner animation="border" size="sm" role="status" />
      </div>
    );
  } else if (error) {
    body = (
      <div className="search-dropdown-status">
        Search failed, please try again
      </div>
    );
  } else if (results.length === 0) {
    body = (
      <div className="search-dropdown-status">
        No results found for "{query}".
      </div>
    );
  } else {
    body = (
      <ul className="search-dropdown-list">
        {results.map((thread) => (
          <li key={thread._id}>
            <button
              type="button"
              className="search-dropdown-item"
              onClick={() => handleResultClick(thread._id)}
            >
              <span className="search-dropdown-item-title">{thread.title}</span>
              <span className="search-dropdown-item-subreddit">
                r/{thread.subreddit?.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return <div className="search-dropdown">{body}</div>;
}

export default SearchDropdown;
