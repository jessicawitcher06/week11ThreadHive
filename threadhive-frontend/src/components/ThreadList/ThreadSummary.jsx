import { Card } from 'react-bootstrap';

export default function ThreadSummary({ summary }) {
  return (
    <Card className="mt-3 shadow-sm border-0 rounded-4">
      <Card.Body>
        <h6 className="mb-2 d-flex align-items-center" style={{ color: 'var(--text-muted)' }}>
          <i className="bi bi-robot me-2"></i>
          AI Summary
        </h6>
        <Card.Text className="mb-0">{summary}</Card.Text>
      </Card.Body>
    </Card>
  );
}
