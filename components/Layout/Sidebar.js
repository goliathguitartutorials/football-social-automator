'use client';

import styles from './Sidebar.module.css';
import { useAppContext } from '../../app/context/AppContext';

export default function Sidebar({ activeView, setView }) {
  const { authKey, setAuthKey, error } = useAppContext(); // Get what we need from context

  const postTypes = [
    { id: 'squad', label: 'Squad Announcement' },
    { id: 'matchDay', label: 'Match Day Announcement' },
    { id: 'result', label: 'Full-Time Result' },
  ];

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
        <input
          id="authKey"
          type="password"
          className={styles.authInput}
          placeholder="Enter key to load data..."
          value={authKey}
          onChange={(e) => setAuthKey(e.target.value)}
        />
        {/* We can display a subtle error from the context here if data fails to load */}
        {error && <p className={styles.authError}>{error}</p>}
      </div>
    </aside>
  );
}
