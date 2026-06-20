import { Card, Form, Button } from "react-bootstrap";
import './CommentForm.css';

export default function CommentForm({ commentText, onCommentChange, onPostComment, disabled, onRephrase, rephrasing }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onPostComment) {
      onPostComment();
    }
  };

  return (
    <Card className="add-comment-section mb-4 border-0">
      <Card.Body>
        <h5 className="add-comment-title">Add a Comment</h5>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="commentTextarea" className="mb-3 position-relative">
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Write a comment..."
              value={commentText}
              onChange={onCommentChange || (() => {})}
              required
              className="comment-textarea pe-5"
            />
            {onRephrase && (
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                className="position-absolute"
                style={{ top: '0.75rem', right: '0.75rem' }}
                title="Rephrase comment with AI"
                disabled={rephrasing || !commentText?.trim()}
                onClick={onRephrase}
              >
                {rephrasing ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  '✨'
                )}
              </Button>
            )}
          </Form.Group>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={disabled || !commentText?.trim()}
            className="post-comment-btn"
          >
            📝 Post Comment
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
