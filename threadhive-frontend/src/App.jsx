import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSavedThreadsThunk } from './reducers/bookmarkSlice';
import BookmarkToast from './components/Shared/BookmarkToast';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Sidebar from './components/Sidebar/Sidebar';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/User/Home';
import ThreadPage from './pages/User/ThreadPage';
import Profile from './pages/User/Profile';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return window.innerWidth >= 768;
  });
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const darkMode = useSelector((state) => state.theme.darkMode);

  // Seed the user's saved-thread state once authenticated so bookmark icons
  // across the feed and single-thread view reflect the real saved state.
  useEffect(() => {
    if (token) {
      dispatch(fetchSavedThreadsThunk());
    }
  }, [token, dispatch]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Apply dark mode to the document
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="app-container">
          {token && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
          <main className="main-center-content">
            <Routes>
              <Route path="/" element={<Navigate to="/home" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/thread/:threadId"
                element={
                  <PrivateRoute>
                    <ThreadPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>
        </div>
        <Footer />
        <BookmarkToast />
      </div>
    </BrowserRouter>
  );
}

export default App;
