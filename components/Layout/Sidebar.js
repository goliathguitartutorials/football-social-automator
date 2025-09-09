'use client';
import styles from './Sidebar.module.css';

// We pass `activeView` and `setView` to control which form is shown
export default function Sidebar({ activeView, setView }) {
  // Array of our post types for easy mapping
  const postTypes = [
    { id: 'squad', label: 'Squad Announcement' },
    { id: 'result', label: 'Match Result' },
    { id: 'preview', label: 'Match Preview' },
    { id: 'signing', label: 'New Player Signing' },
    { id: 'generic', label: 'Generic Post' },
  ];

  return (
    <aside className={styles.sidebar}>
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
    </aside>
  );
}
