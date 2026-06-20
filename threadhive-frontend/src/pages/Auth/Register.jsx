import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthState } from '../../reducers/authSlice.js';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, registrationSuccess } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(registerUser(form));
  };


  useEffect(() => {
    if (registrationSuccess) {
      alert('Registration successful!');
      dispatch(clearAuthState()); // clean up state
      navigate('/login');
    }
  }, [registrationSuccess, dispatch, navigate]);

  return (
    <Container
      fluid
      className="auth-container d-flex align-items-center justify-content-center py-5"
    >
      <Card className="auth-card shadow-lg border-0 rounded-4 p-4 p-md-5">
        <h2 className="auth-title">Register</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Floating className="mb-4">
            <Form.Control
              id="floatingName"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder=" "
              required
              className="auth-form-control"
            />
            <label htmlFor="floatingName" className="auth-form-label">Name</label>
          </Form.Floating>

          <Form.Floating className="mb-4">
            <Form.Control
              id="floatingEmail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder=" "
              required
              className="auth-form-control"
            />
            <label htmlFor="floatingEmail" className="auth-form-label">Email</label>
          </Form.Floating>

          <Form.Floating className="mb-4">
            <Form.Control
              id="floatingPassword"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder=" "
              required
              className="auth-form-control"
            />
            <label htmlFor="floatingPassword" className="auth-form-label">Password</label>
          </Form.Floating>

          {error && <div className="auth-error">{error}</div>}

          <Button
            type="submit"
            variant="primary"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <Spinner animation="border" size="sm" role="status" />
            ) : (
              <>
                <i className="bi bi-person-plus-fill me-2"></i>Register
              </>
            )}
          </Button>
        </Form>
      </Card>
    </Container>
  );
}

export default Register;
