/*
 * =================================================================
 * COMPONENT: Desktop Navigation
 * PAGE: (Shared)
 * FILE: /components/Navigation/DesktopNav.js
 * =================================================================
 */
'use client';

import styles from './DesktopNav.module.css';
import { useAppContext } from '../../app/context/AppContext';
import { CreateIcon, ScheduleIcon, LiveMatchIcon, SettingsIcon } from './Icons';

// Define the main navigation items
const navItems = [
  { id: 'create', label: 'Create Post', icon: <CreateIcon /> },
  { id: 'schedule', label: 'Schedule', icon: <ScheduleIcon /> },
  { id: 'live', label: 'Live Match', icon: <LiveMatchIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

export default function DesktopNav({ activeView, setView }) {
  const {
    authKey,
    setAuthKey,
    authorizeAndFetchData,
    loading,
    error,
    authStatus
  } = useAppContext();
  
  const handleAuthorize = () => {
    authorizeAndFetchData(authKey);
  };

  return (
    <aside className={styles.desktopNav}>
      <div>
        <h1 className={styles.logo}>Glannau Automator</h1>
        <nav className={styles.nav}>
          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  className={activeView === item.id ? styles.active : ''}
                  onClick={() => setView(item.id)}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  {item.label}
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
          <button
            onClick={handleAuthorize}
            className={styles.authButton}
            disabled={loading}
          >
            {loading ? '...' : 'Go'}
          </button>
        </div>
        
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
