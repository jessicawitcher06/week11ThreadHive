import { useSelector, useDispatch } from 'react-redux';
import { Toast, ToastContainer } from 'react-bootstrap';
import { clearBookmarkError } from '../../reducers/bookmarkSlice';

// Surfaces bookmark save/unsave failures. The slice rolls the optimistic UI
// change back on rejection; this shows the user why it reverted.
export default function BookmarkToast() {
  const dispatch = useDispatch();
  const error = useSelector((state) => state.bookmarks?.error ?? null);

  return (
    <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 1100 }}>
      <Toast
        show={Boolean(error)}
        onClose={() => dispatch(clearBookmarkError())}
        delay={4000}
        autohide
        bg="danger"
      >
        <Toast.Header closeButton>
          <strong className="me-auto">Bookmark</strong>
        </Toast.Header>
        <Toast.Body className="text-white">{error}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}
