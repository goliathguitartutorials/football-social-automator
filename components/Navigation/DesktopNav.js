/*
 * =================================================================
 * COMPONENT: Desktop Navigation
 * PAGE: (Shared)
 * FILE: /components/Navigation/DesktopNav.js
 * =================================================================
 */
'use client';

import styles from './DesktopNav.module.css';
import { CreateIcon, ScheduleIcon, LiveMatchIcon, SettingsIcon } from './Icons';

// Define the main navigation items
const navItems = [
  { id: 'create', label: 'Create Post', icon: <CreateIcon /> },
  { id: 'schedule', label: 'Schedule', icon: <ScheduleIcon /> },
  { id: 'live', label: 'Live Match', icon: <LiveMatchIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

export default function DesktopNav({ activeView, setView }) {
  // Authorization logic has been moved to the Settings page
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
      {/* The entire auth section has been removed from here */}
    </aside>
  );
}
