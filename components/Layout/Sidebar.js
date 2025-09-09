'use client';
import styles from './Sidebar.module.css';

// The Sidebar now receives the authKey and a function to update it from the parent
export default function Sidebar({ activeView, setView, authKey, setAuthKey }) {
  const postTypes = [
    { id: 'squad', label: 'Squad Announcement' },
    { id: 'result', label: 'Match Result' },
    { id: 'preview', label: 'Match Preview' },
    { id: 'signing', label: 'New Player Signing' },
    { id: 'generic', label: 'Generic Post' },
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

      {/* NEW: Permanent Authorization Section at the bottom */}
      <div className={styles.authSection}>
        <label htmlFor="authKey" className={styles.authLabel}>
          Authorization Key
        </label>
        <input
          id="authKey"
          type="password"
          className={styles.authInput}
          placeholder="Enter secret key..."
          value={authKey}
          onChange={(e) => setAuthKey(e.target.value)}
        />
      </div>
    </aside>
  );
}
