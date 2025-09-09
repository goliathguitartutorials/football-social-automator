'use client';
import styles from './Navigation.module.css';

// The navigation component receives the currently active tab and a function to call when a new tab is clicked
export default function Navigation({ activeTab, setActiveTab }) {
  return (
    <nav className={styles.nav}>
      <button
        className={activeTab === 'squad' ? styles.active : ''}
        onClick={() => setActiveTab('squad')}
      >
        Squad Announcement
      </button>
      <button
        className={activeTab === 'result' ? styles.active : ''}
        onClick={() => setActiveTab('result')}
      >
        Match Result
      </button>
      {/* Add more buttons here for future post types */}
    </nav>
  );
}
