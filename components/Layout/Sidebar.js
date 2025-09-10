'use client';

import styles from './Sidebar.module.css';
import { useAppContext } from '../../app/context/AppContext';

export default function Sidebar({ activeView, setView }) {
  const { 
    authKey, 
    setAuthKey, 
    authorizeAndFetchData, 
    loading, 
    error, 
    authStatus 
  } = useAppContext();

  const postTypes = [
    { id: 'squad', label: 'Squad Announcement' },
    { id: 'matchDay', label: 'Match Day Announcement' },
    { id: 'result', label: 'Full-Time Result' },
  ];
  
  const handleAuthorize = () => {
    authorizeAndFetchData(authKey);
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
        <div className={styles.authInputContainer}>
          <input
            id="authKey"
            type="password"
            className={styles.authInput}
            placeholder="Enter key to load data..."
            value={authKey}
            onChange={(e) => setAuthKey(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAuthorize()}
          />
          {/* NEW: The dedicated Authorize button */}
          <button 
            onClick={handleAuthorize} 
            className={styles.authButton}
            disabled={loading}
          >
            {loading ? '...' : 'Go'}
          </button>
        </div>
        
        {/* NEW: Clear feedback area */}
        <div className={styles.authStatus}>
          {authStatus === 'success' && (
            <p className={styles.successText}>✓ Authorized. Data loaded.</p>
          )}
          {authStatus === 'error' && (
            <p className={styles.errorText}>{error}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
