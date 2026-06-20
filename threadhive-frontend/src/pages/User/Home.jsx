import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchThreads } from '../../reducers/threadSlice';
import RightSidebar from '../../components/RightSidebar/RightSidebar';
import CreateThreadForm from '../../components/Forms/CreateThreadForm';
import FilterSortBar from '../../components/Shared/FilterSortBar';
import PaginationComponent from '../../components/Shared/PaginationComponent';
import ThreadList from '../../components/ThreadList/ThreadList';
import { Container, Card, Button, Row, Col } from "react-bootstrap";
import { fetchSubredditWithThreads } from '../../services/subredditService';
import { handleApiError } from '../../utils/handleApiError';
import './Home.css';

export default function Home() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const subredditId = searchParams.get('subreddit');
  
  const [showForm, setShowForm] = useState(false);
  const [subredditData, setSubredditData] = useState(null);
  const [loadingSubreddit, setLoadingSubreddit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'most-upvoted'
  const itemsPerPage = 5;

  const { threads, loading, error } = useSelector((state) => state.threads);

  // Load initial threads or subreddit-specific threads
  useEffect(() => {
    let isMounted = true;

    if (subredditId) {
      const loadSubredditThreads = async () => {
        setLoadingSubreddit(true);
        try {
          const data = await fetchSubredditWithThreads(subredditId);
          if (isMounted) {
            setSubredditData(data);
          }
        } catch (err) {
          if (isMounted) {
            handleApiError(err);
            setSubredditData(null);
          }
        } finally {
          if (isMounted) {
            setLoadingSubreddit(false);
          }
        }
      };
      loadSubredditThreads();
    } else {
      // Only fetch threads if not already loaded
      if (threads.length === 0 && !loading) {
        dispatch(fetchThreads());
      }
      setSubredditData(null);
    }
    
    setCurrentPage(1); // Reset to page 1 when subreddit changes

    return () => {
      isMounted = false;
    };
  }, [subredditId, dispatch]);

  // Get the display threads with updated vote counts from Redux
  const displayThreads = subredditData 
    ? (subredditData.threads ?? []).map(thread => {
        // Sync vote counts from Redux if available
        const reduxThread = threads.find(t => t._id === thread._id);
        return {
          ...thread,
          subreddit: subredditData.subreddit,
          voteCount: reduxThread ? reduxThread.voteCount : thread.voteCount
        };
      })
    : threads;

  const isLoading = subredditId ? loadingSubreddit : loading;

  // Sort threads based on selected option
  const sortedThreads = [...displayThreads].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'most-upvoted') {
      return b.voteCount - a.voteCount;
    }
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedThreads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentThreads = sortedThreads.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  return (
    <div className="home-wrapper">
      <Container fluid className="home-content">
        <Card className="border-0 rounded-3 shadow-sm mb-3">
          <Card.Body className="p-3 p-md-4">
            {/* Header with button */}
            <Row className="align-items-center mb-3">
              <Col>
                <h1 className="fs-4 fs-md-3 fw-bold mb-1" style={{ color: 'var(--text-dark)' }}>
                  {subredditData ? `r/${subredditData.subreddit.name}` : '🏠 Home Feed'}
                </h1>
                {subredditData?.subreddit?.description && (
                  <p className="small mb-0" style={{ color: 'var(--text-muted)' }}>
                    {subredditData.subreddit.description}
                  </p>
                )}
              </Col>
              <Col xs="auto">
                <Button
                  variant={showForm ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => setShowForm((prev) => !prev)}
                  style={{
                    backgroundColor: showForm ? undefined : 'var(--primary-blue)',
                    borderColor: showForm ? undefined : 'var(--primary-blue)',
                    fontWeight: '600'
                  }}
                >
                  {showForm ? "✕ Close" : "➕ Create"}
                </Button>
              </Col>
            </Row>

            {/* Sorting Options */}
            <FilterSortBar sortBy={sortBy} onSortChange={handleSortChange} />

            {/* Create Thread Form */}
            {showForm && (
              <Card className="mb-3 shadow-sm border-0 rounded-3" style={{ backgroundColor: 'var(--bg-light)' }}>
                <Card.Body className="p-3">
                  <CreateThreadForm
                    onClose={() => setShowForm(false)}
                  />
                </Card.Body>
              </Card>
            )}

            {/* Thread states */}
            {isLoading ? (
              <Card.Text className="text-muted text-center py-4">Loading threads...</Card.Text>
            ) : error ? (
              <Card.Text className="text-danger text-center py-4">Error: {error}</Card.Text>
            ) : displayThreads && displayThreads.length > 0 ? (
              <div className="px-0">
                <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                <ThreadList threadsToDisplay={currentThreads} />
                <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            ) : (
              <Card.Text className="text-muted text-center py-4">No threads found.</Card.Text>
            )}
          </Card.Body>
        </Card>
      </Container>

      <RightSidebar />
    </div>
  );
}