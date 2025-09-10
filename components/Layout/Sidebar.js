'use client';

import { useState } from 'react';
import styles from './Sidebar.module.css';
import { useAppContext } from '../../app/context/AppContext'; // MODIFIED: Use our new context

export default function Sidebar({ activeView, setView }) {
  const { isAuthenticated, authenticate, logout, loading } = useAppContext(); // Get what we need from context
  const [localAuthKey, setLocalAuthKey] = useState(''); // State for the input field

  const postTypes = [
    { id: 'squad', label: 'Squad Announcement' },
    { id: 'matchDay', label: 'Match Day Announcement' },
    { id: 'result', label: 'Full-Time Result' },
  ];

  const handleAuth = () => {
    if (localAuthKey) {
      authenticate(localAuthKey);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAuth();
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div>
        <h1 className={styles.logo}>Social Automator</h1>
        <nav className={styles.nav}>
          <ul>
            {postTypes.map((post) => (
              <li key={post.id}>
                <button
                  className={activeView === post.id ? styles.active : ''}
                  onClick={() => setView(post.id)}
                  // MODIFIED: Disable navigation when not authenticated
                  disabled={!isAuthenticated}
                >
                  {post.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={styles.authSection}>
        <label htmlFor="authKey" className={styles.authLabel}>
          Authorization Key
        </label>
        {isAuthenticated ? (
          // MODIFIED: Show a logout button if authenticated
          <button onClick={logout} className={styles.authButton}>
            Logout
          </button>
        ) : (
          // MODIFIED: Show the input and a new button if not authenticated
          <>
            <input
              id="authKey"
              type="password"
              className={styles.authInput}
              placeholder="Enter secret key..."
              value={localAuthKey}
              onChange={(e) => setLocalAuthKey(e.target.value)}
              onKeyPress={handleKeyPress} // Allow pressing Enter
              disabled={loading} // Disable while authenticating
            />
            <button onClick={handleAuth} className={styles.authButton} disabled={loading}>
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
