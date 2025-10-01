/*
 * ==========================================================
 * COMPONENT: Desktop Navigation
 * PAGE: (Shared)
 * FILE: /components/Navigation/DesktopNav.js
 * ==========================================================
 */
'use client';

import styles from './DesktopNav.module.css';
import { CreateIcon, ScheduleIcon, AssetIcon, SettingsIcon, LiveMatchIcon } from './Icons'; // MODIFIED: Import LiveMatchIcon

// Define the main navigation items
const navItems = [
    { id: 'create', label: 'Create Post', icon: <CreateIcon /> },
    { id: 'schedule', label: 'Schedule', icon: <ScheduleIcon /> },
    { id: 'live', label: 'Live', icon: <LiveMatchIcon /> }, // MODIFIED: Updated ID, label, and icon
    { id: 'assets', label: 'Assets', icon: <AssetIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

export default function DesktopNav({ activeView, setView }) {
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
        </aside>
    );
}
