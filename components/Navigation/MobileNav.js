/*
 * ==========================================================
 * COMPONENT: Mobile Navigation
 * PAGE: (Shared)
 * FILE: /components/Navigation/MobileNav.js
 * ==========================================================
 */
'use client';

import styles from './MobileNav.module.css';
import { CreateIcon, ScheduleIcon, AssetIcon, SettingsIcon, LiveMatchIcon } from './Icons'; // MODIFIED: Import LiveMatchIcon

const navItems = [
    { id: 'create', label: 'Create', icon: <CreateIcon /> },
    { id: 'schedule', label: 'Schedule', icon: <ScheduleIcon /> },
    { id: 'live', label: 'Live', icon: <LiveMatchIcon /> }, // MODIFIED: Updated ID, label, and icon
    { id: 'assets', label: 'Assets', icon: <AssetIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

export default function MobileNav({ activeView, setView }) {
    return (
        <nav className={styles.mobileNav}>
            {navItems.map((item) => (
                <button
                    key={item.id}
                    className={`${styles.navButton} ${activeView === item.id ? styles.active : ''}`}
                    onClick={() => setView(item.id)}
                >
                    <span className={styles.icon}>{item.icon}</span>
                    <span className={styles.label}>{item.label}</span>
                </button>
            ))}
        </nav>
    );
}
