import { useCallback, useEffect, useRef, useState } from "react";
import { Navbar, Container, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../reducers/authSlice";
import { toggleDarkMode } from "../../reducers/themeSlice";
import { searchThreadsThunk, clearSearch } from "../../reducers/searchSlice";
import SearchDropdown from "./SearchDropdown";
import "./Header.css";

function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const darkMode = useSelector((state) => state.theme.darkMode);

  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Single reset used by every dismiss path (Escape, click-outside, result
  // click) so they all leave the input and store in the same clean state.
  const resetSearch = useCallback(() => {
    setDropdownOpen(false);
    setSearchQuery("");
    dispatch(clearSearch());
  }, [dispatch]);

  // Debounce a non-empty query before dispatching. Clearing is handled
  // synchronously in onChange, so this effect never dispatches on mount.
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed === "") return;

    const timer = setTimeout(() => {
      dispatch(searchThreadsThunk(trimmed));
      setDropdownOpen(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, dispatch]);

  // Close + reset on Escape. Only active while the dropdown is open so we
  // don't hijack Escape for the rest of the app.
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") resetSearch();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [resetSearch, dropdownOpen]);

  // Close + reset when clicking outside the search area.
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        resetSearch();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [resetSearch, dropdownOpen]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim() === "") {
      setDropdownOpen(false);
      dispatch(clearSearch());
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/register");
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };

  return (
    <Navbar className="header-navbar shadow-sm">
      <Container fluid className="header-container d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          {token && (
            <button
              className="hamburger-btn"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
          )}
          <h1 className="header-logo" onClick={() => navigate('/home')}>
            ThreadHive
          </h1>
        </div>
        {token && (
          <div className="header-search" ref={searchContainerRef}>
            <Form.Control
              type="search"
              placeholder="Search threads..."
              className="header-search-input"
              maxLength={200}
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchQuery.trim() !== "") setDropdownOpen(true);
              }}
              aria-label="Search threads"
            />
            {dropdownOpen && <SearchDropdown onClose={resetSearch} />}
          </div>
        )}
        <div className="d-flex align-items-center">
          <button
            className="dark-mode-toggle"
            onClick={handleToggleDarkMode}
            aria-label="Toggle dark mode"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          {token ? (
            <>
              <Button
                variant="link"
                className="user-profile-btn"
                onClick={handleProfileClick}
                aria-label={`Open profile for ${user?.name ?? 'User'}`}
              >
                <div className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <span className="user-name">
                  {user?.name ?? 'User'}
                </span>
              </Button>
              <Button className="btn-header btn-primary" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button className="btn-header btn-outline me-2" onClick={handleLogin}>
                Login
              </Button>
              <Button className="btn-header btn-primary" onClick={handleSignup}>
                Register
              </Button>
            </>
          )}
        </div>
      </Container>
    </Navbar>
  );
}

export default Header;
