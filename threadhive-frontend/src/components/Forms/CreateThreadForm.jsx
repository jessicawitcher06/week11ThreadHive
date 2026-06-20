import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createThreadThunk, rephraseTextThunk } from '../../reducers/threadSlice';
import { fetchSubreddits as fetchSubredditsThunk } from '../../reducers/subredditSlice';
import { fetchSubreddits, createSubreddit } from '../../services/subredditService';
import { Form } from 'react-bootstrap';
import './CreateThreadForm.css';

export default function CreateThreadForm({ onClose }) {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subredditId, setSubredditId] = useState('');
  const [subreddits, setSubreddits] = useState([]);
  const [newSubredditName, setNewSubredditName] = useState('');
  const [newSubredditDescription, setNewSubredditDescription] = useState('');
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    fetchSubreddits()
      .then(setSubreddits)
      .catch(() => setSubreddits([]));
  }, []);

  const handleRephrase = async (field) => {
    try {
      if (field === 'title') setLoadingTitle(true);
      else setLoadingContent(true);

      const text = await dispatch(
        rephraseTextThunk(field === 'title' ? title : content)
      ).unwrap();

      if (field === 'title') setTitle(text);
      else setContent(text);
    } catch (err) {
      console.error('Error rephrasing:', err);
    } finally {
      if (field === 'title') setLoadingTitle(false);
      else setLoadingContent(false);
    }
  };

  const handleNewSubredditChange = (value) => {
    setNewSubredditName(value);
    if (value.trim()) {
      setSubredditId('');
    }
  };

  const handleSubredditSelect = (value) => {
    setSubredditId(value);
    if (value) {
      setNewSubredditName('');
      setNewSubredditDescription('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let subredditToUse = subredditId;

    // Create new subreddit first if needed
    if (newSubredditName.trim()) {
      if (!newSubredditDescription.trim()) {
        alert('Please provide a description for the new subreddit.');
        return;
      }

      const newSubreddit = await createSubreddit({
        name: newSubredditName,
        description: newSubredditDescription,
      });

      subredditToUse = newSubreddit._id;
      setSubreddits((prev) => [...prev, newSubreddit]);
      setSubredditId(newSubreddit._id);
      
      // Refresh Redux subreddit list so RightSidebar updates
      dispatch(fetchSubredditsThunk());
    }

    if (!subredditToUse) {
      alert('Please select or create a subreddit before posting.');
      return;
    }

    // Use Redux to create thread
    const resultAction = await dispatch(
      createThreadThunk({
        title,
        content,
        subreddit: subredditToUse,
      })
    );

    if (createThreadThunk.fulfilled.match(resultAction)) {
      onClose();
    } else {
      alert('Failed to create thread. Please try again.');
    }
  };

  return (
    <div className="create-thread-form px-0">
      <h3 className="form-title">✏️ Create New Thread</h3>
      <Form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group-custom">
          <label className="form-label-custom">Thread Title</label>
          <div className="position-relative">
            <input
              type="text"
              className="form-control-custom pe-5"
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm position-absolute end-0 top-50 translate-middle-y me-2"
              title="Rephrase title with AI"
              onClick={() => handleRephrase('title')}
              disabled={loadingTitle || !title.trim()}
            >
              {loadingTitle ? (
                <span className="spinner-border spinner-border-sm" role="status" />
              ) : (
                '✨'
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="form-group-custom">
          <label className="form-label-custom">Content</label>
          <div className="position-relative">
            <textarea
              className="form-control-custom form-textarea-custom pe-5"
              rows={4}
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm position-absolute end-0 me-2"
              style={{ top: '0.75rem' }}
              title="Rephrase content with AI"
              onClick={() => handleRephrase('content')}
              disabled={loadingContent || !content.trim()}
            >
              {loadingContent ? (
                <span className="spinner-border spinner-border-sm" role="status" />
              ) : (
                '✨'
              )}
            </button>
          </div>
        </div>

        {/* Subreddit Selection */}
        <div className="form-group-custom">
          <label className="form-label-custom">Community</label>
          {subreddits.length > 0 ? (
            <select
              className="form-control-custom"
              value={subredditId}
              onChange={(e) => handleSubredditSelect(e.target.value)}
              disabled={!!newSubredditName.trim()}
            >
              <option value="">Select a community</option>
              {subreddits.map((sr) => (
                <option key={sr._id} value={sr._id}>
                  r/{sr.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="form-hint">No communities found.</p>
          )}

          <div className="new-subreddit-section">
            <label className="form-label-custom mb-2">Or Create New Community</label>
            <input
              type="text"
              className="form-control-custom mb-2"
              placeholder={
                subredditId
                  ? 'Deselect above to create new'
                  : 'Enter community name'
              }
              value={newSubredditName}
              onChange={(e) => handleNewSubredditChange(e.target.value)}
              disabled={!!subredditId}
            />
            {newSubredditName && !subredditId && (
              <textarea
                className="form-control-custom"
                rows={2}
                placeholder="Describe your community"
                value={newSubredditDescription}
                onChange={(e) => setNewSubredditDescription(e.target.value)}
                required
              />
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="form-btn form-btn-primary">
            📝 Post Thread
          </button>
          <button type="button" className="form-btn form-btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </Form>
    </div>
  );
}
